import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useActivityStore } from '../stores/activityStore'
import { useEntryStore } from '../stores/entryStore'
import { hapticTap, hapticSuccess } from '../utils/haptics'
import type { SubItem } from '../types'

export function SessionScreen() {
  const { activityId } = useParams<{ activityId: string }>()
  const navigate = useNavigate()
  const { activities, getSubItems } = useActivityStore()
  const { todayEntries, addEntry } = useEntryStore()
  const [sessionCounts, setSessionCounts] = useState<Record<string, number>>({})

  const activity = activities.find((a) => a.id === activityId)
  const subItems = activityId ? getSubItems(activityId) : []

  useEffect(() => {
    // Calculate today's counts for each sub-item
    const counts: Record<string, number> = {}
    todayEntries
      .filter((e) => e.activityId === activityId)
      .forEach((e) => {
        if (e.subItemId) {
          counts[e.subItemId] = (counts[e.subItemId] || 0) + 1
        }
      })
    setSessionCounts(counts)
  }, [todayEntries, activityId])

  if (!activity) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <p className="text-slate-400">Activity not found</p>
      </div>
    )
  }

  const handleSubItemTap = async (subItem: SubItem) => {
    hapticTap()

    if (activity.trackingType === 'sub-number') {
      // For sub-number, we'd show a number input - for now just log with value 1
      await addEntry({ activityId: activity.id, subItemId: subItem.id, value: 1 })
    } else {
      await addEntry({ activityId: activity.id, subItemId: subItem.id })
    }

    hapticSuccess()
    setSessionCounts((prev) => ({
      ...prev,
      [subItem.id]: (prev[subItem.id] || 0) + 1,
    }))
  }

  const totalToday = Object.values(sessionCounts).reduce((sum, count) => sum + count, 0)

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Header */}
      <header className="flex items-center justify-between px-4 pt-safe">
        <div className="pt-4 pb-2">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-blue-400 hover:text-blue-300"
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

      {/* Sub-items grid */}
      <div className="grid grid-cols-2 gap-4 p-4">
        {subItems.map((item) => {
          const count = sessionCounts[item.id] || 0
          return (
            <button
              key={item.id}
              onClick={() => handleSubItemTap(item)}
              className="flex flex-col items-center justify-center gap-2 p-6 rounded-2xl
                bg-slate-800 hover:bg-slate-700 active:scale-95 transition-all
                relative"
            >
              <span className="text-4xl">{item.emoji}</span>
              <span className="text-lg font-medium">{item.name}</span>
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
