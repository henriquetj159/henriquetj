/**
 * Events data access layer
 * Provides typed queries for public event listing
 */
import { prisma } from '@ciclo/database'

export async function getPublishedEvents() {
  return prisma.event.findMany({
    where: {
      isPublished: true,
      isDeleted: false,
    },
    orderBy: { startDate: 'asc' },
    include: {
      ticketTypes: {
        orderBy: { regularPrice: 'asc' },
      },
      images: {
        orderBy: { order: 'asc' },
        take: 1,
      },
    },
  })
}

export async function getPublicEvent(slug: string) {
  return prisma.event.findFirst({
    where: {
      slug,
      isPublished: true,
      isDeleted: false,
    },
    include: {
      ticketTypes: {
        orderBy: { regularPrice: 'asc' },
      },
      images: {
        orderBy: { order: 'asc' },
      },
      activities: {
        orderBy: { order: 'asc' },
        include: {
          facilitator: true,
        },
      },
      eventFacilitators: {
        include: {
          facilitator: true,
        },
      },
      faqs: {
        orderBy: { order: 'asc' },
      },
      cancellationPolicy: true,
    },
  })
}

export async function getUpcomingEvents(limit = 4) {
  return prisma.event.findMany({
    where: {
      isPublished: true,
      isDeleted: false,
      startDate: { gte: new Date() },
    },
    orderBy: { startDate: 'asc' },
    take: limit,
    include: {
      ticketTypes: {
        orderBy: { regularPrice: 'asc' },
        take: 1,
      },
    },
  })
}
