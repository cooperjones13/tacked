import { useState, useEffect } from 'react'

const STORAGE_KEY = 'tacked-theme'

export function useDarkMode() {
  const [dark, setDark] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) return stored === 'dark'
    return window.matchMedia('(prefers-color-scheme: dark)').matches
  })

  useEffect(() => {
    document.documentElement.dataset.theme = dark ? 'dark' : 'light'
    localStorage.setItem(STORAGE_KEY, dark ? 'dark' : 'light')
  }, [dark])

  // Follow system preference changes unless the user has set a preference
  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    function handler(e: MediaQueryListEvent) {
      if (!localStorage.getItem(STORAGE_KEY)) setDark(e.matches)
    }
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  return [dark, setDark] as const
}
