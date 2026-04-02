import { useState } from 'react'

export function SettingsSheet({
  isOpen,
  onClose,
  selectedRadius,
  onRadiusChange,
  onClearAll,
  clusterToggle,
  onClusterToggle,
  isDayMode
}) {
  const [showClearConfirm, setShowClearConfirm] = useState(false)

  const radiusOptions = [
    { feet: 500, label: '500 ft' },
    { feet: 1000, label: '1000 ft' },
    { feet: 2640, label: '0.5 mi' },
    { feet: 3960, label: '0.75 mi' },
    { feet: 5280, label: '1 mi' }
  ]

  const handleClearAll = () => {
    onClearAll()
    setShowClearConfirm(false)
    onClose()
  }

  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.4)',
          zIndex: 200,
          animation: 'fade-in 0.2s ease'
        }}
      />

      {/* Slide-up sheet */}
      <div
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          backgroundColor: isDayMode ? '#ffffff' : '#1a1a1a',
          borderTopLeftRadius: '16px',
          borderTopRightRadius: '16px',
          padding: '20px',
          boxShadow: isDayMode
            ? '0 -4px 12px rgba(0,0,0,0.1)'
            : '0 -4px 12px rgba(0,0,0,0.3)',
          zIndex: 201,
          animation: 'fade-in 0.3s ease',
          maxHeight: '400px',
          overflowY: 'auto'
        }}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            width: '24px',
            height: '24px',
            fontSize: '20px',
            padding: 0,
            backgroundColor: 'transparent',
            cursor: 'pointer',
            color: isDayMode ? '#6b7280' : '#9ca3af'
          }}
        >
          ✕
        </button>

        <h2 style={{
          fontSize: '18px',
          fontWeight: '600',
          marginBottom: '20px',
          color: isDayMode ? '#1f2937' : '#f3f4f6'
        }}>
          Settings
        </h2>

        {/* Alert Radius */}
        <div style={{ marginBottom: '24px' }}>
          <label style={{
            display: 'block',
            fontSize: '14px',
            fontWeight: '600',
            marginBottom: '8px',
            color: isDayMode ? '#1f2937' : '#f3f4f6'
          }}>
            Alert Radius
          </label>
          <select
            value={selectedRadius}
            onChange={e => onRadiusChange(parseInt(e.target.value))}
            style={{
              width: '100%',
              padding: '10px 12px',
              border: `1px solid ${isDayMode ? '#d1d5db' : '#444'}`,
              borderRadius: '8px',
              fontSize: '14px',
              backgroundColor: isDayMode ? '#f9fafb' : '#2a2a2a',
              color: isDayMode ? '#1f2937' : '#f3f4f6',
              cursor: 'pointer'
            }}
          >
            {radiusOptions.map(opt => (
              <option key={opt.feet} value={opt.feet}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* Clustering toggle */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '24px',
          paddingBottom: '24px',
          borderBottom: `1px solid ${isDayMode ? '#e5e7eb' : '#333'}`
        }}>
          <label style={{
            fontSize: '14px',
            fontWeight: '500',
            color: isDayMode ? '#1f2937' : '#f3f4f6'
          }}>
            Cluster Nearby Pins
          </label>
          <button
            onClick={() => onClusterToggle(!clusterToggle)}
            style={{
              width: '44px',
              height: '24px',
              borderRadius: '12px',
              border: 'none',
              backgroundColor: clusterToggle ? '#10b981' : isDayMode ? '#d1d5db' : '#444',
              cursor: 'pointer',
              position: 'relative',
              transition: 'background-color 0.2s'
            }}
          >
            <div
              style={{
                position: 'absolute',
                top: '2px',
                left: clusterToggle ? '22px' : '2px',
                width: '20px',
                height: '20px',
                borderRadius: '50%',
                backgroundColor: '#ffffff',
                transition: 'left 0.2s'
              }}
            />
          </button>
        </div>

        {/* Clear All button */}
        {!showClearConfirm ? (
          <button
            onClick={() => setShowClearConfirm(true)}
            style={{
              width: '100%',
              padding: '12px 16px',
              borderRadius: '8px',
              backgroundColor: '#ef4444',
              color: '#ffffff',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer',
              border: 'none'
            }}
          >
            Clear All Pins
          </button>
        ) : (
          <div>
            <p style={{
              fontSize: '13px',
              marginBottom: '12px',
              color: isDayMode ? '#6b7280' : '#9ca3af'
            }}>
              Delete all saved pins? This cannot be undone.
            </p>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={() => setShowClearConfirm(false)}
                style={{
                  flex: 1,
                  padding: '10px',
                  borderRadius: '8px',
                  backgroundColor: isDayMode ? '#e5e7eb' : '#444',
                  color: isDayMode ? '#1f2937' : '#f3f4f6',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  border: 'none'
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleClearAll}
                style={{
                  flex: 1,
                  padding: '10px',
                  borderRadius: '8px',
                  backgroundColor: '#991b1b',
                  color: '#ffffff',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  border: 'none'
                }}
              >
                Delete All
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  )
}
