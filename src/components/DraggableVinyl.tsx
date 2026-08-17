import { motion, type MotionValue } from 'framer-motion'
import type { Mood } from '../data/moods'
import type { Placement } from '../lib/useVinylStage'
import type { VinylMotion } from '../lib/vinylMotion'
import { VinylRecord } from './VinylRecord'

type Props = {
  mood: Mood
  /** Full-size record diameter; stored records are scaled down from this. */
  size: number
  motionValues: VinylMotion
  placement: Placement
  dragging: boolean
  /** Supplied only for the record on the platter, which is the one that turns. */
  rotation?: MotionValue<number>
  onPointerDown: (mood: Mood, event: React.PointerEvent<HTMLElement>) => void
  onToggle: (mood: Mood) => void
}

const RESTING_SHADOW = '0 5px 15px rgba(0,0,0,0.12)'
const HELD_SHADOW = '0 22px 40px rgba(0,0,0,0.22), 0 6px 14px rgba(0,0,0,0.12)'
const SEATED_SHADOW = '0 4px 12px rgba(0,0,0,0.35)'

function describe(mood: Mood, placement: Placement) {
  if (placement.kind === 'platter') {
    return `${mood.name} record, on the player. Press Enter to take it off.`
  }
  if (placement.kind === 'loose') {
    return `${mood.name} record, set down. Press Enter to place it on the player.`
  }
  return `${mood.name} record, in the collection. Press Enter to place it on the player.`
}

/**
 * One record, wherever it happens to be. The same component serves the
 * collection, the platter and the table — a record is a single object that
 * moves, not three different widgets, so there is one drag implementation
 * rather than one per place a record can sit.
 *
 * Position and scale come from motion values held outside the tree, so this
 * can remount into a different paint layer mid-drag without the record moving.
 */
export function DraggableVinyl({
  mood,
  size,
  motionValues,
  placement,
  dragging,
  rotation,
  onPointerDown,
  onToggle,
}: Props) {
  const shadow = dragging
    ? HELD_SHADOW
    : placement.kind === 'platter'
      ? SEATED_SHADOW
      : RESTING_SHADOW

  return (
    <motion.button
      type="button"
      aria-label={describe(mood, placement)}
      data-record={mood.id}
      data-placement={placement.kind}
      onPointerDown={(event) => onPointerDown(mood, event)}
      onKeyDown={(event) => {
        if (event.key !== 'Enter' && event.key !== ' ') return
        // Keep the browser from firing a click too, and Space from scrolling.
        event.preventDefault()
        onToggle(mood)
      }}
      className="pointer-events-auto absolute left-0 top-0 block border-0 bg-transparent p-0"
      style={{
        width: size,
        height: size,
        marginLeft: -size / 2,
        marginTop: -size / 2,
        borderRadius: '50%',
        x: motionValues.x,
        y: motionValues.y,
        scale: motionValues.scale,
        rotate: motionValues.rotate,
        touchAction: 'none',
        userSelect: 'none',
        cursor: dragging ? 'grabbing' : 'grab',
        zIndex: dragging ? 9999 : 1,
      }}
      initial={false}
      animate={{ boxShadow: shadow }}
      transition={{ duration: 0.22, ease: 'easeOut' }}
    >
      <VinylRecord mood={mood} size={size} rotation={rotation} />
    </motion.button>
  )
}
