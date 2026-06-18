import type { Application } from '../types'
import { STAGES } from '../types'

function cell(value: string | number | null | undefined): string {
  const str = String(value ?? '')
  // Escape double quotes and wrap in quotes
  return `"${str.replace(/"/g, '""')}"`
}

export function exportApplicationsCSV(
  applications: Application[],
  fitScores: Record<string, number>,
) {
  const headers = [
    'Company',
    'Role',
    'Stage',
    'Location',
    'Salary',
    'Applied Date',
    'Job URL',
    'Fit Score',
    'Notes',
    'Added',
  ]

  const rows = applications.map(app => [
    cell(app.company),
    cell(app.role),
    cell(STAGES.find(s => s.id === app.stage)?.label ?? app.stage),
    cell(app.location),
    cell(app.salary),
    cell(app.appliedDate),
    cell(app.jobUrl),
    cell(fitScores[app.id]),
    cell(app.notes),
    cell(new Date(app.createdAt).toLocaleDateString('en-US')),
  ])

  const csv = [headers.map(h => cell(h)), ...rows]
    .map(r => r.join(','))
    .join('\n')

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `tacked-${new Date().toISOString().split('T')[0]}.csv`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
