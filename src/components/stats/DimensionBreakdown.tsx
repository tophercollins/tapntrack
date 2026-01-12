import { useMemo } from 'react'
import type { Event, Dimension } from '../../types'

interface DimensionBreakdownProps {
  events: Event[]
  dimensions: Dimension[]
}

export function DimensionBreakdown({ events, dimensions }: DimensionBreakdownProps) {
  const breakdowns = useMemo(() => {
    return dimensions.map((dimension) => {
      // Count occurrences of each option
      const counts: Record<string, number> = {}
      dimension.options.forEach((opt) => {
        counts[opt] = 0
      })

      events.forEach((event) => {
        const value = event.dimensionValues?.[dimension.id]
        if (value && counts[value] !== undefined) {
          counts[value]++
        }
      })

      // Sort by count descending
      const sorted = Object.entries(counts)
        .sort((a, b) => b[1] - a[1])

      const total = sorted.reduce((sum, [, count]) => sum + count, 0)
      const maxCount = Math.max(...sorted.map(([, count]) => count), 1)

      return {
        dimension,
        counts: sorted,
        total,
        maxCount,
      }
    })
  }, [events, dimensions])

  // Calculate cross-dimension stats (e.g., for bouldering: sends vs attempts by grade)
  const crossDimensionStats = useMemo(() => {
    if (dimensions.length < 2) return null

    // Assuming first dimension is the "category" (e.g., Grade)
    // and second dimension is the "outcome" (e.g., Attempted/Sent)
    const categoryDim = dimensions[0]
    const outcomeDim = dimensions[1]

    const stats: Record<string, Record<string, number>> = {}
    categoryDim.options.forEach((cat) => {
      stats[cat] = {}
      outcomeDim.options.forEach((out) => {
        stats[cat][out] = 0
      })
    })

    events.forEach((event) => {
      const category = event.dimensionValues?.[categoryDim.id]
      const outcome = event.dimensionValues?.[outcomeDim.id]
      if (category && outcome && stats[category]) {
        stats[category][outcome] = (stats[category][outcome] || 0) + 1
      }
    })

    return {
      categoryDim,
      outcomeDim,
      stats,
    }
  }, [events, dimensions])

  const getBarColor = (index: number) => {
    const colors = [
      'bg-blue-500',
      'bg-green-500',
      'bg-purple-500',
      'bg-orange-500',
      'bg-pink-500',
      'bg-cyan-500',
      'bg-yellow-500',
    ]
    return colors[index % colors.length]
  }

  return (
    <div className="space-y-6">
      {/* Individual dimension breakdowns */}
      {breakdowns.map((breakdown, dimIndex) => (
        <div key={breakdown.dimension.id}>
          <h4 className="text-sm font-medium text-slate-300 mb-3">
            {breakdown.dimension.name}
          </h4>
          <div className="space-y-2">
            {breakdown.counts.map(([option, count]) => {
              const percentage = breakdown.total > 0 ? (count / breakdown.total) * 100 : 0
              const barWidth = breakdown.maxCount > 0 ? (count / breakdown.maxCount) * 100 : 0

              return (
                <div key={option}>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-slate-300">{option}</span>
                    <span className="text-slate-400">
                      {count} <span className="text-slate-500">({percentage.toFixed(0)}%)</span>
                    </span>
                  </div>
                  <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${getBarColor(dimIndex)}`}
                      style={{ width: `${barWidth}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      ))}

      {/* Cross-dimension pyramid (like a grade pyramid for climbing) */}
      {crossDimensionStats && (
        <div>
          <h4 className="text-sm font-medium text-slate-300 mb-3">
            {crossDimensionStats.categoryDim.name} Pyramid
          </h4>
          <div className="space-y-2">
            {crossDimensionStats.categoryDim.options.map((category) => {
              const categoryStats = crossDimensionStats.stats[category]
              const outcomes = crossDimensionStats.outcomeDim.options
              const total = outcomes.reduce((sum, out) => sum + (categoryStats[out] || 0), 0)

              if (total === 0) return null

              return (
                <div key={category} className="flex items-center gap-2">
                  <span className="w-12 text-sm text-slate-400 text-right">{category}</span>
                  <div className="flex-1 flex h-6 rounded overflow-hidden bg-slate-700">
                    {outcomes.map((outcome, i) => {
                      const count = categoryStats[outcome] || 0
                      const width = total > 0 ? (count / total) * 100 : 0

                      if (count === 0) return null

                      return (
                        <div
                          key={outcome}
                          className={`h-full flex items-center justify-center text-xs font-medium ${
                            i === 0 ? 'bg-slate-500' : 'bg-green-500'
                          }`}
                          style={{ width: `${width}%` }}
                          title={`${outcome}: ${count}`}
                        >
                          {count > 0 && width > 15 && count}
                        </div>
                      )
                    })}
                  </div>
                  <span className="w-8 text-sm text-slate-500">{total}</span>
                </div>
              )
            })}
          </div>
          <div className="flex items-center gap-4 mt-3 text-xs text-slate-500">
            {crossDimensionStats.outcomeDim.options.map((outcome, i) => (
              <div key={outcome} className="flex items-center gap-1">
                <div className={`w-3 h-3 rounded ${i === 0 ? 'bg-slate-500' : 'bg-green-500'}`} />
                <span>{outcome}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
