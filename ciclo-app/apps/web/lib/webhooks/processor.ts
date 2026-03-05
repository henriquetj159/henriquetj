/**
 * Webhook Payment Processor
 * Story E3.3 — AC-3 to AC-7: Shared processing logic for payment events
 *
 * All operations run in Prisma $transaction for consistency.
 * Idempotent: always checks if payment was already processed.
 * Structured JSON logs for observability.
 */

import { prisma } from '@ciclo/database'
import { sendConfirmationEmail } from '@ciclo/email'
import { generateRegistrationQR } from '../qrcode-generator'

// ============================================================
// Types
// ============================================================

interface WebhookLog {
  event_type: string
  payment_id: string
  registration_id: string
  status_before: string
  status_after: string
  processed_at: string
}

interface ProcessResult {
  success: boolean
  alreadyProcessed: boolean
  paymentId: string | null
  error?: string
}

// ============================================================
// Helpers
// ============================================================

function logWebhookEvent(log: WebhookLog): void {
  console.log(JSON.stringify(log))
}

// ============================================================
// Payment Confirmed (AC-4)
// ============================================================

/**
 * Processes a confirmed payment event.
 * Updates Payment.status = APPROVED, Registration.status = CONFIRMED,
 * increments TicketType.quantitySold, triggers email placeholder.
 *
 * @param externalId - The gateway external payment ID (stripeId or mercadoPagoId)
 * @param gateway - 'stripe' or 'mercadopago' to determine which field to match
 */
export async function processPaymentConfirmed(
  externalId: string,
  gateway: 'stripe' | 'mercadopago'
): Promise<ProcessResult> {
  try {
    // Find payment by external ID
    const whereClause = gateway === 'stripe'
      ? { stripeId: externalId }
      : { mercadoPagoId: externalId }

    const payment = await prisma.payment.findFirst({
      where: whereClause,
      include: {
        registration: {
          select: {
            id: true,
            status: true,
            ticketTypeId: true,
          },
        },
      },
    })

    if (!payment) {
      return {
        success: false,
        alreadyProcessed: false,
        paymentId: null,
        error: `Payment not found for ${gateway} externalId: ${externalId}`,
      }
    }

    // Idempotency check: already confirmed
    if (payment.status === 'APPROVED') {
      logWebhookEvent({
        event_type: 'payment.confirmed.duplicate',
        payment_id: payment.id,
        registration_id: payment.registrationId,
        status_before: payment.status,
        status_after: 'APPROVED',
        processed_at: new Date().toISOString(),
      })

      return {
        success: true,
        alreadyProcessed: true,
        paymentId: payment.id,
      }
    }

    const statusBefore = payment.status

    // Atomic transaction: update payment + registration + ticket sold count
    await prisma.$transaction([
      prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: 'APPROVED',
          confirmedAt: new Date(),
        },
      }),
      prisma.registration.update({
        where: { id: payment.registrationId },
        data: { status: 'CONFIRMED' },
      }),
      prisma.ticketType.update({
        where: { id: payment.registration.ticketTypeId },
        data: {
          quantitySold: { increment: 1 },
        },
      }),
    ])

    logWebhookEvent({
      event_type: 'payment.confirmed',
      payment_id: payment.id,
      registration_id: payment.registrationId,
      status_before: statusBefore,
      status_after: 'APPROVED',
      processed_at: new Date().toISOString(),
    })

    // E3.4: Generate QR Code for offline check-in (non-blocking)
    generateRegistrationQR(payment.registrationId).catch((qrError) => {
      console.error(JSON.stringify({
        event_type: 'qr.generation.error',
        registration_id: payment.registrationId,
        error: qrError instanceof Error ? qrError.message : 'Unknown error',
        processed_at: new Date().toISOString(),
      }))
    })

    // E4.1: Send confirmation email (non-blocking)
    sendConfirmationEmail(payment.registrationId).catch((emailError) => {
      console.error(JSON.stringify({
        event_type: 'email.confirmation.error',
        registration_id: payment.registrationId,
        error: emailError instanceof Error ? emailError.message : 'Unknown error',
        processed_at: new Date().toISOString(),
      }))
    })

    return {
      success: true,
      alreadyProcessed: false,
      paymentId: payment.id,
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error(JSON.stringify({
      event_type: 'payment.confirmed.error',
      external_id: externalId,
      gateway,
      error: message,
      processed_at: new Date().toISOString(),
    }))

    return {
      success: false,
      alreadyProcessed: false,
      paymentId: null,
      error: message,
    }
  }
}

