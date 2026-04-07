import { useEffect, useRef, useState } from 'react'

export function useSheetDrag(open: boolean, onClose: () => void) {
  const [dragY, setDragY] = useState(0)
  const dragging = useRef(false)
  const startY  = useRef(0)

  // Lock body scroll while open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
      setDragY(0)
    }
    return () => { document.body.style.overflow = '' }
  }, [open])

  function onTouchStart(e: React.TouchEvent) {
    dragging.current = true
    startY.current = e.touches[0].clientY
  }

  function onTouchMove(e: React.TouchEvent) {
    if (!dragging.current) return
    const delta = e.touches[0].clientY - startY.current
    if (delta > 0) setDragY(delta)
  }

  function onTouchEnd() {
    dragging.current = false
    if (dragY > 100) {
      onClose()
    }
    setDragY(0)
  }

  const handleProps = { onTouchStart, onTouchMove, onTouchEnd }

  const sheetStyle: React.CSSProperties = dragY > 0
    ? { transform: `translateY(${dragY}px)`, transition: 'none' }
    : {}

  return { handleProps, sheetStyle }
}
