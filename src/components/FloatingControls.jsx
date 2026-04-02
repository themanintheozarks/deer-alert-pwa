import { useState } from 'react'

export function FloatingControls({
  onReport,
  onFollowMe,
  followMeActive,
  onZoomIn,
  onZoomOut,
  onSettingsOpen,
  isDayMode
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const buttonStyle = (color = '#dc2626') => ({
    width: '56px',
    height: '56px',
    borderRadius: '50%',
    backgroundColor: color,
    color: '#ffffff',
    border: 'none',
    fontSize: '24px',
    cursor: 'pointer',
    boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'transform 0.2s, box-shadow 0.2s',
    padding: 0
  })

  const smallButtonStyle = (bgColor) => ({
    width: '48px',
    height: '48px',
    borderRadius: '50%',
    backgroundColor: bgColor,
    color: '#ffffff',
    border: 'none',
    fontSize: '20px',
    cursor: 'pointer',
    boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'transform 0.2s',
    padding: 0
  })

  return (
    <div style={{ position: 'fixed', bottom: '24px', left: '24px', right: '24px', zIndex: 50 }}>
      {/* Left controls: Follow Me, Zoom +/- */}
      <div style={{
        position: 'fixed',
        left: '24px',
        bottom: '24px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        zIndex: 50
      }}>
        <button
          onMouseEnter={e => e.target.style.transform = 'scale(1.1)'}
          onMouseLeave={e => e.target.style.transform = 'scale(1)'}
          onClick={onFollowMe}
          style={{
            ...smallButtonStyle(followMeActive ? '#3b82f6' : isDayMode ? '#6b7280' : '#4b5563'),
            backgroundColor: followMeActive ? '#3b82f6' : (isDayMode ? '#6b7280' : '#4b5563')
          }}
          title="Follow Me"
        >
          📍
        </button>
        <button
          onMouseEnter={e => e.target.style.transform = 'scale(1.1)'}
          onMouseLeave={e => e.target.style.transform = 'scale(1)'}
          onClick={onZoomIn}
          style={smallButtonStyle('#10b981')}
          title="Zoom In"
        >
          +
        </button>
        <button
          onMouseEnter={e => e.target.style.transform = 'scale(1.1)'}
          onMouseLeave={e => e.target.style.transform = 'scale(1)'}
          onClick={onZoomOut}
          style={smallButtonStyle('#10b981')}
          title="Zoom Out"
        >
          −
        </button>
      </div>

      {/* Right side controls: Settings, Log, Report */}
      <div style={{
        position: 'fixed',
        right: '24px',
        bottom: '24px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        zIndex: 50
      }}>
        <button
          onMouseEnter={e => e.target.style.transform = 'scale(1.05)'}
          onMouseLeave={e => e.target.style.transform = 'scale(1)'}
          onClick={onSettingsOpen}
          style={smallButtonStyle(isDayMode ? '#6b7280' : '#4b5563')}
          title="Settings"
        >
          ⚙️
        </button>
        <button
          onMouseEnter={e => e.target.style.transform = 'scale(1.1)'}
          onMouseLeave={e => e.target.style.transform = 'scale(1)'}
          onClick={onReport}
          style={buttonStyle('#dc2626')}
          title="Report Deer"
        >
          🦌
        </button>
      </div>
    </div>
  )
}
