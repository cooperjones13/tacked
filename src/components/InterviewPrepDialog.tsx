import { useEffect, useRef, useState } from 'react'

interface Question {
  question: string
  guidance: string
}

interface InterviewPrep {
  behavioral: Question[]
  technical: Question[]
  roleSpecific: Question[]
  culture: Question[]
}

interface Props {
  prep: InterviewPrep
  regenerating: boolean
  onRegenerate: () => void
  onClose: () => void
}

const SECTIONS: { key: keyof InterviewPrep; label: string }[] = [
  { key: 'behavioral', label: 'Behavioral' },
  { key: 'technical', label: 'Technical' },
  { key: 'roleSpecific', label: 'Role-specific' },
  { key: 'culture', label: 'Culture & values' },
]

function QuestionCard({ q, index }: { q: Question; index: number }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="border border-border rounded-card overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-start gap-3 px-4 py-3 text-left hover:bg-column transition-colors focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-inset"
      >
        <span className="text-[11px] font-semibold text-ink-muted mt-0.5 shrink-0 tabular-nums">
          {String(index + 1).padStart(2, '0')}
        </span>
        <span className="text-[13px] font-medium text-ink flex-1 leading-snug">{q.question}</span>
        <span className="text-ink-muted text-[14px] shrink-0 mt-0.5">{open ? '−' : '+'}</span>
      </button>
      {open && (
        <div className="px-4 pb-4 pt-1 bg-canvas border-t border-border">
          <p className="text-[13px] text-ink-muted leading-relaxed">{q.guidance}</p>
        </div>
      )}
    </div>
  )
}

export function InterviewPrepDialog({ prep, regenerating, onRegenerate, onClose }: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const onCloseRef = useRef(onClose)
  onCloseRef.current = onClose
  const [activeSection, setActiveSection] = useState<keyof InterviewPrep>('behavioral')

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
      e.clientY < rect.top || e.clientY > rect.bottom
    if (outside) onClose()
  }

  const questions = prep[activeSection]

  return (
    <dialog
      ref={dialogRef}
      onClick={handleBackdropClick}
      aria-modal="true"
      aria-labelledby="prep-title"
      className="w-full max-w-2xl h-[85vh] bg-canvas rounded-card border border-border shadow-card-drag flex flex-col outline-none"
    >
      <div onClick={e => e.stopPropagation()} className="flex flex-col flex-1 min-h-0">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
          <h2
            id="prep-title"
            className="text-[18px] text-ink"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            Interview prep
          </h2>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onRegenerate}
              disabled={regenerating}
              className="px-3 py-1.5 rounded-button border border-border text-[12px] font-medium text-ink-muted hover:text-ink hover:bg-column transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-1"
            >
              {regenerating ? 'Regenerating…' : 'Regenerate'}
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

        {/* Section tabs */}
        <div className="flex gap-0 border-b border-border shrink-0 px-6">
          {SECTIONS.map(s => (
            <button
              key={s.key}
              type="button"
              onClick={() => setActiveSection(s.key)}
              className={[
                'px-4 py-3 text-[13px] font-medium border-b-2 transition-colors focus-visible:ring-2 focus-visible:ring-accent',
                activeSection === s.key
                  ? 'border-accent text-accent'
                  : 'border-transparent text-ink-muted hover:text-ink',
              ].join(' ')}
            >
              {s.label}
              <span className="ml-1.5 text-[11px] opacity-60">{prep[s.key].length}</span>
            </button>
          ))}
        </div>

        {/* Questions */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {regenerating ? (
            <div className="flex items-center justify-center h-full">
              <p className="text-[13px] text-ink-muted">Generating…</p>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {questions.map((q, i) => (
                <QuestionCard key={`${activeSection}-${i}`} q={q} index={i} />
              ))}
            </div>
          )}
        </div>
      </div>
    </dialog>
  )
}
