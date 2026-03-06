import type { HTMLAttributes } from 'react'
import { cn } from '../lib/utils'
import { MandalaPattern } from '../patterns/mandala-pattern'

interface BaseTriadeWatermarkProps extends HTMLAttributes<HTMLDivElement> {
  opacity?: number
}

export function BaseTriadeWatermark({
  opacity = 0.04,
  className,
  ...props
}: BaseTriadeWatermarkProps) {
  return (
    <div
      className={cn(
        'pointer-events-none fixed inset-0 z-0 flex items-center justify-center overflow-hidden print:hidden',
        className,
      )}
      aria-hidden="true"
      {...props}
    >
      {/* Mandala central giratoria */}
      <div
        className="animate-mandala-slow"
        style={{ opacity }}
      >
        <MandalaPattern
          size={800}
          rings={7}
          petals={12}
          color="#932E88"
          opacity={0.15}
        />
      </div>
      {/* Glow radial de fundo */}
      <div
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(ellipse at center, rgba(147,46,136,0.03) 0%, transparent 70%)',
        }}
      />
    </div>
  )
}
