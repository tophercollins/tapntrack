import { create } from 'zustand'
import { db } from '../db/database'
import type { Activity } from '../types'

interface ActivityState {
  activities: Activity[]
  loading: boolean
  loadActivities: () => Promise<void>
  getBaseActivities: () => Activity[]
  getChildren: (parentId: string) => Activity[]
  addActivity: (activity: Activity) => Promise<void>
  updateActivity: (id: string, updates: Partial<Activity>) => Promise<void>
  deleteActivity: (id: string) => Promise<void>
  reorderActivities: (orderedIds: string[]) => Promise<void>
}

export const useActivityStore = create<ActivityState>((set, get) => ({
  activities: [],
  loading: true,

  loadActivities: async () => {
    set({ loading: true })
    const activities = await db.activities.orderBy('sortOrder').toArray()
    set({ activities, loading: false })
  },

  getBaseActivities: () => {
    return get().activities.filter((a) => a.isBase)
  },

  getChildren: (parentId: string) => {
    return get()
      .activities.filter((a) => a.parentId === parentId)
      .sort((a, b) => a.sortOrder - b.sortOrder)
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
    // Delete activity and all its children recursively
    const deleteRecursive = async (activityId: string) => {
      const children = get().activities.filter((a) => a.parentId === activityId)
      for (const child of children) {
        await deleteRecursive(child.id)
      }
      await db.activities.delete(activityId)
      // Also delete associated events
      const events = await db.events.where('activityId').equals(activityId).toArray()
      for (const event of events) {
        await db.events.delete(event.id)
      }
    }

    await deleteRecursive(id)
    await get().loadActivities()
  },

  reorderActivities: async (orderedIds: string[]) => {
    // Optimistically update the UI
    const currentActivities = get().activities
    const reorderedActivities = orderedIds
      .map((id) => currentActivities.find((a) => a.id === id))
      .filter((a): a is Activity => a !== undefined)
      .map((a, index) => ({ ...a, sortOrder: index }))

    // Merge with activities not in the ordered list
    const otherActivities = currentActivities.filter(
      (a) => !orderedIds.includes(a.id)
    )
    set({ activities: [...reorderedActivities, ...otherActivities] })

    // Persist to database
    await db.transaction('rw', db.activities, async () => {
      for (let i = 0; i < orderedIds.length; i++) {
        await db.activities.update(orderedIds[i], { sortOrder: i })
      }
    })
  },
}))
