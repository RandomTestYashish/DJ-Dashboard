import { motion, useMotionValue, useReducedMotion, useSpring } from 'framer-motion'
import { useCallback, useRef, useState } from 'react'
import { ConversationHeader } from './components/ConversationHeader'
import { MoodSelector } from './components/MoodSelector'
import { SelectedMoodIndicator } from './components/SelectedMoodIndicator'
import { Turntable } from './components/Turntable'
import { MOODS, type Mood } from './data/moods'
import { playClick } from './lib/audio'
import { useMediaQuery } from './lib/useMediaQuery'
import { useRecordSpin } from './lib/useRecordSpin'

/** Furthest the turntable leans toward the pointer, in px. */
const PARALLAX = 3

export default function App() {
  const reduced = useReducedMotion() ?? false
  const compact = useMediaQuery('(max-width: 420px)')

  const [selected, setSelected] = useState<Mood | null>(null)
  const [swapCount, setSwapCount] = useState(0)

  const turntableSize = compact ? 270 : 320
  const recordSize = Math.round(turntableSize * 0.78)
  const miniSize = compact ? 60 : 68

  const rotation = useRecordSpin(selected !== null, selected?.id ?? null, !reduced)

  const select = useCallback(
    (mood: Mood) => {
      // Re-picking the record already playing would fly it out and back for no
      // reason, so treat it as a no-op.
      if (mood.id === selected?.id) return
      setSelected(mood)
      setSwapCount((n) => n + 1)
      playClick()
    },
    [selected?.id],
  )

  // ---- pointer parallax on the housing ----
  const stageRef = useRef<HTMLDivElement>(null)
  const rawX = useMotionValue(0)
  const rawY = useMotionValue(0)
  const tiltX = useSpring(rawX, { stiffness: 140, damping: 20 })
  const tiltY = useSpring(rawY, { stiffness: 140, damping: 20 })

  const handlePointerMove = (event: React.PointerEvent) => {
    if (reduced || event.pointerType !== 'mouse') return
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
      <div className="w-full max-w-[420px]">
        <ConversationHeader />
      </div>

      <motion.div style={reduced ? undefined : { x: tiltX, y: tiltY }}>
        <Turntable
          mood={selected}
          size={turntableSize}
          recordSize={recordSize}
          rotation={rotation}
          swapCount={swapCount}
          reduced={reduced}
        />
      </motion.div>

      <SelectedMoodIndicator mood={selected} reduced={reduced} />

      <MoodSelector
        moods={MOODS}
        selectedId={selected?.id ?? null}
        size={miniSize}
        onSelect={select}
        reduced={reduced}
      />
    </main>
  )
}
