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
  const [mode, setMode] = useState<'timer' | 'manual'>('timer')
  const [elapsed, setElapsed] = useState(0)
  const [manualMinutes, setManualMinutes] = useState('')

  useEffect(() => {
    if (mode !== 'timer') return

    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startTime) / 1000))
    }, 1000)
    return () => clearInterval(interval)
  }, [startTime, mode])

  const handleStop = () => {
    onStop(elapsed)
  }

  const handleManualSubmit = () => {
    const mins = parseInt(manualMinutes, 10)
    if (mins > 0) {
      onStop(mins * 60) // Convert to seconds
    }
  }

  return (
    <div className="flex flex-col items-center gap-4 p-6">
      {/* Mode toggle */}
      <div className="flex gap-2 bg-slate-800 rounded-xl p-1 w-full max-w-xs">
        <button
          onClick={() => setMode('timer')}
          className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
            mode === 'timer'
              ? 'bg-blue-600 text-white'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Timer
        </button>
        <button
          onClick={() => setMode('manual')}
          className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
            mode === 'manual'
              ? 'bg-blue-600 text-white'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Manual
        </button>
      </div>

      {mode === 'timer' ? (
        <>
          <div className="text-6xl font-mono font-bold text-white mt-4">
            {formatTime(elapsed)}
          </div>

          <div className="w-16 h-16 rounded-full border-4 border-green-500 animate-pulse" />

          <div className="flex gap-4 mt-2">
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
        </>
      ) : (
        <>
          <div className="w-full max-w-xs mt-4">
            <label className="block text-sm text-slate-400 mb-2 text-center">
              Enter duration in minutes
            </label>
            <input
              type="number"
              inputMode="numeric"
              min="1"
              value={manualMinutes}
              onChange={(e) => setManualMinutes(e.target.value)}
              placeholder="e.g., 15"
              autoFocus
              className="w-full px-4 py-4 rounded-xl bg-slate-700 text-white text-center text-3xl
                placeholder-slate-500 outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-slate-500 mt-2 text-center">
              Log time from an earlier session
            </p>
          </div>

          <div className="flex gap-4 mt-4">
            <button
              onClick={onCancel}
              className="px-6 py-3 rounded-xl bg-slate-700 hover:bg-slate-600
                text-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleManualSubmit}
              disabled={!manualMinutes || parseInt(manualMinutes, 10) <= 0}
              className="px-8 py-3 rounded-xl bg-green-600 hover:bg-green-500
                text-lg font-semibold transition-colors
                disabled:bg-slate-700 disabled:text-slate-500 disabled:cursor-not-allowed"
            >
              Log
            </button>
          </div>
        </>
      )}
    </div>
  )
}
