import { AnimatePresence, motion } from 'framer-motion'
import { Disc3 } from 'lucide-react'
import type { Mood } from '../data/moods'
import { EASE_SOFT } from '../lib/motion'

type Props = {
  mood: Mood | null
  reduced: boolean
}

/**
 * A quiet caption under the turntable. It doubles as the live region that
 * announces the change to screen readers, so the swap is legible without
 * needing to see the record.
 */
export function SelectedMoodIndicator({ mood, reduced }: Props) {
  return (
    <div
      className="flex h-5 items-center justify-center"
      aria-live="polite"
      aria-atomic="true"
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.p
          key={mood?.id ?? 'idle'}
          className="m-0 flex items-center gap-1.5 text-[11.5px] font-medium tracking-[0.01em]"
          style={{ color: mood ? 'rgba(60,60,58,0.85)' : 'rgba(120,120,116,0.75)' }}
          initial={reduced ? { opacity: 0 } : { opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={reduced ? { opacity: 0 } : { opacity: 0, y: -4 }}
          transition={{ duration: reduced ? 0.15 : 0.28, ease: EASE_SOFT }}
        >
          {mood ? (
            <>
              <Disc3
                size={12}
                strokeWidth={1.9}
                style={{ color: mood.accent }}
                aria-hidden="true"
              />
              <span>
                Now spinning — <span style={{ color: '#2C2C2A' }}>{mood.name}</span>
              </span>
            </>
          ) : (
            <span>Pick a record</span>
          )}
        </motion.p>
      </AnimatePresence>
    </div>
  )
}
