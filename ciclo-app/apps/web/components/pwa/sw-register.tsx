'use client'

import { useEffect } from 'react'

/**
 * Service Worker Registration Component
 *
 * Registers the service worker and handles updates.
 * Must be rendered as a client component in the root layout.
 */
export function SwRegister() {
  useEffect(() => {
    if (typeof window === 'undefined') return
    if (!('serviceWorker' in navigator)) return

    const registerSW = async () => {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js', {
          scope: '/',
        })

        // Check for updates periodically (every 60 minutes)
        const UPDATE_INTERVAL = 60 * 60 * 1000
        setInterval(() => {
          registration.update()
        }, UPDATE_INTERVAL)

        // Handle controller change (new SW activated)
        navigator.serviceWorker.addEventListener('controllerchange', () => {
          // New service worker has taken over — the page will use updated caches
          // No forced reload to avoid disrupting user experience
        })
      } catch (error) {
        console.error('Service Worker registration failed:', error)
      }
    }

    registerSW()
  }, [])

  return null
}
