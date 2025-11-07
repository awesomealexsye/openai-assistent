import { AudioDevice } from '../types'

/**
 * Get all available audio input devices
 */
export const getAudioInputDevices = async (): Promise<AudioDevice[]> => {
  try {
    // Request permission first
    await navigator.mediaDevices.getUserMedia({ audio: true })

    const devices = await navigator.mediaDevices.enumerateDevices()
    const audioInputs = devices
      .filter(device => device.kind === 'audioinput')
      .map(device => ({
        deviceId: device.deviceId,
        label: device.label || `Audio Input ${device.deviceId.slice(0, 8)}`,
        kind: device.kind
      }))

    return audioInputs
  } catch (error) {
    console.error('Failed to enumerate audio devices:', error)
    return []
  }
}

/**
 * Detect if Blackhole is installed and available
 */
export const detectBlackholeDevice = async (): Promise<AudioDevice | null> => {
  try {
    const devices = await getAudioInputDevices()

    // Look for Blackhole device (case-insensitive)
    const blackhole = devices.find(device =>
      device.label.toLowerCase().includes('blackhole') ||
      device.label.toLowerCase().includes('black hole')
    )

    return blackhole || null
  } catch (error) {
    console.error('Failed to detect Blackhole:', error)
    return null
  }
}

/**
 * Check if a specific device is available
 */
export const isDeviceAvailable = async (deviceId: string): Promise<boolean> => {
  try {
    const devices = await getAudioInputDevices()
    return devices.some(device => device.deviceId === deviceId)
  } catch (error) {
    return false
  }
}

/**
 * Get device label by ID
 */
export const getDeviceLabel = async (deviceId: string): Promise<string> => {
  try {
    const devices = await getAudioInputDevices()
    const device = devices.find(d => d.deviceId === deviceId)
    return device?.label || 'Unknown Device'
  } catch (error) {
    return 'Unknown Device'
  }
}

/**
 * Get default audio input device
 */
export const getDefaultAudioDevice = async (): Promise<AudioDevice | null> => {
  try {
    const devices = await getAudioInputDevices()
    // The first device is usually the default
    return devices[0] || null
  } catch (error) {
    console.error('Failed to get default device:', error)
    return null
  }
}
