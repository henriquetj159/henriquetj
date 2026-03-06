'use client'

import * as React from 'react'
import { cn } from '../../lib/utils'
import { MandalaPattern } from '../../patterns/mandala-pattern'

interface HeroSacredProps extends React.HTMLAttributes<HTMLElement> {
  title: string
  subtitle?: string
  gradient?: 'violet' | 'aurora' | 'mandala' | 'triskle'
  showMandala?: boolean
}

const GRADIENT_MAP = {
  violet: 'bg-gradient-violet-freq',
  aurora: 'bg-gradient-aurora',
  mandala: 'bg-gradient-mandala',
  triskle: 'bg-gradient-triskle',
} as const

export function HeroSacred({
  title,
  subtitle,
  gradient = 'violet',
  showMandala = true,
  className,
  children,
  ...props
}: HeroSacredProps) {
  return (
    <section
      className={cn(
        'relative flex min-h-[60vh] flex-col items-center justify-center overflow-hidden px-4 py-20 text-center',
        GRADIENT_MAP[gradient],
        className,
      )}
      {...props}
    >
      {/* Mandala de fundo animada */}
      {showMandala && (
        <div
          className="pointer-events-none absolute inset-0 flex items-center justify-center"
          aria-hidden="true"
        >
          <div className="animate-mandala-slow opacity-[0.06]">
            <MandalaPattern
              size={900}
              rings={8}
              petals={16}
              color="#FAE8FF"
              opacity={0.3}
            />
          </div>
        </div>
      )}

      {/* Crown chakra glow no topo */}
      <div
        className="pointer-events-none absolute left-0 right-0 top-0 h-40"
        style={{
          background: 'radial-gradient(ellipse at 50% 0%, rgba(250,232,255,0.15) 0%, transparent 70%)',
        }}
        aria-hidden="true"
      />

      {/* Conteudo */}
      <div className="animate-in-ethereal relative z-10 max-w-4xl">
        <h1 className="font-heading text-hero font-bold tracking-tight text-white">
          <span className="text-glow-violet">{title}</span>
        </h1>
        {subtitle && (
          <p className="mt-4 font-accent text-xl text-violet-100/80 sm:text-2xl">
            {subtitle}
          </p>
        )}
        {children && (
          <div className="mt-8">
            {children}
          </div>
        )}
      </div>

      {/* Fade inferior */}
      <div
        className="pointer-events-none absolute bottom-0 left-0 right-0 h-24"
        style={{
          background: 'linear-gradient(to top, var(--season-bg), transparent)',
        }}
        aria-hidden="true"
      />
    </section>
  )
}
