import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  rectSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable'
import { useActivityStore } from '../../stores/activityStore'
import { useEventStore } from '../../stores/eventStore'
import { useUIStore } from '../../stores/uiStore'
import { SortableEmojiButton } from '../ui/SortableEmojiButton'
import { hapticTap, hapticSuccess } from '../../utils/haptics'
import type { Activity } from '../../types'

export function ActivityGrid() {
  const navigate = useNavigate()
  const { getBaseActivities, reorderActivities } = useActivityStore()
  const { todayEvents, addEvent } = useEventStore()
  const { openNumber, openDuration, showConfirmation } = useUIStore()
  const [isDragMode, setIsDragMode] = useState(false)

  const baseActivities = getBaseActivities()

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        delay: isDragMode ? 0 : 500,
        tolerance: 5,
      },
    })
  )

  const getCountForActivity = (activityId: string) => {
    return todayEvents.filter((e) => e.activityId === activityId).length
  }

  const handleActivityTap = async (activity: Activity) => {
    if (isDragMode) return

    hapticTap()

    switch (activity.trackingType) {
      case 'tap':
        await addEvent({ activityId: activity.id })
        hapticSuccess()
        showConfirmation(`${activity.emoji} Logged!`)
        break

      case 'session':
        navigate(`/session/${activity.id}`)
        break

      case 'number':
        openNumber(activity)
        break

      case 'duration':
        openDuration(activity)
        break
    }
  }

  const handleAddActivity = () => {
    if (isDragMode) {
      setIsDragMode(false)
      return
    }
    hapticTap()
    navigate('/activity/new')
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (over && active.id !== over.id) {
      const oldIndex = baseActivities.findIndex((a) => a.id === active.id)
      const newIndex = baseActivities.findIndex((a) => a.id === over.id)

      if (oldIndex !== -1 && newIndex !== -1) {
        const newOrder = arrayMove(baseActivities, oldIndex, newIndex)
        reorderActivities(newOrder.map((a) => a.id))
        hapticTap()
      }
    }
  }

  const handleDragStart = () => {
    if (!isDragMode) {
      setIsDragMode(true)
    }
    hapticTap()
  }

  return (
    <div className="relative">
      {/* Edit mode toggle */}
      {baseActivities.length > 0 && (
        <div className="flex justify-end px-4 pb-2">
          <button
            onClick={() => setIsDragMode(!isDragMode)}
            className={`text-sm px-3 py-1 rounded-full transition-colors ${
              isDragMode
                ? 'bg-blue-600 text-white'
                : 'text-slate-400 hover:text-slate-300'
            }`}
          >
            {isDragMode ? 'Done' : 'Edit'}
          </button>
        </div>
      )}

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
        onDragStart={handleDragStart}
      >
        <SortableContext
          items={baseActivities.map((a) => a.id)}
          strategy={rectSortingStrategy}
        >
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-4 px-4 pb-4">
            {baseActivities.map((activity) => (
              <SortableEmojiButton
                key={activity.id}
                id={activity.id}
                emoji={activity.emoji}
                label={activity.name}
                color={activity.color}
                onClick={() => handleActivityTap(activity)}
                count={getCountForActivity(activity.id)}
                isDragMode={isDragMode}
              />
            ))}

            {/* Add new activity button */}
            <button
              onClick={handleAddActivity}
              className="flex flex-col items-center gap-1 group"
            >
              <div
                className={`w-20 h-20 rounded-2xl flex items-center justify-center
                  bg-slate-800/50 hover:bg-slate-700 active:scale-95 transition-all
                  border-2 border-dashed border-slate-600 group-hover:border-slate-500`}
              >
                <span className="text-3xl text-slate-500 group-hover:text-slate-400">
                  {isDragMode ? '✓' : '+'}
                </span>
              </div>
              <span className="text-xs text-slate-500 group-hover:text-slate-400">
                {isDragMode ? 'Done' : 'Add'}
              </span>
            </button>
          </div>
        </SortableContext>
      </DndContext>
    </div>
  )
}
