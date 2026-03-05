'use client'

import { SeasonProvider, BaseTriadeFooter, BaseTriadeWatermark, getCurrentSeason } from '@ciclo/ui'
import { AdminSidebar } from '@/layout/admin-sidebar'
import { AdminHeader } from '@/layout/admin-header'
import { Breadcrumb } from '@/layout/breadcrumb'
import { getNavItemsForRole } from '@/navigation'
import { handleSignOut } from '@/auth-actions'

interface AdminShellProps {
  children: React.ReactNode
  user: {
    name?: string | null
    email?: string | null
    image?: string | null
    role: string
  }
}

export function AdminShell({ children, user }: AdminShellProps) {
  const navItems = getNavItemsForRole(user.role)
  const season = getCurrentSeason()

  return (
    <SeasonProvider>
      <div className="min-h-screen bg-base-bg" data-season={season}>
        <BaseTriadeWatermark opacity={0.05} />

        <AdminSidebar items={navItems} />

        {/* Main content area offset by sidebar width on desktop */}
        <div className="relative z-10 flex min-h-screen flex-col md:pl-64">
          <AdminHeader user={user} onSignOut={() => handleSignOut()} />

          <main className="flex-1 p-4 md:p-6">
            <Breadcrumb />
            {children}
          </main>

          <BaseTriadeFooter variant="minimal" className="relative z-10" />
        </div>
      </div>
    </SeasonProvider>
  )
}
