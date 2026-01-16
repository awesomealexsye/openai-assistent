interface RealtimeConfig {
  apiKey: string
  model?: string
  temperature?: number
  onTextResponse: (text: string) => void
  onError: (error: string) => void
  onConnectionChange: (connected: boolean) => void
  onTranscription?: (text: string) => void
  onUserInput?: (text: string) => void
  onTurnComplete?: () => void
  onSpeechStarted?: () => void
}

class RealtimeConnection {
  private ws: WebSocket | null = null
  private audioContext: AudioContext | null = null
  private mediaStream: MediaStream | null = null
  private audioProcessor: ScriptProcessorNode | null = null
  private audioWorkletNode: AudioWorkletNode | null = null
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
        modalities: ['text'], // Text-only mode - no audio output
        instructions: 'You are a helpful AI assistant. Respond to the user\'s questions and provide assistance.',
        input_audio_format: 'pcm16',
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

          case 'conversation.item.input_audio_transcription.completed':
            console.log('User input transcribed:', message.transcript)
            if (message.transcript && this.config.onUserInput) {
              this.config.onUserInput(message.transcript)
            }
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
              console.log('📝 Received text delta:', message.delta)
              this.config.onTextResponse(message.delta)
            }
            break

          case 'response.text.done':
            // Final text response
            console.log('✅ Text response complete')
            // Don't send duplicate full text if we already streamed deltas
            break

          case 'response.done':
            console.log('Response turn complete')
            if (this.config.onTurnComplete) {
              this.config.onTurnComplete()
            }
            break

          case 'response.audio_transcript.delta':
            // Text transcription of audio response
            if (message.delta) {
              if (this.config.onTranscription) {
                this.config.onTranscription(message.delta)
              } else {
                this.config.onTextResponse(message.delta)
              }
            }
            break

          case 'response.audio_transcript.done':
            // Final transcription
            if (message.transcript) {
              if (this.config.onTranscription) {
                this.config.onTranscription(message.transcript)
              } else {
                this.config.onTextResponse(message.transcript)
              }
            }
            break

          case 'input_audio_buffer.speech_started':
            console.log('🎤 Speech detected - user is speaking!')
            if (this.config.onSpeechStarted) {
              this.config.onSpeechStarted()
            }
            break

          case 'input_audio_buffer.speech_stopped':
            console.log('🛑 Speech stopped - processing...')
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
    if (this.mediaStream) return

    try {
      // Get audio stream from microphone or selected device
      const constraints: MediaStreamConstraints = {
        audio: deviceId ? { deviceId: { exact: deviceId } } : true
      }

      console.log('Requesting microphone access...', constraints)
      this.mediaStream = await navigator.mediaDevices.getUserMedia(constraints)
      console.log('Microphone access granted')

      // Create audio context with error handling
      try {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext
        this.audioContext = new AudioContextClass({ sampleRate: 24000 })
      } catch (e) {
        console.error('Failed to create AudioContext:', e)
        this.config.onError('Audio context initialization failed')
        // Cleanup media stream
        if (this.mediaStream) {
          this.mediaStream.getTracks().forEach(t => t.stop())
          this.mediaStream = null
        }
        throw e
      }

      if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume()
      }

      const source = this.audioContext.createMediaStreamSource(this.mediaStream)

      try {
        await this.audioContext.audioWorklet.addModule('audio-processor.js')
        const workletNode = new AudioWorkletNode(this.audioContext, 'audio-processor')

        workletNode.port.onmessage = (event) => {
          try {
            if (!this.isConnected || !this.ws || this.ws.readyState !== WebSocket.OPEN) {
              return
            }

            // event.data is the float32array channel data from the processor
            const inputData = event.data
            const pcm16Data = this.convertToPCM16(inputData)
            const audioMessage = {
              type: 'input_audio_buffer.append',
              audio: this.arrayBufferToBase64(pcm16Data)
            }
            this.ws.send(JSON.stringify(audioMessage))
          } catch (error) {
            console.error('Error generating audio message:', error)
          }
        }

        source.connect(workletNode)
        workletNode.connect(this.audioContext.destination)

        // Store reference for cleanup
        this.audioWorkletNode = workletNode

        console.log('Audio streaming started using AudioWorklet')
      } catch (error) {
        console.error('Failed to load AudioWorklet:', error)
        // Fallback or error out? For now error out as we want to test worklet.
        throw error
      }
    } catch (error) {
      console.error('Failed to start audio streaming:', error)
      this.config.onError('Failed to access microphone')
      this.stopAudioStreaming()
      throw error
    }
  }

  stopAudioStreaming(): void {
    if (this.audioProcessor) {
      this.audioProcessor.disconnect()
      this.audioProcessor = null
    }

    if (this.audioWorkletNode) {
      this.audioWorkletNode.disconnect()
      this.audioWorkletNode = null
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
    let binary = ''
    const bytes = new Uint8Array(buffer.buffer)
    const len = bytes.byteLength
    const chunkSize = 0x8000 // 32KB

    // Process in chunks to avoid stack overflow
    for (let i = 0; i < len; i += chunkSize) {
      const chunk = bytes.subarray(i, Math.min(i + chunkSize, len))
      binary += String.fromCharCode.apply(null, Array.from(chunk))
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
