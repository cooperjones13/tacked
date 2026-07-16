/** Today's date as YYYY-MM-DD in the browser's local timezone (not UTC). */
export function localTodayISO(): string {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

/**
 * Parses a YYYY-MM-DD date-only string as a local-timezone Date.
 * `new Date(dateString)` parses date-only strings as UTC midnight, which
 * shifts the displayed day back by one in negative-UTC-offset timezones —
 * this avoids that.
 */
export function parseLocalDate(dateStr: string): Date {
  const [y, m, d] = dateStr.split('-').map(Number)
  return new Date(y, m - 1, d)
}
