import { apiFetch, isApiConfigured } from '../lib/api'
import { db } from '../db/database'
import type { Activity, Event, Dimension } from '../types'

// Row types for the API (snake_case), mirroring the Postgres columns.
interface ActivityRow {
  id: string
  user_id: string
  name: string
  emoji: string
  color: string
  tracking_type: string
  unit: string | null
  daily_target: number | null
  dimensions: Dimension[] | null
  value_formula: string | null
  created_at: string
  sort_order: number
  is_base: boolean
  parent_id: string | null
  deleted_at: string | null
  updated_at: string
}

interface EventRow {
  id: string
  user_id: string
  activity_id: string
  value: number | null
  duration: number | null
  dimension_values: Record<string, string> | null
  timestamp: string
  note: string | null
  created_at: string
  updated_at: string
}

// Generate or retrieve device ID for this installation
function getDeviceId(): string {
  const stored = localStorage.getItem('tapntrack_device_id')
  if (stored) return stored
  const deviceId = crypto.randomUUID()
  localStorage.setItem('tapntrack_device_id', deviceId)
  return deviceId
}

// Convert local Activity to API row format. user_id is set server-side (single user); we send a
// placeholder that the server ignores.
function activityToRow(activity: Activity): Omit<ActivityRow, 'updated_at'> {
  return {
    id: activity.id,
    user_id: 'local',
    name: activity.name,
    emoji: activity.emoji,
    color: activity.color,
    tracking_type: activity.trackingType,
    unit: activity.unit ?? null,
    daily_target: activity.dailyTarget ?? null,
    dimensions: activity.dimensions ?? null,
    value_formula: activity.valueFormula ?? null,
    created_at: activity.createdAt.toISOString(),
    sort_order: activity.sortOrder,
    is_base: activity.isBase,
    parent_id: activity.parentId ?? null,
    deleted_at: activity.deletedAt?.toISOString() ?? null,
  }
}

function rowToActivity(row: ActivityRow): Activity {
  return {
    id: row.id,
    name: row.name,
    emoji: row.emoji,
    color: row.color,
    trackingType: row.tracking_type as Activity['trackingType'],
    unit: row.unit ?? undefined,
    dailyTarget: row.daily_target ?? undefined,
    dimensions: row.dimensions ?? undefined,
    valueFormula: row.value_formula as Activity['valueFormula'],
    createdAt: new Date(row.created_at),
    sortOrder: row.sort_order,
    isBase: row.is_base,
    parentId: row.parent_id ?? undefined,
    deletedAt: row.deleted_at ? new Date(row.deleted_at) : undefined,
  }
}

function eventToRow(event: Event): Omit<EventRow, 'user_id' | 'created_at' | 'updated_at'> {
  return {
    id: event.id,
    activity_id: event.activityId,
    value: event.value ?? null,
    duration: event.duration ?? null,
    dimension_values: event.dimensionValues ?? null,
    timestamp: event.timestamp.toISOString(),
    note: event.note ?? null,
  }
}

function rowToEvent(row: EventRow): Event {
  return {
    id: row.id,
    activityId: row.activity_id,
    value: row.value ?? undefined,
    duration: row.duration ?? undefined,
    dimensionValues: row.dimension_values ?? undefined,
    timestamp: new Date(row.timestamp),
    note: row.note ?? undefined,
  }
}

// Track a pending change for later sync
export async function trackChange(
  table: 'activities' | 'events',
  recordId: string,
  operation: 'create' | 'update' | 'delete'
): Promise<void> {
  await db.pendingChanges.where({ table, recordId }).delete()
  await db.pendingChanges.add({
    id: crypto.randomUUID(),
    table,
    recordId,
    operation,
    timestamp: new Date(),
  })
}

export interface SyncResult {
  success: boolean
  error?: string
  pushed: { activities: number; events: number }
  pulled: { activities: number; events: number }
}

async function postJson(path: string, body: unknown): Promise<void> {
  await apiFetch(path, { method: 'POST', body: JSON.stringify(body) })
}

