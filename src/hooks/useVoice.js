import { useEffect, useRef, useState } from 'react'

export function useVoice() {
  const [lastPhrase, setLastPhrase] = useState('')
  const [isMisfire, setIsMisfire] = useState(false)
  const [isListening, setIsListening] = useState(false)

  const recognitionRef = useRef(null)
  const restartTimeoutRef = useRef(null)
  const isAbortedRef = useRef(false)
  const isRunningRef = useRef(false)

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition

    if (!SpeechRecognition) {
      console.warn('Speech Recognition not supported on this device')
      return
    }

    const createAndStart = () => {
      // Don't create a new instance if we're already running
      if (isRunningRef.current || isAbortedRef.current) return

      // Always create a fresh instance — Android Chrome requires this
      const recognition = new SpeechRecognition()
      recognition.continuous = false      // Stop-and-restart is stable on Android
      recognition.interimResults = false  // Final results only
      recognition.lang = 'en-US'
      recognition.maxAlternatives = 1

      recognitionRef.current = recognition

      recognition.onstart = () => {
        isRunningRef.current = true
        setIsListening(true)
      }

      recognition.onresult = (event) => {
        for (let i = event.resultIndex; i < event.results.length; i++) {
          if (!event.results[i].isFinal) continue

          const transcript = event.results[i][0].transcript.toLowerCase().trim()

          // Only react if the word "deer" is anywhere in the phrase
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

      recognition.onerror = (event) => {
        isRunningRef.current = false
        setIsListening(false)

        // no-speech is normal — just restart cleanly
        // abort means we stopped on purpose — don't restart
        if (event.error === 'aborted') return

        scheduleRestart()
      }

      recognition.onend = () => {
        isRunningRef.current = false
        setIsListening(false)

        if (!isAbortedRef.current) {
          scheduleRestart()
        }
      }

      try {
        recognition.start()
      } catch (e) {
        isRunningRef.current = false
        scheduleRestart()
      }
    }

    const scheduleRestart = () => {
      if (isAbortedRef.current) return
      if (restartTimeoutRef.current) clearTimeout(restartTimeoutRef.current)
      // 500ms gap between sessions — gives Android time to release the mic
      restartTimeoutRef.current = setTimeout(createAndStart, 500)
    }

    // Kick off the first session
    isAbortedRef.current = false
    scheduleRestart()

    return () => {
      isAbortedRef.current = true
      isRunningRef.current = false
      if (restartTimeoutRef.current) clearTimeout(restartTimeoutRef.current)
      try {
        recognitionRef.current?.abort()
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
