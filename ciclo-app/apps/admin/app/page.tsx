import { redirect } from 'next/navigation'

/**
 * Root page redirects to /admin.
 * All admin content lives under /admin/* with its own layout.
 */
export default function RootPage() {
  redirect('/admin')
}
