import { internalQuery, mutation, query } from './_generated/server'
import { v } from 'convex/values'

async function requireUser(ctx: { auth: { getUserIdentity(): Promise<{ subject: string } | null> } }) {
  const identity = await ctx.auth.getUserIdentity()
  if (!identity) throw new Error('Unauthenticated')
  return identity.subject
}

export const get = internalQuery({
  args: { id: v.id('resumes') },
  handler: async (ctx, { id }) => ctx.db.get(id),
})

export const list = query({
  handler: async (ctx) => {
    const userId = await requireUser(ctx)
    const all = await ctx.db.query('resumes').order('desc').collect()
    return all.filter(r => !r.userId || r.userId === userId)
  },
})

export const getUrl = query({
  args: { resumeId: v.id('resumes') },
  handler: async (ctx, { resumeId }) => {
    const userId = await requireUser(ctx)
    const resume = await ctx.db.get(resumeId)
    if (!resume || (resume.userId && resume.userId !== userId)) return null
    return ctx.storage.getUrl(resume.storageId)
  },
})

export const generateUploadUrl = mutation({
  handler: async (ctx) => {
    await requireUser(ctx)
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
    const userId = await requireUser(ctx)
    return ctx.db.insert('resumes', { ...args, userId, createdAt: Date.now() })
  },
})

export const updateLabel = mutation({
  args: { id: v.id('resumes'), label: v.string() },
  handler: async (ctx, { id, label }) => {
    const userId = await requireUser(ctx)
    const resume = await ctx.db.get(id)
    if (!resume || (resume.userId && resume.userId !== userId)) throw new Error('Not found')
    await ctx.db.patch(id, { label })
  },
})

export const remove = mutation({
  args: { id: v.id('resumes') },
  handler: async (ctx, { id }) => {
    const userId = await requireUser(ctx)
    const resume = await ctx.db.get(id)
    if (!resume || (resume.userId && resume.userId !== userId)) throw new Error('Not found')
    await ctx.storage.delete(resume.storageId)
    await ctx.db.delete(id)
  },
})
