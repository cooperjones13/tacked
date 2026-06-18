import { internalMutation, query } from './_generated/server'
import { v } from 'convex/values'

export const getByApplication = query({
  args: { applicationId: v.id('applications') },
  handler: async (ctx, { applicationId }) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) return null
    return ctx.db
      .query('coverLetters')
      .withIndex('by_application', q => q.eq('applicationId', applicationId))
      .order('desc')
      .first()
  },
})

export const upsert = internalMutation({
  args: {
    userId: v.string(),
    applicationId: v.id('applications'),
    letter: v.string(),
    model: v.string(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query('coverLetters')
      .withIndex('by_application', q => q.eq('applicationId', args.applicationId))
      .first()
    if (existing) {
      await ctx.db.patch(existing._id, { letter: args.letter, model: args.model })
    } else {
      await ctx.db.insert('coverLetters', args)
    }
  },
})
