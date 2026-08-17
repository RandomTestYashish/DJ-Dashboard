import { animate } from 'framer-motion'
import { useCallback, useEffect, useRef, useState } from 'react'
import type { Mood } from '../data/moods'
import type { Point, StageGeometry } from './useStageGeometry'
import type { VinylMotion } from './vinylMotion'

/** Where a record currently is. At most one record may hold `platter`. */
export type Placement =
  | { kind: 'collection' }
  | { kind: 'platter' }
  /** Set down somewhere on the table; stays where it was left. */
  | { kind: 'loose'; at: Point }

type Options = {
  moods: Mood[]
  geometry: StageGeometry
  /** Full-size record diameter, used to keep records on the table. */
  recordSize: number
  motionFor: (id: string) => VinylMotion
  reduced: boolean
  onDrop?: (mood: Mood) => void
  onPickUp?: (mood: Mood) => void
}

/** Beyond this the platter exerts no pull at all. */
const MAGNET_OUTER = 80
/** Inside this the pull is at its strongest. */
const MAGNET_INNER = 40
/** How far a record rides above the table while carried. */
const LIFT = 5

/**
 * How strongly the platter draws a record toward its centre. Deliberately a
 * fraction rather than a snap — the record is nudged toward the spindle but
 * never taken off the pointer, so it can always be pulled back away.
 */
export function magnetPull(distance: number) {
  if (distance >= MAGNET_OUTER) return 0
  if (distance > MAGNET_INNER) {
    return 0.25 * ((MAGNET_OUTER - distance) / (MAGNET_OUTER - MAGNET_INNER))
  }
  return 0.25 + 0.45 * ((MAGNET_INNER - distance) / MAGNET_INNER)
}

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v))

/**
 * Owns which record is where, and the pointer interaction that moves them.
 *
 * One rule drives the whole interface: a record is on the platter, in its
 * sleeve, or loose on the table. Position follows from that placement rather
 * than from the DOM, so a record never changes parent as it moves and nothing
 * can reparent mid-drag and drop the pointer.
 */
