export const DEADLINE = new Date('2026-06-11T19:00:00Z') // June 11, 3:00 PM EST

export function isPastDeadline() {
  return Date.now() > DEADLINE.getTime()
}

export function timeUntilDeadline() {
  const diff = DEADLINE.getTime() - Date.now()
  if (diff <= 0) return null
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
  const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
  if (days > 0) return `${days}d ${hours}h`
  if (hours > 0) return `${hours}h ${mins}m`
  return `${mins}m`
}
