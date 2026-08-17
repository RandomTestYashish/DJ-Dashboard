import { motion } from 'framer-motion'
import { bubbleVariants } from '../lib/motion'

const LINES = [
  { text: "Okay, fine. You're the DJ.", background: 'var(--bubble-1)' },
  { text: 'What are you playing to set the mood for the evening?', background: 'var(--bubble-2)' },
]

/**
 * Two chat bubbles that arrive one after the other, as if someone were typing
 * them. They set the whole premise, so they land before anything else does.
 */
export function ConversationHeader() {
  return (
    <div className="flex flex-col items-start gap-1.5">
      {LINES.map((line, i) => (
        <motion.p
          key={line.text}
          className="m-0 max-w-full rounded-full px-3 py-2 text-[12px] font-medium leading-snug sm:text-[13px]"
          style={{ background: line.background, color: 'var(--bubble-ink)' }}
          variants={bubbleVariants}
          custom={i}
          initial="hidden"
          animate="visible"
        >
          {line.text}
        </motion.p>
      ))}
    </div>
  )
}
