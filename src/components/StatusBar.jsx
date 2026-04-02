export function StatusBar({ isOnline, isDayMode }) {
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      height: '32px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingLeft: '12px',
      paddingRight: '12px',
      backgroundColor: isDayMode ? '#f3f4f6' : '#2d2d2d',
      borderBottom: `1px solid ${isDayMode ? '#e5e7eb' : '#444'}`,
      fontSize: '12px',
      color: isDayMode ? '#374151' : '#d1d5db',
      zIndex: 100,
      backdropFilter: 'blur(4px)',
      WebkitBackdropFilter: 'blur(4px)'
    }}>
      <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <span style={{
          display: 'inline-block',
          width: '8px',
          height: '8px',
          borderRadius: '50%',
          backgroundColor: isOnline ? '#10b981' : '#ef4444'
        }} />
        {isOnline ? 'Online' : 'Offline'}
      </span>
      <span style={{ fontSize: '16px' }}>
        {isDayMode ? '☀️' : '🌙'}
      </span>
    </div>
  )
}
