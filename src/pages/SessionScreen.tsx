import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useActivityStore } from '../stores/activityStore'
import { useEventStore } from '../stores/eventStore'
import { hapticTap, hapticSuccess } from '../utils/haptics'
import type { Activity } from '../types'

export function SessionScreen() {
  const { activityId } = useParams<{ activityId: string }>()
  const navigate = useNavigate()
  const { activities, getChildren } = useActivityStore()
  const { todayEvents, addEvent } = useEventStore()
  const [sessionCounts, setSessionCounts] = useState<Record<string, number>>({})

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
    hapticTap()

    await addEvent({ activityId: child.id })

    hapticSuccess()
    setSessionCounts((prev) => ({
      ...prev,
      [child.id]: (prev[child.id] || 0) + 1,
    }))
  }

  const totalToday = Object.values(sessionCounts).reduce((sum, count) => sum + count, 0)

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Header */}
      <header className="flex items-center justify-between px-4 pt-safe">
        <div className="pt-4 pb-2">
          <button
            type="button"
            onClick={() => navigate('/', { replace: true })}
            className="flex items-center gap-2 text-blue-400 hover:text-blue-300 active:scale-95 transition-transform"
          >
            <span>←</span>
            <span>Done</span>
          </button>
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

      {/* Session summary */}
      <div className="fixed bottom-0 left-0 right-0 bg-slate-900 border-t border-slate-800 p-4 pb-safe">
        <div className="flex items-center justify-between">
          <span className="text-slate-400">Today's total</span>
          <span className="text-2xl font-bold text-blue-400">{totalToday}</span>
        </div>
      </div>
    </div>
  )
}
