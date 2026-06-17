import type { Application } from '../types'
import { STAGES } from '../types'
import { PositioningPanel } from './PositioningPanel'

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-[11px] font-semibold text-ink-muted uppercase tracking-widest">
        {label}
      </span>
      <span className="text-[14px] text-ink">{children}</span>
    </div>
  )
}

interface Props {
  application: Application
  onBack: () => void
}

export function ApplicationDetail({ application, onBack }: Props) {
  const stage = STAGES.find(s => s.id === application.stage) ?? STAGES[0]

  const formattedDate = application.appliedDate
    ? new Date(application.appliedDate).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : null

  return (
    <div className="min-h-screen bg-canvas flex flex-col">
      <header className="sticky top-0 z-10 bg-canvas border-b border-border px-6 py-4 flex items-center gap-4 shrink-0">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-[13px] text-ink-muted hover:text-ink transition-colors focus-visible:ring-2 focus-visible:ring-accent rounded-button px-2 py-1 -ml-2"
        >
          ← Board
        </button>
        <div className="w-px h-5 bg-border shrink-0" />
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <h1 className="text-[17px] font-semibold text-ink truncate">
            {application.company}
          </h1>
          <span className="text-ink-muted shrink-0">·</span>
          <span className="text-[15px] text-ink-muted truncate">{application.role}</span>
        </div>
        <span
          className="shrink-0 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[12px] font-medium"
          style={{
            backgroundColor: `color-mix(in srgb, ${stage.color} 15%, transparent)`,
            color: stage.color,
          }}
        >
          <span
            className="w-1.5 h-1.5 rounded-full shrink-0"
            style={{ backgroundColor: stage.color }}
          />
          {stage.label}
        </span>
      </header>

      <main className="flex-1 p-6">
        <div className="max-w-5xl mx-auto grid grid-cols-[1fr_360px] gap-6 items-start">
          <div className="flex flex-col gap-4">
            <section className="bg-card border border-border rounded-card p-6">
              <h2 className="text-[11px] font-semibold text-ink-muted uppercase tracking-widest mb-5">
                Overview
              </h2>
              <div className="grid grid-cols-2 gap-x-8 gap-y-5">
                <Field label="Company">{application.company}</Field>
                <Field label="Role">{application.role}</Field>
                {application.location && (
                  <Field label="Location">{application.location}</Field>
                )}
                {application.salary && (
                  <Field label="Salary">{application.salary}</Field>
                )}
                {formattedDate && (
                  <Field label="Applied">{formattedDate}</Field>
                )}
                {application.jobUrl && (
                  <Field label="Job posting">
                    <a
                      href={application.jobUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-accent hover:underline"
                    >
                      View posting ↗
                    </a>
                  </Field>
                )}
              </div>
            </section>

            {application.notes && (
              <section className="bg-card border border-border rounded-card p-6">
                <h2 className="text-[11px] font-semibold text-ink-muted uppercase tracking-widest mb-3">
                  Notes
                </h2>
                <p className="text-[14px] text-ink leading-relaxed whitespace-pre-wrap">
                  {application.notes}
                </p>
              </section>
            )}

            <section className="bg-card border border-border rounded-card p-6">
              <h2 className="text-[11px] font-semibold text-ink-muted uppercase tracking-widest mb-3">
                Job description
              </h2>
              {application.jdText ? (
                <p className="text-[14px] text-ink leading-relaxed whitespace-pre-wrap">
                  {application.jdText}
                </p>
              ) : (
                <p className="text-[13px] text-ink-muted/60">
                  No job description added. Paste the JD here to enable AI analysis.
                </p>
              )}
            </section>
          </div>

          <PositioningPanel />
        </div>
      </main>
    </div>
  )
}
