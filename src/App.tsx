import { useEffect, useState } from 'react'
import { useStore } from './store'
import Sidebar from './components/Sidebar'
import ChatPanel from './components/ChatPanel'
import Settings from './components/Settings'
import TitleBar from './components/TitleBar'

function App() {
  const { loadChats, loadSettings, isSettingsOpen, settings } = useStore()
  const [clickThroughEnabled, setClickThroughEnabled] = useState(false)

  useEffect(() => {
    loadChats()
    loadSettings()
  }, [loadChats, loadSettings])

  // Listen for click-through toggle shortcut (Cmd+Shift+C)
  useEffect(() => {
    if (window.electronAPI?.onClickThroughToggle) {
      window.electronAPI.onClickThroughToggle(async () => {
        const newState = !clickThroughEnabled
        setClickThroughEnabled(newState)
        await window.electronAPI?.setClickThrough(newState)
      })
    }

    return () => {
      if (window.electronAPI?.removeClickThroughToggleListener) {
        window.electronAPI.removeClickThroughToggleListener()
      }
    }
  }, [clickThroughEnabled])

  return (
    <div className="w-full h-full flex flex-col bg-gray-900">
      {/* Custom Title Bar */}
      <TitleBar />

      {/* Main Layout */}
      <div className="flex w-full h-full pt-12">
        {/* Sidebar */}
        <Sidebar />

        {/* Chat Panel - Full Width */}
        <ChatPanel />
      </div>

      {/* Settings Modal */}
      {isSettingsOpen && <Settings />}

      {/* Click-Through Mode Indicator */}
      {clickThroughEnabled && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-[100] pointer-events-none">
          <div className="px-4 py-2 bg-cyan-600 backdrop-blur-sm rounded-full text-white text-sm font-medium shadow-lg border-2 border-cyan-400 flex items-center gap-2 animate-pulse">
            <div className="w-3 h-3 bg-white rounded-full" />
            STEALTH MODE — Clicks pass through — ⌘+Shift+C to interact
          </div>
        </div>
      )}

      {/* Exam Mode Ready Indicator (when exam mode on but click-through off) */}
      {settings.examMode && !clickThroughEnabled && !isSettingsOpen && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-[100] pointer-events-none">
          <div className="px-4 py-2 bg-purple-600/80 backdrop-blur-sm rounded-full text-white text-xs font-medium shadow-lg flex items-center gap-2">
            <div className="w-2 h-2 bg-purple-300 rounded-full" />
            Exam Mode — Press ⌘+Shift+C for stealth
          </div>
        </div>
      )}
    </div>
  )
}

export default App
