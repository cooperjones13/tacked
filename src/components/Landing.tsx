import { SignIn } from '@clerk/react'
import { STAGES } from '../types'
import { Logo } from './Logo'

const FEATURES = [
  {
    title: 'Kanban board',
    body: 'Track every application across Interested, Applied, Interview, Offer, and Rejected with drag-and-drop.',
  },
  {
    title: 'AI fit analysis',
    body: 'Upload a resume and paste a job description — get a 0–100 fit score, strengths, gaps, and talking points.',
  },
  {
    title: 'Cover letters & interview prep',
    body: 'Generate a tailored cover letter and behavioral/technical interview questions in one click.',
  },
  {
    title: 'Analytics',
    body: 'See weekly application trends and a stage-by-stage funnel of your search.',
  },
]

export function Landing() {
  return (
    <div className="min-h-screen bg-canvas flex flex-col">
      <header className="px-4 sm:px-6 py-4 flex items-center gap-2 sm:gap-3">
        <Logo className="w-5 h-5 sm:w-6 sm:h-6 shrink-0" />
        <span className="text-[22px] sm:text-[26px] text-ink tracking-tight" style={{ fontFamily: 'var(--font-display)' }}>
          Tacked
        </span>
        <div className="hidden sm:block w-px h-4 bg-border shrink-0" aria-hidden="true" />
        <span className="hidden sm:block text-[12px] text-ink-muted">job search tracker</span>
      </header>

      <main className="flex-1 grid lg:grid-cols-2 gap-10 lg:gap-16 items-center max-w-6xl mx-auto w-full px-4 sm:px-6 py-8 lg:py-12">
        <div className="flex flex-col gap-6 order-2 lg:order-1">
          <div className="flex flex-col gap-3">
            <h1
              className="text-[32px] sm:text-[40px] leading-[1.1] text-ink tracking-tight"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              Run your job search like a project, not a spreadsheet.
            </h1>
            <p className="text-[15px] text-ink-muted leading-relaxed max-w-md">
              Tacked is a Kanban board for job applications with AI that scores your fit,
              writes your cover letter, and preps you for the interview — all from your resume
              and the job description.
            </p>
          </div>

          <ul className="grid sm:grid-cols-2 gap-4">
            {FEATURES.map(f => (
              <li key={f.title} className="flex flex-col gap-1 p-4 rounded-card bg-card border border-border shadow-card">
                <span className="text-[13px] font-semibold text-ink">{f.title}</span>
                <span className="text-[12px] text-ink-muted leading-relaxed">{f.body}</span>
              </li>
            ))}
          </ul>

          <div className="flex items-center gap-2 flex-wrap" aria-hidden="true">
            {STAGES.map(stage => (
              <span
                key={stage.id}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-border text-[11px] font-medium text-ink-muted"
              >
                <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: stage.color }} />
                {stage.label}
              </span>
            ))}
          </div>
        </div>

        <div className="order-1 lg:order-2 flex justify-center lg:justify-end">
          <SignIn />
        </div>
      </main>

      <footer className="px-4 sm:px-6 py-4 text-center text-[12px] text-ink-muted">
        Built with React, Convex, Clerk, and Claude.
      </footer>
    </div>
  )
}
