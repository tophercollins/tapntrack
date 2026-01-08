import { useState, useEffect } from 'react'

interface TimerProps {
  startTime: number
  onStop: (duration: number) => void
  onCancel: () => void
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}

export function Timer({ startTime, onStop, onCancel }: TimerProps) {
  const [elapsed, setElapsed] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startTime) / 1000))
    }, 1000)
    return () => clearInterval(interval)
  }, [startTime])

  const handleStop = () => {
    onStop(elapsed)
  }

  return (
    <div className="flex flex-col items-center gap-6 p-6">
      <div className="text-6xl font-mono font-bold text-white">
        {formatTime(elapsed)}
      </div>

      <div className="w-16 h-16 rounded-full border-4 border-green-500 animate-pulse" />

      <div className="flex gap-4">
        <button
          onClick={onCancel}
          className="px-6 py-3 rounded-xl bg-slate-700 hover:bg-slate-600
            text-lg transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={handleStop}
          className="px-8 py-3 rounded-xl bg-green-600 hover:bg-green-500
            text-lg font-semibold transition-colors"
        >
          Stop
        </button>
      </div>
    </div>
  )
}
