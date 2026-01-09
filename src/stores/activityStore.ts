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
    // Filter out deleted activities
    return get().activities.filter((a) => a.isBase && !a.deletedAt)
  },

  getChildren: (parentId: string) => {
    // Filter out deleted activities
    return get()
      .activities.filter((a) => a.parentId === parentId && !a.deletedAt)
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
    // Soft delete - mark activity and all its children as deleted
    // This preserves historical event data
    const softDeleteRecursive = async (activityId: string) => {
      // Only process non-deleted children to avoid redundant updates
      const children = get().activities.filter((a) => a.parentId === activityId && !a.deletedAt)
      for (const child of children) {
        await softDeleteRecursive(child.id)
      }
      // Only update if not already deleted
      const activity = get().activities.find((a) => a.id === activityId)
      if (activity && !activity.deletedAt) {
        await db.activities.update(activityId, { deletedAt: new Date() })
      }
    }

    await softDeleteRecursive(id)
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
