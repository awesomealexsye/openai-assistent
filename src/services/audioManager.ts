import { AudioInputSource } from '../types'
import { detectBlackholeDevice } from '../lib/audioDevices'

type AudioDataCallback = (audioData: Float32Array) => void

/**
 * Centralized Audio Manager
 * Manages audio streams and allows multiple consumers to access the same audio input
 * Prevents conflicts when both realtime and traditional panels want to use audio
 */
class AudioManager {
  private static instance: AudioManager | null = null
  private audioStream: MediaStream | null = null
  private audioContext: AudioContext | null = null
  private mediaStreamSource: MediaStreamAudioSourceNode | null = null
  private processor: ScriptProcessorNode | null = null
  private listeners: Set<AudioDataCallback> = new Set()
  private currentSource: AudioInputSource | null = null

  private constructor() {
    // Private constructor for singleton
  }

  /**
   * Get singleton instance
   */
  static getInstance(): AudioManager {
    if (!AudioManager.instance) {
      AudioManager.instance = new AudioManager()
    }
    return AudioManager.instance
  }

  /**
   * Get or create audio stream for specified source
   */
  async getAudioStream(source: AudioInputSource, deviceId?: string): Promise<MediaStream> {
    // If we already have a stream from the same source, return it
    if (this.audioStream && this.currentSource === source) {
      return this.audioStream
    }

    // Otherwise, release old stream and create new one
    this.releaseAudioStream()

    try {
      if (source === 'microphone') {
        this.audioStream = await navigator.mediaDevices.getUserMedia({
          audio: deviceId
            ? { deviceId: { exact: deviceId } }
            : true,
        })
      } else if (source === 'system-audio') {
        // Get BlackHole device
        const blackholeDevice = await detectBlackholeDevice()
        if (!blackholeDevice) {
          throw new Error('BlackHole device not found')
        }

        this.audioStream = await navigator.mediaDevices.getUserMedia({
          audio: {
            deviceId: { exact: blackholeDevice.deviceId },
            echoCancellation: false,
            noiseSuppression: false,
            autoGainControl: false,
          },
        })
      } else {
        throw new Error(`Unknown audio source: ${source}`)
      }

      this.currentSource = source
      return this.audioStream
    } catch (error) {
      console.error('Failed to get audio stream:', error)
      throw error
    }
  }

  /**
   * Start processing audio and notifying listeners
   */
  async startAudioProcessing(source: AudioInputSource, deviceId?: string): Promise<void> {
    const stream = await this.getAudioStream(source, deviceId)

    // Create audio context if needed
    if (!this.audioContext) {
      this.audioContext = new AudioContext({ sampleRate: 16000 })
    }

    // Create media stream source
    this.mediaStreamSource = this.audioContext.createMediaStreamSource(stream)

    // Create script processor for audio data
    const bufferSize = 4096
    this.processor = this.audioContext.createScriptProcessor(bufferSize, 1, 1)

    this.processor.onaudioprocess = (event) => {
      const inputData = event.inputBuffer.getChannelData(0)

      // Notify all listeners
      this.listeners.forEach((listener) => {
        try {
          listener(inputData)
        } catch (error) {
          console.error('Error in audio listener:', error)
        }
      })
    }

    // Connect the nodes
    this.mediaStreamSource.connect(this.processor)
    this.processor.connect(this.audioContext.destination)
  }

  /**
   * Subscribe to audio data
   */
  subscribe(callback: AudioDataCallback): () => void {
    this.listeners.add(callback)

    // Return unsubscribe function
    return () => {
      this.listeners.delete(callback)
    }
  }

  /**
   * Stop audio processing
   */
  stopAudioProcessing(): void {
    if (this.processor) {
      this.processor.disconnect()
      this.processor = null
    }

    if (this.mediaStreamSource) {
      this.mediaStreamSource.disconnect()
      this.mediaStreamSource = null
    }

    if (this.audioContext && this.audioContext.state !== 'closed') {
      this.audioContext.close()
      this.audioContext = null
    }

    // Clear all listeners
    this.listeners.clear()
  }

  /**
   * Release audio stream
   */
  releaseAudioStream(): void {
    this.stopAudioProcessing()

    if (this.audioStream) {
      this.audioStream.getTracks().forEach((track) => track.stop())
      this.audioStream = null
    }

    this.currentSource = null
  }

  /**
   * Check if audio is currently active
   */
  isActive(): boolean {
    return this.audioStream !== null && this.audioContext !== null
  }

  /**
   * Get current audio source
   */
  getCurrentSource(): AudioInputSource | null {
    return this.currentSource
  }

  /**
   * Get number of active listeners
   */
  getListenerCount(): number {
    return this.listeners.size
  }
}

// Export singleton instance
export default AudioManager.getInstance()
