import { useDroppable } from '@dnd-kit/core'
import type { Application, StageConfig } from '../types'
import { ApplicationCard } from './ApplicationCard'

interface Props {
  stage: StageConfig
  applications: Application[]
  onSelect: (id: string) => void
}

export function Column({ stage, applications, onSelect }: Props) {
  const { setNodeRef, isOver } = useDroppable({ id: stage.id })

  return (
    <div className="flex flex-col">
      <div className="flex items-center gap-2 pb-3">
        <span
          className="w-2 h-2 rounded-full shrink-0"
          style={{ backgroundColor: stage.color }}
          aria-hidden="true"
        />
        <h2 className="text-[13px] font-semibold text-ink-muted uppercase tracking-wider">
          {stage.label}
        </h2>
        <span className="ml-auto text-[12px] text-ink-muted tabular-nums">
          {applications.length}
        </span>
      </div>

      <div
        ref={setNodeRef}
        className={[
          'flex flex-col gap-2 rounded-card p-2 min-h-32 flex-1',
          'transition-colors duration-150',
          isOver
            ? 'bg-accent/10 ring-1 ring-inset ring-accent/30'
            : 'bg-column',
        ].join(' ')}
        aria-label={`${stage.label} — ${applications.length} application${applications.length === 1 ? '' : 's'}`}
      >
        {applications.map(app => (
          <ApplicationCard key={app.id} application={app} onClick={() => onSelect(app.id)} />
        ))}
        {applications.length === 0 && (
          <p className="text-[12px] text-ink-muted/50 text-center pt-6 select-none" aria-hidden="true">
            Drop here
          </p>
        )}
      </div>
    </div>
  )
}
