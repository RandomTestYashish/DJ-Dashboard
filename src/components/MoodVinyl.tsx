import { motion } from 'framer-motion'
import { useState } from 'react'
import type { Mood } from '../data/moods'
import {
  EASE_OUT_QUINT,
  MINI_SHADOW,
  MINI_SHADOW_LIFTED,
  recordLayoutId,
  recordSwap,
  recordSwapReduced,
  tactile,
} from '../lib/motion'
import { VinylRecord } from './VinylRecord'

type Props = {
  mood: Mood
  size: number
  /** True while this record is on the platter — its slot then sits empty. */
  selected: boolean
  /** Alternates the hover tilt so neighbouring records lean opposite ways. */
  tilt: number
  onSelect: (mood: Mood) => void
  reduced: boolean
}

/**
 * One record in the crate. There is no button chrome around it: the record is
 * the control. Picking it up lifts it out of the crate and carries it to the
 * platter, so the slot it leaves behind stays empty until it comes back.
 */
export function MoodVinyl({ mood, size, selected, tilt, onSelect, reduced }: Props) {
  // Framer's `whileFocus` puts a tabindex on the element it decorates, which
  // would add a second tab stop inside this button. Tracking focus on the
  // button itself keeps exactly one stop per record and still lets the record
  // lift for keyboard users.
  const [keyFocused, setKeyFocused] = useState(false)

  const resting = { scale: 1, y: 0, rotate: 0, boxShadow: MINI_SHADOW }
  const lifted = {
    scale: 1.08,
    y: -4,
    rotate: tilt,
    boxShadow: MINI_SHADOW_LIFTED,
    transition: tactile,
  }

  return (
    <button
      type="button"
      onClick={() => onSelect(mood)}
      onFocus={(event) => setKeyFocused(event.currentTarget.matches(':focus-visible'))}
      onBlur={() => setKeyFocused(false)}
      aria-label={`Play ${mood.name}`}
      aria-pressed={selected}
      className="relative block cursor-pointer border-0 bg-transparent p-0"
      style={{ width: size, height: size, borderRadius: '50%' }}
    >
      {/* The empty socket left behind: a faint impression in the crate, not a
          selection badge. It holds the record's place in the grid and quietly
          shows where the one now playing came from. */}
      <span
        className="pointer-events-none absolute inset-0 transition-opacity duration-300"
        style={{
          borderRadius: '50%',
          opacity: selected ? 1 : 0,
          background: `radial-gradient(circle at 50% 45%, ${mood.accent}14, rgba(0,0,0,0.035) 72%)`,
          boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.08), inset 0 0 0 1px rgba(0,0,0,0.045)',
        }}
      />

      {!selected && (
        <motion.span
          layoutId={recordLayoutId(mood.id)}
          className="absolute inset-0 block"
          /* Framer makes `whileTap` targets focusable so they can be activated
             by keyboard. The wrapping button already does that, so opt this
             one out or every record gets two tab stops. */
          tabIndex={-1}
          style={{ borderRadius: '50%', zIndex: 20 }}
          initial={false}
          animate={keyFocused && !reduced ? lifted : resting}
          transition={reduced ? recordSwapReduced : recordSwap}
          whileHover={reduced ? undefined : lifted}
          whileTap={
            reduced
              ? undefined
              : {
                  scale: 0.94,
                  y: 0,
                  rotate: 0,
                  transition: { duration: 0.08, ease: EASE_OUT_QUINT },
                }
          }
        >
          <VinylRecord mood={mood} size={size} />
        </motion.span>
      )}
    </button>
  )
}
