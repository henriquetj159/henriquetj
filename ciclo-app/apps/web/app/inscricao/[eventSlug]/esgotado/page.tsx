/**
 * Sold Out page — Event capacity reached
 * Story E3.1 — AC-12: Show sold out message + waitlist form
 *
 * Server Component loads event name, delegates waitlist form to client.
 */

import { notFound } from 'next/navigation'
import { prisma } from '@ciclo/database'
import { SoldOutClient } from '@/registration/sold-out-client'

interface PageProps {
  params: Promise<{ eventSlug: string }>
}

export default async function SoldOutPage({ params }: PageProps) {
  const { eventSlug } = await params

  const event = await prisma.event.findFirst({
    where: { slug: eventSlug },
    select: { name: true },
  })

  if (!event) notFound()

  return (
    <SoldOutClient
      eventSlug={eventSlug}
      eventName={event.name}
    />
  )
}
