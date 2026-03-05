/**
 * Step 2 — Participant Data Form (Server Component)
 * Story E3.1 — AC-3, AC-4: Collect participant info, pre-fill if authenticated
 *
 * Server Component loads user data if authenticated,
 * delegates form rendering to ParticipantFormClient.
 */

import { auth } from '@ciclo/auth'
import { prisma } from '@ciclo/database'
import { maskCPF } from '@/validation/cpf'
import { ParticipantFormClient } from '@/registration/participant-form-client'

interface PageProps {
  params: Promise<{ eventSlug: string }>
}

export default async function ParticipantDataPage({ params }: PageProps) {
  const { eventSlug } = await params
  const session = await auth()

  // AC-4: Pre-fill from authenticated user profile
  let prefillData: {
    name: string
    email: string
    phone: string
    cpf: string
  } | null = null

  if (session?.user?.id) {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        name: true,
        email: true,
        phone: true,
        cpf: true,
      },
    })

    if (user) {
      prefillData = {
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        cpf: user.cpf ? maskCPF(user.cpf) : '', // Masked for display (AC-4)
      }
    }
  }

  return (
    <ParticipantFormClient
      eventSlug={eventSlug}
      prefillData={prefillData}
    />
  )
}
