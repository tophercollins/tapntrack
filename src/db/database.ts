import Dexie, { type EntityTable } from 'dexie'
import type { Activity, SubItem, Entry } from '../types'

const db = new Dexie('TapNTrackDB') as Dexie & {
  activities: EntityTable<Activity, 'id'>
  subItems: EntityTable<SubItem, 'id'>
  entries: EntityTable<Entry, 'id'>
}

db.version(1).stores({
  activities: 'id, name, sortOrder, createdAt',
  subItems: 'id, activityId, sortOrder',
  entries: 'id, activityId, subItemId, timestamp',
})

export { db }
