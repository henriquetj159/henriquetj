'use client'

/**
 * Client wrapper for registration layout
 * Story E3.1 — AC-10, AC-11: RegistrationProvider + StepIndicator
 *
 * Separated because layout.tsx is a Server Component,
 * but we need Client Components for context and interactivity.
 */

import { usePathname } from 'next/navigation'
import { RegistrationProvider } from '@/registration/registration-provider'
import { StepIndicator } from '@/registration/step-indicator'
import type { ReactNode } from 'react'

interface RegistrationLayoutClientProps {
  children: ReactNode
  eventSlug: string
  isSoldOut: boolean
}

function getStepFromPath(pathname: string): number {
  if (pathname.includes('/pagamento')) return 3
  if (pathname.includes('/dados')) return 2
  return 1
}

export function RegistrationLayoutClient({
  children,
  eventSlug,
  isSoldOut: _isSoldOut,
}: RegistrationLayoutClientProps) {
  const pathname = usePathname()
  const currentStep = getStepFromPath(pathname)

  // Don't show step indicator on sold-out page
  const isSoldOutPage = pathname.includes('/esgotado')

  return (
    <RegistrationProvider eventSlug={eventSlug}>
      {!isSoldOutPage && <StepIndicator currentStep={currentStep} />}
      {children}
    </RegistrationProvider>
  )
}
