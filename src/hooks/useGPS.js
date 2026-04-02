import { useEffect, useRef, useState } from 'react'

export function useGPS() {
  const [position, setPosition] = useState({
    lat: 40.7128,
    lng: -74.0060,
    heading: 0,
    accuracy: null
  })
  
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const watchIdRef = useRef(null)
  const lastUpdateRef = useRef(0)

  useEffect(() => {
    // Track online/offline status
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)
    
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    // Start GPS watch
    if ('geolocation' in navigator) {
      const options = {
        enableHighAccuracy: true,
        maximumAge: 0,
        timeout: Infinity
      }

      watchIdRef.current = navigator.geolocation.watchPosition(
        (geoPos) => {
          const now = Date.now()
          // Throttle to 750ms minimum between updates
          if (now - lastUpdateRef.current >= 750) {
            setPosition(prev => ({
              lat: geoPos.coords.latitude,
              lng: geoPos.coords.longitude,
              heading: geoPos.coords.heading || 0,
              accuracy: geoPos.coords.accuracy
            }))
            lastUpdateRef.current = now
          }
        },
        (error) => {
          console.error('GPS error:', error)
          // Fallback to NYC if GPS fails
          setPosition({
            lat: 40.7128,
            lng: -74.0060,
            heading: 0,
            accuracy: null
          })
        },
        options
      )
    }

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current)
      }
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  return { position, isOnline }
}
