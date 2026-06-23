import { useEffect } from 'react'

export interface Toast {
  id: string
  message: string
  type: 'info' | 'success'
}

interface Props {
  toasts: Toast[]
  onDismiss: (id: string) => void
}

function Spinner() {
  return (
    <div
      aria-hidden="true"
      className="w-3.5 h-3.5 rounded-full animate-spin shrink-0"
      style={{ border: '2px solid transparent', borderTopColor: 'var(--color-accent)' }}
    />
  )
}

function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: (id: string) => void }) {
  // Only success toasts auto-dismiss — info toasts stay until explicitly dismissed
  useEffect(() => {
    if (toast.type !== 'success') return
    const t = setTimeout(() => onDismiss(toast.id), 5000)
    return () => clearTimeout(t)
  }, [toast.id, toast.type, onDismiss])

  const accentColor = toast.type === 'success' ? 'var(--color-stage-offer)' : 'var(--color-accent)'

  return (
    <div
      role="status"
      aria-live="polite"
      className="relative flex items-center gap-3 bg-card border border-border rounded-card shadow-card-drag px-4 py-3 min-w-[260px] max-w-[340px] pointer-events-auto overflow-hidden"
      style={{ borderLeftWidth: '3px', borderLeftColor: accentColor }}
    >
      <span className="shrink-0" aria-hidden="true">
        {toast.type === 'success' ? (
          <span className="text-[14px]" style={{ color: 'var(--color-stage-offer)' }}>✓</span>
        ) : (
          <Spinner />
        )}
      </span>
      <p className="flex-1 text-[13px] text-ink leading-snug">{toast.message}</p>
      <button
        type="button"
        onClick={() => onDismiss(toast.id)}
        aria-label="Dismiss"
        className="shrink-0 text-[12px] text-ink-muted hover:text-ink transition-colors focus-visible:ring-2 focus-visible:ring-accent rounded"
      >
        ✕
      </button>

      {/* pulsing progress bar at bottom of info toasts */}
      {toast.type === 'info' && (
        <div className="absolute inset-x-0 bottom-0 h-[2px] animate-pulse" style={{ backgroundColor: 'var(--color-accent)', opacity: 0.4 }} />
      )}
    </div>
  )
}

export function Toaster({ toasts, onDismiss }: Props) {
  if (toasts.length === 0) return null
  return (
    <div
      aria-label="Notifications"
      className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 pointer-events-none"
    >
      {toasts.map(t => (
        <ToastItem key={t.id} toast={t} onDismiss={onDismiss} />
      ))}
    </div>
  )
}
