import { internalMutation, query } from './_generated/server'
import { v } from 'convex/values'

async function requireUser(ctx: { auth: { getUserIdentity(): Promise<{ subject: string } | null> } }) {
  const identity = await ctx.auth.getUserIdentity()
  if (!identity) throw new Error('Unauthenticated')
  return identity.subject
}

// Most recent fit score per application — used to decorate board cards
export const listFitScores = query({
  handler: async (ctx) => {
    const userId = await requireUser(ctx)
    const all = await ctx.db.query('analyses').order('desc').collect()
    const userAll = all.filter(a => a.userId === userId)
    const seen = new Set<string>()
    return userAll
      .filter(a => {
        const key = a.applicationId as string
        if (seen.has(key)) return false
        seen.add(key)
        return true
      })
      .map(a => ({ applicationId: a.applicationId as string, fitScore: a.fitScore }))
  },
})

export const getByApplication = query({
  args: { applicationId: v.id('applications') },
  handler: async (ctx, { applicationId }) => {
    await requireUser(ctx)
    return ctx.db
      .query('analyses')
      .withIndex('by_application', q => q.eq('applicationId', applicationId))
      .order('desc')
      .first()
  },
})

export const create = internalMutation({
  args: {
    userId: v.string(),
    applicationId: v.id('applications'),
    resumeId: v.id('resumes'),
    fitScore: v.number(),
    summary: v.string(),
    strengths: v.array(v.string()),
    gaps: v.array(v.string()),
    keywords: v.array(v.string()),
    talkingPoints: v.array(v.string()),
    model: v.string(),
  },
  handler: async (ctx, args) => {
    return ctx.db.insert('analyses', args)
  },
})
