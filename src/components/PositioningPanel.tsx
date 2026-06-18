import { useState } from 'react'
import { useQuery, useAction } from 'convex/react'
import { api } from '../../convex/_generated/api'
import type { Id } from '../../convex/_generated/dataModel'
import { CoverLetterDialog } from './CoverLetterDialog'
import { InterviewPrepDialog } from './InterviewPrepDialog'

interface Props {
  applicationId: string
  jdText: string
}


export function PositioningPanel({ applicationId, jdText }: Props) {
  const appId = applicationId as Id<'applications'>
  const resumes = useQuery(api.resumes.list)
  const analysis = useQuery(api.analyses.getByApplication, { applicationId: appId })
  const runAnalysis = useAction(api.ai.analyzeApplication)
  const runCoverLetter = useAction(api.ai.generateCoverLetter)
  const runInterviewPrep = useAction(api.ai.generateInterviewPrep)

  const [selectedResumeId, setSelectedResumeId] = useState<string>('')
  const [analyzing, setAnalyzing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [coverLetter, setCoverLetter] = useState<string | null>(null)
  const [generatingLetter, setGeneratingLetter] = useState(false)
  const [letterError, setLetterError] = useState<string | null>(null)
  const [interviewPrep, setInterviewPrep] = useState<Parameters<typeof InterviewPrepDialog>[0]['prep'] | null>(null)
  const [generatingPrep, setGeneratingPrep] = useState(false)
  const [prepError, setPrepError] = useState<string | null>(null)

  const resumeList = resumes ?? []
  const activeResumeId = selectedResumeId || resumeList[0]?._id || ''
  const hasJd = jdText.trim().length > 0

  async function handleGeneratePrep() {
    if (!activeResumeId) return
    setGeneratingPrep(true)
    setPrepError(null)
    try {
      const prep = await runInterviewPrep({
        applicationId: appId,
        resumeId: activeResumeId as Id<'resumes'>,
      })
      setInterviewPrep(prep)
    } catch (e) {
      setPrepError(e instanceof Error ? e.message : 'Generation failed — please try again.')
    } finally {
      setGeneratingPrep(false)
    }
  }

  async function handleGenerateLetter() {
    if (!activeResumeId) return
    setGeneratingLetter(true)
    setLetterError(null)
    try {
      const letter = await runCoverLetter({
        applicationId: appId,
        resumeId: activeResumeId as Id<'resumes'>,
      })
      setCoverLetter(letter)
    } catch (e) {
      setLetterError(e instanceof Error ? e.message : 'Generation failed — please try again.')
    } finally {
      setGeneratingLetter(false)
    }
  }

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

          {error && <p role="alert" className="text-[12px] text-stage-rejected">{error}</p>}

          {/* Cover letter + Interview prep */}
          <div className="border-t border-border pt-3 flex flex-col gap-2">
            <button
              type="button"
              onClick={handleGenerateLetter}
              disabled={!hasJd || generatingLetter}
              className="w-full px-4 py-2 rounded-button border border-border text-[13px] font-medium text-ink-muted hover:text-ink hover:bg-column transition-colors focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {generatingLetter ? 'Generating…' : 'Generate cover letter'}
            </button>
            {letterError && <p role="alert" className="text-[12px] text-stage-rejected">{letterError}</p>}
            <button
              type="button"
              onClick={handleGeneratePrep}
              disabled={!hasJd || generatingPrep}
              className="w-full px-4 py-2 rounded-button border border-border text-[13px] font-medium text-ink-muted hover:text-ink hover:bg-column transition-colors focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {generatingPrep ? 'Generating…' : 'Prepare for interview'}
            </button>
            {prepError && <p role="alert" className="text-[12px] text-stage-rejected">{prepError}</p>}
          </div>
        </div>
      )}


      {coverLetter && (
        <CoverLetterDialog
          letter={coverLetter}
          regenerating={generatingLetter}
          onRegenerate={handleGenerateLetter}
          onClose={() => setCoverLetter(null)}
        />
      )}

      {interviewPrep && (
        <InterviewPrepDialog
          prep={interviewPrep}
          regenerating={generatingPrep}
          onRegenerate={handleGeneratePrep}
          onClose={() => setInterviewPrep(null)}
        />
      )}
    </div>
  )
}
