import { useState, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useActivityStore } from '../stores/activityStore'
import { db } from '../db/database'
import type { Activity, TrackingType } from '../types'

const trackingTypes: { type: TrackingType; label: string; icon: string; description: string }[] = [
  { type: 'tap', label: 'Quick Tap', icon: '👆', description: 'One tap = logged' },
  { type: 'number', label: 'Counter', icon: '🔢', description: 'Enter a number each time' },
  { type: 'duration', label: 'Timer', icon: '⏱️', description: 'Track time spent' },
  { type: 'session', label: 'Session', icon: '📋', description: 'Multiple sub-activities to tap' },
]

const defaultColors = [
  '#22c55e', '#3b82f6', '#f97316', '#ef4444', '#a855f7',
  '#ec4899', '#14b8a6', '#f59e0b', '#6366f1', '#78716c',
]

export function ActivityEditorPage() {
  const { activityId } = useParams<{ activityId: string }>()
  const navigate = useNavigate()
  const { activities, getChildren, loadActivities } = useActivityStore()

  // activityId will be "new" for new activities, or an actual ID for editing
  const isEditing = activityId !== undefined && activityId !== 'new'
  const existingActivity = isEditing ? activities.find((a) => a.id === activityId) : undefined
  const childActivities = isEditing && activityId ? getChildren(activityId) : []

  const [emoji, setEmoji] = useState(existingActivity?.emoji || '')
  const [name, setName] = useState(existingActivity?.name || '')
  const [trackingType, setTrackingType] = useState<TrackingType>(
    existingActivity?.trackingType || 'tap'
  )
  const [unit, setUnit] = useState(existingActivity?.unit || '')
  const emojiInputRef = useRef<HTMLInputElement>(null)

  const handleSave = async () => {
    if (!emoji || !name) return

    const id = isEditing && activityId ? activityId : crypto.randomUUID()
    const baseActivities = activities.filter((a) => a.isBase)
    const color = existingActivity?.color || defaultColors[baseActivities.length % defaultColors.length]

    const activity: Activity = {
      id,
      name,
      emoji,
      color,
      trackingType,
      unit: unit || undefined,
      createdAt: existingActivity?.createdAt || new Date(),
      sortOrder: existingActivity?.sortOrder ?? baseActivities.length,
      isBase: true,
      parentId: undefined,
    }

    if (isEditing) {
      await db.activities.update(id, activity)
    } else {
      await db.activities.add(activity)
    }

    await loadActivities()
    navigate(trackingType === 'session' ? `/activity/${id}/children` : '/')
  }

  const handleDelete = async () => {
    if (!activityId) return
    if (!confirm('Delete this activity and all its events?')) return

    // Delete activity, its children, and all related events
    const deleteRecursive = async (id: string) => {
      const children = activities.filter((a) => a.parentId === id)
      for (const child of children) {
        await deleteRecursive(child.id)
      }
      await db.activities.delete(id)
      const events = await db.events.where('activityId').equals(id).toArray()
      for (const event of events) {
        await db.events.delete(event.id)
      }
    }

    await deleteRecursive(activityId)
    await loadActivities()
    navigate('/')
  }

  const needsChildren = trackingType === 'session'
  const needsUnit = trackingType === 'number' || trackingType === 'duration'

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Header */}
      <header className="flex items-center justify-between px-4 pt-safe">
        <div className="pt-4 pb-2">
          <button
            onClick={() => navigate(-1)}
            className="text-blue-400 hover:text-blue-300"
          >
            Cancel
          </button>
        </div>
        <h1 className="pt-4 pb-2 text-lg font-semibold">
          {isEditing ? 'Edit Activity' : 'New Activity'}
        </h1>
        <div className="pt-4 pb-2">
          <button
            onClick={handleSave}
            disabled={!emoji || !name}
            className="text-blue-400 hover:text-blue-300 disabled:text-slate-600 font-semibold"
          >
            {needsChildren && !isEditing ? 'Next' : 'Save'}
          </button>
        </div>
      </header>

      <div className="p-4 space-y-6">
        {/* Emoji input */}
        <div className="flex flex-col items-center gap-2">
          <button
            type="button"
            onClick={() => emojiInputRef.current?.focus()}
            className="w-24 h-24 rounded-2xl bg-slate-800 flex items-center justify-center
              text-5xl border-2 border-dashed border-slate-600 hover:border-slate-500
              active:scale-95 transition-all"
          >
            {emoji || '?'}
          </button>
          <input
            ref={emojiInputRef}
            type="text"
            value={emoji}
            onChange={(e) => {
              // Take only the last character/emoji entered
              const value = e.target.value
              const lastChar = [...value].pop() || ''
              setEmoji(lastChar)
            }}
            placeholder="Tap box to add emoji"
            className="w-full px-4 py-2 rounded-xl bg-slate-800 text-center text-white
              placeholder-slate-500 outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Name input */}
        <div>
          <label className="block text-sm text-slate-400 mb-2">Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Activity name"
            className="w-full px-4 py-3 rounded-xl bg-slate-800 text-white
              placeholder-slate-500 outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Tracking type selector */}
        <div>
          <label className="block text-sm text-slate-400 mb-2">Tracking Type</label>
          <div className="grid grid-cols-2 gap-3">
            {trackingTypes.map((tt) => (
              <button
                key={tt.type}
                onClick={() => setTrackingType(tt.type)}
                className={`p-4 rounded-xl text-left transition-all ${
                  trackingType === tt.type
                    ? 'bg-blue-600 ring-2 ring-blue-400'
                    : 'bg-slate-800 hover:bg-slate-700'
                }`}
              >
                <div className="text-2xl mb-1">{tt.icon}</div>
                <div className="font-medium">{tt.label}</div>
                <div className="text-xs text-slate-300 opacity-75">{tt.description}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Unit input (conditional) */}
        {needsUnit && (
          <div>
            <label className="block text-sm text-slate-400 mb-2">Unit (optional)</label>
            <input
              type="text"
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              placeholder={trackingType === 'duration' ? 'e.g., minutes' : 'e.g., reps, glasses'}
              className="w-full px-4 py-3 rounded-xl bg-slate-800 text-white
                placeholder-slate-500 outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        )}

        {/* Sub-activities link (for editing existing session activities) */}
        {needsChildren && isEditing && (
          <button
            onClick={() => navigate(`/activity/${activityId}/children`)}
            className="w-full flex items-center justify-between p-4 rounded-xl bg-slate-800
              hover:bg-slate-700 transition-colors"
          >
            <div>
              <div className="font-medium">Manage Sub-activities</div>
              <div className="text-sm text-slate-400">{childActivities.length} items</div>
            </div>
            <span className="text-slate-400">→</span>
          </button>
        )}

        {/* Delete button (only when editing) */}
        {isEditing && (
          <button
            onClick={handleDelete}
            className="w-full py-3 px-4 rounded-xl bg-red-600/20 text-red-400
              hover:bg-red-600/30 transition-colors"
          >
            Delete Activity
          </button>
        )}
      </div>
    </div>
  )
}
