import { AnimatePresence, motion } from 'framer-motion'
import { Disc3, Hand } from 'lucide-react'
import type { Mood } from '../data/moods'
import { EASE_SOFT } from '../lib/motion'

type Props = {
  /** The record on the platter, if any. */
  mood: Mood | null
  /** The record currently in hand, if any. */
  held: Mood | null
  overPlatter: boolean
  reduced: boolean
}

/**
 * A quiet caption under the player. It doubles as the live region announcing
 * what is happening, so picking a record up, carrying it over the platter and
 * putting it down are all legible without needing to see them.
 */
export function SelectedMoodIndicator({ mood, held, overPlatter, reduced }: Props) {
  const state = held ? (overPlatter ? 'ready' : 'carrying') : mood ? 'playing' : 'idle'
  const subject = held ?? mood

  return (
    <div className="flex h-5 items-center justify-center" aria-live="polite" aria-atomic="true">
      <AnimatePresence mode="wait" initial={false}>
        <motion.p
          key={`${subject?.id ?? 'none'}-${state}`}
          className="m-0 flex items-center gap-1.5 text-[11.5px] font-medium tracking-[0.01em]"
          style={{ color: subject ? 'rgba(60,60,58,0.85)' : 'rgba(120,120,116,0.75)' }}
          initial={reduced ? { opacity: 0 } : { opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={reduced ? { opacity: 0 } : { opacity: 0, y: -4 }}
          transition={{ duration: reduced ? 0.15 : 0.28, ease: EASE_SOFT }}
        >
          {state === 'idle' && <span>Pick up a record and set it on the player</span>}

          {state === 'playing' && mood && (
            <>
              <Disc3 size={12} strokeWidth={1.9} style={{ color: mood.accent }} aria-hidden="true" />
              <span>
                Now spinning — <span style={{ color: '#2C2C2A' }}>{mood.name}</span>
              </span>
            </>
          )}

          {state === 'carrying' && held && (
            <>
              <Hand size={12} strokeWidth={1.9} style={{ color: held.accent }} aria-hidden="true" />
              <span>
                Holding <span style={{ color: '#2C2C2A' }}>{held.name}</span>
              </span>
            </>
          )}

          {state === 'ready' && held && (
            <>
              <Disc3 size={12} strokeWidth={1.9} style={{ color: held.accent }} aria-hidden="true" />
              <span>
                Release to play <span style={{ color: '#2C2C2A' }}>{held.name}</span>
              </span>
            </>
          )}
        </motion.p>
      </AnimatePresence>
    </div>
  )
}
