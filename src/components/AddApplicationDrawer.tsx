import { useState, useRef, useEffect, useLayoutEffect, type FormEvent, type ReactNode } from 'react'
import type { Application, Stage } from '../types'
import { STAGES } from '../types'
import { localTodayISO } from '../utils/date'

const inputCls =
  'w-full rounded-button border border-border bg-canvas px-3 py-2 text-[13px] text-ink ' +
  'placeholder:text-ink-muted/50 focus:outline-none focus:ring-2 focus:ring-accent ' +
  'focus:ring-offset-1 transition-shadow'

function Field({
  label,
  required = false,
  children,
}: {
  label: string
  required?: boolean
  children: ReactNode
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[11px] font-semibold text-ink-muted uppercase tracking-widest">
        {label}
        {required && (
          <span className="text-stage-rejected ml-0.5" aria-hidden="true">*</span>
        )}
      </span>
      {children}
    </label>
  )
}

type FormData = Omit<Application, 'id' | 'createdAt' | 'archived' | 'extracting' | 'extractionFailed' | 'pending'>

const INITIAL: FormData = {
  company: '',
  role: '',
  location: '',
  salary: '',
  jobUrl: '',
  jdText: '',
  stage: 'interested',
  appliedDate: null,
  notes: '',
}

interface Props {
  open: boolean
  onClose: () => void
  onAdd: (data: FormData) => void
  onAddWithUrlFill: (url: string) => void
  defaultStage?: Stage
}

export function AddApplicationDrawer({ open, onClose, onAdd, onAddWithUrlFill, defaultStage }: Props) {
  if (!open) return null
  return <ModalContent onClose={onClose} onAdd={onAdd} onAddWithUrlFill={onAddWithUrlFill} defaultStage={defaultStage} />
}

type Mode = 'choice' | 'manual' | 'url'

const headerCloseBtnCls =
  'w-8 h-8 flex items-center justify-center rounded-button text-ink-muted hover:text-ink ' +
  'hover:bg-column transition-colors focus-visible:ring-2 focus-visible:ring-accent'

function ModalContent({ onClose, onAdd, onAddWithUrlFill, defaultStage }: Omit<Props, 'open'>) {
  const [mode, setMode] = useState<Mode>('choice')
  const dialogRef = useRef<HTMLDialogElement>(null)
  const onCloseRef = useRef(onClose)
  useLayoutEffect(() => {
    onCloseRef.current = onClose
  })

  // Captured during the very first render (before showModal() ever runs) so it's
  // immune to StrictMode's dev-only double-invoke of mount effects.
  const previouslyFocusedRef = useRef<HTMLElement | null>(null)
  if (previouslyFocusedRef.current === null) {
    previouslyFocusedRef.current = document.activeElement as HTMLElement
  }

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    dialog.showModal()
    function handleCancel(e: Event) {
      e.preventDefault()
      onCloseRef.current()
    }
    dialog.addEventListener('cancel', handleCancel)
    return () => {
      dialog.removeEventListener('cancel', handleCancel)
      previouslyFocusedRef.current?.focus?.()
    }
  }, [])

  function handleBackdropClick(e: React.MouseEvent<HTMLDialogElement>) {
    const rect = e.currentTarget.getBoundingClientRect()
    const outside =
      e.clientX < rect.left || e.clientX > rect.right ||
      e.clientY < rect.top  || e.clientY > rect.bottom
    if (outside) onClose()
  }

  return (
    <dialog
      ref={dialogRef}
      onClick={handleBackdropClick}
      aria-modal="true"
      aria-labelledby="add-app-title"
      className="w-full max-w-lg max-h-[90vh] bg-canvas rounded-card border border-border shadow-card-drag flex flex-col outline-none"
    >
      <div onClick={e => e.stopPropagation()} className="flex flex-col flex-1 min-h-0">
        {mode === 'choice' && (
          <ChoiceScreen onClose={onClose} onPickUrl={() => setMode('url')} onPickManual={() => setMode('manual')} />
        )}
        {mode === 'url' && (
          <UrlFillScreen onBack={() => setMode('choice')} onClose={onClose} onSubmit={onAddWithUrlFill} />
        )}
        {mode === 'manual' && (
          <ManualForm onBack={() => setMode('choice')} onClose={onClose} onAdd={onAdd} defaultStage={defaultStage} />
        )}
      </div>
    </dialog>
  )
}

