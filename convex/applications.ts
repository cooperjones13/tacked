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
    return all.filter(a => a.userId === userId)
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
    extracting: v.optional(v.boolean()),
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
    archived: v.optional(v.boolean()),
    extracting: v.optional(v.boolean()),
    extractionFailed: v.optional(v.boolean()),
    clientToday: v.optional(v.string()),
  },
  handler: async (ctx, { id, clientToday, ...patch }) => {
    const userId = await requireUser(ctx)
    const app = await ctx.db.get(id)
    if (!app || app.userId !== userId) throw new Error('Not found')

    if (patch.stage !== undefined && patch.stage !== app.stage) {
      await ctx.db.insert('stageHistory', {
        userId,
        applicationId: id,
        fromStage: app.stage,
        toStage: patch.stage,
        movedAt: Date.now(),
      })
    }

    // Auto-fill applied date when first moved to 'applied'. Uses the
    // client's local calendar date (clientToday) when provided — the server
    // has no notion of the user's timezone, so falling back to its own
    // clock here would silently pick the wrong day near midnight.
    const autoDate =
      patch.stage === 'applied' && !app.appliedDate && patch.appliedDate === undefined
        ? { appliedDate: clientToday ?? new Date().toISOString().split('T')[0] }
        : {}

    await ctx.db.patch(id, { ...patch, ...autoDate })
  },
})

export const remove = mutation({
  args: { id: v.id('applications') },
  handler: async (ctx, { id }) => {
    const userId = await requireUser(ctx)
    const app = await ctx.db.get(id)
    if (!app || app.userId !== userId) throw new Error('Not found')
    await ctx.db.delete(id)
  },
})

export const removeMany = mutation({
  args: { ids: v.array(v.id('applications')) },
  handler: async (ctx, { ids }) => {
    const userId = await requireUser(ctx)
    for (const id of ids) {
      const app = await ctx.db.get(id)
      if (app && app.userId === userId) await ctx.db.delete(id)
    }
  },
})

export const archiveMany = mutation({
  args: { ids: v.array(v.id('applications')), archived: v.boolean() },
  handler: async (ctx, { ids, archived }) => {
    const userId = await requireUser(ctx)
    for (const id of ids) {
      const app = await ctx.db.get(id)
      if (app && app.userId === userId) await ctx.db.patch(id, { archived })
    }
  },
})
