export type DoodleKind =
  | 'bunny'
  | 'star'
  | 'sparkle'
  | 'heart'
  | 'spiral'
  | 'lightning'
  | 'smiley'
  | 'deadSmiley'
  | 'peace'
  | 'squiggle'
  | 'note'
  | 'mushroom'
  | 'wave'
  | 'flower'

/** A doodle pinned to a spot on the record face, in percentage coordinates. */
export type DoodleMark = {
  kind: DoodleKind
  /** Center of the doodle as a percentage of the record's box. */
  x: number
  y: number
  /** Size as a percentage of the record's diameter. */
  size: number
  rotate?: number
}

/** How the screen reacts in the instant one record replaces another. */
export type FlashKind = 'warm' | 'shimmer' | 'brightness' | 'glow'

export type Mood = {
  id: string
  /** Display name, e.g. "Bad Bunny". */
  name: string
  /** Same as `name` here, kept separate so a record could be titled by track later. */
  artist: string
  /** Words scrawled on the record face — one array entry per handwritten line. */
  lines: string[]
  /** The record's own surface, a layered CSS background. */
  gradient: string
  /** The mood's signature colour, used for glows and flashes. */
  accent: string
  /** A brighter partner to `accent`, for the specular highlight. */
  highlight: string
  /** How the transition into this mood flashes. */
  flash: FlashKind
  /** Degrees the handwriting is tilted off-axis. */
  labelRotate: number
  doodles: DoodleMark[]
}

/**
 * Each record's face is built from three stacked layers:
 *   1. a soft white specular bloom, offset up-left, for the wet-plastic sheen
 *   2. a conic sweep that gives the disc its iridescent, pressed-plastic banding
 *   3. the mood's own radial gradient, which supplies the actual colour
 * Layer 2 is what keeps these from reading as flat coloured circles.
 */
const face = (radial: string, conic: string) =>
  [
    'radial-gradient(circle at 46% 34%, rgba(255,255,255,0.42), rgba(255,255,255,0) 30%)',
    conic,
    radial,
  ].join(', ')

/**
 * The blank house record. Its specular bloom is deliberately weaker than a
 * coloured record's — at full strength a near-white disc stops reading as a
 * flat pressing and starts looking like a dome.
 */
export const NEUTRAL_GRADIENT = [
  'radial-gradient(circle at 46% 34%, rgba(255,255,255,0.18), rgba(255,255,255,0) 24%)',
  `conic-gradient(from 210deg,
     rgba(255,255,255,0.62) 0deg,
     rgba(176,176,171,0.40) 46deg,
     rgba(255,255,255,0.66) 94deg,
     rgba(184,184,179,0.34) 150deg,
     rgba(255,255,255,0.55) 206deg,
     rgba(172,172,167,0.42) 260deg,
     rgba(255,255,255,0.64) 312deg,
     rgba(255,255,255,0.62) 360deg)`,
  'radial-gradient(circle at 35% 30%, #FFFFFF, #EDEDE8 50%, #D8D8D2 100%)',
].join(', ')

/** The conic banding used over coloured records — light on top, shadow between. */
const sheen = (from: number) => `conic-gradient(from ${from}deg,
   rgba(255,255,255,0.30) 0deg,
   rgba(0,0,0,0.26) 44deg,
   rgba(255,255,255,0.34) 92deg,
   rgba(0,0,0,0.20) 148deg,
   rgba(255,255,255,0.26) 200deg,
   rgba(0,0,0,0.28) 256deg,
   rgba(255,255,255,0.32) 310deg,
   rgba(255,255,255,0.30) 360deg)`

