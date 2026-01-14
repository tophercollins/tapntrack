import { supabase } from '../lib/supabase'
import { db } from '../db/database'
import type { Activity, Event, Dimension } from '../types'

// Row types for Supabase tables (snake_case)
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

// Convert local Activity to Supabase format
function activityToRow(activity: Activity, userId: string): ActivityRow {
  return {
    id: activity.id,
    user_id: userId,
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
    updated_at: new Date().toISOString(),
  }
}

// Convert Supabase row to local Activity
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

// Convert local Event to Supabase format
function eventToRow(event: Event, userId: string): EventRow {
  return {
    id: event.id,
    user_id: userId,
    activity_id: event.activityId,
    value: event.value ?? null,
    duration: event.duration ?? null,
    dimension_values: event.dimensionValues ?? null,
    timestamp: event.timestamp.toISOString(),
    note: event.note ?? null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }
}

// Convert Supabase row to local Event
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
  // Remove any existing pending change for this record
  await db.pendingChanges
    .where({ table, recordId })
    .delete()

  // Add new pending change
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

// Main sync function
export async function syncWithCloud(userId: string): Promise<SyncResult> {
  if (!supabase) {
    return {
      success: false,
      error: 'Cloud sync not configured',
      pushed: { activities: 0, events: 0 },
      pulled: { activities: 0, events: 0 },
    }
  }

  // Store in local const to help TypeScript narrow the type
  const client = supabase

  const result: SyncResult = {
    success: true,
    pushed: { activities: 0, events: 0 },
    pulled: { activities: 0, events: 0 },
  }

  try {
    // Get sync metadata
    const syncMeta = await db.syncMetadata.get('sync_meta')
    const lastSyncAt = syncMeta?.lastSyncAt ?? new Date(0)
    const deviceId = getDeviceId()

    // 1. Push pending local changes
    const pendingChanges = await db.pendingChanges.toArray()

    for (const change of pendingChanges) {
      try {
        if (change.table === 'activities') {
          if (change.operation === 'delete') {
            // Soft delete - update deleted_at
            await client
              .from('activities')
              .update({ deleted_at: new Date().toISOString(), updated_at: new Date().toISOString() })
              .eq('id', change.recordId)
              .eq('user_id', userId)
            result.pushed.activities++
          } else {
            const activity = await db.activities.get(change.recordId)
            if (activity) {
              const row = activityToRow(activity, userId)
              await client
                .from('activities')
                .upsert(row, { onConflict: 'id' })
              result.pushed.activities++
            }
          }
        } else if (change.table === 'events') {
          if (change.operation === 'delete') {
            await client
              .from('events')
              .delete()
              .eq('id', change.recordId)
              .eq('user_id', userId)
            result.pushed.events++
          } else {
            const event = await db.events.get(change.recordId)
            if (event) {
              const row = eventToRow(event, userId)
              await client
                .from('events')
                .upsert(row, { onConflict: 'id' })
              result.pushed.events++
            }
          }
        }

        // Remove processed change
        await db.pendingChanges.delete(change.id)
      } catch (err) {
        console.error('Error pushing change:', change, err)
      }
    }

    // 2. Pull remote changes since last sync
    const { data: remoteActivities, error: actError } = await client
      .from('activities')
      .select('*')
      .eq('user_id', userId)
      .gt('updated_at', lastSyncAt.toISOString())

    if (actError) throw actError

    for (const row of (remoteActivities as ActivityRow[] | null) || []) {
      const local = await db.activities.get(row.id)
      const remoteUpdated = new Date(row.updated_at)

      // Only update if remote is newer or local doesn't exist
      if (!local || remoteUpdated > (local.createdAt || new Date(0))) {
        const activity = rowToActivity(row)
        await db.activities.put(activity)
        result.pulled.activities++
      }
    }

    const { data: remoteEvents, error: evtError } = await client
      .from('events')
      .select('*')
      .eq('user_id', userId)
      .gt('updated_at', lastSyncAt.toISOString())

    if (evtError) throw evtError

    for (const row of (remoteEvents as EventRow[] | null) || []) {
      const local = await db.events.get(row.id)

      // Events are immutable, so only add if doesn't exist locally
      if (!local) {
        const event = rowToEvent(row)
        await db.events.put(event)
        result.pulled.events++
      }
    }

    // 3. Update sync metadata
    await db.syncMetadata.put({
      id: 'sync_meta',
      lastSyncAt: new Date(),
      deviceId,
    })

    // 4. Update sync metadata on server
    await client
      .from('sync_metadata')
      .upsert({
        user_id: userId,
        last_sync_at: new Date().toISOString(),
        device_id: deviceId,
      }, { onConflict: 'user_id' })

  } catch (err) {
    console.error('Sync error:', err)
    result.success = false
    result.error = err instanceof Error ? err.message : 'Sync failed'
  }

  return result
}

// Full upload of all local data (for initial sync or recovery)
export async function uploadAllData(userId: string): Promise<SyncResult> {
  if (!supabase) {
    return {
      success: false,
      error: 'Cloud sync not configured',
      pushed: { activities: 0, events: 0 },
      pulled: { activities: 0, events: 0 },
    }
  }

  const client = supabase

  const result: SyncResult = {
    success: true,
    pushed: { activities: 0, events: 0 },
    pulled: { activities: 0, events: 0 },
  }

  try {
    // Upload all activities
    const activities = await db.activities.toArray()
    for (const activity of activities) {
      const row = activityToRow(activity, userId)
      await client
        .from('activities')
        .upsert(row, { onConflict: 'id' })
      result.pushed.activities++
    }

    // Upload all events
    const events = await db.events.toArray()
    for (const event of events) {
      const row = eventToRow(event, userId)
      await client
        .from('events')
        .upsert(row, { onConflict: 'id' })
      result.pushed.events++
    }

    // Clear pending changes
    await db.pendingChanges.clear()

    // Update sync metadata
    await db.syncMetadata.put({
      id: 'sync_meta',
      lastSyncAt: new Date(),
      deviceId: getDeviceId(),
    })

  } catch (err) {
    console.error('Upload error:', err)
    result.success = false
    result.error = err instanceof Error ? err.message : 'Upload failed'
  }

  return result
}

// Download all data from cloud (for new device or recovery)
export async function downloadAllData(userId: string): Promise<SyncResult> {
  if (!supabase) {
    return {
      success: false,
      error: 'Cloud sync not configured',
      pushed: { activities: 0, events: 0 },
      pulled: { activities: 0, events: 0 },
    }
  }

  const client = supabase

  const result: SyncResult = {
    success: true,
    pushed: { activities: 0, events: 0 },
    pulled: { activities: 0, events: 0 },
  }

  try {
    // Download all activities
    const { data: activities, error: actError } = await client
      .from('activities')
      .select('*')
      .eq('user_id', userId)
      .is('deleted_at', null)

    if (actError) throw actError

    for (const row of (activities as ActivityRow[] | null) || []) {
      await db.activities.put(rowToActivity(row))
      result.pulled.activities++
    }

    // Download all events
    const { data: events, error: evtError } = await client
      .from('events')
      .select('*')
      .eq('user_id', userId)

    if (evtError) throw evtError

    for (const row of (events as EventRow[] | null) || []) {
      await db.events.put(rowToEvent(row))
      result.pulled.events++
    }

    // Update sync metadata
    await db.syncMetadata.put({
      id: 'sync_meta',
      lastSyncAt: new Date(),
      deviceId: getDeviceId(),
    })

  } catch (err) {
    console.error('Download error:', err)
    result.success = false
    result.error = err instanceof Error ? err.message : 'Download failed'
  }

  return result
}
