import { useActivityStore } from '../../stores/activityStore'
import { useEntryStore } from '../../stores/entryStore'
import { useUIStore } from '../../stores/uiStore'
import { EmojiButton } from '../ui/EmojiButton'
import { hapticTap, hapticSuccess } from '../../utils/haptics'
import type { Activity } from '../../types'

export function ActivityGrid() {
  const { activities } = useActivityStore()
  const { todayEntries } = useEntryStore()
  const { addEntry } = useEntryStore()
  const { openSubSelect, openNumber, openDuration, showConfirmation } = useUIStore()

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
        openSubSelect(activity)
        break

      case 'number':
        openNumber(activity)
        break

      case 'sub-number':
        openSubSelect(activity)
        break

      case 'duration':
        openDuration(activity)
        break
    }
  }

  if (activities.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-slate-400">
        <span className="text-4xl mb-4">📝</span>
        <p>No activities yet</p>
        <p className="text-sm">Go to Settings to add some!</p>
      </div>
    )
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
    </div>
  )
}
