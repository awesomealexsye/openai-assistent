import { AssemblyAI } from 'assemblyai'


export class AssemblyAiService {
    private client: AssemblyAI | null = null
    private transcriber: any = null
    private stream: MediaStream | null = null
    private onTranscriptCallback: ((text: string) => void) | null = null
    private onErrorCallback: ((error: string) => void) | null = null

    constructor(private apiKey: string) {
        // We don't initialize the client with the key directly for realtime
        // because we'll use a temporary token
    }

    async connect(sampleRate: number = 16000) {
        try {
            // 1. Get temporary token from Main process
            const token = await window.electronAPI.createAssemblyAiToken(this.apiKey)

            // 2. Initialize client with token
            this.client = new AssemblyAI({
                apiKey: this.apiKey, // SDK might need this even if we use token for stream
            })

            // 3. Create Realtime Transcriber
            // Note: The SDK's realtime service usually takes the token in the connection params
            // or we might need to use the token to authenticate.
            // However, the AssemblyAI Node SDK is designed for Node.js.
            // For browser usage with the Node SDK (if it works), we need to be careful.
            // Actually, the 'assemblyai' package is isomorphic but 'realtime' might rely on 'ws'.

            // Use the streaming service (Universal Streaming)
            this.transcriber = this.client.streaming.transcriber({
                sampleRate,
                token: token
            })

            // If passing token in options doesn't work, we might need to override the apiKey
            // But let's assume the standard way:

            this.transcriber.on('open', ({ id }: { id: string }) => {
                console.log(`AssemblyAI Session opened with ID: ${id}`)
            })

            this.transcriber.on('error', (error: any) => {
                console.error('AssemblyAI Error:', error)
                if (this.onErrorCallback) this.onErrorCallback(error.message || 'Unknown error')
            })

            this.transcriber.on('close', (code: number, reason: string) => {
                console.log('AssemblyAI Session closed:', code, reason)
            })

            this.transcriber.on('turn', (turn: any) => {
                // Handle turn events (Universal Streaming)
                console.log('AssemblyAI Turn:', turn)

                // We only send the text when the turn is complete to avoid duplication
                // because the UI simply appends the text.
                if (turn.end_of_turn && turn.transcript) {
                    if (this.onTranscriptCallback) {
                        this.onTranscriptCallback(turn.transcript)
                    }
                }
            })

            await this.transcriber.connect()

        } catch (error) {
            console.error('Failed to connect to AssemblyAI:', error)
            throw error
        }
    }

    async startRecording(deviceId?: string) {
        try {
            // 1. Get Audio Stream
            const constraints: MediaStreamConstraints = {
                audio: deviceId ? {
                    deviceId: { exact: deviceId },
                    sampleRate: 16000,
                    channelCount: 1,
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true
                } : {
                    sampleRate: 16000,
                    channelCount: 1,
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true
                }
            }

            this.stream = await navigator.mediaDevices.getUserMedia(constraints)

            // 2. Setup AudioWorklet for robust PCM conversion
            const audioContext = new AudioContext({ sampleRate: 16000 })

            // Define the worklet code inline to avoid file loading issues
            const workletCode = `
                class PCMProcessor extends AudioWorkletProcessor {
                    constructor() {
                        super();
                        this.buffer = new Int16Array(4096); // Pre-allocate enough space
                        this.bufferIndex = 0;
                        this.targetSize = 1600; // 100ms at 16kHz
                    }

                    process(inputs, outputs, parameters) {
                        const input = inputs[0];
                        if (input && input.length > 0) {
                            const channelData = input[0];
                            
                            // Append to buffer
                            for (let i = 0; i < channelData.length; i++) {
                                // Expand buffer if needed (rare given 4096 vs 128 input)
                                if (this.bufferIndex >= this.buffer.length) {
                                    const newBuffer = new Int16Array(this.buffer.length * 2);
                                    newBuffer.set(this.buffer);
                                    this.buffer = newBuffer;
                                }

                                const s = Math.max(-1, Math.min(1, channelData[i]));
                                this.buffer[this.bufferIndex++] = s < 0 ? s * 0x8000 : s * 0x7FFF;
                            }

                            // Send if we have enough data
                            if (this.bufferIndex >= this.targetSize) {
                                const chunk = this.buffer.slice(0, this.bufferIndex);
                                this.port.postMessage(chunk.buffer, [chunk.buffer]);
                                this.bufferIndex = 0;
                            }
                        }
                        return true;
                    }
                }
                registerProcessor('pcm-processor', PCMProcessor);
            `

            const blob = new Blob([workletCode], { type: 'application/javascript' })
            const workletUrl = URL.createObjectURL(blob)

            await audioContext.audioWorklet.addModule(workletUrl)
            await audioContext.resume()

            const source = audioContext.createMediaStreamSource(this.stream)
            const workletNode = new AudioWorkletNode(audioContext, 'pcm-processor')

            workletNode.port.onmessage = (event) => {
                if (this.transcriber) {
                    try {
                        this.transcriber.sendAudio(event.data)
                    } catch (error) {
                        // Ignore socket errors, likely closed
                        console.warn('Failed to send audio to AssemblyAI:', error)
                    }
                }
            }

            source.connect(workletNode)
            workletNode.connect(audioContext.destination) // Keep the graph alive

            // Store references
            // @ts-ignore
            this.audioContext = audioContext
            // @ts-ignore
            this.workletNode = workletNode
            // @ts-ignore
            this.source = source
            // @ts-ignore
            this.workletUrl = workletUrl

        } catch (error) {
            console.error('Failed to start recording:', error)
            throw error
        }
    }

    async stopRecording() {
        // Cleanup AudioWorklet and Context
        // @ts-ignore
        if (this.workletNode) {
            // @ts-ignore
            this.workletNode.disconnect()
            // @ts-ignore
            this.workletNode = null
        }
        // @ts-ignore
        if (this.source) {
            // @ts-ignore
            this.source.disconnect()
            // @ts-ignore
            this.source = null
        }
        // @ts-ignore
        if (this.audioContext) {
            // @ts-ignore
            if (this.audioContext.state !== 'closed') {
                // @ts-ignore
                await this.audioContext.close()
            }
            // @ts-ignore
            this.audioContext = null
        }
        // @ts-ignore
        if (this.workletUrl) {
            // @ts-ignore
            URL.revokeObjectURL(this.workletUrl)
            // @ts-ignore
            this.workletUrl = null
        }

        // Stop Stream
        if (this.stream) {
            this.stream.getTracks().forEach(track => track.stop())
            this.stream = null
        }

        // Close Transcriber
        if (this.transcriber) {
            await this.transcriber.close()
            this.transcriber = null
        }
    }

    onTranscript(callback: (text: string) => void) {
        this.onTranscriptCallback = callback
    }

    onError(callback: (error: string) => void) {
        this.onErrorCallback = callback
    }
}
