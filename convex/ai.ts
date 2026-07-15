"use node"

import Anthropic from '@anthropic-ai/sdk'
import { action } from './_generated/server'
import { api, internal } from './_generated/api'
// coverLetters and interviewPreps are persisted via internal mutations
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
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) throw new Error('Unauthenticated')
    const userId = identity.subject

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
                description: 'One concise sentence on how the candidate should angle themselves for this role. You may use **bold** to emphasise a key skill or phrase.',
              },
              strengths: {
                type: 'array',
                items: { type: 'string' },
                description: '3–5 specific strengths from the resume that match the job requirements. Use **bold** to highlight the specific skill or technology being called out.',
              },
              gaps: {
                type: 'array',
                items: { type: 'string' },
                description: '2–4 gaps or areas to address or reframe when applying. Use **bold** for the specific gap.',
              },
              keywords: {
                type: 'array',
                items: { type: 'string' },
                description: 'Important keywords from the JD that are present in the resume. Plain text only.',
              },
              talkingPoints: {
                type: 'array',
                items: { type: 'string' },
                description: '3–5 specific talking points the candidate can use in interviews. Use **bold** for key phrases the candidate should emphasise when speaking.',
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
      userId,
      applicationId,
      resumeId,
      ...result,
      model: MODEL,
    })
  },
})

interface ExtractedJob {
  company: string
  role: string
  location: string
  salary: string
  jdText: string
}

function stripHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s{2,}/g, ' ')
    .trim()
}

// Most job boards render enough of the posting server-side for a plain fetch
// to work, so we try that first — it's usually well under a second. Jina's
// headless-browser reader handles JS-only pages but can take 10s+, so it's
// only used as a fallback, and only for a bounded amount of time.
async function fetchPageText(url: string): Promise<string> {
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36',
        Accept: 'text/html,application/xhtml+xml',
      },
    })
    if (res.ok) {
      const text = stripHtml(await res.text())
      if (text.length > 500) return text.slice(0, 60000)
    }
  } catch {
    // fall through to Jina
  }

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 12000)
  try {
    const jinaRes = await fetch(`https://r.jina.ai/${url}`, {
      headers: { Accept: 'text/plain', 'X-Return-Format': 'text' },
      signal: controller.signal,
    })
    if (!jinaRes.ok) throw new Error('Jina failed')
    return (await jinaRes.text()).slice(0, 60000)
  } finally {
    clearTimeout(timeout)
  }
}

// Fills in an already-created (placeholder) application in the background —
// the client creates the application immediately with `extracting: true` and
// closes its modal right away, then this fills in the real fields once the
// scrape + extraction finishes.
export const extractJobIntoApplication = action({
  args: { applicationId: v.id('applications'), url: v.string() },
  handler: async (ctx, { applicationId, url }): Promise<void> => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) throw new Error('Unauthenticated')

    const application = await ctx.runQuery(internal.applications.get, { id: applicationId })
    if (!application || application.userId !== identity.subject) {
      throw new Error('Application not found')
    }

    try {
      const text = await fetchPageText(url)
      const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

      const response = await anthropic.messages.create({
        model: 'claude-haiku-4-5',
        max_tokens: 4096,
        tools: [
          {
            name: 'extract_job',
            description: 'Extract structured job information from a job posting page',
            input_schema: {
              type: 'object' as const,
              properties: {
                company: { type: 'string', description: 'Company name' },
                role: { type: 'string', description: 'Job title / role' },
                location: { type: 'string', description: 'Location or "Remote"' },
                salary: { type: 'string', description: 'Salary, formatted as "$XXXk–$XXXk" for ranges, or a short label like "Negotiable", "Competitive", or "DOE" for vague descriptions. Never more than 5 words. Empty string if not mentioned.' },
                jdText: { type: 'string', description: 'The COMPLETE job description text verbatim — all responsibilities, requirements, qualifications, and about sections. Do not summarize or shorten. This is the most important field.' },
              },
              required: ['company', 'role', 'location', 'salary', 'jdText'],
            },
          },
        ],
        tool_choice: { type: 'tool', name: 'extract_job' },
        messages: [
          {
            role: 'user',
            content: `Extract the job posting details from this page. For jdText, copy the COMPLETE job description verbatim — every responsibility, requirement, and qualification. Do not summarize.\n\nPage content:\n${text}`,
          },
        ],
      })

      const toolUse = response.content.find(b => b.type === 'tool_use')
      if (!toolUse || toolUse.type !== 'tool_use') throw new Error('Could not extract job info from that page')
      const job = toolUse.input as ExtractedJob

      await ctx.runMutation(api.applications.update, {
        id: applicationId,
        company: job.company,
        role: job.role,
        location: job.location,
        salary: job.salary,
        jdText: job.jdText,
        extracting: false,
      })
    } catch (e) {
      await ctx.runMutation(api.applications.update, {
        id: applicationId,
        extracting: false,
        extractionFailed: true,
      })
      throw e
    }
  },
})

