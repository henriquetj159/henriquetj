/**
 * Webhook Signature Validation Utilities
 * Story E3.3 — AC-1, AC-2: HMAC signature validation for MercadoPago and Stripe
 *
 * Uses Node.js crypto module only — no external dependencies.
 * NEVER process a webhook without valid signature — return 403.
 */

import { createHmac, timingSafeEqual } from 'crypto'

// ============================================================
// MercadoPago Signature Validation
// ============================================================

/**
 * Validates MercadoPago webhook HMAC-SHA256 signature.
 *
 * MercadoPago sends the signature in the `x-signature` header with format:
 * `ts=<timestamp>,v1=<hash>`
 *
 * The hash is computed as HMAC-SHA256 of:
 * `id:<data_id>;request-id:<x-request-id>;ts:<timestamp>;`
 *
 * @param dataId - The data.id from the webhook body
 * @param xRequestId - The x-request-id header value
 * @param xSignature - The x-signature header value
 * @param secret - MP_WEBHOOK_SECRET environment variable
 * @returns true if signature is valid
 */
export function validateMercadoPagoSignature(
  dataId: string,
  xRequestId: string,
  xSignature: string,
  secret: string
): boolean {
  if (!xSignature || !secret) {
    return false
  }

  // Parse ts and v1 from x-signature header
  const parts = xSignature.split(',')
  let ts = ''
  let hash = ''

  for (const part of parts) {
    const [key, value] = part.split('=')
    if (key?.trim() === 'ts') {
      ts = value?.trim() || ''
    }
    if (key?.trim() === 'v1') {
      hash = value?.trim() || ''
    }
  }

  if (!ts || !hash) {
    return false
  }

  // Build the manifest string as per MP documentation
  const manifest = `id:${dataId};request-id:${xRequestId};ts:${ts};`

  const expectedHash = createHmac('sha256', secret)
    .update(manifest)
    .digest('hex')

  // Use timing-safe comparison to prevent timing attacks
  try {
    const expectedBuffer = Buffer.from(expectedHash, 'hex')
    const receivedBuffer = Buffer.from(hash, 'hex')

    if (expectedBuffer.length !== receivedBuffer.length) {
      return false
    }

    return timingSafeEqual(expectedBuffer, receivedBuffer)
  } catch {
    return false
  }
}

// ============================================================
// Stripe Signature Validation
// ============================================================

/**
 * Validates Stripe webhook signature.
 *
 * Stripe sends the signature in the `stripe-signature` header with format:
 * `t=<timestamp>,v1=<signature>[,v1=<signature>...]`
 *
 * The signature is computed as HMAC-SHA256 of:
 * `<timestamp>.<raw_body>`
 *
 * @param payload - Raw request body as string
 * @param sigHeader - The stripe-signature header value
 * @param secret - STRIPE_WEBHOOK_SECRET environment variable
 * @param toleranceSeconds - Max age of event in seconds (default: 300 = 5 min)
 * @returns true if signature is valid
 */
export function validateStripeSignature(
  payload: string,
  sigHeader: string,
  secret: string,
  toleranceSeconds = 300
): boolean {
  if (!sigHeader || !secret) {
    return false
  }

  // Parse header parts
  const elements = sigHeader.split(',')
  let timestamp = ''
  const signatures: string[] = []

  for (const element of elements) {
    const [key, value] = element.split('=')
    if (key?.trim() === 't') {
      timestamp = value?.trim() || ''
    }
    if (key?.trim() === 'v1') {
      const sig = value?.trim()
      if (sig) {
        signatures.push(sig)
      }
    }
  }

  if (!timestamp || signatures.length === 0) {
    return false
  }

  // Check timestamp tolerance to prevent replay attacks
  const timestampNum = parseInt(timestamp, 10)
  if (isNaN(timestampNum)) {
    return false
  }

  const now = Math.floor(Date.now() / 1000)
  if (Math.abs(now - timestampNum) > toleranceSeconds) {
    return false
  }

  // Compute expected signature
  const signedPayload = `${timestamp}.${payload}`
  const expectedSignature = createHmac('sha256', secret)
    .update(signedPayload)
    .digest('hex')

  // Check if any of the provided v1 signatures match
  const expectedBuffer = Buffer.from(expectedSignature, 'hex')

  for (const sig of signatures) {
    try {
      const receivedBuffer = Buffer.from(sig, 'hex')

      if (
        expectedBuffer.length === receivedBuffer.length &&
        timingSafeEqual(expectedBuffer, receivedBuffer)
      ) {
        return true
      }
    } catch {
      // Invalid hex in signature, skip
      continue
    }
  }

  return false
}
