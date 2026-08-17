import { motionValue, type MotionValue } from 'framer-motion'
import { useCallback, useRef } from 'react'

export type VinylMotion = {
  /** Centre of the record, in stage coordinates. */
  x: MotionValue<number>
  y: MotionValue<number>
  scale: MotionValue<number>
  rotate: MotionValue<number>
}

/**
 * Keeps one set of motion values per record, owned outside the component tree.
 *
 * A record moves between paint layers — resting records sit under the tonearm,
 * the one in your hand rides above it — which means the component rendering it
 * unmounts and remounts. Holding the values here makes that invisible: the
 * record keeps its exact position and scale across the swap instead of
 * snapping back to wherever a fresh `useMotionValue` would start.
 */
export function useVinylMotion() {
  const store = useRef(new Map<string, VinylMotion>())

  return useCallback((id: string): VinylMotion => {
    let entry = store.current.get(id)
    if (!entry) {
      entry = {
        x: motionValue(0),
        y: motionValue(0),
        scale: motionValue(1),
        rotate: motionValue(0),
      }
      store.current.set(id, entry)
    }
    return entry
  }, [])
}
