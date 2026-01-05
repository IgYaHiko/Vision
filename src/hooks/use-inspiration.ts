import { useCallback, useState } from "react"

export const useInspiration = () => {
  const [isInspirationOpen, setIsInspirationOpen] = useState(false)

  const toggleInspiration = () => {
    setIsInspirationOpen(prev => !prev)
  }

  const openInspiration = () => {
    setIsInspirationOpen(true)
  }

  const closeInspiration = () => {
    setIsInspirationOpen(false)
  }

  return {
    isInspirationOpen,
    toggleInspiration,
    openInspiration,
    closeInspiration,
  }
}
