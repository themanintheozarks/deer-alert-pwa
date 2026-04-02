import { useEffect, useState } from 'react'
import { useGPS } from './hooks/useGPS'
import { useVoice } from './hooks/useVoice'
import { useSunCycle } from './hooks/useSunCycle'
import { pinDB } from './db/pinDB'
import { MapScreen } from './screens/MapScreen'
import { LogScreen } from './screens/LogScreen'
import { StatusBar } from './components/StatusBar'

function MapScreenWithNav({ position, isDayMode, pins, onPinAdded, onPinDeleted, onOpenLog }) {
  return (
    <>
      <MapScreen
        position={position}
        isDayMode={isDayMode}
        pins={pins}
        onPinAdded={onPinAdded}
        onPinDeleted={onPinDeleted}
      />
      {/* Log button overlay */}
      <button
        onClick={onOpenLog}
        style={{
          position: 'fixed',
          top: '60px',
          left: '24px',
          width: '48px',
          height: '48px',
          borderRadius: '50%',
          backgroundColor: '#f97316',
          color: '#ffffff',
          border: 'none',
          fontSize: '20px',
          cursor: 'pointer',
          boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
          zIndex: 50
        }}
        title="View Log"
      >
        📋
      </button>
    </>
  )
}

function App() {
  const [currentScreen, setCurrentScreen] = useState('map') // 'map' or 'log'
  const [pins, setPins] = useState([])
  const [isDayMode, setIsDayMode] = useState(true)

  const { position, isOnline } = useGPS()
  const { lastPhrase, isMisfire, isListening } = useVoice()
  const dayMode = useSunCycle(position.lat, position.lng)

  // Load pins from IndexedDB on mount
  useEffect(() => {
    const loadPins = async () => {
      try {
        await pinDB.init()
        const savedPins = await pinDB.getAllPins()
        setPins(savedPins)
      } catch (error) {
        console.error('Failed to load pins:', error)
      }
    }

    loadPins()
  }, [])

  // Update day mode
  useEffect(() => {
    setIsDayMode(dayMode)
    // Apply to document
    if (dayMode) {
      document.body.style.backgroundColor = '#ffffff'
      document.body.classList.remove('dark-mode')
    } else {
      document.body.style.backgroundColor = '#1a1a1a'
      document.body.classList.add('dark-mode')
    }
  }, [dayMode])

  // Handle voice commands
  useEffect(() => {
    if (lastPhrase === 'report deer') {
      handleAddPin({
        lat: position.lat,
        lng: position.lng,
        type: 'deer',
        isMisfire: false,
        confirmed: true
      })
    } else if (isMisfire && lastPhrase) {
      // Add unconfirmed misfire pin
      handleAddPin({
        lat: position.lat,
        lng: position.lng,
        label: '',
        type: 'voice-unconfirmed',
        isMisfire: true,
        confirmed: false
      })
    }
  }, [lastPhrase, isMisfire, position])

  const handleAddPin = async (pinData) => {
    try {
      const newPin = await pinDB.addPin(pinData)
      setPins(prev => [...prev, newPin])
    } catch (error) {
      console.error('Failed to add pin:', error)
    }
  }

  const handleDeletePin = (pinId) => {
    pinDB.deletePin(pinId).catch(console.error)
    setPins(prev => prev.filter(p => p.id !== pinId))
  }

  const handlePinUpdated = (updatedPin) => {
    setPins(prev =>
      prev.map(p => p.id === updatedPin.id ? updatedPin : p)
    )
  }

  return (
    <div style={{
      width: '100%',
      height: '100vh',
      display: 'flex',
      flexDirection: 'column',
      backgroundColor: isDayMode ? '#ffffff' : '#1a1a1a',
      color: isDayMode ? '#1f2937' : '#f3f4f6'
    }}>
      <StatusBar isOnline={isOnline} isDayMode={isDayMode} />

      {currentScreen === 'map' && (
        <div style={{ position: 'relative', flex: 1 }}>
          <MapScreenWithNav
            position={position}
            isDayMode={isDayMode}
            pins={pins}
            onPinAdded={handlePinUpdated}
            onPinDeleted={handleDeletePin}
            onOpenLog={() => setCurrentScreen('log')}
          />
        </div>
      )}

      {currentScreen === 'log' && (
        <LogScreen
          pins={pins}
          position={position}
          isDayMode={isDayMode}
          onBack={() => setCurrentScreen('map')}
          onPinDeleted={handleDeletePin}
        />
      )}
    </div>
  )
}

export default App
