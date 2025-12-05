import { Message } from '../types'
import { User } from 'lucide-react'
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
import ResponseGrid from './ResponseGrid'

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

  // Group messages: user messages with their corresponding assistant responses
  const groupedMessages: Array<{ user: Message; responses: Message[]; responseCount: number }> = []

  for (const msg of messages) {
    if (msg.role === 'user') {
      groupedMessages.push({ user: msg, responses: [], responseCount: 1 })
    } else if (msg.role === 'assistant') {
      if (msg.parentMessageId) {
        // This is a multi-response message
        const group = groupedMessages.find(g => g.user.id === msg.parentMessageId)
        if (group) {
          group.responses.push(msg)
          // Update response count based on actual responses
          group.responseCount = Math.max(group.responseCount, (msg.responseIndex ?? 0) + 1)
        }
      } else {
        // Legacy single response - add to last user message
        if (groupedMessages.length > 0) {
          const lastGroup = groupedMessages[groupedMessages.length - 1]
          lastGroup.responses.push(msg)
        }
      }
    }
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {groupedMessages.map((group) => (
        <div key={group.user.id} className="space-y-4">
          {/* User Message */}
          <div className="flex gap-4 justify-end">
            <div className="flex-1 max-w-3xl bg-blue-600/20 border border-blue-500/30 rounded-2xl px-5 py-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-gray-400">You</span>
                <span className="text-xs text-gray-500">
                  {format(group.user.timestamp, 'h:mm a')}
                </span>
              </div>
              <div className="text-gray-100 leading-relaxed">
                {renderMessageContent(group.user.content)}
              </div>
            </div>
            <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center flex-shrink-0">
              <User size={18} className="text-gray-300" />
            </div>
          </div>

          {/* Assistant Response(s) */}
          {group.responses.length > 0 && (
            <ResponseGrid
              responses={group.responses}
              responseCount={group.responseCount}
              isStreaming={Array(group.responseCount).fill(false)}
            />
          )}
        </div>
      ))}
    </div>
  )
}

export default MessageList