interface InterviewQuestion {
  question: string
  guidance: string
}

interface InterviewPrep {
  behavioral: InterviewQuestion[]
  technical: InterviewQuestion[]
  roleSpecific: InterviewQuestion[]
  culture: InterviewQuestion[]
}

export const generateInterviewPrep = action({
  args: {
    applicationId: v.id('applications'),
    resumeId: v.id('resumes'),
  },
  handler: async (ctx, { applicationId, resumeId }): Promise<void> => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) throw new Error('Unauthenticated')
    const userId = identity.subject

    const [application, resume] = await Promise.all([
      ctx.runQuery(internal.applications.get, { id: applicationId }),
      ctx.runQuery(internal.resumes.get, { id: resumeId }),
    ])

    if (!application) throw new Error('Application not found')
    if (!resume) throw new Error('Resume not found')
    if (!application.jdText.trim()) throw new Error('Add a job description before generating interview prep')

    const pdfUrl = await ctx.storage.getUrl(resume.storageId)
    if (!pdfUrl) throw new Error('Resume file not found')

    const pdfBase64 = Buffer.from(
      await (await fetch(pdfUrl)).arrayBuffer()
    ).toString('base64')

    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

    // Write pending status immediately so the UI shows "Generating…" even if user closes the modal
    await ctx.runMutation(internal.interviewPreps.markPending, { userId, applicationId, model: MODEL })

    let response
    try {
      response = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 3000,
      tools: [
        {
          name: 'submit_interview_prep',
          description: 'Submit structured interview preparation questions and guidance',
          input_schema: {
            type: 'object' as const,
            properties: {
              behavioral: {
                type: 'array',
                description: '3 behavioral questions (STAR format), with guidance drawing from specific resume experiences',
                items: {
                  type: 'object',
                  properties: {
                    question: { type: 'string' },
                    guidance: { type: 'string', description: 'Specific talking points from the resume that answer this question. Use **bold** to highlight the most important phrase or experience to lead with.' },
                  },
                  required: ['question', 'guidance'],
                },
              },
              technical: {
                type: 'array',
                description: '3 technical questions based on skills in the JD, with guidance on how to answer given the resume',
                items: {
                  type: 'object',
                  properties: {
                    question: { type: 'string' },
                    guidance: { type: 'string' },
                  },
                  required: ['question', 'guidance'],
                },
              },
              roleSpecific: {
                type: 'array',
                description: '3 questions specific to this role and company, with guidance',
                items: {
                  type: 'object',
                  properties: {
                    question: { type: 'string' },
                    guidance: { type: 'string' },
                  },
                  required: ['question', 'guidance'],
                },
              },
              culture: {
                type: 'array',
                description: '2 culture/values questions likely for this company, with guidance',
                items: {
                  type: 'object',
                  properties: {
                    question: { type: 'string' },
                    guidance: { type: 'string' },
                  },
                  required: ['question', 'guidance'],
                },
              },
            },
            required: ['behavioral', 'technical', 'roleSpecific', 'culture'],
          },
        },
      ],
      tool_choice: { type: 'tool', name: 'submit_interview_prep' },
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
              text: `Generate targeted interview preparation for this candidate applying to the role below.

Role: ${application.role}
Company: ${application.company}

Job Description:
${application.jdText}

For each question, give concrete guidance that references specific projects, skills, or experiences from the resume — not generic advice. Use **bold** to highlight the single most important phrase or experience to lead with in each answer.`,
            },
          ],
        },
      ],
    })
    } catch (e) {
      await ctx.runMutation(internal.interviewPreps.clearPending, { applicationId })
      throw e
    }

    const toolUse = response.content.find(b => b.type === 'tool_use')
    if (!toolUse || toolUse.type !== 'tool_use') {
      await ctx.runMutation(internal.interviewPreps.clearPending, { applicationId })
      throw new Error('No interview prep returned')
    }
    const result = toolUse.input as InterviewPrep

    await ctx.runMutation(internal.interviewPreps.markComplete, {
      applicationId,
      behavioral: result.behavioral,
      technical: result.technical,
      roleSpecific: result.roleSpecific,
      culture: result.culture,
    })
  },
})

