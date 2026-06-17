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

type DraftData = Omit<Application, 'id' | 'createdAt'>

interface Props {
  application: Application
  onClose: () => void
  onUpdate: (id: string, patch: Partial<DraftData>) => void
}

export function ApplicationDetail({ application, onClose, onUpdate }: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const onCloseRef = useRef(onClose)
  onCloseRef.current = onClose

  const [isEditing, setIsEditing] = useState(false)
  const isEditingRef = useRef(false)
  isEditingRef.current = isEditing

  const [draft, setDraft] = useState<DraftData>({
    company: application.company,
    role: application.role,
    stage: application.stage,
    location: application.location,
    salary: application.salary,
    jobUrl: application.jobUrl,
    jdText: application.jdText,
    appliedDate: application.appliedDate,
    notes: application.notes,
  })

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    dialog.showModal()
    function handleCancel(e: Event) {
      e.preventDefault()
      if (isEditingRef.current) {
        setIsEditing(false)
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

  function startEditing() {
    setDraft({
      company: application.company,
      role: application.role,
      stage: application.stage,
      location: application.location,
      salary: application.salary,
      jobUrl: application.jobUrl,
      jdText: application.jdText,
      appliedDate: application.appliedDate,
      notes: application.notes,
    })
    setIsEditing(true)
  }

  function saveEditing() {
    onUpdate(application.id, draft)
    setIsEditing(false)
  }

  function setField<K extends keyof DraftData>(key: K, value: DraftData[K]) {
    setDraft(d => ({ ...d, [key]: value }))
  }

  const activeStage = STAGES.find(s => s.id === (isEditing ? draft.stage : application.stage)) ?? STAGES[0]

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

        {/* Header */}
        <div className="flex items-center gap-3 px-6 py-4 border-b border-border shrink-0">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <h2
              id="detail-title"
              className="text-[17px] font-semibold text-ink truncate"
            >
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

          {isEditing ? (
            <>
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="shrink-0 px-3 py-1.5 rounded-button border border-border text-[13px] font-medium text-ink-muted hover:text-ink hover:bg-column transition-colors focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={saveEditing}
                className="shrink-0 px-3 py-1.5 rounded-button bg-accent text-white text-[13px] font-medium hover:bg-accent-hover transition-colors focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
              >
                Save
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={startEditing}
              className="shrink-0 px-3 py-1.5 rounded-button border border-border text-[13px] font-medium text-ink-muted hover:text-ink hover:bg-column transition-colors focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
            >
              Edit
            </button>
          )}

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

            {/* Left column */}
            <div className="flex flex-col gap-4">

              {/* Overview */}
              <section className="bg-card border border-border rounded-card p-5">
                <h3 className="text-[11px] font-semibold text-ink-muted uppercase tracking-widest mb-5">
                  Overview
                </h3>

                {isEditing ? (
                  <div className="grid grid-cols-2 gap-x-5 gap-y-4">
                    <EditField label="Company">
                      <input
                        type="text"
                        value={draft.company}
                        onChange={e => setField('company', e.target.value)}
                        required
                        className={inputCls}
                      />
                    </EditField>
                    <EditField label="Role">
                      <input
                        type="text"
                        value={draft.role}
                        onChange={e => setField('role', e.target.value)}
                        required
                        className={inputCls}
                      />
                    </EditField>
                    <EditField label="Stage">
                      <select
                        value={draft.stage}
                        onChange={e => setField('stage', e.target.value as Stage)}
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
                        onChange={e => setField('location', e.target.value)}
                        placeholder="Remote"
                        className={inputCls}
                      />
                    </EditField>
                    <EditField label="Salary">
                      <input
                        type="text"
                        value={draft.salary}
                        onChange={e => setField('salary', e.target.value)}
                        placeholder="$120k–$150k"
                        className={inputCls}
                      />
                    </EditField>
                    <EditField label="Applied date">
                      <input
                        type="date"
                        value={draft.appliedDate ?? ''}
                        onChange={e => setField('appliedDate', e.target.value || null)}
                        className={inputCls}
                      />
                    </EditField>
                    <EditField label="Job URL">
                      <div className="col-span-2">
                        <input
                          type="url"
                          value={draft.jobUrl}
                          onChange={e => setField('jobUrl', e.target.value)}
                          placeholder="https://..."
                          className={inputCls}
                        />
                      </div>
                    </EditField>
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

              {/* Notes */}
              <section className="bg-card border border-border rounded-card p-5">
                <h3 className="text-[11px] font-semibold text-ink-muted uppercase tracking-widest mb-3">
                  Notes
                </h3>
                {isEditing ? (
                  <textarea
                    value={draft.notes}
                    onChange={e => setField('notes', e.target.value)}
                    placeholder="Referral, recruiter contact, anything relevant…"
                    rows={4}
                    className={`${inputCls} resize-none`}
                  />
                ) : application.notes ? (
                  <p className="text-[14px] text-ink leading-relaxed whitespace-pre-wrap">
                    {application.notes}
                  </p>
                ) : (
                  <p className="text-[13px] text-ink-muted/60">No notes added.</p>
                )}
              </section>

              {/* Job description */}
              <section className="bg-card border border-border rounded-card p-5">
                <h3 className="text-[11px] font-semibold text-ink-muted uppercase tracking-widest mb-3">
                  Job description
                </h3>
                {isEditing ? (
                  <textarea
                    value={draft.jdText}
                    onChange={e => setField('jdText', e.target.value)}
                    placeholder="Paste the job description here to enable AI analysis…"
                    rows={8}
                    className={`${inputCls} resize-none`}
                  />
                ) : application.jdText ? (
                  <p className="text-[14px] text-ink leading-relaxed whitespace-pre-wrap">
                    {application.jdText}
                  </p>
                ) : (
                  <p className="text-[13px] text-ink-muted/60">
                    No job description added — paste the JD here to enable AI analysis.
                  </p>
                )}
              </section>
            </div>

            {/* Right column */}
            <PositioningPanel />
          </div>
        </div>
      </div>
    </dialog>
  )
}
