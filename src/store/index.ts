import { create } from 'zustand'
import { Chat, Message, Settings, InputMode, VoiceState, Attachment } from '../types'
import {
  saveChat,
  getChat,
  getAllChats,
  deleteChat as deleteDbChat,
  saveSettings as saveDbSettings,
  getSettings as getDbSettings,
  getDefaultSettings
} from '../lib/db'

interface AppState {
  // Chat state
  chats: Chat[]
  currentChatId: string | null
  currentChat: Chat | null
  isLoading: boolean
  error: string | null

  // Settings
  settings: Settings
  isSettingsOpen: boolean

  // Input mode
  inputMode: InputMode
  voiceState: VoiceState

  // Canvas
  codeBlocks: Array<{ language: string; code: string; filename?: string }>

  // Pending attachments (for screenshots before sending)
  pendingAttachments: Attachment[]

  // Actions
  loadChats: () => Promise<void>
  createNewChat: () => Promise<void>
  selectChat: (chatId: string) => Promise<void>
  deleteChat: (chatId: string) => Promise<void>
  addMessage: (message: Message) => Promise<void>
  addMessages: (messages: Message[]) => Promise<void>
  updateLastMessage: (content: string) => void
  updateMessageByIndex: (parentId: string, responseIndex: number, content: string) => void
  loadSettings: () => Promise<void>
  updateSettings: (settings: Partial<Settings>) => Promise<void>
  toggleSettings: () => void
  setInputMode: (mode: InputMode) => void
  setVoiceState: (state: Partial<VoiceState>) => void
  addCodeBlock: (language: string, code: string, filename?: string) => void
  clearError: () => void

  // Attachment actions
  addPendingAttachment: (attachment: Attachment) => void
  removePendingAttachment: (attachmentId: string) => void
  clearPendingAttachments: () => void
}

