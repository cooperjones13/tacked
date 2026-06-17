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

interface CardVisualProps {
  application: Application
  isOverlay?: boolean
}

function CardVisual({ application, isOverlay = false }: CardVisualProps) {
  const stage = getStageConfig(application.stage)
  const date = formatDate(application.appliedDate)

  return (
    <div
      className={[
        'bg-card border border-border rounded-card p-3.5 select-none',
        isOverlay
          ? 'shadow-card-drag rotate-1'
          : 'shadow-card transition-shadow duration-150 hover:shadow-card-drag',
      ].join(' ')}
    >
      <div className="flex items-center gap-2 mb-1">
        <span
          className="w-2 h-2 rounded-full shrink-0"
          style={{ backgroundColor: stage.color }}
          aria-hidden="true"
        />
        <span className="text-[15px] font-semibold text-ink leading-tight truncate">
          {application.company}
        </span>
      </div>

      <p className="text-[13px] font-medium text-ink-muted leading-snug mb-2.5 truncate">
        {application.role}
      </p>

      <div className="flex items-center gap-1.5 text-[12px] text-ink-muted flex-wrap">
        {application.location && <span>{application.location}</span>}
        {application.salary && (
          <>
            <span className="text-border select-none">·</span>
            <span>{application.salary}</span>
          </>
        )}
        {date && (
          <>
            <span className="text-border select-none">·</span>
            <span>{date}</span>
          </>
        )}
      </div>
    </div>
  )
}

interface ApplicationCardProps {
  application: Application
  onClick?: () => void
}

export function ApplicationCard({ application, onClick }: ApplicationCardProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: application.id,
    data: { stage: application.stage },
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
      className="w-[260px] cursor-grab active:cursor-grabbing rounded-card focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
      {...listeners}
      {...attributes}
    >
      <CardVisual application={application} />
    </div>
  )
}

export function ApplicationCardOverlay({ application }: ApplicationCardProps) {
  return <CardVisual application={application} isOverlay />
}
