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
    const entries = await db.entries.orderBy('timestamp').reverse().toArray()
    set({ entries, loading: false })
  },

  loadTodayEntries: async () => {
    const startOfDay = getStartOfDay(new Date())
    const todayEntries = await db.entries
      .where('timestamp')
      .aboveOrEqual(startOfDay)
      .toArray()
    set({ todayEntries })
  },

  addEntry: async (entryData) => {
    const entry: Entry = {
      ...entryData,
      id: crypto.randomUUID(),
      timestamp: new Date(),
    }
    await db.entries.add(entry)
    await get().loadTodayEntries()
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
