import { useState, useEffect } from 'react'

const STORAGE_KEY = 'tacked-collapsed-sections'
const DEFAULT_COLLAPSED = ['archived']

function readStored(): Set<string> {
  if (typeof window === 'undefined') return new Set(DEFAULT_COLLAPSED)
  const stored = localStorage.getItem(STORAGE_KEY)
  if (!stored) return new Set(DEFAULT_COLLAPSED)
  try {
    return new Set(JSON.parse(stored) as string[])
  } catch {
    return new Set(DEFAULT_COLLAPSED)
  }
}

export function useCollapsedSections() {
  const [collapsed, setCollapsed] = useState<Set<string>>(readStored)

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(collapsed)))
  }, [collapsed])

  function toggle(id: string) {
    setCollapsed(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  return { collapsed, toggle }
}
