import { internalQuery, mutation, query } from './_generated/server'
import { v } from 'convex/values'

const stageV = v.union(
  v.literal('interested'),
  v.literal('applied'),
  v.literal('interview'),
  v.literal('offer'),
  v.literal('rejected'),
)

async function requireUser(ctx: { auth: { getUserIdentity(): Promise<{ subject: string } | null> } }) {
  const identity = await ctx.auth.getUserIdentity()
  if (!identity) throw new Error('Unauthenticated')
  return identity.subject
}

export const get = internalQuery({
  args: { id: v.id('applications') },
  handler: async (ctx, { id }) => ctx.db.get(id),
})

export const list = query({
  handler: async (ctx) => {
    const userId = await requireUser(ctx)
    const all = await ctx.db.query('applications').collect()
    return all.filter(a => !a.userId || a.userId === userId)
  },
})

export const create = mutation({
  args: {
    company: v.string(),
    role: v.string(),
    location: v.string(),
    salary: v.string(),
    jobUrl: v.string(),
    jdText: v.string(),
    stage: stageV,
    appliedDate: v.union(v.string(), v.null()),
    notes: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await requireUser(ctx)
    return ctx.db.insert('applications', { ...args, userId })
  },
})

export const update = mutation({
  args: {
    id: v.id('applications'),
    company: v.optional(v.string()),
    role: v.optional(v.string()),
    location: v.optional(v.string()),
    salary: v.optional(v.string()),
    jobUrl: v.optional(v.string()),
    jdText: v.optional(v.string()),
    stage: v.optional(stageV),
    appliedDate: v.optional(v.union(v.string(), v.null())),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, { id, ...patch }) => {
    const userId = await requireUser(ctx)
    const app = await ctx.db.get(id)
    if (!app || (app.userId && app.userId !== userId)) throw new Error('Not found')

    if (patch.stage !== undefined && patch.stage !== app.stage) {
      await ctx.db.insert('stageHistory', {
        userId,
        applicationId: id,
        fromStage: app.stage,
        toStage: patch.stage,
        movedAt: Date.now(),
      })
    }

    await ctx.db.patch(id, patch)
  },
})

export const remove = mutation({
  args: { id: v.id('applications') },
  handler: async (ctx, { id }) => {
    const userId = await requireUser(ctx)
    const app = await ctx.db.get(id)
    if (!app || (app.userId && app.userId !== userId)) throw new Error('Not found')
    await ctx.db.delete(id)
  },
})
