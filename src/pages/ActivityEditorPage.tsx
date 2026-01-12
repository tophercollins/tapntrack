import { useState, useRef } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { useActivityStore } from '../stores/activityStore'
import { useUIStore } from '../stores/uiStore'
import { db } from '../db/database'
import type { Activity, TrackingType, Dimension } from '../types'

const trackingTypes: { type: TrackingType; label: string; icon: string; description: string }[] = [
  { type: 'tap', label: 'Quick Tap', icon: '👆', description: 'One tap = logged' },
  { type: 'number', label: 'Counter', icon: '🔢', description: 'Enter a number each time' },
  { type: 'duration', label: 'Timer', icon: '⏱️', description: 'Track time spent' },
  { type: 'custom', label: 'Custom', icon: '🎨', description: 'Build your own fields' },
]

const defaultColors = [
  '#22c55e', '#3b82f6', '#f97316', '#ef4444', '#a855f7',
  '#ec4899', '#14b8a6', '#f59e0b', '#6366f1', '#78716c',
]

// Sub-component for editing a single dimension
function DimensionEditor({
  dimension,
  index,
  onUpdate,
  onRemove,
  onAddOption,
  onRemoveOption,
  onSetDefault,
}: {
  dimension: Dimension
  index: number
  onUpdate: (updates: Partial<Dimension>) => void
  onRemove: () => void
  onAddOption: (option: string) => void
  onRemoveOption: (option: string) => void
  onSetDefault: (option: string) => void
}) {
  const [newOption, setNewOption] = useState('')

  const handleAddOption = () => {
    if (newOption.trim()) {
      onAddOption(newOption.trim())
      setNewOption('')
    }
  }

  return (
    <div className="bg-slate-800 rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs text-slate-500">Field {index + 1}</span>
        <button
          onClick={onRemove}
          className="text-xs text-red-400 hover:text-red-300"
        >
          Remove
        </button>
      </div>

      {/* Field name */}
      <input
        type="text"
        value={dimension.name}
        onChange={(e) => onUpdate({ name: e.target.value })}
        placeholder="Field name (e.g., Grade, Outcome)"
        className="w-full px-3 py-2 rounded-lg bg-slate-700 text-white text-sm
          placeholder-slate-500 outline-none focus:ring-2 focus:ring-blue-500 mb-3"
      />

      {/* Options */}
      <div className="mb-2">
        <span className="text-xs text-slate-400">Options (tap to set as default)</span>
      </div>

      <div className="flex flex-wrap gap-2 mb-3">
        {dimension.options.map((option) => (
          <div
            key={option}
            className={`flex items-center gap-1 px-2 py-1 rounded-lg text-sm cursor-pointer transition-all ${
              dimension.defaultValue === option
                ? 'bg-blue-600 text-white'
                : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
            }`}
            onClick={() => onSetDefault(option)}
          >
            <span>{option}</span>
            <button
              onClick={(e) => {
                e.stopPropagation()
                onRemoveOption(option)
              }}
              className="ml-1 text-slate-400 hover:text-red-400"
            >
              ×
            </button>
          </div>
        ))}
      </div>

      {/* Add option input */}
      <div className="flex gap-2">
        <input
          type="text"
          value={newOption}
          onChange={(e) => setNewOption(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAddOption()}
          placeholder="Add option..."
          className="flex-1 px-3 py-2 rounded-lg bg-slate-700 text-white text-sm
            placeholder-slate-500 outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          onClick={handleAddOption}
          disabled={!newOption.trim()}
          className="px-3 py-2 bg-slate-700 rounded-lg text-sm text-blue-400
            hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Add
        </button>
      </div>

      {dimension.defaultValue && (
        <p className="text-xs text-slate-500 mt-2">
          Default: {dimension.defaultValue} (pre-selected when logging)
        </p>
      )}
    </div>
  )
}

export function ActivityEditorPage() {
  const { activityId } = useParams<{ activityId: string }>()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { activities, loadActivities, deleteActivity } = useActivityStore()
  const { showError } = useUIStore()

  // Check if we're creating a child activity (parentId in query params)
  const parentId = searchParams.get('parent')
  const parentActivity = parentId ? activities.find((a) => a.id === parentId && !a.deletedAt) : undefined

  // activityId will be "new" for new activities, or an actual ID for editing
  const isEditing = activityId !== undefined && activityId !== 'new'
  const existingActivity = isEditing ? activities.find((a) => a.id === activityId && !a.deletedAt) : undefined

  // For editing child activities, find the parent (cached to avoid duplicate searches)
  const existingParent = existingActivity?.parentId
    ? activities.find((a) => a.id === existingActivity.parentId)
    : undefined

  // Handle case where activity doesn't exist or was deleted
  if (isEditing && !existingActivity) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white">
        <p className="text-slate-400 mb-4">Activity not found</p>
        <Link to="/" replace className="text-blue-400 hover:text-blue-300">
          Go Home
        </Link>
      </div>
    )
  }

  // Handle case where parent doesn't exist (for creating child)
  if (parentId && !parentActivity) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white">
        <p className="text-slate-400 mb-4">Parent activity not found</p>
        <Link to="/" replace className="text-blue-400 hover:text-blue-300">
          Go Home
        </Link>
      </div>
    )
  }

  const [emoji, setEmoji] = useState(existingActivity?.emoji || '')
  const [name, setName] = useState(existingActivity?.name || '')
  const [trackingType, setTrackingType] = useState<TrackingType>(
    existingActivity?.trackingType || 'tap'
  )
  const [unit, setUnit] = useState(existingActivity?.unit || '')
  const [dailyTarget, setDailyTarget] = useState(existingActivity?.dailyTarget?.toString() || '')
  const [dimensions, setDimensions] = useState<Dimension[]>(
    existingActivity?.dimensions || []
  )
  const [isSaving, setIsSaving] = useState(false)
  const emojiInputRef = useRef<HTMLInputElement>(null)

  // Dimension management functions
  const addDimension = () => {
    const newDimension: Dimension = {
      id: crypto.randomUUID(),
      name: '',
      options: [],
      required: true,
    }
    setDimensions([...dimensions, newDimension])
  }

  const updateDimension = (id: string, updates: Partial<Dimension>) => {
    setDimensions(dimensions.map(d => d.id === id ? { ...d, ...updates } : d))
  }

  const removeDimension = (id: string) => {
    setDimensions(dimensions.filter(d => d.id !== id))
  }

  const addOptionToDimension = (dimensionId: string, option: string) => {
    if (!option.trim()) return
    setDimensions(dimensions.map(d => {
      if (d.id === dimensionId && !d.options.includes(option.trim())) {
        return { ...d, options: [...d.options, option.trim()] }
      }
      return d
    }))
  }

  const removeOptionFromDimension = (dimensionId: string, option: string) => {
    setDimensions(dimensions.map(d => {
      if (d.id === dimensionId) {
        const newOptions = d.options.filter(o => o !== option)
        return {
          ...d,
          options: newOptions,
          defaultValue: d.defaultValue === option ? undefined : d.defaultValue
        }
      }
      return d
    }))
  }

  const setDefaultOption = (dimensionId: string, option: string) => {
    setDimensions(dimensions.map(d => {
      if (d.id === dimensionId) {
        return { ...d, defaultValue: d.defaultValue === option ? undefined : option }
      }
      return d
    }))
  }

  // Validation for custom type
  const isCustomValid = trackingType !== 'custom' || (
    dimensions.length > 0 &&
    dimensions.every(d => d.name.trim() && d.options.length > 0)
  )

  const handleSave = async () => {
    if (!emoji || !name || isSaving || !isCustomValid) return

    setIsSaving(true)
    try {
      const id = isEditing && activityId ? activityId : crypto.randomUUID()

      // Determine parent for this activity
      const effectiveParentId = isEditing
        ? existingActivity?.parentId
        : parentId || undefined

      // Calculate sort order based on siblings (excluding deleted)
      let sortOrder: number
      if (effectiveParentId) {
        // Child activity - count active siblings only
        const siblings = activities.filter((a) => a.parentId === effectiveParentId && !a.deletedAt)
        sortOrder = existingActivity?.sortOrder ?? siblings.length
      } else {
        // Base activity - count active base activities only
        const baseActivities = activities.filter((a) => a.isBase && !a.deletedAt)
        sortOrder = existingActivity?.sortOrder ?? baseActivities.length
      }

      // Pick color - inherit from parent if child, otherwise use default rotation
      const activeBaseCount = activities.filter((a) => a.isBase && !a.deletedAt).length
      const color = existingActivity?.color
        || parentActivity?.color
        || defaultColors[activeBaseCount % defaultColors.length]

      const parsedDailyTarget = dailyTarget ? parseInt(dailyTarget, 10) : undefined
      const activity: Activity = {
        id,
        name,
        emoji,
        color,
        trackingType,
        unit: unit || undefined,
        dailyTarget: parsedDailyTarget && parsedDailyTarget > 0 ? parsedDailyTarget : undefined,
        dimensions: trackingType === 'custom' ? dimensions : undefined,
        createdAt: existingActivity?.createdAt || new Date(),
        sortOrder,
        isBase: !effectiveParentId,
        parentId: effectiveParentId,
      }

      if (isEditing) {
        await db.activities.put(activity)
      } else {
        await db.activities.add(activity)
      }

      await loadActivities()

      // Navigate appropriately after save
      if (effectiveParentId) {
        // Child activity - go back to parent edit page
        navigate(`/activity/${effectiveParentId}/edit`, { replace: true })
      } else {
        navigate('/')
      }
    } catch {
      showError('Failed to save activity. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!activityId || isSaving) return
    if (!confirm('Delete this activity? Historical data will be preserved.')) return

    const deletedParentId = existingActivity?.parentId

    // Navigate FIRST to avoid "Activity not found" flash during re-render
    if (deletedParentId) {
      navigate(`/activity/${deletedParentId}/edit`, { replace: true })
    } else {
      navigate('/', { replace: true })
    }

    // Then delete in background (navigation already happened)
    try {
      await deleteActivity(activityId)
    } catch {
      showError('Failed to delete activity. Please try again.')
    }
  }

  const needsUnit = trackingType === 'number' || trackingType === 'duration'
  const isCustomType = trackingType === 'custom'

  // Determine header title
  const getHeaderTitle = () => {
    if (isEditing) {
      return existingActivity?.isBase === false ? 'Edit Sub-activity' : 'Edit Activity'
    }
    return parentId ? 'New Sub-activity' : 'New Activity'
  }

  // Compute back link destination
  const backPath = parentId
    ? `/activity/${parentId}/edit`  // Creating child - go back to parent edit page
    : existingActivity?.parentId
      ? `/activity/${existingActivity.parentId}/edit`  // Editing child - go back to parent edit page
      : '/'  // Base activity - go home

  return (
    <div className="min-h-screen bg-slate-950 text-white pb-24">
      {/* Header */}
      <header className="flex items-center justify-between px-4 pt-safe">
        <div className="pt-4 pb-2">
          <Link
            to={backPath}
            replace
            className="text-blue-400 hover:text-blue-300 active:scale-95 transition-transform"
          >
            Cancel
          </Link>
        </div>
        <h1 className="pt-4 pb-2 text-lg font-semibold">
          {getHeaderTitle()}
        </h1>
        <div className="pt-4 pb-2">
          <button
            onClick={handleSave}
            disabled={!emoji || !name || isSaving || !isCustomValid}
            className="text-blue-400 hover:text-blue-300 disabled:text-slate-600 font-semibold"
          >
            {isSaving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </header>

      {/* Parent indicator for child activities */}
      {(parentActivity || existingParent) && (
        <div className="px-4 py-2 bg-slate-900 border-b border-slate-800">
          <div className="text-sm text-slate-400">
            Sub-activity of{' '}
            <span className="text-white">
              {parentActivity?.emoji || existingParent?.emoji}{' '}
              {parentActivity?.name || existingParent?.name}
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

        {/* Dimension Builder (for custom type) */}
        {isCustomType && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm text-slate-400">Custom Fields</label>
              <button
                onClick={addDimension}
                className="text-sm text-blue-400 hover:text-blue-300"
              >
                + Add Field
              </button>
            </div>

            {dimensions.length === 0 ? (
              <div className="bg-slate-800 rounded-xl p-6 text-center">
                <p className="text-slate-400 text-sm mb-3">
                  No fields yet. Add fields to customize what you track.
                </p>
                <button
                  onClick={addDimension}
                  className="px-4 py-2 bg-blue-600 rounded-lg text-sm hover:bg-blue-500 transition-colors"
                >
                  Add Your First Field
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {dimensions.map((dimension, index) => (
                  <DimensionEditor
                    key={dimension.id}
                    dimension={dimension}
                    index={index}
                    onUpdate={(updates) => updateDimension(dimension.id, updates)}
                    onRemove={() => removeDimension(dimension.id)}
                    onAddOption={(option) => addOptionToDimension(dimension.id, option)}
                    onRemoveOption={(option) => removeOptionFromDimension(dimension.id, option)}
                    onSetDefault={(option) => setDefaultOption(dimension.id, option)}
                  />
                ))}
              </div>
            )}

            {dimensions.length > 0 && !isCustomValid && (
              <p className="text-xs text-amber-400 mt-2">
                Each field needs a name and at least one option
              </p>
            )}
          </div>
        )}

        {/* Daily target input (for all activity types) */}
        <div>
          <label className="block text-sm text-slate-400 mb-2">Daily Target (optional)</label>
          <input
            type="number"
            inputMode="numeric"
            min="1"
            value={dailyTarget}
            onChange={(e) => setDailyTarget(e.target.value)}
            placeholder={
              trackingType === 'tap' ? 'e.g., 2 times' :
              trackingType === 'number' ? `e.g., 8 ${unit || 'total'}` :
              trackingType === 'custom' ? 'e.g., 10 logs' :
              'e.g., 30 minutes total'
            }
            className="w-full px-4 py-3 rounded-xl bg-slate-800 text-white
              placeholder-slate-500 outline-none focus:ring-2 focus:ring-blue-500"
          />
          <p className="text-xs text-slate-500 mt-1">
            {trackingType === 'tap' && 'Number of times to complete today'}
            {trackingType === 'number' && `Total ${unit || 'amount'} to reach today`}
            {trackingType === 'duration' && 'Total minutes to reach today'}
            {trackingType === 'custom' && 'Number of logs to complete today'}
          </p>
        </div>

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
