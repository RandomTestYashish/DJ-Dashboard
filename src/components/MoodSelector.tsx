import { motion } from 'framer-motion'
import type { Mood } from '../data/moods'
import { EASE_SOFT } from '../lib/motion'
import { MoodVinyl } from './MoodVinyl'

type Props = {
  moods: Mood[]
  selectedId: string | null
  size: number
  onSelect: (mood: Mood) => void
  reduced: boolean
}

/** The crate: two rows of three, each slot holding one record. */
export function MoodSelector({ moods, selectedId, size, onSelect, reduced }: Props) {
  return (
    <motion.div
      role="group"
      aria-label="Choose a record"
      className="grid justify-center"
      style={{
        gridTemplateColumns: `repeat(3, ${size}px)`,
        columnGap: size * 0.42,
        rowGap: size * 0.34,
      }}
      initial={reduced ? false : { opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5, duration: 0.55, ease: EASE_SOFT }}
    >
      {moods.map((mood, i) => (
        <MoodVinyl
          key={mood.id}
          mood={mood}
          size={size}
          selected={mood.id === selectedId}
          tilt={i % 2 === 0 ? -3 : 3}
          onSelect={onSelect}
          reduced={reduced}
        />
      ))}
    </motion.div>
  )
}