function ChoiceScreen({
  onClose,
  onPickUrl,
  onPickManual,
}: {
  onClose: () => void
  onPickUrl: () => void
  onPickManual: () => void
}) {
  const firstRef = useRef<HTMLButtonElement>(null)
  useEffect(() => {
    firstRef.current?.focus()
  }, [])

  return (
    <>
      <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
        <h2 id="add-app-title" className="text-[18px] text-ink" style={{ fontFamily: 'var(--font-display)' }}>
          New application
        </h2>
        <button type="button" onClick={onClose} aria-label="Close" className={headerCloseBtnCls}>
          ✕
        </button>
      </div>
      <div className="p-6 flex flex-col gap-3">
        <button
          ref={firstRef}
          type="button"
          onClick={onPickUrl}
          className="flex flex-col items-start gap-1 text-left px-4 py-3.5 rounded-card border border-border hover:border-accent hover:bg-column transition-colors focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
        >
          <span className="text-[14px] font-semibold text-ink">Fill from a job link</span>
          <span className="text-[12px] text-ink-muted">
            Paste a URL — it's added to your board right away, with details filled in behind the scenes
          </span>
        </button>
        <button
          type="button"
          onClick={onPickManual}
          className="flex flex-col items-start gap-1 text-left px-4 py-3.5 rounded-card border border-border hover:border-accent hover:bg-column transition-colors focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
        >
          <span className="text-[14px] font-semibold text-ink">Enter manually</span>
          <span className="text-[12px] text-ink-muted">
            Fill in the company, role, and other details yourself
          </span>
        </button>
      </div>
    </>
  )
}

function UrlFillScreen({
  onBack,
  onClose,
  onSubmit,
}: {
  onBack: () => void
  onClose: () => void
  onSubmit: (url: string) => void
}) {
  const [url, setUrl] = useState('')
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const trimmed = url.trim()
    if (!trimmed) return
    try {
      new URL(trimmed)
    } catch {
      setError('Enter a valid URL, including https://')
      return
    }
    onSubmit(trimmed)
    onClose()
  }

  return (
    <>
      <div className="flex items-center gap-1 px-6 py-4 border-b border-border shrink-0">
        <button type="button" onClick={onBack} aria-label="Back" className={`${headerCloseBtnCls} -ml-1.5`}>
          ←
        </button>
        <h2 id="add-app-title" className="text-[18px] text-ink flex-1" style={{ fontFamily: 'var(--font-display)' }}>
          Fill from a job link
        </h2>
        <button type="button" onClick={onClose} aria-label="Close" className={headerCloseBtnCls}>
          ✕
        </button>
      </div>
      <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-3">
        <Field label="Job posting URL" required>
          <input
            ref={inputRef}
            type="url"
            value={url}
            onChange={e => { setUrl(e.target.value); setError(null) }}
            placeholder="https://..."
            required
            className={inputCls}
          />
        </Field>
        {error && <p role="alert" className="text-[12px] text-stage-rejected">{error}</p>}
        <p className="text-[12px] text-ink-muted/70 leading-relaxed">
          This adds the application to your board immediately and fills in the company, role, and
          description in the background — usually just a few seconds.
        </p>
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onBack}
            className="px-4 py-2 rounded-button border border-border text-[13px] font-medium text-ink-muted hover:text-ink hover:bg-column transition-colors focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
          >
            Back
          </button>
          <button
            type="submit"
            className="px-4 py-2 rounded-button bg-accent-btn text-white text-[13px] font-medium hover:bg-accent-btn-hover transition-colors focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
          >
            Add &amp; fill in background
          </button>
        </div>
      </form>
    </>
  )
}

