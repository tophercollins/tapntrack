import { create } from 'zustand'
import { db } from '../db/database'
import type { Event } from '../types'

interface EventState {
  events: Event[]
  todayEvents: Event[]
  loading: boolean
  loadEvents: () => Promise<void>
  loadTodayEvents: () => Promise<void>
  addEvent: (event: Omit<Event, 'id' | 'timestamp'>) => Promise<Event>
  deleteEvent: (id: string) => Promise<void>
  getEventsForActivity: (activityId: string, days?: number) => Promise<Event[]>
}

function getStartOfDay(date: Date): Date {
  const start = new Date(date)
  start.setHours(0, 0, 0, 0)
  return start
}

export const useEventStore = create<EventState>((set, get) => ({
  events: [],
  todayEvents: [],
  loading: true,

  loadEvents: async () => {
    set({ loading: true })
    const events = await db.events.toArray()
    // Sort by timestamp descending
    events.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    set({ events, loading: false })
  },

  loadTodayEvents: async () => {
    const startOfDay = getStartOfDay(new Date())
    const allEvents = await db.events.toArray()
    // Filter in JS to avoid Date indexing issues
    const todayEvents = allEvents.filter(
      (event) => new Date(event.timestamp).getTime() >= startOfDay.getTime()
    )
    set({ todayEvents })
  },

  addEvent: async (eventData) => {
    const event: Event = {
      ...eventData,
      id: crypto.randomUUID(),
      timestamp: new Date(),
    }
    await db.events.add(event)
    // Update todayEvents immediately for responsive UI
    const currentToday = get().todayEvents
    set({ todayEvents: [...currentToday, event] })
    return event
  },

  deleteEvent: async (id: string) => {
    await db.events.delete(id)
    await get().loadTodayEvents()
  },

  getEventsForActivity: async (activityId: string, days = 30) => {
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)
    startDate.setHours(0, 0, 0, 0)

    const allEvents = await db.events.toArray()
    return allEvents.filter(
      (event) =>
        event.activityId === activityId &&
        new Date(event.timestamp).getTime() >= startDate.getTime()
    )
  },
}))
