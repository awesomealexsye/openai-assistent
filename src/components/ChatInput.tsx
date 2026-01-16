import { useState, useRef, useEffect } from 'react'
import { useStore } from '../store'
import { Send, Mic, MicOff, Loader2, Zap, Square, Speaker, X, Activity, Camera } from 'lucide-react'
import { streamChatCompletion, streamMultipleChatCompletions } from '../services/openai'
import { VoiceRecorder, transcribeAudio } from '../services/voice'
import { RealtimeConnection } from '../services/realtime'
import { AssemblyAiService } from '../services/assemblyai'
import { Message, Attachment } from '../types'
import { detectBlackholeDevice } from '../lib/audioDevices'

const ChatInput = () => {
  const {
    addMessage,
    addMessages,
    updateLastMessage,
    updateMessageByIndex,
    settings,
    setInputMode,
    voiceState,
    setVoiceState,
    pendingAttachments,
    addPendingAttachment,
    removePendingAttachment,
  } = useStore()

  const [input, setInput] = useState('')
  const [isStreaming, setIsStreaming] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const voiceRecorderRef = useRef<VoiceRecorder | null>(null)
  const realtimeConnectionRef = useRef<RealtimeConnection | null>(null)
  const assemblyAiServiceRef = useRef<AssemblyAiService | null>(null)
  const [isRealtimeConnected, setIsRealtimeConnected] = useState(false)
  const [isAssemblyAiRecording, setIsAssemblyAiRecording] = useState(false)
  const [realtimeResponseBuffer, setRealtimeResponseBuffer] = useState('')
  const abortControllerRef = useRef<AbortController | null>(null)
  const [hasBlackhole, setHasBlackhole] = useState(false)
  const [activeAudioSource, setActiveAudioSource] = useState<'microphone' | 'system-audio' | 'assembly-ai' | null>(null)
  const [isCapturingScreenshot, setIsCapturingScreenshot] = useState(false)

  // Screenshot capture function
  const captureScreenshot = async () => {
    if (isCapturingScreenshot) return

    try {
      setIsCapturingScreenshot(true)

      if (!window.electronAPI?.captureScreenshot) {
        console.error('Screenshot API not available')
        return
      }

      const result = await window.electronAPI.captureScreenshot()

      if (result.success && result.dataUrl) {
        const attachment: Attachment = {
          id: Date.now().toString(),
          type: 'image/png',
          dataUrl: result.dataUrl,
          width: result.width || 0,
          height: result.height || 0,
          timestamp: Date.now(),
        }

        addPendingAttachment(attachment)

        // Auto-submit the screenshot immediately (stealth mode)
        // Use store's getState() to bypass React closure and get fresh state
        setTimeout(() => {
          const currentPendingAttachments = useStore.getState().pendingAttachments
          console.log('Auto-submitting screenshot, pending attachments:', currentPendingAttachments.length)
          handleSendMessage(input)
        }, 200)
      } else {
        console.error('Screenshot capture failed:', result.error)
      }
    } catch (error) {
      console.error('Screenshot capture error:', error)
    } finally {
      setIsCapturingScreenshot(false)
    }
  }

  // Check and request microphone permission
  const checkMicrophonePermission = async (): Promise<boolean> => {
    try {
      if (window.electronAPI && window.electronAPI.checkMicrophonePermission) {
        const permissionStatus = await window.electronAPI.checkMicrophonePermission()
        console.log('Microphone permission status:', permissionStatus)

        if (!permissionStatus.granted) {
          // Try to request permission via Electron API first
          await window.electronAPI.requestMicrophonePermission()

          // Now attempt actual microphone access to trigger native dialog
          try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
            // Immediately stop the stream - we just needed to trigger the permission dialog
            stream.getTracks().forEach(track => track.stop())
            console.log('Microphone permission granted via getUserMedia')
            return true
          } catch (mediaError) {
            console.error('Failed to access microphone:', mediaError)
            setVoiceState({
              error: 'Microphone permission denied. Please open Settings and grant permission, or go to System Settings > Privacy & Security > Microphone'
            })
            return false
          }
        }

        return true
      } else {
        // Browser fallback - directly request via getUserMedia
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
          stream.getTracks().forEach(track => track.stop())
          return true
        } catch (error) {
          setVoiceState({
            error: 'Microphone permission denied. Please allow microphone access.'
          })
          return false
        }
      }
    } catch (error) {
      console.error('Error checking microphone permission:', error)
      setVoiceState({
        error: 'Failed to check microphone permission. Please try again.'
      })
      return false
    }
  }

  // Check for Blackhole on mount
  useEffect(() => {
    const checkBlackhole = async () => {
      const device = await detectBlackholeDevice()
      setHasBlackhole(!!device)
    }
    checkBlackhole()
  }, [])

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px'
    }
  }, [input])

  const handleSendMessage = async (messageText: string) => {
    // Get fresh state from store to avoid closure issues
    const { pendingAttachments: currentAttachments, currentChat: chat, settings: currentSettings, clearPendingAttachments: clearAttachments } = useStore.getState()

    // Allow sending with just attachments (no text required if images attached)
    if ((!messageText.trim() && currentAttachments.length === 0) || !chat || !currentSettings.apiKey) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: messageText.trim() || (currentAttachments.length > 0 ? 'If you find any questions in the given image, please let me know the answers' : ''),
      timestamp: Date.now(),
      type: currentAttachments.length > 0 ? 'image' : 'text',
      attachments: currentAttachments.length > 0 ? [...currentAttachments] : undefined,
    }

    await addMessage(userMessage)
    setInput('')
    clearAttachments() // Clear attachments after sending
    setIsStreaming(true)

    // Check if we need multiple responses
    if (settings.responseCount > 1) {
      // Create placeholder messages for each response
      const assistantMessages: Message[] = Array.from({ length: settings.responseCount }).map((_, index) => ({
        id: `${Date.now()}-${index}`,
        role: 'assistant' as const,
        content: '',
        timestamp: Date.now(),
        type: 'text' as const,
        responseIndex: index,
        parentMessageId: userMessage.id,
      }))

      await addMessages(assistantMessages)

      // Track streaming state for each response
      const streamingStates = Array(settings.responseCount).fill(true)

      abortControllerRef.current = new AbortController()

      await streamMultipleChatCompletions(
        [...chat.messages, userMessage],
        settings.apiKey,
        settings.model,
        settings.temperature,
        settings.maxTokens,
        settings.responseCount,
        (responseIndex, chunk) => {
          updateMessageByIndex(userMessage.id, responseIndex, chunk)
        },
        (responseIndex) => {
          streamingStates[responseIndex] = false
          if (streamingStates.every(s => !s)) {
            setIsStreaming(false)
            abortControllerRef.current = null
          }
        },
        (responseIndex, error) => {
          console.error(`Response ${responseIndex} error:`, error)
          streamingStates[responseIndex] = false
          if (streamingStates.every(s => !s)) {
            setIsStreaming(false)
            abortControllerRef.current = null
          }
        },
        abortControllerRef.current.signal
      )
    } else {
      // Single response (original behavior)
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
        [...chat.messages, userMessage],
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

  const handleCancelVoice = async () => {
    try {
      // Stop recording if active
      if (voiceRecorderRef.current && voiceState.isRecording) {
        await voiceRecorderRef.current.stopRecording()
      }

      // Stop realtime connection if active
      if (realtimeConnectionRef.current && settings.responseMode === 'realtime') {
        realtimeConnectionRef.current.stopAudioStreaming()
        if (settings.realtimeAutoDisconnect) {
          realtimeConnectionRef.current.disconnect()
          setIsRealtimeConnected(false)
        }
        setRealtimeResponseBuffer('')
      }

      // Stop AssemblyAI if active
      if (assemblyAiServiceRef.current && isAssemblyAiRecording) {
        await assemblyAiServiceRef.current.stopRecording()
        setIsAssemblyAiRecording(false)
      }

      // Reset all states
      setVoiceState({ isRecording: false, isProcessing: false, error: null })
      setActiveAudioSource(null)
      setInputMode('text')
    } catch (error) {
      console.error('Error canceling voice recording:', error)
      setVoiceState({ isRecording: false, isProcessing: false, error: null })
      setActiveAudioSource(null)
      setIsAssemblyAiRecording(false)
    }
  }

  const handleVoiceToggle = async (audioSource: 'microphone' | 'system-audio') => {
    if (!settings.apiKey) {
      alert('Please set your OpenAI API key in settings first')
      return
    }

    // If already recording from a different source, stop it first
    if (voiceState.isRecording && activeAudioSource && activeAudioSource !== audioSource) {
      alert('Please stop the current recording before starting a new one')
      return
    }

    // Set the active audio source
    setActiveAudioSource(audioSource)

    // Route based on response mode
    if (settings.responseMode === 'realtime') {
      await handleRealtimeVoiceToggle(audioSource)
    } else {
      await handleNormalVoiceToggle(audioSource)
    }
  }

  const handleAssemblyAiToggle = async () => {
    if (!settings.assemblyAiApiKey) {
      alert('Please set your AssemblyAI API key in settings first')
      return
    }

    if (isAssemblyAiRecording) {
      // Stop recording
      try {
        if (assemblyAiServiceRef.current) {
          await assemblyAiServiceRef.current.stopRecording()
        }
        setIsAssemblyAiRecording(false)
        setActiveAudioSource(null)
        setVoiceState({ isRecording: false })
      } catch (error) {
        console.error('Error stopping AssemblyAI:', error)
      }
    } else {
      // Start recording
      if (voiceState.isRecording) {
        alert('Please stop other recording first')
        return
      }

      // Prevent multiple clicks/connections
      if (voiceState.isProcessing) return

      const hasPermission = await checkMicrophonePermission()
      if (!hasPermission) return

      try {
        setVoiceState({ isProcessing: true }) // Indicate we are setting up
        setActiveAudioSource('assembly-ai')

        // Ensure clean state
        if (assemblyAiServiceRef.current) {
          await assemblyAiServiceRef.current.stopRecording()
          assemblyAiServiceRef.current = null
        }

        assemblyAiServiceRef.current = new AssemblyAiService(settings.assemblyAiApiKey)

        // Connect to AssemblyAI
        await assemblyAiServiceRef.current.connect()

        // Setup callbacks
        assemblyAiServiceRef.current.onTranscript((text) => {
          setInput((prev) => {
            const newText = prev ? `${prev} ${text}` : text
            return newText
          })
        })

        assemblyAiServiceRef.current.onError((error) => {
          console.error('AssemblyAI Error Callback:', error)
          setVoiceState({ error })
          setIsAssemblyAiRecording(false)
          setActiveAudioSource(null)
          // Cleanup
          if (assemblyAiServiceRef.current) {
            assemblyAiServiceRef.current.stopRecording().catch(console.error)
          }
        })

        // Determine device ID based on settings
        const deviceId = settings.audioInputSource === 'system-audio'
          ? settings.selectedAudioDeviceId
          : undefined

        // Start recording
        await assemblyAiServiceRef.current.startRecording(deviceId)

        setIsAssemblyAiRecording(true)
        setVoiceState({ isRecording: true, isProcessing: false })

      } catch (error) {
        console.error('Failed to start AssemblyAI:', error)
        setVoiceState({ error: error instanceof Error ? error.message : 'Failed to start AssemblyAI', isRecording: false, isProcessing: false })
        setIsAssemblyAiRecording(false)
        setActiveAudioSource(null)
        if (assemblyAiServiceRef.current) {
          assemblyAiServiceRef.current.stopRecording().catch(console.error)
          assemblyAiServiceRef.current = null
        }
      }
    }
  }

  const handleNormalVoiceToggle = async (audioSource: 'microphone' | 'system-audio') => {
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
        setActiveAudioSource(null)
      }
    } else {
      // Start recording - check permission first
      const hasPermission = await checkMicrophonePermission()
      if (!hasPermission) {
        return
      }

      try {
        if (!voiceRecorderRef.current) {
          voiceRecorderRef.current = new VoiceRecorder()
        }

        // Determine which device to use based on the audio source parameter
        const deviceId = audioSource === 'system-audio'
          ? settings.selectedAudioDeviceId
          : undefined

        await voiceRecorderRef.current.startRecording(deviceId)
        setVoiceState({ isRecording: true, error: null })
        setInputMode('voice')
      } catch (error) {
        console.error('Failed to start recording:', error)
        setVoiceState({ error: error instanceof Error ? error.message : 'Failed to start recording' })
        setActiveAudioSource(null)
      }
    }
  }

  const handleRealtimeVoiceToggle = async (audioSource: 'microphone' | 'system-audio') => {
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
        setActiveAudioSource(null)
      }
    } else {
      // Start realtime recording - check permission first
      const hasPermission = await checkMicrophonePermission()
      if (!hasPermission) {
        return
      }

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

        // Determine which device to use based on the audio source parameter
        const deviceId = audioSource === 'system-audio'
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
        setActiveAudioSource(null)
      }
    }
  }

  // Cleanup realtime connection on unmount
  useEffect(() => {
    return () => {
      if (realtimeConnectionRef.current) {
        realtimeConnectionRef.current.disconnect()
      }
      if (assemblyAiServiceRef.current) {
        assemblyAiServiceRef.current.stopRecording()
      }
    }
  }, [])

  // Register global screenshot shortcut listener
  useEffect(() => {
    if (window.electronAPI?.onScreenshotShortcut) {
      window.electronAPI.onScreenshotShortcut(() => {
        captureScreenshot()
      })
    }

    return () => {
      if (window.electronAPI?.removeScreenshotShortcutListener) {
        window.electronAPI.removeScreenshotShortcutListener()
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

        {/* Pending Attachments Preview */}
        {pendingAttachments.length > 0 && (
          <div className="mb-3 p-3 bg-gray-800/50 border border-gray-700 rounded-xl">
            <div className="flex items-center gap-2 mb-2 text-xs text-gray-400">
              <Camera size={14} />
              <span>{pendingAttachments.length} screenshot{pendingAttachments.length > 1 ? 's' : ''} attached</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {pendingAttachments.map((attachment) => (
                <div key={attachment.id} className="relative group">
                  <img
                    src={attachment.dataUrl}
                    alt="Screenshot preview"
                    className="h-20 w-auto rounded-lg border border-gray-600 object-cover"
                  />
                  <button
                    onClick={() => removePendingAttachment(attachment.id)}
                    className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Remove screenshot"
                  >
                    <X size={12} />
                  </button>
                  <div className="absolute bottom-1 right-1 px-1.5 py-0.5 bg-black/70 rounded text-[10px] text-gray-300">
                    {attachment.width}×{attachment.height}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Input Container */}
        <div className="glass rounded-2xl border border-gray-700 overflow-hidden">
          <div className="flex items-end gap-2 p-3">
            {/* Microphone Button */}
            <button
              onClick={() => handleVoiceToggle('microphone')}
              disabled={voiceState.isProcessing || (voiceState.isRecording && activeAudioSource !== 'microphone')}
              className={`p-3 rounded-xl transition-all flex-shrink-0 ${voiceState.isRecording && activeAudioSource === 'microphone'
                ? 'bg-red-600 hover:bg-red-700 animate-pulse-slow'
                : 'bg-gray-700 hover:bg-gray-600'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              title="Record from microphone"
            >
              {voiceState.isProcessing && activeAudioSource === 'microphone' ? (
                <Loader2 size={20} className="animate-spin" />
              ) : voiceState.isRecording && activeAudioSource === 'microphone' ? (
                <MicOff size={20} />
              ) : (
                <Mic size={20} />
              )}
            </button>

            {/* System Audio Button (Blackhole) */}
            <button
              onClick={() => handleVoiceToggle('system-audio')}
              disabled={voiceState.isProcessing || !hasBlackhole || (voiceState.isRecording && activeAudioSource !== 'system-audio')}
              className={`p-3 rounded-xl transition-all flex-shrink-0 ${voiceState.isRecording && activeAudioSource === 'system-audio'
                ? 'bg-purple-600 hover:bg-purple-700 animate-pulse-slow'
                : hasBlackhole
                  ? 'bg-gray-700 hover:bg-gray-600'
                  : 'bg-gray-800 opacity-50 cursor-not-allowed'
                } disabled:opacity-50 disabled:cursor-not-allowed relative`}
              title={hasBlackhole ? 'Record from system audio (Blackhole)' : 'Blackhole not detected - Install Blackhole to use system audio'}
            >
              {voiceState.isProcessing && activeAudioSource === 'system-audio' ? (
                <Loader2 size={20} className="animate-spin" />
              ) : voiceState.isRecording && activeAudioSource === 'system-audio' ? (
                <MicOff size={20} />
              ) : (
                <Speaker size={20} />
              )}
              {!hasBlackhole && (
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-500 rounded-full border-2 border-gray-900" title="Blackhole not detected" />
              )}
            </button>

            {/* AssemblyAI Button */}
            <button
              onClick={handleAssemblyAiToggle}
              disabled={voiceState.isProcessing || (voiceState.isRecording && activeAudioSource !== 'assembly-ai')}
              className={`p-3 rounded-xl transition-all flex-shrink-0 ${isAssemblyAiRecording
                ? 'bg-orange-600 hover:bg-orange-700 animate-pulse-slow'
                : 'bg-gray-700 hover:bg-gray-600'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              title="Real-time Transcription (AssemblyAI)"
            >
              {isAssemblyAiRecording ? (
                <Activity size={20} className="animate-pulse" />
              ) : (
                <Activity size={20} />
              )}
            </button>

            {/* Screenshot Button */}
            <button
              onClick={captureScreenshot}
              disabled={isCapturingScreenshot}
              className={`p-3 rounded-xl transition-all flex-shrink-0 ${isCapturingScreenshot
                ? 'bg-cyan-600 animate-pulse'
                : pendingAttachments.length > 0
                  ? 'bg-cyan-600 hover:bg-cyan-700'
                  : 'bg-gray-700 hover:bg-gray-600'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              title="Capture screenshot (⌘+Shift+S)"
            >
              {isCapturingScreenshot ? (
                <Loader2 size={20} className="animate-spin" />
              ) : (
                <Camera size={20} />
              )}
            </button>

            {/* Cancel Voice Recording Button - Only visible when recording or processing */}
            {(voiceState.isRecording || voiceState.isProcessing) && (
              <button
                onClick={handleCancelVoice}
                className="p-3 rounded-xl transition-all flex-shrink-0 bg-red-600 hover:bg-red-700 border-2 border-red-500"
                title="Cancel voice recording/transcription"
              >
                <X size={20} className="text-white" />
              </button>
            )}

            {/* Text Input */}
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={
                voiceState.isRecording
                  ? isAssemblyAiRecording
                    ? 'Listening with AssemblyAI...'
                    : 'Recording... Click the mic to stop'
                  : isStreaming
                    ? 'Streaming response... You can type your next question'
                    : 'Type a message or use voice input...'
              }
              disabled={voiceState.isRecording && !isAssemblyAiRecording}
              className="flex-1 bg-transparent border-none outline-none resize-none max-h-32 py-3 px-2 disabled:opacity-50"
              rows={1}
            />

            {/* Send/Stop Button */}
            <button
              onClick={isStreaming ? handleStopStreaming : () => handleSendMessage(input)}
              disabled={!isStreaming && ((!input.trim() && pendingAttachments.length === 0) || !settings.apiKey)}
              className={`p-3 ${isStreaming
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
                ? isAssemblyAiRecording
                  ? `🟠 AssemblyAI Live Transcription${settings.audioInputSource === 'system-audio' ? ' (System Audio)' : ' (Microphone)'}`
                  : settings.responseMode === 'realtime'
                    ? `🔴 LIVE - Realtime streaming active${activeAudioSource === 'system-audio' ? ' (System Audio)' : ' (Microphone)'}`
                    : `Voice recording active${activeAudioSource === 'system-audio' ? ' (System Audio)' : ' (Microphone)'}`
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
