/**
 * The engine, if you ask for it.
 *
 * Off by default and deliberately **not** remembered between visits: a stored
 * "on" would try to make noise on the next load before any gesture exists, and
 * a résumé page that starts talking to you in an open-plan office is worse
 * than one with no sound at all. The context is therefore only ever built
 * inside the toggle's own click handler.
 *
 * Two oscillators an octave apart through a lowpass, plus a little filtered
 * noise for tyre roar. Nothing here is sampled — it is all synthesised, so it
 * costs no download and needs no dependency.
 */

const IDLE_HZ = 34
const REV_HZ = 116

export function createEngineAudio() {
  const Ctx =
    typeof window !== 'undefined' &&
    (window.AudioContext || window.webkitAudioContext)
  if (!Ctx) return null

  let ctx
  try {
    ctx = new Ctx()
  } catch {
    return null
  }

  const master = ctx.createGain()
  master.gain.value = 0
  master.connect(ctx.destination)

  // The engine note itself: a saw an octave below a square, softened.
  const tone = ctx.createGain()
  tone.gain.value = 0.5
  const lowpass = ctx.createBiquadFilter()
  lowpass.type = 'lowpass'
  lowpass.frequency.value = 620
  lowpass.Q.value = 6
  tone.connect(lowpass)
  lowpass.connect(master)

  const low = ctx.createOscillator()
  low.type = 'sawtooth'
  low.frequency.value = IDLE_HZ
  const lowGain = ctx.createGain()
  lowGain.gain.value = 0.55
  low.connect(lowGain)
  lowGain.connect(tone)

  const high = ctx.createOscillator()
  high.type = 'square'
  high.frequency.value = IDLE_HZ * 2
  const highGain = ctx.createGain()
  highGain.gain.value = 0.12
  high.connect(highGain)
  highGain.connect(tone)

  // Tyre and wind noise, which follows speed rather than revs.
  const noiseSeconds = 2
  const buffer = ctx.createBuffer(
    1,
    ctx.sampleRate * noiseSeconds,
    ctx.sampleRate
  )
  const channel = buffer.getChannelData(0)
  // Deterministic pseudo-noise: no Math.random, so the buffer is reproducible.
  let seed = 8675309
  for (let i = 0; i < channel.length; i += 1) {
    seed = (seed * 1103515245 + 12345) % 2147483648
    channel[i] = (seed / 1073741824 - 1) * 0.6
  }
  const noise = ctx.createBufferSource()
  noise.buffer = buffer
  noise.loop = true
  const noiseBand = ctx.createBiquadFilter()
  noiseBand.type = 'bandpass'
  noiseBand.frequency.value = 420
  noiseBand.Q.value = 0.7
  const noiseGain = ctx.createGain()
  noiseGain.gain.value = 0
  noise.connect(noiseBand)
  noiseBand.connect(noiseGain)
  noiseGain.connect(master)

  low.start()
  high.start()
  noise.start()

  let closed = false

  return {
    /** Exposed so a caller can assert the graph is live without hearing it. */
    context: ctx,

    /**
     * Ramp the master gain up. Resolves to whether sound is actually playing:
     * a browser can refuse to resume (no user activation, or a policy block),
     * and a toggle that reports "on" while silent is worse than one that
     * admits it could not start.
     */
    async enable() {
      if (closed) return false
      try {
        if (ctx.state !== 'running') await ctx.resume()
      } catch {
        return false
      }
      if (closed || ctx.state !== 'running') return false
      master.gain.setTargetAtTime(0.09, ctx.currentTime, 0.25)
      return true
    },

    disable() {
      if (closed) return
      master.gain.setTargetAtTime(0, ctx.currentTime, 0.12)
    },

    /**
     * Stop the graph while nobody is listening, and pick it up again after.
     *
     * `disable()` is the wrong tool for this: it ramps the gain to silence but
     * leaves the context running, so a hidden tab would still be doing the
     * work. `update()` stops on its own when `requestAnimationFrame` pauses,
     * which is worse than it sounds — the oscillators simply hold whatever revs
     * they were last given. Suspending stops the clock instead.
     *
     * Deliberately separate from enable/disable so the toggle's own state is
     * never touched: coming back to the tab must restore what the visitor
     * chose, not decide for them.
     */
    async pause() {
      if (closed) return
      try {
        if (ctx.state === 'running') await ctx.suspend()
      } catch {
        // Nothing to do — a context that will not suspend is still silent-ish.
      }
    },

    async unpause() {
      if (closed) return false
      try {
        if (ctx.state === 'suspended') await ctx.resume()
      } catch {
        return false
      }
      return !closed && ctx.state === 'running'
    },

    /**
     * Follow the simulation. Driven from `drive.subscribe`, so this runs at
     * frame rate — it must only touch AudioParams, never React state.
     */
    update(sim) {
      if (closed || ctx.state !== 'running') return
      const t = ctx.currentTime
      const revs = Math.max(0, Math.min(1, sim.rpm))
      const hz = IDLE_HZ + (REV_HZ - IDLE_HZ) * revs
      low.frequency.setTargetAtTime(hz, t, 0.08)
      high.frequency.setTargetAtTime(hz * 2, t, 0.08)
      lowpass.frequency.setTargetAtTime(500 + revs * 1600, t, 0.1)

      const speed = Math.max(0, Math.min(1, sim.speed / 42))
      noiseGain.gain.setTargetAtTime(speed * 0.05, t, 0.2)
    },

    close() {
      if (closed) return
      closed = true
      try {
        low.stop()
        high.stop()
        noise.stop()
        ctx.close()
      } catch {
        // Already torn down by the browser; nothing useful to do.
      }
    },
  }
}
