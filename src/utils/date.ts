/**
 * Get the start of the day (midnight) for a given date
 */
export function getStartOfDay(date: Date): Date {
  const start = new Date(date)
  start.setHours(0, 0, 0, 0)
  return start
}

/**
 * Get the day name (e.g., "Mon", "Tuesday")
 */
export function getDayName(date: Date, short = true): string {
  return date.toLocaleDateString('en-US', { weekday: short ? 'short' : 'long' })
}

/**
 * Format date as "Mon 6" (day name + date number)
 */
export function formatDayDate(date: Date): string {
  const day = date.toLocaleDateString('en-US', { weekday: 'short' })
  return `${day} ${date.getDate()}`
}
