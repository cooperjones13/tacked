import { useDroppable } from '@dnd-kit/core'
import type { Application, StageConfig } from '../types'
import { ApplicationCard } from './ApplicationCard'

interface Props {
  stage: StageConfig
  applications: Application[]
  fitScores: Record<string, number>
  onSelect: (id: string) => void
  onAdd: () => void
}

export function Column({ stage, applications, fitScores, onSelect, onAdd }: Props) {
  const { setNodeRef, isOver } = useDroppable({ id: stage.id })

  return (
    <div className="py-4">
      <div className="flex items-center gap-2 mb-3 pr-2">
        <span
          className="w-2 h-2 rounded-full shrink-0"
          style={{ backgroundColor: stage.color }}
          aria-hidden="true"
        />
        <h2 className="text-[15px] text-ink-muted" style={{ fontFamily: 'var(--font-display)' }}>
          {stage.label}
        </h2>
        <span className="ml-2 text-[12px] text-ink-muted tabular-nums">
          {applications.length}
        </span>
        <button
          type="button"
          onClick={onAdd}
          aria-label={`Add application to ${stage.label}`}
          className="ml-auto text-[18px] leading-none text-ink-muted/40 hover:text-accent transition-colors focus-visible:ring-2 focus-visible:ring-accent rounded"
        >
          +
        </button>
      </div>

      <div
        ref={setNodeRef}
        className={[
          'flex flex-wrap gap-2 rounded-card p-2 min-h-24',
          'transition-colors duration-150',
          isOver
            ? 'bg-accent/10 ring-1 ring-inset ring-accent/30'
            : 'bg-column',
        ].join(' ')}
        aria-label={`${stage.label} — ${applications.length} application${applications.length === 1 ? '' : 's'}`}
      >
        {applications.map(app => (
          <ApplicationCard key={app.id} application={app} fitScore={fitScores[app.id]} onClick={() => onSelect(app.id)} />
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
