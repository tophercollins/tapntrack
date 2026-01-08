import { create } from 'zustand'
import { db } from '../db/database'
import type { Activity, SubItem } from '../types'

interface ActivityState {
  activities: Activity[]
  subItems: SubItem[]
  loading: boolean
  loadActivities: () => Promise<void>
  getSubItems: (activityId: string) => SubItem[]
  addActivity: (activity: Activity) => Promise<void>
  updateActivity: (id: string, updates: Partial<Activity>) => Promise<void>
  deleteActivity: (id: string) => Promise<void>
}

export const useActivityStore = create<ActivityState>((set, get) => ({
  activities: [],
  subItems: [],
  loading: true,

  loadActivities: async () => {
    set({ loading: true })
    const activities = await db.activities.orderBy('sortOrder').toArray()
    const subItems = await db.subItems.orderBy('sortOrder').toArray()
    set({ activities, subItems, loading: false })
  },

  getSubItems: (activityId: string) => {
    return get().subItems.filter((item) => item.activityId === activityId)
  },

  addActivity: async (activity: Activity) => {
    await db.activities.add(activity)
    await get().loadActivities()
  },

  updateActivity: async (id: string, updates: Partial<Activity>) => {
    await db.activities.update(id, updates)
    await get().loadActivities()
  },

  deleteActivity: async (id: string) => {
    await db.activities.delete(id)
    await db.subItems.where('activityId').equals(id).delete()
    await get().loadActivities()
  },
}))
