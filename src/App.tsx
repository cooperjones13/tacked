import { useState, useEffect, useRef, useCallback, useLayoutEffect, useMemo } from 'react'
import { useDarkMode } from './hooks/useDarkMode'
import { exportApplicationsCSV } from './utils/exportCSV'
import { useQuery } from 'convex/react'
import { UserButton, useAuth } from '@clerk/react'
import { api } from '../convex/_generated/api'
import { useBoard } from './hooks/useBoard'
import { Board } from './components/Board'
import { FilterBar } from './components/FilterBar'
import { AddApplicationDrawer } from './components/AddApplicationDrawer'
import { ApplicationDetail } from './components/ApplicationDetail'
import { ResumeDrawer } from './components/ResumeDrawer'
import { AnalyticsDashboard } from './components/AnalyticsDashboard'
import { Toaster } from './components/Toaster'
import type { Toast } from './components/Toaster'
import { Landing } from './components/Landing'
import { Logo } from './components/Logo'
import type { Application, Stage, Filters } from './types'
import { DEFAULT_FILTERS } from './types'

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
  const allLettersData = useQuery(api.coverLetters.listAll)
  const allLetters = useMemo(() => allLettersData ?? [], [allLettersData])
  const allPrepsData = useQuery(api.interviewPreps.listAll)
  const allPreps = useMemo(() => allPrepsData ?? [], [allPrepsData])

  const [dark, setDark] = useDarkMode()
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [drawerDefaultStage, setDrawerDefaultStage] = useState<Stage>('interested')
  const [resumeDrawerOpen, setResumeDrawerOpen] = useState(false)
  const [analyticsOpen, setAnalyticsOpen] = useState(false)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS)
  const [toasts, setToasts] = useState<Toast[]>([])

  const addToast = useCallback((message: string, type: Toast['type'], id?: string) => {
    const toastId = id ?? `${Date.now()}-${Math.random()}`
    setToasts(ts => {
      // replace if same id already exists (e.g. re-generating)
      if (ts.some(t => t.id === toastId)) {
        return ts.map(t => t.id === toastId ? { ...t, message, type } : t)
      }
      return [...ts, { id: toastId, message, type }]
    })
  }, [])

  const dismissToast = useCallback((id: string) => {
    setToasts(ts => ts.filter(t => t.id !== id))
  }, [])

  // Detect cover letter and interview prep completions
  const applicationsRef = useRef(applications)
  const prevLetterStatuses = useRef(new Map<string, string | undefined>())
  const prevPrepStatuses = useRef(new Map<string, string | undefined>())
  const addToastRef = useRef(addToast)
  const dismissToastRef = useRef(dismissToast)
  useLayoutEffect(() => {
    applicationsRef.current = applications
    addToastRef.current = addToast
    dismissToastRef.current = dismissToast
  })

  useEffect(() => {
    for (const letter of allLetters) {
      const appId = letter.applicationId as string
      const prev = prevLetterStatuses.current.get(appId)
      if (prev === 'pending' && letter.status === 'complete') {
        const app = applicationsRef.current.find(a => a.id === appId)
        if (app) {
          dismissToastRef.current(`letter-${appId}`)
          addToastRef.current(`Cover letter for ${app.company} is ready`, 'success')
        }
      }
    }
    prevLetterStatuses.current = new Map(allLetters.map(l => [l.applicationId as string, l.status]))
  }, [allLetters])

  useEffect(() => {
    for (const prep of allPreps) {
      const appId = prep.applicationId as string
      const prev = prevPrepStatuses.current.get(appId)
      if (prev === 'pending' && prep.status === 'complete') {
        const app = applicationsRef.current.find(a => a.id === appId)
        if (app) {
          dismissToastRef.current(`prep-${appId}`)
          addToastRef.current(`Interview prep for ${app.company} is ready`, 'success')
        }
      }
    }
    prevPrepStatuses.current = new Map(allPreps.map(p => [p.applicationId as string, p.status]))
  }, [allPreps])

  function openAddForStage(stage: Stage) {
    setDrawerDefaultStage(stage)
    setDrawerOpen(true)
  }

  const aiStatus: Record<string, { letter: boolean; prep: boolean }> = {}
  for (const l of allLetters) {
    if (l.status === 'complete' && l.letter) {
      const id = l.applicationId as string
      aiStatus[id] = { letter: true, prep: aiStatus[id]?.prep ?? false }
    }
  }
  for (const p of allPreps) {
    if (p.status === 'complete' && p.behavioral?.length) {
      const id = p.applicationId as string
      aiStatus[id] = { letter: aiStatus[id]?.letter ?? false, prep: true }
    }
  }

  const visibleApplications = applyFilters(applications, filters, fitScores)
  const selectedApp = selectedId ? (applications.find(a => a.id === selectedId) ?? null) : null

  return (
    <div className="min-h-screen bg-canvas flex flex-col">
      <header className="sticky top-0 z-10 bg-canvas border-b border-border px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2 sm:gap-3">
          <Logo className="w-5 h-5 sm:w-6 sm:h-6 shrink-0" />
          <span className="text-[22px] sm:text-[26px] text-ink tracking-tight" style={{ fontFamily: 'var(--font-display)' }}>Tacked</span>
          <div className="hidden sm:block w-px h-4 bg-border shrink-0" aria-hidden="true" />
          <span className="hidden sm:block text-[12px] text-ink-muted">job search tracker</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setDark(d => !d)}
            aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
            className="w-9 h-9 flex items-center justify-center rounded-button border border-border text-ink-muted hover:text-ink hover:bg-column transition-colors focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
          >
            {dark ? '☀' : '☾'}
          </button>
          <button
            onClick={() => exportApplicationsCSV(applications, fitScores)}
            disabled={applications.length === 0}
            className="hidden sm:block px-4 py-2 rounded-button border border-border text-[13px] font-medium text-ink-muted hover:text-ink hover:bg-column transition-colors focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Export
          </button>
          <button
            onClick={() => setAnalyticsOpen(true)}
            className="hidden sm:block px-4 py-2 rounded-button border border-border text-[13px] font-medium text-ink-muted hover:text-ink hover:bg-column transition-colors focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
          >
            Analytics
          </button>
          <button
            onClick={() => setResumeDrawerOpen(true)}
            className="hidden sm:block px-4 py-2 rounded-button border border-border text-[13px] font-medium text-ink-muted hover:text-ink hover:bg-column transition-colors focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
          >
            Resumes
          </button>
          <div className="ml-2">
            <UserButton />
          </div>
        </div>
      </header>

      <main className="flex-1 p-3 sm:p-6">
        <FilterBar
          filters={filters}
          onChange={setFilters}
          visibleCount={visibleApplications.length}
          totalCount={applications.length}
          onAdd={() => setDrawerOpen(true)}
        />

        {applications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3">
            <p className="text-[15px] font-medium text-ink">No applications yet</p>
            <p className="text-[13px] text-ink-muted">
              Add your first job application to start tracking.
            </p>
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
            aiStatus={aiStatus}
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
      {analyticsOpen && (
        <AnalyticsDashboard onClose={() => setAnalyticsOpen(false)} />
      )}
      {selectedApp && (
        <ApplicationDetail
          application={selectedApp}
          onClose={() => setSelectedId(null)}
          onUpdate={updateApplication}
          onDelete={(id) => { deleteApplication(id); setSelectedId(null) }}
          onToast={addToast}
        />
      )}
      <Toaster toasts={toasts} onDismiss={dismissToast} />
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
    return <Landing />
  }

  return <BoardApp />
}

export default App
