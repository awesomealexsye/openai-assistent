import { useState, useRef, useEffect } from 'react'
import { useStore } from '../store'
import { Send, Mic, MicOff, Loader2 } from 'lucide-react'
import { streamChatCompletion } from '../services/openai'
import { VoiceRecorder, transcribeAudio } from '../services/voice'
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
      },
      (error) => {
        console.error('Streaming error:', error)
        setIsStreaming(false)
      }
    )
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

    if (voiceState.isRecording) {
      // Stop recording
      try {
        setVoiceState({ isProcessing: true })
        const audioBlob = await voiceRecorderRef.current?.stopRecording()

        if (audioBlob) {
          const transcription = await transcribeAudio(audioBlob, settings.apiKey)
          setInput(transcription)
          setInputMode('text')
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
              disabled={isStreaming || voiceState.isProcessing}
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
                  : 'Type a message or use voice input...'
              }
              disabled={isStreaming || voiceState.isRecording}
              className="flex-1 bg-transparent border-none outline-none resize-none max-h-32 py-3 px-2 disabled:opacity-50"
              rows={1}
            />

            {/* Send Button */}
            <button
              onClick={() => handleSendMessage(input)}
              disabled={!input.trim() || isStreaming || !settings.apiKey}
              className="p-3 bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
            >
              {isStreaming ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} />}
            </button>
          </div>

          {/* Mode Indicator */}
          <div className="px-4 pb-3 flex items-center justify-between text-xs text-gray-500">
            <span>
              {voiceState.isRecording
                ? 'Voice recording active'
                : 'Press Shift+Enter for new line'}
            </span>
            <span>
              {settings.model} • {settings.temperature.toFixed(1)} temp
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ChatInput