export const MOODS: Mood[] = [
  {
    id: 'bad-bunny',
    name: 'Bad Bunny',
    artist: 'Bad Bunny',
    lines: ['Bad', 'Bunny'],
    gradient: face(
      'radial-gradient(circle at 30% 30%, #FFF4A3, #E8C832 35%, #8D7918 70%, #30301C 100%)',
      sheen(200),
    ),
    accent: '#E8C832',
    highlight: '#FFF1A0',
    flash: 'warm',
    labelRotate: -8,
    doodles: [
      { kind: 'bunny', x: 26, y: 27, size: 22, rotate: -12 },
      { kind: 'sparkle', x: 72, y: 62, size: 12, rotate: 8 },
      { kind: 'heart', x: 66, y: 82, size: 10, rotate: 12 },
      { kind: 'star', x: 18, y: 66, size: 9, rotate: -6 },
    ],
  },
  {
    id: 'dua-lipa',
    name: 'Dua Lipa',
    artist: 'Dua Lipa',
    lines: ['Dua', 'Lipa'],
    gradient: face(
      'radial-gradient(circle at 35% 30%, #FF6B55, #F42E3D 35%, #C30B52 65%, #7A0B4B 100%)',
      sheen(150),
    ),
    accent: '#F42E3D',
    highlight: '#FF9C7E',
    flash: 'brightness',
    labelRotate: -6,
    doodles: [
      { kind: 'star', x: 70, y: 24, size: 12, rotate: 10 },
      { kind: 'heart', x: 74, y: 58, size: 12, rotate: -8 },
      { kind: 'sparkle', x: 24, y: 70, size: 11, rotate: 14 },
      { kind: 'squiggle', x: 30, y: 22, size: 14, rotate: -18 },
    ],
  },
  {
    id: 'sza',
    name: 'SZA',
    artist: 'SZA',
    lines: ['SZA'],
    gradient: face(
      'radial-gradient(circle at 30% 30%, #FFB9FA, #EF62E8 35%, #B52CBF 65%, #6E1A86 100%)',
      sheen(260),
    ),
    accent: '#EF62E8',
    highlight: '#FFC9F8',
    flash: 'shimmer',
    labelRotate: -7,
    doodles: [
      { kind: 'star', x: 22, y: 34, size: 13, rotate: -10 },
      { kind: 'heart', x: 79, y: 55, size: 10, rotate: 10 },
      { kind: 'wave', x: 46, y: 79, size: 34, rotate: -4 },
      { kind: 'sparkle', x: 72, y: 26, size: 10, rotate: 6 },
    ],
  },
  {
    id: 'earth-wind-fire',
    name: 'Earth, Wind & Fire',
    artist: 'Earth, Wind & Fire',
    lines: ['Earth,', 'Wind', '& Fire'],
    gradient: face(
      'radial-gradient(circle at 30% 30%, #FFB23D, #FF4C18 35%, #ED2116 65%, #B80D12 100%)',
      sheen(115),
    ),
    accent: '#FF4C18',
    highlight: '#FFD08A',
    flash: 'warm',
    labelRotate: -9,
    doodles: [
      { kind: 'peace', x: 21, y: 55, size: 17, rotate: -8 },
      { kind: 'sparkle', x: 78, y: 62, size: 12, rotate: 12 },
      { kind: 'star', x: 74, y: 30, size: 9, rotate: -14 },
      { kind: 'squiggle', x: 55, y: 87, size: 20, rotate: 4 },
    ],
  },
  {
    id: 'fred-again',
    name: 'Fred again..',
    artist: 'Fred again..',
    lines: ['Fred', 'again..'],
    gradient: face(
      'radial-gradient(circle at 30% 30%, #4779B8, #174D89 40%, #102F5C 70%, #071C3A 100%)',
      sheen(320),
    ),
    accent: '#174D89',
    highlight: '#7FB0E4',
    flash: 'brightness',
    labelRotate: -7,
    doodles: [
      { kind: 'smiley', x: 74, y: 34, size: 14, rotate: 8 },
      { kind: 'wave', x: 50, y: 24, size: 26, rotate: -6 },
      { kind: 'note', x: 24, y: 64, size: 13, rotate: -12 },
      { kind: 'sparkle', x: 76, y: 70, size: 10, rotate: 16 },
    ],
  },
  {
    id: 'mgmt',
    name: 'MGMT',
    artist: 'MGMT',
    lines: ['MGMT'],
    gradient: face(
      'radial-gradient(circle at 30% 30%, #53F4D4, #19CFC5 35%, #078EAD 65%, #075C86 100%)',
      sheen(75),
    ),
    accent: '#19CFC5',
    highlight: '#9DFCEA',
    flash: 'glow',
    labelRotate: -6,
    doodles: [
      { kind: 'spiral', x: 72, y: 24, size: 17, rotate: 6 },
      { kind: 'mushroom', x: 76, y: 74, size: 15, rotate: -8 },
      { kind: 'lightning', x: 22, y: 62, size: 15, rotate: -10 },
      { kind: 'flower', x: 26, y: 26, size: 13, rotate: 12 },
    ],
  },
]
