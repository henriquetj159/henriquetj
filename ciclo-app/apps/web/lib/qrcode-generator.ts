/**
 * QR Code Generation for Confirmed Registrations
 * Story E3.4 — AC-1, AC-2: Generate signed QR payload and store in Registration
 *
 * Called after payment confirmation to generate the offline-first QR code data.
 * The signed payload is stored in Registration.qrCode field.
 */

import { prisma } from '@ciclo/database'
import { createSignedQRPayload } from '@ciclo/utils'
import type { QRPayload } from '@ciclo/utils'

/**
 * Generates a signed QR payload for a confirmed registration
 * and saves it to the Registration.qrCode field.
 *
 * @param registrationId - The registration to generate QR for
 * @returns The signed QR payload string, or null if registration not found
 */
export async function generateRegistrationQR(
  registrationId: string
): Promise<string | null> {
  const secret = process.env.QR_SECRET

  if (!secret) {
    console.error(JSON.stringify({
      event_type: 'qr.generation.error',
      registration_id: registrationId,
      error: 'QR_SECRET environment variable not configured',
      timestamp: new Date().toISOString(),
    }))
    return null
  }

  // Load registration with related data for the QR payload
  const registration = await prisma.registration.findUnique({
    where: { id: registrationId },
    include: {
      event: {
        select: {
          slug: true,
          startDate: true,
        },
      },
      ticketType: {
        select: { name: true },
      },
      user: {
        select: { name: true },
      },
    },
  })

  if (!registration) {
    console.error(JSON.stringify({
      event_type: 'qr.generation.error',
      registration_id: registrationId,
      error: 'Registration not found',
      timestamp: new Date().toISOString(),
    }))
    return null
  }

  // Skip if QR already generated (idempotency)
  if (registration.qrCode) {
    console.log(JSON.stringify({
      event_type: 'qr.generation.skip',
      registration_id: registrationId,
      reason: 'QR code already exists',
      timestamp: new Date().toISOString(),
    }))
    return registration.qrCode
  }

  // Build QR payload with all data needed for offline verification
  const qrPayload: QRPayload = {
    registrationId: registration.id,
    eventSlug: registration.event.slug,
    participantName: registration.user.name ?? 'Participante',
    ticketTypeName: registration.ticketType.name,
    eventDate: registration.event.startDate.toISOString().split('T')[0] ?? '',
  }

  const signedPayload = createSignedQRPayload(qrPayload, secret)

  // Store signed payload in Registration.qrCode field
  await prisma.registration.update({
    where: { id: registrationId },
    data: { qrCode: signedPayload },
  })

  console.log(JSON.stringify({
    event_type: 'qr.generation.success',
    registration_id: registrationId,
    event_slug: registration.event.slug,
    timestamp: new Date().toISOString(),
  }))

  return signedPayload
}
