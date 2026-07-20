'use client'

import { BadgeCheck, ShieldCheck, Crown, Circle } from 'lucide-react'
import { VERIFICATION_CONFIG, type VerificationLevel } from '@/lib/types'
import { cn } from '@/lib/utils'

const ICONS = { Circle, BadgeCheck, ShieldCheck, Crown }

export function VerificationBadge({
  level,
  size = 'sm',
  showLabel = true,
  className,
}: {
  level: VerificationLevel
  size?: 'xs' | 'sm' | 'md'
  showLabel?: boolean
  className?: string
}) {
  const cfg = VERIFICATION_CONFIG[level]
  const Icon = ICONS[cfg.icon as keyof typeof ICONS] || Circle
  const sizes = {
    xs: 'text-[9px] px-1.5 py-0.5 gap-0.5',
    sm: 'text-[10px] px-2 py-0.5 gap-1',
    md: 'text-xs px-2.5 py-1 gap-1',
  }
  const iconSizes = { xs: 'h-2.5 w-2.5', sm: 'h-3 w-3', md: 'h-3.5 w-3.5' }
  return (
    <span
      className={cn('inline-flex items-center rounded-full font-semibold whitespace-nowrap', sizes[size], className)}
      style={{ color: cfg.color, background: cfg.bg }}
      title={cfg.description}
    >
      <Icon className={iconSizes[size]} />
      {showLabel && cfg.label}
    </span>
  )
}

export function VerificationDot({ level, className }: { level: VerificationLevel; className?: string }) {
  const cfg = VERIFICATION_CONFIG[level]
  return (
    <span
      className={cn('inline-block h-2.5 w-2.5 rounded-full ring-2 ring-white', className)}
      style={{ background: cfg.color }}
      title={cfg.label}
    />
  )
}
