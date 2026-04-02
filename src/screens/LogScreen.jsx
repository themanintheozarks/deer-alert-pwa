import { useState } from 'react'
import { getDistance, getDisplayDistance } from '../utils/geo'

export function LogScreen({
  pins,
  position,
  isDayMode,
  onBack,
  onPinDeleted
}) {
  // Sort pins by distance from current location
  const sortedPins = [...pins].sort((a, b) => {
    const distA = getDistance(position.lat, position.lng, a.lat, a.lng)
    const distB = getDistance(position.lat, position.lng, b.lat, b.lng)
    return distA - distB
  })

  const handleDelete = (pinId) => {
    if (window.confirm('Delete this pin?')) {
      onPinDeleted(pinId)
    }
  }

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: isDayMode ? '#ffffff' : '#1a1a1a',
      color: isDayMode ? '#1f2937' : '#f3f4f6',
      zIndex: 999,
      display: 'flex',
      flexDirection: 'column',
      marginTop: '32px'
    }}>
      {/* Header */}
      <div style={{
        padding: '16px',
        borderBottom: `1px solid ${isDayMode ? '#e5e7eb' : '#333'}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <h1 style={{ fontSize: '20px', fontWeight: '600', margin: 0 }}>
          Sighting Log ({pins.length})
        </h1>
        <button
          onClick={onBack}
          style={{
            width: '32px',
            height: '32px',
            borderRadius: '6px',
            backgroundColor: isDayMode ? '#f3f4f6' : '#2a2a2a',
            border: 'none',
            fontSize: '18px',
            cursor: 'pointer',
            color: isDayMode ? '#6b7280' : '#9ca3af'
          }}
        >
          ✕
        </button>
      </div>

      {/* List */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '12px'
      }}>
        {sortedPins.length === 0 ? (
          <div style={{
            padding: '40px 20px',
            textAlign: 'center',
            color: isDayMode ? '#9ca3af' : '#6b7280'
          }}>
            <p style={{ fontSize: '16px', marginBottom: '8px' }}>
              No sightings yet
            </p>
            <p style={{ fontSize: '13px' }}>
              Use the 🦌 button or "report deer" voice command to log sightings
            </p>
          </div>
        ) : (
          sortedPins.map(pin => {
            const dateStr = new Date(pin.timestamp).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })
            
            const distanceStr = getDisplayDistance(position.lat, position.lng, pin.lat, pin.lng)

            return (
              <div
                key={pin.id}
                onMouseDown={(e) => {
                  let startY = e.clientY
                  let startTime = Date.now()
                  
                  const handleMouseUp = () => {
                    if (Date.now() - startTime > 500) {
                      handleDelete(pin.id)
                    }
                    document.removeEventListener('mouseup', handleMouseUp)
                  }
                  
                  document.addEventListener('mouseup', handleMouseUp)
                }}
                style={{
                  padding: '12px',
                  marginBottom: '8px',
                  borderRadius: '8px',
                  backgroundColor: isDayMode ? '#f9fafb' : '#2a2a2a',
                  border: `1px solid ${isDayMode ? '#e5e7eb' : '#333'}`,
                  cursor: 'pointer',
                  transition: 'background-color 0.2s',
                  userSelect: 'none'
                }}
                onMouseEnter={e => e.currentTarget.style.backgroundColor = isDayMode ? '#f3f4f6' : '#333'}
                onMouseLeave={e => e.currentTarget.style.backgroundColor = isDayMode ? '#f9fafb' : '#2a2a2a'}
              >
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  marginBottom: '6px'
                }}>
                  <span style={{
                    fontWeight: '600',
                    fontSize: '14px',
                    color: pin.isMisfire && pin.confirmed === false ? '#6b7280' : '#dc2626'
                  }}>
                    {pin.label || 'Unlabeled'}
                  </span>
                  <span style={{
                    fontSize: '12px',
                    color: isDayMode ? '#6b7280' : '#9ca3af'
                  }}>
                    {distanceStr}
                  </span>
                </div>
                
                <div style={{
                  fontSize: '12px',
                  color: isDayMode ? '#6b7280' : '#9ca3af',
                  marginBottom: '4px'
                }}>
                  {dateStr}
                </div>
                
                {pin.isMisfire && pin.confirmed === false && (
                  <div style={{
                    fontSize: '11px',
                    color: '#ef4444',
                    fontStyle: 'italic'
                  }}>
                    Unconfirmed
                  </div>
                )}

                <div style={{
                  fontSize: '11px',
                  color: isDayMode ? '#9ca3af' : '#6b7280',
                  marginTop: '6px'
                }}>
                  Lat: {pin.lat.toFixed(4)}, Lng: {pin.lng.toFixed(4)}
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
