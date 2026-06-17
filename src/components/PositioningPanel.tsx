import { useState } from 'react'
import { useQuery, useAction } from 'convex/react'
import { api } from '../../convex/_generated/api'
import type { Id } from '../../convex/_generated/dataModel'

interface Props {
  applicationId: string
  jdText: string
}

function fitColor(score: number) {
  if (score >= 70) return 'var(--color-stage-offer)'
  if (score >= 40) return 'var(--color-stage-interview)'
  return 'var(--color-stage-rejected)'
}

export function PositioningPanel({ applicationId, jdText }: Props) {
  const appId = applicationId as Id<'applications'>
  const resumes = useQuery(api.resumes.list)
  const analysis = useQuery(api.analyses.getByApplication, { applicationId: appId })
  const runAnalysis = useAction(api.ai.analyzeApplication)

  const [selectedResumeId, setSelectedResumeId] = useState<string>('')
  const [analyzing, setAnalyzing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const resumeList = resumes ?? []
  const activeResumeId = selectedResumeId || resumeList[0]?._id || ''
  const hasJd = jdText.trim().length > 0

  async function handleAnalyze() {
    if (!activeResumeId || !hasJd) return
    setAnalyzing(true)
    setError(null)
    try {
      await runAnalysis({ applicationId: appId, resumeId: activeResumeId as Id<'resumes'> })
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Analysis failed — please try again.')
    } finally {
      setAnalyzing(false)
    }
  }

  return (
    <div className="bg-card border border-border rounded-card p-5 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-[13px] font-semibold text-ink-muted uppercase tracking-wider">
          AI Positioning
        </h2>
        {analysis && !analyzing && (
          <button
            type="button"
            onClick={handleAnalyze}
            disabled={!hasJd || !activeResumeId}
            className="text-[12px] text-ink-muted/60 hover:text-accent transition-colors focus-visible:ring-2 focus-visible:ring-accent rounded disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Re-analyze
          </button>
        )}
      </div>

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
              onChange={e => setSelectedResumeId(e.target.value)}
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
            onClick={handleAnalyze}
            disabled={!hasJd || analyzing}
            className="w-full px-4 py-2 rounded-button bg-accent text-white text-[13px] font-medium hover:bg-accent-hover transition-colors focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {analyzing ? 'Analyzing…' : analysis ? 'Re-analyze' : 'Analyze'}
          </button>

          {error && <p className="text-[12px] text-stage-rejected">{error}</p>}
        </div>
      )}

      {/* Fit score */}
      {(analysis || analyzing) && (
        <div className="border-t border-border pt-4">
          <span className="text-[11px] font-semibold text-ink-muted uppercase tracking-widest block mb-3">
            Fit score
          </span>
          {analyzing ? (
            <div className="h-2 bg-column rounded-full w-full animate-pulse" />
          ) : analysis ? (
            <div className="flex items-end gap-3">
              <span
                className="text-[32px] font-semibold leading-none"
                style={{ color: fitColor(analysis.fitScore) }}
              >
                {analysis.fitScore}
              </span>
              <div className="flex-1 mb-1.5">
                <div className="h-2 bg-column rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${analysis.fitScore}%`, backgroundColor: fitColor(analysis.fitScore) }}
                  />
                </div>
              </div>
              <span className="text-[13px] text-ink-muted mb-1">/100</span>
            </div>
          ) : null}
        </div>
      )}
    </div>
  )
}
