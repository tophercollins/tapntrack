import { db } from './database'
import type { Activity } from '../types'

const defaultActivities: Activity[] = [
  {
    id: 'vitamins',
    name: 'Vitamins',
    emoji: '💊',
    color: '#22c55e',
    trackingType: 'tap',
    createdAt: new Date(),
    sortOrder: 0,
    isBase: true,
  },
  {
    id: 'brush-teeth',
    name: 'Brush Teeth',
    emoji: '🪥',
    color: '#3b82f6',
    trackingType: 'tap',
    dailyTarget: 2,
    createdAt: new Date(),
    sortOrder: 1,
    isBase: true,
  },
  {
    id: 'meditation',
    name: 'Meditation',
    emoji: '🧘',
    color: '#a855f7',
    trackingType: 'duration',
    createdAt: new Date(),
    sortOrder: 2,
    isBase: true,
  },
]

export async function seedDatabase() {
  const count = await db.activities.count()
  if (count === 0) {
    await db.activities.bulkAdd(defaultActivities)
  }
}
