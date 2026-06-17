"use node"

import Anthropic from '@anthropic-ai/sdk'
import { action } from './_generated/server'
import { internal } from './_generated/api'
import { v } from 'convex/values'

const MODEL = 'claude-sonnet-4-6'

interface AnalysisResult {
  fitScore: number
  summary: string
  strengths: string[]
  gaps: string[]
  keywords: string[]
  talkingPoints: string[]
}

export const analyzeApplication = action({
  args: {
    applicationId: v.id('applications'),
    resumeId: v.id('resumes'),
  },
  handler: async (ctx, { applicationId, resumeId }): Promise<void> => {
    const [application, resume] = await Promise.all([
      ctx.runQuery(internal.applications.get, { id: applicationId }),
      ctx.runQuery(internal.resumes.get, { id: resumeId }),
    ])

    if (!application) throw new Error('Application not found')
    if (!resume) throw new Error('Resume not found')
    if (!application.jdText.trim()) throw new Error('No job description — add one before analyzing')

    const pdfUrl = await ctx.storage.getUrl(resume.storageId)
    if (!pdfUrl) throw new Error('Resume file not found in storage')

    const pdfResponse = await fetch(pdfUrl)
    if (!pdfResponse.ok) throw new Error('Failed to download resume PDF')
    const pdfBase64 = Buffer.from(await pdfResponse.arrayBuffer()).toString('base64')

    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

    const response = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 2048,
      tools: [
        {
          name: 'submit_analysis',
          description: 'Submit structured analysis of how well the candidate fits the role',
          input_schema: {
            type: 'object' as const,
            properties: {
              fitScore: {
                type: 'number',
                description: 'Overall fit score 0–100 based on skills, experience, and requirements match',
              },
              summary: {
                type: 'string',
                description: 'One concise sentence on how the candidate should angle themselves for this role',
              },
              strengths: {
                type: 'array',
                items: { type: 'string' },
                description: '3–5 specific strengths from the resume that match the job requirements',
              },
              gaps: {
                type: 'array',
                items: { type: 'string' },
                description: '2–4 gaps or areas to address or reframe when applying',
              },
              keywords: {
                type: 'array',
                items: { type: 'string' },
                description: 'Important keywords from the JD that are present in the resume',
              },
              talkingPoints: {
                type: 'array',
                items: { type: 'string' },
                description: '3–5 specific talking points the candidate can use in interviews',
              },
            },
            required: ['fitScore', 'summary', 'strengths', 'gaps', 'keywords', 'talkingPoints'],
          },
        },
      ],
      tool_choice: { type: 'tool', name: 'submit_analysis' },
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'document',
              source: { type: 'base64', media_type: 'application/pdf', data: pdfBase64 },
            },
            {
              type: 'text',
              text: `You are an expert career coach. Analyze the resume above against this job posting and provide structured positioning advice.

Role: ${application.role}
Company: ${application.company}

Job Description:
${application.jdText}`,
            },
          ],
        },
      ],
    })

    const toolUse = response.content.find(b => b.type === 'tool_use')
    if (!toolUse || toolUse.type !== 'tool_use') throw new Error('No structured analysis returned from Claude')

    const result = toolUse.input as AnalysisResult

    await ctx.runMutation(internal.analyses.create, {
      applicationId,
      resumeId,
      ...result,
      model: MODEL,
    })
  },
})
