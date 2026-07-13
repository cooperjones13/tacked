import { useEffect, useRef, useState, useLayoutEffect } from 'react'
import { mdBlock } from '../utils/md'

interface Props {
  letter: string
  regenerating: boolean
  onRegenerate: () => void
  onClose: () => void
}

export function CoverLetterDialog({ letter, regenerating, onRegenerate, onClose }: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const onCloseRef = useRef(onClose)
  useLayoutEffect(() => {
    onCloseRef.current = onClose
  })
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    dialog.showModal()
    function handleCancel(e: Event) {
      e.preventDefault()
      onCloseRef.current()
    }
    dialog.addEventListener('cancel', handleCancel)
    return () => dialog.removeEventListener('cancel', handleCancel)
  }, [])

  function handleBackdropClick(e: React.MouseEvent<HTMLDialogElement>) {
    const rect = e.currentTarget.getBoundingClientRect()
    const outside =
      e.clientX < rect.left || e.clientX > rect.right ||
      e.clientY < rect.top  || e.clientY > rect.bottom
    if (outside) onClose()
  }

  async function copy() {
    await navigator.clipboard.writeText(letter)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <dialog
      ref={dialogRef}
      onClick={handleBackdropClick}
      aria-modal="true"
      aria-labelledby="cl-title"
      className="w-full max-w-2xl h-[80vh] bg-canvas rounded-card border border-border shadow-card-drag flex flex-col outline-none"
    >
      <div onClick={e => e.stopPropagation()} className="flex flex-col flex-1 min-h-0">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
          <h2 id="cl-title" className="text-[18px] text-ink" style={{ fontFamily: 'var(--font-display)' }}>
            Cover letter
          </h2>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onRegenerate}
              disabled={regenerating}
              className="px-3 py-1.5 rounded-button border border-border text-[12px] font-medium text-ink-muted hover:text-ink hover:bg-column transition-colors focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {regenerating ? 'Regenerating…' : 'Regenerate'}
            </button>
            <button
              type="button"
              onClick={copy}
              className="px-3 py-1.5 rounded-button bg-accent-btn text-white text-[12px] font-medium hover:bg-accent-btn-hover transition-colors focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-1"
            >
              {copied ? 'Copied!' : 'Copy'}
            </button>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="w-8 h-8 flex items-center justify-center rounded-button text-ink-muted hover:text-ink hover:bg-column transition-colors focus-visible:ring-2 focus-visible:ring-accent"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-8 py-6 min-h-0">
          {regenerating ? (
            <div className="flex items-center justify-center h-full">
              <p className="text-[13px] text-ink-muted">Generating…</p>
            </div>
          ) : (
            <div className="text-[14px] text-ink leading-[1.8] flex flex-col gap-4">
              {mdBlock(letter)}
            </div>
          )}
        </div>
      </div>
    </dialog>
  )
}
