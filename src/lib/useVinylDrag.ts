import { animate, useAnimationFrame, useMotionValue, useTransform } from 'framer-motion'
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from 'react'

/** Whether the record is seated on the platter or lifted off it. */
export type VinylPositionState = 'inside' | 'outside'

type Options = {
  /**
   * How far the record's centre may stray from the spindle and still count as
   * seated. The test is on the centre alone — a record half hanging off the
   * platter is off it, however much of the disc still overlaps.
   */
  playableRadius: number
  /** Record diameter, used to keep it inside the stage while dragging. */
  recordSize: number
  /** Where Enter/Space parks the record when lifting it off. */
  outOffset: { x: number; y: number }
  /** The area the record may be dragged within. */
  stage: React.RefObject<HTMLElement | null>
  /** False when there is no record on the platter to pick up. */
  enabled: boolean
  reduced: boolean
}

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v))

/**
 * Pointer-driven physics for lifting the record off the platter.
 *
 * Built on pointer events rather than HTML drag-and-drop so one code path
 * covers mouse, trackpad, pen and touch, and so the record follows the pointer
 * exactly instead of waiting on the browser's drag image.
 *
 * The record's offset is stored relative to the spindle, which makes the
 * seated test pure arithmetic — `hypot(x, y) <= playableRadius` — with no DOM
 * measurement on the move path.
 */
