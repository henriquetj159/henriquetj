'use client'

export interface BarChartItem {
  label: string
  value: number
  maxValue: number | null
  colorClass: string
}

export interface BarChartProps {
  items: BarChartItem[]
  title: string
  emptyMessage?: string
}

/**
 * Simple bar chart using pure CSS/HTML divs.
 * No external chart library required.
 */
export function BarChart({ items, title, emptyMessage }: BarChartProps) {
  if (items.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-sm text-base-dark/40">
          {emptyMessage ?? 'Sem dados para exibir'}
        </p>
      </div>
    )
  }

  // Determine the scale: max across all items
  const maxScale = Math.max(
    ...items.map((item) => item.maxValue ?? item.value),
    1,
  )

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium text-base-dark/60">{title}</h3>
      <div className="space-y-2">
        {items.map((item, index) => {
          const barWidth = maxScale > 0
            ? Math.max((item.value / maxScale) * 100, 2)
            : 0
          const capacityWidth = item.maxValue
            ? Math.max((item.maxValue / maxScale) * 100, 2)
            : 100

          return (
            <div key={index} className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-base-dark/80 truncate max-w-[60%]">
                  {item.label}
                </span>
                <span className="text-base-dark/60 font-medium">
                  {item.value}
                  {item.maxValue != null ? ` / ${item.maxValue}` : ''}
                </span>
              </div>
              <div className="relative h-5 w-full rounded bg-base-dark/5">
                {item.maxValue != null && (
                  <div
                    className="absolute inset-y-0 left-0 rounded bg-base-dark/10"
                    style={{ width: `${capacityWidth}%` }}
                  />
                )}
                <div
                  className={`absolute inset-y-0 left-0 rounded ${item.colorClass}`}
                  style={{ width: `${barWidth}%` }}
                />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ============================================================
// Sparkline bar for revenue over time
// ============================================================

export interface SparklineBarProps {
  data: { label: string; value: number }[]
  title: string
  formatValue?: (value: number) => string
}

export function SparklineBar({ data, title, formatValue }: SparklineBarProps) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-sm text-base-dark/40">Sem dados para exibir</p>
      </div>
    )
  }

  const maxValue = Math.max(...data.map((d) => d.value), 1)

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium text-base-dark/60">{title}</h3>
      <div className="flex items-end gap-[2px] h-32">
        {data.map((item, index) => {
          const heightPct = maxValue > 0
            ? Math.max((item.value / maxValue) * 100, 1)
            : 0

          return (
            <div
              key={index}
              className="group relative flex-1 flex flex-col justify-end"
            >
              <div
                className="w-full rounded-t bg-green-500/70 hover:bg-green-500 transition-colors"
                style={{ height: `${heightPct}%` }}
              />
              {/* Tooltip on hover */}
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:block z-10">
                <div className="bg-base-dark text-white text-[10px] rounded px-1.5 py-0.5 whitespace-nowrap">
                  {item.label}: {formatValue ? formatValue(item.value) : item.value}
                </div>
              </div>
            </div>
          )
        })}
      </div>
      {/* X-axis labels (first and last) */}
      <div className="flex justify-between text-[10px] text-base-dark/40">
        <span>{data[0]?.label ?? ''}</span>
        <span>{data[data.length - 1]?.label ?? ''}</span>
      </div>
    </div>
  )
}
