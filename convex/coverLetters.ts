import { internalMutation, query } from './_generated/server'
import { v } from 'convex/values'

export const listAll = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) return []
    return ctx.db
      .query('coverLetters')
      .withIndex('by_user', q => q.eq('userId', identity.subject))
      .take(500)
  },
})

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

// Call at start of generation — creates a pending record immediately
export const markPending = internalMutation({
  args: { userId: v.string(), applicationId: v.id('applications'), model: v.string() },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query('coverLetters')
      .withIndex('by_application', q => q.eq('applicationId', args.applicationId))
      .first()
    if (existing) {
      await ctx.db.patch(existing._id, { status: 'pending', letter: undefined })
    } else {
      await ctx.db.insert('coverLetters', { ...args, status: 'pending' })
    }
  },
})

// Call when generation succeeds
export const markComplete = internalMutation({
  args: { applicationId: v.id('applications'), letter: v.string() },
  handler: async (ctx, { applicationId, letter }) => {
    const existing = await ctx.db
      .query('coverLetters')
      .withIndex('by_application', q => q.eq('applicationId', applicationId))
      .first()
    if (existing) {
      await ctx.db.patch(existing._id, { status: 'complete', letter })
    }
  },
})

// Call when generation fails — delete so user can try again
export const clearPending = internalMutation({
  args: { applicationId: v.id('applications') },
  handler: async (ctx, { applicationId }) => {
    const existing = await ctx.db
      .query('coverLetters')
      .withIndex('by_application', q => q.eq('applicationId', applicationId))
      .first()
    if (existing?.status === 'pending') {
      await ctx.db.delete(existing._id)
    }
  },
})
