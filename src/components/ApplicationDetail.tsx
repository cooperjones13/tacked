import { useEffect, useRef, useState, type ReactNode } from 'react'
import { useQuery, useAction } from 'convex/react'
import { api } from '../../convex/_generated/api'
import type { Id } from '../../convex/_generated/dataModel'
import type { Application, Stage } from '../types'
import { STAGES } from '../types'
import { PositioningPanel } from './PositioningPanel'
import { CoverLetterDialog } from './CoverLetterDialog'
import { InterviewPrepDialog } from './InterviewPrepDialog'
import { md } from '../utils/md'

const inputCls =
  'w-full rounded-button border border-border bg-canvas px-3 py-2 text-[13px] text-ink ' +
  'placeholder:text-ink-muted/50 focus:outline-none focus:ring-2 focus:ring-accent ' +
  'focus:ring-offset-1 transition-shadow'

function fitColor(score: number) {
  if (score >= 70) return 'var(--color-stage-offer)'
  if (score >= 40) return 'var(--color-stage-interview)'
  return 'var(--color-stage-rejected)'
}

function CircularScore({ score }: { score: number }) {
  const size = 72
  const strokeWidth = 5
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference * (1 - score / 100)
  const color = fitColor(score)

  return (
    <div className="flex flex-col items-center gap-1.5 shrink-0">
      <div
        className="relative"
        style={{ width: size, height: size }}
        role="meter"
        aria-valuenow={score}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`Fit score: ${score} out of 100`}
      >
        <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }} aria-hidden="true">
          <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="var(--color-column)" strokeWidth={strokeWidth} />
          <circle
            cx={size / 2} cy={size / 2} r={radius} fill="none"
            stroke={color} strokeWidth={strokeWidth}
            strokeDasharray={circumference} strokeDashoffset={offset}
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center" aria-hidden="true">
          <span className="text-[15px] font-semibold leading-none" style={{ color }}>{score}</span>
          <span className="text-[9px] text-ink-muted/60 leading-none mt-0.5">/100</span>
        </div>
      </div>
      <span className="text-[10px] font-semibold text-ink-muted uppercase tracking-widest">
        Fit score
      </span>
    </div>
  )
}

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
  onDelete: (id: string) => void
}

