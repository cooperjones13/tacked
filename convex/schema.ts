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
    userId: v.optional(v.string()),
    company: v.string(),
    role: v.string(),
    location: v.string(),
    salary: v.string(),
    jobUrl: v.string(),
    jdText: v.string(),
    stage,
    appliedDate: v.union(v.string(), v.null()),
    notes: v.string(),
    archived: v.optional(v.boolean()),
    extracting: v.optional(v.boolean()),
    extractionFailed: v.optional(v.boolean()),
  }).index('by_user', ['userId']),

  resumes: defineTable({
    userId: v.optional(v.string()),
    storageId: v.id('_storage'),
    filename: v.string(),
    label: v.string(),
    createdAt: v.number(),
  }).index('by_user', ['userId']),

  analyses: defineTable({
    userId: v.optional(v.string()),
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

  coverLetters: defineTable({
    userId: v.string(),
    applicationId: v.id('applications'),
    status: v.optional(v.union(v.literal('pending'), v.literal('complete'))),
    letter: v.optional(v.string()),
    model: v.string(),
  })
    .index('by_application', ['applicationId'])
    .index('by_user', ['userId']),

  interviewPreps: defineTable({
    userId: v.string(),
    applicationId: v.id('applications'),
    status: v.optional(v.union(v.literal('pending'), v.literal('complete'))),
    behavioral: v.optional(v.array(v.object({ question: v.string(), guidance: v.string() }))),
    technical: v.optional(v.array(v.object({ question: v.string(), guidance: v.string() }))),
    roleSpecific: v.optional(v.array(v.object({ question: v.string(), guidance: v.string() }))),
    culture: v.optional(v.array(v.object({ question: v.string(), guidance: v.string() }))),
    model: v.string(),
  })
    .index('by_application', ['applicationId'])
    .index('by_user', ['userId']),

  stageHistory: defineTable({
    userId: v.optional(v.string()),
    applicationId: v.id('applications'),
    fromStage: stage,
    toStage: stage,
    movedAt: v.number(),
  }).index('by_application', ['applicationId']),
})
