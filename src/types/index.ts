export interface Message {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: number
  type?: 'text' | 'voice'
}

export interface Chat {
  id: string
  title: string
  messages: Message[]
  createdAt: number
  updatedAt: number
  model: string
}

export type AudioInputSource = 'microphone' | 'system-audio'
export type ResponseMode = 'normal' | 'realtime' | 'interview'

export interface AudioDevice {
  deviceId: string
  label: string
  kind: string
}

export interface Settings {
  apiKey: string
  model: string
  temperature: number
  maxTokens: number
  theme: 'light' | 'dark'
  alwaysOnTop: boolean
  opacity: number
  screenProtection: boolean
  voiceEnabled: boolean
  audioInputSource: AudioInputSource
  selectedAudioDeviceId?: string
  responseMode: ResponseMode
  realtimeAutoDisconnect: boolean
  interviewModeEnabled: boolean
  vadSensitivity: number
  silenceDuration: number
  showTranscriptionPreview: boolean
  assemblyAiApiKey: string
}

export interface CodeBlock {
  language: string
  code: string
  filename?: string
}

export type InputMode = 'text' | 'voice'

export interface VoiceState {
  isRecording: boolean
  isProcessing: boolean
  error: string | null
}

export interface MicrophonePermissionStatus {
  status: 'not-determined' | 'denied' | 'granted' | 'restricted'
  granted: boolean
}

export interface ElectronAPI {
  setAlwaysOnTop: (flag: boolean) => Promise<boolean>
  setOpacity: (opacity: number) => Promise<boolean>
  getScreenSharingStatus: () => Promise<boolean>
  setContentProtection: (enable: boolean) => Promise<boolean>
  checkMicrophonePermission: () => Promise<MicrophonePermissionStatus>
  requestMicrophonePermission: () => Promise<boolean>
  openSystemPreferencesSecurity: () => Promise<boolean>
  windowMinimize: () => Promise<boolean>
  windowMaximize: () => Promise<boolean>
  windowClose: () => Promise<boolean>
  isWindowMaximized: () => Promise<boolean>
  createAssemblyAiToken: (apiKey: string) => Promise<string>
}

declare global {
  interface Window {
    electronAPI: ElectronAPI
  }
}
