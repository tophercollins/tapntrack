import { useEffect, useState, useRef } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useActivityStore } from '../stores/activityStore'
import { useEventStore } from '../stores/eventStore'
import { useUIStore } from '../stores/uiStore'
import { hapticTap, hapticSuccess } from '../utils/haptics'
import type { Activity } from '../types'

export function SessionScreen() {
  const { activityId } = useParams<{ activityId: string }>()
  const { activities, getChildren } = useActivityStore()
  const { todayEvents, addEvent } = useEventStore()
  const { showError } = useUIStore()
  const [sessionCounts, setSessionCounts] = useState<Record<string, number>>({})
  const savingRef = useRef<Set<string>>(new Set())

  const activity = activities.find((a) => a.id === activityId)
  const childActivities = activityId ? getChildren(activityId) : []

  useEffect(() => {
    // Calculate today's counts for each child activity
    const counts: Record<string, number> = {}
    childActivities.forEach((child) => {
      counts[child.id] = todayEvents.filter((e) => e.activityId === child.id).length
    })
    setSessionCounts(counts)
  }, [todayEvents, childActivities])

  if (!activity) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <p className="text-slate-400">Activity not found</p>
      </div>
    )
  }

  const handleChildTap = async (child: Activity) => {
    // Prevent duplicate taps while saving
    if (savingRef.current.has(child.id)) return
    savingRef.current.add(child.id)

    hapticTap()

    try {
      await addEvent({ activityId: child.id })

      hapticSuccess()
      setSessionCounts((prev) => ({
        ...prev,
        [child.id]: (prev[child.id] || 0) + 1,
      }))
    } catch {
      showError('Failed to save. Please try again.')
    } finally {
      savingRef.current.delete(child.id)
    }
  }

  const totalToday = Object.values(sessionCounts).reduce((sum, count) => sum + count, 0)

  return (
    <div className="min-h-screen bg-slate-950 text-white pb-36">
      {/* Header */}
      <header className="flex items-center justify-between px-4 pt-safe">
        <div className="pt-4 pb-2">
          <Link
            to="/"
            replace
            className="flex items-center gap-2 text-blue-400 hover:text-blue-300 active:scale-95 transition-transform"
          >
            <span>←</span>
            <span>Done</span>
          </Link>
        </div>
        <div className="pt-4 pb-2 flex items-center gap-2">
          <span className="text-2xl">{activity.emoji}</span>
          <span className="text-xl font-semibold">{activity.name}</span>
        </div>
        <div className="w-16" /> {/* Spacer for centering */}
      </header>

      {/* Child activities grid */}
      <div className="grid grid-cols-2 gap-4 p-4">
        {childActivities.map((child) => {
          const count = sessionCounts[child.id] || 0
          return (
            <button
              key={child.id}
              onClick={() => handleChildTap(child)}
              className="flex flex-col items-center justify-center gap-2 p-6 rounded-2xl
                bg-slate-800 hover:bg-slate-700 active:scale-95 transition-all
                relative"
            >
              <span className="text-4xl">{child.emoji}</span>
              <span className="text-lg font-medium">{child.name}</span>
              {count > 0 && (
                <span
                  className="absolute top-2 right-2 bg-blue-500 text-white
                    text-sm font-bold rounded-full w-7 h-7 flex items-center justify-center"
                >
                  {count}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* Session summary - positioned above bottom nav */}
      <div className="fixed bottom-16 left-0 right-0 bg-slate-900 border-t border-slate-800 p-4">
        <div className="flex items-center justify-between">
          <span className="text-slate-400">Today's total</span>
          <span className="text-2xl font-bold text-blue-400">{totalToday}</span>
        </div>
      </div>
    </div>
  )
}
