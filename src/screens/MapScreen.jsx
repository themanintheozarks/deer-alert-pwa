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
  const markerGroupRef = useRef(null)
  const rangeRingRef = useRef(null)

  const [settingsOpen, setSettingsOpen] = useState(false)
  const [selectedRadius, setSelectedRadius] = useState(1000)
  const [clusterToggle, setClusterToggle] = useState(false)
  const [followMeActive, setFollowMeActive] = useState(true)
  const [labelPromptOpen, setLabelPromptOpen] = useState(false)
  const [editingPin, setEditingPin] = useState(null)
  const [pinsInRange, setPinsInRange] = useState([])

  // Initialize map once
  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return

    const map = L.map(mapRef.current, {
      zoomControl: false,
      attributionControl: true
    }).setView([position.lat || 37.7749, position.lng || -122.4194], 15)

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19
    }).addTo(map)

    if (!isDayMode && map._container) {
      map._container.style.filter = 'invert(0.93) hue-rotate(200deg)'
    }

    const group = L.layerGroup().addTo(map)
    markerGroupRef.current = group

    rangeRingRef.current = new RangeRingManager(map)
    mapInstanceRef.current = map
  }, [])

  // Follow me + range ring + proximity alert
  useEffect(() => {
    if (!mapInstanceRef.current || !position.lat) return

    if (followMeActive) {
      mapInstanceRef.current.setView(
        [position.lat, position.lng],
        mapInstanceRef.current.getZoom()
      )
    }

    if (rangeRingRef.current) {
      rangeRingRef.current.update(position.lat, position.lng, feetToMeters(selectedRadius))
    }

    const radiusMeters = feetToMeters(selectedRadius)
    const inRange = pins.filter(pin => {
      if (!pin.lat || !pin.lng) return false
      const dx = (pin.lat - position.lat) * 111000
      const dy = (pin.lng - position.lng) * 111000 * Math.cos(position.lat * Math.PI / 180)
      const distMeters = Math.sqrt(dx * dx + dy * dy)
      return distMeters <= radiusMeters
    })

    setPinsInRange(inRange)

    if (inRange.length > 0) {
      startProximityAlert(inRange, position)
    } else {
      stopProximityAlert()
    }
  }, [position, selectedRadius, pins, followMeActive])

  // Render markers
  useEffect(() => {
    if (!mapInstanceRef.current || !markerGroupRef.current) return

    markerGroupRef.current.clearLayers()

    const displayPins = clusterToggle
      ? clusterPins(pins)
      : pins.map(p => ({ type: 'pin', pin: p }))

    displayPins.forEach(item => {
      let marker

      if (item.type === 'cluster') {
        const icon = createClusterIcon(item.count)
        marker = L.marker([item.lat, item.lng], { icon })
        marker.bindPopup(`<div style="font-size:13px"><strong>${item.count} pins nearby</strong></div>`)
      } else {
        const pin = item.pin
        const isInRange = pinsInRange.some(p => p.id === pin.id)
        const icon = createPinIcon(pin, isInRange)
        marker = L.marker([pin.lat, pin.lng], { icon })

        // Tap to edit label
        marker.on('click', () => {
          setEditingPin(pin)
          setLabelPromptOpen(true)
        })

        // Long press to delete — Leaflet events only, no getElement()
        let pressTimer = null

        marker.on('mousedown', () => {
          pressTimer = setTimeout(() => handleDeletePin(pin.id), 800)
        })
        marker.on('mouseup', () => {
          if (pressTimer) { clearTimeout(pressTimer); pressTimer = null }
        })
        marker.on('touchstart', () => {
          pressTimer = setTimeout(() => handleDeletePin(pin.id), 800)
        })
        marker.on('touchend', () => {
          if (pressTimer) { clearTimeout(pressTimer); pressTimer = null }
        })
        marker.on('touchcancel', () => {
          if (pressTimer) { clearTimeout(pressTimer); pressTimer = null }
        })

        marker.bindPopup(createPinPopup(pin))
      }

      markerGroupRef.current.addLayer(marker)
    })
  }, [pins, pinsInRange, clusterToggle])

  // Day/night tile filter
  useEffect(() => {
    if (!mapInstanceRef.current) return
    const container = mapInstanceRef.current._container
    if (!container) return
    container.style.filter = isDayMode ? 'none' : 'invert(0.93) hue-rotate(200deg)'
  }, [isDayMode])

  const handleReport = async () => {
    try {
      const pin = await pinDB.addPin({
        lat: position.lat,
        lng: position.lng,
        label: '',
        type: 'deer',
        isMisfire: false,
        confirmed: true
      })
      onPinAdded(pin)
    } catch (err) {
      console.error('Failed to add pin:', err)
    }
  }

  const handleDeletePin = async (pinId) => {
    if (window.confirm('Delete this pin?')) {
      await pinDB.deletePin(pinId)
      onPinDeleted(pinId)
    }
  }

  const handleSaveLabel = async (label) => {
    if (!editingPin) return
    try {
      await pinDB.updatePin(editingPin.id, { label })
      onPinAdded({ ...editingPin, label })
    } catch (err) {
      console.error('Failed to update label:', err)
    }
    setLabelPromptOpen(false)
    setEditingPin(null)
  }

  const handleClearAll = async () => {
    if (window.confirm('Delete ALL pins? This cannot be undone.')) {
      await pinDB.clearAllPins()
      pins.forEach(p => onPinDeleted(p.id))
    }
  }

  return (
    <div style={{
      position: 'relative',
      width: '100%',
      height: '100%',
      backgroundColor: isDayMode ? '#ffffff' : '#1a1a1a'
    }}>
      <div
        ref={mapRef}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          width: '100%',
          height: '100%',
          zIndex: 1
        }}
      />

      <FloatingControls
        onReport={handleReport}
        onFollowMe={() => setFollowMeActive(prev => !prev)}
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
        currentLabel={editingPin?.label || ''}
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
