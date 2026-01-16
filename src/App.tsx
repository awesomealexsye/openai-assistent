import { useEffect } from 'react'
import { useStore } from './store'
import CollapsedSidebar from './components/CollapsedSidebar'
import SplitViewContainer from './components/SplitViewContainer'
import Settings from './components/Settings'
import TitleBar from './components/TitleBar'

function App() {
  const {
    chats,
    currentChatId,
    loadChats,
    loadSettings,
    isSettingsOpen,
    createNewChat,
    selectChat,
    deleteChat,
    toggleSettings,
  } = useStore()

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
        {/* Collapsed Sidebar */}
        <CollapsedSidebar
          chats={chats}
          currentChatId={currentChatId}
          onNewChat={createNewChat}
          onSelectChat={selectChat}
          onDeleteChat={deleteChat}
          onOpenSettings={toggleSettings}
        />

        {/* Split View Container - 50/50 Realtime + Traditional */}
        <SplitViewContainer />
      </div>

      {/* Settings Modal */}
      {isSettingsOpen && <Settings />}
    </div>
  )
}

export default App
