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
  const sunrise = getSunTime(lat, lng, date, true)
  const sunset = getSunTime(lat, lng, date, false)
  const currentHours = date.getHours() + date.getMinutes() / 60
  return currentHours >= sunrise && currentHours < sunset
}

function getSunTime(lat, lng, date, isSunrise) {
  const rad = Math.PI / 180

  const dayOfYear = Math.floor(
    (date - new Date(date.getFullYear(), 0, 0)) / 86400000
  )

  const lonOffset = lng / 15
  const B = (360 / 365) * (dayOfYear - 81) * rad
  const eot = 9.87 * Math.sin(2 * B) - 7.53 * Math.cos(B) - 1.5 * Math.sin(B)
  const solarNoon = 12 - lonOffset - eot / 60

  const declination = 23.45 * Math.sin(B)

  const cosH =
    -Math.tan(lat * rad) * Math.tan(declination * rad)

  if (cosH < -1) return isSunrise ? 0 : 24
  if (cosH > 1) return isSunrise ? 12 : 12

  const H = Math.acos(cosH) / rad
  const halfDay = H / 15

  return isSunrise ? solarNoon - halfDay : solarNoon + halfDay
}
