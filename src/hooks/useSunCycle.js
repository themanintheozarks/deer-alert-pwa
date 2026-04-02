import { useEffect, useState } from 'react'

export function useSunCycle(lat, lng) {
  const [isDayMode, setIsDayMode] = useState(true)

  useEffect(() => {
    const check = () => {
      if (!lat || !lng) return
      const result = isDaytime(lat, lng)
      setIsDayMode(result)
    }

    check()
    const interval = setInterval(check, 60000)
    return () => clearInterval(interval)
  }, [lat, lng])

  return isDayMode
}

function isDaytime(lat, lng, timestamp = Date.now()) {
  const date = new Date(timestamp)

  const dayOfYear = Math.floor(
    (date - new Date(date.getFullYear(), 0, 0)) / 86400000
  )

  const rad = Math.PI / 180
  const B = (360 / 365) * (dayOfYear - 81) * rad

  // Solar declination
  const declination = 23.45 * Math.sin(B)

  // Equation of time (minutes)
  const eot = 9.87 * Math.sin(2 * B) - 7.53 * Math.cos(B) - 1.5 * Math.sin(B)

  // Use the device's actual UTC offset in hours (accounts for DST automatically)
  const utcOffsetHours = -date.getTimezoneOffset() / 60

  // Solar noon in local clock time
  const solarNoon = 12 - (lng / 15 - utcOffsetHours) - eot / 60

  // Hour angle for sunrise/sunset (degrees)
  const cosH =
    -Math.tan(lat * rad) * Math.tan(declination * rad)

  // Handle polar day/night
  if (cosH < -1) return true  // sun never sets
  if (cosH > 1) return false  // sun never rises

  const H = Math.acos(cosH) / rad
  const halfDay = H / 15

  const sunrise = solarNoon - halfDay
  const sunset = solarNoon + halfDay

  // Current time in decimal hours (local device time)
  const currentHours = date.getHours() + date.getMinutes() / 60

  return currentHours >= sunrise && currentHours < sunset
}
