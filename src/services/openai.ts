import { Message } from '../types'

export interface OpenAIStreamResponse {
  choices: Array<{
    delta: {
      content?: string
    }
    finish_reason: string | null
  }>
}

// Type for OpenAI message content (text or image)
type OpenAIMessageContent =
  | string
  | Array<
      | { type: 'text'; text: string }
      | { type: 'image_url'; image_url: { url: string; detail?: 'low' | 'high' | 'auto' } }
    >

interface OpenAIMessage {
  role: 'user' | 'assistant' | 'system'
  content: OpenAIMessageContent
}

// Convert app messages to OpenAI format, handling attachments for vision API
const convertToOpenAIMessages = (messages: Message[]): OpenAIMessage[] => {
  return messages.map((m) => {
    // If message has attachments, use vision API format
    if (m.attachments && m.attachments.length > 0) {
      const content: Array<
        | { type: 'text'; text: string }
        | { type: 'image_url'; image_url: { url: string; detail: 'auto' } }
      > = []

      // Add text content first if exists
      if (m.content) {
        content.push({ type: 'text', text: m.content })
      }

      // Add image attachments
      for (const attachment of m.attachments) {
        content.push({
          type: 'image_url',
          image_url: {
            url: attachment.dataUrl,
            detail: 'auto', // Let OpenAI decide based on image size
          },
        })
      }

      return {
        role: m.role,
        content,
      }
    }

    // Regular text message
    return {
      role: m.role,
      content: m.content,
    }
  })
}

export const streamChatCompletion = async (
  messages: Message[],
  apiKey: string,
  model: string,
  temperature: number,
  maxTokens: number,
  onChunk: (content: string) => void,
  onComplete: () => void,
  onError: (error: string) => void,
  abortSignal?: AbortSignal
): Promise<void> => {
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: convertToOpenAIMessages(messages),
        temperature,
        max_tokens: maxTokens,
        stream: true,
      }),
      signal: abortSignal,
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error?.message || 'Failed to fetch response')
    }

    const reader = response.body?.getReader()
    if (!reader) throw new Error('No response body')

    const decoder = new TextDecoder()
    let buffer = ''

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() || ''

      for (const line of lines) {
        if (line.trim() === '') continue
        if (line.trim() === 'data: [DONE]') {
          onComplete()
          return
        }

        if (line.startsWith('data: ')) {
          try {
            const data = JSON.parse(line.slice(6))
            const content = data.choices?.[0]?.delta?.content
            if (content) {
              onChunk(content)
            }
          } catch (e) {
            console.error('Error parsing SSE data:', e)
          }
        }
      }
    }

    onComplete()
  } catch (error) {
    // Don't treat abort as an error - it's intentional
    if (error instanceof Error && error.name === 'AbortError') {
      console.log('Stream aborted by user')
      onComplete() // Call onComplete to clean up state
      return
    }
    onError(error instanceof Error ? error.message : 'Unknown error occurred')
  }
}

export const testApiKey = async (apiKey: string): Promise<boolean> => {
  try {
    const response = await fetch('https://api.openai.com/v1/models', {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      },
    })
    return response.ok
  } catch {
    return false
  }
}

export const streamMultipleChatCompletions = async (
  messages: Message[],
  apiKey: string,
  model: string,
  baseTemperature: number,
  maxTokens: number,
  responseCount: number,
  onChunk: (responseIndex: number, content: string) => void,
  onComplete: (responseIndex: number) => void,
  onError: (responseIndex: number, error: string) => void,
  abortSignal?: AbortSignal
): Promise<void> => {
  const temperatureIncrement = 0.2
  const promises: Promise<void>[] = []

  for (let i = 0; i < responseCount; i++) {
    const temperature = Math.min(2.0, baseTemperature + (i * temperatureIncrement))

    const promise = streamChatCompletion(
      messages,
      apiKey,
      model,
      temperature,
      maxTokens,
      (chunk) => onChunk(i, chunk),
      () => onComplete(i),
      (error) => onError(i, error),
      abortSignal
    )

    promises.push(promise)
  }

  await Promise.all(promises)
}
