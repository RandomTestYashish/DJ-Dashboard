# Set the Mood

An interactive DJ mood picker. Two chat bubbles hand you the aux cord, a
turntable waits with a blank record on it, and a crate of six hand-scrawled
records sits underneath. Pick one and it lifts out of the crate, flies onto the
platter and starts spinning; pick another and the first one flies back to the
slot it came from.

```bash
npm install
npm run dev
```

Then open the printed URL (http://localhost:5173 by default).

## How it works

**The records are the buttons.** There is no chrome around them — each record is
a `<button>` whose only content is the record itself.

**One record, two homes.** A record renders in exactly one place at a time:
its slot in the crate, or the platter. Both render it under the same Framer
Motion `layoutId` (`lib/motion.ts`), so Framer treats the two as the same
object and animates the real distance between them. That is what produces the
flight, and why the slot it leaves behind stays empty rather than reflowing the
grid.

**The spin is integrated, not looped.** `lib/useRecordSpin.ts` accumulates an
angle every animation frame instead of replaying a 0→360° keyframe. Speed is a
value that decays toward cruising, so the kick a record gets on landing reads as
the platter catching up — no snap back to zero when the speed changes.

**Every mood swaps differently.** Each entry in `data/moods.ts` names a `flash`
(`warm`, `shimmer`, `brightness`, `glow`) that decides how the housing lights up
in the instant the record lands, so yellow → red does not feel like pink → cyan.

**Nothing is fetched at runtime.** Every record face is CSS gradients, every
doodle is an inline SVG path, and Inter and Caveat are bundled from npm. No
image files, no icon sprites, no font CDN.

## Structure

```
src/
  App.tsx                       state, layout, pointer parallax
  data/moods.ts                 the six records: gradients, doodles, flash
  lib/
    motion.ts                   springs, easings, shared layout ids
    useRecordSpin.ts            the platter's rotation
    useMediaQuery.ts            desktop / compact sizing
    audio.ts                    synthesised click, degrades to silence
  components/
    ConversationHeader.tsx      the two opening bubbles
    Turntable.tsx               platter, swap choreography, mood flash
    TurntableBody.tsx           the housing and its milled recess
    VinylRecord.tsx             one record face, shared by platter and crate
    VinylLabel.tsx              handwriting and doodle placement
    Tonearm.tsx                 the arm that swings in when a record plays
    MoodSelector.tsx            the crate grid
    MoodVinyl.tsx               one record in the crate
    SelectedMoodIndicator.tsx   caption, and the live region for screen readers
    doodles/Doodles.tsx         hand-drawn SVG scribbles
```

## Accessibility

- Every record is a real `<button>` labelled `Play <artist>`, with `aria-pressed`
  tracking what is on the platter. Tab, Enter and Space all work, and there is
  exactly one tab stop per record.
- Focus shows a warm neutral ring on `:focus-visible` only, and the focused
  record lifts the same way a hovered one does.
- The caption under the turntable is an `aria-live` region, so the swap is
  announced without needing to see it.
- Under `prefers-reduced-motion: reduce` the platter does not spin, records
  change place instantly, and the flash and pulse are skipped. Only opacity and
  colour still move.

## Sound

Clicking a record plays a synthesised tick at 5% volume — a filtered noise burst
over a short low thud, built with the Web Audio API. It is created on the first
click, so it never trips autoplay policies, and if an `AudioContext` cannot be
obtained it disables itself. No music is ever played, and the interface is fully
functional in silence.
