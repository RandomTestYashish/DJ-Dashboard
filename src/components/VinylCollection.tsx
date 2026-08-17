import type { Mood } from '../data/moods'
import type { Placement } from '../lib/useVinylStage'

type Props = {
  moods: Mood[]
  placements: Record<string, Placement>
  size: number
  registerSlot: (id: string, el: HTMLElement | null) => void
}

/**
 * The sleeves the records are stored in.
 *
 * These are only sockets — the records themselves live in a layer above, so a
 * record can be carried out of the collection without ever changing parent.
 * Each socket keeps its place in the grid whether or not its record is home,
 * which is what stops the others shuffling around when one is picked up.
 */
export function VinylCollection({ moods, placements, size, registerSlot }: Props) {
  return (
    <div
      className="grid justify-center"
      style={{
        gridTemplateColumns: `repeat(3, ${size}px)`,
        columnGap: size * 0.42,
        rowGap: size * 0.34,
      }}
    >
      {moods.map((mood) => {
        const home = placements[mood.id]?.kind === 'collection'
        return (
          <div
            key={mood.id}
            ref={(el) => {
              registerSlot(mood.id, el)
            }}
            className="relative"
            style={{ width: size, height: size, borderRadius: '50%' }}
          >
            {/* the impression left in the sleeve when the record is out */}
            <span
              className="pointer-events-none absolute inset-0 transition-opacity duration-300"
              style={{
                borderRadius: '50%',
                opacity: home ? 0 : 1,
                background: `radial-gradient(circle at 50% 45%, ${mood.accent}14, rgba(0,0,0,0.035) 72%)`,
                boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.08), inset 0 0 0 1px rgba(0,0,0,0.045)',
              }}
            />
          </div>
        )
      })}
    </div>
  )
}
