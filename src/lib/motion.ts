import type { Transition, Variants } from 'framer-motion'

/** Centralised motion values so every component shares one vocabulary. */

/**
 * Ties a record's slot in the crate to its place on the platter. Because both
 * render under the same layout id, Framer treats them as one object and flies
 * it between the two rather than cross-fading a copy.
 */
export const recordLayoutId = (id: string) => `record-${id}`

export const EASE_OUT_QUINT = [0.22, 1, 0.36, 1] as const
export const EASE_SOFT = [0.32, 0.72, 0.24, 1] as const

/**
 * The flight of a record between its slot and the platter. Tuned to settle in
 * roughly 700ms with only a trace of overshoot — enough that the record feels
 * like it has weight, not so much that it visibly bounces.
 */
export const recordSwap: Transition = {
  type: 'spring',
  stiffness: 105,
  damping: 20,
  mass: 1.05,
}

/** Reduced-motion stand-in: the record simply appears where it belongs. */
export const recordSwapReduced: Transition = { duration: 0.001 }

/** Hover / press feedback on the mini records. */
export const tactile: Transition = { duration: 0.2, ease: EASE_OUT_QUINT }

/**
 * Mini-record shadows live here rather than as CSS variables because Framer
 * interpolates between these two strings on hover, and it cannot interpolate
 * through `var(...)`.
 */
export const MINI_SHADOW = '0 5px 15px rgba(0,0,0,0.12)'
export const MINI_SHADOW_LIFTED = '0 12px 26px rgba(0,0,0,0.18)'

/** `custom` is the bubble's index, which staggers it by ~180ms. */
export const bubbleVariants: Variants = {
  hidden: { opacity: 0, y: 8 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, ease: EASE_SOFT, delay: i * 0.18 },
  }),
}

/** Degrees per second at cruising speed — one turn every ~3.2s. */
export const CRUISE_SPEED = 360 / 3.2

/** Degrees per second the moment a fresh record lands. */
export const BOOST_SPEED = 900

/** How quickly the boost bleeds off into the cruise, in seconds. */
export const BOOST_DECAY = 0.55
