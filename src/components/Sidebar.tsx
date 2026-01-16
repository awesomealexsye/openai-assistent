import { useState, useRef, useEffect } from 'react'
import { useStore } from '../store'
import { MessageSquare, Plus, Settings, Trash2, ChevronLeft, ChevronRight } from 'lucide-react'
import { format } from 'date-fns'

const MIN_WIDTH = 48
const MAX_WIDTH = 400
const DEFAULT_WIDTH = 256

const Sidebar = () => {
  const { chats, currentChatId, createNewChat, selectChat, deleteChat, toggleSettings, settings, updateSettings } = useStore()
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [sidebarWidth, setSidebarWidth] = useState(DEFAULT_WIDTH)
  const [isDragging, setIsDragging] = useState(false)
  const sidebarRef = useRef<HTMLDivElement>(null)

  // Handle drag to resize
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return

      const newWidth = e.clientX
      if (newWidth >= MIN_WIDTH && newWidth <= MAX_WIDTH) {
        setSidebarWidth(newWidth)
        // Auto-collapse if dragged below 100px
        if (newWidth < 100 && !isCollapsed) {
          setIsCollapsed(true)
        } else if (newWidth >= 100 && isCollapsed) {
          setIsCollapsed(false)
        }
      }
    }

    const handleMouseUp = () => {
      setIsDragging(false)
    }

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isDragging, isCollapsed])

  // Toggle collapse/expand
  const toggleCollapse = () => {
    if (isCollapsed) {
      setSidebarWidth(DEFAULT_WIDTH)
      setIsCollapsed(false)
    } else {
      setSidebarWidth(MIN_WIDTH)
      setIsCollapsed(true)
    }
  }

  // Double-click drag handle to toggle
  const handleDoubleClick = () => {
    toggleCollapse()
  }

  return (
    <div
      ref={sidebarRef}
      className="relative h-full glass-dark border-r border-gray-800 flex flex-col transition-all"
      style={{ width: `${sidebarWidth}px` }}
    >
      {/* Header */}
      <div className={`p-4 border-b border-gray-800 ${isCollapsed ? 'px-2' : ''}`}>
        <button
          onClick={createNewChat}
          className={`w-full flex items-center ${isCollapsed ? 'justify-center' : 'justify-center gap-2'
            } px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors`}
          title={isCollapsed ? 'New Chat' : ''}
        >
          <Plus size={18} />
          {!isCollapsed && 'New Chat'}
        </button>
      </div>

      {/* Chat List */}
      <div className={`flex-1 overflow-y-auto ${isCollapsed ? 'px-1 py-2' : 'p-2'}`}>
        {chats.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500 text-sm p-4 text-center">
            <MessageSquare size={isCollapsed ? 24 : 32} className="mb-2 opacity-50" />
            {!isCollapsed && (
              <>
                <p>No chats yet</p>
                <p className="text-xs mt-1">Create a new chat to get started</p>
              </>
            )}
          </div>
        ) : (
          <div className="space-y-1">
            {chats.map((chat) => (
              <div
                key={chat.id}
                className={`group relative ${isCollapsed ? 'p-2' : 'p-3'
                  } rounded-lg cursor-pointer transition-all ${currentChatId === chat.id
                    ? 'bg-blue-600/20 border border-blue-500/30'
                    : 'hover:bg-gray-800/50 border border-transparent'
                  }`}
                onClick={() => selectChat(chat.id)}
                title={isCollapsed ? chat.title : ''}
              >
                {isCollapsed ? (
                  <div className="flex items-center justify-center">
                    <MessageSquare size={16} className="text-gray-400" />
                  </div>
                ) : (
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
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Opacity Slider */}
      <div className={`${isCollapsed ? 'px-2 py-3' : 'px-4 py-3'} border-t border-gray-800`}>
        {isCollapsed ? (
          <div className="flex flex-col items-center gap-1" title={`Opacity: ${Math.round(settings.opacity * 100)}%`}>
            <div className="w-2 h-16 bg-gray-700 rounded-full relative overflow-hidden">
              <div
                className="absolute bottom-0 left-0 right-0 bg-blue-500 transition-all"
                style={{ height: `${settings.opacity * 100}%` }}
              />
            </div>
            <span className="text-[10px] text-gray-500">{Math.round(settings.opacity * 100)}%</span>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs text-gray-400">Opacity</label>
              <span className="text-xs text-gray-500">{Math.round(settings.opacity * 100)}%</span>
            </div>
            <input
              type="range"
              min="0.3"
              max="1"
              step="0.05"
              value={settings.opacity}
              onChange={(e) => updateSettings({ opacity: parseFloat(e.target.value) })}
              className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider-thumb"
            />
          </>
        )}
      </div>

      {/* Settings Button & Collapse Toggle */}
      <div className={`${isCollapsed ? 'px-2 py-4' : 'p-4'} border-t border-gray-800 space-y-2`}>
        <button
          onClick={toggleSettings}
          className={`w-full flex items-center ${isCollapsed ? 'justify-center' : 'justify-center gap-2'
            } px-4 py-2.5 hover:bg-gray-800 rounded-lg transition-colors text-gray-300`}
          title={isCollapsed ? 'Settings' : ''}
        >
          <Settings size={18} />
          {!isCollapsed && 'Settings'}
        </button>

        <button
          onClick={toggleCollapse}
          className="w-full flex items-center justify-center px-4 py-2 hover:bg-gray-800 rounded-lg transition-colors text-gray-400 hover:text-gray-200"
          title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {isCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
      </div>

      {/* Drag Handle */}
      <div
        className={`absolute right-0 top-0 bottom-0 w-1 hover:w-2 cursor-col-resize transition-all group ${isDragging ? 'bg-blue-500' : 'bg-transparent hover:bg-blue-500/50'
          }`}
        onMouseDown={handleMouseDown}
        onDoubleClick={handleDoubleClick}
      >
        <div className="absolute inset-0 -mx-2" /> {/* Wider hit area */}
      </div>
    </div>
  )
}

export default Sidebar
