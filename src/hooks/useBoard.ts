import { useQuery, useMutation } from 'convex/react'
import { api } from '../../convex/_generated/api'
import type { Id } from '../../convex/_generated/dataModel'
import type { Application, Stage } from '../types'

type Patch = Partial<Omit<Application, 'id' | 'createdAt'>>

function toApp(doc: {
  _id: Id<'applications'>
  _creationTime: number
  company: string
  role: string
  location: string
  salary: string
  jobUrl: string
  jdText: string
  stage: Stage
  appliedDate: string | null
  notes: string
}): Application {
  return {
    id: doc._id as string,
    company: doc.company,
    role: doc.role,
    location: doc.location,
    salary: doc.salary,
    jobUrl: doc.jobUrl,
    jdText: doc.jdText,
    stage: doc.stage,
    appliedDate: doc.appliedDate,
    notes: doc.notes,
    createdAt: new Date(doc._creationTime).toISOString(),
  }
}

export function useBoard() {
  const raw = useQuery(api.applications.list)
  const createMutation = useMutation(api.applications.create)
  const updateMutation = useMutation(api.applications.update).withOptimisticUpdate(
    (localStore, { id, ...patch }) => {
      const current = localStore.getQuery(api.applications.list, {})
      if (current === undefined) return
      localStore.setQuery(
        api.applications.list,
        {},
        current.map(app => app._id === id ? { ...app, ...patch } : app)
      )
    }
  )
  const removeMutation = useMutation(api.applications.remove).withOptimisticUpdate(
    (localStore, { id }) => {
      const current = localStore.getQuery(api.applications.list, {})
      if (current !== undefined) {
        localStore.setQuery(
          api.applications.list,
          {},
          current.filter(app => app._id !== id)
        )
      }
    }
  )

  const applications: Application[] = (raw ?? []).map(toApp)

  function addApplication(data: Omit<Application, 'id' | 'createdAt'>) {
    return createMutation(data)
  }

  function updateApplication(id: string, patch: Patch) {
    return updateMutation({ id: id as Id<'applications'>, ...patch })
  }

  function moveApplication(id: string, stage: Stage) {
    return updateMutation({ id: id as Id<'applications'>, stage })
  }

  function deleteApplication(id: string) {
    return removeMutation({ id: id as Id<'applications'> })
  }

  return {
    applications,
    isLoading: raw === undefined,
    addApplication,
    updateApplication,
    moveApplication,
    deleteApplication,
  }
}
