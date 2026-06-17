import { defineSchema, defineTable } from 'convex/server'
import { v } from 'convex/values'

const stage = v.union(
  v.literal('interested'),
  v.literal('applied'),
  v.literal('interview'),
  v.literal('offer'),
  v.literal('rejected'),
)

export default defineSchema({
  applications: defineTable({
    company: v.string(),
    role: v.string(),
    location: v.string(),
    salary: v.string(),
    jobUrl: v.string(),
    jdText: v.string(),
    stage,
    appliedDate: v.union(v.string(), v.null()),
    notes: v.string(),
  }),

  resumes: defineTable({
    storageId: v.id('_storage'),
    label: v.string(),
    createdAt: v.number(),
  }),

  analyses: defineTable({
    applicationId: v.id('applications'),
    resumeId: v.id('resumes'),
    fitScore: v.number(),
    summary: v.string(),
    strengths: v.array(v.string()),
    gaps: v.array(v.string()),
    keywords: v.array(v.string()),
    talkingPoints: v.array(v.string()),
    model: v.string(),
  }).index('by_application', ['applicationId']),
})