export const generateCoverLetter = action({
  args: {
    applicationId: v.id('applications'),
    resumeId: v.id('resumes'),
  },
  handler: async (ctx, { applicationId, resumeId }): Promise<void> => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) throw new Error('Unauthenticated')
    const userId = identity.subject

    const [application, resume] = await Promise.all([
      ctx.runQuery(internal.applications.get, { id: applicationId }),
      ctx.runQuery(internal.resumes.get, { id: resumeId }),
    ])

    if (!application) throw new Error('Application not found')
    if (!resume) throw new Error('Resume not found')
    if (!application.jdText.trim()) throw new Error('Add a job description before generating a cover letter')

    const pdfUrl = await ctx.storage.getUrl(resume.storageId)
    if (!pdfUrl) throw new Error('Resume file not found')

    const pdfBase64 = Buffer.from(
      await (await fetch(pdfUrl)).arrayBuffer()
    ).toString('base64')

    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

    await ctx.runMutation(internal.coverLetters.markPending, { userId, applicationId, model: MODEL })

    let response
    try {
      response = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 1024,
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
              text: `Write a cover letter for this candidate applying to the role below.

Role: ${application.role}
Company: ${application.company}

Job Description:
${application.jdText}

---

Rules — breaking any of these makes the letter unusable:

1. Zero em dashes (—). Restructure the sentence instead.
2. Never use "not only X but also Y" or "not X, but Y" constructions.
3. Never open a sentence or paragraph with: "Furthermore", "Moreover", "Additionally", "In addition", "However".
4. No clichés: "excited to apply", "passionate about", "strong background", "proven track record", "extensive experience", "great fit", "highly motivated", "results-driven", "I am confident that".
5. No generic closings like "Thank you for your consideration" or "I look forward to hearing from you".
6. No bullet points anywhere.
7. Vary sentence length deliberately — mix short punchy sentences with longer ones. Avoid three long sentences in a row.
8. Never start two consecutive sentences with "I".
9. Be specific — name actual projects, technologies, or experiences from the resume. Generic praise adds nothing.
10. Write with confidence. No hedging: no "I believe", "I feel", "I think", "I hope".
11. Three paragraphs only: (1) a specific opening hook that names something concrete, (2) one or two examples of directly relevant work, (3) a brief, direct close — one or two sentences.
12. Under 350 words total.`,
            },
          ],
        },
      ],
    })
    } catch (e) {
      await ctx.runMutation(internal.coverLetters.clearPending, { applicationId })
      throw e
    }

    const textBlock = response.content.find(b => b.type === 'text')
    if (!textBlock || textBlock.type !== 'text') {
      await ctx.runMutation(internal.coverLetters.clearPending, { applicationId })
      throw new Error('No cover letter returned')
    }

    await ctx.runMutation(internal.coverLetters.markComplete, {
      applicationId,
      letter: textBlock.text,
    })
  },
})
