import { useState } from 'react'
import { useQuery } from 'convex/react'
import { api } from '../convex/_generated/api'
import { useBoard } from './hooks/useBoard'
import { Board } from './components/Board'
import { FilterBar, DEFAULT_FILTERS } from './components/FilterBar'
import type { Filters } from './components/FilterBar'
import { AddApplicationDrawer } from './components/AddApplicationDrawer'
import { ApplicationDetail } from './components/ApplicationDetail'
import { ResumeDrawer } from './components/ResumeDrawer'
import type { Application } from './types'

function applyFilters(
  apps: Application[],
  filters: Filters,
  fitScores: Record<string, number>,
): Application[] {
  return apps.filter(app => {
    if (filters.query.trim()) {
      const q = filters.query.toLowerCase()
      if (
        !app.company.toLowerCase().includes(q) &&
        !app.role.toLowerCase().includes(q) &&
        !app.location.toLowerCase().includes(q) &&
        !app.notes.toLowerCase().includes(q)
      ) return false
    }

    if (filters.dateRange !== 'all') {
      if (!app.appliedDate) return false
      const days = filters.dateRange === '30d' ? 30 : filters.dateRange === '90d' ? 90 : 365
      const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000)
      if (new Date(app.appliedDate) < cutoff) return false
    }

    if (filters.score !== 'all') {
      const score = fitScores[app.id]
      if (filters.score === 'none') return score === undefined
      if (score === undefined) return false
      if (filters.score === 'strong') return score >= 70
      if (filters.score === 'fair') return score >= 40 && score < 70
      if (filters.score === 'weak') return score < 40
    }

    return true
  })
}

function App() {
  const { applications, moveApplication, addApplication, updateApplication, deleteApplication } = useBoard()
  const fitScoreData = useQuery(api.analyses.listFitScores)
  const fitScores: Record<string, number> = Object.fromEntries(
    (fitScoreData ?? []).map(f => [f.applicationId, f.fitScore])
  )

  const [drawerOpen, setDrawerOpen] = useState(false)
  const [resumeDrawerOpen, setResumeDrawerOpen] = useState(false)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS)

  const visibleApplications = applyFilters(applications, filters, fitScores)

  const selectedApp = selectedId
    ? (applications.find(a => a.id === selectedId) ?? null)
    : null

  return (
    <div className="min-h-screen bg-canvas flex flex-col">
      <header className="sticky top-0 z-10 bg-canvas border-b border-border px-6 py-4 flex items-center justify-between shrink-0">
        <span className="text-[17px] font-semibold text-ink tracking-tight">Onward</span>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setResumeDrawerOpen(true)}
            className="px-4 py-2 rounded-button border border-border text-[13px] font-medium text-ink-muted hover:text-ink hover:bg-column transition-colors focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
          >
            Resumes
          </button>
          <button
            onClick={() => setDrawerOpen(true)}
            className="px-4 py-2 rounded-button bg-accent text-white text-[13px] font-medium hover:bg-accent-hover transition-colors focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
          >
            + Add application
          </button>
        </div>
      </header>

      <main className="flex-1 p-6">
        <FilterBar
          filters={filters}
          onChange={setFilters}
          visibleCount={visibleApplications.length}
          totalCount={applications.length}
        />
        <Board
          applications={visibleApplications}
          fitScores={fitScores}
          onMove={moveApplication}
          onSelect={setSelectedId}
        />
      </main>

      <AddApplicationDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onAdd={addApplication}
      />
      <ResumeDrawer
        open={resumeDrawerOpen}
        onClose={() => setResumeDrawerOpen(false)}
      />
      {selectedApp && (
        <ApplicationDetail
          application={selectedApp}
          onClose={() => setSelectedId(null)}
          onUpdate={updateApplication}
          onDelete={(id) => { deleteApplication(id); setSelectedId(null) }}
        />
      )}
    </div>
  )
}

export default App
