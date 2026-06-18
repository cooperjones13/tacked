import { useEffect, useRef } from 'react'
import { useQuery } from 'convex/react'
import { api } from '../../convex/_generated/api'
import { STAGES } from '../types'

interface Props {
  onClose: () => void
}

function StatCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="bg-card border border-border rounded-card p-5">
      <p className="text-[11px] font-semibold text-ink-muted uppercase tracking-widest mb-1">{label}</p>
      <p className="text-[32px] font-bold text-ink leading-none">{value}</p>
      {sub && <p className="text-[12px] text-ink-muted mt-1">{sub}</p>}
    </div>
  )
}

function Bar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = max > 0 ? (value / max) * 100 : 0
  return (
    <div className="h-2 bg-column rounded-full overflow-hidden flex-1">
      <div
        className="h-full rounded-full transition-all duration-500"
        style={{ width: `${pct}%`, backgroundColor: color }}
      />
    </div>
  )
}

export function AnalyticsDashboard({ onClose }: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const onCloseRef = useRef(onClose)
  onCloseRef.current = onClose
  const stats = useQuery(api.analytics.getPipelineStats)

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    dialog.showModal()
    function handleCancel(e: Event) {
      e.preventDefault()
      onCloseRef.current()
    }
    dialog.addEventListener('cancel', handleCancel)
    return () => dialog.removeEventListener('cancel', handleCancel)
  }, [])

  function handleBackdropClick(e: React.MouseEvent<HTMLDialogElement>) {
    const rect = e.currentTarget.getBoundingClientRect()
    const outside =
      e.clientX < rect.left || e.clientX > rect.right ||
      e.clientY < rect.top || e.clientY > rect.bottom
    if (outside) onClose()
  }

  const maxStageCount = stats ? Math.max(...Object.values(stats.stageCounts), 1) : 1
  const maxWeekCount = stats ? Math.max(...stats.weeks.map(w => w.count), 1) : 1

  const responseRate = stats && stats.applied > 0
    ? Math.round((stats.reachedInterview / stats.applied) * 100)
    : null

  const offerRate = stats && stats.applied > 0
    ? Math.round((stats.offers / stats.applied) * 100)
    : null

  return (
    <dialog
      ref={dialogRef}
      onClick={handleBackdropClick}
      aria-modal="true"
      aria-labelledby="analytics-title"
      className="w-full max-w-3xl max-h-[90vh] bg-canvas rounded-card border border-border shadow-card-drag flex flex-col outline-none"
    >
      <div onClick={e => e.stopPropagation()} className="flex flex-col flex-1 min-h-0">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
          <h2
            id="analytics-title"
            className="text-[18px] text-ink"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            Pipeline analytics
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="w-8 h-8 flex items-center justify-center rounded-button text-ink-muted hover:text-ink hover:bg-column transition-colors focus-visible:ring-2 focus-visible:ring-accent"
          >
            ✕
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6">
          {!stats ? (
            <p className="text-[13px] text-ink-muted text-center py-12">Loading…</p>
          ) : (
            <>
              {/* Summary stats */}
              <div className="grid grid-cols-4 gap-4">
                <StatCard label="Total applications" value={stats.total} />
                <StatCard label="Applied" value={stats.applied} />
                <StatCard
                  label="Interview rate"
                  value={responseRate !== null ? `${responseRate}%` : '—'}
                  sub={responseRate !== null ? `${stats.reachedInterview} reached interview` : 'No data yet'}
                />
                <StatCard
                  label="Offer rate"
                  value={offerRate !== null ? `${offerRate}%` : '—'}
                  sub={offerRate !== null ? `${stats.offers} offer${stats.offers !== 1 ? 's' : ''}` : 'No data yet'}
                />
              </div>

              {/* Stage funnel */}
              <section className="bg-card border border-border rounded-card p-5">
                <h3 className="text-[11px] font-semibold text-ink-muted uppercase tracking-widest mb-4">
                  Current pipeline
                </h3>
                <div className="flex flex-col gap-3">
                  {STAGES.map(stage => {
                    const count = stats.stageCounts[stage.id] ?? 0
                    const avgDays = stats.avgDaysPerStage[stage.id]
                    return (
                      <div key={stage.id} className="flex items-center gap-3">
                        <div className="flex items-center gap-2 w-28 shrink-0">
                          <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: stage.color }} />
                          <span className="text-[13px] text-ink-muted truncate">{stage.label}</span>
                        </div>
                        <Bar value={count} max={maxStageCount} color={stage.color} />
                        <span className="text-[13px] font-medium text-ink w-4 text-right shrink-0">{count}</span>
                        {avgDays !== undefined ? (
                          <span className="text-[11px] text-ink-muted w-20 text-right shrink-0">
                            avg {avgDays}d
                          </span>
                        ) : (
                          <span className="w-20 shrink-0" />
                        )}
                      </div>
                    )
                  })}
                </div>
              </section>

              {/* Weekly timeline */}
              <section className="bg-card border border-border rounded-card p-5">
                <h3 className="text-[11px] font-semibold text-ink-muted uppercase tracking-widest mb-4">
                  Applications added — last 8 weeks
                </h3>
                <div className="flex items-end gap-2 h-28">
                  {stats.weeks.map((week, i) => {
                    const pct = maxWeekCount > 0 ? (week.count / maxWeekCount) * 100 : 0
                    return (
                      <div key={i} className="flex-1 flex flex-col items-center gap-1.5">
                        <span className="text-[11px] text-ink-muted tabular-nums">
                          {week.count > 0 ? week.count : ''}
                        </span>
                        <div className="w-full flex items-end" style={{ height: '72px' }}>
                          <div
                            className="w-full rounded-t-sm transition-all duration-500"
                            style={{
                              height: `${Math.max(pct, week.count > 0 ? 4 : 0)}%`,
                              backgroundColor: 'var(--color-accent)',
                              opacity: pct > 0 ? 0.7 + (pct / 100) * 0.3 : 0.15,
                            }}
                          />
                        </div>
                        <span className="text-[10px] text-ink-muted text-center leading-tight">
                          {week.label}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </section>
            </>
          )}
        </div>
      </div>
    </dialog>
  )
}
