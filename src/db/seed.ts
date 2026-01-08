import { db } from './database'
import type { Activity } from '../types'

const defaultActivities: Activity[] = [
  // Base activities (show on home grid)
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
    id: 'water',
    name: 'Water',
    emoji: '💧',
    color: '#3b82f6',
    trackingType: 'number',
    unit: 'glasses',
    createdAt: new Date(),
    sortOrder: 1,
    isBase: true,
  },
  {
    id: 'bouldering',
    name: 'Bouldering',
    emoji: '🧗',
    color: '#f97316',
    trackingType: 'session',
    createdAt: new Date(),
    sortOrder: 2,
    isBase: true,
  },
  {
    id: 'meditation',
    name: 'Meditation',
    emoji: '🧘',
    color: '#a855f7',
    trackingType: 'duration',
    createdAt: new Date(),
    sortOrder: 3,
    isBase: true,
  },
  {
    id: 'coffee',
    name: 'Coffee',
    emoji: '☕',
    color: '#78716c',
    trackingType: 'tap',
    createdAt: new Date(),
    sortOrder: 4,
    isBase: true,
  },
  // Bouldering grades (children of bouldering)
  {
    id: 'v0-v1',
    name: 'V0-V1',
    emoji: '🟢',
    color: '#22c55e',
    trackingType: 'tap',
    createdAt: new Date(),
    sortOrder: 0,
    isBase: false,
    parentId: 'bouldering',
  },
  {
    id: 'v2-v3',
    name: 'V2-V3',
    emoji: '🟡',
    color: '#eab308',
    trackingType: 'tap',
    createdAt: new Date(),
    sortOrder: 1,
    isBase: false,
    parentId: 'bouldering',
  },
  {
    id: 'v4-v5',
    name: 'V4-V5',
    emoji: '🟠',
    color: '#f97316',
    trackingType: 'tap',
    createdAt: new Date(),
    sortOrder: 2,
    isBase: false,
    parentId: 'bouldering',
  },
  {
    id: 'v6+',
    name: 'V6+',
    emoji: '🔴',
    color: '#ef4444',
    trackingType: 'tap',
    createdAt: new Date(),
    sortOrder: 3,
    isBase: false,
    parentId: 'bouldering',
  },
]

export async function seedDatabase() {
  const count = await db.activities.count()
  if (count === 0) {
    await db.activities.bulkAdd(defaultActivities)
  }
}
