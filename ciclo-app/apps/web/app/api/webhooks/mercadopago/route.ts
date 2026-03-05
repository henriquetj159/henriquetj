/**
 * POST /api/webhooks/mercadopago
 * Story E3.3 — AC-1: MercadoPago webhook endpoint
 *
 * Validates HMAC signature using MP_WEBHOOK_SECRET.
 * Returns 200 immediately, processes async.
 * Handles: payment.updated (approved/rejected/refunded)
 * Idempotent: checks Payment.mercadoPagoId before processing.
 */

import { NextResponse } from 'next/server'
import { validateMercadoPagoSignature } from '@/webhooks/signature'
import {
  processPaymentConfirmed,
  processPaymentFailed,
  processPaymentRefunded,
} from '@/webhooks/processor'

// ============================================================
// Types
// ============================================================

interface MercadoPagoWebhookBody {
  id: number
  live_mode: boolean
  type: string
  date_created: string
  user_id: number
  api_version: string
  action: string
  data: {
    id: string
  }
}

interface MercadoPagoPaymentResponse {
  id: number
  status: string
  external_reference?: string
}

// ============================================================
// Helper: Fetch payment details from MP API
// ============================================================

async function fetchMPPaymentDetails(
  paymentId: string
): Promise<MercadoPagoPaymentResponse | null> {
  const accessToken = process.env.MP_ACCESS_TOKEN
  if (!accessToken) {
    console.error(JSON.stringify({
      event_type: 'webhook.mercadopago.config_error',
      error: 'MP_ACCESS_TOKEN not set',
      processed_at: new Date().toISOString(),
    }))
    return null
  }

  const response = await fetch(
    `https://api.mercadopago.com/v1/payments/${paymentId}`,
    {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  )

  if (!response.ok) {
    console.error(JSON.stringify({
      event_type: 'webhook.mercadopago.api_error',
      payment_id: paymentId,
      http_status: response.status,
      processed_at: new Date().toISOString(),
    }))
    return null
  }

  return response.json() as Promise<MercadoPagoPaymentResponse>
}

// ============================================================
// Route Handler
// ============================================================

export async function POST(request: Request): Promise<NextResponse> {
  const webhookSecret = process.env.MP_WEBHOOK_SECRET

  if (!webhookSecret) {
    console.error(JSON.stringify({
      event_type: 'webhook.mercadopago.config_error',
      error: 'MP_WEBHOOK_SECRET not configured',
      processed_at: new Date().toISOString(),
    }))
    return NextResponse.json({ error: 'Server misconfigured' }, { status: 500 })
  }

  // Read raw body and headers for signature validation
  const rawBody = await request.text()
  const xSignature = request.headers.get('x-signature') || ''
  const xRequestId = request.headers.get('x-request-id') || ''

  let body: MercadoPagoWebhookBody

  try {
    body = JSON.parse(rawBody) as MercadoPagoWebhookBody
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  // Validate HMAC signature — NEVER process without valid signature
  const dataId = body.data?.id || ''
  const isValid = validateMercadoPagoSignature(
    dataId,
    xRequestId,
    xSignature,
    webhookSecret
  )

  if (!isValid) {
    console.warn(JSON.stringify({
      event_type: 'webhook.mercadopago.signature_invalid',
      data_id: dataId,
      processed_at: new Date().toISOString(),
    }))
    return NextResponse.json({ error: 'Invalid signature' }, { status: 403 })
  }

  // Return 200 immediately — process async
  // In Vercel, use waitUntil if available; otherwise process inline
  const responsePromise = NextResponse.json({ received: true }, { status: 200 })

  // Only process payment-related events
  if (body.type === 'payment') {
    // Process asynchronously (fire and forget with error logging)
    processPaymentEvent(body.data.id).catch((error) => {
      console.error(JSON.stringify({
        event_type: 'webhook.mercadopago.process_error',
        data_id: body.data.id,
        error: error instanceof Error ? error.message : 'Unknown error',
        processed_at: new Date().toISOString(),
      }))
    })
  }

  return responsePromise
}

// ============================================================
// Async Payment Processing
// ============================================================

async function processPaymentEvent(mpPaymentId: string): Promise<void> {
  // Fetch payment details from MercadoPago API to get current status
  const paymentDetails = await fetchMPPaymentDetails(mpPaymentId)

  if (!paymentDetails) {
    return
  }

  const externalId = String(paymentDetails.id)

  console.log(JSON.stringify({
    event_type: 'webhook.mercadopago.processing',
    mp_payment_id: externalId,
    mp_status: paymentDetails.status,
    processed_at: new Date().toISOString(),
  }))

  switch (paymentDetails.status) {
    case 'approved':
      await processPaymentConfirmed(externalId, 'mercadopago')
      break

    case 'rejected':
    case 'cancelled':
      await processPaymentFailed(externalId, 'mercadopago')
      break

    case 'refunded':
      await processPaymentRefunded(externalId, 'mercadopago')
      break

    default:
      // pending, in_process, authorized — no action needed
      console.log(JSON.stringify({
        event_type: 'webhook.mercadopago.status_ignored',
        mp_payment_id: externalId,
        mp_status: paymentDetails.status,
        processed_at: new Date().toISOString(),
      }))
      break
  }
}
