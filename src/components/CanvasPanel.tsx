import { useStore } from '../store'
import { Code, Copy, Check } from 'lucide-react'
import { useState } from 'react'
import Prism from 'prismjs'
import 'prismjs/themes/prism-tomorrow.css'

const CanvasPanel = () => {
  const { codeBlocks } = useStore()
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null)

  const handleCopy = async (code: string, index: number) => {
    try {
      await navigator.clipboard.writeText(code)
      setCopiedIndex(index)
      setTimeout(() => setCopiedIndex(null), 2000)
    } catch (error) {
      console.error('Failed to copy:', error)
    }
  }

  if (codeBlocks.length === 0) {
    return (
      <div className="w-96 h-full glass-dark border-l border-gray-800 flex flex-col items-center justify-center text-gray-500 p-8 text-center">
        <Code size={48} className="mb-4 opacity-30" />
        <h3 className="text-lg font-medium mb-2">Code Canvas</h3>
        <p className="text-sm">
          Code snippets from the conversation will appear here for easy reference and copying
        </p>
      </div>
    )
  }

  return (
    <div className="w-96 h-full glass-dark border-l border-gray-800 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-800">
        <div className="flex items-center gap-2">
          <Code size={20} className="text-blue-400" />
          <h3 className="text-lg font-semibold">Code Canvas</h3>
          <span className="text-xs text-gray-500 ml-auto">
            {codeBlocks.length} snippet{codeBlocks.length !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      {/* Code Blocks */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {codeBlocks.map((block, index) => (
          <div
            key={index}
            className="glass rounded-lg border border-gray-700 overflow-hidden"
          >
            {/* Code Header */}
            <div className="flex items-center justify-between px-4 py-2 bg-gray-800/50 border-b border-gray-700">
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-gray-400">
                  {block.language}
                </span>
                {block.filename && (
                  <>
                    <span className="text-gray-600">•</span>
                    <span className="text-xs text-gray-500">{block.filename}</span>
                  </>
                )}
              </div>
              <button
                onClick={() => handleCopy(block.code, index)}
                className="p-1.5 hover:bg-gray-700 rounded transition-colors"
                title="Copy code"
              >
                {copiedIndex === index ? (
                  <Check size={14} className="text-green-400" />
                ) : (
                  <Copy size={14} className="text-gray-400" />
                )}
              </button>
            </div>

            {/* Code Content */}
            <div className="overflow-x-auto">
              <pre className="!m-0 !bg-transparent text-xs">
                <code
                  className={`language-${block.language}`}
                  dangerouslySetInnerHTML={{
                    __html: Prism.highlight(
                      block.code,
                      Prism.languages[block.language] || Prism.languages.plaintext,
                      block.language
                    ),
                  }}
                />
              </pre>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default CanvasPanel