// ============================================================
// Payment Failed (AC-5)
// ============================================================

/**
 * Processes a failed payment event.
 * Updates Payment.status = DECLINED. Registration stays PENDING.
 *
 * @param externalId - The gateway external payment ID
 * @param gateway - 'stripe' or 'mercadopago'
 */
export async function processPaymentFailed(
  externalId: string,
  gateway: 'stripe' | 'mercadopago'
): Promise<ProcessResult> {
  try {
    const whereClause = gateway === 'stripe'
      ? { stripeId: externalId }
      : { mercadoPagoId: externalId }

    const payment = await prisma.payment.findFirst({
      where: whereClause,
    })

    if (!payment) {
      return {
        success: false,
        alreadyProcessed: false,
        paymentId: null,
        error: `Payment not found for ${gateway} externalId: ${externalId}`,
      }
    }

    // Idempotency check: already failed
    if (payment.status === 'DECLINED') {
      return {
        success: true,
        alreadyProcessed: true,
        paymentId: payment.id,
      }
    }

    const statusBefore = payment.status

    await prisma.payment.update({
      where: { id: payment.id },
      data: { status: 'DECLINED' },
    })

    logWebhookEvent({
      event_type: 'payment.failed',
      payment_id: payment.id,
      registration_id: payment.registrationId,
      status_before: statusBefore,
      status_after: 'DECLINED',
      processed_at: new Date().toISOString(),
    })

    return {
      success: true,
      alreadyProcessed: false,
      paymentId: payment.id,
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error(JSON.stringify({
      event_type: 'payment.failed.error',
      external_id: externalId,
      gateway,
      error: message,
      processed_at: new Date().toISOString(),
    }))

    return {
      success: false,
      alreadyProcessed: false,
      paymentId: null,
      error: message,
    }
  }
}

// ============================================================
// Payment Refunded (AC-6)
// ============================================================

/**
 * Processes a refund event.
 * Updates Payment.status = REFUNDED, Registration.status = REFUNDED.
 *
 * @param externalId - The gateway external payment ID
 * @param gateway - 'stripe' or 'mercadopago'
 */
export async function processPaymentRefunded(
  externalId: string,
  gateway: 'stripe' | 'mercadopago'
): Promise<ProcessResult> {
  try {
    const whereClause = gateway === 'stripe'
      ? { stripeId: externalId }
      : { mercadoPagoId: externalId }

    const payment = await prisma.payment.findFirst({
      where: whereClause,
    })

    if (!payment) {
      return {
        success: false,
        alreadyProcessed: false,
        paymentId: null,
        error: `Payment not found for ${gateway} externalId: ${externalId}`,
      }
    }

    // Idempotency check: already refunded
    if (payment.status === 'REFUNDED') {
      return {
        success: true,
        alreadyProcessed: true,
        paymentId: payment.id,
      }
    }

    const statusBefore = payment.status

    await prisma.$transaction([
      prisma.payment.update({
        where: { id: payment.id },
        data: { status: 'REFUNDED' },
      }),
      prisma.registration.update({
        where: { id: payment.registrationId },
        data: { status: 'REFUNDED' },
      }),
    ])

    logWebhookEvent({
      event_type: 'payment.refunded',
      payment_id: payment.id,
      registration_id: payment.registrationId,
      status_before: statusBefore,
      status_after: 'REFUNDED',
      processed_at: new Date().toISOString(),
    })

    return {
      success: true,
      alreadyProcessed: false,
      paymentId: payment.id,
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error(JSON.stringify({
      event_type: 'payment.refunded.error',
      external_id: externalId,
      gateway,
      error: message,
      processed_at: new Date().toISOString(),
    }))

    return {
      success: false,
      alreadyProcessed: false,
      paymentId: null,
      error: message,
    }
  }
}
