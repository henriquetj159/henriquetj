/**
 * POST /api/webhooks/stripe
 * Story E3.3 — AC-2: Stripe webhook endpoint
 *
 * Validates signature using crypto HMAC with STRIPE_WEBHOOK_SECRET.
 * No Stripe SDK — manual fetch-based implementation.
 * Returns 200 immediately, processes async.
 * Handles: payment_intent.succeeded, payment_intent.payment_failed, charge.refunded
 * Idempotent: checks Payment.stripeId before processing.
 */

import { NextResponse } from 'next/server'
import { validateStripeSignature } from '@/webhooks/signature'
import {
  processPaymentConfirmed,
  processPaymentFailed,
  processPaymentRefunded,
} from '@/webhooks/processor'

// ============================================================
// Types
// ============================================================

interface StripeEvent {
  id: string
  object: string
  type: string
  data: {
    object: StripePaymentIntent | StripeCharge
  }
}

interface StripePaymentIntent {
  id: string
  object: 'payment_intent'
  status: string
  metadata?: Record<string, string>
}

interface StripeCharge {
  id: string
  object: 'charge'
  payment_intent?: string
  refunded: boolean
  metadata?: Record<string, string>
}

// ============================================================
// Helper: Extract payment intent ID from event
// ============================================================

function extractPaymentIntentId(event: StripeEvent): string | null {
  const obj = event.data.object

  if (obj.object === 'payment_intent') {
    return (obj as StripePaymentIntent).id
  }

  if (obj.object === 'charge') {
    return (obj as StripeCharge).payment_intent || null
  }

  return null
}

// ============================================================
// Route Handler
// ============================================================

export async function POST(request: Request): Promise<NextResponse> {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

  if (!webhookSecret) {
    console.error(JSON.stringify({
      event_type: 'webhook.stripe.config_error',
      error: 'STRIPE_WEBHOOK_SECRET not configured',
      processed_at: new Date().toISOString(),
    }))
    return NextResponse.json({ error: 'Server misconfigured' }, { status: 500 })
  }

  // Read raw body for signature validation
  const rawBody = await request.text()
  const sigHeader = request.headers.get('stripe-signature') || ''

  // Validate signature — NEVER process without valid signature
  const isValid = validateStripeSignature(rawBody, sigHeader, webhookSecret)

  if (!isValid) {
    console.warn(JSON.stringify({
      event_type: 'webhook.stripe.signature_invalid',
      processed_at: new Date().toISOString(),
    }))
    return NextResponse.json({ error: 'Invalid signature' }, { status: 403 })
  }

  let event: StripeEvent

  try {
    event = JSON.parse(rawBody) as StripeEvent
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  // Return 200 immediately — process async
  const responsePromise = NextResponse.json({ received: true }, { status: 200 })

  // Only process payment-related events
  const handledEvents = [
    'payment_intent.succeeded',
    'payment_intent.payment_failed',
    'charge.refunded',
  ]

  if (handledEvents.includes(event.type)) {
    // Process asynchronously (fire and forget with error logging)
    processStripeEvent(event).catch((error) => {
      console.error(JSON.stringify({
        event_type: 'webhook.stripe.process_error',
        stripe_event_id: event.id,
        stripe_event_type: event.type,
        error: error instanceof Error ? error.message : 'Unknown error',
        processed_at: new Date().toISOString(),
      }))
    })
  }

  return responsePromise
}

// ============================================================
// Async Event Processing
// ============================================================

async function processStripeEvent(event: StripeEvent): Promise<void> {
  const paymentIntentId = extractPaymentIntentId(event)

  if (!paymentIntentId) {
    console.warn(JSON.stringify({
      event_type: 'webhook.stripe.no_payment_intent',
      stripe_event_id: event.id,
      stripe_event_type: event.type,
      processed_at: new Date().toISOString(),
    }))
    return
  }

  console.log(JSON.stringify({
    event_type: 'webhook.stripe.processing',
    stripe_event_id: event.id,
    stripe_event_type: event.type,
    payment_intent_id: paymentIntentId,
    processed_at: new Date().toISOString(),
  }))

  switch (event.type) {
    case 'payment_intent.succeeded':
      await processPaymentConfirmed(paymentIntentId, 'stripe')
      break

    case 'payment_intent.payment_failed':
      await processPaymentFailed(paymentIntentId, 'stripe')
      break

    case 'charge.refunded':
      await processPaymentRefunded(paymentIntentId, 'stripe')
      break
  }
}
