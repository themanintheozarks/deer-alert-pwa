// IndexedDB manager for deer pin persistence
const DB_NAME = 'DeerAlertDB'
const STORE_NAME = 'pins'
const DB_VERSION = 1

let dbInstance = null

export const pinDB = {
  async init() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION)
      
      request.onerror = () => {
        console.error('DB init failed:', request.error)
        reject(request.error)
      }
      
      request.onupgradeneeded = (event) => {
        const db = event.target.result
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' })
          store.createIndex('timestamp', 'timestamp', { unique: false })
          store.createIndex('lat', 'lat', { unique: false })
        }
      }
      
      request.onsuccess = () => {
        dbInstance = request.result
        resolve(dbInstance)
      }
    })
  },

  async getDB() {
    if (!dbInstance) {
      await this.init()
    }
    return dbInstance
  },

  async addPin(pin) {
    const db = await this.getDB()
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite')
      const store = tx.objectStore(STORE_NAME)
      
      const pinData = {
        id: `pin_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        lat: pin.lat,
        lng: pin.lng,
        label: pin.label || '',
        timestamp: Date.now(),
        type: pin.type || 'deer',
        isMisfire: pin.isMisfire || false,
        confirmed: pin.confirmed !== false // default true
      }
      
      const request = store.add(pinData)
      request.onsuccess = () => resolve(pinData)
      request.onerror = () => reject(request.error)
    })
  },

  async updatePin(pinId, updates) {
    const db = await this.getDB()
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite')
      const store = tx.objectStore(STORE_NAME)
      
      const getRequest = store.get(pinId)
      getRequest.onsuccess = () => {
        const pin = getRequest.result
        if (pin) {
          const updated = { ...pin, ...updates }
          const putRequest = store.put(updated)
          putRequest.onsuccess = () => resolve(updated)
          putRequest.onerror = () => reject(putRequest.error)
        } else {
          reject(new Error('Pin not found'))
        }
      }
      getRequest.onerror = () => reject(getRequest.error)
    })
  },

  async getPin(pinId) {
    const db = await this.getDB()
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly')
      const store = tx.objectStore(STORE_NAME)
      const request = store.get(pinId)
      
      request.onsuccess = () => resolve(request.result || null)
      request.onerror = () => reject(request.error)
    })
  },

  async getAllPins() {
    const db = await this.getDB()
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly')
      const store = tx.objectStore(STORE_NAME)
      const request = store.getAll()
      
      request.onsuccess = () => resolve(request.result || [])
      request.onerror = () => reject(request.error)
    })
  },

  async deletePin(pinId) {
    const db = await this.getDB()
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite')
      const store = tx.objectStore(STORE_NAME)
      const request = store.delete(pinId)
      
      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  },

  async clearAllPins() {
    const db = await this.getDB()
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite')
      const store = tx.objectStore(STORE_NAME)
      const request = store.clear()
      
      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  },

  async countPins() {
    const db = await this.getDB()
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly')
      const store = tx.objectStore(STORE_NAME)
      const request = store.count()
      
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
  }
}
