import { AnimatePresence, motion, type MotionValue } from 'framer-motion'
import type { FlashKind, Mood } from '../data/moods'
import { EASE_OUT_QUINT, recordLayoutId, recordSwap, recordSwapReduced } from '../lib/motion'
import type { TonearmState } from '../lib/useTonearmState'
import type { useVinylDrag } from '../lib/useVinylDrag'
import { Tonearm } from './Tonearm'
import { TurntableBody } from './TurntableBody'
import { VinylRecord } from './VinylRecord'

type Props = {
  mood: Mood | null
  size: number
  recordSize: number
  rotation: MotionValue<number>
  /** Bumped when the mood changes, to fire that mood's flash. */
  flashKey: number
  /** Bumped whenever a record lands, including after being placed back. */
  pulseKey: number
  drag: ReturnType<typeof useVinylDrag>
  tonearm: TonearmState
  reduced: boolean
}

/**
 * Each mood gets its own flash, so no two swaps land the same way. The colour
 * comes from the incoming record, which is why yellow-to-red feels warm and
 * pink-to-cyan feels like a shimmer.
 */
function flashBackground(kind: FlashKind, mood: Mood) {
  switch (kind) {
    case 'warm':
      return `radial-gradient(circle at 50% 50%, ${mood.highlight} 0%, ${mood.accent}88 38%, transparent 68%)`
    case 'shimmer':
      return `radial-gradient(circle at 50% 45%, rgba(255,255,255,0.95) 0%, ${mood.highlight}aa 32%, transparent 66%)`
    case 'brightness':
      return `radial-gradient(circle at 50% 50%, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0.4) 40%, transparent 70%)`
    case 'glow':
      return `radial-gradient(circle at 50% 55%, ${mood.highlight}dd 0%, ${mood.accent}66 45%, transparent 72%)`
  }
}

const flashTiming: Record<FlashKind, { peak: number; duration: number }> = {
  warm: { peak: 0.55, duration: 0.72 },
  shimmer: { peak: 0.7, duration: 0.5 },
  brightness: { peak: 0.5, duration: 0.4 },
  glow: { peak: 0.45, duration: 0.9 },
}

export function Turntable({
  mood,
  size,
  recordSize,
  rotation,
  flashKey,
  pulseKey,
  drag,
  tonearm,
  reduced,
}: Props) {
  const swap = reduced ? recordSwapReduced : recordSwap
  const flash = mood ? flashTiming[mood.flash] : null
  const held = drag.dragging || drag.position === 'outside'

  return (
    <div className="relative" style={{ width: size, height: size }}>
      {/* soft halo on the paper behind the housing */}
      <div
        className="pointer-events-none absolute left-1/2 top-1/2 -z-10"
        style={{
          width: size * 2,
          height: size * 2,
          marginLeft: -size,
          marginTop: -size,
          background:
            'radial-gradient(circle, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.45) 35%, rgba(245,245,242,0) 70%)',
        }}
      />

      <TurntableBody size={size} dropHint={drag.dropHint}>
        {/* the platter position — every record that plays lands exactly here */}
        <div
          className="absolute left-1/2 top-1/2"
          style={{
            width: recordSize,
            height: recordSize,
            marginLeft: -recordSize / 2,
            marginTop: -recordSize / 2,
          }}
        >
          {/* The blank house record. It does not fly anywhere, and it is not
              something to pick up; it is simply lifted off and put away when a
              chosen record arrives. */}
          <AnimatePresence>
            {!mood && (
              <motion.div
                key="blank"
                className="absolute inset-0"
                style={{ borderRadius: '50%' }}
                initial={false}
                exit={
                  reduced
                    ? { opacity: 0, transition: { duration: 0.15 } }
                    : {
                        rotate: 180,
                        scale: 0.92,
                        opacity: 0,
                        transition: { duration: 0.7, ease: EASE_OUT_QUINT },
                      }
                }
              >
                <VinylRecord mood={null} size={recordSize} glossy={false} />
              </motion.div>
            )}
          </AnimatePresence>

          {mood && (
            <motion.button
              type="button"
              key={mood.id}
              layoutId={recordLayoutId(mood.id)}
              aria-label={
                drag.position === 'inside'
                  ? `${mood.name} record on the turntable. Press Enter to lift it off.`
                  : `${mood.name} record lifted off. Press Enter to place it back.`
              }
              onKeyDown={(event) => {
                if (event.key !== 'Enter' && event.key !== ' ') return
                // Stop the browser turning this into a click, and stop Space
                // from scrolling the page.
                event.preventDefault()
                drag.toggle()
              }}
              {...drag.handlers}
              className="absolute inset-0 block border-0 bg-transparent p-0"
              style={{
                borderRadius: '50%',
                x: drag.x,
                y: drag.y,
                rotate: drag.rotate,
                scale: drag.scale,
                touchAction: 'none',
                userSelect: 'none',
                cursor: drag.dragging ? 'grabbing' : 'grab',
                // Above the tonearm once in hand, so the record is never
                // dragged out from under it.
                zIndex: held ? 40 : 20,
              }}
              animate={{
                boxShadow: held
                  ? '0 18px 35px rgba(0,0,0,0.18), 0 5px 12px rgba(0,0,0,0.10)'
                  : `0 ${recordSize * 0.045}px ${recordSize * 0.11}px rgba(0,0,0,0.24)`,
              }}
              transition={swap}
            >
              <VinylRecord mood={mood} size={recordSize} rotation={rotation} />
            </motion.button>
          )}

          {/* a ring that blooms outward once, right after a record lands */}
          <AnimatePresence>
            {mood && !reduced && (
              <motion.span
                key={`pulse-${pulseKey}`}
                className="pointer-events-none absolute inset-0"
                style={{ borderRadius: '50%', zIndex: 22 }}
                initial={{ opacity: 0.55, scale: 1, boxShadow: `0 0 0 0px ${mood.accent}` }}
                animate={{
                  opacity: 0,
                  scale: 1.13,
                  boxShadow: `0 0 0 ${recordSize * 0.045}px ${mood.accent}00`,
                }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.85, ease: EASE_OUT_QUINT }}
              />
            )}
          </AnimatePresence>
        </div>

        {/* the mood-specific flash, painted over the whole housing */}
        <AnimatePresence>
          {mood && flash && !reduced && (
            <motion.div
              key={`flash-${flashKey}`}
              className="pointer-events-none absolute inset-0"
              style={{
                borderRadius: size * 0.0875,
                background: flashBackground(mood.flash, mood),
                mixBlendMode: 'screen',
                zIndex: 24,
              }}
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: [0, flash.peak, 0], scale: [0.85, 1.06, 1.12] }}
              exit={{ opacity: 0 }}
              transition={{ duration: flash.duration, ease: EASE_OUT_QUINT, times: [0, 0.32, 1] }}
            />
          )}
        </AnimatePresence>

        <Tonearm state={tonearm} size={size} />
      </TurntableBody>
    </div>
  )
}
