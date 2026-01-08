import { useNavigate } from 'react-router-dom'
import { useActivityStore } from '../../stores/activityStore'
import { useEntryStore } from '../../stores/entryStore'
import { useUIStore } from '../../stores/uiStore'
import { EmojiButton } from '../ui/EmojiButton'
import { hapticTap, hapticSuccess } from '../../utils/haptics'
import type { Activity } from '../../types'

export function ActivityGrid() {
  const navigate = useNavigate()
  const { activities } = useActivityStore()
  const { todayEntries } = useEntryStore()
  const { addEntry } = useEntryStore()
  const { openNumber, openDuration, showConfirmation } = useUIStore()

  const getCountForActivity = (activityId: string) => {
    return todayEntries.filter((e) => e.activityId === activityId).length
  }

  const handleActivityTap = async (activity: Activity) => {
    hapticTap()

    switch (activity.trackingType) {
      case 'tap':
        await addEntry({ activityId: activity.id })
        hapticSuccess()
        showConfirmation(`${activity.emoji} Logged!`)
        break

      case 'sub-select':
      case 'sub-number':
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
    hapticTap()
    navigate('/activity/new')
  }

  return (
    <div className="grid grid-cols-3 sm:grid-cols-4 gap-4 p-4">
      {activities.map((activity) => (
        <EmojiButton
          key={activity.id}
          emoji={activity.emoji}
          label={activity.name}
          color={activity.color}
          onClick={() => handleActivityTap(activity)}
          count={getCountForActivity(activity.id)}
        />
      ))}

      {/* Add new activity button */}
      <button
        onClick={handleAddActivity}
        className="flex flex-col items-center gap-1 group"
      >
        <div
          className="w-20 h-20 rounded-2xl flex items-center justify-center
            bg-slate-800/50 hover:bg-slate-700 active:scale-95 transition-all
            border-2 border-dashed border-slate-600 group-hover:border-slate-500"
        >
          <span className="text-3xl text-slate-500 group-hover:text-slate-400">+</span>
        </div>
        <span className="text-xs text-slate-500 group-hover:text-slate-400">
          Add
        </span>
      </button>
    </div>
  )
}
