import type { Mood } from '../data/moods'
import { Doodle } from './doodles/Doodles'

type Props = {
  /** The record being written on, or null for the blank house record. */
  mood: Mood | null
  /** Diameter of the record in px; everything here is derived from it. */
  size: number
}

/**
 * The handwriting and scribbles on a record face.
 *
 * Lines cascade diagonally rather than stacking in a centred column, which is
 * what keeps them clear of the spindle and gives the label its scrawled,
 * written-in-a-hurry feel.
 */
export function VinylLabel({ mood, size }: Props) {
  if (!mood) return null

  const count = mood.lines.length
  const fontSize = size * (count > 2 ? 0.135 : 0.155)

  // How far each successive line steps left, and down, as a share of the record.
  const stepX = size * (count > 2 ? 0.1 : 0.13)
  const stepY = size * (count > 2 ? 0.15 : 0.19)

  // A single word sits above the spindle instead of straddling it.
  const blockShiftY = count === 1 ? -size * 0.17 : 0

  return (
    <div className="pointer-events-none absolute inset-0" aria-hidden="true">
      <div
        className="absolute inset-0 flex flex-col items-center justify-center"
        style={{
          transform: `rotate(${mood.labelRotate}deg) translateY(${blockShiftY}px)`,
          color: 'rgba(14,14,14,0.92)',
        }}
      >
        {mood.lines.map((line, i) => {
          const mid = (count - 1) / 2
          return (
            <span
              key={line}
              className="font-hand whitespace-nowrap"
              style={{
                fontSize,
                fontWeight: 700,
                lineHeight: 1,
                letterSpacing: '-0.01em',
                transform: `translate(${(mid - i) * stepX}px, ${(i - mid) * stepY}px) rotate(${
                  i % 2 === 0 ? -2.5 : 2
                }deg)`,
                textShadow: '0 1px 0 rgba(255,255,255,0.14)',
              }}
            >
              {line}
            </span>
          )
        })}
      </div>

      {mood.doodles.map((doodle, i) => (
        <span
          key={`${doodle.kind}-${i}`}
          className="absolute"
          style={{
            left: `${doodle.x}%`,
            top: `${doodle.y}%`,
            width: `${doodle.size}%`,
            height: `${doodle.size}%`,
            transform: `translate(-50%, -50%) rotate(${doodle.rotate ?? 0}deg)`,
            color: 'rgba(14,14,14,0.88)',
          }}
        >
          <Doodle kind={doodle.kind} strokeWidth={size < 110 ? 2.2 : 1.7} />
        </span>
      ))}
    </div>
  )
}
