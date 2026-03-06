'use client'

import * as React from 'react'
import { cn } from '../../lib/utils'
import { Triskle } from '../../patterns/triskle'

interface TriskleSpinnerProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: 'sm' | 'md' | 'lg'
  label?: string
}

const SIZE_MAP = {
  sm: 32,
  md: 48,
  lg: 72,
} as const

export function TriskleSpinner({
  size = 'md',
  label = 'Carregando...',
  className,
  ...props
}: TriskleSpinnerProps) {
  return (
    <div
      className={cn('flex flex-col items-center justify-center gap-3', className)}
      role="status"
      aria-label={label}
      {...props}
    >
      <div className="relative">
        <Triskle
          size={SIZE_MAP[size]}
          color="#932E88"
          animated
          className="opacity-80"
        />
        <div
          className="absolute inset-0 animate-breathe rounded-full"
          style={{
            background: 'radial-gradient(circle, rgba(147,46,136,0.15) 0%, transparent 70%)',
          }}
        />
      </div>
      <span className="sr-only">{label}</span>
    </div>
  )
}
