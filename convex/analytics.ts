import { query } from './_generated/server'

async function requireUser(ctx: { auth: { getUserIdentity(): Promise<{ subject: string } | null> } }) {
  const identity = await ctx.auth.getUserIdentity()
  if (!identity) throw new Error('Unauthenticated')
  return identity.subject
}

export const getPipelineStats = query({
  args: {},
  handler: async (ctx) => {
    const userId = await requireUser(ctx)

    const [applications, history] = await Promise.all([
      ctx.db.query('applications').collect(),
      ctx.db.query('stageHistory').collect(),
    ])

    const myApps = applications.filter(a => a.userId === userId)
    const myHistory = history.filter(h => h.userId === userId)

    // Stage counts (current state)
    const stageCounts: Record<string, number> = {}
    for (const app of myApps) {
      stageCounts[app.stage] = (stageCounts[app.stage] ?? 0) + 1
    }

    // Avg time per stage (days) from history
    // For each app, calculate time spent in each stage before moving out
    const stageTimeMs: Record<string, number[]> = {}
    const appHistoryMap: Record<string, typeof myHistory> = {}
    for (const entry of myHistory) {
      const key = entry.applicationId as string
      if (!appHistoryMap[key]) appHistoryMap[key] = []
      appHistoryMap[key].push(entry)
    }

    for (const appHistory of Object.values(appHistoryMap)) {
      const sorted = [...appHistory].sort((a, b) => a.movedAt - b.movedAt)
      for (let i = 0; i < sorted.length; i++) {
        const entry = sorted[i]
        const nextEntry = sorted[i + 1]
        if (nextEntry) {
          const duration = nextEntry.movedAt - entry.movedAt
          if (!stageTimeMs[entry.toStage]) stageTimeMs[entry.toStage] = []
          stageTimeMs[entry.toStage].push(duration)
        }
      }
    }

    const avgDaysPerStage: Record<string, number> = {}
    for (const [stage, durations] of Object.entries(stageTimeMs)) {
      const avg = durations.reduce((a, b) => a + b, 0) / durations.length
      avgDaysPerStage[stage] = Math.round(avg / (1000 * 60 * 60 * 24) * 10) / 10
    }

    // Applications submitted per week (last 8 weeks, applied date only)
    const now = Date.now()
    const weekMs = 7 * 24 * 60 * 60 * 1000
    const weeks: { label: string; count: number }[] = []
    for (let i = 7; i >= 0; i--) {
      const start = now - (i + 1) * weekMs
      const end = now - i * weekMs
      const count = myApps.filter(a => {
        if (!a.appliedDate) return false
        const ts = new Date(a.appliedDate).getTime()
        return ts >= start && ts < end
      }).length
      const date = new Date(start + weekMs / 2)
      const label = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      weeks.push({ label, count })
    }

    // Response rate: applied → interview or beyond
    const applied = myApps.filter(a =>
      ['applied', 'phone-screen', 'interview', 'offer', 'rejected'].includes(a.stage)
    ).length
    const reachedInterview = myApps.filter(a =>
      ['interview', 'offer'].includes(a.stage)
    ).length
    const offers = myApps.filter(a => a.stage === 'offer').length

    return {
      total: myApps.length,
      stageCounts,
      avgDaysPerStage,
      weeks,
      applied,
      reachedInterview,
      offers,
    }
  },
})
