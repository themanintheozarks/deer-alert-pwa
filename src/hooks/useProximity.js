import { useEffect, useState } from 'react'
import { getPinsInRadius, feetToMeters } from '../utils/geo'

export function useProximity(pins, position, radiusFeet) {
  const [pinsInRange, setPinsInRange] = useState([])

  useEffect(() => {
    const radiusMeters = feetToMeters(radiusFeet)
    const inRange = getPinsInRadius(
      pins,
      position.lat,
      position.lng,
      radiusMeters
    )
    
    setPinsInRange(inRange)
  }, [pins, position, radiusFeet])

  return pinsInRange
}
