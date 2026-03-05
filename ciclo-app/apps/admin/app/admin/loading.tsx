import { Skeleton } from '@ciclo/ui'

/**
 * Loading state for admin dashboard (AC-8).
 */
export default function AdminLoading() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-48 bg-base-dark/10" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Skeleton className="h-32 rounded-lg bg-base-dark/10" />
        <Skeleton className="h-32 rounded-lg bg-base-dark/10" />
        <Skeleton className="h-32 rounded-lg bg-base-dark/10" />
        <Skeleton className="h-32 rounded-lg bg-base-dark/10" />
      </div>
      <Skeleton className="h-64 rounded-lg bg-base-dark/10" />
    </div>
  )
}
