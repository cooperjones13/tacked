export type Stage =
  | 'interested'
  | 'applied'
  | 'interview'
  | 'offer'
  | 'rejected'

export interface Application {
  id: string
  company: string
  role: string
  location: string
  salary: string
  jobUrl: string
  jdText: string
  stage: Stage
  appliedDate: string | null
  notes: string
  createdAt: string
}

export interface StageConfig {
  id: Stage
  label: string
  color: string
}

export const STAGES: StageConfig[] = [
  { id: 'interested', label: 'Interested', color: 'var(--color-stage-interested)' },
  { id: 'applied',    label: 'Applied',    color: 'var(--color-stage-applied)' },
  { id: 'interview',  label: 'Interview',  color: 'var(--color-stage-interview)' },
  { id: 'offer',      label: 'Offer',      color: 'var(--color-stage-offer)' },
  { id: 'rejected',   label: 'Rejected',   color: 'var(--color-stage-rejected)' },
]

export interface Filters {
  query: string
  dateRange: 'all' | '7d' | '30d' | '90d' | 'year'
  score: 'all' | 'strong' | 'fair' | 'weak' | 'none'
}

export const DEFAULT_FILTERS: Filters = {
  query: '',
  dateRange: 'all',
  score: 'all',
}
