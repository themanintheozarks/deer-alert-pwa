import { useEffect, useRef, useState } from 'react'

export function useVoice() {
  const [lastPhrase, setLastPhrase] = useState('')
  const [isMisfire, setIsMisfire] = useState(false)
  const [isListening, setIsListening] = useState(false)

  const streamRef = useRef(null)
  const analyserRef = useRef(null)
  const animFrameRef = useRef(null)
  const recognitionRef = useRef(null)
  const isRecognizingRef = useRef(false)
  const isAbortedRef = useRef(false)
  const silenceTimerRef = useRef(null)

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognition) {
      console.warn('Speech Recognition not supported')
      return
    }

    // --- Step 1: Get mic stream silently via MediaRecorder ---
    navigator.mediaDevices.getUserMedia({ audio: true, video: false })
      .then(stream => {
        if (isAbortedRef.current) {
          stream.getTracks().forEach(t => t.stop())
          return
        }

        streamRef.current = stream

        // --- Step 2: Set up audio analyser to watch volume levels ---
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)()
        const source = audioCtx.createMediaStreamSource(stream)
        const analyser = audioCtx.createAnalyser()
        analyser.fftSize = 512
        analyser.smoothingTimeConstant = 0.8
        source.connect(analyser)
        analyserRef.current = analyser

        const dataArray = new Uint8Array(analyser.frequencyBinCount)

        // Voice activity threshold — adjust if too sensitive
        const VOICE_THRESHOLD = 18
        // How long silence must last before we consider speech done (ms)
        const SILENCE_DURATION = 1200

        let voiceActive = false

        const checkAudio = () => {
          if (isAbortedRef.current) return

          analyser.getByteFrequencyData(dataArray)

          // Average volume across speech frequency range (300Hz-3kHz)
          const speechBins = dataArray.slice(3, 35)
          const avg = speechBins.reduce((a, b) => a + b, 0) / speechBins.length

          if (avg > VOICE_THRESHOLD) {
            // Voice detected
            if (!voiceActive) {
              voiceActive = true
              // Clear any pending silence timer
              if (silenceTimerRef.current) {
                clearTimeout(silenceTimerRef.current)
                silenceTimerRef.current = null
              }
              // Fire recognition if not already running
              if (!isRecognizingRef.current) {
                runRecognition(SpeechRecognition)
              }
            }
          } else {
            // Silence detected
            if (voiceActive) {
              voiceActive = false
              // Give it SILENCE_DURATION ms of quiet before considering done
              silenceTimerRef.current = setTimeout(() => {
                // Nothing needed here — recognition ends itself
              }, SILENCE_DURATION)
            }
          }

          animFrameRef.current = requestAnimationFrame(checkAudio)
        }

        animFrameRef.current = requestAnimationFrame(checkAudio)
      })
      .catch(err => {
        console.warn('Mic access denied or unavailable:', err)
      })

    const runRecognition = (SpeechRecognition) => {
      if (isRecognizingRef.current || isAbortedRef.current) return
      isRecognizingRef.current = true
      setIsListening(true)

      const recognition = new SpeechRecognition()
      recognition.continuous = false
      recognition.interimResults = false
      recognition.lang = 'en-US'
      recognition.maxAlternatives = 1
      recognitionRef.current = recognition

      recognition.onresult = (event) => {
        for (let i = event.resultIndex; i < event.results.length; i++) {
          if (!event.results[i].isFinal) continue
          const transcript = event.results[i][0].transcript.toLowerCase().trim()

          // Only react if the word "deer" is in the phrase
          if (!transcript.includes('deer')) return

          if (
            transcript.includes('report deer') ||
            transcript.includes('report the deer')
          ) {
            setIsMisfire(false)
            setLastPhrase('report deer')
          } else {
            setIsMisfire(true)
            setLastPhrase(transcript)
          }
        }
      }

      recognition.onerror = () => {
        isRecognizingRef.current = false
        setIsListening(false)
      }

      recognition.onend = () => {
        isRecognizingRef.current = false
        setIsListening(false)
      }

      try {
        recognition.start()
      } catch (e) {
        isRecognizingRef.current = false
        setIsListening(false)
      }
    }

    return () => {
      isAbortedRef.current = true
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current)
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current)
      try { recognitionRef.current?.abort() } catch (e) {}
      try { streamRef.current?.getTracks().forEach(t => t.stop()) } catch (e) {}
    }
  }, [])

  // Clear misfire flag after 10 seconds
  useEffect(() => {
    if (isMisfire) {
      const timeout = setTimeout(() => setIsMisfire(false), 10000)
      return () => clearTimeout(timeout)
    }
  }, [isMisfire])

  return { lastPhrase, isMisfire, isListening }
          }
