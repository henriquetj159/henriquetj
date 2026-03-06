import * as React from 'react'
import { cn } from '../../lib/utils'

interface SacredDividerProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'line' | 'mandala' | 'wave' | 'sacred'
}

export function SacredDivider({
  variant = 'line',
  className,
  ...props
}: SacredDividerProps) {
  if (variant === 'mandala') {
    return (
      <div
        className={cn('flex items-center justify-center py-6', className)}
        role="separator"
        aria-hidden="true"
        {...props}
      >
        <div className="h-px flex-1 bg-gradient-to-r from-transparent via-violet-600/20 to-transparent" />
        <svg viewBox="0 0 40 40" className="mx-4 h-8 w-8 text-violet-600/30" fill="none" stroke="currentColor" strokeWidth="0.5">
          <circle cx="20" cy="20" r="15" />
          <circle cx="20" cy="20" r="10" />
          <circle cx="20" cy="20" r="5" />
          {Array.from({ length: 6 }, (_, i) => {
            const angle = (i / 6) * Math.PI * 2
            return (
              <line
                key={i}
                x1={20 + 5 * Math.cos(angle)}
                y1={20 + 5 * Math.sin(angle)}
                x2={20 + 15 * Math.cos(angle)}
                y2={20 + 15 * Math.sin(angle)}
              />
            )
          })}
        </svg>
        <div className="h-px flex-1 bg-gradient-to-r from-transparent via-violet-600/20 to-transparent" />
      </div>
    )
  }

  if (variant === 'wave') {
    return (
      <div
        className={cn('py-4', className)}
        role="separator"
        aria-hidden="true"
        {...props}
      >
        <svg viewBox="0 0 400 20" className="h-5 w-full text-violet-600/15" preserveAspectRatio="none">
          <path
            d="M0 10 Q25 0 50 10 T100 10 T150 10 T200 10 T250 10 T300 10 T350 10 T400 10"
            fill="none"
            stroke="currentColor"
            strokeWidth="1"
          />
        </svg>
      </div>
    )
  }

  if (variant === 'sacred') {
    return (
      <div
        className={cn('flex items-center justify-center py-8', className)}
        role="separator"
        aria-hidden="true"
        {...props}
      >
        <div className="h-px flex-1 bg-gradient-to-r from-transparent via-base-forest/15 to-transparent" />
        <div className="mx-4 flex gap-1.5">
          <div className="h-1.5 w-1.5 rounded-full bg-base-forest/30" />
          <div className="h-1.5 w-1.5 rounded-full bg-violet-600/40" />
          <div className="h-1.5 w-1.5 rounded-full bg-base-amber/30" />
        </div>
        <div className="h-px flex-1 bg-gradient-to-r from-transparent via-base-forest/15 to-transparent" />
      </div>
    )
  }

  // Default: line
  return (
    <div
      className={cn('py-4', className)}
      role="separator"
      aria-hidden="true"
      {...props}
    >
      <div className="h-px w-full bg-gradient-to-r from-transparent via-violet-600/20 to-transparent" />
    </div>
  )
}
