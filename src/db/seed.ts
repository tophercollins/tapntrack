import { db } from './database'
import type { Activity, SubItem } from '../types'

const defaultActivities: Activity[] = [
  {
    id: 'vitamins',
    name: 'Vitamins',
    emoji: '💊',
    color: '#22c55e',
    trackingType: 'tap',
    createdAt: new Date(),
    sortOrder: 0,
  },
  {
    id: 'water',
    name: 'Water',
    emoji: '💧',
    color: '#3b82f6',
    trackingType: 'number',
    unit: 'glasses',
    createdAt: new Date(),
    sortOrder: 1,
  },
  {
    id: 'bouldering',
    name: 'Bouldering',
    emoji: '🧗',
    color: '#f97316',
    trackingType: 'sub-select',
    createdAt: new Date(),
    sortOrder: 2,
  },
  {
    id: 'weightlifting',
    name: 'Weight Lifting',
    emoji: '🏋️',
    color: '#ef4444',
    trackingType: 'sub-number',
    unit: 'reps',
    createdAt: new Date(),
    sortOrder: 3,
  },
  {
    id: 'meditation',
    name: 'Meditation',
    emoji: '🧘',
    color: '#a855f7',
    trackingType: 'duration',
    createdAt: new Date(),
    sortOrder: 4,
  },
  {
    id: 'coffee',
    name: 'Coffee',
    emoji: '☕',
    color: '#78716c',
    trackingType: 'tap',
    createdAt: new Date(),
    sortOrder: 5,
  },
]

const defaultSubItems: SubItem[] = [
  // Bouldering grades
  { id: 'v0-v1', activityId: 'bouldering', name: 'V0-V1', emoji: '🟢', sortOrder: 0 },
  { id: 'v2-v3', activityId: 'bouldering', name: 'V2-V3', emoji: '🟡', sortOrder: 1 },
  { id: 'v4-v5', activityId: 'bouldering', name: 'V4-V5', emoji: '🟠', sortOrder: 2 },
  { id: 'v6+', activityId: 'bouldering', name: 'V6+', emoji: '🔴', sortOrder: 3 },
  // Weight lifting exercises
  { id: 'curls', activityId: 'weightlifting', name: 'Bicep Curls', emoji: '💪', sortOrder: 0 },
  { id: 'squats', activityId: 'weightlifting', name: 'Squats', emoji: '🦵', sortOrder: 1 },
  { id: 'bench', activityId: 'weightlifting', name: 'Bench Press', emoji: '🫁', sortOrder: 2 },
  { id: 'deadlift', activityId: 'weightlifting', name: 'Deadlift', emoji: '🔥', sortOrder: 3 },
]

export async function seedDatabase() {
  const count = await db.activities.count()
  if (count === 0) {
    await db.activities.bulkAdd(defaultActivities)
    await db.subItems.bulkAdd(defaultSubItems)
  }
}
