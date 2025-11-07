import { useEffect } from 'react'
import { useStore } from './store'
import Sidebar from './components/Sidebar'
import ChatPanel from './components/ChatPanel'
import Settings from './components/Settings'

function App() {
  const { loadChats, loadSettings, isSettingsOpen } = useStore()

  useEffect(() => {
    loadChats()
    loadSettings()
  }, [loadChats, loadSettings])

  return (
    <div className="w-full h-full flex bg-gray-900">
      {/* macOS Traffic Lights Spacer */}
      <div className="absolute top-0 left-0 w-20 h-12 z-50" style={{ WebkitAppRegion: 'drag' } as any} />

      {/* Main Layout */}
      <div className="flex w-full h-full">
        {/* Sidebar */}
        <Sidebar />

        {/* Chat Panel - Full Width */}
        <ChatPanel />
      </div>

      {/* Settings Modal */}
      {isSettingsOpen && <Settings />}
    </div>
  )
}

export default App
