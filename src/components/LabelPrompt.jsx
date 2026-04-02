import { useState } from 'react'

export function LabelPrompt({
  isOpen,
  currentLabel,
  onSave,
  onCancel,
  isDayMode
}) {
  const [inputValue, setInputValue] = useState(currentLabel || '')

  const handleSave = () => {
    onSave(inputValue)
    setInputValue('')
  }

  const handleCancel = () => {
    onCancel()
    setInputValue('')
  }

  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={handleCancel}
        style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.4)',
          zIndex: 1000,
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
          zIndex: 1001,
          animation: 'fade-in 0.3s ease',
          maxHeight: '300px'
        }}
      >
        <div style={{ marginBottom: '20px' }}>
          <label style={{
            display: 'block',
            fontSize: '14px',
            fontWeight: '600',
            marginBottom: '8px',
            color: isDayMode ? '#1f2937' : '#f3f4f6'
          }}>
            Deer Sighting Details
          </label>
          <textarea
            value={inputValue}
            onChange={e => setInputValue(e.target.value)}
            placeholder="e.g., Buck with 8-point antlers, near pine trees"
            style={{
              width: '100%',
              padding: '12px',
              border: `1px solid ${isDayMode ? '#d1d5db' : '#444'}`,
              borderRadius: '8px',
              fontSize: '14px',
              fontFamily: 'inherit',
              resize: 'vertical',
              minHeight: '80px',
              backgroundColor: isDayMode ? '#f9fafb' : '#2a2a2a',
              color: isDayMode ? '#1f2937' : '#f3f4f6',
              outline: 'none'
            }}
            onFocus={e => e.target.style.borderColor = '#dc2626'}
          />
        </div>

        <div style={{
          display: 'flex',
          gap: '12px',
          justifyContent: 'flex-end'
        }}>
          <button
            onClick={handleCancel}
            style={{
              padding: '10px 20px',
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
            onClick={handleSave}
            style={{
              padding: '10px 20px',
              borderRadius: '8px',
              backgroundColor: '#dc2626',
              color: '#ffffff',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer',
              border: 'none'
            }}
          >
            Save Label
          </button>
        </div>
      </div>
    </>
  )
}
