import { useEffect, useRef, useState } from 'react'

export function useVoice() {
  const [lastPhrase, setLastPhrase] = useState('')
  const [isMisfire, setIsMisfire] = useState(false)
  const [isListening, setIsListening] = useState(false)
  
  const recognitionRef = useRef(null)
  const interimRef = useRef('')
  const restartTimeoutRef = useRef(null)

  useEffect(() => {
    // Initialize Web Speech API
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    
    if (!SpeechRecognition) {
      console.warn('Speech Recognition not supported')
      return
    }

    const recognition = new SpeechRecognition()
    recognition.continuous = true
    recognition.interimResults = true
    recognition.lang = 'en-US'
    
    recognitionRef.current = recognition

    recognition.onstart = () => {
      setIsListening(true)
      if (restartTimeoutRef.current) clearTimeout(restartTimeoutRef.current)
    }

    recognition.onresult = (event) => {
      let interim = ''
      
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript.toLowerCase().trim()
        
        if (event.results[i].isFinal) {
          // Check for trigger phrase
          if (transcript.includes('report deer') || transcript.includes('report the deer')) {
            setLastPhrase('report deer')
            setIsMisfire(false)
          } else {
            // Misfire: recognized something but not the trigger
            setLastPhrase(transcript)
            setIsMisfire(true)
          }
        } else {
          interim += transcript + ' '
        }
      }
      
      interimRef.current = interim
    }

    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error)
      // Treat errors as misfires
      if (event.error !== 'no-speech') {
        setIsMisfire(true)
      }
      
      // Restart after error
      scheduleRestart()
    }

    recognition.onend = () => {
      setIsListening(false)
      // Restart if it ended for any reason
      scheduleRestart()
    }

    const scheduleRestart = () => {
      if (restartTimeoutRef.current) clearTimeout(restartTimeoutRef.current)
      restartTimeoutRef.current = setTimeout(() => {
        try {
          recognition.start()
        } catch (e) {
          console.log('Recognition already running')
        }
      }, 100)
    }

    // Start listening
    try {
      recognition.start()
    } catch (e) {
      console.log('Recognition start error:', e)
    }

    return () => {
      if (restartTimeoutRef.current) clearTimeout(restartTimeoutRef.current)
      try {
        recognition.abort()
      } catch (e) {
        // Already stopped
      }
    }
  }, [])

  // Clear misfire flag after 10 seconds
  useEffect(() => {
    if (isMisfire) {
      const timeout = setTimeout(() => {
        setIsMisfire(false)
      }, 10000)
      return () => clearTimeout(timeout)
    }
  }, [isMisfire])

  return {
    lastPhrase,
    isMisfire,
    isListening
  }
}
