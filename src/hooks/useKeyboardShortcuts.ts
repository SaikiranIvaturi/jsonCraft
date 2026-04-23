import { useEffect } from 'react'

interface ShortcutHandlers {
  onFormat: () => void
  onCommandMenu: () => void
  onDiff: () => void
  onTree: () => void
  onShare: () => void
  onAnalyze: () => void
}

export function useKeyboardShortcuts({
  onFormat,
  onCommandMenu,
  onDiff,
  onTree,
  onShare,
  onAnalyze,
}: ShortcutHandlers) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const meta = e.metaKey || e.ctrlKey

      if (meta && e.key === 'k') {
        e.preventDefault()
        onCommandMenu()
        return
      }
      if (meta && e.shiftKey && e.key === 'F') {
        e.preventDefault()
        onFormat()
        return
      }
      if (meta && !e.shiftKey && e.key === 'd') {
        e.preventDefault()
        onDiff()
        return
      }
      if (meta && !e.shiftKey && e.key === 't') {
        e.preventDefault()
        onTree()
        return
      }
      if (meta && !e.shiftKey && e.key === 's') {
        e.preventDefault()
        onShare()
        return
      }
      if (meta && e.shiftKey && e.key === 'A') {
        e.preventDefault()
        onAnalyze()
        return
      }
    }

    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onFormat, onCommandMenu, onDiff, onTree, onShare])
}
