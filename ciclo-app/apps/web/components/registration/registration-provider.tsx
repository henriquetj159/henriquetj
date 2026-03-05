'use client'

/**
 * Registration flow state management (Context + sessionStorage)
 * Story E3.1 — AC-11: State persistence between steps
 *
 * Stores form data in sessionStorage with base64 encoding for CPF.
 * Provides context to all registration step components.
 */

import { createContext, useContext, useCallback, useState, useEffect } from 'react'
import type { ReactNode } from 'react'

// ============================================================
// Types
// ============================================================

export interface RegistrationData {
  // Step 1: Ticket selection
  ticketTypeId: string
  ticketName: string
  ticketPrice: number // centavos
  pricingTier: string

  // Step 2: Participant data
  name: string
  email: string
  phone: string
  cpf: string // stored encoded in sessionStorage
  dietaryRestrictions: string
  isFirstTime: boolean | null

  // Step 3: Payment
  paymentMethod: 'PIX' | 'BOLETO' | 'CREDIT_CARD' | ''
  accommodationId: string
  accommodationNights: number
  accommodationPrice: number // centavos per night
  accommodationName: string
}

interface RegistrationContextValue {
  data: RegistrationData
  updateData: (partial: Partial<RegistrationData>) => void
  clearData: () => void
  currentStep: number
}

// ============================================================
// Constants
// ============================================================

const STORAGE_KEY = 'ciclo-registration'

const INITIAL_DATA: RegistrationData = {
  ticketTypeId: '',
  ticketName: '',
  ticketPrice: 0,
  pricingTier: '',
  name: '',
  email: '',
  phone: '',
  cpf: '',
  dietaryRestrictions: '',
  isFirstTime: null,
  paymentMethod: '',
  accommodationId: '',
  accommodationNights: 0,
  accommodationPrice: 0,
  accommodationName: '',
}

// ============================================================
// Encoding helpers (base64 for CPF in sessionStorage)
// ============================================================

function encodeForStorage(data: RegistrationData): string {
  const toStore = {
    ...data,
    cpf: data.cpf ? btoa(data.cpf) : '',
  }
  return JSON.stringify(toStore)
}

function decodeFromStorage(raw: string): RegistrationData {
  try {
    const parsed = JSON.parse(raw) as RegistrationData
    return {
      ...parsed,
      cpf: parsed.cpf ? atob(parsed.cpf) : '',
    }
  } catch {
    return { ...INITIAL_DATA }
  }
}

// ============================================================
// Context
// ============================================================

const RegistrationContext = createContext<RegistrationContextValue | null>(null)

export function useRegistration(): RegistrationContextValue {
  const ctx = useContext(RegistrationContext)
  if (!ctx) {
    throw new Error('useRegistration must be used within RegistrationProvider')
  }
  return ctx
}

// ============================================================
// Provider
// ============================================================

interface RegistrationProviderProps {
  children: ReactNode
  eventSlug: string
}

export function RegistrationProvider({
  children,
  eventSlug,
}: RegistrationProviderProps) {
  const storageKey = `${STORAGE_KEY}-${eventSlug}`

  const [data, setData] = useState<RegistrationData>(() => {
    if (typeof window === 'undefined') return { ...INITIAL_DATA }
    const stored = sessionStorage.getItem(storageKey)
    return stored ? decodeFromStorage(stored) : { ...INITIAL_DATA }
  })

  // Sync to sessionStorage on data change
  useEffect(() => {
    sessionStorage.setItem(storageKey, encodeForStorage(data))
  }, [data, storageKey])

  const updateData = useCallback((partial: Partial<RegistrationData>) => {
    setData((prev) => ({ ...prev, ...partial }))
  }, [])

  const clearData = useCallback(() => {
    setData({ ...INITIAL_DATA })
    sessionStorage.removeItem(storageKey)
  }, [storageKey])

  // Derive current step from data completeness
  let currentStep = 1
  if (data.ticketTypeId) currentStep = 2
  if (data.name && data.email && data.phone && data.cpf) currentStep = 3

  return (
    <RegistrationContext.Provider value={{ data, updateData, clearData, currentStep }}>
      {children}
    </RegistrationContext.Provider>
  )
}
