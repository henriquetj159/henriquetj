import * as React from 'react'

export interface FlowerOfLifeProps extends React.SVGProps<SVGSVGElement> {
  size?: number
  color?: string
  opacity?: number
}

export const FlowerOfLife = React.forwardRef<SVGSVGElement, FlowerOfLifeProps>(
  ({ size = 200, color = '#932E88', opacity = 0.08, className, ...props }, ref) => {
    const r = 16.67
    const centers = [
      [50, 50],
      [50, 50 - r], [50, 50 + r],
      [50 + r * Math.cos(Math.PI / 6), 50 - r * Math.sin(Math.PI / 6)],
      [50 - r * Math.cos(Math.PI / 6), 50 - r * Math.sin(Math.PI / 6)],
      [50 + r * Math.cos(Math.PI / 6), 50 + r * Math.sin(Math.PI / 6)],
      [50 - r * Math.cos(Math.PI / 6), 50 + r * Math.sin(Math.PI / 6)],
    ]

    return (
      <svg
        ref={ref}
        width={size}
        height={size}
        viewBox="0 0 100 100"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
        aria-hidden="true"
        {...props}
      >
        {centers.map(([cx, cy], i) => (
          <circle
            key={i}
            cx={cx}
            cy={cy}
            r={r}
            fill="none"
            stroke={color}
            strokeWidth="0.4"
            opacity={opacity}
          />
        ))}
        <circle cx="50" cy="50" r="33.34" fill="none" stroke={color} strokeWidth="0.3" opacity={opacity * 0.7} />
      </svg>
    )
  }
)

FlowerOfLife.displayName = 'FlowerOfLife'

export interface HexGridProps extends React.SVGProps<SVGSVGElement> {
  size?: number
  color?: string
  opacity?: number
}

export const HexGrid = React.forwardRef<SVGSVGElement, HexGridProps>(
  ({ size = 200, color = '#932E88', opacity = 0.06, className, ...props }, ref) => {
    return (
      <svg
        ref={ref}
        width={size}
        height={size}
        viewBox="0 0 100 100"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
        aria-hidden="true"
        {...props}
      >
        <defs>
          <pattern id="hex-pattern" width="17.32" height="30" patternUnits="userSpaceOnUse" patternTransform="scale(0.5)">
            <polygon
              points="8.66,0 17.32,5 17.32,15 8.66,20 0,15 0,5"
              fill="none"
              stroke={color}
              strokeWidth="0.5"
              opacity={opacity}
            />
            <polygon
              points="8.66,10 17.32,15 17.32,25 8.66,30 0,25 0,15"
              fill="none"
              stroke={color}
              strokeWidth="0.5"
              opacity={opacity}
              transform="translate(8.66, 0)"
            />
          </pattern>
        </defs>
        <rect width="100" height="100" fill="url(#hex-pattern)" />
      </svg>
    )
  }
)

HexGrid.displayName = 'HexGrid'