export function useVinylDrag({
  playableRadius,
  recordSize,
  outOffset,
  stage,
  enabled,
  reduced,
}: Options) {
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const rotate = useMotionValue(0)
  const scale = useMotionValue(1)
  /** The few px the record rises when pressed, kept apart from the drag offset. */
  const lift = useMotionValue(0)

  const translateY = useTransform(() => y.get() + lift.get())

  const [position, setPosition] = useState<VinylPositionState>('inside')
  const [dragging, setDragging] = useState(false)

  const pointerId = useRef<number | null>(null)
  const draggingRef = useRef(false)
  const origin = useRef({ px: 0, py: 0, x: 0, y: 0 })
  const bounds = useRef({ minX: -Infinity, maxX: Infinity, minY: -Infinity, maxY: Infinity })
  const last = useRef({ px: 0, t: 0 })
  /** Rotation the current flick is asking for; decays once the pointer stills. */
  const spin = useRef(0)

  /** Everything that has to be undone to end a drag, whatever ends it. */
  const teardown = useRef<(() => void) | null>(null)

  /**
   * How strongly to hint that the record can go back. Zero while seated, then
   * rising as the record is carried back toward the spindle.
   */
  const dropHint = useTransform(() => {
    const distance = Math.hypot(x.get(), y.get())
    if (distance <= playableRadius) return 0
    const nearness = Math.max(0, 1 - (distance - playableRadius) / (playableRadius * 1.1))
    return 0.45 + 0.55 * nearness
  })

  const seat = useCallback(
    (immediate: boolean) => {
      setPosition('inside')
      if (immediate) {
        x.set(0)
        y.set(0)
        lift.set(0)
        rotate.set(0)
        scale.set(1)
        return
      }
      const spring = { type: 'spring' as const, stiffness: 300, damping: 24 }
      animate(x, 0, spring)
      animate(y, 0, spring)
      animate(lift, 0, { duration: 0.25 })
      animate(rotate, 0, { duration: 0.4, ease: [0.22, 1, 0.36, 1] })
      // a small settle as the record beds down on the platter
      animate(scale, [1.03, 0.98, 1], { duration: 0.5, times: [0, 0.45, 1] })
    },
    [x, y, lift, rotate, scale],
  )

  const applyMove = useCallback(
    (clientX: number, clientY: number) => {
      const b = bounds.current
      const nx = clamp(origin.current.x + (clientX - origin.current.px), b.minX, b.maxX)
      const ny = clamp(origin.current.y + (clientY - origin.current.py), b.minY, b.maxY)
      x.set(nx)
      y.set(ny)

      if (!reduced) {
        const now = performance.now()
        const dt = now - last.current.t
        if (dt > 0) {
          const vx = (clientX - last.current.px) / dt // px per ms
          spin.current = clamp(vx * 5, -8, 8)
        }
        last.current = { px: clientX, t: now }
      }

      setPosition(Math.hypot(nx, ny) <= playableRadius ? 'inside' : 'outside')
    },
    [playableRadius, reduced, x, y],
  )

  /**
   * Ends the drag from wherever it is called — the record's own pointerup, or
   * the window-level safety net. Teardown runs unconditionally, so no path can
   * leave the record stuck to the pointer.
   */
  const finish = useCallback(
    (id: number) => {
      if (id !== pointerId.current) return

      teardown.current?.()
      teardown.current = null
      pointerId.current = null
      draggingRef.current = false
      setDragging(false)

      if (Math.hypot(x.get(), y.get()) <= playableRadius) {
        seat(reduced)
      } else {
        // Left off the platter: it stays where it was put, tilted as it was
        // carried, so it can be picked back up.
        setPosition('outside')
        animate(lift, 0, { duration: 0.2 })
        if (!reduced) animate(scale, 1.02, { duration: 0.2 })
      }
    },
    [playableRadius, reduced, seat, x, y, lift, scale],
  )

  // The window listeners are installed inside onPointerDown but must call the
  // current finish/applyMove, so they go through refs.
  const finishRef = useRef(finish)
  const moveRef = useRef(applyMove)
  finishRef.current = finish
  moveRef.current = applyMove

  const onPointerDown = useCallback(
    (event: ReactPointerEvent<HTMLElement>) => {
      if (!enabled || pointerId.current !== null) return

      const el = event.currentTarget

      // Capture keeps the moves coming when the pointer outruns the record. It
      // can refuse — a pointer already released, a synthesised event — and that
      // must not abort the drag, so window listeners stand in when it does.
      let hasCapture = false
      try {
        el.setPointerCapture(event.pointerId)
        hasCapture = true
      } catch {
        hasCapture = false
      }

      pointerId.current = event.pointerId
      draggingRef.current = true
      setDragging(true)

      const onRelease = (e: PointerEvent) => finishRef.current(e.pointerId)
      const onMove = (e: PointerEvent) => {
        if (e.pointerId === pointerId.current) moveRef.current(e.clientX, e.clientY)
      }
      window.addEventListener('pointerup', onRelease)
      window.addEventListener('pointercancel', onRelease)
      // Without capture the element stops hearing moves the moment the pointer
      // leaves it, so the window has to supply them instead.
      if (!hasCapture) window.addEventListener('pointermove', onMove)

      teardown.current = () => {
        try {
          if (hasCapture && el.hasPointerCapture(event.pointerId)) {
            el.releasePointerCapture(event.pointerId)
          }
        } catch {
          // Capture was already lost; nothing to release.
        }
        window.removeEventListener('pointerup', onRelease)
        window.removeEventListener('pointercancel', onRelease)
        window.removeEventListener('pointermove', onMove)
      }

      origin.current = { px: event.clientX, py: event.clientY, x: x.get(), y: y.get() }
      last.current = { px: event.clientX, t: performance.now() }
      spin.current = 0

      // Keep the record within the stage. Its rest centre is wherever it sits
      // now, minus the offset already applied.
      const box = el.getBoundingClientRect()
      const area = stage.current?.getBoundingClientRect()
      if (area) {
        const restX = box.left + box.width / 2 - x.get()
        const restY = box.top + box.height / 2 - y.get()
        const r = recordSize / 2
        bounds.current = {
          minX: area.left + 4 + r - restX,
          maxX: area.right - 4 - r - restX,
          minY: area.top + 4 + r - restY,
          maxY: area.bottom - 4 - r - restY,
        }
      }

      if (!reduced) {
        animate(scale, 0.96, { duration: 0.08 }).then(() => {
          if (draggingRef.current) animate(scale, 1.02, { duration: 0.16 })
        })
        animate(lift, -4, { duration: 0.12 })
      }
    },
    [enabled, reduced, recordSize, stage, x, y, scale, lift],
  )

  const onPointerMove = useCallback(
    (event: ReactPointerEvent<HTMLElement>) => {
      if (!draggingRef.current || event.pointerId !== pointerId.current) return
      applyMove(event.clientX, event.clientY)
    },
    [applyMove],
  )

  const endDrag = useCallback(
    (event: ReactPointerEvent<HTMLElement>) => finish(event.pointerId),
    [finish],
  )

  /** Enter/Space alternative, so the record is not drag-only. */
  const toggle = useCallback(() => {
    if (!enabled) return
    if (position === 'inside') {
      setPosition('outside')
      if (reduced) {
        x.set(outOffset.x)
        y.set(outOffset.y)
        return
      }
      const spring = { type: 'spring' as const, stiffness: 260, damping: 26 }
      animate(x, outOffset.x, spring)
      animate(y, outOffset.y, spring)
      animate(scale, 1.02, { duration: 0.25 })
      animate(rotate, -4, { duration: 0.35, ease: [0.22, 1, 0.36, 1] })
    } else {
      seat(reduced)
    }
  }, [enabled, position, reduced, outOffset, seat, x, y, scale, rotate])

  /** Puts the record back without animation, for when the mood changes. */
  const reset = useCallback(() => {
    x.stop()
    y.stop()
    rotate.stop()
    scale.stop()
    lift.stop()
    x.set(0)
    y.set(0)
    rotate.set(0)
    scale.set(1)
    lift.set(0)
    setPosition('inside')
  }, [x, y, rotate, scale, lift])

  // Eases the tilt toward what the current flick asks for, and bleeds that
  // request away once the pointer stops, so a held-still record hangs level.
  useAnimationFrame((_, delta) => {
    if (!draggingRef.current || reduced) return
    const dt = Math.min(delta, 64) / 1000
    spin.current *= Math.exp(-dt / 0.12)
    const current = rotate.get()
    rotate.set(current + (spin.current - current) * (1 - Math.exp(-dt / 0.06)))
  })

  // Never leave listeners behind if the record unmounts mid-drag.
  useEffect(() => () => teardown.current?.(), [])

  return {
    x,
    y: translateY,
    rotate,
    scale,
    position,
    dragging,
    dropHint,
    reset,
    toggle,
    handlers: {
      onPointerDown,
      onPointerMove,
      onPointerUp: endDrag,
      onPointerCancel: endDrag,
    },
  }
}
