import { useState } from 'react'

interface Props {
  count: number
  activeSelectedCount: number
  archivedSelectedCount: number
  onArchiveSelected: () => void
  onUnarchiveSelected: () => void
  onDelete: () => void
  onRunAnalysis: () => void
  canRunAnalysis: boolean
  runningAnalysis: boolean
}

const btn =
  'inline-flex items-center gap-1.5 px-2 sm:px-2.5 py-1.5 rounded-button border border-border text-[12px] font-medium text-ink-muted ' +
  'hover:text-ink hover:bg-column transition-colors focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 ' +
  'disabled:opacity-40 disabled:cursor-not-allowed'

const label = 'hidden sm:inline'

function IconSparkle() {
  return (
    <svg width="13" height="13" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <path d="M7 1L8.2 5.8L13 7L8.2 8.2L7 13L5.8 8.2L1 7L5.8 5.8L7 1Z" stroke="currentColor" strokeWidth="1" strokeLinejoin="round" fill="currentColor" fillOpacity="0.15" />
    </svg>
  )
}

function IconArchiveBox() {
  return (
    <svg width="13" height="13" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <rect x="1.5" y="2" width="11" height="2.5" rx="0.5" stroke="currentColor" strokeWidth="1.1" />
      <path d="M2.3 4.5V11C2.3 11.55 2.75 12 3.3 12H10.7C11.25 12 11.7 11.55 11.7 11V4.5" stroke="currentColor" strokeWidth="1.1" />
      <line x1="5.5" y1="7" x2="8.5" y2="7" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" />
    </svg>
  )
}

function IconRestore() {
  return (
    <svg width="13" height="13" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <rect x="1.5" y="2" width="11" height="2.5" rx="0.5" stroke="currentColor" strokeWidth="1.1" />
      <path d="M2.3 4.5V11C2.3 11.55 2.75 12 3.3 12H10.7C11.25 12 11.7 11.55 11.7 11V4.5" stroke="currentColor" strokeWidth="1.1" />
      <path d="M7 9.5V6M7 6L5.5 7.5M7 6L8.5 7.5" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function IconTrash() {
  return (
    <svg width="13" height="13" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <path d="M2.5 3.5H11.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      <path d="M5.5 3.5V2.3C5.5 2 5.75 1.7 6.1 1.7H7.9C8.25 1.7 8.5 2 8.5 2.3V3.5" stroke="currentColor" strokeWidth="1.2" />
      <path d="M3.3 3.5L3.8 11.5C3.83 11.9 4.17 12.2 4.57 12.2H9.43C9.83 12.2 10.17 11.9 10.2 11.5L10.7 3.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
      <line x1="5.7" y1="6" x2="5.9" y2="10" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
      <line x1="8.3" y1="6" x2="8.1" y2="10" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
    </svg>
  )
}

export function SelectionToolbar({
  count,
  activeSelectedCount,
  archivedSelectedCount,
  onArchiveSelected,
  onUnarchiveSelected,
  onDelete,
  onRunAnalysis,
  canRunAnalysis,
  runningAnalysis,
}: Props) {
  const [confirmingDelete, setConfirmingDelete] = useState(false)

  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      <span className="text-[13px] font-medium text-ink whitespace-nowrap">
        {count}<span className={label}> selected</span>
      </span>
      {confirmingDelete ? (
        <>
          <span className="text-[13px] text-ink-muted whitespace-nowrap">
            Delete {count}?
          </span>
          <button type="button" onClick={() => setConfirmingDelete(false)} className={btn}>
            Cancel
          </button>
          <button
            type="button"
            onClick={() => { setConfirmingDelete(false); onDelete() }}
            className="inline-flex items-center gap-1.5 px-2 sm:px-2.5 py-1.5 rounded-button bg-stage-rejected text-white text-[12px] font-medium hover:opacity-90 transition-opacity focus-visible:ring-2 focus-visible:ring-stage-rejected focus-visible:ring-offset-2"
          >
            Yes, delete
          </button>
        </>
      ) : (
        <>
          <button
            type="button"
            onClick={onRunAnalysis}
            disabled={!canRunAnalysis || runningAnalysis || count === 0}
            title="Run AI analysis"
            className={btn}
          >
            <IconSparkle />
            <span className={label}>{runningAnalysis ? 'Analyzing…' : 'Analyze'}</span>
          </button>
          {archivedSelectedCount === 0 && (
            <button
              type="button"
              onClick={onArchiveSelected}
              disabled={activeSelectedCount === 0}
              title="Archive"
              className={btn}
            >
              <IconArchiveBox />
              <span className={label}>Archive{activeSelectedCount > 1 ? ` (${activeSelectedCount})` : ''}</span>
            </button>
          )}
          {activeSelectedCount === 0 && (
            <button
              type="button"
              onClick={onUnarchiveSelected}
              disabled={archivedSelectedCount === 0}
              title="Restore"
              className={btn}
            >
              <IconRestore />
              <span className={label}>Restore{archivedSelectedCount > 1 ? ` (${archivedSelectedCount})` : ''}</span>
            </button>
          )}
          {activeSelectedCount > 0 && archivedSelectedCount > 0 && (
            <>
              <button type="button" onClick={onArchiveSelected} title="Archive" className={btn}>
                <IconArchiveBox />
                <span className={label}>Archive ({activeSelectedCount})</span>
              </button>
              <button type="button" onClick={onUnarchiveSelected} title="Restore" className={btn}>
                <IconRestore />
                <span className={label}>Restore ({archivedSelectedCount})</span>
              </button>
            </>
          )}
          <button
            type="button"
            onClick={() => setConfirmingDelete(true)}
            disabled={count === 0}
            title="Delete"
            className="inline-flex items-center gap-1.5 px-2 sm:px-2.5 py-1.5 rounded-button border border-stage-rejected text-stage-rejected text-[12px] font-medium hover:bg-stage-rejected hover:text-white transition-colors focus-visible:ring-2 focus-visible:ring-stage-rejected focus-visible:ring-offset-2 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <IconTrash />
            <span className={label}>Delete</span>
          </button>
        </>
      )}
    </div>
  )
}
