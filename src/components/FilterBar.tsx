export interface Filters {
  query: string
  dateRange: 'all' | '7d' | '30d' | '90d' | 'year'
  score: 'all' | 'strong' | 'fair' | 'weak' | 'none'
}

export const DEFAULT_FILTERS: Filters = {
  query: '',
  dateRange: 'all',
  score: 'all',
}

interface Props {
  filters: Filters
  onChange: (f: Filters) => void
  visibleCount: number
  totalCount: number
}

const ctrl =
  'px-3 py-2 rounded-button border border-border bg-card text-[13px] text-ink ' +
  'focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-1 shadow-card'

export function FilterBar({ filters, onChange, visibleCount, totalCount }: Props) {
  const isFiltered =
    filters.query.trim() !== '' ||
    filters.dateRange !== 'all' ||
    filters.score !== 'all'

  function set<K extends keyof Filters>(key: K, value: Filters[K]) {
    onChange({ ...filters, [key]: value })
  }

  return (
    <div className="flex items-center gap-2 flex-wrap mb-4 sm:mb-0">
      <input
        type="search"
        aria-label="Search applications by company, role, or location"
        placeholder="Search by company, role, location…"
        value={filters.query}
        onChange={e => set('query', e.target.value)}
        className={`${ctrl} w-full sm:w-64 placeholder:text-ink-muted/50`}
      />

      <select
        value={filters.dateRange}
        onChange={e => set('dateRange', e.target.value as Filters['dateRange'])}
        className={ctrl}
        aria-label="Filter by applied date"
      >
        <option value="all">All dates</option>
        <option value="7d">Last 7 days</option>
        <option value="30d">Last 30 days</option>
        <option value="90d">Last 90 days</option>
        <option value="year">This year</option>
      </select>

      <select
        value={filters.score}
        onChange={e => set('score', e.target.value as Filters['score'])}
        className={ctrl}
        aria-label="Filter by fit score"
      >
        <option value="all">All scores</option>
        <option value="strong">Strong (70+)</option>
        <option value="fair">Fair (40–69)</option>
        <option value="weak">Weak (&lt;40)</option>
        <option value="none">Not scored</option>
      </select>

      {isFiltered && (
        <>
          <button
            type="button"
            onClick={() => onChange(DEFAULT_FILTERS)}
            className="px-3 py-2 rounded-button border border-border text-[13px] text-ink-muted hover:text-ink hover:bg-column transition-colors focus-visible:ring-2 focus-visible:ring-accent"
          >
            Clear
          </button>
          <span className="text-[12px] text-ink-muted">
            {visibleCount} of {totalCount}
          </span>
        </>
      )}
    </div>
  )
}
