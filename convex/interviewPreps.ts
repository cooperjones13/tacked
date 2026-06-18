import { internalMutation, query } from './_generated/server'
import { v } from 'convex/values'

const questionV = v.object({ question: v.string(), guidance: v.string() })

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

export const upsert = internalMutation({
  args: {
    userId: v.string(),
    applicationId: v.id('applications'),
    behavioral: v.array(questionV),
    technical: v.array(questionV),
    roleSpecific: v.array(questionV),
    culture: v.array(questionV),
    model: v.string(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query('interviewPreps')
      .withIndex('by_application', q => q.eq('applicationId', args.applicationId))
      .first()
    if (existing) {
      await ctx.db.patch(existing._id, {
        behavioral: args.behavioral,
        technical: args.technical,
        roleSpecific: args.roleSpecific,
        culture: args.culture,
        model: args.model,
      })
    } else {
      await ctx.db.insert('interviewPreps', args)
    }
  },
})
