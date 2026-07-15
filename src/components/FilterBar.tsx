import { useEffect, useRef, useState } from 'react'
import type { Filters } from '../types'
import { DEFAULT_FILTERS } from '../types'
import { SelectionToolbar } from './SelectionToolbar'

interface Props {
  filters: Filters
  onChange: (f: Filters) => void
  visibleCount: number
  totalCount: number
  selectionMode: boolean
  onToggleSelectionMode: () => void
  selectedCount: number
  activeSelectedCount: number
  archivedSelectedCount: number
  onArchiveSelected: () => void
  onUnarchiveSelected: () => void
  onDeleteSelected: () => void
  onRunAnalysis: () => void
  canRunAnalysis: boolean
  runningAnalysis: boolean
}

const ctrl =
  'h-9 px-3 rounded-button border border-border bg-card text-[13px] text-ink ' +
  'focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-1 shadow-card'

const toggleBtn =
  'h-9 px-3 rounded-button border text-[13px] font-medium transition-colors ' +
  'focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2'

const DATE_RANGE_LABELS: Record<Filters['dateRange'], string> = {
  all: 'All dates',
  today: 'Last 24 hours',
  '7d': 'Last 7 days',
  '30d': 'Last 30 days',
  '90d': 'Last 90 days',
  year: 'This year',
}

const SCORE_LABELS: Record<Filters['score'], string> = {
  all: 'All scores',
  strong: 'Strong (70+)',
  fair: 'Fair (40–69)',
  weak: 'Weak (<40)',
  none: 'Not scored',
}

function IconFilter() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <path d="M1 2H13" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      <path d="M3 7H11" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      <path d="M5.5 12H8.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  )
}

function IconSelect() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <rect x="1.5" y="1.5" width="11" height="11" rx="2" stroke="currentColor" strokeWidth="1.3" />
      <path d="M4 7L6 9L10 5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function IconClose() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <path d="M3 3L11 11M11 3L3 11" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  )
}

