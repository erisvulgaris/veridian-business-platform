'use client'

import * as React from 'react'
import { motion } from 'framer-motion'
import { MapPin, Clock, Bookmark, BookmarkCheck, Eye, Package, Wrench, Flame } from 'lucide-react'
import type { Business } from '@/lib/types'
import { formatNumber, timeAgo } from '@/lib/types'
import { VerificationBadge } from './verification-badge'
import { RatingStars } from './rating-stars'
import { useAppStore } from '@/lib/store'
import { cn } from '@/lib/utils'

export function BusinessCard({
  business: b,
  layout = 'list',
  showDistance = false,
  distance,
}: {
  business: Business
  layout?: 'list' | 'grid' | 'compact'
  showDistance?: boolean
  distance?: number
}) {
  const { setView, toggleSaveBusiness, savedBusinessIds, selectBusiness, hoverBusiness, addRecentlyViewed } = useAppStore()
  const saved = savedBusinessIds.includes(b.id)

  const open = () => {
    selectBusiness(b.id)
    addRecentlyViewed(b.id)
    setView({ name: 'business', id: b.id, slug: b.slug })
  }

  if (layout === 'compact') {
    return (
      <motion.button
        whileHover={{ y: -2 }}
        onClick={open}
        onMouseEnter={() => hoverBusiness(b.id)}
        onMouseLeave={() => hoverBusiness(null)}
        className="group flex w-full items-center gap-3 rounded-xl bg-card p-2.5 text-left card-elevated transition hover:ring-1 hover:ring-primary/30"
      >
        <img src={b.logo} alt={b.name} className="h-11 w-11 rounded-lg object-cover ring-1 ring-border" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-foreground">{b.name}</p>
          <p className="truncate text-[11px] text-muted-foreground">{b.category} · {b.area}</p>
        </div>
        <div className="flex flex-col items-end gap-0.5">
          <RatingStars rating={b.rating} size="xs" showValue={false} />
          <span className="text-[10px] text-muted-foreground">{formatNumber(b.reviewCount)}</span>
        </div>
      </motion.button>
    )
  }

  if (layout === 'grid') {
    return (
      <motion.div
        whileHover={{ y: -4 }}
        onClick={open}
        onMouseEnter={() => hoverBusiness(b.id)}
        onMouseLeave={() => hoverBusiness(null)}
        className="group relative cursor-pointer overflow-hidden rounded-2xl bg-card card-elevated transition hover:ring-1 hover:ring-primary/30"
      >
        <div className="relative aspect-[16/10] overflow-hidden">
          <img src={b.coverImage} alt={b.name} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/0 to-black/10" />
          <div className="absolute left-3 top-3 flex items-center gap-1.5">
            <VerificationBadge level={b.verified} size="xs" />
            {b.trending && (
              <span className="inline-flex items-center gap-0.5 rounded-full bg-gradient-to-r from-orange-500/90 to-rose-500/90 px-2 py-0.5 text-[9px] font-bold text-white shadow-sm backdrop-blur">
                <Flame className="h-2.5 w-2.5" /> TRENDING
              </span>
            )}
          </div>
          <button
            onClick={(e) => { e.stopPropagation(); toggleSaveBusiness(b.id) }}
            className="absolute right-2.5 top-2.5 flex h-8 w-8 items-center justify-center rounded-full bg-white/85 text-foreground backdrop-blur transition hover:bg-white"
            aria-label="Save"
          >
            {saved ? <BookmarkCheck className="h-4 w-4 text-primary" /> : <Bookmark className="h-4 w-4" />}
          </button>
          <div className="absolute bottom-3 left-3 right-3 flex items-end gap-2.5">
            <img src={b.logo} alt="" className="h-11 w-11 rounded-xl object-cover ring-2 ring-white/90 shadow" />
            <div className="min-w-0 flex-1">
              <h3 className="truncate text-sm font-bold text-white drop-shadow">{b.name}</h3>
              <p className="truncate text-[11px] text-white/85">{b.tagline}</p>
            </div>
          </div>
        </div>
        <div className="space-y-2 p-3">
          <div className="flex items-center justify-between">
            <RatingStars rating={b.rating} size="sm" count={b.reviewCount} />
            <span className={cn('inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-medium', b.isOpen ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-zinc-500/10 text-zinc-500')}>
              <Clock className="h-2.5 w-2.5" />
              {b.isOpen ? 'Open' : 'Closed'}
            </span>
          </div>
          <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
            <span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3" />{b.area}</span>
            {b._count && b._count.products > 0 && (
              <span className="inline-flex items-center gap-1"><Package className="h-3 w-3" />{b._count.products}</span>
            )}
            {b._count && b._count.services > 0 && (
              <span className="inline-flex items-center gap-1"><Wrench className="h-3 w-3" />{b._count.services}</span>
            )}
            <span className="ml-auto inline-flex items-center gap-1"><Eye className="h-3 w-3" />{formatNumber(b.viewCount)}</span>
          </div>
        </div>
      </motion.div>
    )
  }

  // list layout
  return (
    <motion.div
      whileHover={{ y: -2 }}
      onClick={open}
      onMouseEnter={() => hoverBusiness(b.id)}
      onMouseLeave={() => hoverBusiness(null)}
      className="group relative flex cursor-pointer gap-3 rounded-xl bg-card p-3 card-elevated transition hover:ring-1 hover:ring-primary/30"
    >
      <div className="relative h-[88px] w-[112px] shrink-0 overflow-hidden rounded-lg">
        <img src={b.coverImage} alt={b.name} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
        <img src={b.logo} alt="" className="absolute bottom-1 left-1 h-7 w-7 rounded-md object-cover ring-2 ring-white shadow" />
      </div>
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-start gap-2">
          <div className="min-w-0 flex-1">
            <h3 className="truncate text-sm font-semibold text-foreground">{b.name}</h3>
            <p className="truncate text-[11px] text-muted-foreground">{b.tagline}</p>
          </div>
          <button
            onClick={(e) => { e.stopPropagation(); toggleSaveBusiness(b.id) }}
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-muted-foreground transition hover:bg-accent hover:text-foreground"
            aria-label="Save"
          >
            {saved ? <BookmarkCheck className="h-4 w-4 text-primary" /> : <Bookmark className="h-4 w-4" />}
          </button>
        </div>
        <div className="mt-1 flex flex-wrap items-center gap-1.5">
          <VerificationBadge level={b.verified} size="xs" />
          {b.trending && (
            <span className="inline-flex items-center gap-0.5 rounded-full bg-gradient-to-r from-orange-500/15 to-rose-500/15 px-1.5 py-0.5 text-[9px] font-bold text-orange-600 dark:text-orange-400">
              <Flame className="h-2.5 w-2.5" /> TRENDING
            </span>
          )}
          <span className="rounded-full bg-secondary px-1.5 py-0.5 text-[9px] font-medium text-secondary-foreground">{b.category}</span>
        </div>
        <div className="mt-1.5 flex items-center gap-2">
          <RatingStars rating={b.rating} size="xs" count={b.reviewCount} />
          <span className={cn('inline-flex items-center gap-0.5 text-[10px] font-medium', b.isOpen ? 'text-emerald-600 dark:text-emerald-400' : 'text-zinc-400')}>
            <span className="h-1.5 w-1.5 rounded-full" style={{ background: b.isOpen ? '#10b981' : '#9ca3af' }} />
            {b.isOpen ? 'Open' : 'Closed'}
          </span>
        </div>
        <div className="mt-auto flex items-center gap-2 pt-1 text-[10px] text-muted-foreground">
          <span className="inline-flex items-center gap-0.5"><MapPin className="h-2.5 w-2.5" />{b.area}</span>
          {showDistance && distance !== undefined && (
            <span className="font-medium text-foreground">{distance.toFixed(1)} km</span>
          )}
          {b.promotion && (
            <span className="inline-flex items-center gap-0.5 rounded-full bg-amber-500/10 px-1.5 py-0.5 font-medium text-amber-600 dark:text-amber-400">
              Offer
            </span>
          )}
        </div>
      </div>
    </motion.div>
  )
}
