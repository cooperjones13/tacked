import { useState, useRef, useEffect, useLayoutEffect, type FormEvent, type ReactNode } from 'react'
import { useAction } from 'convex/react'
import { api } from '../../convex/_generated/api'
import type { Application, Stage } from '../types'
import { STAGES } from '../types'

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

type FormData = Omit<Application, 'id' | 'createdAt'>

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
  defaultStage?: Stage
}

export function AddApplicationDrawer({ open, onClose, onAdd, defaultStage }: Props) {
  if (!open) return null
  return <ModalContent onClose={onClose} onAdd={onAdd} defaultStage={defaultStage} />
}

function ModalContent({ onClose, onAdd, defaultStage }: Omit<Props, 'open'>) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const onCloseRef = useRef(onClose)
  useLayoutEffect(() => {
    onCloseRef.current = onClose
  })

  const [form, setForm] = useState<FormData>({ ...INITIAL, stage: defaultStage ?? 'interested' })
  const firstRef = useRef<HTMLInputElement>(null)
  const extractJob = useAction(api.ai.extractJobFromUrl)
  const [urlInput, setUrlInput] = useState('')
  const [extracting, setExtracting] = useState(false)
  const [extractError, setExtractError] = useState<string | null>(null)

  async function handleFillFromUrl() {
    if (!urlInput.trim()) return
    setExtracting(true)
    setExtractError(null)
    try {
      const job = await extractJob({ url: urlInput.trim() })
      setForm(f => ({
        ...f,
        company: job.company || f.company,
        role: job.role || f.role,
        location: job.location || f.location,
        salary: job.salary || f.salary,
        jobUrl: urlInput.trim(),
        jdText: job.jdText || f.jdText,
      }))
    } catch (e) {
      setExtractError(e instanceof Error ? e.message : 'Could not fetch that URL — try pasting the fields manually.')
    } finally {
      setExtracting(false)
    }
  }

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    dialog.showModal()
    firstRef.current?.focus()
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

  function set<K extends keyof FormData>(key: K, value: FormData[K]) {
    setForm(f => ({ ...f, [key]: value }))
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    onAdd({ ...form })
    onClose()
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
        <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
          <h2 id="add-app-title" className="text-[18px] text-ink" style={{ fontFamily: 'var(--font-display)' }}>
            New application
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="w-8 h-8 flex items-center justify-center rounded-button text-ink-muted hover:text-ink hover:bg-column transition-colors focus-visible:ring-2 focus-visible:ring-accent"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} autoComplete="off" className="flex-1 flex flex-col min-h-0">
          <div className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-4">
            {/* URL autofill */}
            <div className="flex flex-col gap-2 pb-3 border-b border-border">
              <label className="flex flex-col gap-1.5">
                <span className="text-[11px] font-semibold text-ink-muted uppercase tracking-widest">
                  Fill from job URL
                </span>
                <div className="flex gap-2">
                  <input
                    ref={firstRef}
                    type="url"
                    value={urlInput}
                    onChange={e => setUrlInput(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleFillFromUrl() } }}
                    placeholder="https://..."
                    className={`${inputCls} flex-1`}
                  />
                  <button
                    type="button"
                    onClick={handleFillFromUrl}
                    disabled={extracting || !urlInput.trim()}
                    className="px-3 py-2 rounded-button border border-border text-[13px] font-medium text-ink-muted hover:text-ink hover:bg-column transition-colors focus-visible:ring-2 focus-visible:ring-accent whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {extracting ? 'Filling…' : 'Fill'}
                  </button>
                </div>
              </label>
              {extractError && <p role="alert" className="text-[12px] text-stage-rejected">{extractError}</p>}
            </div>

            <Field label="Company" required>
              <input
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
                  onClick={() => set('appliedDate', new Date().toISOString().split('T')[0])}
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
                placeholder="Paste the job description here — or use Fill from URL above"
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
      </div>
    </dialog>
  )
}
