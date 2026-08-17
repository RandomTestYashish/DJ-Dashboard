/**
 * Every dimension of the player, derived from the viewport.
 *
 * These are real numbers rather than CSS because the records are positioned in
 * stage coordinates — the player and the records have to agree on exactly how
 * big a record is and where the platter sits, and only one of them can own
 * that arithmetic.
 */
export type PlayerLayout = {
  compact: boolean
  width: number
  height: number
  /** The raised top surface carrying the platter and the tonearm. */
  deckHeight: number
  /** The fabric-covered front panel. */
  grilleHeight: number
  platterSize: number
  platterCx: number
  platterCy: number
  /** Diameter of the record itself — smaller than the platter, so a rim shows. */
  vinylSize: number
  /** Size a record is drawn at while stored in the collection. */
  collectionSize: number
  armBaseX: number
  armBaseY: number
  armTipX: number
  armTipY: number
  /** The volume knob and the smaller selector beside it. */
  knobSize: number
  knobCx: number
  dialSize: number
  dialCx: number
}

export function playerLayout(viewportWidth: number): PlayerLayout {
  const compact = viewportWidth <= 480

  const width = compact ? viewportWidth - 32 : Math.min(700, viewportWidth - 40)

  // The spec's mobile figures — a 2.2:1 body and a 160px platter — cannot both
  // hold: at that ratio the whole body is barely 160px tall. The body is given
  // a little more height on small screens so the platter stays a real target
  // and the player still reads as the hero.
  const height = width / (compact ? 1.85 : 2.2)

  const grilleHeight = height * 0.28
  const deckHeight = height - grilleHeight

  // Leaves the platter breathing room top and bottom rather than filling the
  // deck edge to edge, which reads as cramped at small sizes.
  const platterSize = deckHeight * 0.82
  const platterCx = width * 0.29
  const platterCy = deckHeight / 2

  return {
    compact,
    width,
    height,
    deckHeight,
    grilleHeight,
    platterSize,
    platterCx,
    platterCy,
    vinylSize: Math.round(platterSize * 0.88),
    collectionSize: compact ? 52 : 68,
    armBaseX: width * 0.545,
    armBaseY: deckHeight * 0.22,
    // Rests over the record's outer groove, never across the label.
    armTipX: platterCx + platterSize * 0.36,
    armTipY: platterCy - platterSize * 0.17,
    knobSize: deckHeight * 0.26,
    knobCx: width * 0.775,
    dialSize: deckHeight * 0.17,
    dialCx: width * 0.888,
  }
}
