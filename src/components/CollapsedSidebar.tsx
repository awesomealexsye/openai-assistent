import { Plus, MessageSquare, Settings as SettingsIcon, Trash2 } from 'lucide-react'
import { Chat } from '../types'
import { format } from 'date-fns'

interface CollapsedSidebarProps {
  chats: Chat[]
  currentChatId: string | null
  onNewChat: () => void
  onSelectChat: (chatId: string) => void
  onDeleteChat: (chatId: string) => void
  onOpenSettings: () => void
}

const CollapsedSidebar = ({
  chats,
  currentChatId,
  onNewChat,
  onSelectChat,
  onDeleteChat,
  onOpenSettings,
}: CollapsedSidebarProps) => {
  const formatChatTime = (timestamp: number) => {
    const now = Date.now()
    const diff = now - timestamp
    const hours = diff / (1000 * 60 * 60)

    if (hours < 24) {
      return format(timestamp, 'HH:mm')
    } else if (hours < 48) {
      return 'Yesterday'
    } else if (hours < 168) {
      return format(timestamp, 'EEEE')
    } else {
      return format(timestamp, 'MMM d')
    }
  }

  return (
    <div className="w-16 bg-gray-950 border-r border-gray-800 flex flex-col items-center py-4">
      {/* Logo/Home */}
      <div className="text-2xl mb-6 opacity-70">
        🤖
      </div>

      {/* New Chat Button */}
      <TooltipButton
        icon={<Plus size={20} />}
        tooltip="New Chat (Cmd+N)"
        onClick={onNewChat}
        className="mb-4"
      />

      <div className="w-12 h-px bg-gray-800 mb-4" />

      {/* Chat List - Scrollable */}
      <div className="flex-1 overflow-y-auto space-y-2 w-full px-2 scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent">
        {chats.slice(0, 15).map((chat) => (
          <div key={chat.id} className="relative group">
            <TooltipButton
              icon={<MessageSquare size={18} />}
              tooltip={`${chat.title}\n${formatChatTime(chat.updatedAt)}`}
              isActive={chat.id === currentChatId}
              onClick={() => onSelectChat(chat.id)}
            />
            {/* Delete button on hover */}
            {chat.id === currentChatId && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  if (confirm('Delete this chat?')) {
                    onDeleteChat(chat.id)
                  }
                }}
                className="absolute -right-1 -top-1 w-5 h-5 bg-red-600 hover:bg-red-700 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                title="Delete chat"
              >
                <Trash2 size={12} />
              </button>
            )}
          </div>
        ))}
        {chats.length > 15 && (
          <div className="text-xs text-gray-500 text-center py-2">
            +{chats.length - 15} more
          </div>
        )}
      </div>

      <div className="w-12 h-px bg-gray-800 my-4" />

      {/* Settings Button */}
      <TooltipButton
        icon={<SettingsIcon size={20} />}
        tooltip="Settings (Cmd+,)"
        onClick={onOpenSettings}
      />
    </div>
  )
}

// Tooltip Button Component
interface TooltipButtonProps {
  icon: React.ReactNode
  tooltip: string
  onClick: () => void
  isActive?: boolean
  className?: string
}

const TooltipButton = ({ icon, tooltip, onClick, isActive, className = '' }: TooltipButtonProps) => {
  return (
    <div className="relative group">
      <button
        onClick={onClick}
        className={`
          w-12 h-12 rounded-xl flex items-center justify-center
          transition-all duration-200
          ${isActive
            ? 'bg-blue-600 text-white'
            : 'bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white'
          }
          ${className}
        `}
        aria-label={tooltip}
      >
        {icon}
      </button>

      {/* Tooltip */}
      <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity z-50">
        <div className="bg-gray-900 border border-gray-700 px-3 py-2 rounded-lg shadow-lg whitespace-pre-wrap text-sm max-w-xs">
          {tooltip}
        </div>
        {/* Arrow */}
        <div className="absolute right-full top-1/2 -translate-y-1/2 mr-px">
          <div className="w-0 h-0 border-t-4 border-t-transparent border-b-4 border-b-transparent border-r-4 border-r-gray-700" />
        </div>
      </div>
    </div>
  )
}

export default CollapsedSidebar
