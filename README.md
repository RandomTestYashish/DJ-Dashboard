# Set the Mood

An interactive record player. Two chat bubbles hand you the aux cord, an
off-white all-in-one player sits with its platter bare, and a collection of six
hand-scrawled records waits underneath.

Pick any record up with the mouse or a finger and carry it to the player. As it
nears the platter the platter draws it in; release it and it beds down, the
copper tonearm swings over, and the record starts turning. Lift the playing
record off and the arm gets out of the way while the record is still in your
hand. Set a record down anywhere else and it stays there until you come back
for it.

```bash
npm install
npm run dev
```

Then open the printed URL (http://localhost:5173 by default).

## How it works

**A record is one object that moves, not three widgets.** Every record — stored,
playing, or set down on the table — is the same `DraggableVinyl`. Its position
comes from a single placement (`collection`, `platter`, or `loose`) rather than
from where it sits in the DOM, so a record never changes parent as it moves and
nothing can reparent mid-drag and drop the pointer. There is one drag
implementation, not one per record.

**Motion values live outside the component tree.** Records at rest paint below
the tonearm so the arm lies over the one on the platter; the record in your hand
paints above it, because you are holding it. That means the component remounts
into a different layer mid-drag. `lib/vinylMotion.ts` keeps each record's
position and scale outside React, so the swap is invisible instead of snapping
the record back to a fresh zero.

**The drop zone is the platter, not the player.** `lib/useStageGeometry.ts`
measures the platter and every collection socket relative to the stage, so the
test is whether the *record's centre* is inside the platter's radius — a record
half over the cabinet is not over the platter. A `ResizeObserver` re-measures on
reflow, so the geometry survives a resize.

**The magnet is a fraction, never a snap.** Past 80px the platter pulls not at
all; from 80px to 40px it pulls gently; inside 40px it pulls harder. Because the
pull is a proportion of the remaining distance rather than a lock, the record
always stays on the pointer and can be drawn back off.

**Pointer capture is asked for but never assumed.** If the browser refuses it,
window listeners supply the moves, and a window `pointerup` guard ends the drag
wherever the pointer comes up — a record can never end up stuck to the cursor.
Teardown runs on unmount too.

**The tonearm is a state machine, not a CSS guess.** `lib/useTonearmState.ts`
holds `playing → lifting → resting → returning`, and the pending transition is
cleared on every change, so exactly one is ever queued. That is what makes a
fast in-out-in flick behave. The arm reacts *while* a record is in hand, not
after release. Going out is a plain ease; coming back is a spring damped to
overshoot by about two degrees, so the stylus settles rather than clicks.

**The spin is integrated, not looped.** `lib/useRecordSpin.ts` accumulates an
angle every frame instead of replaying a 0→360° keyframe, so the platter can
change speed mid-turn without a seam. Lifting a record off coasts it down over
about a third of a second rather than stopping it dead.

**Nothing is fetched at runtime.** The player, the records and every doodle are
CSS gradients and inline SVG; Inter and Caveat are bundled from npm. No image
files, no icon sprites, no font CDN.

## Structure

```
src/
  App.tsx                       state, layout, the two paint layers
  data/moods.ts                 the six records: gradients, doodles, flash
  lib/
    playerLayout.ts             every dimension of the player, from the viewport
    useStageGeometry.ts         where the platter and the sockets are
    useVinylStage.ts            placements, pointer dragging, the magnet
    vinylMotion.ts              per-record motion values, held outside React
    useTonearmState.ts          playing / lifting / resting / returning
    useRecordSpin.ts            the platter's rotation
    motion.ts                   springs and easings
    useViewportWidth.ts         drives the player's proportions
    audio.ts                    synthesised click, degrades to silence
  components/
    ConversationHeader.tsx      the two opening bubbles
    Player.tsx                  cabinet, deck, platter, controls, grille
    Tonearm.tsx                 the copper arm
    DraggableVinyl.tsx          one record, wherever it is
    VinylRecord.tsx             one record face
    VinylLabel.tsx              handwriting and doodle placement
    VinylCollection.tsx         the sleeves the records are stored in
    SelectedMoodIndicator.tsx   caption, and the live region for screen readers
    doodles/Doodles.tsx         hand-drawn SVG scribbles
```

## Accessibility

- Dragging is never the only way in. Every record is a real `<button>`; Enter or
  Space puts it on the player or returns it to its sleeve, running the same
  tonearm sequence. There is exactly one tab stop per record.
- Each record's label says where it is and what pressing it will do, so the
  state is never carried by position alone.
- Focus shows a warm neutral ring on `:focus-visible` only — no bright blue.
- The caption under the player is an `aria-live` region and reports all four
  states: idle, holding, ready to drop, and playing.
- Under `prefers-reduced-motion: reduce` the platter does not spin and records
  change place instantly. Dragging still works — it is direct manipulation, not
  decoration — but the tilt, the settle and the arm's travel are dropped.

## Sound

Picking up or setting down a record plays a synthesised tick at 5% volume — a
filtered noise burst over a short low thud, built with the Web Audio API. It is
created on the first interaction, so it never trips autoplay policies, and if an
`AudioContext` cannot be obtained it disables itself. No music is ever played,
and the interface is fully functional in silence.

## A note on the mobile figures

The brief asked for a 2.2:1 body and a 160px platter on mobile. Those cannot
both hold — at that ratio the whole cabinet is barely 160px tall. Small screens
use a slightly taller body so the platter stays a real drop target and the
player still reads as the hero. See `lib/playerLayout.ts`.
