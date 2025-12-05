import { useState, useEffect } from 'react'
import { useStore } from '../store'
import { X, Eye, EyeOff, Check, AlertCircle, Mic, Speaker, Zap } from 'lucide-react'
import { testApiKey } from '../services/openai'
import { getAudioInputDevices, detectBlackholeDevice, type AudioDevice } from '../lib/audioDevices'

const Settings = () => {
  const { settings, updateSettings, toggleSettings } = useStore()
  const [apiKey, setApiKey] = useState(settings.apiKey)
  const [showApiKey, setShowApiKey] = useState(false)
  const [isTestingKey, setIsTestingKey] = useState(false)
  const [keyValid, setKeyValid] = useState<boolean | null>(null)

  // Audio device states
  const [audioDevices, setAudioDevices] = useState<AudioDevice[]>([])
  const [hasBlackhole, setHasBlackhole] = useState(false)
  const [loadingDevices, setLoadingDevices] = useState(true)

  // Microphone permission states
  const [micPermissionStatus, setMicPermissionStatus] = useState<'checking' | 'granted' | 'denied' | 'not-determined'>('checking')
  const [isRequestingPermission, setIsRequestingPermission] = useState(false)

  // Realtime mode modal state
  const [showRealtimeModal, setShowRealtimeModal] = useState(false)

  // Load audio devices on mount
  useEffect(() => {
    const loadDevices = async () => {
      try {
        const devices = await getAudioInputDevices()
        setAudioDevices(devices)

        const blackholeDevice = await detectBlackholeDevice()
        setHasBlackhole(!!blackholeDevice)

        setLoadingDevices(false)
      } catch (error) {
        console.error('Failed to load audio devices:', error)
        setLoadingDevices(false)
      }
    }

    loadDevices()
  }, [])

  // Check microphone permission on mount and when settings open
  useEffect(() => {
    const checkPermission = async () => {
      if (window.electronAPI && window.electronAPI.checkMicrophonePermission) {
        try {
          const result = await window.electronAPI.checkMicrophonePermission()
          setMicPermissionStatus(result.status as 'granted' | 'denied' | 'not-determined')
        } catch (error) {
          console.error('Error checking microphone permission:', error)
          setMicPermissionStatus('denied')
        }
      } else {
        // In browser/dev mode, try to check via browser API
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
          stream.getTracks().forEach(track => track.stop())
          setMicPermissionStatus('granted')
        } catch (error) {
          setMicPermissionStatus('denied')
        }
      }
    }

    checkPermission()
  }, [])

  const handleRequestMicrophonePermission = async () => {
    setIsRequestingPermission(true)
    try {
      if (window.electronAPI && window.electronAPI.requestMicrophonePermission) {
        // First try Electron API
        const granted = await window.electronAPI.requestMicrophonePermission()

        if (!granted) {
          // If not granted or status is 'denied', we need to trigger actual mic access
          // This will show the native macOS dialog
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
          stream.getTracks().forEach(track => track.stop())
          setMicPermissionStatus('granted')
        } else {
          setMicPermissionStatus('granted')
        }
      } else {
        // Fallback to browser API
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
        stream.getTracks().forEach(track => track.stop())
        setMicPermissionStatus('granted')
      }
    } catch (error) {
      console.error('Failed to request microphone permission:', error)
      setMicPermissionStatus('denied')
    } finally {
      setIsRequestingPermission(false)
    }
  }

  const handleOpenSystemPreferences = async () => {
    if (window.electronAPI && window.electronAPI.openSystemPreferencesSecurity) {
      await window.electronAPI.openSystemPreferencesSecurity()
    }
  }

  const handleTestApiKey = async () => {
    if (!apiKey) return
    setIsTestingKey(true)
    const isValid = await testApiKey(apiKey)
    setKeyValid(isValid)
    setIsTestingKey(false)
  }

  const handleSave = async () => {
    await updateSettings({ apiKey })
    toggleSettings()
  }

  const handleResponseModeChange = (mode: 'normal' | 'realtime') => {
    if (mode === 'realtime') {
      // Show the "under development" modal instead of allowing the change
      setShowRealtimeModal(true)
    } else {
      updateSettings({ responseMode: mode })
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="glass-dark rounded-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden border border-gray-700">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <h2 className="text-xl font-semibold text-white">Settings</h2>
          <button
            onClick={toggleSettings}
            className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(80vh-140px)] space-y-6">
          {/* API Key Section */}
          <div>
            <h3 className="text-lg font-medium mb-4">OpenAI API Configuration</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">API Key</label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <input
                      type={showApiKey ? 'text' : 'password'}
                      value={apiKey}
                      onChange={(e) => {
                        setApiKey(e.target.value)
                        setKeyValid(null)
                      }}
                      placeholder="sk-..."
                      className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-blue-500 pr-10"
                    />
                    <button
                      onClick={() => setShowApiKey(!showApiKey)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-300"
                    >
                      {showApiKey ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  <button
                    onClick={handleTestApiKey}
                    disabled={!apiKey || isTestingKey}
                    className="px-4 py-2.5 bg-gray-700 hover:bg-gray-600 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {isTestingKey ? 'Testing...' : 'Test'}
                  </button>
                </div>
                {keyValid !== null && (
                  <div className={`flex items-center gap-2 mt-2 text-sm ${keyValid ? 'text-green-400' : 'text-red-400'}`}>
                    {keyValid ? <Check size={16} /> : <AlertCircle size={16} />}
                    {keyValid ? 'API key is valid' : 'API key is invalid'}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Model</label>
                <select
                  value={settings.model}
                  onChange={(e) => updateSettings({ model: e.target.value })}
                  className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-blue-500"
                >
                  <option value="gpt-4o">GPT-4o (Latest)</option>
                  <option value="gpt-4o-mini">GPT-4o Mini (Fast & Cheap)</option>
                  <option value="gpt-4-turbo-preview">GPT-4 Turbo</option>
                  <option value="gpt-4">GPT-4</option>
                  <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Temperature: {settings.temperature}
                </label>
                <input
                  type="range"
                  min="0"
                  max="2"
                  step="0.1"
                  value={settings.temperature}
                  onChange={(e) => updateSettings({ temperature: parseFloat(e.target.value) })}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>Precise</span>
                  <span>Creative</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Max Tokens: {settings.maxTokens}
                </label>
                <input
                  type="range"
                  min="256"
                  max="8192"
                  step="256"
                  value={settings.maxTokens}
                  onChange={(e) => updateSettings({ maxTokens: parseInt(e.target.value) })}
                  className="w-full"
                />
              </div>
            </div>
          </div>

          {/* AssemblyAI Configuration */}
          <div className="border-t border-gray-700 pt-6">
            <h3 className="text-lg font-medium mb-4">AssemblyAI Configuration</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">API Key</label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <input
                      type={showApiKey ? 'text' : 'password'}
                      value={settings.assemblyAiApiKey || ''}
                      onChange={(e) => updateSettings({ assemblyAiApiKey: e.target.value })}
                      placeholder="Enter AssemblyAI API Key"
                      className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-blue-500 pr-10"
                    />
                    <button
                      onClick={() => setShowApiKey(!showApiKey)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-300"
                    >
                      {showApiKey ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  <button
                    onClick={async () => {
                      if (!settings.assemblyAiApiKey) return
                      setIsTestingKey(true)
                      try {
                        const token = await window.electronAPI.createAssemblyAiToken(settings.assemblyAiApiKey)
                        setKeyValid(!!token)
                        alert('AssemblyAI API Key is valid!')
                      } catch (error) {
                        console.error(error)
                        setKeyValid(false)
                        alert('AssemblyAI API Key is invalid: ' + (error instanceof Error ? error.message : String(error)))
                      } finally {
                        setIsTestingKey(false)
                      }
                    }}
                    disabled={!settings.assemblyAiApiKey || isTestingKey}
                    className="px-4 py-2.5 bg-gray-700 hover:bg-gray-600 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {isTestingKey ? 'Testing...' : 'Test'}
                  </button>
                </div>
                <p className="mt-2 text-xs text-gray-400">
                  Required for real-time speech-to-text. Get a key from <a href="https://www.assemblyai.com/" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">AssemblyAI</a>.
                </p>
              </div>
            </div>
          </div>

          {/* Window Settings */}
          <div className="border-t border-gray-700 pt-6">
            <h3 className="text-lg font-medium mb-4">Window Settings</h3>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Always on Top</p>
                  <p className="text-sm text-gray-400">Keep window above all others</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.alwaysOnTop}
                    onChange={(e) => updateSettings({ alwaysOnTop: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Screen Protection</p>
                  <p className="text-sm text-gray-400">Hide window in screen recordings and screen sharing (enabled by default)</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.screenProtection}
                    onChange={(e) => updateSettings({ screenProtection: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Window Opacity: {Math.round(settings.opacity * 100)}%
                </label>
                <input
                  type="range"
                  min="0.5"
                  max="1"
                  step="0.05"
                  value={settings.opacity}
                  onChange={(e) => updateSettings({ opacity: parseFloat(e.target.value) })}
                  className="w-full"
                />
              </div>
            </div>
          </div>

          {/* Audio Input Settings */}
          <div className="border-t border-gray-700 pt-6">
            <h3 className="text-lg font-medium mb-4">Audio Input</h3>

            <div className="space-y-4">
              {/* Audio Source Selection */}
              <div>
                <label className="block text-sm font-medium mb-3">Audio Source</label>
                <div className="space-y-2">
                  {/* Microphone Option */}
                  <label className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all hover:bg-gray-800/50 ${settings.audioInputSource === 'microphone'
                    ? 'border-blue-500 bg-blue-500/10'
                    : 'border-gray-700'
                    }`}>
                    <input
                      type="radio"
                      name="audioSource"
                      value="microphone"
                      checked={settings.audioInputSource === 'microphone'}
                      onChange={(e) => updateSettings({ audioInputSource: e.target.value as 'microphone' | 'system-audio' })}
                      className="w-4 h-4 text-blue-600"
                    />
                    <Mic size={20} className="text-gray-400" />
                    <div className="flex-1">
                      <div className="font-medium">Microphone</div>
                      <div className="text-xs text-gray-400">Capture audio from your microphone (your voice)</div>
                    </div>
                  </label>

                  {/* System Audio Option */}
                  <label className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${settings.audioInputSource === 'system-audio'
                    ? 'border-blue-500 bg-blue-500/10'
                    : 'border-gray-700'
                    } ${!hasBlackhole ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-800/50'}`}>
                    <input
                      type="radio"
                      name="audioSource"
                      value="system-audio"
                      checked={settings.audioInputSource === 'system-audio'}
                      onChange={(e) => updateSettings({ audioInputSource: e.target.value as 'microphone' | 'system-audio' })}
                      disabled={!hasBlackhole}
                      className="w-4 h-4 text-blue-600"
                    />
                    <Speaker size={20} className="text-gray-400" />
                    <div className="flex-1">
                      <div className="font-medium">System Audio (Blackhole)</div>
                      <div className="text-xs text-gray-400">Capture meeting audio from Zoom/Meet/Teams</div>
                    </div>
                  </label>
                </div>

                {/* Blackhole Not Detected Warning */}
                {!hasBlackhole && !loadingDevices && (
                  <div className="mt-3 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                    <div className="flex items-start gap-2 text-sm text-yellow-400">
                      <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
                      <div>
                        <div className="font-medium mb-1">Blackhole not detected</div>
                        <div className="text-xs text-yellow-400/80">
                          Install <a href="https://github.com/ExistentialAudio/BlackHole" target="_blank" rel="noopener noreferrer" className="underline hover:text-yellow-300">BlackHole</a> to capture system audio from meetings.
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Blackhole Setup Instructions */}
                {hasBlackhole && settings.audioInputSource === 'system-audio' && (
                  <div className="mt-3 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                    <div className="flex items-start gap-2 text-sm text-blue-400">
                      <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
                      <div>
                        <div className="font-medium mb-1">Setup Required</div>
                        <div className="text-xs text-blue-400/80">
                          To capture system audio, you must configure macOS audio routing.
                          See <span className="font-mono underline cursor-pointer hover:text-blue-300">BLACKHOLE_SETUP.md</span> for detailed instructions.
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Loading State */}
                {loadingDevices && (
                  <div className="mt-3 text-sm text-gray-400">
                    Loading audio devices...
                  </div>
                )}
              </div>

              {/* Microphone Permission Status */}
              <div className="p-4 bg-gray-800/30 rounded-lg border border-gray-700">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Mic size={18} className="text-gray-400" />
                    <span className="font-medium">Microphone Permission</span>
                  </div>
                  {micPermissionStatus === 'checking' && (
                    <span className="text-xs text-gray-400">Checking...</span>
                  )}
                  {micPermissionStatus === 'granted' && (
                    <div className="flex items-center gap-1.5 px-2 py-1 bg-green-500/20 text-green-400 rounded text-xs">
                      <Check size={14} />
                      <span>Granted</span>
                    </div>
                  )}
                  {(micPermissionStatus === 'denied' || micPermissionStatus === 'not-determined') && (
                    <div className="flex items-center gap-1.5 px-2 py-1 bg-red-500/20 text-red-400 rounded text-xs">
                      <AlertCircle size={14} />
                      <span>Not Granted</span>
                    </div>
                  )}
                </div>

                {(micPermissionStatus === 'denied' || micPermissionStatus === 'not-determined') && (
                  <div className="space-y-2">
                    <p className="text-xs text-gray-400">
                      Voice recording requires microphone access. Click below to grant permission.
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={handleRequestMicrophonePermission}
                        disabled={isRequestingPermission}
                        className="flex-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600/50 text-white rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
                      >
                        {isRequestingPermission ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            <span>Requesting...</span>
                          </>
                        ) : (
                          <>
                            <Mic size={16} />
                            <span>Grant Permission</span>
                          </>
                        )}
                      </button>
                      <button
                        onClick={handleOpenSystemPreferences}
                        className="px-3 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg text-sm font-medium transition-colors"
                        title="Open System Settings"
                      >
                        Open Settings
                      </button>
                    </div>
                  </div>
                )}

                {micPermissionStatus === 'granted' && (
                  <p className="text-xs text-gray-400">
                    Microphone access is enabled. You can use voice recording features.
                  </p>
                )}
              </div>

              {/* Device Selection - Show when system-audio is selected */}
              {settings.audioInputSource === 'system-audio' && hasBlackhole && audioDevices.length > 0 && (
                <div>
                  <label className="block text-sm font-medium mb-2">Audio Device</label>
                  <select
                    value={settings.selectedAudioDeviceId || ''}
                    onChange={(e) => updateSettings({ selectedAudioDeviceId: e.target.value || undefined })}
                    className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-blue-500"
                  >
                    <option value="">Select device...</option>
                    {audioDevices.map((device) => (
                      <option key={device.deviceId} value={device.deviceId}>
                        {device.label || `Device ${device.deviceId.substring(0, 8)}`}
                      </option>
                    ))}
                  </select>
                  <p className="mt-2 text-xs text-gray-400">
                    Select the Blackhole audio device to capture system audio
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Response Mode Settings */}
          <div className="border-t border-gray-700 pt-6">
            <h3 className="text-lg font-medium mb-4">Response Mode</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-3">Mode Selection</label>
                <div className="space-y-2">
                  {/* Normal Mode */}
                  <label className={`flex items-start gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all hover:bg-gray-800/50 ${settings.responseMode === 'normal'
                    ? 'border-blue-500 bg-blue-500/10'
                    : 'border-gray-700'
                    }`}>
                    <input
                      type="radio"
                      name="responseMode"
                      value="normal"
                      checked={settings.responseMode === 'normal'}
                      onChange={(e) => handleResponseModeChange(e.target.value as 'normal' | 'realtime')}
                      className="w-4 h-4 text-blue-600 mt-1"
                    />
                    <div className="flex-1">
                      <div className="font-medium flex items-center gap-2">
                        Normal Mode
                        <span className="text-xs px-2 py-0.5 bg-green-500/20 text-green-400 rounded">Recommended</span>
                      </div>
                      <div className="text-xs text-gray-400 mt-1">
                        Record → Transcribe → Review → Send → Response
                      </div>
                      <div className="text-xs text-gray-500 mt-2">
                        • Can review and edit before sending<br />
                        • Cost: ~$0.006/min audio + tokens<br />
                        • Works with all GPT models
                      </div>
                    </div>
                  </label>

                  {/* Realtime Mode */}
                  <label className={`flex items-start gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all opacity-60 ${settings.responseMode === 'realtime'
                    ? 'border-purple-500 bg-purple-500/10'
                    : 'border-gray-700 hover:bg-gray-800/30'
                    }`}>
                    <input
                      type="radio"
                      name="responseMode"
                      value="realtime"
                      checked={settings.responseMode === 'realtime'}
                      onChange={(e) => handleResponseModeChange(e.target.value as 'normal' | 'realtime')}
                      className="w-4 h-4 text-purple-600 mt-1"
                    />
                    <Zap size={20} className="text-purple-400 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <div className="font-medium flex items-center gap-2">
                        Realtime Mode
                        <span className="text-xs px-2 py-0.5 bg-yellow-500/20 text-yellow-400 rounded">Coming Soon</span>
                      </div>
                      <div className="text-xs text-gray-400 mt-1">
                        Speak → Instant text response via WebSocket
                      </div>
                      <div className="text-xs text-gray-500 mt-2">
                        • 2x faster responses (~500ms)<br />
                        • Cost: ~$0.06/min audio + tokens<br />
                        • No review (auto-sends)
                      </div>
                    </div>
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Response Count Settings */}
          <div className="border-t border-gray-700 pt-6">
            <h3 className="text-lg font-medium mb-4">Response Configuration</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-3">Number of Responses</label>
                <div className="grid grid-cols-4 gap-2">
                  {[1, 2, 3, 4].map((count) => (
                    <button
                      key={count}
                      onClick={() => updateSettings({ responseCount: count as 1 | 2 | 3 | 4 })}
                      className={`p-4 rounded-lg border-2 transition-all ${settings.responseCount === count
                          ? 'border-blue-500 bg-blue-500/10'
                          : 'border-gray-700 hover:border-gray-600'
                        }`}
                    >
                      <div className="text-center">
                        <div className="text-2xl font-bold mb-1">{count}</div>
                        <div className="text-xs text-gray-400">
                          {count === 1 ? 'Response' : 'Responses'}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>

                {settings.responseCount > 1 && (
                  <div className="mt-3 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                    <div className="flex items-start gap-2 text-sm text-yellow-400">
                      <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
                      <div className="text-xs">
                        <strong>Cost Notice:</strong> Selecting {settings.responseCount} responses will multiply API costs by {settings.responseCount}x.
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Theme Settings */}
          <div className="border-t border-gray-700 pt-6">
            <h3 className="text-lg font-medium mb-4">Appearance</h3>

            <div>
              <label className="block text-sm font-medium mb-2">Theme</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => updateSettings({ theme: 'dark' })}
                  className={`p-3 rounded-lg border-2 transition-all ${settings.theme === 'dark'
                    ? 'border-blue-500 bg-blue-500/10'
                    : 'border-gray-700 hover:border-gray-600'
                    }`}
                >
                  <div className="text-center">
                    <div className="text-sm font-medium">Dark</div>
                  </div>
                </button>
                <button
                  onClick={() => updateSettings({ theme: 'light' })}
                  className={`p-3 rounded-lg border-2 transition-all ${settings.theme === 'light'
                    ? 'border-blue-500 bg-blue-500/10'
                    : 'border-gray-700 hover:border-gray-600'
                    }`}
                >
                  <div className="text-center">
                    <div className="text-sm font-medium">Light</div>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-6 border-t border-gray-700">
          <button
            onClick={toggleSettings}
            className="px-6 py-2.5 hover:bg-gray-700 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
          >
            Save Changes
          </button>
        </div>
      </div>

      {/* Realtime Mode Under Development Modal */}
      {showRealtimeModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[60]" onClick={() => setShowRealtimeModal(false)}>
          <div className="glass-dark rounded-2xl w-full max-w-md mx-4 border border-gray-700" onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-700">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-yellow-500/20 rounded-lg">
                  <Zap className="text-yellow-400" size={24} />
                </div>
                <h3 className="text-xl font-semibold text-white">Realtime Mode</h3>
              </div>
              <button
                onClick={() => setShowRealtimeModal(false)}
                className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Content */}
            <div className="p-6">
              <div className="space-y-4">
                <div className="flex items-start gap-3 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                  <AlertCircle size={20} className="text-blue-400 mt-0.5 flex-shrink-0" />
                  <div className="text-sm">
                    <p className="text-blue-400 font-medium mb-2">Feature Under Development</p>
                    <p className="text-gray-300">
                      Realtime Mode is currently under development and will be available in a future update.
                      We're working hard to bring you instant voice-to-text responses!
                    </p>
                  </div>
                </div>

                <div className="text-sm text-gray-400">
                  <p className="mb-2">For now, please use <span className="font-semibold text-white">Normal Mode</span>, which offers:</p>
                  <ul className="list-disc list-inside space-y-1 ml-2">
                    <li>Review and edit transcriptions before sending</li>
                    <li>Lower cost (~$0.006/min vs $0.06/min)</li>
                    <li>Works with all GPT models</li>
                  </ul>
                </div>

                <p className="text-sm text-gray-500 italic">
                  Stay tuned! We'll notify you when Realtime Mode is ready. 🚀
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="flex justify-end gap-3 p-6 border-t border-gray-700">
              <button
                onClick={() => setShowRealtimeModal(false)}
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors font-medium"
              >
                Got it
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Settings
