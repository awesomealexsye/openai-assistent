import { useState, useRef, useEffect, useCallback } from 'react'
import { useStore } from '../store'
import { Mic, Activity, Zap, Loader2 } from 'lucide-react'
import { RealtimeConnection } from '../services/realtime'
import { Message } from '../types'
import AudioInputSelector from './AudioInputSelector'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import 'prismjs/themes/prism-tomorrow.css' // We can keep prism css or use what highlight.js provides via rehype, but let's stick to basic markdown for now or see if we need a code highlighter component.
// Actually, let's just use ReactMarkdown for now and basic code blocks.
// If user needs syntax highlighting, we can add rehype-highlight later if simple code blocks aren't enough, 
// but usually just markdown is a huge improvement over <p>.

const RealtimePanel = () => {
  const { settings, updateSettings, currentChat, addMessage, createNewChat } = useStore()
  const [isConnected, setIsConnected] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [transcription, setTranscription] = useState('')
  // Local messages state removed in favor of currentChat.messages
  const [currentResponse, setCurrentResponse] = useState('')
  const [isConnecting, setIsConnecting] = useState(false)
  const realtimeConnectionRef = useRef<RealtimeConnection | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const isMountedRef = useRef(true)
  const textBufferRef = useRef('')
  const updateTimerRef = useRef<NodeJS.Timeout | null>(null)

  const messages = currentChat?.messages || []

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages, currentResponse])

  // Throttled text update to prevent React from being overwhelmed
  const flushTextBuffer = useCallback(() => {
    if (textBufferRef.current && isMountedRef.current) {
      setCurrentResponse((prev) => prev + textBufferRef.current)
      textBufferRef.current = ''
    }
  }, [])

  const handleTextChunk = useCallback((text: string) => {
    textBufferRef.current += text

    // Clear existing timer
    if (updateTimerRef.current) {
      clearTimeout(updateTimerRef.current)
    }

    // Flush buffer every 100ms
    updateTimerRef.current = setTimeout(() => {
      flushTextBuffer()
    }, 100)
  }, [flushTextBuffer])

  // Commit the current streaming response to the message history
  const commitCurrentResponse = useCallback(async () => {
    if (!currentResponse && !textBufferRef.current) return

    // Flush any pending text
    const finalContent = currentResponse + textBufferRef.current
    if (!finalContent) return

    // Add to global store
    if (isMountedRef.current) {
      await addMessage({
        id: Date.now().toString(),
        role: 'assistant',
        content: finalContent,
        timestamp: Date.now(),
        type: 'text',
      })
    }

    // Reset buffers
    setCurrentResponse('')
    textBufferRef.current = ''
  }, [currentResponse, addMessage])

  const connectRealtime = async () => {
    if (!settings.apiKey) {
      alert('Please set your OpenAI API key in settings first')
      return
    }

    if (isConnecting) {
      console.log('Already connecting...')
      return
    }

    // Auto-create chat if none exists
    if (!currentChat) {
      await createNewChat()
    }

    try {
      setIsConnecting(true)

      const connection = new RealtimeConnection({
        apiKey: settings.apiKey,
        model: 'gpt-4o-realtime-preview-2024-12-17',
        temperature: settings.temperature,
        onTextResponse: (text) => {
          if (isMountedRef.current) {
            handleTextChunk(text)
          }
        },
        onError: (error) => {
          console.error('Realtime error:', error)
          if (isMountedRef.current) {
            alert(`Realtime API error: ${error}`)
          }
        },
        onConnectionChange: (connected) => {
          if (isMountedRef.current) {
            setIsConnected(connected)
            if (!connected) {
              setIsListening(false)
            }
          }
        },
        onUserInput: async (text) => {
          if (isMountedRef.current) {
            // Add user message to store
            await addMessage({
              id: Date.now().toString(),
              role: 'user',
              content: text,
              timestamp: Date.now(),
              type: 'voice' // Using 'voice' type to indicate it came from audio
            })
          }
        },
        onTurnComplete: () => {
          if (isMountedRef.current) {
            commitCurrentResponse()
          }
        },
        onSpeechStarted: () => {
          // Also commit current response if user interrupts
          if (isMountedRef.current) {
            commitCurrentResponse()
          }
        }
      })

      await connection.connect()

      if (isMountedRef.current) {
        realtimeConnectionRef.current = connection
      } else {
        // Component unmounted during connection
        connection.disconnect()
      }
    } catch (error) {
      console.error('Failed to connect to Realtime API:', error)
      if (isMountedRef.current) {
        alert('Failed to connect to Realtime API. Check console for details.')
      }
    } finally {
      if (isMountedRef.current) {
        setIsConnecting(false)
      }
    }
  }

  const startListening = async () => {
    console.log("start listen func called")
    try {
      console.log("in try condition")

      if (!realtimeConnectionRef.current) {
        console.log("in side ref")

        await connectRealtime()
      }

      console.log("inexit")

      // Determine device ID based on settings
      const deviceId = settings.audioInputSource === 'system-audio'
        ? settings.selectedAudioDeviceId
        : undefined

      // Directly start audio streaming with selected device
      await realtimeConnectionRef.current!.startAudioStreaming(deviceId)
      setIsListening(true)
    } catch (error) {
      console.error('Failed to start listening:', error)
      setIsListening(false)
      if (realtimeConnectionRef.current) {
        realtimeConnectionRef.current.disconnect()
      }
      alert(`Failed to start listening: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  const stopListening = async () => {
    if (realtimeConnectionRef.current) {
      realtimeConnectionRef.current.stopAudioStreaming()

      // Flush any remaining text in buffer
      flushTextBuffer()

      // Save the current transcription as message if pending
      if (transcription) {
        await addMessage({
          id: Date.now().toString(),
          role: 'user',
          content: transcription,
          timestamp: Date.now(),
          type: 'voice',
        })
        setTranscription('')
      }

      // Save current response buffer
      if (currentResponse || textBufferRef.current) {
        await commitCurrentResponse()
      }

      setIsListening(false)
    }
  }

  const disconnect = () => {
    if (realtimeConnectionRef.current) {
      realtimeConnectionRef.current.disconnect()
      realtimeConnectionRef.current = null
      setIsConnected(false)
      setIsListening(false)
    }
  }

  const handleNewChat = async () => {
    if (confirm('Start a new chat session?')) {
      disconnect()
      await createNewChat()
      setTranscription('')
      setCurrentResponse('')
    }
  }

  // Cleanup on unmount
  useEffect(() => {
    isMountedRef.current = true

    return () => {
      isMountedRef.current = false

      // Clear timer
      if (updateTimerRef.current) {
        clearTimeout(updateTimerRef.current)
        updateTimerRef.current = null
      }

      // Disconnect realtime
      if (realtimeConnectionRef.current) {
        realtimeConnectionRef.current.disconnect()
        realtimeConnectionRef.current = null
      }
    }
  }, [])

  return (
    <div className="h-full flex flex-col bg-gray-950">
      {/* Header */}
      <div className="p-4 border-b border-gray-800 bg-gray-900">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-purple-400" />
            <h2 className="text-lg font-semibold">Realtime AI</h2>
            {isConnected && (
              <span className="flex items-center gap-1 text-xs text-green-400">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                Connected
              </span>
            )}
          </div>
          <button
            onClick={handleNewChat}
            className="text-xs text-gray-400 hover:text-white transition-colors flex items-center gap-1"
          >
            <span>+</span> New Chat
          </button>
        </div>
      </div>

      {/* Status Display */}
      {isListening && (
        <div className="px-4 py-3 bg-blue-900/20 border-b border-blue-800/50">
          <div className="flex items-center gap-2">
            <Mic className="w-4 h-4 text-blue-400 animate-pulse" />
            <span className="text-sm text-blue-300">Listening...</span>
            <div className="flex gap-1 ml-auto">
              <div className="w-1 h-4 bg-blue-400 animate-pulse" style={{ animationDelay: '0ms' }} />
              <div className="w-1 h-4 bg-blue-400 animate-pulse" style={{ animationDelay: '150ms' }} />
              <div className="w-1 h-4 bg-blue-400 animate-pulse" style={{ animationDelay: '300ms' }} />
            </div>
          </div>
        </div>
      )}

      {/* Live Transcription */}
      {transcription && (
        <div className="px-4 py-3 bg-purple-900/20 border-b border-purple-800/50">
          <div className="text-xs text-purple-400 mb-1">Transcribing...</div>
          <div className="text-sm text-white">{transcription}</div>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && !currentResponse && (
          <div className="h-full flex items-center justify-center text-gray-500 text-center">
            <div>
              <Activity className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="text-sm">No realtime messages yet</p>
              <p className="text-xs mt-1">Connect and start speaking to begin</p>
            </div>
          </div>
        )}

        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`
                max-w-[80%] rounded-2xl px-4 py-2.5
                ${msg.role === 'user'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-800 text-gray-100'
                }
              `}
            >
              <div className="text-sm prose prose-invert max-w-none">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    code({ node, inline, className, children, ...props }: any) {
                      const match = /language-(\w+)/.exec(className || '')
                      return !inline && match ? (
                        <div className="relative rounded-md overflow-hidden my-2">
                          <pre className={`${className} !my-0 !bg-gray-950 p-3 pt-4 overflow-x-auto`}>
                            <code className={className} {...props}>
                              {children}
                            </code>
                          </pre>
                        </div>
                      ) : (
                        <code className={`${className} bg-gray-700/50 rounded px-1 py-0.5`} {...props}>
                          {children}
                        </code>
                      )
                    }
                  }}
                >
                  {msg.content}
                </ReactMarkdown>
              </div>
            </div>
          </div>
        ))}

        {/* Current streaming response */}
        {currentResponse && (
          <div className="flex justify-start">
            <div className="max-w-[80%] rounded-2xl px-4 py-2.5 bg-gray-800 text-gray-100">
              <div className="text-sm prose prose-invert max-w-none">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    code({ node, inline, className, children, ...props }: any) {
                      const match = /language-(\w+)/.exec(className || '')
                      return !inline && match ? (
                        <div className="relative rounded-md overflow-hidden my-2">
                          <pre className={`${className} !my-0 !bg-gray-950 p-3 overflow-x-auto`}>
                            <code className={className} {...props}>
                              {children}
                            </code>
                          </pre>
                        </div>
                      ) : (
                        <code className={`${className} bg-gray-700/50 rounded px-1 py-0.5`} {...props}>
                          {children}
                        </code>
                      )
                    }
                  }}
                >
                  {currentResponse + (textBufferRef.current || '')}
                </ReactMarkdown>
                <span className="inline-block w-1.5 h-4 bg-blue-400 ml-1 animate-pulse" />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Controls */}
      <div className="p-4 border-t border-gray-800 bg-gray-900 space-y-3">
        {/* Audio Input Selector */}
        <AudioInputSelector
          source={settings.audioInputSource}
          onSourceChange={(source) => updateSettings({ audioInputSource: source })}
          disabled={isListening}
        />

        {/* Action Buttons */}
        <div className="flex gap-2">
          {!isConnected ? (
            <button
              onClick={connectRealtime}
              disabled={isConnecting}
              className="flex-1 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isConnecting ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Connecting...
                </>
              ) : (
                <>
                  <Zap size={18} />
                  Connect to Realtime
                </>
              )}
            </button>
          ) : (
            <>
              {!isListening ? (
                <button
                  onClick={startListening}
                  className="flex-1 px-4 py-2.5 bg-green-600 hover:bg-green-700 rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  <Mic size={18} />
                  Start Listening
                </button>
              ) : (
                <button
                  onClick={stopListening}
                  className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  <Activity size={18} className="animate-pulse" />
                  Stop
                </button>
              )}
              <button
                onClick={disconnect}
                disabled={isListening}
                className="px-4 py-2.5 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Disconnect
              </button>
            </>
          )}
        </div>

        {/* Info */}
        <div className="text-xs text-gray-500 text-center">
          Model: {settings.model.includes('realtime') ? settings.model : 'gpt-4o-realtime-preview-2024-12-17'} • Temp: {settings.temperature}
        </div>
      </div>
    </div>
  )
}

export default RealtimePanel
