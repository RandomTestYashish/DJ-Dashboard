import { motion, type MotionValue } from 'framer-motion'
import type { Mood } from '../data/moods'
import { NEUTRAL_GRADIENT } from '../data/moods'
import { VinylLabel } from './VinylLabel'

type Props = {
  /** The record on the platter, or null for the blank house record. */
  mood: Mood | null
  size: number
  /** Live rotation angle. Omit for a still record. */
  rotation?: MotionValue<number>
  /** Coloured records catch the light more than the blank one does. */
  glossy?: boolean
}

/**
 * A single record face: colour, grooves, handwriting, spindle and highlight.
 *
 * Only the artwork turns. The light sweep and the spindle stay put, because a
 * record spins underneath a fixed lamp and around a fixed spindle — animating
 * those along with it is the detail that makes a spinning disc look fake.
 */
export function VinylRecord({ mood, size, rotation, glossy = true }: Props) {
  const gradient = mood?.gradient ?? NEUTRAL_GRADIENT
  const spindle = size * 0.23
  const hole = spindle * 0.26

  // Groove pitch scales with the record so minis do not turn into moiré.
  const pitch = Math.max(2.5, size * 0.017)

  return (
    <div
      className="relative isolate select-none"
      style={{ width: size, height: size, borderRadius: '50%' }}
    >
      {/* ---- turning layer: colour, grooves and handwriting ---- */}
      <motion.div
        data-record-face={mood?.id ?? 'blank'}
        className="absolute inset-0 overflow-hidden"
        style={{ borderRadius: '50%', rotate: rotation, willChange: 'transform' }}
      >
        <div className="absolute inset-0" style={{ background: gradient }} />

        {/* Concentric pressing grooves, barely there. */}
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `repeating-radial-gradient(circle,
              rgba(255,255,255,0.08) 0px,
              rgba(255,255,255,0.08) 1px,
              transparent 2px,
              transparent ${pitch}px)`,
            opacity: mood ? 0.85 : 0.5,
            mixBlendMode: 'overlay',
          }}
        />

        <VinylLabel mood={mood} size={size} />
      </motion.div>

      {/* ---- fixed light: a slow glossy sweep across the surface ---- */}
      <div
        className="pointer-events-none absolute inset-0 overflow-hidden"
        style={{ borderRadius: '50%' }}
      >
        <div
          className="absolute -inset-x-1/2 inset-y-0"
          style={{
            background: `linear-gradient(115deg,
              transparent 30%,
              rgba(255,255,255,${glossy ? 0.25 : 0.16}) 48%,
              transparent 62%)`,
            animation: 'sheen-drift 9s var(--ease-soft) infinite alternate',
            willChange: 'transform',
          }}
        />
      </div>

      {/* ---- edge: the record's own thickness ---- */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          borderRadius: '50%',
          boxShadow: `inset 0 0 ${size * 0.06}px rgba(0,0,0,0.35),
                      inset 0 1px 1px rgba(255,255,255,0.28)`,
        }}
      />

      {/* ---- spindle: metal ring, cream hub, dark hole ---- */}
      <div
        className="pointer-events-none absolute left-1/2 top-1/2"
        style={{
          width: spindle,
          height: spindle,
          marginLeft: -spindle / 2,
          marginTop: -spindle / 2,
          borderRadius: '50%',
          background: 'radial-gradient(circle at 35% 30%, #FFFFFF, #F2F2EE 55%, #D8D8D2 100%)',
          boxShadow: `0 0 0 ${Math.max(1, size * 0.004)}px rgba(255,255,255,0.55),
                      0 ${size * 0.006}px ${size * 0.02}px rgba(0,0,0,0.28),
                      inset 0 -1px 2px rgba(0,0,0,0.10)`,
        }}
      >
        <span
          className="absolute left-1/2 top-1/2 block"
          style={{
            width: hole,
            height: hole,
            marginLeft: -hole / 2,
            marginTop: -hole / 2,
            borderRadius: '50%',
            background: '#222222',
            boxShadow: 'inset 0 1px 1px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.45)',
          }}
        />
      </div>
    </div>
  )
}
