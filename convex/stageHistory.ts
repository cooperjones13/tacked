import { query } from './_generated/server'
import { v } from 'convex/values'

export const getByApplication = query({
  args: { applicationId: v.id('applications') },
  handler: async (ctx, { applicationId }) => {
    return ctx.db
      .query('stageHistory')
      .withIndex('by_application', q => q.eq('applicationId', applicationId))
      .order('desc')
      .collect()
  },
})
