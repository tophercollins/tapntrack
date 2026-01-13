import { db } from './database'
import type { Activity } from '../types'

const defaultActivities: Activity[] = [
  {
    id: 'vitamins',
    name: 'Vitamins',
    emoji: '💊',
    color: '#22c55e',
    trackingType: 'tap',
    dailyTarget: 1,
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
    dailyTarget: 50,
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
    dailyTarget: 10,
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
    dailyTarget: 10,
    valueFormula: 'multiply',
    dimensions: [
      {
        id: 'grade',
        name: 'Grade',
        options: [
          { value: 'V0', numericValue: 1 },
          { value: 'V1', numericValue: 2 },
          { value: 'V2', numericValue: 3 },
          { value: 'V3', numericValue: 4 },
          { value: 'V4', numericValue: 5 },
          { value: 'V5', numericValue: 6 },
          { value: 'V6', numericValue: 7 },
          { value: 'V7', numericValue: 8 },
          { value: 'V8', numericValue: 9 },
          { value: 'V9', numericValue: 10 },
        ],
        defaultValue: 'V2',
        required: true,
      },
      {
        id: 'outcome',
        name: 'Outcome',
        options: [
          { value: 'Attempt', numericValue: 0.5 },
          { value: 'Send', numericValue: 1 },
        ],
        defaultValue: 'Send',
        required: true,
      },
      {
        id: 'hang',
        name: 'Hang',
        options: [
          { value: 'Yes', numericValue: 1.5 },
          { value: 'No', numericValue: 1 },
        ],
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
