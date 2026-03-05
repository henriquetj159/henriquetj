'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback } from 'react'
import type { DashboardPeriod } from '../../lib/actions/dashboard'

const PERIOD_OPTIONS: { value: DashboardPeriod; label: string }[] = [
  { value: '7d', label: '7 dias' },
  { value: '30d', label: '30 dias' },
  { value: '90d', label: '90 dias' },
  { value: 'total', label: 'Total' },
]

export function PeriodFilter() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const currentPeriod = (searchParams.get('period') as DashboardPeriod) || '30d'

  const handlePeriodChange = useCallback(
    (period: DashboardPeriod) => {
      const params = new URLSearchParams(searchParams.toString())
      params.set('period', period)
      router.push(`/admin?${params.toString()}`)
    },
    [router, searchParams],
  )

  return (
    <div className="flex items-center gap-1 rounded-lg bg-base-dark/5 p-1">
      {PERIOD_OPTIONS.map((option) => (
        <button
          key={option.value}
          onClick={() => handlePeriodChange(option.value)}
          className={`
            rounded-md px-3 py-1.5 text-xs font-medium transition-colors
            ${
              currentPeriod === option.value
                ? 'bg-white text-base-dark shadow-sm'
                : 'text-base-dark/60 hover:text-base-dark'
            }
          `}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}