export function ApplicationDetail({ application, onClose, onUpdate, onDelete }: Props) {
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
  const [confirmingDelete, setConfirmingDelete] = useState(false)
  const [selectedResumeId, setSelectedResumeId] = useState('')
  const [analyzing, setAnalyzing] = useState(false)
  const [analyzeError, setAnalyzeError] = useState<string | null>(null)
  const [generatingLetter, setGeneratingLetter] = useState(false)
  const [letterError, setLetterError] = useState<string | null>(null)
  const [letterOpen, setLetterOpen] = useState(false)
  const [generatingPrep, setGeneratingPrep] = useState(false)
  const [prepError, setPrepError] = useState<string | null>(null)
  const [prepOpen, setPrepOpen] = useState(false)

  const resumes = useQuery(api.resumes.list)
  const runAnalysis = useAction(api.ai.analyzeApplication)
  const runCoverLetter = useAction(api.ai.generateCoverLetter)
  const runInterviewPrep = useAction(api.ai.generateInterviewPrep)

  const appId = application.id as Id<'applications'>
  const analysis = useQuery(api.analyses.getByApplication, { applicationId: appId })
  const storedLetter = useQuery(api.coverLetters.getByApplication, { applicationId: appId })
  const storedPrep = useQuery(api.interviewPreps.getByApplication, { applicationId: appId })
  const history = useQuery(api.stageHistory.getByApplication, { applicationId: appId })

  const resumeList = resumes ?? []
  const activeResumeId = (selectedResumeId || resumeList[0]?._id || '') as Id<'resumes'>
  const hasJd = localJdText.trim().length > 0

  async function handleAnalyze() {
    if (!activeResumeId || !hasJd) return
    setAnalyzing(true)
    setAnalyzeError(null)
    try {
      await runAnalysis({ applicationId: appId, resumeId: activeResumeId })
    } catch (e) {
      setAnalyzeError(e instanceof Error ? e.message : 'Analysis failed — please try again.')
    } finally {
      setAnalyzing(false)
    }
  }

  async function handleGenerateLetter() {
    if (!activeResumeId || !hasJd) return
    setGeneratingLetter(true)
    setLetterError(null)
    try {
      await runCoverLetter({ applicationId: appId, resumeId: activeResumeId })
      setLetterOpen(true)
    } catch (e) {
      setLetterError(e instanceof Error ? e.message : 'Generation failed — please try again.')
    } finally {
      setGeneratingLetter(false)
    }
  }

  async function handleGeneratePrep() {
    if (!activeResumeId || !hasJd) return
    setGeneratingPrep(true)
    setPrepError(null)
    try {
      await runInterviewPrep({ applicationId: appId, resumeId: activeResumeId })
      setPrepOpen(true)
    } catch (e) {
      setPrepError(e instanceof Error ? e.message : 'Generation failed — please try again.')
    } finally {
      setGeneratingPrep(false)
    }
  }

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
      aria-modal="true"
      aria-labelledby="detail-title"
      className="w-full max-w-4xl max-h-[90vh] bg-canvas rounded-card border border-border shadow-card-drag flex flex-col outline-none"
    >
      <div onClick={e => e.stopPropagation()} className="flex flex-col flex-1 min-h-0">

        {/* Header — no edit controls here */}
        <div className="flex items-center gap-3 px-6 py-4 border-b border-border shrink-0">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <h2 id="detail-title" className="text-[19px] text-ink truncate" style={{ fontFamily: 'var(--font-display)' }}>
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
        <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-5">

          {/* Row 1: Overview — full width */}
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
                  <div className="flex gap-6 items-start">
                    {analysis?.fitScore !== undefined && (
                      <CircularScore score={analysis.fitScore} />
                    )}
                    <div className="flex-1 grid grid-cols-2 gap-x-8 gap-y-5">
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
                  </div>
                )}
          </section>

          {/* Row 2: Notes | Job Description — side by side, same height */}
          <div className="grid grid-cols-2 gap-5 items-stretch">
            <section className="bg-card border border-border rounded-card p-5 flex flex-col">
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
                className={`${inputCls} resize-none flex-1 min-h-[120px]`}
              />
            </section>
            <section className="bg-card border border-border rounded-card p-5 flex flex-col">
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
                className={`${inputCls} resize-none flex-1 min-h-[120px]`}
              />
            </section>
          </div>

          {/* Row 3: AI Positioning + Summary — one card */}
          <div className="bg-card border border-border rounded-card flex flex-col">
            {/* Top: controls (left) + summary (right) */}
            <div className="flex items-stretch">
              <div className="w-[320px] shrink-0 p-5 border-r border-border">
                <PositioningPanel
                  applicationId={application.id}
                  jdText={localJdText}
                  selectedResumeId={selectedResumeId}
                  onResumeChange={setSelectedResumeId}
                  analyzing={analyzing}
                  onAnalyze={handleAnalyze}
                  analyzeError={analyzeError}
                />
              </div>
              <div className="flex-1 min-w-0 p-5 flex flex-col">
                <h3 className="text-[11px] font-semibold text-ink-muted uppercase tracking-widest mb-3">
                  Positioning summary
                </h3>
                {analyzing ? (
                  <div className="flex flex-col gap-2 animate-pulse">
                    <div className="h-3 bg-column rounded w-full" />
                    <div className="h-3 bg-column rounded w-5/6" />
                    <div className="h-3 bg-column rounded w-4/6" />
                  </div>
                ) : analysis?.summary ? (
                  <p className="text-[14px] text-ink leading-relaxed">{md(analysis.summary)}</p>
                ) : (
                  <p className="text-[13px] text-ink-muted/60">
                    Run analysis to see your positioning summary.
                  </p>
                )}
              </div>
            </div>

            {/* Bottom: action buttons spanning full width */}
            <div className="flex border-t border-border relative">
              {/* Progress bar while generating */}
              {(generatingLetter || generatingPrep) && (
                <div className="absolute inset-x-0 top-0 h-0.5 overflow-hidden">
                  <div className="h-full bg-accent/40 animate-pulse" />
                </div>
              )}
              <button
                type="button"
                onClick={storedLetter ? () => setLetterOpen(true) : handleGenerateLetter}
                disabled={!hasJd || !activeResumeId || generatingLetter}
                className="flex-1 px-4 py-3 text-[13px] font-medium text-ink-muted hover:text-ink hover:bg-column transition-colors border-r border-border disabled:opacity-40 disabled:cursor-not-allowed focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-inset"
              >
                {generatingLetter ? 'Generating…' : storedLetter ? 'View cover letter' : 'Generate cover letter'}
              </button>
              <button
                type="button"
                onClick={storedPrep ? () => setPrepOpen(true) : handleGeneratePrep}
                disabled={!hasJd || !activeResumeId || generatingPrep}
                className="flex-1 px-4 py-3 text-[13px] font-medium text-ink-muted hover:text-ink hover:bg-column transition-colors disabled:opacity-40 disabled:cursor-not-allowed focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-inset"
              >
                {generatingPrep ? 'Generating…' : storedPrep ? 'View interview prep' : 'Prepare for interview'}
              </button>
            </div>

            {(letterError || prepError) && (
              <div className="px-5 pb-3 flex gap-4">
                {letterError && <p role="alert" className="text-[12px] text-stage-rejected">{letterError}</p>}
                {prepError && <p role="alert" className="text-[12px] text-stage-rejected">{prepError}</p>}
              </div>
            )}
          </div>

          {letterOpen && storedLetter && (
            <CoverLetterDialog
              letter={storedLetter.letter}
              regenerating={generatingLetter}
              onRegenerate={handleGenerateLetter}
              onClose={() => setLetterOpen(false)}
            />
          )}
          {prepOpen && storedPrep && (
            <InterviewPrepDialog
              prep={storedPrep}
              regenerating={generatingPrep}
              onRegenerate={handleGeneratePrep}
              onClose={() => setPrepOpen(false)}
            />
          )}

          {/* Analysis skeleton while analyzing */}
          {analyzing && (
            <div className="grid grid-cols-2 gap-5">
              {(['Strengths', 'Gaps', 'Keywords', 'Talking points'] as const).map(label => (
                <section key={label} className="bg-card border border-border rounded-card p-5">
                  <h3 className="text-[11px] font-semibold text-ink-muted uppercase tracking-widest mb-3">{label}</h3>
                  <div className="flex flex-col gap-2 animate-pulse">
                    {[100, 80, 90].map((w, i) => (
                      <div key={i} className="h-3 bg-column rounded" style={{ width: `${w}%` }} />
                    ))}
                  </div>
                </section>
              ))}
            </div>
          )}

          {/* Analysis details — full width */}
          {!analyzing && analysis && (
            <div className="grid grid-cols-2 gap-5">
              <section className="bg-card border border-border rounded-card p-5">
                <h3 className="text-[11px] font-semibold text-ink-muted uppercase tracking-widest mb-3">
                  Strengths
                </h3>
                <ul className="flex flex-col gap-2">
                  {analysis.strengths.map((s, i) => (
                    <li key={i} className="flex items-start gap-2 text-[13px] text-ink">
                      <span className="w-1.5 h-1.5 rounded-full shrink-0 mt-1.5" style={{ backgroundColor: 'var(--color-stage-offer)' }} />
                      <span>{md(s)}</span>
                    </li>
                  ))}
                </ul>
              </section>

              <section className="bg-card border border-border rounded-card p-5">
                <h3 className="text-[11px] font-semibold text-ink-muted uppercase tracking-widest mb-3">
                  Gaps
                </h3>
                <ul className="flex flex-col gap-2">
                  {analysis.gaps.map((g, i) => (
                    <li key={i} className="flex items-start gap-2 text-[13px] text-ink">
                      <span className="w-1.5 h-1.5 rounded-full shrink-0 mt-1.5" style={{ backgroundColor: 'var(--color-stage-interview)' }} />
                      <span>{md(g)}</span>
                    </li>
                  ))}
                </ul>
              </section>

              <section className="bg-card border border-border rounded-card p-5">
                <h3 className="text-[11px] font-semibold text-ink-muted uppercase tracking-widest mb-3">
                  Keywords
                </h3>
                <div className="flex flex-wrap gap-1.5">
                  {analysis.keywords.map((k, i) => (
                    <span key={i} className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-accent/10 text-accent">
                      {k}
                    </span>
                  ))}
                </div>
              </section>

              <section className="bg-card border border-border rounded-card p-5">
                <h3 className="text-[11px] font-semibold text-ink-muted uppercase tracking-widest mb-3">
                  Talking points
                </h3>
                <ul className="flex flex-col gap-2.5">
                  {analysis.talkingPoints.map((tp, i) => (
                    <li key={i} className="flex items-start gap-2 text-[13px] text-ink leading-snug">
                      <span className="shrink-0 text-[11px] font-semibold text-ink-muted mt-0.5">{i + 1}.</span>
                      <span>{md(tp)}</span>
                    </li>
                  ))}
                </ul>
              </section>
            </div>
          )}

          {/* Stage history */}
          {history && history.length > 0 && (
            <section className="bg-card border border-border rounded-card p-5">
              <h3 className="text-[11px] font-semibold text-ink-muted uppercase tracking-widest mb-3">
                History
              </h3>
              <ul className="flex flex-col gap-2">
                {history.map(entry => {
                  const from = STAGES.find(s => s.id === entry.fromStage)
                  const to = STAGES.find(s => s.id === entry.toStage)
                  const date = new Date(entry.movedAt).toLocaleDateString('en-US', {
                    month: 'short', day: 'numeric', year: 'numeric',
                  })
                  return (
                    <li key={entry._id} className="flex items-center justify-between text-[13px]">
                      <span className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: from?.color }} aria-hidden="true" />
                        <span className="text-ink">{from?.label}</span>
                        <span className="text-ink-muted" aria-hidden="true">→</span>
                        <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: to?.color }} aria-hidden="true" />
                        <span className="text-ink">{to?.label}</span>
                      </span>
                      <span className="text-[12px] text-ink-muted">{date}</span>
                    </li>
                  )
                })}
              </ul>
            </section>
          )}

          {/* Delete — bottom of modal */}
          <div className="flex justify-start pt-2 pb-1">
            {confirmingDelete ? (
              <div className="flex items-center gap-3">
                <span className="text-[13px] text-ink-muted">Delete this application?</span>
                <button
                  type="button"
                  onClick={() => setConfirmingDelete(false)}
                  className="px-3 py-1.5 rounded-button border border-border text-[13px] font-medium text-ink-muted hover:text-ink hover:bg-column transition-colors focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-1"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => { onDelete(application.id); onClose() }}
                  className="px-3 py-1.5 rounded-button bg-stage-rejected text-white text-[13px] font-medium hover:opacity-90 transition-opacity focus-visible:ring-2 focus-visible:ring-stage-rejected focus-visible:ring-offset-1"
                >
                  Yes, delete
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setConfirmingDelete(true)}
                className="px-3 py-1.5 rounded-button border border-stage-rejected text-stage-rejected text-[13px] font-medium hover:bg-stage-rejected hover:text-white transition-colors focus-visible:ring-2 focus-visible:ring-stage-rejected focus-visible:ring-offset-1"
              >
                Delete application
              </button>
            )}
          </div>
        </div>
      </div>
    </dialog>
  )
}
