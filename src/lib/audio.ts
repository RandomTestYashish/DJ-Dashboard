/**
 * A single, very quiet mechanical click — the sound of a record being set
 * down. Synthesised on demand so the app ships no audio files, and silently
 * inert if the browser refuses to hand us an AudioContext.
 *
 * Nothing here ever plays music, and nothing plays until the visitor has
 * clicked, which satisfies autoplay policies by construction.
 */

let ctx: AudioContext | null = null
let unavailable = false

function getContext(): AudioContext | null {
  if (unavailable) return null
  try {
    if (!ctx) {
      const Ctor = window.AudioContext ?? (window as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
      if (!Ctor) {
        unavailable = true
        return null
      }
      ctx = new Ctor()
    }
    if (ctx.state === 'suspended') void ctx.resume()
    return ctx
  } catch {
    unavailable = true
    return null
  }
}

export function playClick(volume = 0.05) {
  const audio = getContext()
  if (!audio) return

  try {
    const now = audio.currentTime

    // A short noise burst shaped into a tick: the physical part of the sound.
    const frames = Math.floor(audio.sampleRate * 0.05)
    const noise = audio.createBuffer(1, frames, audio.sampleRate)
    const data = noise.getChannelData(0)
    for (let i = 0; i < frames; i++) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / frames) ** 6
    }

    const source = audio.createBufferSource()
    source.buffer = noise

    const bandpass = audio.createBiquadFilter()
    bandpass.type = 'bandpass'
    bandpass.frequency.value = 1900
    bandpass.Q.value = 1.1

    const gain = audio.createGain()
    gain.gain.setValueAtTime(volume, now)
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.06)

    source.connect(bandpass).connect(gain).connect(audio.destination)
    source.start(now)
    source.stop(now + 0.06)

    // A low thud underneath, so the click lands rather than just ticking.
    const thud = audio.createOscillator()
    thud.type = 'sine'
    thud.frequency.setValueAtTime(160, now)
    thud.frequency.exponentialRampToValueAtTime(60, now + 0.09)

    const thudGain = audio.createGain()
    thudGain.gain.setValueAtTime(volume * 0.8, now)
    thudGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.11)

    thud.connect(thudGain).connect(audio.destination)
    thud.start(now)
    thud.stop(now + 0.12)
  } catch {
    unavailable = true
  }
}
