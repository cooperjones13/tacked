import { useState, useEffect, useRef, useCallback, useLayoutEffect, useMemo } from 'react'
import { useDarkMode } from './hooks/useDarkMode'
import { exportApplicationsCSV } from './utils/exportCSV'
import { useQuery, useAction } from 'convex/react'
import { UserButton, useAuth, useUser } from '@clerk/react'
import { api } from '../convex/_generated/api'
import type { Id } from '../convex/_generated/dataModel'
import { useBoard } from './hooks/useBoard'
import { Board } from './components/Board'
import { FilterBar } from './components/FilterBar'
import { AddApplicationDrawer } from './components/AddApplicationDrawer'
import { AddApplicationFab } from './components/AddApplicationFab'
import { ApplicationDetail } from './components/ApplicationDetail'
import { ResumeDrawer } from './components/ResumeDrawer'
import { AnalyticsDashboard } from './components/AnalyticsDashboard'
import { Toaster } from './components/Toaster'
import type { Toast } from './components/Toaster'
import { Landing } from './components/Landing'
import { Logo } from './components/Logo'
import type { Application, Stage, Filters } from './types'
import { DEFAULT_FILTERS } from './types'

function IconExport() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M8 1.5V10" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      <path d="M4.5 6.5L8 10L11.5 6.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M2 11.5V13C2 13.5523 2.44772 14 3 14H13C13.5523 14 14 13.5523 14 13V11.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  )
}

function IconAnalytics() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <line x1="2" y1="14" x2="14" y2="14" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      <rect x="3.5" y="8.5" width="2.4" height="5" rx="0.5" stroke="currentColor" strokeWidth="1.2" />
      <rect x="6.8" y="5.5" width="2.4" height="8" rx="0.5" stroke="currentColor" strokeWidth="1.2" />
      <rect x="10.1" y="2.5" width="2.4" height="11" rx="0.5" stroke="currentColor" strokeWidth="1.2" />
    </svg>
  )
}

function IconResumes() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <rect x="3" y="1.5" width="10" height="13" rx="1.5" stroke="currentColor" strokeWidth="1.3" />
      <line x1="5.5" y1="5" x2="10.5" y2="5" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" />
      <line x1="5.5" y1="7.5" x2="10.5" y2="7.5" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" />
      <line x1="5.5" y1="10" x2="8.5" y2="10" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" />
    </svg>
  )
}

function IconMoon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path
        d="M13.5 9.7A6 6 0 0 1 6.3 2.5a6 6 0 1 0 7.2 7.2Z"
        stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"
      />
    </svg>
  )
}

