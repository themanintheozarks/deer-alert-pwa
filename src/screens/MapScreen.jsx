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
  const [deleteConfirm, setDeleteConfirm] = useState(null) // pinId to confirm delete
  const [clearConfirm, setClearConfirm] = useState(false)

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

        let pressTimer = null
        let didLongPress = false

        const startPress = () => {
          didLongPress = false
          pressTimer = setTimeout(() => {
            didLongPress = true
            setDeleteConfirm(pin.id)
          }, 800)
        }

        const cancelPress = () => {
          if (pressTimer) {
            clearTimeout(pressTimer)
            pressTimer = null
          }
        }

        marker.on('mousedown', startPress)
        marker.on('touchstart', startPress)
        marker.on('mouseup', cancelPress)
        marker.on('touchend', cancelPress)
        marker.on('touchcancel', cancelPress)

        // Only open label prompt if it was NOT a long press
        marker.on('click', () => {
          if (!didLongPress) {
            setEditingPin(pin)
            setLabelPromptOpen(true)
          }
          didLongPress = false
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

  const handleConfirmDelete = async () => {
    if (!deleteConfirm) return
    await pinDB.deletePin(deleteConfirm)
    onPinDeleted(deleteConfirm)
    setDeleteConfirm(null)
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
    await pinDB.clearAllPins()
    pins.forEach(p => onPinDeleted(p.id))
    setClearConfirm(false)
    setSettingsOpen(false)
  }

  const overlayStyle = {
    position: 'fixed',
    inset: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    zIndex: 2000,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  }

  const dialogStyle = {
    backgroundColor: isDayMode ? '#ffffff' : '#1a1a1a',
    borderRadius: '12px',
    padding: '24px',
    margin: '24px',
    maxWidth: '320px',
    width: '100%',
    boxShadow: '0 8px 32px rgba(0,0,0,0.3)'
  }

  const btnRow = {
    display: 'flex',
    gap: '12px',
    marginTop: '20px'
  }

  const cancelBtnStyle = {
    flex: 1,
    padding: '12px',
    borderRadius: '8px',
    border: 'none',
    backgroundColor: isDayMode ? '#e5e7eb' : '#444',
    color: isDayMode ? '#1f2937' : '#f3f4f6',
    fontSize: '15px',
    fontWeight: '600',
    cursor: 'pointer'
  }

  const deleteBtnStyle = {
    flex: 1,
    padding: '12px',
    borderRadius: '8px',
    border: 'none',
    backgroundColor: '#dc2626',
    color: '#ffffff',
    fontSize: '15px',
    fontWeight: '600',
    cursor: 'pointer'
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
        onClearAll={() => { setSettingsOpen(false); setClearConfirm(true) }}
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

      {/* Delete single pin confirm dialog */}
      {deleteConfirm && (
        <div style={overlayStyle}>
          <div style={dialogStyle}>
            <p style={{
              fontSize: '16px',
              fontWeight: '600',
              color: isDayMode ? '#1f2937' : '#f3f4f6',
              marginBottom: '8px'
            }}>
              Delete this pin?
            </p>
            <p style={{
              fontSize: '13px',
              color: isDayMode ? '#6b7280' : '#9ca3af'
            }}>
              This sighting will be permanently removed.
            </p>
            <div style={btnRow}>
              <button style={cancelBtnStyle} onClick={() => setDeleteConfirm(null)}>
                Cancel
              </button>
              <button style={deleteBtnStyle} onClick={handleConfirmDelete}>
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Clear all confirm dialog */}
      {clearConfirm && (
        <div style={overlayStyle}>
          <div style={dialogStyle}>
            <p style={{
              fontSize: '16px',
              fontWeight: '600',
              color: isDayMode ? '#1f2937' : '#f3f4f6',
              marginBottom: '8px'
            }}>
              Clear all pins?
            </p>
            <p style={{
              fontSize: '13px',
              color: isDayMode ? '#6b7280' : '#9ca3af'
            }}>
              All saved sightings will be permanently deleted. This cannot be undone.
            </p>
            <div style={btnRow}>
              <button style={cancelBtnStyle} onClick={() => setClearConfirm(false)}>
                Cancel
              </button>
              <button style={deleteBtnStyle} onClick={handleClearAll}>
                Clear All
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
        }
