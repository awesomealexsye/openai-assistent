import { useEffect } from 'react'
import { useStore } from './store'
import Sidebar from './components/Sidebar'
import ChatPanel from './components/ChatPanel'
import Settings from './components/Settings'
import TitleBar from './components/TitleBar'

function App() {
  const { loadChats, loadSettings, isSettingsOpen } = useStore()

  useEffect(() => {
    loadChats()
    loadSettings()
  }, [loadChats, loadSettings])

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
    </div>
  )
}

export default App
