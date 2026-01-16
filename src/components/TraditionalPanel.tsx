import { useStore } from '../store'
import MessageList from './MessageList'
import ChatInput from './ChatInput'
import { MessageSquare } from 'lucide-react'

const TraditionalPanel = () => {
  const { currentChat } = useStore()

  return (
    <div className="h-full flex flex-col bg-gray-900">
      {/* Header */}
      <div className="p-4 border-b border-gray-800 bg-gray-950">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-blue-400" />
          <h2 className="text-lg font-semibold">Traditional Chat</h2>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto">
        {currentChat ? (
          <MessageList messages={currentChat.messages} />
        ) : (
          <div className="h-full flex items-center justify-center text-gray-500 text-center">
            <div>
              <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="text-sm">No chat selected</p>
              <p className="text-xs mt-1">Create a new chat to get started</p>
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="border-t border-gray-800">
        <ChatInput />
      </div>
    </div>
  )
}

export default TraditionalPanel