export function useVinylStage({
  moods,
  geometry,
  recordSize,
  motionFor,
  reduced,
  onDrop,
  onPickUp,
}: Options) {
  const [placements, setPlacements] = useState<Record<string, Placement>>(() =>
    Object.fromEntries(moods.map((m) => [m.id, { kind: 'collection' } as Placement])),
  )
  const [draggedVinyl, setDraggedVinyl] = useState<Mood | null>(null)
  const [isOverPlatter, setIsOverPlatter] = useState(false)

  const dragged = useRef<{ mood: Mood; pointerId: number } | null>(null)
  const at = useRef<Point>({ x: 0, y: 0 })
  const teardown = useRef<(() => void) | null>(null)

  const isDragging = draggedVinyl !== null

  // A record in hand is not on the platter, however its placement still reads.
  const occupant = moods.find((m) => placements[m.id]?.kind === 'platter') ?? null
  const activeVinyl = occupant && occupant.id !== draggedVinyl?.id ? occupant : null

  /** Where a record belongs when nobody is holding it. */
  const restingPoint = useCallback(
    (id: string): Point => {
      const placement = placements[id]
      if (placement?.kind === 'platter') return { x: geometry.platter.x, y: geometry.platter.y }
      if (placement?.kind === 'loose') return placement.at
      return geometry.slots[id] ?? { x: 0, y: 0 }
    },
    [placements, geometry],
  )

  /**
   * The point a carried record is drawn at: the pointer, pulled toward the
   * spindle by however much the magnet asks for.
   */
  const carriedPoint = useCallback(
    (raw: Point) => {
      const { platter } = geometry
      const distance = Math.hypot(raw.x - platter.x, raw.y - platter.y)
      const pull = magnetPull(distance)
      return {
        point: {
          x: raw.x + (platter.x - raw.x) * pull,
          y: raw.y + (platter.y - raw.y) * pull,
        },
        // The drop zone is the platter alone — not the whole player — and it is
        // the record's centre that has to be over it.
        over: distance <= platter.r,
      }
    },
    [geometry],
  )

  const finish = useCallback(
    (pointerId: number) => {
      const current = dragged.current
      if (!current || current.pointerId !== pointerId) return

      teardown.current?.()
      teardown.current = null
      dragged.current = null

      const { point, over } = carriedPoint(at.current)

      setPlacements((prev) => {
        const next = { ...prev }
        if (over) {
          // Only one record fits, so whatever is on the platter goes back to
          // its sleeve to make room.
          for (const [id, placement] of Object.entries(prev)) {
            if (placement.kind === 'platter' && id !== current.mood.id) {
              next[id] = { kind: 'collection' }
            }
          }
          next[current.mood.id] = { kind: 'platter' }
        } else {
          next[current.mood.id] = { kind: 'loose', at: point }
        }
        return next
      })

      setDraggedVinyl(null)
      setIsOverPlatter(false)
      if (over) onDrop?.(current.mood)
    },
    [carriedPoint, onDrop],
  )

  const finishRef = useRef(finish)
  const carriedRef = useRef(carriedPoint)
  finishRef.current = finish
  carriedRef.current = carriedPoint

  const beginDrag = useCallback(
    (mood: Mood, event: React.PointerEvent<HTMLElement>, stage: HTMLElement | null) => {
      if (dragged.current) return
      const stageBox = stage?.getBoundingClientRect()
      if (!stageBox) return

      const el = event.currentTarget
      let hasCapture = false
      try {
        el.setPointerCapture(event.pointerId)
        hasCapture = true
      } catch {
        hasCapture = false
      }

      const box = el.getBoundingClientRect()
      const centre = {
        x: box.left + box.width / 2 - stageBox.left,
        y: box.top + box.height / 2 - stageBox.top,
      }
      // Hold the record where it was grabbed rather than snapping its centre
      // under the pointer.
      const grab = {
        x: event.clientX - stageBox.left - centre.x,
        y: event.clientY - stageBox.top - centre.y,
      }

      at.current = centre
      dragged.current = { mood, pointerId: event.pointerId }
      setDraggedVinyl(mood)
      setIsOverPlatter(carriedPoint(centre).over)

      const values = motionFor(mood.id)
      const velocity = { x: centre.x, t: performance.now() }

      const track = (clientX: number, clientY: number) => {
        const half = recordSize / 2
        const raw = {
          x: clamp(clientX - stageBox.left - grab.x, half, stageBox.width - half),
          // A carried record rides a little above the table.
          y: clamp(clientY - stageBox.top - grab.y - LIFT, half, stageBox.height - half),
        }
        at.current = raw

        const { point, over } = carriedRef.current(raw)
        values.x.set(point.x)
        values.y.set(point.y)
        setIsOverPlatter(over)

        if (!reduced) {
          const now = performance.now()
          const dt = now - velocity.t
          if (dt > 0) {
            // A flick tips the record the way it is travelling.
            values.rotate.set(clamp(((point.x - velocity.x) / dt) * 5, -8, 8))
            velocity.x = point.x
            velocity.t = now
          }
        }
      }

      const onMove = (e: PointerEvent) => {
        if (e.pointerId === event.pointerId) track(e.clientX, e.clientY)
      }
      const onRelease = (e: PointerEvent) => finishRef.current(e.pointerId)

      // Capture is asked for but never relied on: if it is refused, these
      // supply the moves, and the release guard ends the drag wherever the
      // pointer comes up so a record can never stay stuck to the cursor.
      window.addEventListener('pointermove', onMove)
      window.addEventListener('pointerup', onRelease)
      window.addEventListener('pointercancel', onRelease)

      teardown.current = () => {
        try {
          if (hasCapture && el.hasPointerCapture(event.pointerId)) {
            el.releasePointerCapture(event.pointerId)
          }
        } catch {
          // capture already gone
        }
        window.removeEventListener('pointermove', onMove)
        window.removeEventListener('pointerup', onRelease)
        window.removeEventListener('pointercancel', onRelease)
      }

      if (!reduced) {
        // Comes up out of the sleeve to full size, the way a record you have
        // actually picked up would.
        animate(values.scale, 1.06, { type: 'spring', stiffness: 320, damping: 26, mass: 0.8 })
      } else {
        values.scale.set(1)
      }

      onPickUp?.(mood)
    },
    [carriedPoint, motionFor, onPickUp, recordSize, reduced],
  )

  /**
   * Keyboard equivalent, so the collection is never drag-only: put the record
   * on the player, or take it back to its sleeve.
   */
  const toggle = useCallback(
    (mood: Mood) => {
      const goingOn = placements[mood.id]?.kind !== 'platter'
      setPlacements((prev) => {
        const next = { ...prev }
        if (!goingOn) {
          next[mood.id] = { kind: 'collection' }
          return next
        }
        for (const [id, placement] of Object.entries(prev)) {
          if (placement.kind === 'platter') next[id] = { kind: 'collection' }
        }
        next[mood.id] = { kind: 'platter' }
        return next
      })
      if (goingOn) onDrop?.(mood)
    },
    [placements, onDrop],
  )

  useEffect(() => () => teardown.current?.(), [])

  return {
    placements,
    activeVinyl,
    draggedVinyl,
    isDragging,
    isOverPlatter,
    beginDrag,
    toggle,
    restingPoint,
  }
}
