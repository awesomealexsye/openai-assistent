interface RealtimeConfig {
  apiKey: string
  model?: string
  temperature?: number
  onTextResponse: (text: string) => void
  onError: (error: string) => void
  onConnectionChange: (connected: boolean) => void
}

class RealtimeConnection {
  private ws: WebSocket | null = null
  private audioContext: AudioContext | null = null
  private mediaStream: MediaStream | null = null
  private audioProcessor: ScriptProcessorNode | null = null
  private config: RealtimeConfig
  private isConnected = false
  private sessionId: string | null = null
  private autoDisconnectTimer: NodeJS.Timeout | null = null

  constructor(config: RealtimeConfig) {
    this.config = config
  }

  async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        const model = this.config.model || 'gpt-4o-realtime-preview-2024-10-01'

        // Create WebSocket connection with Authorization header via subprotocol
        // OpenAI Realtime API expects: Authorization: Bearer YOUR_API_KEY
        const wsUrl = `wss://api.openai.com/v1/realtime?model=${model}`

        // For Electron/Node environments, we can use headers
        // Browser WebSocket doesn't support headers, so we use a workaround with protocols
        this.ws = new WebSocket(wsUrl, [
          'realtime',
          `openai-insecure-api-key.${this.config.apiKey}`,
          'openai-beta.realtime-v1'
        ])

        // Set binary type for audio data
        this.ws.binaryType = 'arraybuffer'

        this.ws.onopen = () => {
          console.log('Realtime WebSocket connected')
          this.isConnected = true
          this.config.onConnectionChange(true)

          // Send session configuration
          this.sendSessionConfig()
          resolve()
        }

        this.ws.onmessage = (event) => {
          this.handleWebSocketMessage(event.data)
        }

        this.ws.onerror = (error) => {
          console.error('WebSocket error:', error)
          this.config.onError('WebSocket connection error')
          reject(new Error('WebSocket connection error'))
        }

