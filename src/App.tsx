import { useState } from 'react'
import { useQuery } from 'convex/react'
import { SignIn, UserButton, useAuth } from '@clerk/react'
import { api } from '../convex/_generated/api'
import { useBoard } from './hooks/useBoard'
import { Board } from './components/Board'
import { FilterBar, DEFAULT_FILTERS } from './components/FilterBar'
import type { Filters } from './components/FilterBar'
import { AddApplicationDrawer } from './components/AddApplicationDrawer'
import { ApplicationDetail } from './components/ApplicationDetail'
import { ResumeDrawer } from './components/ResumeDrawer'
import type { Application, Stage } from './types'

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
      const days = filters.dateRange === '7d' ? 7 : filters.dateRange === '30d' ? 30 : filters.dateRange === '90d' ? 90 : 365
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

// Board and all data hooks — only rendered when authenticated
function BoardApp() {
  const { applications, moveApplication, addApplication, updateApplication, deleteApplication } = useBoard()
  const fitScoreData = useQuery(api.analyses.listFitScores)
  const fitScores: Record<string, number> = Object.fromEntries(
    (fitScoreData ?? []).map(f => [f.applicationId, f.fitScore])
  )

  const [drawerOpen, setDrawerOpen] = useState(false)
  const [drawerDefaultStage, setDrawerDefaultStage] = useState<Stage>('interested')
  const [resumeDrawerOpen, setResumeDrawerOpen] = useState(false)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS)

  function openAddForStage(stage: Stage) {
    setDrawerDefaultStage(stage)
    setDrawerOpen(true)
  }

  const visibleApplications = applyFilters(applications, filters, fitScores)
  const selectedApp = selectedId ? (applications.find(a => a.id === selectedId) ?? null) : null

  return (
    <div className="min-h-screen bg-canvas flex flex-col">
      <header className="sticky top-0 z-10 bg-canvas border-b border-border px-6 py-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <span className="text-[26px] text-ink tracking-tight" style={{ fontFamily: 'var(--font-display)' }}>Tacked</span>
          <div className="w-px h-4 bg-border shrink-0" aria-hidden="true" />
          <span className="text-[12px] text-ink-muted">job search tracker</span>
        </div>
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
          <div className="ml-2">
            <UserButton />
          </div>
        </div>
      </header>

      <main className="flex-1 p-6">
        {applications.length > 0 && (
          <FilterBar
            filters={filters}
            onChange={setFilters}
            visibleCount={visibleApplications.length}
            totalCount={applications.length}
          />
        )}

        {applications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <p className="text-[15px] font-medium text-ink">No applications yet</p>
            <p className="text-[13px] text-ink-muted">
              Add your first job application to start tracking.
            </p>
            <button
              onClick={() => setDrawerOpen(true)}
              className="mt-2 px-4 py-2 rounded-button bg-accent text-white text-[13px] font-medium hover:bg-accent-hover transition-colors focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
            >
              + Add application
            </button>
          </div>
        ) : visibleApplications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3">
            <p className="text-[15px] font-medium text-ink">No applications match your filters</p>
            <button
              onClick={() => setFilters(DEFAULT_FILTERS)}
              className="text-[13px] text-accent hover:underline focus-visible:ring-2 focus-visible:ring-accent rounded"
            >
              Clear filters
            </button>
          </div>
        ) : (
          <Board
            applications={visibleApplications}
            fitScores={fitScores}
            onMove={moveApplication}
            onSelect={setSelectedId}
            onAdd={openAddForStage}
          />
        )}
      </main>

      <AddApplicationDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onAdd={addApplication}
        defaultStage={drawerDefaultStage}
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

// Auth gate — shows sign-in screen until authenticated
function App() {
  const { isSignedIn, isLoaded } = useAuth()

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-canvas flex items-center justify-center">
        <p className="text-[13px] text-ink-muted">Loading…</p>
      </div>
    )
  }

  if (!isSignedIn) {
    return (
      <div className="min-h-screen bg-canvas flex items-center justify-center">
        <SignIn />
      </div>
    )
  }

  return <BoardApp />
}

export default App
