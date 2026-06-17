import { useEffect, useRef, useState, type ReactNode } from 'react'
import type { Application, Stage } from '../types'
import { STAGES } from '../types'
import { PositioningPanel } from './PositioningPanel'

const inputCls =
  'w-full rounded-button border border-border bg-canvas px-3 py-2 text-[13px] text-ink ' +
  'placeholder:text-ink-muted/50 focus:outline-none focus:ring-2 focus:ring-accent ' +
  'focus:ring-offset-1 transition-shadow'

function ViewField({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-[11px] font-semibold text-ink-muted uppercase tracking-widest">
        {label}
      </span>
      <span className="text-[14px] text-ink">{children}</span>
    </div>
  )
}

function EditField({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[11px] font-semibold text-ink-muted uppercase tracking-widest">
        {label}
      </span>
      {children}
    </label>
  )
}

// Only the fields the overview section owns — notes/jdText are handled separately
type OverviewDraft = Omit<Application, 'id' | 'createdAt' | 'notes' | 'jdText'>

interface Props {
  application: Application
  onClose: () => void
  onUpdate: (id: string, patch: Partial<Omit<Application, 'id' | 'createdAt'>>) => void
}

export function ApplicationDetail({ application, onClose, onUpdate }: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const onCloseRef = useRef(onClose)
  onCloseRef.current = onClose

  // Overview edit state
  const [overviewEditing, setOverviewEditing] = useState(false)
  const overviewEditingRef = useRef(false)
  overviewEditingRef.current = overviewEditing

  const [draft, setDraft] = useState<OverviewDraft>({
    company: application.company,
    role: application.role,
    stage: application.stage,
    location: application.location,
    salary: application.salary,
    jobUrl: application.jobUrl,
    appliedDate: application.appliedDate,
  })

  // Notes and JD are always editable — changes written through immediately
  const [localNotes, setLocalNotes] = useState(application.notes)
  const [localJdText, setLocalJdText] = useState(application.jdText)

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    dialog.showModal()
    function handleCancel(e: Event) {
      e.preventDefault()
      if (overviewEditingRef.current) {
        setOverviewEditing(false)
      } else {
        onCloseRef.current()
      }
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

  function startOverviewEdit() {
    setDraft({
      company: application.company,
      role: application.role,
      stage: application.stage,
      location: application.location,
      salary: application.salary,
      jobUrl: application.jobUrl,
      appliedDate: application.appliedDate,
    })
    setOverviewEditing(true)
  }

  function saveOverview() {
    onUpdate(application.id, draft)
    setOverviewEditing(false)
  }

  function setDraftField<K extends keyof OverviewDraft>(key: K, value: OverviewDraft[K]) {
    setDraft(d => ({ ...d, [key]: value }))
  }

  const activeStage =
    STAGES.find(s => s.id === (overviewEditing ? draft.stage : application.stage)) ?? STAGES[0]

  const formattedDate = application.appliedDate
    ? new Date(application.appliedDate).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : null

  return (
    <dialog
      ref={dialogRef}
      onClick={handleBackdropClick}
      aria-labelledby="detail-title"
      className="w-full max-w-4xl max-h-[90vh] bg-canvas rounded-card border border-border shadow-card-drag flex flex-col outline-none"
    >
      <div onClick={e => e.stopPropagation()} className="flex flex-col flex-1 min-h-0">

        {/* Header — no edit controls here */}
        <div className="flex items-center gap-3 px-6 py-4 border-b border-border shrink-0">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <h2 id="detail-title" className="text-[17px] font-semibold text-ink truncate">
              {application.company}
            </h2>
            <span className="text-ink-muted shrink-0">·</span>
            <span className="text-[15px] text-ink-muted truncate">{application.role}</span>
          </div>
          <span
            className="shrink-0 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[12px] font-medium"
            style={{
              backgroundColor: `color-mix(in srgb, ${activeStage.color} 15%, transparent)`,
              color: activeStage.color,
            }}
          >
            <span
              className="w-1.5 h-1.5 rounded-full shrink-0"
              style={{ backgroundColor: activeStage.color }}
              aria-hidden="true"
            />
            {activeStage.label}
          </span>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="w-8 h-8 shrink-0 flex items-center justify-center rounded-button text-ink-muted hover:text-ink hover:bg-column transition-colors focus-visible:ring-2 focus-visible:ring-accent"
          >
            ✕
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-[1fr_340px] gap-5 items-start">

            <div className="flex flex-col gap-4">

              {/* Overview — has its own edit controls */}
              <section className="bg-card border border-border rounded-card p-5">
                <div className="flex items-center justify-between mb-5">
                  <h3 className="text-[11px] font-semibold text-ink-muted uppercase tracking-widest">
                    Overview
                  </h3>
                  {overviewEditing ? (
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setOverviewEditing(false)}
                        className="px-3 py-1 rounded-button border border-border text-[12px] font-medium text-ink-muted hover:text-ink hover:bg-column transition-colors focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-1"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={saveOverview}
                        className="px-3 py-1 rounded-button bg-accent text-white text-[12px] font-medium hover:bg-accent-hover transition-colors focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-1"
                      >
                        Save
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={startOverviewEdit}
                      className="px-3 py-1 rounded-button border border-border text-[12px] font-medium text-ink-muted hover:text-ink hover:bg-column transition-colors focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-1"
                    >
                      Edit
                    </button>
                  )}
                </div>

                {overviewEditing ? (
                  <div className="grid grid-cols-2 gap-x-5 gap-y-4">
                    <EditField label="Company">
                      <input
                        type="text"
                        value={draft.company}
                        onChange={e => setDraftField('company', e.target.value)}
                        required
                        className={inputCls}
                      />
                    </EditField>
                    <EditField label="Role">
                      <input
                        type="text"
                        value={draft.role}
                        onChange={e => setDraftField('role', e.target.value)}
                        required
                        className={inputCls}
                      />
                    </EditField>
                    <EditField label="Stage">
                      <select
                        value={draft.stage}
                        onChange={e => setDraftField('stage', e.target.value as Stage)}
                        className={inputCls}
                      >
                        {STAGES.map(s => (
                          <option key={s.id} value={s.id}>{s.label}</option>
                        ))}
                      </select>
                    </EditField>
                    <EditField label="Location">
                      <input
                        type="text"
                        value={draft.location}
                        onChange={e => setDraftField('location', e.target.value)}
                        placeholder="Remote"
                        className={inputCls}
                      />
                    </EditField>
                    <EditField label="Salary">
                      <input
                        type="text"
                        value={draft.salary}
                        onChange={e => setDraftField('salary', e.target.value)}
                        placeholder="$120k–$150k"
                        className={inputCls}
                      />
                    </EditField>
                    <EditField label="Applied date">
                      <input
                        type="date"
                        value={draft.appliedDate ?? ''}
                        onChange={e => setDraftField('appliedDate', e.target.value || null)}
                        className={inputCls}
                      />
                    </EditField>
                    <div className="col-span-2">
                      <EditField label="Job URL">
                        <input
                          type="url"
                          value={draft.jobUrl}
                          onChange={e => setDraftField('jobUrl', e.target.value)}
                          placeholder="https://..."
                          className={inputCls}
                        />
                      </EditField>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-x-8 gap-y-5">
                    <ViewField label="Company">{application.company}</ViewField>
                    <ViewField label="Role">{application.role}</ViewField>
                    {application.location && (
                      <ViewField label="Location">{application.location}</ViewField>
                    )}
                    {application.salary && (
                      <ViewField label="Salary">{application.salary}</ViewField>
                    )}
                    {formattedDate && (
                      <ViewField label="Applied">{formattedDate}</ViewField>
                    )}
                    {application.jobUrl && (
                      <ViewField label="Job posting">
                        <a
                          href={application.jobUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-accent hover:underline focus-visible:ring-2 focus-visible:ring-accent rounded"
                        >
                          View posting ↗
                        </a>
                      </ViewField>
                    )}
                  </div>
                )}
              </section>

              {/* Notes — always editable, saves on every change */}
              <section className="bg-card border border-border rounded-card p-5">
                <h3 className="text-[11px] font-semibold text-ink-muted uppercase tracking-widest mb-3">
                  Notes
                </h3>
                <textarea
                  value={localNotes}
                  onChange={e => {
                    setLocalNotes(e.target.value)
                    onUpdate(application.id, { notes: e.target.value })
                  }}
                  placeholder="Referral, recruiter contact, anything relevant…"
                  rows={4}
                  className={`${inputCls} resize-none`}
                />
              </section>

              {/* Job description — always editable, saves on every change */}
              <section className="bg-card border border-border rounded-card p-5">
                <h3 className="text-[11px] font-semibold text-ink-muted uppercase tracking-widest mb-3">
                  Job description
                </h3>
                <textarea
                  value={localJdText}
                  onChange={e => {
                    setLocalJdText(e.target.value)
                    onUpdate(application.id, { jdText: e.target.value })
                  }}
                  placeholder="Paste the job description here to enable AI analysis…"
                  rows={8}
                  className={`${inputCls} resize-none`}
                />
              </section>
            </div>

            <PositioningPanel />
          </div>
        </div>
      </div>
    </dialog>
  )
}
