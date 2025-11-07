import { useStore } from '../store'
import { MessageSquare, Plus, Settings, Trash2 } from 'lucide-react'
import { format } from 'date-fns'

const Sidebar = () => {
  const { chats, currentChatId, createNewChat, selectChat, deleteChat, toggleSettings } = useStore()

  return (
    <div className="w-64 h-full glass-dark border-r border-gray-800 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-800">
        <button
          onClick={createNewChat}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
        >
          <Plus size={18} />
          New Chat
        </button>
      </div>

      {/* Chat List */}
      <div className="flex-1 overflow-y-auto p-2">
        {chats.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500 text-sm p-4 text-center">
            <MessageSquare size={32} className="mb-2 opacity-50" />
            <p>No chats yet</p>
            <p className="text-xs mt-1">Create a new chat to get started</p>
          </div>
        ) : (
          <div className="space-y-1">
            {chats.map((chat) => (
              <div
                key={chat.id}
                className={`group relative p-3 rounded-lg cursor-pointer transition-all ${
                  currentChatId === chat.id
                    ? 'bg-blue-600/20 border border-blue-500/30'
                    : 'hover:bg-gray-800/50 border border-transparent'
                }`}
                onClick={() => selectChat(chat.id)}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-medium text-gray-200 truncate">
                      {chat.title}
                    </h3>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {format(chat.updatedAt, 'MMM d, h:mm a')}
                    </p>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      if (confirm('Delete this chat?')) {
                        deleteChat(chat.id)
                      }
                    }}
                    className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-500/20 rounded transition-opacity"
                  >
                    <Trash2 size={14} className="text-red-400" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Settings Button */}
      <div className="p-4 border-t border-gray-800">
        <button
          onClick={toggleSettings}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 hover:bg-gray-800 rounded-lg transition-colors text-gray-300"
        >
          <Settings size={18} />
          Settings
        </button>
      </div>
    </div>
  )
}

export default Sidebar
