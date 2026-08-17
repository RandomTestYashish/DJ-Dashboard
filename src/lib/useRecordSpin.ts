import { useAnimationFrame, useMotionValue } from 'framer-motion'
import { useRef } from 'react'
import { BOOST_DECAY, BOOST_SPEED, CRUISE_SPEED, SPINDOWN_DECAY } from './motion'

/**
 * Drives a record's rotation as a continuously integrated angle rather than a
 * looping keyframe. Because the angle is never reset, changing speed mid-spin
 * — the kick a record gets the instant it lands on the platter — reads as the
 * platter catching up, with no visible seam or snap back to zero.
 *
 * @param spinning whether the platter is turning at all
 * @param boostKey change this to kick the record up to speed; each new value
 *                 triggers one acceleration that decays back to cruising
 * @param enabled false when the visitor prefers reduced motion
 */
export function useRecordSpin(spinning: boolean, boostKey: string | null, enabled: boolean) {
  const rotation = useMotionValue(0)
  const speed = useRef(0)
  const lastBoost = useRef<string | null>(null)

  // Apply the kick synchronously on the render that changes the record, so the
  // first animation frame after the swap is already at speed.
  if (boostKey !== lastBoost.current) {
    lastBoost.current = boostKey
    if (boostKey && enabled) speed.current = BOOST_SPEED
  }

  useAnimationFrame((_, delta) => {
    if (!enabled) return
    const dt = Math.min(delta, 64) / 1000 // clamp tab-switch jumps
    const target = spinning ? CRUISE_SPEED : 0

    // Exponential approach to the target speed: fast at first, then gentle.
    // Spinning down is the quicker of the two — a record lifted off the
    // platter should coast to a stop in a beat, not wind down like it is
    // still under power.
    const tau = spinning ? BOOST_DECAY : SPINDOWN_DECAY
    speed.current += (target - speed.current) * (1 - Math.exp(-dt / tau))

    if (speed.current > 0.05) {
      rotation.set((rotation.get() + speed.current * dt) % 360)
    }
  })

  return rotation
}
