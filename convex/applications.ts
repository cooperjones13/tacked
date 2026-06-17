import { mutation, query } from './_generated/server'
import { v } from 'convex/values'

const stageV = v.union(
  v.literal('interested'),
  v.literal('applied'),
  v.literal('interview'),
  v.literal('offer'),
  v.literal('rejected'),
)

export const list = query({
  handler: async (ctx) => {
    return ctx.db.query('applications').collect()
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
    return ctx.db.insert('applications', args)
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
    await ctx.db.patch(id, patch)
  },
})

export const remove = mutation({
  args: { id: v.id('applications') },
  handler: async (ctx, { id }) => {
    await ctx.db.delete(id)
  },
})
