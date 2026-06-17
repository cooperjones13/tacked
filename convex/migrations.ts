import { mutation } from './_generated/server'

// Run once from the Convex dashboard to claim all pre-auth records
// for the currently authenticated user.
export const claimOrphanedData = mutation({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) throw new Error('Unauthenticated')
    const userId = identity.subject

    const [apps, resumes, analyses, history] = await Promise.all([
      ctx.db.query('applications').collect(),
      ctx.db.query('resumes').collect(),
      ctx.db.query('analyses').collect(),
      ctx.db.query('stageHistory').collect(),
    ])

    const patches = [
      ...apps.filter(d => !d.userId).map(d => ctx.db.patch(d._id, { userId })),
      ...resumes.filter(d => !d.userId).map(d => ctx.db.patch(d._id, { userId })),
      ...analyses.filter(d => !d.userId).map(d => ctx.db.patch(d._id, { userId })),
      ...history.filter(d => !d.userId).map(d => ctx.db.patch(d._id, { userId })),
    ]

    await Promise.all(patches)
    return { claimed: patches.length }
  },
})
