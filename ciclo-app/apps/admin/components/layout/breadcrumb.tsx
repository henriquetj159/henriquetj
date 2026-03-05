'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { NavIcon } from '@/layout/nav-icon'
import { ROUTE_LABELS } from '@/navigation'

/**
 * Automatic breadcrumb based on current route.
 * Generates crumbs from pathname segments using ROUTE_LABELS.
 */
export function Breadcrumb() {
  const pathname = usePathname()
  const segments = pathname.split('/').filter(Boolean)

  if (segments.length <= 1) return null

  const crumbs = segments.map((segment, index) => {
    const href = '/' + segments.slice(0, index + 1).join('/')
    const label = ROUTE_LABELS[segment] ?? segment
    const isLast = index === segments.length - 1

    return { href, label, isLast }
  })

  return (
    <nav aria-label="Breadcrumb" className="mb-4">
      <ol className="flex items-center gap-1.5 text-sm text-base-dark/60">
        <li>
          <Link
            href="/admin"
            className="flex items-center hover:text-base-dark"
            aria-label="Ir para Admin"
          >
            <NavIcon name="Home" className="h-4 w-4" />
          </Link>
        </li>
        {crumbs.slice(1).map((crumb) => (
          <li key={crumb.href} className="flex items-center gap-1.5">
            <NavIcon name="ChevronRight" className="h-3 w-3 text-base-dark/30" />
            {crumb.isLast ? (
              <span className="font-medium text-base-dark" aria-current="page">
                {crumb.label}
              </span>
            ) : (
              <Link href={crumb.href} className="hover:text-base-dark">
                {crumb.label}
              </Link>
            )}
          </li>
        ))}
      </ol>
    </nav>
  )
}
