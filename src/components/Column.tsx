import { useDroppable } from '@dnd-kit/core'
import type { Application, StageConfig } from '../types'
import { ApplicationCard } from './ApplicationCard'

interface Props {
  stage: StageConfig
  applications: Application[]
}

export function Column({ stage, applications }: Props) {
  const { setNodeRef, isOver } = useDroppable({ id: stage.id })

  return (
    <div className="flex items-start gap-4 py-4">
      <div className="w-28 shrink-0 flex flex-col gap-0.5 pt-2">
        <div className="flex items-center gap-2">
          <span
            className="w-2 h-2 rounded-full shrink-0"
            style={{ backgroundColor: stage.color }}
            aria-hidden="true"
          />
          <h2 className="text-[13px] font-semibold text-ink-muted uppercase tracking-wider">
            {stage.label}
          </h2>
        </div>
        <span className="text-[12px] text-ink-muted tabular-nums pl-4">
          {applications.length}
        </span>
      </div>

      <div
        ref={setNodeRef}
        className={[
          'flex-1 flex flex-wrap gap-2 rounded-card p-2 min-h-24',
          'transition-colors duration-150',
          isOver
            ? 'bg-accent/10 ring-1 ring-inset ring-accent/30'
            : 'bg-column',
        ].join(' ')}
        aria-label={`${stage.label} — ${applications.length} application${applications.length === 1 ? '' : 's'}`}
      >
        {applications.map(app => (
          <ApplicationCard key={app.id} application={app} />
        ))}
        {applications.length === 0 && (
          <p className="text-[12px] text-ink-muted/50 self-center pl-2 select-none" aria-hidden="true">
            Drop here
          </p>
        )}
      </div>
    </div>
  )
}
