import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '../../lib/utils'

const seasonalButtonVariants = cva(
  'inline-flex items-center justify-center whitespace-nowrap rounded-md font-body font-medium transition-seasonal focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        primary: 'bg-seasonal-primary text-white hover:bg-seasonal-primary/90 shadow-sm',
        secondary: 'bg-seasonal-secondary text-white hover:bg-seasonal-secondary/80 shadow-sm',
        sacred: 'bg-gradient-to-r from-violet-700 to-violet-500 text-white hover:from-violet-800 hover:to-violet-600 shadow-glow-violet-sm',
        outline: 'border-2 border-seasonal-primary text-seasonal-primary bg-transparent hover:bg-seasonal-primary/10',
        ghost: 'text-seasonal-primary hover:bg-seasonal-primary/10',
        glass: 'glass-light text-foreground hover:bg-white/50',
      },
      size: {
        sm: 'h-9 rounded-md px-3 text-sm',
        default: 'h-10 px-5 py-2 text-sm',
        lg: 'h-12 rounded-lg px-8 text-base',
        xl: 'h-14 rounded-xl px-10 text-lg',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'default',
    },
  },
)

interface SeasonalButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof seasonalButtonVariants> {}

const SeasonalButton = React.forwardRef<HTMLButtonElement, SeasonalButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button
        className={cn(seasonalButtonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  },
)
SeasonalButton.displayName = 'SeasonalButton'

export { SeasonalButton, seasonalButtonVariants }
export type { SeasonalButtonProps }
