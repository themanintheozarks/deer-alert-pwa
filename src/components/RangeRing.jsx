import L from 'leaflet'

// Create and manage the proximity alert range ring
export class RangeRingManager {
  constructor(map) {
    this.map = map
    this.circle = null
  }

  update(lat, lng, radiusMeters) {
    // Remove old circle
    if (this.circle) {
      this.map.removeLayer(this.circle)
    }

    // Create new circle
    this.circle = L.circle([lat, lng], {
      radius: radiusMeters,
      color: '#dc2626',
      weight: 2,
      opacity: 0.4,
      fill: true,
      fillColor: '#dc2626',
      fillOpacity: 0.05,
      dashArray: '5, 5',
      lineCap: 'round'
    })

    this.circle.addTo(this.map)
  }

  remove() {
    if (this.circle) {
      this.map.removeLayer(this.circle)
      this.circle = null
    }
  }
}
