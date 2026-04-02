// Geographic utility functions

// Haversine distance calculation between two points
export function getDistance(lat1, lng1, lat2, lng2) {
  const R = 6371000 // Earth radius in meters
  const rad = Math.PI / 180
  
  const φ1 = lat1 * rad
  const φ2 = lat2 * rad
  const Δφ = (lat2 - lat1) * rad
  const Δλ = (lng2 - lng1) * rad
  
  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) *
    Math.sin(Δλ / 2) * Math.sin(Δλ / 2)
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c // meters
}

// Convert meters to feet
export function metersToFeet(meters) {
  return meters * 3.28084
}

// Convert feet to meters
export function feetToMeters(feet) {
  return feet / 3.28084
}

// Get pins within a radius from a center point
export function getPinsInRadius(pins, centerLat, centerLng, radiusMeters) {
  return pins.filter(pin => {
    const distance = getDistance(centerLat, centerLng, pin.lat, pin.lng)
    return distance <= radiusMeters
  })
}

// Get distance from user to pin in feet (for display)
export function getDisplayDistance(lat1, lng1, lat2, lng2) {
  const meters = getDistance(lat1, lng1, lat2, lng2)
  const feet = metersToFeet(meters)
  
  if (feet < 500) {
    return `${Math.round(feet)} ft`
  } else if (feet < 5280) {
    return `${(feet / 1000).toFixed(1)} mi`
  } else {
    return `${(feet / 5280).toFixed(1)} mi`
  }
}

// Cluster pins: group pins within 500ft of each other
export function clusterPins(pins) {
  if (pins.length === 0) return []
  
  const CLUSTER_DISTANCE = feetToMeters(500) // 500 feet in meters
  const clusters = []
  const used = new Set()
  
  for (let i = 0; i < pins.length; i++) {
    if (used.has(i)) continue
    
    const cluster = [pins[i]]
    used.add(i)
    
    for (let j = i + 1; j < pins.length; j++) {
      if (used.has(j)) continue
      
      const distance = getDistance(
        pins[i].lat, pins[i].lng,
        pins[j].lat, pins[j].lng
      )
      
      if (distance <= CLUSTER_DISTANCE) {
        cluster.push(pins[j])
        used.add(j)
      }
    }
    
    if (cluster.length === 1) {
      clusters.push({
        type: 'pin',
        pin: cluster[0]
      })
    } else {
      // Create cluster marker
      const avgLat = cluster.reduce((sum, p) => sum + p.lat, 0) / cluster.length
      const avgLng = cluster.reduce((sum, p) => sum + p.lng, 0) / cluster.length
      
      clusters.push({
        type: 'cluster',
        lat: avgLat,
        lng: avgLng,
        count: cluster.length,
        pins: cluster
      })
    }
  }
  
  return clusters
}

// Get bearing from point A to B (0-360 degrees)
export function getBearing(lat1, lng1, lat2, lng2) {
  const rad = Math.PI / 180
  const φ1 = lat1 * rad
  const φ2 = lat2 * rad
  const Δλ = (lng2 - lng1) * rad
  
  const y = Math.sin(Δλ) * Math.cos(φ2)
  const x = Math.cos(φ1) * Math.sin(φ2) -
    Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ)
  
  const bearing = Math.atan2(y, x) * (180 / Math.PI)
  return (bearing + 360) % 360
}