export const useStore = create<AppState>((set, get) => ({
  chats: [],
  currentChatId: null,
  currentChat: null,
  isLoading: false,
  error: null,
  settings: getDefaultSettings(),
  isSettingsOpen: false,
  inputMode: 'text',
  voiceState: {
    isRecording: false,
    isProcessing: false,
    error: null,
  },
  codeBlocks: [],
  pendingAttachments: [],

  loadChats: async () => {
    try {
      const chats = await getAllChats()
      set({ chats })
    } catch (error) {
      set({ error: 'Failed to load chats' })
    }
  },

  createNewChat: async () => {
    const newChat: Chat = {
      id: Date.now().toString(),
      title: 'New Chat',
      messages: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
      model: get().settings.model,
    }

    await saveChat(newChat)
    const chats = await getAllChats()
    set({
      chats,
      currentChatId: newChat.id,
      currentChat: newChat
    })
  },

  selectChat: async (chatId: string) => {
    const chat = await getChat(chatId)
    if (chat) {
      set({ currentChatId: chatId, currentChat: chat, codeBlocks: [] })
    }
  },

  deleteChat: async (chatId: string) => {
    await deleteDbChat(chatId)
    const chats = await getAllChats()
    const state = get()

    if (state.currentChatId === chatId) {
      set({
        chats,
        currentChatId: null,
        currentChat: null,
        codeBlocks: []
      })
    } else {
      set({ chats })
    }
  },

  addMessage: async (message: Message) => {
    const state = get()
    if (!state.currentChat) return

    const updatedChat: Chat = {
      ...state.currentChat,
      messages: [...state.currentChat.messages, message],
      updatedAt: Date.now(),
      title: state.currentChat.messages.length === 0
        ? message.content.slice(0, 50)
        : state.currentChat.title,
    }

    await saveChat(updatedChat)
    set({ currentChat: updatedChat })
    await get().loadChats()
  },

  addMessages: async (messages: Message[]) => {
    const state = get()
    if (!state.currentChat) return

    const updatedChat: Chat = {
      ...state.currentChat,
      messages: [...state.currentChat.messages, ...messages],
      updatedAt: Date.now(),
      title: state.currentChat.messages.length === 0
        ? messages[0]?.content.slice(0, 50)
        : state.currentChat.title,
    }

    await saveChat(updatedChat)
    set({ currentChat: updatedChat })
    await get().loadChats()
  },

  updateLastMessage: (content: string) => {
    const state = get()
    if (!state.currentChat) return

    const messages = [...state.currentChat.messages]
    const lastMessageIndex = messages.length - 1

    if (lastMessageIndex >= 0) {
      // Create a new message object instead of mutating
      messages[lastMessageIndex] = {
        ...messages[lastMessageIndex],
        content: messages[lastMessageIndex].content + content
      }

      set({
        currentChat: {
          ...state.currentChat,
          messages,
        },
      })
    }
  },

  updateMessageByIndex: (parentMessageId: string, responseIndex: number, content: string) => {
    const state = get()
    if (!state.currentChat) return

    const messages = [...state.currentChat.messages]
    const messageIndex = messages.findIndex(
      m => m.parentMessageId === parentMessageId && m.responseIndex === responseIndex
    )

    if (messageIndex !== -1) {
      // Create a new message object instead of mutating
      messages[messageIndex] = {
        ...messages[messageIndex],
        content: messages[messageIndex].content + content
      }

      set({
        currentChat: {
          ...state.currentChat,
          messages,
        },
      })
    }
  },

  loadSettings: async () => {
    const settings = await getDbSettings()
    if (settings) {
      set({ settings })

      // Apply window settings
      if (window.electronAPI) {
        await window.electronAPI.setAlwaysOnTop(settings.alwaysOnTop)
        await window.electronAPI.setOpacity(settings.opacity)
        await window.electronAPI.setContentProtection(settings.screenProtection)
      }

      // Apply theme
      if (settings.theme === 'dark') {
        document.documentElement.classList.add('dark')
      } else {
        document.documentElement.classList.remove('dark')
      }
    }
  },

  updateSettings: async (newSettings: Partial<Settings>) => {
    const state = get()
    const updatedSettings = { ...state.settings, ...newSettings }
    await saveDbSettings(updatedSettings)
    set({ settings: updatedSettings })

    // Apply window settings
    if (window.electronAPI) {
      if ('alwaysOnTop' in newSettings) {
        await window.electronAPI.setAlwaysOnTop(newSettings.alwaysOnTop!)
      }
      if ('opacity' in newSettings) {
        await window.electronAPI.setOpacity(newSettings.opacity!)
      }
      if ('screenProtection' in newSettings) {
        await window.electronAPI.setContentProtection(newSettings.screenProtection!)
      }
    }

    // Apply theme
    if ('theme' in newSettings) {
      if (newSettings.theme === 'dark') {
        document.documentElement.classList.add('dark')
      } else {
        document.documentElement.classList.remove('dark')
      }
    }
  },

  toggleSettings: () => {
    set((state) => ({ isSettingsOpen: !state.isSettingsOpen }))
  },

  setInputMode: (mode: InputMode) => {
    set({ inputMode: mode })
  },

  setVoiceState: (state: Partial<VoiceState>) => {
    set((prevState) => ({
      voiceState: { ...prevState.voiceState, ...state },
    }))
  },

  addCodeBlock: (language: string, code: string, filename?: string) => {
    set((state) => ({
      codeBlocks: [...state.codeBlocks, { language, code, filename }],
    }))
  },

  clearError: () => {
    set({ error: null })
  },

  // Attachment actions
  addPendingAttachment: (attachment: Attachment) => {
    set((state) => ({
      pendingAttachments: [...state.pendingAttachments, attachment],
    }))
  },

  removePendingAttachment: (attachmentId: string) => {
    set((state) => ({
      pendingAttachments: state.pendingAttachments.filter((a) => a.id !== attachmentId),
    }))
  },

  clearPendingAttachments: () => {
    set({ pendingAttachments: [] })
  },
}))
