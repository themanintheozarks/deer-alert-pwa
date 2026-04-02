// Lightweight solar calculation (sunrise/sunset)
// Based on simplified solar equations
// Returns isDaytime boolean for current location

export function isDaytime(lat, lng, timestamp = Date.now()) {
  const date = new Date(timestamp)
  
  // Calculate sunrise and sunset times
  const sunrise = getSunriseTime(lat, lng, date)
  const sunset = getSunsetTime(lat, lng, date)
  
  const currentHours = date.getHours() + date.getMinutes() / 60
  
  return currentHours >= sunrise && currentHours < sunset
}

function getSunriseTime(lat, lng, date) {
  const julianDate = getJulianDate(date)
  const noonOffset = getLonitudeOffset(lng)
  
  const sunrise = calculateSolarTime(lat, julianDate, noonOffset, true)
  return sunrise
}

function getSunsetTime(lat, lng, date) {
  const julianDate = getJulianDate(date)
  const noonOffset = getLonitudeOffset(lng)
  
  const sunset = calculateSolarTime(lat, julianDate, noonOffset, false)
  return sunset
}

function getJulianDate(date) {
  const a = Math.floor((14 - (date.getMonth() + 1)) / 12)
  const y = date.getFullYear() + 4800 - a
  const m = (date.getMonth() + 1) + 12 * a - 3
  
  const jdn = date.getDate() + Math.floor((153 * m + 2) / 5) + 365 * y +
    Math.floor(y / 4) - Math.floor(y / 100) + Math.floor(y / 400) - 32045
  
  return jdn + (date.getHours() - 12) / 24 + date.getMinutes() / 1440
}

function getLonitudeOffset(lng) {
  // Rough timezone offset based on longitude
  // Each 15 degrees = 1 hour
  return lng / 15
}

function calculateSolarTime(lat, julianDate, lonOffset, isSunrise) {
  const n = julianDate - 2451545 + lonOffset
  
  const J = n - (lng / 360)
  const M = (357.5291 + 0.98560028 * J) % 360
  const C = (1.914602 - 0.004817 * J) * Math.sin(M * Math.PI / 180) +
    (0.019993 - 0.000101 * J) * Math.sin(2 * M * Math.PI / 180) +
    0.000289 * Math.sin(3 * M * Math.PI / 180)
  
  const lambda = (280.46646 + 36000.76983 * J + 0.0003032 * J * J + C) % 360
  
  const epsilon = 23.439291 - 0.0130042 * J - 0.00000016 * J * J + 0.000000504 * J * J * J
  
  const alpha = Math.atan2(
    Math.cos(epsilon * Math.PI / 180) * Math.sin(lambda * Math.PI / 180),
    Math.cos(lambda * Math.PI / 180)
  ) * 180 / Math.PI
  
  const delta = Math.asin(
    Math.sin(epsilon * Math.PI / 180) * Math.sin(lambda * Math.PI / 180)
  ) * 180 / Math.PI
  
  const H = Math.acos(
    -Math.tan(lat * Math.PI / 180) * Math.tan(delta * Math.PI / 180)
  ) * 180 / Math.PI
  
  const M0 = (alpha + lng - 15 * lonOffset) / 15
  
  if (isSunrise) {
    return M0 - H / 15
  } else {
    return M0 + H / 15
  }
}
