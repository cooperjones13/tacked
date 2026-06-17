function SkelLine({ w = 'w-full' }: { w?: string }) {
  return <div className={`h-3 bg-column rounded ${w}`} />
}

function SkelDot() {
  return <div className="w-1.5 h-1.5 rounded-full bg-column shrink-0 mt-1" />
}

function PanelSection({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <span className="text-[11px] font-semibold text-ink-muted uppercase tracking-widest">
        {label}
      </span>
      {children}
    </div>
  )
}

export function PositioningPanel() {
  return (
    <div className="bg-card border border-border rounded-card p-6 flex flex-col gap-5 sticky top-[65px]">
      <div className="flex items-center justify-between">
        <h2 className="text-[13px] font-semibold text-ink-muted uppercase tracking-wider">
          AI Positioning
        </h2>
        <button
          type="button"
          disabled
          title="Add a job description to enable analysis"
          className="px-3 py-1.5 rounded-button text-[12px] font-medium bg-accent/15 text-accent opacity-50 cursor-not-allowed"
        >
          Analyze
        </button>
      </div>

      <p className="text-[12px] text-ink-muted/70 leading-relaxed">
        Paste the job description, then click Analyze to get tailored positioning advice for this role.
      </p>

      <div className="w-full h-px bg-border" />

      <PanelSection label="Fit score">
        <div className="flex items-end gap-3">
          <span className="text-[28px] font-semibold text-ink-muted/30 leading-none">—</span>
          <div className="flex-1 mb-1">
            <div className="h-2 bg-column rounded-full w-full" />
          </div>
        </div>
      </PanelSection>

      <PanelSection label="Positioning summary">
        <div className="flex flex-col gap-1.5">
          <SkelLine />
          <SkelLine w="w-5/6" />
          <SkelLine w="w-4/6" />
        </div>
      </PanelSection>

      <PanelSection label="Strengths">
        <div className="flex flex-col gap-2">
          {(['w-4/5', 'w-full', 'w-3/5'] as const).map((w, i) => (
            <div key={i} className="flex items-start gap-2">
              <SkelDot />
              <SkelLine w={w} />
            </div>
          ))}
        </div>
      </PanelSection>

      <PanelSection label="Gaps">
        <div className="flex flex-col gap-2">
          {(['w-full', 'w-3/4'] as const).map((w, i) => (
            <div key={i} className="flex items-start gap-2">
              <SkelDot />
              <SkelLine w={w} />
            </div>
          ))}
        </div>
      </PanelSection>

      <PanelSection label="Keywords">
        <div className="flex gap-1.5 flex-wrap">
          {[56, 80, 48, 72, 60, 44].map((w, i) => (
            <div key={i} className="h-6 bg-column rounded-full" style={{ width: w }} />
          ))}
        </div>
      </PanelSection>

      <PanelSection label="Talking points">
        <div className="flex flex-col gap-3">
          {[['w-full', 'w-3/4'], ['w-5/6', 'w-2/3'], ['w-full', 'w-1/2']].map((lines, i) => (
            <div key={i} className="flex items-start gap-2">
              <SkelDot />
              <div className="flex flex-col gap-1 flex-1">
                {lines.map((w, j) => <SkelLine key={j} w={w} />)}
              </div>
            </div>
          ))}
        </div>
      </PanelSection>
    </div>
  )
}
