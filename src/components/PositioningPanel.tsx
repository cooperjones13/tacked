import { useQuery } from 'convex/react'
import { api } from '../../convex/_generated/api'
import type { Id } from '../../convex/_generated/dataModel'

interface Props {
  applicationId: string
  jdText: string
  selectedResumeId: string
  onResumeChange: (id: string) => void
  analyzing: boolean
  onAnalyze: () => void
  analyzeError: string | null
}

export function PositioningPanel({
  applicationId,
  jdText,
  selectedResumeId,
  onResumeChange,
  analyzing,
  onAnalyze,
  analyzeError,
}: Props) {
  const appId = applicationId as Id<'applications'>
  const resumes = useQuery(api.resumes.list)
  const analysis = useQuery(api.analyses.getByApplication, { applicationId: appId })

  const resumeList = resumes ?? []
  const activeResumeId = selectedResumeId || resumeList[0]?._id || ''
  const hasJd = jdText.trim().length > 0

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-[11px] font-semibold text-ink-muted uppercase tracking-widest">
        AI Positioning
      </h2>

      {resumes !== undefined && resumeList.length === 0 && (
        <p className="text-[13px] text-ink-muted/70 leading-relaxed">
          Upload a resume using the{' '}
          <strong className="font-medium text-ink-muted">Resumes</strong> button to enable analysis.
        </p>
      )}

      {resumeList.length > 0 && (
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <span className="text-[11px] font-semibold text-ink-muted uppercase tracking-widest">
              Resume
            </span>
            <select
              value={activeResumeId}
              onChange={e => onResumeChange(e.target.value)}
              className="w-full rounded-button border border-border bg-canvas px-3 py-2 text-[13px] text-ink focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-1"
            >
              {resumeList.map(r => (
                <option key={r._id} value={r._id}>{r.label}</option>
              ))}
            </select>
          </div>

          {!hasJd && (
            <p className="text-[12px] text-ink-muted/60">
              Add a job description above to enable analysis.
            </p>
          )}

          <button
            type="button"
            onClick={onAnalyze}
            disabled={!hasJd || analyzing || !activeResumeId}
            className="w-full px-4 py-2 rounded-button bg-accent text-white text-[13px] font-medium hover:bg-accent-hover transition-colors focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {analyzing ? 'Analyzing…' : analysis ? 'Re-analyze' : 'Analyze'}
          </button>

          {analyzeError && (
            <p role="alert" className="text-[12px] text-stage-rejected">{analyzeError}</p>
          )}
        </div>
      )}
    </div>
  )
}
