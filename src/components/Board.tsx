import { useRef, useState } from 'react'
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  pointerWithin,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
} from '@dnd-kit/core'
import { STAGES, type Application, type Stage } from '../types'
import { useCollapsedSections } from '../hooks/useCollapsedSections'
import { Column } from './Column'
import { ApplicationCardOverlay } from './ApplicationCard'

const ARCHIVED_ID = 'archived'
const ARCHIVED_SECTION = { id: ARCHIVED_ID, label: 'Archived', color: 'var(--color-ink-muted)' }
const AUTO_EXPAND_DELAY = 500

type UpdatePatch = Partial<Pick<Application, 'stage' | 'archived'>>

interface Props {
  applications: Application[]
  allApplications: Application[]
  fitScores: Record<string, number>
  aiStatus: Record<string, { letter: boolean; prep: boolean }>
  onUpdate: (id: string, patch: UpdatePatch) => void
  onSelect: (id: string) => void
  onAdd: (stage: Stage) => void
  selectionMode?: boolean
  selectedIds?: Set<string>
  onToggleSelect?: (id: string) => void
}

export function Board({
  applications,
  allApplications,
  fitScores,
  aiStatus,
  onUpdate,
  onSelect,
  onAdd,
  selectionMode = false,
  selectedIds,
  onToggleSelect,
}: Props) {
  const [activeApp, setActiveApp] = useState<Application | null>(null)
  const { collapsed, toggle } = useCollapsedSections()
  const [autoExpanded, setAutoExpanded] = useState<Set<string>>(new Set())
  const hoverTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const hoveredIdRef = useRef<string | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  )

  function isOpen(id: string) {
    return autoExpanded.has(id) || !collapsed.has(id)
  }

  function resetDragHoverState() {
    if (hoverTimerRef.current) {
      clearTimeout(hoverTimerRef.current)
      hoverTimerRef.current = null
    }
    hoveredIdRef.current = null
    setAutoExpanded(new Set())
  }

  function handleDragStart({ active }: DragStartEvent) {
    setActiveApp(applications.find(a => a.id === active.id) ?? null)
  }

  function handleDragOver({ over }: DragOverEvent) {
    const overId = over ? String(over.id) : null
    if (overId === hoveredIdRef.current) return
    hoveredIdRef.current = overId

    if (hoverTimerRef.current) {
      clearTimeout(hoverTimerRef.current)
      hoverTimerRef.current = null
    }
    if (overId && collapsed.has(overId)) {
      hoverTimerRef.current = setTimeout(() => {
        setAutoExpanded(prev => new Set(prev).add(overId))
      }, AUTO_EXPAND_DELAY)
    }
  }

  function handleDragEnd({ active, over }: DragEndEvent) {
    setActiveApp(null)
    resetDragHoverState()
    if (!over) return

    const draggedId = String(active.id)
    const overId = String(over.id)

    // Dragging a card that's part of a multi-selection moves the whole selection.
    const targetIds =
      selectedIds?.has(draggedId) && selectedIds.size > 1 ? Array.from(selectedIds) : [draggedId]

    if (overId === ARCHIVED_ID) {
      for (const id of targetIds) {
        const app = applications.find(a => a.id === id)
        if (app && !app.archived) onUpdate(id, { archived: true })
      }
      return
    }

    const targetStage = STAGES.find(s => s.id === overId)
    if (!targetStage) return

    for (const id of targetIds) {
      const app = applications.find(a => a.id === id)
      if (!app) continue
      if (app.archived) {
        onUpdate(id, { archived: false, stage: targetStage.id })
      } else if (app.stage !== targetStage.id) {
        onUpdate(id, { stage: targetStage.id })
      }
    }
  }

  function handleDragCancel() {
    setActiveApp(null)
    resetDragHoverState()
  }

  const dragCount =
    activeApp && selectedIds?.has(activeApp.id) && selectedIds.size > 1 ? selectedIds.size : 1

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={pointerWithin}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <div
        role="region"
        aria-label="Job application board"
        className="flex flex-col divide-y divide-border"
      >
        {STAGES.map(stage => {
          const visible = applications.filter(a => a.stage === stage.id && !a.archived)
          const total = allApplications.filter(a => a.stage === stage.id && !a.archived).length
          return (
            <Column
              key={stage.id}
              stage={stage}
              applications={visible}
              hiddenCount={total - visible.length}
              fitScores={fitScores}
              aiStatus={aiStatus}
              onSelect={onSelect}
              onAdd={() => onAdd(stage.id)}
              selectionMode={selectionMode}
              selectedIds={selectedIds}
              onToggleSelect={onToggleSelect}
              collapsed={!isOpen(stage.id)}
              onToggleCollapse={() => toggle(stage.id)}
              isDragActive={activeApp !== null}
            />
          )
        })}
        {(() => {
          const visible = applications.filter(a => a.archived)
          const total = allApplications.filter(a => a.archived).length
          return (
            <Column
              key={ARCHIVED_ID}
              stage={ARCHIVED_SECTION}
              applications={visible}
              hiddenCount={total - visible.length}
              fitScores={fitScores}
              aiStatus={aiStatus}
              onSelect={onSelect}
              selectionMode={selectionMode}
              selectedIds={selectedIds}
              onToggleSelect={onToggleSelect}
              collapsed={!isOpen(ARCHIVED_ID)}
              onToggleCollapse={() => toggle(ARCHIVED_ID)}
              isDragActive={activeApp !== null}
              muted
            />
          )
        })()}
      </div>

      <DragOverlay dropAnimation={null}>
        {activeApp ? (
          <div className="relative">
            <ApplicationCardOverlay application={activeApp} />
            {dragCount > 1 && (
              <span
                className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-accent-btn text-white text-[11px] font-semibold flex items-center justify-center shadow-card-drag"
                aria-hidden="true"
              >
                {dragCount}
              </span>
            )}
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  )
}
