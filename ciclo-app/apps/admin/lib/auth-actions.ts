'use server'

import { signOut } from '@ciclo/auth'

/**
 * Server action to sign out the user.
 */
export async function handleSignOut() {
  await signOut({ redirectTo: '/' })
}
