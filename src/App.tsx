import { motion, useMotionValue, useReducedMotion, useSpring } from 'framer-motion'
import { useCallback, useEffect, useRef, useState } from 'react'
import { ConversationHeader } from './components/ConversationHeader'
import { MoodSelector } from './components/MoodSelector'
import { SelectedMoodIndicator } from './components/SelectedMoodIndicator'
import { Turntable } from './components/Turntable'
import { MOODS, type Mood } from './data/moods'
import { playClick } from './lib/audio'
import { useMediaQuery } from './lib/useMediaQuery'
import { useRecordSpin } from './lib/useRecordSpin'
import { useTonearmState } from './lib/useTonearmState'
import { useVinylDrag } from './lib/useVinylDrag'

/** Furthest the turntable leans toward the pointer, in px. */
const PARALLAX = 3

/** After a record is placed back, the beat before the platter drives it. */
const SPIN_UP_DELAY = 700
/** ...and the beat before the highlight sweeps across it. */
const LAND_PULSE_DELAY = 800

export default function App() {
  const reduced = useReducedMotion() ?? false
  const compact = useMediaQuery('(max-width: 420px)')

  const [selected, setSelected] = useState<Mood | null>(null)
  const [flashKey, setFlashKey] = useState(0)
  const [pulseKey, setPulseKey] = useState(0)

  const turntableSize = compact ? 270 : 320
  const recordSize = Math.round(turntableSize * 0.78)
  const miniSize = compact ? 60 : 68

  const stageRef = useRef<HTMLDivElement>(null)

  const drag = useVinylDrag({
    // The record counts as seated only while its centre is over the recess.
    playableRadius: turntableSize * 0.42,
    recordSize,
    outOffset: { x: -turntableSize * 0.3, y: -turntableSize * 0.4 },
    stage: stageRef,
    enabled: selected !== null,
    reduced,
  })

  const seated = selected !== null && drag.position === 'inside'
  const tonearm = useTonearmState(seated, reduced)

  // The platter waits a beat after the record is back down before it drives
  // it, so the arm has time to come to rest first.
  const [driven, setDriven] = useState(true)
  useEffect(() => {
    if (!seated) {
      setDriven(false)
      return
    }
    if (reduced) {
      setDriven(true)
      return
    }
    const spinUp = setTimeout(() => setDriven(true), SPIN_UP_DELAY)
    const sweep = setTimeout(() => setPulseKey((n) => n + 1), LAND_PULSE_DELAY)
    return () => {
      clearTimeout(spinUp)
      clearTimeout(sweep)
    }
  }, [seated, reduced])

  const rotation = useRecordSpin(seated && driven, selected?.id ?? null, !reduced)

  const select = useCallback(
    (mood: Mood) => {
      // Re-picking the record already playing would fly it out and back for no
      // reason, so treat it as a no-op.
      if (mood.id === selected?.id) return
      // A new record always arrives seated, however the last one was left.
      drag.reset()
      setSelected(mood)
      setFlashKey((n) => n + 1)
      setPulseKey((n) => n + 1)
      playClick()
    },
    [selected?.id, drag],
  )

  // ---- pointer parallax on the housing ----
  const rawX = useMotionValue(0)
  const rawY = useMotionValue(0)
  const tiltX = useSpring(rawX, { stiffness: 140, damping: 20 })
  const tiltY = useSpring(rawY, { stiffness: 140, damping: 20 })

  const handlePointerMove = (event: React.PointerEvent) => {
    // While a record is in hand the housing holds still — two things moving
    // with the pointer at once reads as drift, not depth.
    if (reduced || drag.dragging || event.pointerType !== 'mouse') return
    const box = stageRef.current?.getBoundingClientRect()
    if (!box) return
    const dx = (event.clientX - (box.left + box.width / 2)) / (box.width / 2)
    const dy = (event.clientY - (box.top + box.height / 2)) / (box.height / 2)
    rawX.set(Math.max(-1, Math.min(1, dx)) * PARALLAX)
    rawY.set(Math.max(-1, Math.min(1, dy)) * PARALLAX)
  }

  const resetParallax = () => {
    rawX.set(0)
    rawY.set(0)
  }

  return (
    <main
      ref={stageRef}
      onPointerMove={handlePointerMove}
      onPointerLeave={resetParallax}
      /* `overflow-x: clip` keeps the turntable's halo from widening the page on
         narrow screens without turning this into a scroll container. */
      className="mx-auto flex min-h-[100svh] w-full max-w-[900px] flex-col items-center justify-center gap-7 overflow-x-clip px-5 py-8 sm:gap-9"
    >
      <div className="relative z-0 w-full max-w-[420px]">
        <ConversationHeader />
      </div>

      {/* Sits above the rest of the stage so a lifted record passes over the
          caption and the crate rather than behind them. */}
      <motion.div
        className="relative z-20"
        style={reduced ? undefined : { x: tiltX, y: tiltY }}
      >
        <Turntable
          mood={selected}
          size={turntableSize}
          recordSize={recordSize}
          rotation={rotation}
          flashKey={flashKey}
          pulseKey={pulseKey}
          drag={drag}
          tonearm={tonearm}
          reduced={reduced}
        />
      </motion.div>

      <div className="relative z-10">
        <SelectedMoodIndicator mood={selected} seated={seated} reduced={reduced} />
      </div>

      <div className="relative z-0">
        <MoodSelector
          moods={MOODS}
          selectedId={selected?.id ?? null}
          size={miniSize}
          onSelect={select}
          reduced={reduced}
        />
      </div>
    </main>
  )
}
