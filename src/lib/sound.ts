// Web Audio API helper for continuous beeping sound
let audioCtx: AudioContext | null = null
let beepInterval: any = null

export const soundManager = {
  startContinuousBeep() {
    this.stopBeep() // Ensure clean state

    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext
      if (!AudioContextClass) return

      audioCtx = new AudioContextClass()

      const playBeep = () => {
        if (!audioCtx) return
        if (audioCtx.state === 'suspended') {
          audioCtx.resume()
        }

        const osc = audioCtx.createOscillator()
        const gain = audioCtx.createGain()

        osc.type = 'sine'
        osc.frequency.setValueAtTime(880, audioCtx.currentTime) // A5 note (high pitch beep)
        
        // Envelope: 0.1s duration
        gain.gain.setValueAtTime(0.3, audioCtx.currentTime)
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.25)

        osc.connect(gain)
        gain.connect(audioCtx.destination)

        osc.start()
        osc.stop(audioCtx.currentTime + 0.25)
      }

      // Play double beep immediately
      playBeep()
      setTimeout(playBeep, 200)

      // Repeat every 1.5 seconds
      beepInterval = setInterval(() => {
        playBeep()
        setTimeout(playBeep, 200)
      }, 1500)
    } catch (e) {
      console.warn('[Sound] Web Audio API failed to start:', e)
    }
  },

  stopBeep() {
    if (beepInterval) {
      clearInterval(beepInterval)
      beepInterval = null
    }
    if (audioCtx) {
      try {
        audioCtx.close()
      } catch (e) {}
      audioCtx = null
    }
  }
}
