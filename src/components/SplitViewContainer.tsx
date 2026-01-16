import { useState, useRef, useCallback } from 'react'
import RealtimePanel from './RealtimePanel'
import TraditionalPanel from './TraditionalPanel'

const SplitViewContainer = () => {
  const [splitPosition, setSplitPosition] = useState(50) // 50% split
  const [isDragging, setIsDragging] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const dragStartX = useRef<number>(0)
  const dragStartPosition = useRef<number>(50)

  const handleMouseMove = useCallback((event: MouseEvent) => {
    if (!containerRef.current) return

    const container = containerRef.current
    const rect = container.getBoundingClientRect()
    const newPosition = ((event.clientX - rect.left) / rect.width) * 100

    // Limit split between 20% and 80%
    const clampedPosition = Math.max(20, Math.min(80, newPosition))
    setSplitPosition(clampedPosition)
  }, [])

  const handleMouseUp = useCallback(() => {
    setIsDragging(false)
    document.removeEventListener('mousemove', handleMouseMove)
    document.removeEventListener('mouseup', handleMouseUp)
  }, [handleMouseMove])

  const handleMouseDown = useCallback((event: React.MouseEvent) => {
    event.preventDefault()
    setIsDragging(true)

    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect()
      dragStartX.current = event.clientX - rect.left
      dragStartPosition.current = splitPosition
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
  }, [splitPosition, handleMouseMove, handleMouseUp])

  return (
    <div ref={containerRef} className="flex h-full w-full relative">
      {/* Left Panel - Realtime AI */}
      <div
        style={{ width: `${splitPosition}%` }}
        className="h-full border-r border-gray-800"
      >
        <RealtimePanel />
      </div>

      {/* Resize Handle */}
      <div
        onMouseDown={handleMouseDown}
        className={`
          w-1 h-full cursor-col-resize relative
          ${isDragging ? 'bg-blue-500' : 'bg-gray-800 hover:bg-blue-500'}
          transition-colors flex items-center justify-center
        `}
      >
        {/* Drag indicator */}
        <div className="absolute w-1 h-12 bg-gray-600 rounded-full opacity-50" />
      </div>

      {/* Right Panel - Traditional Chat */}
      <div
        style={{ width: `${100 - splitPosition}%` }}
        className="h-full"
      >
        <TraditionalPanel />
      </div>

      {/* Dragging overlay */}
      {isDragging && (
        <div className="fixed inset-0 z-50 cursor-col-resize" />
      )}
    </div>
  )
}

export default SplitViewContainer
