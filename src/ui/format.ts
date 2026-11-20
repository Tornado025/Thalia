export function formatDuration(ms: number): string {
  const s = Math.max(0, Math.round(ms / 1000))
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
}

export const formatClock = (t: number) =>
  new Date(t).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })

/** History group label: Today / Yesterday / 12 Nov. */
export function dayLabel(t: number, now = Date.now()): string {
  const day = (x: number) => new Date(x).setHours(0, 0, 0, 0)
  const diff = Math.round((day(now) - day(t)) / 86_400_000)
  if (diff === 0) return 'Today'
  if (diff === 1) return 'Yesterday'
  return new Date(t).toLocaleDateString([], { day: 'numeric', month: 'short' })
}

export const VEHICLE_LABEL = { bike: 'Bike', scooter: 'Scooter', car: 'Car' } as const
