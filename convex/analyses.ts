import { internalMutation, query } from './_generated/server'
import { v } from 'convex/values'

export const getByApplication = query({
  args: { applicationId: v.id('applications') },
  handler: async (ctx, { applicationId }) => {
    return ctx.db
      .query('analyses')
      .withIndex('by_application', q => q.eq('applicationId', applicationId))
      .order('desc')
      .first()
  },
})

export const create = internalMutation({
  args: {
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
