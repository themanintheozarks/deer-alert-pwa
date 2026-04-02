import L from 'leaflet'

// Create custom HTML icon for pins
export function createPinIcon(pin, isInRange = false) {
  let bgColor = '#dc2626'
  let emoji = '🦌'
  
  if (pin.isMisfire && pin.confirmed === false) {
    bgColor = '#6b7280'
    emoji = '❓'
  }
  
  const htmlIcon = `
    <div style="
      display: flex;
      align-items: center;
      justify-content: center;
      width: 44px;
      height: 44px;
      background: ${bgColor};
      border: 3px solid #ffffff;
      border-radius: 50%;
      font-size: 24px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.3);
      ${isInRange ? `
        animation: pulsing-glow 2s ease-in-out infinite;
        animation-duration: 1.5s;
      ` : ''}
      ${pin.isMisfire && pin.confirmed === false ? `
        animation: flash-pin 0.6s ease-in-out infinite;
      ` : ''}
      position: relative;
    ">
      ${emoji}
    </div>
  `
  
  return L.divIcon({
    html: htmlIcon,
    iconSize: [44, 44],
    iconAnchor: [22, 22],
    popupAnchor: [0, -22],
    className: ''
  })
}

// Cluster icon
export function createClusterIcon(count) {
  const size = count > 10 ? 48 : count > 5 ? 44 : 40
  
  const htmlIcon = `
    <div style="
      display: flex;
      align-items: center;
      justify-content: center;
      width: ${size}px;
      height: ${size}px;
      background: linear-gradient(135deg, #f97316, #ea580c);
      border: 3px solid #ffffff;
      border-radius: 50%;
      font-size: 16px;
      font-weight: bold;
      color: white;
      box-shadow: 0 2px 8px rgba(0,0,0,0.3);
      position: relative;
    ">
      ${count}
    </div>
  `
  
  return L.divIcon({
    html: htmlIcon,
    iconSize: [size, size],
    iconAnchor: [size/2, size/2],
    popupAnchor: [0, -size/2],
    className: ''
  })
}

// Popup content
export function createPinPopup(pin) {
  const dateStr = new Date(pin.timestamp).toLocaleString()
  
  return `
    <div style="
      font-size: 12px;
      min-width: 140px;
    ">
      <strong>${pin.label || 'Unlabeled'}</strong><br/>
      ${dateStr}<br/>
      <em>${pin.isMisfire && pin.confirmed === false ? 'Unconfirmed' : pin.type}</em>
    </div>
  `
}
