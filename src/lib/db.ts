import { openDB, DBSchema, IDBPDatabase } from 'idb'
import { Chat, Settings } from '../types'

interface AssistantDB extends DBSchema {
  chats: {
    key: string
    value: Chat
    indexes: { 'by-updated': number }
  }
  settings: {
    key: string
    value: Settings
  }
}

let dbInstance: IDBPDatabase<AssistantDB> | null = null

export const initDB = async (): Promise<IDBPDatabase<AssistantDB>> => {
  if (dbInstance) return dbInstance

  try {
    dbInstance = await openDB<AssistantDB>('arbaz-macbook', 2, {
      upgrade(db, oldVersion) {
        // Create chats store
        if (!db.objectStoreNames.contains('chats')) {
          const chatStore = db.createObjectStore('chats', { keyPath: 'id' })
          chatStore.createIndex('by-updated', 'updatedAt')
        }

        // Create settings store with a simple key
        if (!db.objectStoreNames.contains('settings')) {
          db.createObjectStore('settings')
        }
      },
    })

    return dbInstance
  } catch (error) {
    console.error('Failed to initialize database:', error)
    throw error
  }
}

// Chat operations
export const saveChat = async (chat: Chat): Promise<void> => {
  const db = await initDB()
  await db.put('chats', chat)
}

export const getChat = async (id: string): Promise<Chat | undefined> => {
  const db = await initDB()
  return await db.get('chats', id)
}

export const getAllChats = async (): Promise<Chat[]> => {
  const db = await initDB()
  const chats = await db.getAllFromIndex('chats', 'by-updated')
  return chats.reverse() // Most recent first
}

export const deleteChat = async (id: string): Promise<void> => {
  const db = await initDB()
  await db.delete('chats', id)
}

// Settings operations
export const saveSettings = async (settings: Settings): Promise<void> => {
  try {
    const db = await initDB()
    await db.put('settings', settings, 'app-settings')
  } catch (error) {
    console.error('Failed to save settings:', error)
    throw error
  }
}

export const getSettings = async (): Promise<Settings | undefined> => {
  try {
    const db = await initDB()
    return await db.get('settings', 'app-settings')
  } catch (error) {
    console.error('Failed to get settings:', error)
    return undefined
  }
}

export const getDefaultSettings = (): Settings => ({
  apiKey: '',
  model: 'gpt-4o',
  temperature: 0.7,
  maxTokens: 4096,
  theme: 'dark',
  alwaysOnTop: false,
  opacity: 1,
  screenProtection: true,
  voiceEnabled: true,
  audioInputSource: 'microphone',
  selectedAudioDeviceId: undefined,
  responseMode: 'normal',
  realtimeAutoDisconnect: true,
  interviewModeEnabled: false,
  vadSensitivity: 0.8,
  silenceDuration: 400,
  showTranscriptionPreview: true,
})
