import { useState } from 'react'
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  pointerWithin,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core'
import { STAGES, type Application, type Stage } from '../types'
import { Column } from './Column'
import { ApplicationCardOverlay } from './ApplicationCard'

interface Props {
  applications: Application[]
  fitScores: Record<string, number>
  onMove: (id: string, stage: Stage) => void
  onSelect: (id: string) => void
}

export function Board({ applications, fitScores, onMove, onSelect }: Props) {
  const [activeApp, setActiveApp] = useState<Application | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  )

  function handleDragStart({ active }: DragStartEvent) {
    setActiveApp(applications.find(a => a.id === active.id) ?? null)
  }

  function handleDragEnd({ active, over }: DragEndEvent) {
    setActiveApp(null)
    if (!over) return
    const targetStage = STAGES.find(s => s.id === String(over.id))
    const currentStage = active.data.current?.stage as Stage | undefined
    if (targetStage && targetStage.id !== currentStage) {
      onMove(String(active.id), targetStage.id)
    }
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={pointerWithin}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div
        role="region"
        aria-label="Job application board"
        className="flex flex-col divide-y divide-border"
      >
        {STAGES.map(stage => (
          <Column
            key={stage.id}
            stage={stage}
            applications={applications.filter(a => a.stage === stage.id)}
            fitScores={fitScores}
            onSelect={onSelect}
          />
        ))}
      </div>

      <DragOverlay dropAnimation={null}>
        {activeApp ? <ApplicationCardOverlay application={activeApp} /> : null}
      </DragOverlay>
    </DndContext>
  )
}
