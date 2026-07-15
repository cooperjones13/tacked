import { useQuery, useMutation } from 'convex/react'
import { api } from '../../convex/_generated/api'
import type { Id } from '../../convex/_generated/dataModel'
import type { Application, Stage } from '../types'

type Patch = Partial<Omit<Application, 'id' | 'createdAt' | 'pending'>>

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
  archived?: boolean
  extracting?: boolean
  extractionFailed?: boolean
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
    archived: doc.archived ?? false,
    extracting: doc.extracting ?? false,
    extractionFailed: doc.extractionFailed ?? false,
    createdAt: new Date(doc._creationTime).toISOString(),
    pending: doc._creationTime === 0,
  }
}

export function useBoard() {
  const raw = useQuery(api.applications.list)
  const createMutation = useMutation(api.applications.create).withOptimisticUpdate(
    (localStore, args) => {
      const current = localStore.getQuery(api.applications.list, {})
      if (current === undefined) return
      localStore.setQuery(api.applications.list, {}, [
        ...current,
        {
          // Placeholder values discarded the instant the real mutation result
          // arrives and replaces this optimistic entry.
          _id: crypto.randomUUID() as Id<'applications'>,
          _creationTime: 0,
          ...args,
        },
      ])
    }
  )
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
  const removeManyMutation = useMutation(api.applications.removeMany).withOptimisticUpdate(
    (localStore, { ids }) => {
      const current = localStore.getQuery(api.applications.list, {})
      if (current === undefined) return
      const idSet = new Set(ids as string[])
      localStore.setQuery(
        api.applications.list,
        {},
        current.filter(app => !idSet.has(app._id))
      )
    }
  )
  const archiveManyMutation = useMutation(api.applications.archiveMany).withOptimisticUpdate(
    (localStore, { ids, archived }) => {
      const current = localStore.getQuery(api.applications.list, {})
      if (current === undefined) return
      const idSet = new Set(ids as string[])
      localStore.setQuery(
        api.applications.list,
        {},
        current.map(app => idSet.has(app._id) ? { ...app, archived } : app)
      )
    }
  )

  const applications: Application[] = (raw ?? []).map(toApp)

  function addApplication(data: Omit<Application, 'id' | 'createdAt' | 'archived' | 'extracting' | 'extractionFailed' | 'pending'>) {
    return createMutation(data)
  }

  function addPlaceholderApplication(jobUrl: string, stage: Stage) {
    return createMutation({
      company: '',
      role: '',
      location: '',
      salary: '',
      jobUrl,
      jdText: '',
      stage,
      appliedDate: null,
      notes: '',
      extracting: true,
    })
  }

  function updateApplication(id: string, patch: Patch) {
    return updateMutation({ id: id as Id<'applications'>, ...patch })
  }

  function deleteApplication(id: string) {
    return removeMutation({ id: id as Id<'applications'> })
  }

  function deleteApplications(ids: string[]) {
    return removeManyMutation({ ids: ids as Id<'applications'>[] })
  }

  function archiveApplications(ids: string[], archived: boolean) {
    return archiveManyMutation({ ids: ids as Id<'applications'>[], archived })
  }

  return {
    applications,
    isLoading: raw === undefined,
    addApplication,
    addPlaceholderApplication,
    updateApplication,
    deleteApplication,
    deleteApplications,
    archiveApplications,
  }
}
