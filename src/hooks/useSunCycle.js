import { useEffect, useState } from 'react'
import { isDaytime } from '../utils/sunCalc'

export function useSunCycle(lat, lng) {
  const [isDayMode, setIsDayMode] = useState(true)

  useEffect(() => {
    // Check every 60 seconds if it's day or night
    const checkSunCycle = () => {
      const isDay = isDaytime(lat, lng)
      setIsDayMode(isDay)
    }

    checkSunCycle()
    const interval = setInterval(checkSunCycle, 60000)

    return () => clearInterval(interval)
  }, [lat, lng])

  return isDayMode
}
