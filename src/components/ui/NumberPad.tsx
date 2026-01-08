import { useState } from 'react'

interface NumberPadProps {
  unit?: string
  onConfirm: (value: number) => void
  onCancel: () => void
}

export function NumberPad({ unit, onConfirm, onCancel }: NumberPadProps) {
  const [value, setValue] = useState('')

  const handleDigit = (digit: string) => {
    if (value.length < 4) {
      setValue(value + digit)
    }
  }

  const handleBackspace = () => {
    setValue(value.slice(0, -1))
  }

  const handleConfirm = () => {
    const num = parseInt(value, 10)
    if (!isNaN(num) && num > 0) {
      onConfirm(num)
    }
  }

  const digits = ['1', '2', '3', '4', '5', '6', '7', '8', '9']

  return (
    <div className="flex flex-col items-center gap-4 p-4">
      <div className="text-5xl font-bold text-white min-h-16 flex items-center gap-2">
        {value || '0'}
        {unit && <span className="text-2xl text-slate-400">{unit}</span>}
      </div>

      <div className="grid grid-cols-3 gap-2 w-full max-w-64">
        {digits.map((digit) => (
          <button
            key={digit}
            onClick={() => handleDigit(digit)}
            className="h-14 rounded-xl bg-slate-700 hover:bg-slate-600
              active:bg-slate-500 text-2xl font-semibold transition-colors"
          >
            {digit}
          </button>
        ))}
        <button
          onClick={handleBackspace}
          className="h-14 rounded-xl bg-slate-800 hover:bg-slate-700
            text-xl transition-colors"
        >
          ⌫
        </button>
        <button
          onClick={() => handleDigit('0')}
          className="h-14 rounded-xl bg-slate-700 hover:bg-slate-600
            active:bg-slate-500 text-2xl font-semibold transition-colors"
        >
          0
        </button>
        <button
          onClick={handleConfirm}
          disabled={!value}
          className="h-14 rounded-xl bg-green-600 hover:bg-green-500
            disabled:bg-slate-800 disabled:text-slate-600
            text-xl font-semibold transition-colors"
        >
          ✓
        </button>
      </div>

      <button
        onClick={onCancel}
        className="text-slate-400 hover:text-slate-300 mt-2"
      >
        Cancel
      </button>
    </div>
  )
}
