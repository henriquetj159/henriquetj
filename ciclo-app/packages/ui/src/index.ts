// Lib
export { cn } from './lib/utils'

// === PATTERNS (Sacred Geometry SVGs) ===
export { Triskle } from './patterns/triskle'
export type { TriskleProps } from './patterns/triskle'

export { FlowerOfLife, HexGrid } from './patterns/sacred-geometry'
export type { FlowerOfLifeProps, HexGridProps } from './patterns/sacred-geometry'

export { MandalaPattern } from './patterns/mandala-pattern'
export type { MandalaPatternProps } from './patterns/mandala-pattern'

// === BRANDING ===
export { BaseTriadeFooter } from './components/base-triade-footer'
export { BaseTriadeWatermark } from './components/base-triade-watermark'

// === SACRED COMPONENTS ===
export { HeroSacred } from './components/sacred/hero-sacred'
export { TriskleSpinner } from './components/sacred/triskle-spinner'
export { SacredDivider } from './components/sacred/sacred-divider'

// === SHADCN/UI BASE COMPONENTS ===
export { Button, buttonVariants } from './components/ui/button'
export type { ButtonProps } from './components/ui/button'

export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardDescription,
  CardContent,
} from './components/ui/card'

export { Input } from './components/ui/input'
export type { InputProps } from './components/ui/input'

export { Badge, badgeVariants } from './components/ui/badge'
export type { BadgeProps } from './components/ui/badge'

export { Avatar, AvatarImage, AvatarFallback } from './components/ui/avatar'
export type { AvatarProps, AvatarImageProps, AvatarFallbackProps } from './components/ui/avatar'

export { Skeleton } from './components/ui/skeleton'
export type { SkeletonProps } from './components/ui/skeleton'

export { Sheet, SheetContent } from './components/ui/sheet'
export type { SheetProps, SheetContentProps } from './components/ui/sheet'

// === SEASONAL COMPONENTS ===
export { SeasonalButton, seasonalButtonVariants } from './components/seasonal/seasonal-button'
export type { SeasonalButtonProps } from './components/seasonal/seasonal-button'

export { EventCard } from './components/seasonal/event-card'
export type { EventCardProps, EventStatus } from './components/seasonal/event-card'

export { FacilitatorAvatar } from './components/seasonal/facilitator-avatar'
export type { FacilitatorAvatarProps } from './components/seasonal/facilitator-avatar'

export { SeasonalBadge, seasonalBadgeVariants } from './components/seasonal/seasonal-badge'
export type { SeasonalBadgeProps } from './components/seasonal/seasonal-badge'

export { PageLayout } from './components/seasonal/page-layout'

export { SeasonSelector } from './components/seasonal/season-selector'

// === CONTEXTS ===
export { SeasonProvider, useSeason, getCurrentSeason, getSeasonInfo } from './contexts/season-context'
export type { Season, SeasonInfo } from './contexts/season-context'
