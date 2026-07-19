'use client'

import { Star } from 'lucide-react'
import { cn } from '@/lib/utils'

export function RatingStars({
  rating,
  size = 'sm',
  showValue = true,
  count,
  className,
}: {
  rating: number
  size?: 'xs' | 'sm' | 'md' | 'lg'
  showValue?: boolean
  count?: number
  className?: string
}) {
  const sizes = { xs: 'h-3 w-3', sm: 'h-3.5 w-3.5', md: 'h-4 w-4', lg: 'h-5 w-5' }
  const text = { xs: 'text-[10px]', sm: 'text-xs', md: 'text-sm', lg: 'text-base' }
  return (
    <div className={cn('inline-flex items-center gap-1', className)}>
      <div className="flex">
        {[1, 2, 3, 4, 5].map((i) => {
          const filled = rating >= i - 0.25
          const half = !filled && rating >= i - 0.75
          return (
            <span key={i} className="relative">
              <Star className={cn(sizes[size], 'text-muted-foreground/30')} />
              {(filled || half) && (
                <span className="absolute inset-0 overflow-hidden" style={{ width: half ? '50%' : '100%' }}>
                  <Star className={cn(sizes[size], 'fill-amber-400 text-amber-400')} />
                </span>
              )}
            </span>
          )
        })}
      </div>
      {showValue && (
        <span className={cn('font-semibold text-foreground', text[size])}>{rating.toFixed(1)}</span>
      )}
      {count !== undefined && (
        <span className={cn('text-muted-foreground', text[size])}>({count > 999 ? `${(count / 1000).toFixed(1)}k` : count})</span>
      )}
    </div>
  )
}
