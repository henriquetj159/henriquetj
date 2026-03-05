'use server'

import { prisma } from '@ciclo/database'

// ============================================================
// Types
// ============================================================

export type DashboardPeriod = '7d' | '30d' | '90d' | 'total'

export interface DashboardKPIs {
  totalRegistrations: number
  totalRevenue: number // centavos
  averageOccupancy: number // percentage 0-100
  totalLeads: number
}

export interface SalesByEventItem {
  id: string
  name: string
  season: string
  confirmedRegistrations: number
  totalCapacity: number | null
}

export interface RevenueByDay {
  date: string // YYYY-MM-DD
  revenue: number // centavos
}

export interface UpcomingEventItem {
  id: string
  name: string
  slug: string
  season: string
  startDate: Date
  capacity: number | null
  confirmedRegistrations: number
  occupancyPercent: number
}

export interface RecentRegistrationItem {
  id: string
  userName: string
  eventName: string
  ticketName: string
  amount: number // centavos
  status: string
  createdAt: Date
}

export interface RecentLeadItem {
  id: string
  email: string
  interestedSeasons: string[]
  createdAt: Date
}

// ============================================================
// Helpers
// ============================================================

function getPeriodStartDate(period: DashboardPeriod): Date | null {
  if (period === 'total') return null
  const now = new Date()
  const days = period === '7d' ? 7 : period === '30d' ? 30 : 90
  return new Date(now.getTime() - days * 24 * 60 * 60 * 1000)
}

// ============================================================
// Server Actions
// ============================================================

export async function getDashboardKPIs(
  period: DashboardPeriod = '30d',
): Promise<DashboardKPIs> {
  try {
    const startDate = getPeriodStartDate(period)

    const dateFilter = startDate ? { createdAt: { gte: startDate } } : {}

    // Total confirmed registrations in period
    const totalRegistrations = await prisma.registration.count({
      where: {
        status: 'CONFIRMED',
        ...dateFilter,
      },
    })

    // Total revenue (sum of confirmed payments) in period
    const revenueResult = await prisma.payment.aggregate({
      _sum: { amount: true },
      where: {
        status: 'APPROVED',
        ...dateFilter,
      },
    })
    const totalRevenue = revenueResult._sum.amount ?? 0

    // Average occupancy across published events
    const publishedEvents = await prisma.event.findMany({
      where: {
        isPublished: true,
        isDeleted: false,
        capacity: { not: null },
      },
      select: {
        capacity: true,
        _count: {
          select: {
            registrations: {
              where: { status: 'CONFIRMED' },
            },
          },
        },
      },
    })

    let averageOccupancy = 0
    if (publishedEvents.length > 0) {
      const totalOccupancy = publishedEvents.reduce((sum, event) => {
        const cap = event.capacity ?? 1
        const pct = (event._count.registrations / cap) * 100
        return sum + Math.min(pct, 100)
      }, 0)
      averageOccupancy = Math.round(totalOccupancy / publishedEvents.length)
    }

    // Total leads in period
    const totalLeads = await prisma.lead.count({
      where: dateFilter,
    })

    return { totalRegistrations, totalRevenue, averageOccupancy, totalLeads }
  } catch (error) {
    console.error('Failed to fetch dashboard KPIs:', error)
    return {
      totalRegistrations: 0,
      totalRevenue: 0,
      averageOccupancy: 0,
      totalLeads: 0,
    }
  }
}

export async function getSalesByEvent(): Promise<SalesByEventItem[]> {
  try {
    const events = await prisma.event.findMany({
      where: {
        isPublished: true,
        isDeleted: false,
      },
      select: {
        id: true,
        name: true,
        season: true,
        capacity: true,
        _count: {
          select: {
            registrations: {
              where: { status: 'CONFIRMED' },
            },
          },
        },
      },
      orderBy: { startDate: 'desc' },
      take: 10,
    })

    return events.map((event) => ({
      id: event.id,
      name: event.name,
      season: event.season,
      confirmedRegistrations: event._count.registrations,
      totalCapacity: event.capacity,
    }))
  } catch (error) {
    console.error('Failed to fetch sales by event:', error)
    return []
  }
}

