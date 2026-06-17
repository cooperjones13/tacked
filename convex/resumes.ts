import { internalQuery, mutation, query } from './_generated/server'
import { v } from 'convex/values'

export const get = internalQuery({
  args: { id: v.id('resumes') },
  handler: async (ctx, { id }) => ctx.db.get(id),
})

export const list = query({
  handler: async (ctx) => {
    return ctx.db.query('resumes').order('desc').collect()
  },
})

export const generateUploadUrl = mutation({
  handler: async (ctx) => {
    return ctx.storage.generateUploadUrl()
  },
})

export const create = mutation({
  args: {
    storageId: v.id('_storage'),
    filename: v.string(),
    label: v.string(),
  },
  handler: async (ctx, args) => {
    return ctx.db.insert('resumes', { ...args, createdAt: Date.now() })
  },
})

export const updateLabel = mutation({
  args: { id: v.id('resumes'), label: v.string() },
  handler: async (ctx, { id, label }) => {
    await ctx.db.patch(id, { label })
  },
})

export const remove = mutation({
  args: { id: v.id('resumes') },
  handler: async (ctx, { id }) => {
    const resume = await ctx.db.get(id)
    if (!resume) return
    await ctx.storage.delete(resume.storageId)
    await ctx.db.delete(id)
  },
})
