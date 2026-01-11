/**
 * Get the start of the day (midnight) for a given date
 */
export function getStartOfDay(date: Date): Date {
  const start = new Date(date)
  start.setHours(0, 0, 0, 0)
  return start
}