// Main sync function. userId is accepted for signature compatibility; scoping is server-side.
export async function syncWithCloud(_userId: string): Promise<SyncResult> {
  const result: SyncResult = {
    success: true,
    pushed: { activities: 0, events: 0 },
    pulled: { activities: 0, events: 0 },
  }
  if (!isApiConfigured()) {
    return { ...result, success: false, error: 'Cloud sync not configured' }
  }

  try {
    const syncMeta = await db.syncMetadata.get('sync_meta')
    const lastSyncAt = syncMeta?.lastSyncAt ?? new Date(0)
    const deviceId = getDeviceId()

    // 1. Push pending local changes
    const pendingChanges = await db.pendingChanges.toArray()
    for (const change of pendingChanges) {
      try {
        if (change.table === 'activities') {
          if (change.operation === 'delete') {
            await apiFetch(`/api/activities/${encodeURIComponent(change.recordId)}`, { method: 'DELETE' })
            result.pushed.activities++
          } else {
            const activity = await db.activities.get(change.recordId)
            if (activity) {
              await postJson('/api/activities', activityToRow(activity))
              result.pushed.activities++
            }
          }
        } else if (change.table === 'events') {
          if (change.operation === 'delete') {
            await apiFetch(`/api/events/${encodeURIComponent(change.recordId)}`, { method: 'DELETE' })
            result.pushed.events++
          } else {
            const event = await db.events.get(change.recordId)
            if (event) {
              await postJson('/api/events', eventToRow(event))
              result.pushed.events++
            }
          }
        }
        await db.pendingChanges.delete(change.id)
      } catch (err) {
        console.error('Error pushing change:', change, err)
      }
    }

    // 2. Pull remote changes since last sync
    const sinceParam = `?since=${encodeURIComponent(lastSyncAt.toISOString())}`
    const remoteActivities = (await (await apiFetch(`/api/activities${sinceParam}`)).json()) as ActivityRow[]
    for (const row of remoteActivities || []) {
      const local = await db.activities.get(row.id)
      const remoteUpdated = new Date(row.updated_at)
      if (!local || remoteUpdated > (local.createdAt || new Date(0))) {
        await db.activities.put(rowToActivity(row))
        result.pulled.activities++
      }
    }

    const remoteEvents = (await (await apiFetch(`/api/events${sinceParam}`)).json()) as EventRow[]
    for (const row of remoteEvents || []) {
      const local = await db.events.get(row.id)
      if (!local) {
        await db.events.put(rowToEvent(row))
        result.pulled.events++
      }
    }

    // 3. Update local sync metadata
    await db.syncMetadata.put({ id: 'sync_meta', lastSyncAt: new Date(), deviceId })
  } catch (err) {
    console.error('Sync error:', err)
    result.success = false
    result.error = err instanceof Error ? err.message : 'Sync failed'
  }

  return result
}

// Full upload of all local data (for initial sync or recovery)
export async function uploadAllData(_userId: string): Promise<SyncResult> {
  const result: SyncResult = {
    success: true,
    pushed: { activities: 0, events: 0 },
    pulled: { activities: 0, events: 0 },
  }
  if (!isApiConfigured()) {
    return { ...result, success: false, error: 'Cloud sync not configured' }
  }

  try {
    const activities = await db.activities.toArray()
    for (const activity of activities) {
      await postJson('/api/activities', activityToRow(activity))
      result.pushed.activities++
    }
    const events = await db.events.toArray()
    for (const event of events) {
      await postJson('/api/events', eventToRow(event))
      result.pushed.events++
    }
    await db.pendingChanges.clear()
    await db.syncMetadata.put({ id: 'sync_meta', lastSyncAt: new Date(), deviceId: getDeviceId() })
  } catch (err) {
    console.error('Upload error:', err)
    result.success = false
    result.error = err instanceof Error ? err.message : 'Upload failed'
  }

  return result
}

// Download all data from cloud (for new device or recovery)
export async function downloadAllData(_userId: string): Promise<SyncResult> {
  const result: SyncResult = {
    success: true,
    pushed: { activities: 0, events: 0 },
    pulled: { activities: 0, events: 0 },
  }
  if (!isApiConfigured()) {
    return { ...result, success: false, error: 'Cloud sync not configured' }
  }

  try {
    const activities = (await (await apiFetch('/api/activities')).json()) as ActivityRow[]
    for (const row of activities || []) {
      if (row.deleted_at) continue
      await db.activities.put(rowToActivity(row))
      result.pulled.activities++
    }
    const events = (await (await apiFetch('/api/events')).json()) as EventRow[]
    for (const row of events || []) {
      await db.events.put(rowToEvent(row))
      result.pulled.events++
    }
    await db.syncMetadata.put({ id: 'sync_meta', lastSyncAt: new Date(), deviceId: getDeviceId() })
  } catch (err) {
    console.error('Download error:', err)
    result.success = false
    result.error = err instanceof Error ? err.message : 'Download failed'
  }

  return result
}
