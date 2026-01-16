import { useState, useEffect } from 'react'
import { Mic, Speaker } from 'lucide-react'
import { AudioInputSource } from '../types'
import { detectBlackholeDevice } from '../lib/audioDevices'

interface AudioInputSelectorProps {
  source: AudioInputSource
  onSourceChange: (source: AudioInputSource) => void
  disabled?: boolean
}

const AudioInputSelector = ({ source, onSourceChange, disabled = false }: AudioInputSelectorProps) => {
  const [hasBlackhole, setHasBlackhole] = useState(false)

  useEffect(() => {
    const checkBlackhole = async () => {
      const device = await detectBlackholeDevice()
      setHasBlackhole(!!device)
    }
    checkBlackhole()
  }, [])

  return (
    <div className="flex gap-2">
      <button
        onClick={() => !disabled && onSourceChange('microphone')}
        disabled={disabled}
        className={`
          flex-1 px-4 py-2.5 rounded-lg transition-all flex items-center justify-center gap-2
          ${source === 'microphone'
            ? 'bg-blue-600 text-white'
            : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white'
          }
          disabled:opacity-50 disabled:cursor-not-allowed
        `}
      >
        <Mic size={18} />
        <span>Microphone</span>
      </button>

      <button
        onClick={() => !disabled && hasBlackhole && onSourceChange('system-audio')}
        disabled={disabled || !hasBlackhole}
        className={`
          flex-1 px-4 py-2.5 rounded-lg transition-all flex items-center justify-center gap-2 relative
          ${source === 'system-audio'
            ? 'bg-purple-600 text-white'
            : hasBlackhole
              ? 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white'
              : 'bg-gray-900 text-gray-600 cursor-not-allowed'
          }
          disabled:opacity-50 disabled:cursor-not-allowed
        `}
        title={!hasBlackhole ? 'BlackHole not detected. Install BlackHole to use system audio.' : 'System Audio (BlackHole)'}
      >
        <Speaker size={18} />
        <span>System Audio</span>
        {!hasBlackhole && (
          <span className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-500 rounded-full border-2 border-gray-900" />
        )}
      </button>
    </div>
  )
}

export default AudioInputSelector
