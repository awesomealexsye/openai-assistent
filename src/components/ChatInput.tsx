import { useState, useRef, useEffect } from 'react'
import { useStore } from '../store'
import { Send, Mic, MicOff, Loader2, Zap, Square } from 'lucide-react'
import { streamChatCompletion } from '../services/openai'
import { VoiceRecorder, transcribeAudio } from '../services/voice'
import { RealtimeConnection } from '../services/realtime'
import { Message } from '../types'

const ChatInput = () => {
  const {
    currentChat,
    addMessage,
    updateLastMessage,
    settings,
    setInputMode,
    voiceState,
    setVoiceState,
  } = useStore()

  const [input, setInput] = useState('')
  const [isStreaming, setIsStreaming] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const voiceRecorderRef = useRef<VoiceRecorder | null>(null)
  const realtimeConnectionRef = useRef<RealtimeConnection | null>(null)
  const [isRealtimeConnected, setIsRealtimeConnected] = useState(false)
  const [realtimeResponseBuffer, setRealtimeResponseBuffer] = useState('')
  const abortControllerRef = useRef<AbortController | null>(null)

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px'
    }
  }, [input])

  const handleSendMessage = async (messageText: string) => {
    if (!messageText.trim() || !currentChat || !settings.apiKey) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: messageText.trim(),
      timestamp: Date.now(),
      type: 'text',
    }

    await addMessage(userMessage)
    setInput('')
    setIsStreaming(true)

    const assistantMessage: Message = {
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      content: '',
      timestamp: Date.now(),
      type: 'text',
    }

    await addMessage(assistantMessage)

    // Create new AbortController for this request
    abortControllerRef.current = new AbortController()

    await streamChatCompletion(
      [...currentChat.messages, userMessage],
      settings.apiKey,
      settings.model,
      settings.temperature,
      settings.maxTokens,
      (chunk) => {
        updateLastMessage(chunk)
      },
      () => {
        setIsStreaming(false)
        abortControllerRef.current = null
      },
      (error) => {
        console.error('Streaming error:', error)
        setIsStreaming(false)
        abortControllerRef.current = null
      },
      abortControllerRef.current.signal
    )
  }

  const handleStopStreaming = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      abortControllerRef.current = null
      setIsStreaming(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage(input)
    }
  }

  const handleVoiceToggle = async () => {
    if (!settings.apiKey) {
      alert('Please set your OpenAI API key in settings first')
      return
    }

    // Route based on response mode
    if (settings.responseMode === 'realtime') {
      await handleRealtimeVoiceToggle()
    } else {
      await handleNormalVoiceToggle()
    }
  }

  const handleNormalVoiceToggle = async () => {
    if (voiceState.isRecording) {
      // Stop recording
      try {
        setVoiceState({ isProcessing: true })
        const audioBlob = await voiceRecorderRef.current?.stopRecording()

        if (audioBlob) {
          const transcription = await transcribeAudio(audioBlob, settings.apiKey)
          setInput(transcription)
          setInputMode('text')

          // Focus the textarea after transcription to allow easy sending with Enter
          setTimeout(() => {
            if (textareaRef.current) {
              textareaRef.current.focus()
              // Move cursor to end of text
              textareaRef.current.setSelectionRange(
                transcription.length,
                transcription.length
              )
            }
          }, 100)
        }
      } catch (error) {
        console.error('Voice recording error:', error)
        setVoiceState({ error: error instanceof Error ? error.message : 'Voice recording failed' })
      } finally {
        setVoiceState({ isRecording: false, isProcessing: false })
      }
    } else {
      // Start recording
      try {
        if (!voiceRecorderRef.current) {
          voiceRecorderRef.current = new VoiceRecorder()
        }

        // Determine which device to use
        const deviceId = settings.audioInputSource === 'system-audio'
          ? settings.selectedAudioDeviceId
          : undefined

        await voiceRecorderRef.current.startRecording(deviceId)
        setVoiceState({ isRecording: true, error: null })
        setInputMode('voice')
      } catch (error) {
        console.error('Failed to start recording:', error)
        setVoiceState({ error: error instanceof Error ? error.message : 'Failed to start recording' })
      }
    }
  }

  const handleRealtimeVoiceToggle = async () => {
    if (voiceState.isRecording) {
      // Stop realtime recording
      try {
        setVoiceState({ isProcessing: true })

        if (realtimeConnectionRef.current) {
          // Stop audio streaming
          realtimeConnectionRef.current.stopAudioStreaming()

          // Commit the audio buffer to get final response
          realtimeConnectionRef.current.commitAudioBuffer()

          // Wait a bit for final response
          await new Promise(resolve => setTimeout(resolve, 1000))

          // Add the accumulated response as assistant message
          if (realtimeResponseBuffer.trim()) {
            const assistantMessage: Message = {
              id: (Date.now() + 1).toString(),
              role: 'assistant',
              content: realtimeResponseBuffer.trim(),
              timestamp: Date.now(),
              type: 'voice',
            }
            await addMessage(assistantMessage)
          }

          // Reset buffer
          setRealtimeResponseBuffer('')

          // Disconnect if auto-disconnect is enabled
          if (settings.realtimeAutoDisconnect) {
            realtimeConnectionRef.current.disconnect()
            setIsRealtimeConnected(false)
          }
        }
      } catch (error) {
        console.error('Realtime recording error:', error)
        setVoiceState({ error: error instanceof Error ? error.message : 'Realtime recording failed' })
      } finally {
        setVoiceState({ isRecording: false, isProcessing: false })
        setInputMode('text')
      }
    } else {
      // Start realtime recording
      try {
        // Initialize connection if not connected
        if (!realtimeConnectionRef.current || !isRealtimeConnected) {
          realtimeConnectionRef.current = new RealtimeConnection({
            apiKey: settings.apiKey,
            model: 'gpt-4o-realtime-preview-2024-10-01',
            temperature: settings.temperature,
            onTextResponse: (text) => {
              try {
                // Accumulate text chunks safely
                if (text && typeof text === 'string') {
                  setRealtimeResponseBuffer((prev) => (prev || '') + text)
                }
              } catch (error) {
                console.error('Error updating response buffer:', error)
              }
            },
            onError: (error) => {
              console.error('Realtime API error:', error)
              try {
                setVoiceState({ error: error || 'Unknown realtime error' })
              } catch (e) {
                console.error('Error setting voice state:', e)
              }
            },
            onConnectionChange: (connected) => {
              try {
                setIsRealtimeConnected(connected)
              } catch (error) {
                console.error('Error updating connection state:', error)
              }
            }
          })

          await realtimeConnectionRef.current.connect()

          // Set auto-disconnect timer if enabled
          if (settings.realtimeAutoDisconnect) {
            realtimeConnectionRef.current.setAutoDisconnect(2)
          }
        }

        // Determine which device to use
        const deviceId = settings.audioInputSource === 'system-audio'
          ? settings.selectedAudioDeviceId
          : undefined

        // Start audio streaming
        await realtimeConnectionRef.current.startAudioStreaming(deviceId)

        // Update states after successful connection and audio start
        setVoiceState({ isRecording: true, error: null })
        if (typeof setInputMode === 'function') {
          setInputMode('voice')
        }
        setRealtimeResponseBuffer('') // Clear buffer for new response
      } catch (error) {
        console.error('Failed to start realtime recording:', error)
        setVoiceState({ error: error instanceof Error ? error.message : 'Failed to start realtime recording' })

        // Cleanup on error
        if (realtimeConnectionRef.current) {
          realtimeConnectionRef.current.disconnect()
          setIsRealtimeConnected(false)
        }
      }
    }
  }

  // Cleanup realtime connection on unmount
  useEffect(() => {
    return () => {
      if (realtimeConnectionRef.current) {
        realtimeConnectionRef.current.disconnect()
      }
    }
  }, [])

  return (
    <div className="p-4">
      <div className="max-w-4xl mx-auto">
        {/* Error Display */}
        {voiceState.error && (
          <div className="mb-3 px-4 py-2 bg-red-500/20 border border-red-500/30 rounded-lg text-red-400 text-sm">
            {voiceState.error}
          </div>
        )}

        {/* Input Container */}
        <div className="glass rounded-2xl border border-gray-700 overflow-hidden">
          <div className="flex items-end gap-2 p-3">
            {/* Voice Button */}
            <button
              onClick={handleVoiceToggle}
              disabled={voiceState.isProcessing}
              className={`p-3 rounded-xl transition-all flex-shrink-0 ${
                voiceState.isRecording
                  ? 'bg-red-600 hover:bg-red-700 animate-pulse-slow'
                  : 'bg-gray-700 hover:bg-gray-600'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {voiceState.isProcessing ? (
                <Loader2 size={20} className="animate-spin" />
              ) : voiceState.isRecording ? (
                <MicOff size={20} />
              ) : (
                <Mic size={20} />
              )}
            </button>

            {/* Text Input */}
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={
                voiceState.isRecording
                  ? 'Recording... Click the mic to stop'
                  : isStreaming
                  ? 'Streaming response... You can type your next question'
                  : 'Type a message or use voice input...'
              }
              disabled={voiceState.isRecording}
              className="flex-1 bg-transparent border-none outline-none resize-none max-h-32 py-3 px-2 disabled:opacity-50"
              rows={1}
            />

            {/* Send/Stop Button */}
            <button
              onClick={isStreaming ? handleStopStreaming : () => handleSendMessage(input)}
              disabled={!isStreaming && (!input.trim() || !settings.apiKey)}
              className={`p-3 ${
                isStreaming
                  ? 'bg-red-600 hover:bg-red-700'
                  : 'bg-blue-600 hover:bg-blue-700'
              } rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0`}
              title={isStreaming ? 'Stop streaming' : 'Send message'}
            >
              {isStreaming ? <Square size={20} fill="currentColor" /> : <Send size={20} />}
            </button>
          </div>

          {/* Mode Indicator */}
          <div className="px-4 pb-3 flex items-center justify-between text-xs text-gray-500">
            <span>
              {voiceState.isRecording
                ? settings.responseMode === 'realtime'
                  ? '🔴 LIVE - Realtime streaming active'
                  : 'Voice recording active'
                : 'Press Shift+Enter for new line'}
            </span>
            <div className="flex items-center gap-2">
              {settings.responseMode === 'realtime' && (
                <span className="flex items-center gap-1 text-purple-400">
                  <Zap size={12} />
                  Realtime
                  {isRealtimeConnected && (
                    <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse-slow"></span>
                  )}
                </span>
              )}
              <span>
                {settings.model} • {settings.temperature.toFixed(1)} temp
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ChatInput