        this.ws.onclose = (event) => {
          console.log('Realtime WebSocket closed', event.code, event.reason)
          this.isConnected = false
          this.config.onConnectionChange(false)
          this.cleanup()
        }
      } catch (error) {
        console.error('Failed to connect to Realtime API:', error)
        this.config.onError('Failed to connect to Realtime API')
        reject(error)
      }
    })
  }

  private sendSessionConfig(): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return

    const sessionConfig = {
      type: 'session.update',
      session: {
        modalities: ['text', 'audio'],
        instructions: 'You are a helpful AI assistant. Respond to the user\'s questions and provide assistance.',
        voice: 'alloy',
        input_audio_format: 'pcm16',
        output_audio_format: 'pcm16',
        input_audio_transcription: {
          model: 'whisper-1'
        },
        turn_detection: {
          type: 'server_vad',
          threshold: 0.5,
          prefix_padding_ms: 300,
          silence_duration_ms: 500
        },
        temperature: this.config.temperature || 0.8,
        max_response_output_tokens: 4096
      }
    }

    console.log('Sending session config:', sessionConfig)
    this.ws.send(JSON.stringify(sessionConfig))
  }

  private handleWebSocketMessage(data: string | ArrayBuffer): void {
    try {
      // Handle text messages
      if (typeof data === 'string') {
        const message = JSON.parse(data)

        console.log('Received message type:', message.type)

        switch (message.type) {
          case 'session.created':
            this.sessionId = message.session.id
            console.log('Session created:', this.sessionId)
            break

          case 'session.updated':
            console.log('Session updated')
            break

          case 'conversation.item.created':
            console.log('Conversation item created')
            break

          case 'response.text.delta':
            // Text chunk from assistant
            if (message.delta) {
              this.config.onTextResponse(message.delta)
            }
            break

          case 'response.text.done':
            // Final text response
            if (message.text) {
              this.config.onTextResponse(message.text)
            }
            break

          case 'response.audio_transcript.delta':
            // Text transcription of audio response
            if (message.delta) {
              this.config.onTextResponse(message.delta)
            }
            break

          case 'response.audio_transcript.done':
            // Final transcription
            if (message.transcript) {
              this.config.onTextResponse(message.transcript)
            }
            break

          case 'input_audio_buffer.speech_started':
            console.log('Speech detected')
            break

          case 'input_audio_buffer.speech_stopped':
            console.log('Speech stopped')
            break

          case 'response.done':
            console.log('Response completed')
            break

          case 'error':
            console.error('Realtime API error:', message.error)
            this.config.onError(message.error.message || 'Unknown error')
            break

          default:
            console.log('Unhandled message type:', message.type)
        }
      }
    } catch (error) {
      console.error('Error parsing WebSocket message:', error)
    }
  }

  async startAudioStreaming(deviceId?: string): Promise<void> {
    try {
      // Get audio stream from microphone or selected device
      const constraints: MediaStreamConstraints = {
        audio: deviceId ? { deviceId: { exact: deviceId } } : true
      }

      this.mediaStream = await navigator.mediaDevices.getUserMedia(constraints)

      // Create audio context
      this.audioContext = new AudioContext({ sampleRate: 24000 })
      const source = this.audioContext.createMediaStreamSource(this.mediaStream)

      // Create script processor for audio data
      const bufferSize = 4096
      this.audioProcessor = this.audioContext.createScriptProcessor(bufferSize, 1, 1)

      this.audioProcessor.onaudioprocess = (event) => {
        try {
          if (!this.isConnected || !this.ws || this.ws.readyState !== WebSocket.OPEN) {
            return
          }

          const inputData = event.inputBuffer.getChannelData(0)
          const pcm16Data = this.convertToPCM16(inputData)

          // Send audio data to WebSocket
          const audioMessage = {
            type: 'input_audio_buffer.append',
            audio: this.arrayBufferToBase64(pcm16Data)
          }

          this.ws.send(JSON.stringify(audioMessage))
        } catch (error) {
          console.error('Error in audio processing:', error)
        }
      }

      source.connect(this.audioProcessor)
      this.audioProcessor.connect(this.audioContext.destination)

      console.log('Audio streaming started')
    } catch (error) {
      console.error('Failed to start audio streaming:', error)
      this.config.onError('Failed to access microphone')
      throw error
    }
  }

  stopAudioStreaming(): void {
    if (this.audioProcessor) {
      this.audioProcessor.disconnect()
      this.audioProcessor = null
    }

    if (this.audioContext) {
      this.audioContext.close()
      this.audioContext = null
    }

    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(track => track.stop())
      this.mediaStream = null
    }

    console.log('Audio streaming stopped')
  }

  private convertToPCM16(float32Array: Float32Array): Int16Array {
    const pcm16 = new Int16Array(float32Array.length)
    for (let i = 0; i < float32Array.length; i++) {
      // Clamp to [-1, 1] range
      const s = Math.max(-1, Math.min(1, float32Array[i]))
      // Convert to 16-bit PCM
      pcm16[i] = s < 0 ? s * 0x8000 : s * 0x7FFF
    }
    return pcm16
  }

  private arrayBufferToBase64(buffer: Int16Array): string {
    const bytes = new Uint8Array(buffer.buffer)
    let binary = ''
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i])
    }
    return btoa(binary)
  }

  commitAudioBuffer(): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return

    // Commit the audio buffer to trigger response
    const commitMessage = {
      type: 'input_audio_buffer.commit'
    }
    this.ws.send(JSON.stringify(commitMessage))
  }

  createResponse(): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return

    // Manually trigger a response
    const responseMessage = {
      type: 'response.create',
      response: {
        modalities: ['text'],
        instructions: 'Please respond to the user\'s audio input.'
      }
    }
    this.ws.send(JSON.stringify(responseMessage))
  }

  setAutoDisconnect(minutes: number = 2): void {
    this.clearAutoDisconnect()

    this.autoDisconnectTimer = setTimeout(() => {
      console.log('Auto-disconnecting after', minutes, 'minutes')
      this.disconnect()
    }, minutes * 60 * 1000)
  }

  clearAutoDisconnect(): void {
    if (this.autoDisconnectTimer) {
      clearTimeout(this.autoDisconnectTimer)
      this.autoDisconnectTimer = null
    }
  }

  disconnect(): void {
    this.clearAutoDisconnect()
    this.stopAudioStreaming()

    if (this.ws) {
      if (this.ws.readyState === WebSocket.OPEN) {
        this.ws.close()
      }
      this.ws = null
    }

    this.isConnected = false
    this.sessionId = null
    this.config.onConnectionChange(false)
  }

  private cleanup(): void {
    this.stopAudioStreaming()
    this.clearAutoDisconnect()
  }

  getIsConnected(): boolean {
    return this.isConnected
  }

  getSessionId(): string | null {
    return this.sessionId
  }
}

export { RealtimeConnection }
export type { RealtimeConfig }
