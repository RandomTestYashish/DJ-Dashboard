import { motion, useReducedMotion, type Transition } from 'framer-motion'
import { TONEARM_TIMING, type TonearmState } from '../lib/useTonearmState'

type Props = {
  /** Where the arm is in its lift/return cycle. */
  state: TonearmState
  /** Diameter of the turntable housing in px. */
  size: number
}

/** Parked out to the right, clear of the platter. */
const PARKED = { rotate: 18, x: 12, y: -4 }
const OVER_RECORD = { rotate: 0, x: 0, y: 0 }

const target = (state: TonearmState) =>
  state === 'playing' || state === 'returning' ? OVER_RECORD : PARKED

/**
 * The arm swings out of the way the moment the record leaves the platter, and
 * comes back down after it. Going out is a plain ease — a cue getting out of
 * the way. Coming back is a spring damped to overshoot by roughly two degrees,
 * so it settles onto the record instead of clicking into place.
 */
function transitionFor(state: TonearmState, reduced: boolean): Transition {
  if (reduced) return { duration: 0.001 }
  if (state === 'lifting') {
    return { duration: TONEARM_TIMING.lifting / 1000, ease: 'easeOut' }
  }
  if (state === 'returning') {
    return {
      type: 'spring',
      stiffness: 120,
      damping: 12,
      mass: 1,
      delay: TONEARM_TIMING.returnDelay / 1000,
    }
  }
  // `resting` and `playing` are where the moving states already left the arm,
  // so these never actually travel.
  return { duration: 0.2, ease: 'easeOut' }
}

/**
 * A pared-back tonearm hinged at the top right of the housing.
 *
 * The SVG spans the whole housing on a 100×100 viewBox, so every coordinate
 * below is a percentage of the turntable and the arm scales with it exactly.
 * The needle is meant to sit out near the first groove, never over the label.
 */
export function Tonearm({ state, size }: Props) {
  const reduced = useReducedMotion() ?? false

  return (
    <div className="pointer-events-none absolute inset-0" style={{ zIndex: 25 }} aria-hidden="true">
      <motion.svg
        viewBox="0 0 100 100"
        fill="none"
        className="h-full w-full overflow-visible"
        style={{
          originX: '0.865',
          originY: '0.135',
          filter: `drop-shadow(0 ${size * 0.004}px ${size * 0.012}px rgba(0,0,0,0.16))`,
        }}
        initial={false}
        animate={target(state)}
        transition={transitionFor(state, reduced)}
      >
        <defs>
          <linearGradient id="arm-tube" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#FCFCFB" />
            <stop offset="48%" stopColor="#E1E1DC" />
            <stop offset="100%" stopColor="#BFBFB8" />
          </linearGradient>
          <linearGradient id="arm-pivot" x1="0.2" y1="0" x2="0.9" y2="1">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="55%" stopColor="#E6E6E1" />
            <stop offset="100%" stopColor="#C4C4BD" />
          </linearGradient>
        </defs>

        {/* Counterweight, carried on the stub of tube behind the pivot and so
            aligned to the same 135° axis as the arm itself. */}
        <path d="M86.5 13.5 90.2 9.8" stroke="url(#arm-tube)" strokeWidth="1" strokeLinecap="round" />
        <rect
          x="88.4"
          y="7.1"
          width="4.8"
          height="2.8"
          rx="1.4"
          fill="url(#arm-tube)"
          stroke="rgba(0,0,0,0.09)"
          strokeWidth="0.3"
          transform="rotate(-45 90.8 8.5)"
        />

        {/* the arm tube, reaching down-left to the record's outer groove */}
        <path
          d="M85.7 14.3 69.5 30.4"
          stroke="url(#arm-tube)"
          strokeWidth="1.25"
          strokeLinecap="round"
        />
        <path
          d="M85.4 13.7 69.2 29.8"
          stroke="rgba(255,255,255,0.85)"
          strokeWidth="0.35"
          strokeLinecap="round"
        />

        {/* headshell and stylus, square to the groove it rides */}
        <g transform="rotate(-45 68.6 31.4)">
          <rect
            x="65.2"
            y="29.9"
            width="6.6"
            height="3"
            rx="1.2"
            fill="url(#arm-pivot)"
            stroke="rgba(0,0,0,0.11)"
            strokeWidth="0.3"
          />
          <path d="M67.5 32.9 68.2 34.8" stroke="#96968F" strokeWidth="0.6" strokeLinecap="round" />
        </g>

        {/* pivot housing */}
        <circle
          cx="86.5"
          cy="13.5"
          r="2.5"
          fill="url(#arm-pivot)"
          stroke="rgba(0,0,0,0.09)"
          strokeWidth="0.3"
        />
        <circle cx="86.5" cy="13.5" r="0.85" fill="#D2D2CC" />
        <circle cx="85.8" cy="12.8" r="0.42" fill="rgba(255,255,255,0.95)" />
      </motion.svg>
    </div>
  )
}
