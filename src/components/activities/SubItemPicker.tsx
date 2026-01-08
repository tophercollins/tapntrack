import { useActivityStore } from '../../stores/activityStore'
import type { Activity, SubItem } from '../../types'

interface SubItemPickerProps {
  activity: Activity
  onSelect: (subItem: SubItem) => void
}

export function SubItemPicker({ activity, onSelect }: SubItemPickerProps) {
  const { getSubItems } = useActivityStore()
  const subItems = getSubItems(activity.id)

  return (
    <div className="grid grid-cols-2 gap-4 p-4">
      {subItems.map((item) => (
        <button
          key={item.id}
          onClick={() => onSelect(item)}
          className="flex items-center gap-3 p-4 rounded-xl bg-slate-800
            hover:bg-slate-700 active:scale-95 transition-all"
        >
          <span className="text-3xl">{item.emoji}</span>
          <span className="text-lg font-medium">{item.name}</span>
        </button>
      ))}
    </div>
  )
}
