import type { CSSProperties } from 'react'
import { useDraggable } from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import type { Application, StageConfig } from '../types'
import { STAGES } from '../types'

function getStageConfig(stage: Application['stage']): StageConfig {
  return STAGES.find(s => s.id === stage) ?? STAGES[0]
}

function formatDate(dateStr: string | null): string | null {
  if (!dateStr) return null
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function fitScoreColor(score: number) {
  if (score >= 70) return 'var(--color-stage-offer-text)'
  if (score >= 40) return 'var(--color-stage-interview-text)'
  return 'var(--color-stage-rejected-text)'
}

function IconDoc({ title }: { title: string }) {
  return (
    <svg width="13" height="14" viewBox="0 0 13 14" fill="none" aria-hidden="true">
      <title>{title}</title>
      <rect x="1" y="1" width="9" height="12" rx="1.5" stroke="currentColor" strokeWidth="1.25"/>
      <line x1="3" y1="4.5" x2="8" y2="4.5" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round"/>
      <line x1="3" y1="6.5" x2="8" y2="6.5" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round"/>
      <line x1="3" y1="8.5" x2="6" y2="8.5" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round"/>
    </svg>
  )
}

function IconChat({ title }: { title: string }) {
  return (
    <svg width="14" height="13" viewBox="0 0 14 13" fill="none" aria-hidden="true">
      <title>{title}</title>
      <path
        d="M12.5 1H1.5C1.22 1 1 1.22 1 1.5V8.5C1 8.78 1.22 9 1.5 9H4.5L7 12L9.5 9H12.5C12.78 9 13 8.78 13 8.5V1.5C13 1.22 12.78 1 12.5 1Z"
        stroke="currentColor" strokeWidth="1.25" strokeLinejoin="round"
      />
    </svg>
  )
}

interface CardVisualProps {
  application: Application
  fitScore?: number
  aiStatus?: { letter: boolean; prep: boolean }
  isOverlay?: boolean
  selectionMode?: boolean
  selected?: boolean
}

function CardVisual({ application, fitScore, aiStatus, isOverlay = false, selectionMode = false, selected = false }: CardVisualProps) {
  const stage = getStageConfig(application.stage)
  const date = formatDate(application.appliedDate)

  return (
    <div
      className={[
        'bg-card border rounded-card p-3.5 select-none flex flex-col min-h-[120px]',
        selected ? 'border-accent ring-2 ring-accent/40' : 'border-border',
        isOverlay
          ? 'shadow-card-drag rotate-1'
          : 'shadow-card transition-shadow duration-150 hover:shadow-card-drag',
      ].join(' ')}
    >
      <div className="flex items-center gap-2 mb-1">
        {selectionMode ? (
          <span
            role="checkbox"
            aria-checked={selected}
            aria-label={`Select ${application.company}`}
            className={[
              'w-4 h-4 rounded-full border-2 shrink-0 flex items-center justify-center transition-colors',
              selected ? 'bg-accent-btn border-accent-btn' : 'bg-card border-border',
            ].join(' ')}
          >
            {selected && (
              <svg width="8" height="6" viewBox="0 0 8 6" fill="none" aria-hidden="true">
                <path d="M1 3L3 5L7 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </span>
        ) : (
          <span
            className="w-2 h-2 rounded-full shrink-0"
            style={{ backgroundColor: stage.color }}
            aria-hidden="true"
          />
        )}
        {application.extracting ? (
          <div className="h-4 rounded bg-column animate-pulse flex-1 max-w-[65%]" aria-hidden="true" />
        ) : (
          <>
            <span className="text-[15px] font-semibold text-ink leading-tight truncate flex-1">
              {application.company}
            </span>
            {(aiStatus?.letter || aiStatus?.prep) && (
              <span className="shrink-0 flex items-center gap-1 text-ink-muted/60" aria-label="AI content available">
                {aiStatus.letter && (
                  <span title="Cover letter generated">
                    <IconDoc title="Cover letter" />
                  </span>
                )}
                {aiStatus.prep && (
                  <span title="Interview prep generated">
                    <IconChat title="Interview prep" />
                  </span>
                )}
              </span>
            )}
            {fitScore !== undefined && (
              <span
                className="shrink-0 text-[11px] font-semibold px-1.5 py-0.5 rounded"
                style={{
                  color: fitScoreColor(fitScore),
                  backgroundColor: `color-mix(in srgb, ${fitScoreColor(fitScore)} 12%, transparent)`,
                }}
              >
                {fitScore}
              </span>
            )}
          </>
        )}
      </div>

      {application.extracting ? (
        <>
          <p className="text-[12px] text-ink-muted/60 italic leading-snug mb-1.5">
            Fetching job details…
          </p>
          <div className="flex flex-col gap-1.5 mt-auto" aria-hidden="true">
            <div className="h-2.5 rounded bg-column animate-pulse w-1/2" />
            <div className="h-2.5 rounded bg-column animate-pulse w-2/5" />
          </div>
        </>
      ) : (
        <>
          <p className="text-[13px] font-medium text-ink-muted leading-snug mb-1 truncate">
            {application.role}
          </p>

          {application.location && (
            <p className="text-[12px] text-ink-muted truncate mb-1">
              {application.location}
            </p>
          )}

          <div className="flex items-center justify-between gap-2 text-[12px] text-ink-muted mt-auto">
            <span className="truncate">{application.salary}</span>
            {date && <span className="shrink-0">{date}</span>}
          </div>
        </>
      )}
    </div>
  )
}

interface ApplicationCardProps {
  application: Application
  fitScore?: number
  aiStatus?: { letter: boolean; prep: boolean }
  onClick?: () => void
  selectionMode?: boolean
  selected?: boolean
}

export function ApplicationCard({ application, fitScore, aiStatus, onClick, selectionMode = false, selected = false }: ApplicationCardProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: application.id,
    disabled: application.pending,
  })

  const style: CSSProperties = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.4 : 1,
    touchAction: 'none',
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      onClick={onClick}
      onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick?.() } }}
      className={[
        'w-full rounded-card focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2',
        selectionMode ? 'cursor-pointer' : 'cursor-grab active:cursor-grabbing',
      ].join(' ')}
      {...listeners}
      {...attributes}
    >
      <CardVisual application={application} fitScore={fitScore} aiStatus={aiStatus} selectionMode={selectionMode} selected={selected} />
    </div>
  )
}

export function ApplicationCardOverlay({ application, fitScore, aiStatus }: ApplicationCardProps) {
  return <CardVisual application={application} fitScore={fitScore} aiStatus={aiStatus} isOverlay />
}
