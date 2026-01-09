import { useState, useRef } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
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
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { activities, getChildren, loadActivities, deleteActivity } = useActivityStore()

  // Check if we're creating a child activity (parentId in query params)
  const parentId = searchParams.get('parent')
  const parentActivity = parentId ? activities.find((a) => a.id === parentId) : undefined

  // activityId will be "new" for new activities, or an actual ID for editing
  const isEditing = activityId !== undefined && activityId !== 'new'
  const existingActivity = isEditing ? activities.find((a) => a.id === activityId) : undefined

  // Get children if editing a session-type activity
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

    // Determine parent for this activity
    const effectiveParentId = isEditing
      ? existingActivity?.parentId
      : parentId || undefined

    // Calculate sort order based on siblings
    let sortOrder: number
    if (effectiveParentId) {
      // Child activity - count siblings
      const siblings = activities.filter((a) => a.parentId === effectiveParentId)
      sortOrder = existingActivity?.sortOrder ?? siblings.length
    } else {
      // Base activity
      const baseActivities = activities.filter((a) => a.isBase)
      sortOrder = existingActivity?.sortOrder ?? baseActivities.length
    }

    // Pick color - inherit from parent if child, otherwise use default rotation
    const color = existingActivity?.color
      || parentActivity?.color
      || defaultColors[activities.filter((a) => a.isBase).length % defaultColors.length]

    const activity: Activity = {
      id,
      name,
      emoji,
      color,
      trackingType,
      unit: unit || undefined,
      createdAt: existingActivity?.createdAt || new Date(),
      sortOrder,
      isBase: !effectiveParentId,
      parentId: effectiveParentId,
    }

    if (isEditing) {
      await db.activities.update(id, activity)
    } else {
      await db.activities.add(activity)
    }

    await loadActivities()

    // Navigate appropriately after save
    if (!isEditing && trackingType === 'session' && !effectiveParentId) {
      // New session activity - go straight to add first sub-activity
      navigate(`/activity/new?parent=${id}`, { replace: true })
    } else if (effectiveParentId) {
      // Child activity - go back to parent edit page
      navigate(`/activity/${effectiveParentId}/edit`, { replace: true })
    } else {
      navigate('/')
    }
  }

  const handleDelete = async () => {
    if (!activityId) return
    if (!confirm('Delete this activity? Historical data will be preserved.')) return

    const deletedParentId = existingActivity?.parentId

    // Soft delete - marks activity and children as deleted but preserves events
    await deleteActivity(activityId)

    // Navigate back appropriately
    if (deletedParentId) {
      navigate(`/activity/${deletedParentId}/edit`, { replace: true })
    } else {
      navigate('/')
    }
  }

  const handleAddChild = () => {
    navigate(`/activity/new?parent=${activityId}`)
  }

  const handleEditChild = (childId: string) => {
    navigate(`/activity/${childId}/edit`)
  }

  const needsChildren = trackingType === 'session'
  const needsUnit = trackingType === 'number' || trackingType === 'duration'

  // Determine header title
  const getHeaderTitle = () => {
    if (isEditing) {
      return existingActivity?.isBase === false ? 'Edit Sub-activity' : 'Edit Activity'
    }
    return parentId ? 'New Sub-activity' : 'New Activity'
  }

  // Determine back button behavior
  const handleBack = () => {
    if (parentId) {
      // Creating child - go back to parent
      navigate(`/activity/${parentId}/edit`)
    } else if (existingActivity?.parentId) {
      // Editing child - go back to parent
      navigate(`/activity/${existingActivity.parentId}/edit`)
    } else {
      navigate(-1)
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Header */}
      <header className="flex items-center justify-between px-4 pt-safe">
        <div className="pt-4 pb-2">
          <button
            onClick={handleBack}
            className="text-blue-400 hover:text-blue-300"
          >
            Cancel
          </button>
        </div>
        <h1 className="pt-4 pb-2 text-lg font-semibold">
          {getHeaderTitle()}
        </h1>
        <div className="pt-4 pb-2">
          <button
            onClick={handleSave}
            disabled={!emoji || !name}
            className="text-blue-400 hover:text-blue-300 disabled:text-slate-600 font-semibold"
          >
            Save
          </button>
        </div>
      </header>

      {/* Parent indicator for child activities */}
      {(parentActivity || (existingActivity && !existingActivity.isBase)) && (
        <div className="px-4 py-2 bg-slate-900 border-b border-slate-800">
          <div className="text-sm text-slate-400">
            Sub-activity of{' '}
            <span className="text-white">
              {parentActivity?.emoji || activities.find(a => a.id === existingActivity?.parentId)?.emoji}{' '}
              {parentActivity?.name || activities.find(a => a.id === existingActivity?.parentId)?.name}
            </span>
          </div>
        </div>
      )}

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

        {/* Sub-activities section (for session activities being edited) */}
        {needsChildren && isEditing && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm text-slate-400">Sub-activities</label>
              <button
                onClick={handleAddChild}
                className="text-sm text-blue-400 hover:text-blue-300"
              >
                + Add
              </button>
            </div>

            {childActivities.length === 0 ? (
              <div className="text-center py-6 bg-slate-800 rounded-xl">
                <p className="text-slate-400">No sub-activities yet</p>
                <p className="text-sm text-slate-500">Add items to track during a session</p>
              </div>
            ) : (
              <div className="space-y-2">
                {childActivities.map((child) => (
                  <button
                    key={child.id}
                    onClick={() => handleEditChild(child.id)}
                    className="w-full flex items-center justify-between p-4 rounded-xl bg-slate-800
                      hover:bg-slate-700 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{child.emoji}</span>
                      <span className="font-medium">{child.name}</span>
                    </div>
                    <span className="text-slate-400">→</span>
                  </button>
                ))}
              </div>
            )}
          </div>
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
