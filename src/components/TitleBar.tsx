import { useState, useEffect } from 'react'
import { Minus, Square, X } from 'lucide-react'

export default function TitleBar() {
  const [isMaximized, setIsMaximized] = useState(false)

  useEffect(() => {
    const checkMaximized = async () => {
      if (window.electronAPI) {
        const maximized = await window.electronAPI.isWindowMaximized()
        setIsMaximized(maximized)
      }
    }
    checkMaximized()
  }, [])

  const handleMinimize = async () => {
    if (window.electronAPI) {
      await window.electronAPI.windowMinimize()
    }
  }

  const handleMaximize = async () => {
    if (window.electronAPI) {
      await window.electronAPI.windowMaximize()
      const maximized = await window.electronAPI.isWindowMaximized()
      setIsMaximized(maximized)
    }
  }

  const handleClose = async () => {
    if (window.electronAPI) {
      await window.electronAPI.windowClose()
    }
  }

  return (
    <div
      className="fixed top-0 left-0 right-0 h-12 bg-gray-800/50 backdrop-blur-sm border-b border-gray-700/50 flex items-center justify-between px-4 z-50"
      style={{ WebkitAppRegion: 'drag' } as any}
    >
      {/* Left side - App title */}
      <div className="flex items-center space-x-3 select-none">
        <span className="text-sm font-medium text-gray-300">Arbaz Macbook</span>
      </div>

      {/* Right side - Window controls */}
      <div className="flex items-center space-x-2" style={{ WebkitAppRegion: 'no-drag' } as any}>
        <button
          onClick={handleMinimize}
          className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-gray-700/50 transition-colors"
          title="Minimize"
        >
          <Minus className="w-4 h-4 text-gray-400" />
        </button>
        <button
          onClick={handleMaximize}
          className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-gray-700/50 transition-colors"
          title={isMaximized ? 'Restore' : 'Maximize'}
        >
          <Square className="w-3.5 h-3.5 text-gray-400" />
        </button>
        <button
          onClick={handleClose}
          className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-red-500/80 transition-colors group"
          title="Close"
        >
          <X className="w-4 h-4 text-gray-400 group-hover:text-white" />
        </button>
      </div>
    </div>
  )
}