function FiltersPopover({ filters, onChange }: { filters: Filters; onChange: (f: Filters) => void }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const isActive = filters.dateRange !== 'all' || filters.score !== 'all'

  useEffect(() => {
    if (!open) return
    function handlePointerDown(e: PointerEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('pointerdown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [open])

  function set<K extends keyof Filters>(key: K, value: Filters[K]) {
    onChange({ ...filters, [key]: value })
  }

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        aria-expanded={open}
        aria-label="Filters"
        className={[
          toggleBtn,
          'inline-flex items-center gap-1.5',
          isActive
            ? 'border-accent text-accent bg-accent/10'
            : 'border-border text-ink-muted hover:text-ink hover:bg-column bg-card',
        ].join(' ')}
      >
        <IconFilter />
        <span className="hidden sm:inline">Filters</span>
      </button>

      {open && (
        <div className="absolute right-0 sm:left-0 sm:right-auto z-20 mt-2 w-56 rounded-card border border-border bg-card shadow-card-drag p-3 flex flex-col gap-3">
          <label className="flex flex-col gap-1.5">
            <span className="text-[11px] font-semibold text-ink-muted uppercase tracking-widest">Applied date</span>
            <select
              value={filters.dateRange}
              onChange={e => set('dateRange', e.target.value as Filters['dateRange'])}
              className={ctrl}
            >
              <option value="all">All dates</option>
              <option value="today">Last 24 hours</option>
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
              <option value="year">This year</option>
            </select>
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-[11px] font-semibold text-ink-muted uppercase tracking-widest">Fit score</span>
            <select
              value={filters.score}
              onChange={e => set('score', e.target.value as Filters['score'])}
              className={ctrl}
            >
              <option value="all">All scores</option>
              <option value="strong">Strong (70+)</option>
              <option value="fair">Fair (40–69)</option>
              <option value="weak">Weak (&lt;40)</option>
              <option value="none">Not scored</option>
            </select>
          </label>

          {isActive && (
            <button
              type="button"
              onClick={() => onChange({ ...DEFAULT_FILTERS, query: filters.query })}
              className="self-start text-[12px] text-accent hover:underline focus-visible:ring-2 focus-visible:ring-accent rounded"
            >
              Clear filters
            </button>
          )}
        </div>
      )}
    </div>
  )
}

function FilterTag({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="group inline-flex items-center gap-1 pl-2.5 pr-1.5 py-1 rounded-full bg-accent/10 text-accent text-[12px] font-medium">
      {label}
      <button
        type="button"
        onClick={onRemove}
        aria-label={`Remove filter: ${label}`}
        className="w-4 h-4 flex items-center justify-center rounded-full hover:bg-accent/20 transition-colors focus-visible:ring-2 focus-visible:ring-accent"
      >
        ✕
      </button>
    </span>
  )
}

export function FilterBar({
  filters,
  onChange,
  visibleCount,
  totalCount,
  selectionMode,
  onToggleSelectionMode,
  selectedCount,
  activeSelectedCount,
  archivedSelectedCount,
  onArchiveSelected,
  onUnarchiveSelected,
  onDeleteSelected,
  onRunAnalysis,
  canRunAnalysis,
  runningAnalysis,
}: Props) {
  const isFiltered =
    filters.query.trim() !== '' ||
    filters.dateRange !== 'all' ||
    filters.score !== 'all'

  function set<K extends keyof Filters>(key: K, value: Filters[K]) {
    onChange({ ...filters, [key]: value })
  }

  return (
    <div className="pt-3 sm:pt-6">
      <div className="flex items-center gap-2 flex-wrap">
        {/* filters — wrap on mobile */}
        <div className="flex items-center gap-2 flex-wrap flex-1">
          {totalCount > 0 && (
            <>
              <div className="flex items-center gap-2 flex-1 min-w-0 sm:flex-none">
                <input
                  type="search"
                  aria-label="Search applications by company, role, or location"
                  placeholder="Search by company, role, location…"
                  value={filters.query}
                  onChange={e => set('query', e.target.value)}
                  className={`${ctrl} flex-1 min-w-0 sm:w-64 sm:flex-none placeholder:text-ink-muted/50`}
                />

                <FiltersPopover filters={filters} onChange={onChange} />

                <button
                  type="button"
                  onClick={onToggleSelectionMode}
                  aria-pressed={selectionMode}
                  aria-label={selectionMode ? 'Done selecting' : 'Select applications'}
                  title={selectionMode ? 'Done' : 'Select'}
                  className={[
                    toggleBtn,
                    'shrink-0 inline-flex items-center gap-1.5 sm:hidden',
                    selectionMode
                      ? 'border-accent text-accent bg-accent/10'
                      : 'border-border text-ink-muted hover:text-ink hover:bg-column bg-card',
                  ].join(' ')}
                >
                  {selectionMode ? <IconClose /> : <IconSelect />}
                  <span className="hidden sm:inline">{selectionMode ? 'Done' : 'Select'}</span>
                </button>

                {selectionMode && (
                  <div className="sm:hidden">
                    <SelectionToolbar
                      count={selectedCount}
                      activeSelectedCount={activeSelectedCount}
                      archivedSelectedCount={archivedSelectedCount}
                      onArchiveSelected={onArchiveSelected}
                      onUnarchiveSelected={onUnarchiveSelected}
                      onDelete={onDeleteSelected}
                      onRunAnalysis={onRunAnalysis}
                      canRunAnalysis={canRunAnalysis}
                      runningAnalysis={runningAnalysis}
                    />
                  </div>
                )}
              </div>

              {isFiltered && (
                <span className="text-[12px] text-ink-muted">
                  {visibleCount} of {totalCount}
                </span>
              )}

              {/* desktop: selection controls pinned to the right of the row */}
              <div className="hidden sm:flex items-center gap-2 sm:ml-auto">
                {selectionMode && (
                  <SelectionToolbar
                    count={selectedCount}
                    activeSelectedCount={activeSelectedCount}
                    archivedSelectedCount={archivedSelectedCount}
                    onArchiveSelected={onArchiveSelected}
                    onUnarchiveSelected={onUnarchiveSelected}
                    onDelete={onDeleteSelected}
                    onRunAnalysis={onRunAnalysis}
                    canRunAnalysis={canRunAnalysis}
                    runningAnalysis={runningAnalysis}
                  />
                )}
                <button
                  type="button"
                  onClick={onToggleSelectionMode}
                  aria-pressed={selectionMode}
                  aria-label={selectionMode ? 'Done selecting' : 'Select applications'}
                  title={selectionMode ? 'Done' : 'Select'}
                  className={[
                    toggleBtn,
                    'shrink-0 inline-flex items-center gap-1.5',
                    selectionMode
                      ? 'border-accent text-accent bg-accent/10'
                      : 'border-border text-ink-muted hover:text-ink hover:bg-column bg-card',
                  ].join(' ')}
                >
                  {selectionMode ? <IconClose /> : <IconSelect />}
                  <span className="hidden sm:inline">{selectionMode ? 'Done' : 'Select'}</span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {isFiltered && (
        <div className="flex items-center gap-1.5 flex-wrap mt-2">
          {filters.query.trim() && (
            <FilterTag label={`"${filters.query.trim()}"`} onRemove={() => set('query', '')} />
          )}
          {filters.dateRange !== 'all' && (
            <FilterTag
              label={DATE_RANGE_LABELS[filters.dateRange]}
              onRemove={() => set('dateRange', 'all')}
            />
          )}
          {filters.score !== 'all' && (
            <FilterTag label={SCORE_LABELS[filters.score]} onRemove={() => set('score', 'all')} />
          )}
        </div>
      )}
    </div>
  )
}
