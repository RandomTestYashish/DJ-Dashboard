import { animate, useReducedMotion } from 'framer-motion'
import { useCallback, useEffect, useRef, useState } from 'react'
import { ConversationHeader } from './components/ConversationHeader'
import { DraggableVinyl } from './components/DraggableVinyl'
import { Player } from './components/Player'
import { SelectedMoodIndicator } from './components/SelectedMoodIndicator'
import { VinylCollection } from './components/VinylCollection'
import { MOODS, type Mood } from './data/moods'
import { playClick } from './lib/audio'
import { playerLayout } from './lib/playerLayout'
import { useRecordSpin } from './lib/useRecordSpin'
import { useStageGeometry } from './lib/useStageGeometry'
import { useTonearmState } from './lib/useTonearmState'
import { useViewportWidth } from './lib/useViewportWidth'
import { useVinylStage } from './lib/useVinylStage'
import { useVinylMotion } from './lib/vinylMotion'

/** The settle as a record beds down — a little overshoot, no bounce. */
const SNAP = { type: 'spring' as const, stiffness: 320, damping: 25, mass: 0.8 }

/** After a record lands, the beat before the platter drives it. */
const SPIN_UP_DELAY = 700

export default function App() {
  const reduced = useReducedMotion() ?? false
  const viewport = useViewportWidth()
  const layout = playerLayout(viewport)

  const stageRef = useRef<HTMLDivElement>(null)
  const platterRef = useRef<HTMLDivElement>(null)
  const { geometry, registerSlot } = useStageGeometry(stageRef, platterRef)
  const motionFor = useVinylMotion()

  const [landings, setLandings] = useState(0)

  const onDrop = useCallback(() => {
    setLandings((n) => n + 1)
    playClick()
  }, [])

  // Wrapped rather than passed straight through: the callbacks are handed a
  // Mood, and playClick's only argument is a volume.
  const onPickUp = useCallback(() => playClick(), [])

  const stage = useVinylStage({
    moods: MOODS,
    geometry,
    recordSize: layout.vinylSize,
    motionFor,
    reduced,
    onDrop,
    onPickUp,
  })

  const { placements, activeVinyl, draggedVinyl, isDragging, isOverPlatter } = stage

  // The arm is down whenever there is a record under it, and comes back the
  // moment one is carried over the platter — while still in hand, not after.
  const armEngaged = activeVinyl !== null || (isDragging && isOverPlatter)
  const tonearm = useTonearmState(armEngaged, reduced)

  // The platter waits a beat after a record lands before driving it, so the
  // arm has time to come to rest first.
  const [driven, setDriven] = useState(false)
  useEffect(() => {
    if (!activeVinyl) {
      setDriven(false)
      return
    }
    if (reduced) {
      setDriven(true)
      return
    }
    const timer = setTimeout(() => setDriven(true), SPIN_UP_DELAY)
    return () => clearTimeout(timer)
  }, [activeVinyl, reduced, landings])

  const rotation = useRecordSpin(activeVinyl !== null && driven, activeVinyl?.id ?? null, !reduced)

  // Records animate to wherever their placement says they belong. The one in
  // hand is skipped — the pointer is driving it.
  const hydrated = useRef(false)
  useEffect(() => {
    if (!geometry.platter.r) return
    const instant = reduced || !hydrated.current
    hydrated.current = true

    for (const mood of MOODS) {
      if (draggedVinyl?.id === mood.id) continue
      const values = motionFor(mood.id)
      const point = stage.restingPoint(mood.id)
      const scale =
        placements[mood.id]?.kind === 'collection'
          ? layout.collectionSize / layout.vinylSize
          : 1

      if (instant) {
        values.x.set(point.x)
        values.y.set(point.y)
        values.scale.set(scale)
        values.rotate.set(0)
        continue
      }
      animate(values.x, point.x, SNAP)
      animate(values.y, point.y, SNAP)
      animate(values.scale, scale, SNAP)
      animate(values.rotate, 0, { duration: 0.35, ease: [0.22, 1, 0.36, 1] })
    }
    // `stage.restingPoint` closes over placements and geometry, both listed.
  }, [placements, geometry, layout, draggedVinyl, reduced, motionFor, stage])

  const onPointerDown = useCallback(
    (mood: Mood, event: React.PointerEvent<HTMLElement>) => {
      stage.beginDrag(mood, event, stageRef.current)
    },
    [stage],
  )

  const resting = MOODS.filter((m) => m.id !== draggedVinyl?.id)

  const renderVinyl = (mood: Mood) => (
    <DraggableVinyl
      key={mood.id}
      mood={mood}
      size={layout.vinylSize}
      motionValues={motionFor(mood.id)}
      placement={placements[mood.id] ?? { kind: 'collection' }}
      dragging={draggedVinyl?.id === mood.id}
      rotation={activeVinyl?.id === mood.id ? rotation : undefined}
      onPointerDown={onPointerDown}
      onToggle={stage.toggle}
    />
  )

  return (
    <main
      ref={stageRef}
      /* `overflow-x: clip` keeps a record carried to the edge from widening
         the page, without turning this into a scroll container. */
      className="relative mx-auto flex min-h-[100svh] w-full max-w-[900px] flex-col items-center justify-center gap-7 overflow-x-clip px-4 py-8 sm:gap-9"
    >
      <div className="w-full max-w-[420px]">
        <ConversationHeader />
      </div>

      <Player
        layout={layout}
        platterRef={platterRef}
        isOverPlatter={isOverPlatter}
        tonearm={tonearm}
        reduced={reduced}
      />

      <SelectedMoodIndicator
        mood={activeVinyl}
        held={draggedVinyl}
        overPlatter={isOverPlatter}
        reduced={reduced}
      />

      <VinylCollection
        moods={MOODS}
        placements={placements}
        size={layout.collectionSize}
        registerSlot={registerSlot}
      />

      {/* Records at rest sit below the tonearm, so the arm lies over the one on
          the platter. */}
      <div className="pointer-events-none absolute inset-0" style={{ zIndex: 10 }}>
        {resting.map(renderVinyl)}
      </div>

      {/* The record in hand rides above the arm — you are holding it. */}
      <div className="pointer-events-none absolute inset-0" style={{ zIndex: 30 }}>
        {draggedVinyl && renderVinyl(draggedVinyl)}
      </div>
    </main>
  )
}
