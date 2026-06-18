# Tacked — Job Search Tracker

A full-stack job search tracker with AI-powered resume analysis and cover letter generation. Built as a portfolio project to demonstrate full-stack React development, real-time backend architecture, and practical LLM integration.

---

## What it does

Tacked lets you track job applications on a swimlane Kanban board (Interested → Applied → Interview → Offer → Rejected), attach your resume, paste job descriptions, and run an AI analysis that scores your fit, identifies strengths and gaps, surfaces relevant keywords, and generates tailored talking points — all from a single interface.

**Core features:**

- Kanban board with drag-and-drop across stages, optimistic updates, and per-stage card counts
- Application detail modal with inline editing, notes, and job description fields
- Resume upload with PDF preview (stored in Convex file storage)
- AI fit analysis — fit score (0–100), positioning summary, strengths, gaps, keywords, and talking points
- Cover letter generation with a strict anti-AI-tells prompt (no em dashes, no clichés, concrete resume references only)
- Stage history tracking — every stage move is recorded with a timestamp
- Global search and filtering by date range and fit score
- Per-user data isolation via Clerk authentication

---

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | React 19 + TypeScript + Vite |
| Styling | Tailwind CSS v4 (no config file, `@theme` tokens) |
| Backend / DB | Convex (reactive queries, mutations, file storage) |
| Auth | Clerk |
| AI | Anthropic Claude (`claude-sonnet-4-6`) |
| Drag and drop | @dnd-kit/core + @dnd-kit/sortable |
| Fonts | Crete Round (display) + Lato (body) via Google Fonts |

---

## AI integration

The AI features run as Convex server-side actions in the Node.js runtime, keeping the Anthropic API key off the client entirely.

### Fit analysis (`convex/ai.ts` — `analyzeApplication`)

The resume PDF is fetched from Convex storage, converted to base64, and sent to Claude as a **native PDF document input** — Claude reads the actual document structure rather than extracted text, which produces better results for formatted resumes. The job description is passed alongside it as text.

Structured output is enforced via **tool use with `tool_choice: { type: 'tool' }`**, which guarantees the response matches the exact JSON schema (fitScore, summary, strengths[], gaps[], keywords[], talkingPoints[]) rather than returning unstructured prose.

### Cover letter generation (`convex/ai.ts` — `generateCoverLetter`)

The prompt includes 12 explicit rules designed to prevent AI-sounding output:

- No em dashes
- No "not only X but also Y" constructions
- No "Furthermore / Moreover / Additionally" paragraph openers
- No clichés ("excited to apply", "proven track record", "great fit")
- No generic closings
- Vary sentence length deliberately
- Never start consecutive sentences with "I"
- Reference specific projects and technologies from the resume
- Under 350 words, three paragraphs only

This approach produces letters that read as genuinely written rather than generated.

---

## Architecture decisions

**Data seam** — All application state flows through a single `useBoard` hook wrapping Convex queries and mutations. Components are props-only and have no direct data access, making the backend swappable without touching UI code.

**Optimistic updates** — Stage moves (drag-and-drop) and deletes are reflected instantly using Convex's `withOptimisticUpdate`, patching the local query cache before the server round-trip completes.

**Per-user isolation** — Every record (applications, resumes, analyses, stage history) is stamped with a Clerk `userId` at write time. Queries filter strictly by the authenticated user's ID.

**Auto applied date** — The `applications.update` mutation detects when a card is first moved to `applied` with no existing date and automatically backfills today's date server-side.

**Accessibility** — WCAG AA contrast throughout (ink-muted darkened to 4.95:1), `role="alert"` on errors, `role="meter"` with `aria-valuenow/min/max` on the fit score ring, `aria-modal` on all dialogs, keyboard activation (Enter/Space) on draggable cards, full `prefers-reduced-motion` support.

---

## Getting started

**Prerequisites:** Node.js 18+, a [Convex](https://convex.dev) account, a [Clerk](https://clerk.com) account, an [Anthropic](https://console.anthropic.com) API key.

```bash
# Install dependencies
npm install

# Set up Clerk JWT template
# In Clerk dashboard: Configure → JWT Templates → New → Convex → Save

# Set environment variables
npx convex env set CLERK_JWT_ISSUER_URL https://your-clerk-domain.clerk.accounts.dev
npx convex env set ANTHROPIC_API_KEY sk-ant-...

# Add Clerk publishable key to .env.local
echo "VITE_CLERK_PUBLISHABLE_KEY=pk_test_..." >> .env.local

# Start Convex dev server (keep running)
npx convex dev

# In a separate terminal, start the frontend
npm run dev
```

Open `http://localhost:5173`, sign in, and add your first application.

---

## Project structure

```
convex/          Convex backend — schema, queries, mutations, AI actions
src/
  components/    React components (Board, ApplicationDetail, PositioningPanel, …)
  hooks/         useBoard — data seam wrapping Convex
  types.ts       Shared types and STAGES config
  index.css      Tailwind v4 @theme tokens (palette, fonts, radii, shadows)
```
