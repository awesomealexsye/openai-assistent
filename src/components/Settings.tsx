import { useState, useEffect } from 'react'
import { useStore } from '../store'
import { X, Eye, EyeOff, Check, AlertCircle, Mic, Speaker } from 'lucide-react'
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
                  <p className="text-sm text-gray-400">Hide window during screen sharing</p>
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
                  <label className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all hover:bg-gray-800/50 ${
                    settings.audioInputSource === 'microphone'
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
                  <label className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                    settings.audioInputSource === 'system-audio'
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

          {/* Theme Settings */}
          <div className="border-t border-gray-700 pt-6">
            <h3 className="text-lg font-medium mb-4">Appearance</h3>

            <div>
              <label className="block text-sm font-medium mb-2">Theme</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => updateSettings({ theme: 'dark' })}
                  className={`p-3 rounded-lg border-2 transition-all ${
                    settings.theme === 'dark'
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
                  className={`p-3 rounded-lg border-2 transition-all ${
                    settings.theme === 'light'
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
    </div>
  )
}

export default Settings
