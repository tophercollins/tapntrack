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
    id: 'pressups',
    name: 'Pressups',
    emoji: '💪',
    color: '#3b82f6',
    trackingType: 'number',
    unit: 'reps',
    dailyTarget: 30,
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
  {
    id: 'bouldering',
    name: 'Bouldering',
    emoji: '🧗',
    color: '#f97316',
    trackingType: 'custom',
    dimensions: [
      {
        id: 'grade',
        name: 'Grade',
        options: ['V0', 'V1', 'V2', 'V3', 'V4', 'V5', 'V6', 'V7', 'V8', 'V9'],
        defaultValue: 'V2',
        required: true,
      },
      {
        id: 'outcome',
        name: 'Outcome',
        options: ['Attempt', 'Send'],
        defaultValue: 'Send',
        required: true,
      },
      {
        id: 'hang',
        name: 'Hang',
        options: ['Yes', 'No'],
        defaultValue: 'No',
        required: true,
      },
    ],
    createdAt: new Date(),
    sortOrder: 3,
    isBase: true,
  },
]

export async function seedDatabase() {
  const count = await db.activities.count()
  if (count === 0) {
    await db.activities.bulkAdd(defaultActivities)
  }
}
