import { useEffect, useRef, useState } from 'react'
import L from 'leaflet'
import { pinDB } from '../db/pinDB'
import { FloatingControls } from '../components/FloatingControls'
import { SettingsSheet } from '../components/SettingsSheet'
import { LabelPrompt } from '../components/LabelPrompt'
import { RangeRingManager } from '../components/RangeRing'
import { createPinIcon, createClusterIcon, createPinPopup } from '../components/PinMarker'
import { clusterPins, feetToMeters } from '../utils/geo'
import { startProximityAlert, stopProximityAlert } from '../audio/alertEngine'

export function MapScreen({
  position,
  isDayMode,
  pins,
  onPinAdded,
  onPinDeleted
}) {
  const mapRef = useRef(null)
  const mapInstanceRef = useRef(null)
  const markerGroupRef = useRef(L.layerGroup())
  const rangeRingRef = useRef(null)

  const [settingsOpen, setSettingsOpen] = useState(false)
  const [selectedRadius, setSelectedRadius] = useState(1000) // feet
  const [clusterToggle, setClusterToggle] = useState(false)
  const [followMeActive, setFollowMeActive] = useState(true)
  const [labelPromptOpen, setLabelPromptOpen] = useState(false)
  const [editingPin, setEditingPin] = useState(null)
  const [pinsInRange, setPinsInRange] = useState([])

  // Initialize map
  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return

    const map = L.map(mapRef.current).setView(
      [position.lat, position.lng],
      13
    )

    // Tile layer: switch between light and dark based on day mode
    const tileUrl = isDayMode
      ? 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
      : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'

    L.tileLayer(tileUrl, {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19
    }).addTo(map)

    if (isDayMode && map._container) {
      map._container.style.filter = 'none'
    } else if (!isDayMode && map._container) {
      map._container.style.filter = 'invert(0.93) hue-rotate(200deg)'
    }

    markerGroupRef.current = L.layerGroup().addTo(map)
    rangeRingRef.current = new RangeRingManager(map)

    mapInstanceRef.current = map
  }, [])

  // Update map view and range ring on position change
  useEffect(() => {
    if (!mapInstanceRef.current) return

    if (followMeActive) {
      mapInstanceRef.current.setView([position.lat, position.lng], mapInstanceRef.current.getZoom())
    }

    // Update range ring
    rangeRingRef.current.update(position.lat, position.lng, feetToMeters(selectedRadius))

    // Update proximity alert
    const inRange = pins.filter(pin => {
      const dx = pin.lat - position.lat
      const dy = pin.lng - position.lng
      const distDegrees = Math.sqrt(dx * dx + dy * dy)
      const distMeters = distDegrees * 111000 // rough conversion
      return distMeters <= feetToMeters(selectedRadius)
    })
    
    setPinsInRange(inRange)
    
    if (inRange.length > 0) {
      startProximityAlert(inRange, position)
    } else {
      stopProximityAlert()
    }
  }, [position, selectedRadius, pins, followMeActive])

  // Update markers
  useEffect(() => {
    if (!mapInstanceRef.current) return

    markerGroupRef.current.clearLayers()

    const displayPins = clusterToggle ? clusterPins(pins) : pins.map(p => ({ type: 'pin', pin: p }))

    displayPins.forEach(item => {
      let marker

      if (item.type === 'cluster') {
        const icon = createClusterIcon(item.count)
        marker = L.marker([item.lat, item.lng], { icon })

        const content = `
          <div style="font-size: 12px;">
            <strong>${item.count} pins nearby</strong>
          </div>
        `
        marker.bindPopup(content)
      } else {
        const pin = item.pin
        const isInRange = pinsInRange.some(p => p.id === pin.id)
        const icon = createPinIcon(pin, isInRange)
        marker = L.marker([pin.lat, pin.lng], { icon })

        // Handle marker interactions
        marker.on('click', () => {
          setEditingPin(pin)
          setLabelPromptOpen(true)
        })

        // Long press to delete
        let pressTimer
        marker.getElement().addEventListener('mousedown', () => {
          pressTimer = setTimeout(() => {
            handleDeletePin(pin.id)
          }, 800)
        })

        marker.getElement().addEventListener('mouseup', () => {
          clearTimeout(pressTimer)
        })

        const content = createPinPopup(pin)
        marker.bindPopup(content)
      }

      markerGroupRef.current.addLayer(marker)
    })
  }, [pins, pinsInRange, clusterToggle])

  // Update tile layer on day mode change
  useEffect(() => {
    if (!mapInstanceRef.current) return

    const container = mapInstanceRef.current._container
    if (isDayMode) {
      container.style.filter = 'none'
    } else {
      container.style.filter = 'invert(0.93) hue-rotate(200deg)'
    }
  }, [isDayMode])

  const handleReport = async () => {
    const pin = await pinDB.addPin({
      lat: position.lat,
      lng: position.lng,
      label: '',
      type: 'deer',
      isMisfire: false,
      confirmed: true
    })
    onPinAdded(pin)
  }

  const handleDeletePin = async (pinId) => {
    if (window.confirm('Delete this pin?')) {
      await pinDB.deletePin(pinId)
      onPinDeleted(pinId)
    }
  }

  const handleSaveLabel = async (label) => {
    if (editingPin) {
      await pinDB.updatePin(editingPin.id, { label })
      onPinAdded({ ...editingPin, label })
      setLabelPromptOpen(false)
      setEditingPin(null)
    }
  }

  const handleClearAll = async () => {
    await pinDB.clearAllPins()
    // Clear all pins from parent state
    pins.forEach(p => onPinDeleted(p.id))
  }

  return (
    <div style={{
      position: 'relative',
      width: '100%',
      height: '100vh',
      backgroundColor: isDayMode ? '#ffffff' : '#1a1a1a',
      marginTop: '32px'
    }}>
      <div
        ref={mapRef}
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%'
        }}
      />

      <FloatingControls
        onReport={handleReport}
        onFollowMe={() => setFollowMeActive(!followMeActive)}
        followMeActive={followMeActive}
        onZoomIn={() => mapInstanceRef.current?.zoomIn()}
        onZoomOut={() => mapInstanceRef.current?.zoomOut()}
        onSettingsOpen={() => setSettingsOpen(true)}
        isDayMode={isDayMode}
      />

      <SettingsSheet
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        selectedRadius={selectedRadius}
        onRadiusChange={setSelectedRadius}
        onClearAll={handleClearAll}
        clusterToggle={clusterToggle}
        onClusterToggle={setClusterToggle}
        isDayMode={isDayMode}
      />

      <LabelPrompt
        isOpen={labelPromptOpen}
        currentLabel={editingPin?.label}
        onSave={handleSaveLabel}
        onCancel={() => {
          setLabelPromptOpen(false)
          setEditingPin(null)
        }}
        isDayMode={isDayMode}
      />
    </div>
  )
}
