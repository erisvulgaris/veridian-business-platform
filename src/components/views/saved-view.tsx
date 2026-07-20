'use client'

import * as React from 'react'
import useSWR from 'swr'
import { Bookmark, BookmarkX, FolderOpen, Sparkles, Bell, BellRing, GitCompare } from 'lucide-react'
import { useAppStore } from '@/lib/store'
import type { Business } from '@/lib/types'
import { BusinessCard } from '@/components/business-card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export function SavedView() {
  const { savedBusinessIds, followedBusinessIds, compareIds, setView } = useAppStore()
  const { data, isLoading } = useSWR<{ businesses: Business[] }>('/api/businesses?limit=60', fetcher)
  const all = data?.businesses ?? []
  const saved = all.filter((b) => savedBusinessIds.includes(b.id))
  const followed = all.filter((b) => followedBusinessIds.includes(b.id))
  const toCompare = all.filter((b) => compareIds.includes(b.id))

  const [tab, setTab] = React.useState<'saved' | 'following' | 'compare'>('saved')

  return (
    <div className="mx-auto max-w-6xl px-3 py-4 sm:px-4">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Bookmark className="h-4 w-4 text-primary" />
            <h1 className="text-xl font-bold tracking-tight sm:text-2xl">Your collection</h1>
          </div>
          <p className="text-xs text-muted-foreground">Saved, followed and compared businesses in one place</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => setView({ name: 'home' })}>
          <FolderOpen className="mr-1.5 h-3.5 w-3.5" /> Browse more
        </Button>
      </div>

      {/* Tabs */}
      <div className="mb-4 flex items-center gap-1.5">
        {([
          { key: 'saved', label: 'Saved', icon: Bookmark, count: saved.length },
          { key: 'following', label: 'Following', icon: Bell, count: followed.length },
          { key: 'compare', label: 'Compare', icon: GitCompare, count: toCompare.length },
        ] as const).map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition',
              tab === t.key ? 'border-primary bg-primary text-primary-foreground shadow-sm' : 'border-border hover:border-primary/40'
            )}
          >
            <t.icon className="h-3.5 w-3.5" />
            {t.label}
            {t.count > 0 && (
              <span className={cn('rounded-full px-1.5 text-[10px] font-bold', tab === t.key ? 'bg-primary-foreground/20' : 'bg-secondary')}>
                {t.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-48 rounded-2xl" />)}
        </div>
      ) : tab === 'saved' ? (
        saved.length === 0 ? (
          <EmptyState icon={<BookmarkX className="h-7 w-7" />} title="Nothing saved yet" subtitle="Tap the bookmark icon on any business to save it here for quick access." cta="Start exploring" onCta={() => setView({ name: 'home' })} />
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {saved.map((b) => <BusinessCard key={b.id} business={b} layout="grid" />)}
          </div>
        )
      ) : tab === 'following' ? (
        followed.length === 0 ? (
          <EmptyState icon={<Bell className="h-7 w-7" />} title="Not following any businesses" subtitle="Follow a business to get notified about their new products, services and promotions." cta="Discover businesses" onCta={() => setView({ name: 'home' })} />
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {followed.map((b) => <BusinessCard key={b.id} business={b} layout="grid" />)}
          </div>
        )
      ) : tab === 'compare' ? (
        toCompare.length === 0 ? (
          <EmptyState icon={<GitCompare className="h-7 w-7" />} title="Nothing to compare" subtitle="Add up to 3 businesses to compare their ratings, verification, facilities and more side by side." cta="Browse businesses" onCta={() => setView({ name: 'home' })} />
        ) : (
          <div className="space-y-3">
            <div className="flex items-center justify-between rounded-xl border border-primary/20 bg-primary/5 p-3">
              <p className="text-xs text-muted-foreground">{toCompare.length} business{toCompare.length > 1 ? 'es' : ''} ready to compare</p>
              <Button size="sm" className="gap-1.5" onClick={() => setView({ name: 'compare', ids: compareIds })}>
                <GitCompare className="h-3.5 w-3.5" /> Compare now
              </Button>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {toCompare.map((b) => <BusinessCard key={b.id} business={b} layout="grid" />)}
            </div>
          </div>
        )
      ) : null}
    </div>
  )
}

function EmptyState({ icon, title, subtitle, cta, onCta }: { icon: React.ReactNode; title: string; subtitle: string; cta: string; onCta: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border py-16 text-center">
      <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-2xl bg-secondary text-muted-foreground">{icon}</div>
      <p className="text-sm font-semibold">{title}</p>
      <p className="mt-1 max-w-sm text-xs text-muted-foreground">{subtitle}</p>
      <Button className="mt-4 gap-1.5" onClick={onCta}>
        <Sparkles className="h-3.5 w-3.5" /> {cta}
      </Button>
    </div>
  )
}
