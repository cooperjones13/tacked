import { useDroppable } from '@dnd-kit/core'
import type { Application } from '../types'
import { ApplicationCard } from './ApplicationCard'

interface SectionConfig {
  id: string
  label: string
  color: string
}

interface Props {
  stage: SectionConfig
  applications: Application[]
  hiddenCount?: number
  fitScores: Record<string, number>
  aiStatus: Record<string, { letter: boolean; prep: boolean }>
  onSelect: (id: string) => void
  onAdd?: () => void
  selectionMode?: boolean
  selectedIds?: Set<string>
  onToggleSelect?: (id: string) => void
  collapsed?: boolean
  onToggleCollapse?: () => void
  isDragActive?: boolean
  muted?: boolean
}

export function Column({
  stage,
  applications,
  hiddenCount = 0,
  fitScores,
  aiStatus,
  onSelect,
  onAdd,
  selectionMode = false,
  selectedIds,
  onToggleSelect,
  collapsed = false,
  onToggleCollapse,
  isDragActive = false,
  muted = false,
}: Props) {
  const { setNodeRef, isOver } = useDroppable({ id: stage.id })

  return (
    <div ref={setNodeRef} className={collapsed ? 'py-1' : 'py-4'}>
      <div
        onClick={onToggleCollapse}
        role={onToggleCollapse ? 'button' : undefined}
        tabIndex={onToggleCollapse ? 0 : undefined}
        onKeyDown={e => {
          if (onToggleCollapse && (e.key === 'Enter' || e.key === ' ')) {
            e.preventDefault()
            onToggleCollapse()
          }
        }}
        aria-expanded={onToggleCollapse ? !collapsed : undefined}
        aria-label={onToggleCollapse ? `${collapsed ? 'Expand' : 'Collapse'} ${stage.label} section` : undefined}
        className={[
          'sticky top-0 z-10 flex items-center gap-2 py-3 -mx-3 sm:-mx-6 px-3 sm:px-6 transition-colors duration-150',
          collapsed ? 'mb-0' : 'mb-3',
          onToggleCollapse ? 'cursor-pointer select-none focus-visible:ring-2 focus-visible:ring-accent' : '',
          collapsed && isOver ? 'bg-accent/10 ring-1 ring-inset ring-accent/30' : 'bg-canvas',
        ].join(' ')}
      >
        <span
          aria-hidden="true"
          className={`text-[10px] text-ink-muted/50 transition-transform duration-150 ${collapsed ? '-rotate-90' : ''}`}
        >
          ▾
        </span>
        <span
          className="w-2 h-2 rounded-full shrink-0"
          style={{ backgroundColor: stage.color }}
          aria-hidden="true"
        />
        <h2
          className={`text-[15px] ${muted ? 'text-ink-muted/70 italic' : 'text-ink-muted'}`}
          style={{ fontFamily: 'var(--font-display)' }}
        >
          {stage.label}
        </h2>
        <span className="ml-2 text-[12px] text-ink-muted tabular-nums">
          {applications.length}
          {hiddenCount > 0 && (
            <span className="text-ink-muted/50"> · {hiddenCount} hidden</span>
          )}
        </span>
        {onAdd && (
          <button
            type="button"
            onClick={e => { e.stopPropagation(); onAdd() }}
            aria-label={`Add application to ${stage.label}`}
            className="ml-auto text-[18px] leading-none text-ink-muted/40 hover:text-accent transition-colors focus-visible:ring-2 focus-visible:ring-accent rounded"
          >
            +
          </button>
        )}
      </div>

      {!collapsed && (
        <div
          className={[
            'grid gap-2 rounded-card p-2 min-h-24 items-stretch',
            'grid-cols-[repeat(auto-fill,minmax(220px,1fr))]',
            'transition-colors duration-150',
            isOver
              ? 'bg-accent/10 ring-1 ring-inset ring-accent/30'
              : 'bg-column',
          ].join(' ')}
          aria-label={`${stage.label} — ${applications.length} application${applications.length === 1 ? '' : 's'}`}
        >
          {applications.map(app => (
            <ApplicationCard
              key={app.id}
              application={app}
              fitScore={fitScores[app.id]}
              aiStatus={aiStatus[app.id]}
              onClick={() => {
                if (app.pending) return
                if (selectionMode) onToggleSelect?.(app.id)
                else onSelect(app.id)
              }}
              selectionMode={selectionMode}
              selected={selectedIds?.has(app.id) ?? false}
            />
          ))}
          {applications.length === 0 && isDragActive && (
            <p
              className="col-span-full flex items-center justify-center h-20 text-[12px] text-ink-muted/50 select-none"
              aria-hidden="true"
            >
              Drop here
            </p>
          )}
        </div>
      )}
    </div>
  )
}
