import { useEffect, useRef, useState } from 'react'

export function useVoice() {
  const [lastPhrase, setLastPhrase] = useState('')
  const [isMisfire, setIsMisfire] = useState(false)
  const [isListening, setIsListening] = useState(false)

  const recognitionRef = useRef(null)
  const restartTimeoutRef = useRef(null)

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition

    if (!SpeechRecognition) {
      console.warn('Speech Recognition not supported')
      return
    }

    const recognition = new SpeechRecognition()
    recognition.continuous = true
    recognition.interimResults = false
    recognition.lang = 'en-US'

    recognitionRef.current = recognition

    recognition.onstart = () => {
      setIsListening(true)
      if (restartTimeoutRef.current) clearTimeout(restartTimeoutRef.current)
    }

    recognition.onresult = (event) => {
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (!event.results[i].isFinal) continue

        const transcript = event.results[i][0].transcript.toLowerCase().trim()

        // ONLY react if the word "deer" is in the phrase
        if (!transcript.includes('deer')) return

        if (transcript.includes('report deer') || transcript.includes('report the deer')) {
          // Correct trigger — drop a real pin
          setIsMisfire(false)
          setLastPhrase('report deer')
        } else {
          // Contains "deer" but wrong phrase — misfire pin
          setIsMisfire(true)
          setLastPhrase(transcript)
        }
      }
    }

    recognition.onerror = (event) => {
      // Only restart on recoverable errors, never drop a misfire pin for errors
      if (event.error === 'no-speech' || event.error === 'audio-capture' || event.error === 'network') {
        scheduleRestart()
      }
    }

    recognition.onend = () => {
      setIsListening(false)
      scheduleRestart()
    }

    const scheduleRestart = () => {
      if (restartTimeoutRef.current) clearTimeout(restartTimeoutRef.current)
      restartTimeoutRef.current = setTimeout(() => {
        try {
          recognition.start()
        } catch (e) {
          // Already running
        }
      }, 300)
    }

    try {
      recognition.start()
    } catch (e) {
      console.log('Recognition start error:', e)
    }

    return () => {
      if (restartTimeoutRef.current) clearTimeout(restartTimeoutRef.current)
      try {
        recognition.abort()
      } catch (e) {}
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
