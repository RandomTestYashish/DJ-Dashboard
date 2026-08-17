import { useEffect, useState } from 'react'

export type TonearmState = 'playing' | 'lifting' | 'resting' | 'returning'

/**
 * How long the arm spends in each moving state before it counts as arrived.
 * `returning` includes the beat it waits while the record settles back onto
 * the platter, so the arm follows the record rather than racing it.
 */
export const TONEARM_TIMING = {
  lifting: 420,
  returnDelay: 250,
  returning: 620,
} as const

/**
 * Tracks the arm as an explicit state rather than leaving it to whatever CSS
 * happens to win. Modelling it this way is what makes a fast in-out-in flick
 * behave: the pending transition is cleared on every change, so only one is
 * ever queued and the arm always heads for the record's latest position.
 *
 * @param seated whether a record is currently on the platter
 */
export function useTonearmState(seated: boolean, reduced: boolean): TonearmState {
  const [state, setState] = useState<TonearmState>(seated ? 'playing' : 'resting')

  useEffect(() => {
    setState((current) => {
      if (seated) return current === 'playing' ? current : 'returning'
      return current === 'resting' ? current : 'lifting'
    })
  }, [seated])

  useEffect(() => {
    if (state !== 'lifting' && state !== 'returning') return

    const settled = state === 'lifting' ? 'resting' : 'playing'
    const ms = reduced
      ? 0
      : state === 'lifting'
        ? TONEARM_TIMING.lifting
        : TONEARM_TIMING.returnDelay + TONEARM_TIMING.returning

    const timer = setTimeout(() => setState(settled), ms)
    // Cancels the in-flight transition whenever the record moves again.
    return () => clearTimeout(timer)
  }, [state, reduced])

  return state
}
