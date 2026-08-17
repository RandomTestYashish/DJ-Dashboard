import { useCallback, useLayoutEffect, useRef, useState } from 'react'

export type Point = { x: number; y: number }

export type StageGeometry = {
  /** Centre of each collection socket, keyed by mood id, in stage coordinates. */
  slots: Record<string, Point>
  /** Centre and radius of the platter, in stage coordinates. */
  platter: { x: number; y: number; r: number }
}

const EMPTY: StageGeometry = { slots: {}, platter: { x: 0, y: 0, r: 0 } }

/**
 * Measures where the records can live — every socket in the collection, and
 * the platter itself — as points relative to the stage.
 *
 * Records are positioned from these numbers rather than from their place in
 * the DOM, which is what lets one record move between the collection, the
 * player and the table without ever changing parent. Everything is measured
 * off the stage, so the whole set stays consistent when the layout reflows.
 */
export function useStageGeometry(
  stage: React.RefObject<HTMLElement | null>,
  platter: React.RefObject<HTMLElement | null>,
) {
  const slotRefs = useRef(new Map<string, HTMLElement>())
  const [geometry, setGeometry] = useState<StageGeometry>(EMPTY)

  const registerSlot = useCallback((id: string, el: HTMLElement | null) => {
    if (el) slotRefs.current.set(id, el)
    else slotRefs.current.delete(id)
  }, [])

  const measure = useCallback(() => {
    const stageBox = stage.current?.getBoundingClientRect()
    const platterBox = platter.current?.getBoundingClientRect()
    if (!stageBox || !platterBox) return

    const slots: Record<string, Point> = {}
    for (const [id, el] of slotRefs.current) {
      const box = el.getBoundingClientRect()
      slots[id] = {
        x: box.left + box.width / 2 - stageBox.left,
        y: box.top + box.height / 2 - stageBox.top,
      }
    }

    setGeometry({
      slots,
      platter: {
        x: platterBox.left + platterBox.width / 2 - stageBox.left,
        y: platterBox.top + platterBox.height / 2 - stageBox.top,
        r: platterBox.width / 2,
      },
    })
  }, [stage, platter])

  useLayoutEffect(() => {
    measure()

    const observer = new ResizeObserver(measure)
    if (stage.current) observer.observe(stage.current)
    if (platter.current) observer.observe(platter.current)
    for (const el of slotRefs.current.values()) observer.observe(el)

    window.addEventListener('resize', measure)
    return () => {
      observer.disconnect()
      window.removeEventListener('resize', measure)
    }
  }, [measure, stage, platter])

  return { geometry, registerSlot, remeasure: measure }
}
