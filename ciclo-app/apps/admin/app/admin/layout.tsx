import { redirect } from 'next/navigation'
import { auth } from '@ciclo/auth'
import { AdminShell } from '@/layout/admin-shell'

/**
 * Admin layout (server component).
 * Fetches session and passes user data to the client-side AdminShell.
 * Redirects if not authenticated or insufficient role.
 */
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()

  if (!session?.user) {
    redirect('/login')
  }

  const userRole = (session.user as { role?: string }).role ?? 'USER'

  // Only ADMIN and FACILITATOR can access admin panel
  if (userRole !== 'ADMIN' && userRole !== 'FACILITATOR') {
    redirect('/')
  }

  return (
    <AdminShell
      user={{
        name: session.user.name,
        email: session.user.email,
        image: session.user.image,
        role: userRole,
      }}
    >
      {children}
    </AdminShell>
  )
}
