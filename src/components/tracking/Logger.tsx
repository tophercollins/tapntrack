import { useUIStore } from '../../stores/uiStore'
import { useEntryStore } from '../../stores/entryStore'
import { BottomSheet } from '../ui/BottomSheet'
import { NumberPad } from '../ui/NumberPad'
import { Timer } from '../ui/Timer'
import { Confirmation } from '../ui/Confirmation'
import { SubItemPicker } from '../activities/SubItemPicker'
import type { SubItem } from '../../types'

export function Logger() {
  const { logger, closeLogger, openNumber, showConfirmation } = useUIStore()
  const { addEntry } = useEntryStore()

  if (logger.type === 'closed') {
    return null
  }

  if (logger.type === 'confirmation') {
    return <Confirmation message={logger.message} />
  }

  const handleSubItemSelect = async (subItem: SubItem) => {
    if (logger.type !== 'sub-select') return

    const activity = logger.activity

    if (activity.trackingType === 'sub-select') {
      await addEntry({ activityId: activity.id, subItemId: subItem.id })
      closeLogger()
      showConfirmation(`${subItem.emoji} ${subItem.name} logged!`)
    } else if (activity.trackingType === 'sub-number') {
      openNumber(activity, subItem)
    }
  }

  const handleNumberConfirm = async (value: number) => {
    if (logger.type !== 'number') return

    await addEntry({
      activityId: logger.activity.id,
      subItemId: logger.subItem?.id,
      value,
    })

    const label = logger.subItem
      ? `${logger.subItem.emoji} ${value} ${logger.activity.unit || ''}`
      : `${logger.activity.emoji} ${value} ${logger.activity.unit || ''}`

    closeLogger()
    showConfirmation(`${label} logged!`)
  }

  const handleTimerStop = async (duration: number) => {
    if (logger.type !== 'duration') return

    await addEntry({
      activityId: logger.activity.id,
      duration,
    })

    const mins = Math.floor(duration / 60)
    closeLogger()
    showConfirmation(`${logger.activity.emoji} ${mins}min logged!`)
  }

  return (
    <>
      {logger.type === 'sub-select' && (
        <BottomSheet
          isOpen
          onClose={closeLogger}
          title={`${logger.activity.emoji} ${logger.activity.name}`}
        >
          <SubItemPicker
            activity={logger.activity}
            onSelect={handleSubItemSelect}
          />
        </BottomSheet>
      )}

      {logger.type === 'number' && (
        <BottomSheet
          isOpen
          onClose={closeLogger}
          title={
            logger.subItem
              ? `${logger.subItem.emoji} ${logger.subItem.name}`
              : `${logger.activity.emoji} ${logger.activity.name}`
          }
        >
          <NumberPad
            unit={logger.activity.unit}
            onConfirm={handleNumberConfirm}
            onCancel={closeLogger}
          />
        </BottomSheet>
      )}

      {logger.type === 'duration' && (
        <BottomSheet
          isOpen
          onClose={closeLogger}
          title={`${logger.activity.emoji} ${logger.activity.name}`}
        >
          <Timer
            startTime={logger.startTime}
            onStop={handleTimerStop}
            onCancel={closeLogger}
          />
        </BottomSheet>
      )}
    </>
  )
}
