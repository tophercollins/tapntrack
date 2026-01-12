import { useUIStore } from '../../stores/uiStore'
import { useEventStore } from '../../stores/eventStore'
import { BottomSheet } from '../ui/BottomSheet'
import { NumberPad } from '../ui/NumberPad'
import { Timer } from '../ui/Timer'
import { DimensionPicker } from '../ui/DimensionPicker'
import { Confirmation } from '../ui/Confirmation'
import { ErrorToast } from '../ui/ErrorToast'

export function Logger() {
  const { logger, closeLogger, showConfirmation, showError } = useUIStore()
  const { addEvent } = useEventStore()

  if (logger.type === 'closed') {
    return null
  }

  if (logger.type === 'confirmation') {
    return <Confirmation message={logger.message} />
  }

  if (logger.type === 'error') {
    return <ErrorToast message={logger.message} />
  }

  const handleNumberConfirm = async (value: number) => {
    if (logger.type !== 'number') return

    try {
      await addEvent({
        activityId: logger.activity.id,
        value,
      })

      const label = `${logger.activity.emoji} ${value} ${logger.activity.unit || ''}`

      closeLogger()
      showConfirmation(`${label} logged!`)
    } catch {
      closeLogger()
      showError('Failed to save. Please try again.')
    }
  }

  const handleTimerStop = async (duration: number) => {
    if (logger.type !== 'duration') return

    try {
      await addEvent({
        activityId: logger.activity.id,
        duration,
      })

      const mins = Math.floor(duration / 60)
      closeLogger()
      showConfirmation(`${logger.activity.emoji} ${mins}min logged!`)
    } catch {
      closeLogger()
      showError('Failed to save. Please try again.')
    }
  }

  const handleCustomConfirm = async (values: Record<string, string>) => {
    if (logger.type !== 'custom') return

    try {
      await addEvent({
        activityId: logger.activity.id,
        dimensionValues: values,
      })

      // Build a summary of selected values
      const summary = Object.values(values).join(' / ')
      closeLogger()
      showConfirmation(`${logger.activity.emoji} ${summary} logged!`)
    } catch {
      closeLogger()
      showError('Failed to save. Please try again.')
    }
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

      {logger.type === 'custom' && logger.activity.dimensions && (
        <BottomSheet
          isOpen
          onClose={closeLogger}
          title={`${logger.activity.emoji} ${logger.activity.name}`}
        >
          <DimensionPicker
            dimensions={logger.activity.dimensions}
            onConfirm={handleCustomConfirm}
            onCancel={closeLogger}
          />
        </BottomSheet>
      )}
    </>
  )
}
