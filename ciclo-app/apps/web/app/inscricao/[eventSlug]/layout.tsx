/**
 * Registration flow layout with step indicator
 * Story E3.1 — AC-10: Shared layout for all checkout steps
 *
 * Server Component wrapper that loads event data.
 * RegistrationProvider (Client) wraps children for state management.
 */

import { notFound } from 'next/navigation'
import { prisma } from '@ciclo/database'
import { RegistrationLayoutClient } from '@/registration/registration-layout-client'

interface LayoutProps {
  children: React.ReactNode
  params: Promise<{ eventSlug: string }>
}

async function getEventSummary(slug: string) {
  return prisma.event.findFirst({
    where: { slug, isPublished: true, isDeleted: false },
    select: {
      id: true,
      slug: true,
      name: true,
      subtitle: true,
      startDate: true,
      endDate: true,
      venue: true,
      isSoldOut: true,
      ticketTypes: {
        select: {
          id: true,
          quantityAvailable: true,
          quantitySold: true,
        },
      },
    },
  })
}

export default async function RegistrationLayout({
  children,
  params,
}: LayoutProps) {
  const { eventSlug } = await params
  const event = await getEventSummary(eventSlug)

  if (!event) notFound()

  // Check if all tickets are sold out
  const allSoldOut =
    event.isSoldOut ||
    event.ticketTypes.every(
      (t) =>
        t.quantityAvailable !== null && t.quantitySold >= t.quantityAvailable
    )

  return (
    <RegistrationLayoutClient eventSlug={eventSlug} isSoldOut={allSoldOut}>
      <div className="mx-auto max-w-2xl px-4 py-8">
        {/* Event header */}
        <div className="mb-6 text-center">
          <h1 className="font-heading text-2xl font-bold text-foreground">
            {event.name}
          </h1>
          {event.subtitle && (
            <p className="mt-1 text-sm text-muted-foreground">
              {event.subtitle}
            </p>
          )}
          {event.venue && (
            <p className="mt-1 text-xs text-muted-foreground">
              {event.venue}
            </p>
          )}
        </div>

        {children}
      </div>
    </RegistrationLayoutClient>
  )
}
