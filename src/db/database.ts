import Dexie, { type EntityTable } from 'dexie'
import type { Activity, Event } from '../types'

const db = new Dexie('TapNTrackDB') as Dexie & {
  activities: EntityTable<Activity, 'id'>
  events: EntityTable<Event, 'id'>
}

// Version 2: Unified activities table (base + nested), renamed entries to events
db.version(2).stores({
  activities: 'id, name, sortOrder, createdAt, isBase, parentId',
  events: 'id, activityId, timestamp',
})

// Migration from v1: drop old subItems table
db.version(1).stores({
  activities: 'id, name, sortOrder, createdAt',
  subItems: 'id, activityId, sortOrder',
  entries: 'id, activityId, subItemId, timestamp',
})

export { db }