export async function getRevenueOverTime(
  days: number = 30,
): Promise<RevenueByDay[]> {
  try {
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)
    startDate.setHours(0, 0, 0, 0)

    const payments = await prisma.payment.findMany({
      where: {
        status: 'APPROVED',
        createdAt: { gte: startDate },
      },
      select: {
        amount: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'asc' },
    })

    // Group by day
    const revenueMap = new Map<string, number>()

    // Pre-fill all days with 0
    for (let i = 0; i <= days; i++) {
      const d = new Date(startDate)
      d.setDate(d.getDate() + i)
      const key = d.toISOString().slice(0, 10)
      revenueMap.set(key, 0)
    }

    // Sum actual payments
    for (const payment of payments) {
      const key = payment.createdAt.toISOString().slice(0, 10)
      revenueMap.set(key, (revenueMap.get(key) ?? 0) + payment.amount)
    }

    return Array.from(revenueMap.entries()).map(([date, revenue]) => ({
      date,
      revenue,
    }))
  } catch (error) {
    console.error('Failed to fetch revenue over time:', error)
    return []
  }
}

export async function getUpcomingEvents(
  limit: number = 5,
): Promise<UpcomingEventItem[]> {
  try {
    const events = await prisma.event.findMany({
      where: {
        isPublished: true,
        isDeleted: false,
        startDate: { gte: new Date() },
      },
      select: {
        id: true,
        name: true,
        slug: true,
        season: true,
        startDate: true,
        capacity: true,
        _count: {
          select: {
            registrations: {
              where: { status: 'CONFIRMED' },
            },
          },
        },
      },
      orderBy: { startDate: 'asc' },
      take: limit,
    })

    return events.map((event) => {
      const confirmed = event._count.registrations
      const cap = event.capacity
      const occupancyPercent = cap
        ? Math.min(Math.round((confirmed / cap) * 100), 100)
        : 0

      return {
        id: event.id,
        name: event.name,
        slug: event.slug,
        season: event.season,
        startDate: event.startDate,
        capacity: event.capacity,
        confirmedRegistrations: confirmed,
        occupancyPercent,
      }
    })
  } catch (error) {
    console.error('Failed to fetch upcoming events:', error)
    return []
  }
}

export async function getRecentRegistrations(
  limit: number = 5,
): Promise<RecentRegistrationItem[]> {
  try {
    const registrations = await prisma.registration.findMany({
      select: {
        id: true,
        status: true,
        createdAt: true,
        user: {
          select: { name: true },
        },
        event: {
          select: { name: true },
        },
        ticketType: {
          select: { name: true },
        },
        payments: {
          select: { amount: true },
          where: { status: 'APPROVED' },
          take: 1,
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    })

    return registrations.map((reg) => ({
      id: reg.id,
      userName: reg.user.name,
      eventName: reg.event.name,
      ticketName: reg.ticketType.name,
      amount: reg.payments[0]?.amount ?? 0,
      status: reg.status,
      createdAt: reg.createdAt,
    }))
  } catch (error) {
    console.error('Failed to fetch recent registrations:', error)
    return []
  }
}

export async function getRecentLeads(
  limit: number = 5,
): Promise<RecentLeadItem[]> {
  try {
    const leads = await prisma.lead.findMany({
      select: {
        id: true,
        email: true,
        interestedSeasons: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    })

    return leads.map((lead) => ({
      id: lead.id,
      email: lead.email,
      interestedSeasons: lead.interestedSeasons,
      createdAt: lead.createdAt,
    }))
  } catch (error) {
    console.error('Failed to fetch recent leads:', error)
    return []
  }
}