function IconSun() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <circle cx="8" cy="8" r="3" stroke="currentColor" strokeWidth="1.3" />
      <path
        d="M8 1.5V3M8 13V14.5M14.5 8H13M3 8H1.5M12.5 3.5L11.4 4.6M4.6 11.4L3.5 12.5M12.5 12.5L11.4 11.4M4.6 4.6L3.5 3.5"
        stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"
      />
    </svg>
  )
}

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
      if (filters.dateRange === 'today') {
        const today = new Date().toISOString().split('T')[0]
        if (app.appliedDate !== today) return false
      } else {
        const days = filters.dateRange === '7d' ? 7 : filters.dateRange === '30d' ? 30 : filters.dateRange === '90d' ? 90 : 365
        const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000)
        if (new Date(app.appliedDate) < cutoff) return false
      }
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
  const { user } = useUser()
  const userDisplayName = user?.fullName || user?.firstName || user?.primaryEmailAddress?.emailAddress
  const { applications, addApplication, addPlaceholderApplication, updateApplication, deleteApplication, deleteApplications, archiveApplications } = useBoard()
  const resumesData = useQuery(api.resumes.list)
  const runAnalysis = useAction(api.ai.analyzeApplication)
  const extractJob = useAction(api.ai.extractJobIntoApplication)
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
  const [selectionMode, setSelectionMode] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [runningAnalysis, setRunningAnalysis] = useState(false)

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

  async function handleAddWithUrlFill(url: string) {
    const newId = await addPlaceholderApplication(url, drawerDefaultStage)
    const toastId = `extract-${newId}`
    addToast('Fetching job details…', 'info', toastId)
    try {
      await extractJob({ applicationId: newId, url })
      dismissToast(toastId)
      addToast('Job details filled in', 'success')
    } catch (e) {
      dismissToast(toastId)
      addToast(e instanceof Error ? e.message : 'Could not fetch that page — edit the application manually.', 'info')
    }
  }

  function toggleSelectionMode() {
    setSelectionMode(m => !m)
    setSelectedIds(new Set())
  }

  function toggleSelect(id: string) {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function handleBulkDelete() {
    const ids = Array.from(selectedIds)
    deleteApplications(ids)
    setSelectedIds(new Set())
    addToast(`Deleted ${ids.length} application${ids.length === 1 ? '' : 's'}`, 'success')
  }

  function handleBulkArchive() {
    const ids = applications.filter(a => selectedIds.has(a.id) && !a.archived).map(a => a.id)
    if (ids.length === 0) return
    archiveApplications(ids, true)
    setSelectedIds(new Set())
    addToast(`Archived ${ids.length} application${ids.length === 1 ? '' : 's'}`, 'success')
  }

  function handleBulkUnarchive() {
    const ids = applications.filter(a => selectedIds.has(a.id) && a.archived).map(a => a.id)
    if (ids.length === 0) return
    archiveApplications(ids, false)
    setSelectedIds(new Set())
    addToast(`Restored ${ids.length} application${ids.length === 1 ? '' : 's'}`, 'success')
  }

  async function handleBulkAnalysis() {
    const resumeList = resumesData ?? []
    const defaultResumeId = resumeList[0]?._id
    if (!defaultResumeId) {
      addToast('Upload a resume first to run AI analysis.', 'info')
      return
    }

    const targets = Array.from(selectedIds)
      .map(id => applications.find(a => a.id === id))
      .filter((a): a is Application => !!a && a.jdText.trim().length > 0)

    const skipped = selectedIds.size - targets.length
    if (targets.length === 0) {
      addToast('None of the selected applications have a job description to analyze.', 'info')
      return
    }

    setRunningAnalysis(true)
    addToast(`Analyzing ${targets.length} application${targets.length === 1 ? '' : 's'}…`, 'info', 'bulk-analysis')
    let succeeded = 0
    for (const app of targets) {
      try {
        await runAnalysis({ applicationId: app.id as Id<'applications'>, resumeId: defaultResumeId })
        succeeded++
      } catch {
        // continue with remaining applications
      }
    }
    setRunningAnalysis(false)
    const failed = targets.length - succeeded
    const parts = [`Analyzed ${succeeded} application${succeeded === 1 ? '' : 's'}`]
    if (failed > 0) parts.push(`${failed} failed`)
    if (skipped > 0) parts.push(`${skipped} skipped (no job description)`)
    addToast(parts.join(' — '), succeeded > 0 ? 'success' : 'info', 'bulk-analysis')
    setSelectedIds(new Set())
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
  const selectedApps = applications.filter(a => selectedIds.has(a.id))
  const activeSelectedCount = selectedApps.filter(a => !a.archived).length
  const archivedSelectedCount = selectedApps.filter(a => a.archived).length

  return (
    <div className="h-screen bg-canvas flex flex-col overflow-hidden">
      <header className="z-20 bg-canvas border-b border-border px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2 sm:gap-3">
          <Logo className="w-5 h-5 sm:w-6 sm:h-6 shrink-0" />
          <span className="text-[22px] sm:text-[26px] text-ink tracking-tight" style={{ fontFamily: 'var(--font-display)' }}>Tacked</span>
          <div className="hidden sm:block w-px h-4 bg-border shrink-0" aria-hidden="true" />
          <span className="hidden sm:block text-[12px] text-ink-muted">job search tracker</span>
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          {userDisplayName && (
            <span className="hidden sm:inline text-[13px] font-medium text-ink-muted">
              {userDisplayName}
            </span>
          )}

          <UserButton>
            <UserButton.MenuItems>
              <UserButton.Action
                label={dark ? 'Light mode' : 'Dark mode'}
                labelIcon={dark ? <IconSun /> : <IconMoon />}
                onClick={() => setDark(d => !d)}
              />
              <UserButton.Action
                label="Analytics"
                labelIcon={<IconAnalytics />}
                onClick={() => setAnalyticsOpen(true)}
              />
              <UserButton.Action
                label="Resumes"
                labelIcon={<IconResumes />}
                onClick={() => setResumeDrawerOpen(true)}
              />
              <UserButton.Action
                label="Export CSV"
                labelIcon={<IconExport />}
                onClick={() => {
                  if (applications.length === 0) return
                  exportApplicationsCSV(applications, fitScores)
                }}
              />
            </UserButton.MenuItems>
          </UserButton>
        </div>
      </header>

      {/* Rendered here (not at the end of the tree) so it's an early, not final, keyboard tab stop —
          position:fixed means this has no effect on its visual placement. */}
      <AddApplicationFab onAdd={() => setDrawerOpen(true)} />

      <main className="flex-1 min-h-0 overflow-y-auto px-3 sm:px-6 pb-3 sm:pb-6 flex flex-col">
        <FilterBar
          filters={filters}
          onChange={setFilters}
          visibleCount={visibleApplications.length}
          totalCount={applications.length}
          selectionMode={selectionMode}
          onToggleSelectionMode={toggleSelectionMode}
          selectedCount={selectedIds.size}
          activeSelectedCount={activeSelectedCount}
          archivedSelectedCount={archivedSelectedCount}
          onArchiveSelected={handleBulkArchive}
          onUnarchiveSelected={handleBulkUnarchive}
          onDeleteSelected={handleBulkDelete}
          onRunAnalysis={handleBulkAnalysis}
          canRunAnalysis={(resumesData?.length ?? 0) > 0}
          runningAnalysis={runningAnalysis}
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
            allApplications={applications}
            fitScores={fitScores}
            aiStatus={aiStatus}
            onUpdate={updateApplication}
            onSelect={setSelectedId}
            onAdd={openAddForStage}
            selectionMode={selectionMode}
            selectedIds={selectedIds}
            onToggleSelect={toggleSelect}
          />
        )}
      </main>

      <AddApplicationDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onAdd={addApplication}
        onAddWithUrlFill={handleAddWithUrlFill}
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
