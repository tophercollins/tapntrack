import Dexie, { type EntityTable } from 'dexie'
import type { Activity, Event } from '../types'

// Sync metadata stored locally
export interface SyncMetadata {
  id: string // Always 'sync_meta'
  lastSyncAt: Date | null
  deviceId: string
}

// Track local changes that need to be synced
export interface PendingChange {
  id: string
  table: 'activities' | 'events'
  recordId: string
  operation: 'create' | 'update' | 'delete'
  timestamp: Date
}

const db = new Dexie('TapNTrackDB') as Dexie & {
  activities: EntityTable<Activity, 'id'>
  events: EntityTable<Event, 'id'>
  syncMetadata: EntityTable<SyncMetadata, 'id'>
  pendingChanges: EntityTable<PendingChange, 'id'>
}

// Version 3: Add sync tables
db.version(3).stores({
  activities: 'id, name, sortOrder, createdAt, isBase, parentId',
  events: 'id, activityId, timestamp',
  syncMetadata: 'id',
  pendingChanges: 'id, table, recordId, timestamp',
})

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