function ManualForm({
  onBack,
  onClose,
  onAdd,
  defaultStage,
}: {
  onBack: () => void
  onClose: () => void
  onAdd: (data: FormData) => void
  defaultStage?: Stage
}) {
  const [form, setForm] = useState<FormData>({ ...INITIAL, stage: defaultStage ?? 'interested' })
  const firstRef = useRef<HTMLInputElement>(null)
  useEffect(() => {
    firstRef.current?.focus()
  }, [])

  function set<K extends keyof FormData>(key: K, value: FormData[K]) {
    setForm(f => ({ ...f, [key]: value }))
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    onAdd({ ...form })
    onClose()
  }

  return (
    <>
      <div className="flex items-center gap-1 px-6 py-4 border-b border-border shrink-0">
        <button type="button" onClick={onBack} aria-label="Back" className={`${headerCloseBtnCls} -ml-1.5`}>
          ←
        </button>
        <h2 id="add-app-title" className="text-[18px] text-ink flex-1" style={{ fontFamily: 'var(--font-display)' }}>
          New application
        </h2>
        <button type="button" onClick={onClose} aria-label="Close" className={headerCloseBtnCls}>
          ✕
        </button>
      </div>

      <form onSubmit={handleSubmit} autoComplete="off" className="flex-1 flex flex-col min-h-0">
        <div className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-4">
          <Field label="Company" required>
            <input
              ref={firstRef}
              type="text"
              value={form.company}
              onChange={e => set('company', e.target.value)}
              placeholder="e.g. Stripe"
              required
              className={inputCls}
            />
          </Field>

          <Field label="Role" required>
            <input
              type="text"
              value={form.role}
              onChange={e => set('role', e.target.value)}
              placeholder="e.g. Senior Frontend Engineer"
              required
              className={inputCls}
            />
          </Field>

          <Field label="Stage">
            <select
              value={form.stage}
              onChange={e => set('stage', e.target.value as Stage)}
              className={inputCls}
            >
              {STAGES.map(s => (
                <option key={s.id} value={s.id}>{s.label}</option>
              ))}
            </select>
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Location">
              <input
                type="text"
                value={form.location}
                onChange={e => set('location', e.target.value)}
                placeholder="Remote"
                className={inputCls}
              />
            </Field>
            <Field label="Salary">
              <input
                type="text"
                value={form.salary}
                onChange={e => set('salary', e.target.value)}
                placeholder="$120k–$150k"
                className={inputCls}
              />
            </Field>
          </div>

          <Field label="Job URL">
            <input
              type="url"
              value={form.jobUrl}
              onChange={e => set('jobUrl', e.target.value)}
              placeholder="https://..."
              className={inputCls}
            />
          </Field>

          <Field label="Applied date">
            <div className="flex gap-2">
              <input
                type="date"
                value={form.appliedDate ?? ''}
                onChange={e => set('appliedDate', e.target.value || null)}
                className={`${inputCls} flex-1`}
              />
              <button
                type="button"
                onClick={() => set('appliedDate', localTodayISO())}
                className="px-3 py-2 rounded-button border border-border text-[13px] font-medium text-ink-muted hover:text-ink hover:bg-column transition-colors focus-visible:ring-2 focus-visible:ring-accent whitespace-nowrap"
              >
                Today
              </button>
            </div>
          </Field>

          <Field label="Job description">
            <textarea
              value={form.jdText}
              onChange={e => set('jdText', e.target.value)}
              placeholder="Paste the job description here…"
              rows={5}
              className={`${inputCls} resize-none`}
            />
          </Field>

          <Field label="Notes">
            <textarea
              value={form.notes}
              onChange={e => set('notes', e.target.value)}
              placeholder="Referral, recruiter contact, anything relevant…"
              rows={3}
              className={`${inputCls} resize-none`}
            />
          </Field>
        </div>

        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-button border border-border text-[13px] font-medium text-ink-muted hover:text-ink hover:bg-column transition-colors focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 rounded-button bg-accent-btn text-white text-[13px] font-medium hover:bg-accent-btn-hover transition-colors focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
          >
            Add application
          </button>
        </div>
      </form>
    </>
  )
}
