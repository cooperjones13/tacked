import { internalMutation, query } from './_generated/server'
import { v } from 'convex/values'

const questionV = v.object({ question: v.string(), guidance: v.string() })

export const listAll = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) return []
    return ctx.db
      .query('interviewPreps')
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
      .query('interviewPreps')
      .withIndex('by_application', q => q.eq('applicationId', applicationId))
      .order('desc')
      .first()
  },
})

export const markPending = internalMutation({
  args: { userId: v.string(), applicationId: v.id('applications'), model: v.string() },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query('interviewPreps')
      .withIndex('by_application', q => q.eq('applicationId', args.applicationId))
      .first()
    if (existing) {
      await ctx.db.patch(existing._id, {
        status: 'pending',
        behavioral: undefined,
        technical: undefined,
        roleSpecific: undefined,
        culture: undefined,
      })
    } else {
      await ctx.db.insert('interviewPreps', { ...args, status: 'pending' })
    }
  },
})

export const markComplete = internalMutation({
  args: {
    applicationId: v.id('applications'),
    behavioral: v.array(questionV),
    technical: v.array(questionV),
    roleSpecific: v.array(questionV),
    culture: v.array(questionV),
  },
  handler: async (ctx, { applicationId, ...prep }) => {
    const existing = await ctx.db
      .query('interviewPreps')
      .withIndex('by_application', q => q.eq('applicationId', applicationId))
      .first()
    if (existing) {
      await ctx.db.patch(existing._id, { status: 'complete', ...prep })
    }
  },
})

export const clearPending = internalMutation({
  args: { applicationId: v.id('applications') },
  handler: async (ctx, { applicationId }) => {
    const existing = await ctx.db
      .query('interviewPreps')
      .withIndex('by_application', q => q.eq('applicationId', applicationId))
      .first()
    if (existing?.status === 'pending') {
      await ctx.db.delete(existing._id)
    }
  },
})
