import { create } from 'zustand'
import { db } from '../db/database'
import type { Entry } from '../types'

interface EntryState {
  entries: Entry[]
  todayEntries: Entry[]
  loading: boolean
  loadEntries: () => Promise<void>
  loadTodayEntries: () => Promise<void>
  addEntry: (entry: Omit<Entry, 'id' | 'timestamp'>) => Promise<Entry>
  deleteEntry: (id: string) => Promise<void>
  getEntriesForActivity: (activityId: string, days?: number) => Promise<Entry[]>
}

function getStartOfDay(date: Date): Date {
  const start = new Date(date)
  start.setHours(0, 0, 0, 0)
  return start
}

export const useEntryStore = create<EntryState>((set, get) => ({
  entries: [],
  todayEntries: [],
  loading: true,

  loadEntries: async () => {
    set({ loading: true })
    const entries = await db.entries.toArray()
    // Sort by timestamp descending
    entries.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    set({ entries, loading: false })
  },

  loadTodayEntries: async () => {
    const startOfDay = getStartOfDay(new Date())
    const allEntries = await db.entries.toArray()
    // Filter in JS to avoid Date indexing issues
    const todayEntries = allEntries.filter(
      (entry) => new Date(entry.timestamp).getTime() >= startOfDay.getTime()
    )
    set({ todayEntries })
  },

  addEntry: async (entryData) => {
    const entry: Entry = {
      ...entryData,
      id: crypto.randomUUID(),
      timestamp: new Date(),
    }
    await db.entries.add(entry)
    // Update todayEntries immediately for responsive UI
    const currentToday = get().todayEntries
    set({ todayEntries: [...currentToday, entry] })
    return entry
  },

  deleteEntry: async (id: string) => {
    await db.entries.delete(id)
    await get().loadTodayEntries()
  },

  getEntriesForActivity: async (activityId: string, days = 30) => {
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)
    startDate.setHours(0, 0, 0, 0)

    return db.entries
      .where('activityId')
      .equals(activityId)
      .and((entry) => entry.timestamp >= startDate)
      .toArray()
  },
}))
