import { useState } from 'react'
import type { Dimension } from '../../types'

interface DimensionPickerProps {
  dimensions: Dimension[]
  onConfirm: (values: Record<string, string>) => void
  onCancel: () => void
}

export function DimensionPicker({ dimensions, onConfirm, onCancel }: DimensionPickerProps) {
  // Initialize with default values where available
  const [selectedValues, setSelectedValues] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {}
    dimensions.forEach((dim) => {
      if (dim.defaultValue) {
        initial[dim.id] = dim.defaultValue
      }
    })
    return initial
  })

  const handleSelect = (dimensionId: string, option: string) => {
    setSelectedValues((prev) => ({
      ...prev,
      [dimensionId]: option,
    }))
  }

  const canConfirm = dimensions
    .filter((d) => d.required)
    .every((d) => selectedValues[d.id])

  const handleConfirm = () => {
    if (canConfirm) {
      onConfirm(selectedValues)
    }
  }

  return (
    <div className="p-4 space-y-5">
      {dimensions.map((dimension) => (
        <div key={dimension.id}>
          <label className="block text-sm text-slate-400 mb-2">
            {dimension.name}
            {dimension.required && <span className="text-red-400 ml-1">*</span>}
          </label>
          <div className="flex flex-wrap gap-2">
            {dimension.options.map((option) => (
              <button
                key={option}
                onClick={() => handleSelect(dimension.id, option)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all active:scale-95 ${
                  selectedValues[dimension.id] === option
                    ? 'bg-blue-600 text-white ring-2 ring-blue-400'
                    : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                }`}
              >
                {option}
              </button>
            ))}
          </div>
        </div>
      ))}

      <div className="flex gap-3 pt-2">
        <button
          onClick={onCancel}
          className="flex-1 py-3 px-4 rounded-xl bg-slate-700 text-slate-300
            hover:bg-slate-600 transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={handleConfirm}
          disabled={!canConfirm}
          className="flex-1 py-3 px-4 rounded-xl bg-blue-600 text-white font-semibold
            hover:bg-blue-500 disabled:bg-slate-700 disabled:text-slate-500
            disabled:cursor-not-allowed transition-colors"
        >
          Log
        </button>
      </div>
    </div>
  )
}
