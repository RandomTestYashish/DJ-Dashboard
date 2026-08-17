import { motion } from 'framer-motion'
import type { RefObject } from 'react'
import type { PlayerLayout } from '../lib/playerLayout'
import type { TonearmState } from '../lib/useTonearmState'
import { Tonearm } from './Tonearm'

type Props = {
  layout: PlayerLayout
  platterRef: RefObject<HTMLDivElement | null>
  /** True while a record is being carried over the platter. */
  isOverPlatter: boolean
  tonearm: TonearmState
  reduced: boolean
}

/**
 * The player itself: a wide off-white cabinet with a raised deck, a recessed
 * platter, a copper tonearm and a fabric front.
 *
 * Deliberately not a stacking context — no transform, filter or z-index on the
 * root — so the tonearm inside it can sit above the records resting on the
 * platter while a record being carried passes above them both.
 */
export function Player({ layout, platterRef, isOverPlatter, tonearm, reduced }: Props) {
  const {
    width,
    height,
    deckHeight,
    grilleHeight,
    platterSize,
    platterCx,
    platterCy,
    knobSize,
    knobCx,
    dialSize,
    dialCx,
  } = layout

  const recess = platterSize * 1.075
  const dot = Math.max(2.6, height * 0.011)
  const grilleInset = width * 0.016

  return (
    <div
      className="relative select-none"
      style={{
        width,
        height,
        borderRadius: 18,
        background: 'linear-gradient(145deg, #F5F4F0 0%, #E9E8E4 55%, #D8D7D2 100%)',
        border: '1px solid rgba(0,0,0,0.06)',
        boxShadow: '0 28px 60px rgba(0,0,0,0.14), 0 8px 20px rgba(0,0,0,0.08)',
      }}
    >
      {/* ---- raised top surface ---- */}
      <div
        className="absolute left-0 top-0"
        style={{
          width,
          height: deckHeight,
          borderRadius: '18px 18px 0 0',
          background: 'linear-gradient(145deg, #F8F7F3, #E8E7E3)',
          boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.9)',
        }}
      />

      {/* the lip where the deck meets the front panel */}
      <div
        className="absolute left-0"
        style={{
          top: deckHeight - 1,
          width,
          height: 2,
          background:
            'linear-gradient(180deg, rgba(0,0,0,0.10), rgba(255,255,255,0.85))',
        }}
      />

      {/* ---- platter recess, milled into the deck ---- */}
      <div
        className="absolute"
        style={{
          left: platterCx - recess / 2,
          top: platterCy - recess / 2,
          width: recess,
          height: recess,
          borderRadius: '50%',
          background: 'radial-gradient(circle at 42% 34%, #EFEEEA 0%, #E3E2DD 70%, #D6D5D0 100%)',
          boxShadow:
            'inset 0 3px 7px rgba(0,0,0,0.14), inset 0 -1px 0 rgba(255,255,255,0.8), 0 1px 0 rgba(255,255,255,0.7)',
        }}
      />

      {/* ---- platter ---- */}
      <motion.div
        ref={platterRef}
        data-platter=""
        className="absolute"
        style={{
          left: platterCx - platterSize / 2,
          top: platterCy - platterSize / 2,
          width: platterSize,
          height: platterSize,
          borderRadius: '50%',
          background:
            'radial-gradient(circle at 40% 35%, #303030, #171717 65%, #0B0B0B 100%)',
        }}
        initial={false}
        animate={{
          boxShadow: isOverPlatter
            ? `inset 0 4px 10px rgba(0,0,0,0.4), 0 2px 5px rgba(0,0,0,0.15),
               inset 0 0 0 2px rgba(255,255,255,0.35), 0 0 24px rgba(255,255,255,0.12)`
            : `inset 0 4px 10px rgba(0,0,0,0.4), 0 2px 5px rgba(0,0,0,0.15),
               inset 0 0 0 0px rgba(255,255,255,0), 0 0 0px rgba(255,255,255,0)`,
        }}
        transition={{ duration: reduced ? 0.001 : 0.22, ease: 'easeOut' }}
      >
        {/* machined rings on the platter surface */}
        <div
          className="absolute inset-0"
          style={{
            borderRadius: '50%',
            backgroundImage: `repeating-radial-gradient(circle,
              rgba(255,255,255,0.045) 0px,
              rgba(255,255,255,0.045) 1px,
              transparent 2px,
              transparent ${Math.max(4, platterSize * 0.03)}px)`,
          }}
        />
        {/* the spindle pin, visible whenever the platter is bare */}
        <div
          className="absolute left-1/2 top-1/2"
          style={{
            width: Math.max(3, platterSize * 0.022),
            height: Math.max(3, platterSize * 0.022),
            marginLeft: -Math.max(3, platterSize * 0.022) / 2,
            marginTop: -Math.max(3, platterSize * 0.022) / 2,
            borderRadius: '50%',
            background: 'linear-gradient(160deg, #D9D9D4, #8E8E88)',
            boxShadow: '0 0 0 1px rgba(0,0,0,0.35)',
          }}
        />
      </motion.div>

      {/* ---- controls ---- */}
      {/* volume, with a copper indicator line */}
      <div
        className="absolute"
        style={{
          left: knobCx - knobSize / 2,
          top: deckHeight * 0.5 - knobSize / 2,
          width: knobSize,
          height: knobSize,
          borderRadius: '50%',
          background: 'radial-gradient(circle at 36% 30%, #FDFCFA, #E6E5E0 62%, #C9C8C3 100%)',
          boxShadow:
            '0 2px 4px rgba(0,0,0,0.16), 0 1px 0 rgba(255,255,255,0.9) inset, 0 0 0 1px rgba(0,0,0,0.05)',
        }}
      >
        <div
          className="absolute left-1/2"
          style={{
            top: knobSize * 0.14,
            width: Math.max(1.5, knobSize * 0.045),
            height: knobSize * 0.24,
            marginLeft: -Math.max(1.5, knobSize * 0.045) / 2,
            borderRadius: 999,
            background: '#B8623B',
          }}
        />
      </div>

      {/* source selector */}
      <div
        className="absolute"
        style={{
          left: dialCx - dialSize / 2,
          top: deckHeight * 0.5 - dialSize / 2,
          width: dialSize,
          height: dialSize,
          borderRadius: '50%',
          background: 'radial-gradient(circle at 36% 30%, #F7F6F2, #DEDDD8 70%, #C4C3BE 100%)',
          boxShadow: '0 1px 3px rgba(0,0,0,0.14), inset 0 1px 0 rgba(255,255,255,0.85)',
        }}
      />

      {/* power light, and the two status lamps beside it */}
      <div
        className="absolute flex items-center"
        style={{
          left: knobCx - knobSize * 0.42,
          top: deckHeight * 0.5 - knobSize * 0.95,
          gap: Math.max(3, knobSize * 0.14),
        }}
      >
        {['#C4795A', 'rgba(0,0,0,0.16)', 'rgba(0,0,0,0.16)'].map((tone, i) => (
          <span
            key={tone + i}
            style={{
              width: Math.max(3, knobSize * 0.1),
              height: Math.max(3, knobSize * 0.1),
              borderRadius: '50%',
              background: tone,
              boxShadow: i === 0 ? '0 0 6px rgba(196,121,90,0.8)' : 'none',
            }}
          />
        ))}
      </div>

      {/* speed marking, the way a real deck is stamped */}
      <span
        className="absolute font-medium"
        style={{
          left: platterCx + platterSize * 0.52,
          top: platterCy + platterSize * 0.36,
          fontSize: Math.max(7, platterSize * 0.055),
          letterSpacing: '0.08em',
          color: 'rgba(0,0,0,0.20)',
        }}
      >
        33⅓
      </span>

      {/* ---- fabric front ---- */}
      {/* The panel the grille cloth is stretched over, left proud at the edges
          so the cloth reads as inset into the cabinet rather than painted on. */}
      <div
        className="absolute"
        style={{
          left: grilleInset,
          top: deckHeight + grilleInset * 0.5,
          width: width - grilleInset * 2,
          height: grilleHeight - grilleInset * 1.6,
          borderRadius: 12,
          backgroundColor: '#C3C2BD',
          backgroundImage: [
            'radial-gradient(rgba(0,0,0,0.13) 0.7px, transparent 0.8px)',
            'linear-gradient(180deg, rgba(0,0,0,0.05), rgba(255,255,255,0.05))',
          ].join(', '),
          backgroundSize: `${dot}px ${dot}px, 100% 100%`,
          boxShadow:
            'inset 0 2px 5px rgba(0,0,0,0.20), inset 0 -3px 8px rgba(0,0,0,0.12), 0 1px 0 rgba(255,255,255,0.75)',
        }}
      />

      {/* a darker front edge, so the cabinet has a bottom */}
      <div
        className="absolute left-0 bottom-0"
        style={{
          width,
          height: Math.max(3, height * 0.022),
          borderRadius: '0 0 18px 18px',
          background: 'linear-gradient(180deg, rgba(0,0,0,0.02), rgba(0,0,0,0.16))',
        }}
      />

      <Tonearm state={tonearm} layout={layout} />
    </div>
  )
}
