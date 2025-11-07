import { Message } from '../types'
import { User, Bot } from 'lucide-react'
import { format } from 'date-fns'
import Prism from 'prismjs'
import 'prismjs/themes/prism-tomorrow.css'
import 'prismjs/components/prism-javascript'
import 'prismjs/components/prism-typescript'
import 'prismjs/components/prism-python'
import 'prismjs/components/prism-java'
import 'prismjs/components/prism-bash'
import 'prismjs/components/prism-json'
import 'prismjs/components/prism-markdown'
import { useEffect } from 'react'

interface MessageListProps {
  messages: Message[]
}

const MessageList = ({ messages }: MessageListProps) => {
  useEffect(() => {
    Prism.highlightAll()
  }, [messages])

  const renderMessageContent = (content: string) => {
    // Parse code blocks with language specifiers
    const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g
    const parts: JSX.Element[] = []
    let lastIndex = 0
    let match

    while ((match = codeBlockRegex.exec(content)) !== null) {
      // Add text before code block
      if (match.index > lastIndex) {
        const text = content.slice(lastIndex, match.index)
        parts.push(
          <span key={`text-${lastIndex}`} className="whitespace-pre-wrap">
            {text}
          </span>
        )
      }

      // Add code block
      const language = match[1] || 'plaintext'
      const code = match[2].trim()
      parts.push(
        <div key={`code-${match.index}`} className="my-3">
          <div className="bg-gray-800 rounded-t-lg px-4 py-2 text-xs text-gray-400 flex items-center justify-between">
            <span>{language}</span>
          </div>
          <pre className="!mt-0 !rounded-t-none">
            <code className={`language-${language}`}>{code}</code>
          </pre>
        </div>
      )

      lastIndex = match.index + match[0].length
    }

    // Add remaining text
    if (lastIndex < content.length) {
      const text = content.slice(lastIndex)
      parts.push(
        <span key={`text-${lastIndex}`} className="whitespace-pre-wrap">
          {text}
        </span>
      )
    }

    return parts.length > 0 ? parts : <span className="whitespace-pre-wrap">{content}</span>
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {messages.map((message) => (
        <div
          key={message.id}
          className={`flex gap-4 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
        >
          {message.role === 'assistant' && (
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0">
              <Bot size={18} className="text-white" />
            </div>
          )}

          <div
            className={`flex-1 max-w-3xl ${
              message.role === 'user'
                ? 'bg-blue-600/20 border border-blue-500/30'
                : 'bg-gray-800/50 border border-gray-700/50'
            } rounded-2xl px-5 py-4`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-gray-400">
                {message.role === 'user' ? 'You' : 'Assistant'}
              </span>
              <span className="text-xs text-gray-500">
                {format(message.timestamp, 'h:mm a')}
              </span>
            </div>
            <div className="text-gray-100 leading-relaxed">
              {renderMessageContent(message.content)}
            </div>
          </div>

          {message.role === 'user' && (
            <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center flex-shrink-0">
              <User size={18} className="text-gray-300" />
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

export default MessageList
