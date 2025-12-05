import { Message } from '../types'
import { Bot } from 'lucide-react'
import { format } from 'date-fns'
import Prism from 'prismjs'
import { useEffect } from 'react'

interface ResponseGridProps {
    responses: Message[]
    responseCount: number
    isStreaming: boolean[]
}

const ResponseGrid = ({ responses, responseCount, isStreaming }: ResponseGridProps) => {
    useEffect(() => {
        Prism.highlightAll()
    }, [responses])

    // Calculate grid layout based on response count
    const getGridClass = () => {
        switch (responseCount) {
            case 1:
                return 'grid-cols-1'
            case 2:
                return 'grid-cols-1 md:grid-cols-2'
            case 3:
            case 4:
                return 'grid-cols-1 md:grid-cols-2'
            default:
                return 'grid-cols-1'
        }
    }

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
        <div className={`grid ${getGridClass()} gap-4`}>
            {Array.from({ length: responseCount }).map((_, index) => {
                // For single response (responseCount=1), find response without responseIndex
                // For multiple responses, find by responseIndex
                const response = responseCount === 1
                    ? responses.find(r => r.responseIndex === undefined || r.responseIndex === index)
                    : responses.find(r => r.responseIndex === index)
                const streaming = isStreaming[index]

                return (
                    <div
                        key={index}
                        className="bg-gray-800/50 border border-gray-700/50 rounded-2xl px-5 py-4"
                    >
                        <div className="flex items-center gap-3 mb-3">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                                <Bot size={18} className="text-white" />
                            </div>
                            <div className="flex-1">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-medium text-gray-400">
                                        {responseCount > 1 ? `Response ${index + 1}` : 'Assistant'}
                                    </span>
                                    {response && (
                                        <span className="text-xs text-gray-500">
                                            {format(response.timestamp, 'h:mm a')}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="text-gray-100 leading-relaxed min-h-[100px]">
                            {response && response.content ? (
                                <div>{renderMessageContent(response.content)}</div>
                            ) : streaming ? (
                                <div className="flex items-center gap-2 text-gray-400">
                                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                                    <span>Generating response...</span>
                                </div>
                            ) : (
                                <div className="text-gray-500 italic">Waiting...</div>
                            )}
                        </div>
                    </div>
                )
            })}
        </div>
    )
}

export default ResponseGrid
