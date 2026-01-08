import { useUIStore } from '../../stores/uiStore'
import { useEventStore } from '../../stores/eventStore'
import { BottomSheet } from '../ui/BottomSheet'
import { NumberPad } from '../ui/NumberPad'
import { Timer } from '../ui/Timer'
import { Confirmation } from '../ui/Confirmation'

export function Logger() {
  const { logger, closeLogger, showConfirmation } = useUIStore()
  const { addEvent } = useEventStore()

  if (logger.type === 'closed') {
    return null
  }

  if (logger.type === 'confirmation') {
    return <Confirmation message={logger.message} />
  }

  const handleNumberConfirm = async (value: number) => {
    if (logger.type !== 'number') return

    await addEvent({
      activityId: logger.activity.id,
      value,
    })

    const label = `${logger.activity.emoji} ${value} ${logger.activity.unit || ''}`

    closeLogger()
    showConfirmation(`${label} logged!`)
  }

  const handleTimerStop = async (duration: number) => {
    if (logger.type !== 'duration') return

    await addEvent({
      activityId: logger.activity.id,
      duration,
    })

    const mins = Math.floor(duration / 60)
    closeLogger()
    showConfirmation(`${logger.activity.emoji} ${mins}min logged!`)
  }

  return (
    <>
      {logger.type === 'number' && (
        <BottomSheet
          isOpen
          onClose={closeLogger}
          title={`${logger.activity.emoji} ${logger.activity.name}`}
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
