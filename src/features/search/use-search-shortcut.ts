/**
 * The ⌘K / Ctrl-K binding, kept apart from the palette it opens.
 *
 * The listener has to be live on every page, but the dialog is several hundred
 * kilobytes of index-building and ranking that most sessions never open. Two
 * modules means the shortcut stays eager while the palette itself is a chunk
 * that arrives the first time someone actually presses the keys.
 */

import { useEffect } from 'react'

export function useGlobalSearchShortcut(onOpen: () => void) {
  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() !== 'k' || !(event.metaKey || event.ctrlKey)) return
      // Never eat a keystroke meant for a form field.
      const target = event.target as HTMLElement | null
      const tag = target?.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || target?.isContentEditable) return
      event.preventDefault()
      onOpen()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onOpen])
}
