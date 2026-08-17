import { motion, useReducedMotion, type Transition } from 'framer-motion'
import type { PlayerLayout } from '../lib/playerLayout'
import { TONEARM_TIMING, type TonearmState } from '../lib/useTonearmState'

type Props = {
  state: TonearmState
  layout: PlayerLayout
}

/** Swung off the record, to its rest at the right of the deck. */
const PARKED = { rotate: -36, x: 4, y: -3 }
const OVER_RECORD = { rotate: 0, x: 0, y: 0 }

const target = (state: TonearmState) =>
  state === 'playing' || state === 'returning' ? OVER_RECORD : PARKED

/**
 * Going out is a plain ease — a cue getting out of the way. Coming back is a
 * spring damped to overshoot by roughly two degrees, so the stylus settles
 * onto the record instead of clicking into place.
 */
function transitionFor(state: TonearmState, reduced: boolean): Transition {
  if (reduced) return { duration: 0.001 }
  if (state === 'lifting') return { duration: TONEARM_TIMING.lifting / 1000, ease: 'easeOut' }
  if (state === 'returning') {
    return {
      type: 'spring',
      stiffness: 120,
      damping: 12,
      mass: 1,
      delay: TONEARM_TIMING.returnDelay / 1000,
    }
  }
  return { duration: 0.2, ease: 'easeOut' }
}

/**
 * A machined copper tonearm pivoting at the right of the deck. Drawn in the
 * deck's own pixel space so the pivot, the arm and the headshell keep their
 * proportions at any player size.
 */
export function Tonearm({ state, layout }: Props) {
  const reduced = useReducedMotion() ?? false
  const { width, deckHeight, armBaseX, armBaseY, armTipX, armTipY, platterSize } = layout

  // Scale the hardware to the player so it never looks pasted on.
  const tube = Math.max(2, platterSize * 0.016)
  const pivot = Math.max(3.6, platterSize * 0.034)
  const plinth = Math.max(6, platterSize * 0.062)
  const head = Math.max(8, platterSize * 0.085)

  const angle = (Math.atan2(armTipY - armBaseY, armTipX - armBaseX) * 180) / Math.PI

  return (
    <motion.svg
      className="pointer-events-none absolute left-0 top-0 overflow-visible"
      width={width}
      height={deckHeight}
      viewBox={`0 0 ${width} ${deckHeight}`}
      fill="none"
      aria-hidden="true"
      style={{ originX: `${armBaseX}px`, originY: `${armBaseY}px`, zIndex: 20 }}
      initial={false}
      animate={target(state)}
      transition={transitionFor(state, reduced)}
    >
      <defs>
        <linearGradient id="copper" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#E3A071" />
          <stop offset="45%" stopColor="#B8623B" />
          <stop offset="100%" stopColor="#9D5431" />
        </linearGradient>
        <linearGradient id="copper-pivot" x1="0.2" y1="0" x2="0.9" y2="1">
          <stop offset="0%" stopColor="#F0BE97" />
          <stop offset="50%" stopColor="#C0703F" />
          <stop offset="100%" stopColor="#8C4526" />
        </linearGradient>
        <radialGradient id="plinth" cx="0.36" cy="0.3" r="0.75">
          <stop offset="0%" stopColor="#FBFAF7" />
          <stop offset="65%" stopColor="#EBEAE5" />
          <stop offset="100%" stopColor="#D6D5D0" />
        </radialGradient>
      </defs>

      <g
        style={{
          filter: `drop-shadow(0 ${platterSize * 0.012}px ${platterSize * 0.03}px rgba(0,0,0,0.30))`,
        }}
      >
        {/* The mounting plinth the arm turns on. Centred on the pivot, so the
            rotation leaves it looking bolted to the deck. */}
        <circle
          cx={armBaseX}
          cy={armBaseY}
          r={plinth}
          fill="url(#plinth)"
          stroke="rgba(0,0,0,0.10)"
          strokeWidth="0.8"
        />
        <circle
          cx={armBaseX}
          cy={armBaseY}
          r={plinth * 0.78}
          fill="none"
          stroke="rgba(0,0,0,0.07)"
          strokeWidth="0.8"
        />

        {/* counterweight, on the stub behind the pivot */}
        <g transform={`rotate(${angle} ${armBaseX} ${armBaseY})`}>
          <line
            x1={armBaseX}
            y1={armBaseY}
            x2={armBaseX + plinth * 1.5}
            y2={armBaseY}
            stroke="url(#copper)"
            strokeWidth={tube * 0.8}
            strokeLinecap="round"
          />
          <rect
            x={armBaseX + plinth * 1.15}
            y={armBaseY - tube * 1.5}
            width={tube * 3.2}
            height={tube * 3}
            rx={tube * 1.1}
            fill="url(#copper-pivot)"
          />
        </g>

        {/* the arm tube */}
        <line
          x1={armBaseX}
          y1={armBaseY}
          x2={armTipX}
          y2={armTipY}
          stroke="url(#copper)"
          strokeWidth={tube}
          strokeLinecap="round"
        />
        {/* a lit edge along the top of the tube */}
        <line
          x1={armBaseX}
          y1={armBaseY - tube * 0.26}
          x2={armTipX}
          y2={armTipY - tube * 0.26}
          stroke="rgba(255,225,200,0.55)"
          strokeWidth={tube * 0.22}
          strokeLinecap="round"
        />

        {/* headshell and stylus */}
        <g transform={`rotate(${angle} ${armTipX} ${armTipY})`}>
          <rect
            x={armTipX - head * 0.55}
            y={armTipY - head * 0.34}
            width={head * 1.25}
            height={head * 0.68}
            rx={head * 0.18}
            fill="url(#copper-pivot)"
          />
          <rect
            x={armTipX - head * 0.45}
            y={armTipY - head * 0.24}
            width={head * 1.05}
            height={head * 0.16}
            rx={head * 0.08}
            fill="rgba(255,228,205,0.5)"
          />
          <path
            d={`M ${armTipX + head * 0.4} ${armTipY + head * 0.34}
                L ${armTipX + head * 0.52} ${armTipY + head * 0.78}`}
            stroke="#6E6E68"
            strokeWidth={Math.max(1, tube * 0.32)}
            strokeLinecap="round"
          />
        </g>

        {/* pivot post */}
        <circle cx={armBaseX} cy={armBaseY} r={pivot} fill="url(#copper-pivot)" />
        <circle cx={armBaseX} cy={armBaseY} r={pivot * 0.42} fill="rgba(90,44,24,0.55)" />
        <circle
          cx={armBaseX - pivot * 0.3}
          cy={armBaseY - pivot * 0.32}
          r={pivot * 0.18}
          fill="rgba(255,236,220,0.9)"
        />
      </g>
    </motion.svg>
  )
}
