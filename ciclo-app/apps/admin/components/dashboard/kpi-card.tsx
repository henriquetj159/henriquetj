'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@ciclo/ui'

export interface KpiCardProps {
  title: string
  value: string
  description?: string
  icon: React.ReactNode
  trend?: {
    direction: 'up' | 'down' | 'neutral'
    label: string
  }
}

const TREND_STYLES = {
  up: 'text-green-600',
  down: 'text-red-600',
  neutral: 'text-base-dark/40',
} as const

const TREND_ARROWS = {
  up: '\u2191',
  down: '\u2193',
  neutral: '\u2192',
} as const

export function KpiCard({ title, value, description, icon, trend }: KpiCardProps) {
  return (
    <Card className="border-base-gold/10">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-base-dark/60">
          {title}
        </CardTitle>
        <div className="text-base-dark/40">{icon}</div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-heading font-bold text-base-dark">
          {value}
        </div>
        <div className="flex items-center gap-1 mt-1">
          {trend && (
            <span className={`text-xs font-medium ${TREND_STYLES[trend.direction]}`}>
              {TREND_ARROWS[trend.direction]} {trend.label}
            </span>
          )}
          {description && (
            <span className="text-xs text-base-dark/40">{description}</span>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
