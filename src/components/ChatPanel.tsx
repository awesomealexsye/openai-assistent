import { useEffect, useRef } from 'react'
import { useStore } from '../store'
import { MessageSquare } from 'lucide-react'
import MessageList from './MessageList'
import ChatInput from './ChatInput'

const ChatPanel = () => {
  const { currentChat, currentChatId, createNewChat } = useStore()
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [currentChat?.messages])

  if (!currentChatId) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-gray-900 text-gray-400">
        <MessageSquare size={64} className="mb-4 opacity-30" />
        <h2 className="text-2xl font-semibold mb-2">No chat selected</h2>
        <p className="text-gray-500 mb-6">Select a chat or create a new one to start</p>
        <button
          onClick={createNewChat}
          className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
        >
          Create New Chat
        </button>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col bg-gray-900">
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-4 py-6">
        {currentChat && currentChat.messages.length > 0 ? (
          <>
            <MessageList messages={currentChat.messages} />
            <div ref={messagesEndRef} />
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-gray-500">
            <MessageSquare size={48} className="mb-4 opacity-30" />
            <p className="text-lg">Start a conversation</p>
            <p className="text-sm mt-2">Type a message or use voice input below</p>
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="border-t border-gray-800">
        <ChatInput />
      </div>
    </div>
  )
}

export default ChatPanel
