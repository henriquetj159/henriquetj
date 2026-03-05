import { NextResponse } from 'next/server'
import type { NextMiddleware } from 'next/server'
import { auth } from '@ciclo/auth'

/**
 * Admin app middleware: ONLY ADMIN and FACILITATOR roles (AC-5).
 * All routes in apps/admin are protected.
 */

const ROLE_HIERARCHY: Record<string, number> = {
  USER: 1,
  THERAPIST: 2,
  FACILITATOR: 3,
  ADMIN: 4,
}

const MIN_ADMIN_ROLE = 'FACILITATOR'
const MIN_ADMIN_LEVEL = ROLE_HIERARCHY[MIN_ADMIN_ROLE] ?? 3

// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
const middleware = auth((req) => {
  const { pathname } = req.nextUrl

  // Allow NextAuth API routes
  if (pathname.startsWith('/api/auth')) {
    return NextResponse.next()
  }

  // Not authenticated -> redirect to web app login
  if (!req.auth) {
    const webLoginUrl = new URL('/login', process.env.NEXTAUTH_URL ?? 'http://localhost:3000')
    webLoginUrl.searchParams.set('callbackUrl', req.url)
    return NextResponse.redirect(webLoginUrl)
  }

  // Check role: must be FACILITATOR or ADMIN
  const userRole = (req.auth.user as { role?: string })?.role ?? 'USER'
  const userLevel = ROLE_HIERARCHY[userRole] ?? 0

  if (userLevel < MIN_ADMIN_LEVEL) {
    // Insufficient permissions -> redirect to web app
    return NextResponse.redirect(new URL('/', process.env.NEXTAUTH_URL ?? 'http://localhost:3000'))
  }

  return NextResponse.next()
})

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default middleware as any

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
