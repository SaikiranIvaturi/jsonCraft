import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const isMac =
  typeof navigator !== 'undefined' &&
  /Mac|iPhone|iPad|iPod/i.test(navigator.userAgent)

/** Returns a shortcut string like "⌘K" on Mac or "Ctrl+K" on Windows/Linux */
export function shortcut(key: string, shift = false): string {
  const mod = isMac ? '⌘' : 'Ctrl+'
  const shiftPart = shift ? (isMac ? '⇧' : 'Shift+') : ''
  return `${mod}${shiftPart}${key}`
}
