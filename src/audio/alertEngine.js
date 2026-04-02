// Web Audio API alert system for proximity alerts
// Generates synthetic sonar blips with frequency stacking for multiple pins

let audioContext = null
let oscillators = []
let gainNode = null
let isMuted = false

export function initAudioContext() {
  if (!audioContext) {
    audioContext = new (window.AudioContext || window.webkitAudioContext)()
    gainNode = audioContext.createGain()
    gainNode.connect(audioContext.destination)
    gainNode.volume = 0.5
  }
  return audioContext
}

export function startProximityAlert(pinsInRange, userPos) {
  if (isMuted || !pinsInRange || pinsInRange.length === 0) {
    stopProximityAlert()
    return
  }

  initAudioContext()
  stopProximityAlert() // Clear any existing oscillators

  // Calculate closest pin distance for speed modulation
  const distances = pinsInRange.map(pin => {
    const dx = pin.lat - userPos.lat
    const dy = pin.lng - userPos.lng
    return Math.sqrt(dx * dx + dy * dy)
  })

  const minDistance = Math.min(...distances)
  
  // Speed increases as distance decreases (0.5 Hz to 4 Hz)
  // Closer = faster blips
  const minDist = 0.0001 // Very close in degrees
  const maxDist = 0.005 // Far away
  const normalizedDist = Math.max(minDist, Math.min(maxDist, minDistance))
  const blipSpeed = 0.5 + (1 - (normalizedDist - minDist) / (maxDist - minDist)) * 3.5

  // Create oscillators for each pin
  for (let i = 0; i < Math.min(pinsInRange.length, 5); i++) {
    const baseFreq = 440 + (i * 80) // 440Hz, 520Hz, 600Hz, etc.
    const osc = audioContext.createOscillator()
    const env = audioContext.createGain()

    osc.frequency.value = baseFreq
    osc.connect(env)
    env.connect(gainNode)

    // Sonar pulse envelope: quick attack, exponential decay
    const now = audioContext.currentTime
    const pulseDuration = 0.15
    
    const pulseInterval = 1 / blipSpeed
    
    // Animate envelope over time
    const scheduleBeeps = () => {
      let currentTime = audioContext.currentTime
      
      while (currentTime < audioContext.currentTime + 2) {
        const phaseInPulse = currentTime % pulseInterval
        const isActive = phaseInPulse < pulseDuration
        
        if (isActive) {
          // Pulse envelope: triangle wave for attack-decay
          const progress = phaseInPulse / pulseDuration
          const attackGain = Math.min(1, progress * 2)
          const decayGain = Math.max(0, 1 - (progress - 0.5) * 2)
          env.gain.setValueAtTime(
            Math.min(attackGain, decayGain) * (1 - i * 0.15),
            currentTime
          )
        } else {
          env.gain.setValueAtTime(0, currentTime)
        }
        
        currentTime += 0.01
      }
    }

    // Start oscillator and schedule pulses
    osc.start(audioContext.currentTime)
    env.gain.setValueAtTime(0, audioContext.currentTime)
    scheduleBeeps()

    oscillators.push(osc)
    oscillators.push(env)
  }
}

export function stopProximityAlert() {
  oscillators.forEach(osc => {
    try {
      if (osc && osc.stop) {
        osc.stop(audioContext.currentTime + 0.1)
      }
    } catch (e) {
      // Already stopped
    }
  })
  oscillators = []
}

export function muteAudio(mute = true) {
  isMuted = mute
  if (mute) {
    stopProximityAlert()
  }
}

export function setAudioVolume(volume) {
  if (gainNode) {
    gainNode.gain.value = Math.max(0, Math.min(1, volume))
  }
}
