/**
 * Cron Job: Send Reminder and Feedback Emails
 * Story E4.1 — AC-6, AC-7: Daily cron sends reminders and feedback requests
 *
 * Vercel Cron calls GET /api/cron/send-reminders daily at 08:00 UTC.
 * Protected by CRON_SECRET header validation.
 *
 * Logic:
 * - Events starting in 7 days -> send 7d reminders to confirmed registrations
 * - Events starting in 1 day  -> send 24h reminders to confirmed registrations
 * - Events ended 2 days ago   -> send feedback emails to confirmed registrations
 */

import { NextResponse } from 'next/server'
import { prisma } from '@ciclo/database'
import {
  sendReminder7dEmail,
  sendReminder24hEmail,
  sendFeedbackEmail,
} from '@ciclo/email'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

interface CronResult {
  type: string
  sent: number
  skipped: number
  errors: number
}

export async function GET(request: Request): Promise<NextResponse> {
  // Verify CRON_SECRET for Vercel Cron protection
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const now = new Date()
  const results: CronResult[] = []

  try {
    // ============================================================
    // 7-Day Reminders
    // ============================================================
    const sevenDaysFromNow = new Date(now)
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7)
    const sevenDayStart = startOfDay(sevenDaysFromNow)
    const sevenDayEnd = endOfDay(sevenDaysFromNow)

    const reminder7dRegistrations = await prisma.registration.findMany({
      where: {
        status: 'CONFIRMED',
        emailReminder7dSent: false,
        event: {
          startDate: { gte: sevenDayStart, lte: sevenDayEnd },
          isDeleted: false,
        },
      },
      select: { id: true },
    })

    const reminder7dResult: CronResult = { type: 'reminder_7d', sent: 0, skipped: 0, errors: 0 }

    for (const reg of reminder7dRegistrations) {
      const result = await sendReminder7dEmail(reg.id)
      if (result.alreadySent) {
        reminder7dResult.skipped++
      } else if (result.success) {
        reminder7dResult.sent++
      } else {
        reminder7dResult.errors++
      }
    }

    results.push(reminder7dResult)

    // ============================================================
    // 24-Hour Reminders
    // ============================================================
    const oneDayFromNow = new Date(now)
    oneDayFromNow.setDate(oneDayFromNow.getDate() + 1)
    const oneDayStart = startOfDay(oneDayFromNow)
    const oneDayEnd = endOfDay(oneDayFromNow)

    const reminder24hRegistrations = await prisma.registration.findMany({
      where: {
        status: 'CONFIRMED',
        emailReminder24hSent: false,
        event: {
          startDate: { gte: oneDayStart, lte: oneDayEnd },
          isDeleted: false,
        },
      },
      select: { id: true },
    })

    const reminder24hResult: CronResult = { type: 'reminder_24h', sent: 0, skipped: 0, errors: 0 }

    for (const reg of reminder24hRegistrations) {
      const result = await sendReminder24hEmail(reg.id)
      if (result.alreadySent) {
        reminder24hResult.skipped++
      } else if (result.success) {
        reminder24hResult.sent++
      } else {
        reminder24hResult.errors++
      }
    }

    results.push(reminder24hResult)

    // ============================================================
    // Feedback Emails (48h after event end)
    // ============================================================
    const twoDaysAgo = new Date(now)
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2)
    const twoDaysAgoStart = startOfDay(twoDaysAgo)
    const twoDaysAgoEnd = endOfDay(twoDaysAgo)

    const feedbackRegistrations = await prisma.registration.findMany({
      where: {
        status: 'CONFIRMED',
        emailFeedbackSent: false,
        event: {
          endDate: { gte: twoDaysAgoStart, lte: twoDaysAgoEnd },
          isDeleted: false,
        },
      },
      select: { id: true },
    })

    const feedbackResult: CronResult = { type: 'feedback', sent: 0, skipped: 0, errors: 0 }

    for (const reg of feedbackRegistrations) {
      const result = await sendFeedbackEmail(reg.id)
      if (result.alreadySent) {
        feedbackResult.skipped++
      } else if (result.success) {
        feedbackResult.sent++
      } else {
        feedbackResult.errors++
      }
    }

    results.push(feedbackResult)

    // ============================================================
    // Response
    // ============================================================
    const totalSent = results.reduce((sum, r) => sum + r.sent, 0)
    const totalErrors = results.reduce((sum, r) => sum + r.errors, 0)

    console.log(JSON.stringify({
      event_type: 'cron.send_reminders.complete',
      results,
      total_sent: totalSent,
      total_errors: totalErrors,
      timestamp: new Date().toISOString(),
    }))

    return NextResponse.json({
      success: true,
      results,
      totalSent,
      totalErrors,
      executedAt: new Date().toISOString(),
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'

    console.error(JSON.stringify({
      event_type: 'cron.send_reminders.error',
      error: message,
      timestamp: new Date().toISOString(),
    }))

    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    )
  }
}

// ============================================================
// Date Helpers
// ============================================================

function startOfDay(date: Date): Date {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  return d
}

function endOfDay(date: Date): Date {
  const d = new Date(date)
  d.setHours(23, 59, 59, 999)
  return d
}
