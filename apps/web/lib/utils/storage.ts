/**
 * IndexedDB wrapper for draft persistence
 * Stores campaign drafts per client with autosave
 */

const DB_NAME = 'pulza-drafts'
const DB_VERSION = 1
const STORE_NAME = 'campaigns'

export interface DraftCampaign {
  id: string
  clientId: string | null
  data: any // BulkLauncherState
  createdAt: string
  updatedAt: string
  autoSaved: boolean
}

/**
 * Initialize IndexedDB
 */
function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(request.result)

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result

      // Create object store if it doesn't exist
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' })
        store.createIndex('clientId', 'clientId', { unique: false })
        store.createIndex('updatedAt', 'updatedAt', { unique: false })
      }
    }
  })
}

/**
 * Save draft to IndexedDB
 */
export async function saveDraft(
  id: string,
  clientId: string | null,
  data: any,
  autoSaved: boolean = false
): Promise<void> {
  const db = await openDB()
  const transaction = db.transaction(STORE_NAME, 'readwrite')
  const store = transaction.objectStore(STORE_NAME)

  const now = new Date().toISOString()
  const existingDraft = await getDraft(id)

  const draft: DraftCampaign = {
    id,
    clientId,
    data,
    createdAt: existingDraft?.createdAt || now,
    updatedAt: now,
    autoSaved,
  }

  return new Promise((resolve, reject) => {
    const request = store.put(draft)
    request.onsuccess = () => resolve()
    request.onerror = () => reject(request.error)
  })
}

/**
 * Get draft by ID
 */
export async function getDraft(id: string): Promise<DraftCampaign | null> {
  const db = await openDB()
  const transaction = db.transaction(STORE_NAME, 'readonly')
  const store = transaction.objectStore(STORE_NAME)

  return new Promise((resolve, reject) => {
    const request = store.get(id)
    request.onsuccess = () => resolve(request.result || null)
    request.onerror = () => reject(request.error)
  })
}

/**
 * Get all drafts for a client
 */
export async function getClientDrafts(clientId: string | null): Promise<DraftCampaign[]> {
  const db = await openDB()
  const transaction = db.transaction(STORE_NAME, 'readonly')
  const store = transaction.objectStore(STORE_NAME)
  const index = store.index('clientId')

  return new Promise((resolve, reject) => {
    const request = index.getAll(clientId)
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

/**
 * Get all drafts
 */
export async function getAllDrafts(): Promise<DraftCampaign[]> {
  const db = await openDB()
  const transaction = db.transaction(STORE_NAME, 'readonly')
  const store = transaction.objectStore(STORE_NAME)

  return new Promise((resolve, reject) => {
    const request = store.getAll()
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

/**
 * Delete draft
 */
export async function deleteDraft(id: string): Promise<void> {
  const db = await openDB()
  const transaction = db.transaction(STORE_NAME, 'readwrite')
  const store = transaction.objectStore(STORE_NAME)

  return new Promise((resolve, reject) => {
    const request = store.delete(id)
    request.onsuccess = () => resolve()
    request.onerror = () => reject(request.error)
  })
}

/**
 * Clear all drafts for a client
 */
export async function clearClientDrafts(clientId: string | null): Promise<void> {
  const drafts = await getClientDrafts(clientId)
  await Promise.all(drafts.map((draft) => deleteDraft(draft.id)))
}

/**
 * Auto-save hook with debounce
 */
export function createAutoSaver(saveDelay: number = 2000) {
  let timeoutId: NodeJS.Timeout | null = null

  return (id: string, clientId: string | null, data: any) => {
    if (timeoutId) {
      clearTimeout(timeoutId)
    }

    timeoutId = setTimeout(async () => {
      try {
        await saveDraft(id, clientId, data, true)
        console.log('[AutoSave] Draft saved successfully', id)
      } catch (error) {
        console.error('[AutoSave] Failed to save draft', error)
      }
    }, saveDelay)
  }
}

/**
 * Check if there are unsaved changes
 */
export function hasUnsavedChanges(currentState: any, savedState: any): boolean {
  // Simple deep comparison (can be optimized with immer patches)
  return JSON.stringify(currentState) !== JSON.stringify(savedState)
}

/**
 * Fallback to localStorage if IndexedDB is not available
 */
const LOCALSTORAGE_PREFIX = 'pulza-draft-'

export function saveToLocalStorage(id: string, data: any): void {
  try {
    localStorage.setItem(`${LOCALSTORAGE_PREFIX}${id}`, JSON.stringify(data))
  } catch (error) {
    console.error('[LocalStorage] Failed to save', error)
  }
}

export function getFromLocalStorage(id: string): any | null {
  try {
    const item = localStorage.getItem(`${LOCALSTORAGE_PREFIX}${id}`)
    return item ? JSON.parse(item) : null
  } catch (error) {
    console.error('[LocalStorage] Failed to retrieve', error)
    return null
  }
}

export function removeFromLocalStorage(id: string): void {
  try {
    localStorage.removeItem(`${LOCALSTORAGE_PREFIX}${id}`)
  } catch (error) {
    console.error('[LocalStorage] Failed to remove', error)
  }
}
