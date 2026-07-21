'use client'

import * as React from 'react'
import useSWR from 'swr'
import { Sparkles, TrendingUp, Star, BadgeCheck, Clock, Filter, X, MapPin, ArrowRight, Flame, Crown, ShieldCheck, History, Locate, Crosshair } from 'lucide-react'
import { useAppStore } from '@/lib/store'
import type { Business, Category } from '@/lib/types'
import { MapView } from '@/components/map-view'
import { BusinessCard } from '@/components/business-card'
import { CategoryRail } from '@/components/category-rail'
import { VerificationBadge } from '@/components/verification-badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export function HomeView() {
  const { activeCategories, filters, recentlyViewed } = useAppStore()

  const catsParam = activeCategories.length ? activeCategories.join(',') : 'all'
  const query = new URLSearchParams({
    category: catsParam,
    openNow: String(filters.openNow),
    verifiedOnly: String(filters.verifiedOnly),
    minRating: String(filters.minRating),
    limit: '60',
  }).toString()

  const { data: businessesData, isLoading } = useSWR<{ businesses: Business[] }>(`/api/businesses?${query}`, fetcher)
  const { data: catsData } = useSWR<{ categories: Category[] }>('/api/categories', fetcher)

  const businesses = businessesData?.businesses ?? []
  const categories = catsData?.categories ?? []

  // Deduplicate: trending excludes featured, verified excludes both — cleaner discovery
  const trending = businesses.filter((b) => b.trending && !b.featured).slice(0, 8)
  const featured = businesses.filter((b) => b.featured).slice(0, 8)
  const featuredIds = new Set(featured.map((b) => b.id))
  const trendingIds = new Set(trending.map((b) => b.id))
  const verified = businesses
    .filter((b) => (b.verified === 'premium' || b.verified === 'enterprise') && !featuredIds.has(b.id) && !trendingIds.has(b.id))
    .slice(0, 8)
  const recentlyVerified = businesses.filter((b) => b.recentlyVerified).slice(0, 8)
  // Newest by founded year (most recent first)
  const newest = [...businesses].sort((a, b) => b.foundedYear - a.foundedYear).slice(0, 8)

  // recently viewed (resolved from store IDs against fetched businesses)
  const recent = recentlyViewed
    .map((id) => businesses.find((b) => b.id === id))
    .filter(Boolean)
    .slice(0, 8) as Business[]

  return (
    <div className="mx-auto max-w-[1600px] px-3 py-3 sm:px-4">
      {/* Hero strip */}
      <div className="mb-3 overflow-hidden rounded-2xl bg-gradient-to-br from-primary/10 via-accent/40 to-card border border-border/60">
        <div className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:py-5">
          <div className="max-w-xl">
            <div className="mb-1.5 inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-semibold text-primary">
              <Sparkles className="h-3 w-3" /> B2B Marketplace
            </div>
            <h1 className="text-xl font-bold tracking-tight sm:text-2xl">
              The B2B discovery platform for <span className="text-gradient">verified suppliers</span>
            </h1>
            <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
              Find manufacturers, distributors, raw material suppliers and industrial service providers — all verified, all on one intelligent map.
            </p>
          </div>
          <div className="flex items-center gap-4">
            <Stat label="B2B Suppliers" value="20+" />
            <div className="h-8 w-px bg-border" />
            <Stat label="Categories" value="12" />
            <div className="h-8 w-px bg-border" />
            <Stat label="Verified" value="100%" />
          </div>
        </div>
      </div>

      {/* Category rail */}
      <div className="mb-3">
        <CategoryRail categories={categories} />
      </div>

      {/* Quick filters */}
      <QuickFilters />

      {/* Map + List split */}
      <div className="grid gap-3 lg:grid-cols-[1fr_400px] xl:grid-cols-[1fr_440px]">
        <MapListSplit businesses={businesses} isLoading={isLoading} />
      </div>

      {/* Discovery sections */}
      <div className="mt-8 space-y-10">
        {recent.length > 0 && (
          <section>
            <div className="mb-3 flex items-end justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <History className="h-4 w-4 text-primary" />
                  <h2 className="text-lg font-bold tracking-tight">Recently viewed</h2>
                </div>
                <p className="text-xs text-muted-foreground">Pick up where you left off</p>
              </div>
              <span className="text-xs text-muted-foreground">{recent.length} places</span>
            </div>
            <div className="no-scrollbar -mx-3 flex gap-3 overflow-x-auto px-3 pb-2">
              {recent.map((b) => (
                <div key={b.id} className="w-64 shrink-0">
                  <BusinessCard business={b} layout="grid" />
                </div>
              ))}
            </div>
          </section>
        )}
        {trending.length > 0 && (
          <DiscoverySection
            title="Trending now"
            subtitle="Businesses gaining attention this week"
            icon={<Flame className="h-4 w-4 text-rose-500" />}
            businesses={trending}
            layout="grid"
          />
        )}
        {featured.length > 0 && (
          <DiscoverySection
            title="Featured businesses"
            subtitle="Hand-picked premium profiles"
            icon={<Star className="h-4 w-4 text-amber-500" />}
            businesses={featured}
            layout="grid"
          />
        )}
        <DiscoverySection
          title="Premium & Enterprise verified"
          subtitle="The highest trust level on Veridian"
          icon={<Crown className="h-4 w-4 text-violet-500" />}
          businesses={verified}
          layout="list"
        />
        {recentlyVerified.length > 0 && (
          <DiscoverySection
            title="Recently verified"
            subtitle="Freshly verified businesses you can trust"
            icon={<BadgeCheck className="h-4 w-4 text-emerald-500" />}
            businesses={recentlyVerified}
            layout="grid"
          />
        )}
        {newest.length > 0 && (
          <DiscoverySection
            title="New on Veridian"
            subtitle="The newest businesses to join the directory"
            icon={<Sparkles className="h-4 w-4 text-primary" />}
            businesses={newest}
            layout="grid"
          />
        )}

        <VerificationTiers />
        <ERPTeaser />
      </div>
    </div>
  )
}

function QuickFilters() {
  const { filters, toggleFilter, setMinRating, activeCategories, clearCategories } = useAppStore()
  const chips: { label: string; icon: React.ReactNode; active: boolean; onClick: () => void }[] = [
    { label: 'Open now', icon: <Clock className="h-3 w-3" />, active: filters.openNow, onClick: () => toggleFilter('openNow') },
    { label: 'Verified', icon: <BadgeCheck className="h-3 w-3" />, active: filters.verifiedOnly, onClick: () => toggleFilter('verifiedOnly') },
    { label: '4.5★+', icon: <Star className="h-3 w-3" />, active: filters.minRating === 4.5, onClick: () => setMinRating(4.5) },
    { label: '4★+', icon: <Star className="h-3 w-3" />, active: filters.minRating === 4, onClick: () => setMinRating(4) },
  ]
  const anyActive = filters.openNow || filters.verifiedOnly || filters.minRating > 0 || activeCategories.length > 0
  return (
    <div className="mb-3 flex flex-wrap items-center gap-1.5">
      {chips.map((c) => (
        <button
          key={c.label}
          onClick={c.onClick}
          className={cn(
            'inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-medium transition',
            c.active
              ? 'border-primary bg-primary text-primary-foreground shadow-sm'
              : 'border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground'
          )}
        >
          {c.icon}
          {c.label}
        </button>
      ))}
      {anyActive && (
        <button
          onClick={() => { clearCategories(); toggleFilter('openNow', false); toggleFilter('verifiedOnly', false); setMinRating(0) }}
          className="inline-flex items-center gap-1 rounded-full border border-transparent px-2 py-1 text-[11px] font-medium text-muted-foreground transition hover:text-foreground"
        >
          <X className="h-3 w-3" /> Clear
        </button>
      )}
    </div>
  )
}

function MapListSplit({ businesses, isLoading }: { businesses: Business[]; isLoading: boolean }) {
  const [showFilters, setShowFilters] = React.useState(false)
  const [mobileMode, setMobileMode] = React.useState<'map' | 'list'>('list')
  const { filters, toggleFilter, setMinRating, setView } = useAppStore()
  return (
    <>
      {/* Mobile view toggle */}
      <div className="mb-2 flex items-center gap-1 lg:hidden">
        <button
          onClick={() => setMobileMode('list')}
          className={cn('flex-1 rounded-lg border py-1.5 text-xs font-medium transition', mobileMode === 'list' ? 'border-primary bg-primary text-primary-foreground' : 'border-border')}
        >
          List view
        </button>
        <button
          onClick={() => setMobileMode('map')}
          className={cn('flex-1 rounded-lg border py-1.5 text-xs font-medium transition', mobileMode === 'map' ? 'border-primary bg-primary text-primary-foreground' : 'border-border')}
        >
          Map view
        </button>
      </div>

      <div className={cn(mobileMode === 'map' ? 'block' : 'hidden', 'lg:block')}>
        <div className="relative h-[60vh] min-h-[380px] overflow-hidden rounded-2xl border border-border lg:h-[calc(100vh-220px)]">
          {isLoading ? (
            <Skeleton className="h-full w-full" />
          ) : (
            <MapView businesses={businesses} className="h-full w-full" />
          )}
          <button
            onClick={() => setShowFilters((s) => !s)}
            className="absolute left-3 top-3 glass card-elevated flex h-9 items-center gap-1.5 rounded-xl px-3 text-xs font-medium hover:bg-accent transition"
          >
            <Filter className="h-3.5 w-3.5" />
            Filters
            {(filters.openNow || filters.verifiedOnly || filters.minRating > 0) && (
              <span className="ml-0.5 h-1.5 w-1.5 rounded-full bg-primary" />
            )}
          </button>
          {showFilters && (
            <div className="absolute left-3 top-14 z-30 w-64 glass card-elevated rounded-2xl p-3 animate-scale-in">
              <div className="mb-2 flex items-center justify-between">
                <p className="text-xs font-semibold">Filters</p>
                <button onClick={() => setShowFilters(false)} className="text-muted-foreground hover:text-foreground"><X className="h-3.5 w-3.5" /></button>
              </div>
              <div className="space-y-2">
                <FilterToggle label="Open now" icon={<Clock className="h-3.5 w-3.5" />} active={filters.openNow} onClick={() => toggleFilter('openNow')} />
                <FilterToggle label="Verified only" icon={<BadgeCheck className="h-3.5 w-3.5" />} active={filters.verifiedOnly} onClick={() => toggleFilter('verifiedOnly')} />
                <div className="pt-1">
                  <p className="mb-1.5 text-[11px] font-medium text-muted-foreground">Minimum rating</p>
                  <div className="flex gap-1.5">
                    {[3, 3.5, 4, 4.5].map((r) => (
                      <button
                        key={r}
                        onClick={() => setMinRating(r)}
                        className={cn(
                          'flex-1 rounded-lg border px-2 py-1 text-[11px] font-medium transition',
                          filters.minRating === r ? 'border-primary bg-primary text-primary-foreground' : 'border-border hover:border-primary/40'
                        )}
                      >
                        {r}★+
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className={cn(mobileMode === 'list' ? 'block' : 'hidden', 'lg:block', 'mt-0 lg:mt-0')}>
        <div className="flex h-[60vh] min-h-[380px] flex-col rounded-2xl border border-border bg-card/40 lg:h-[calc(100vh-220px)]">
          <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
            <div>
              <h2 className="text-sm font-semibold">Nearby businesses</h2>
              <p className="text-[11px] text-muted-foreground">{businesses.length} places on the map</p>
            </div>
            <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => setView({ name: 'search', query: '' })}>
              View all <ArrowRight className="ml-1 h-3 w-3" />
            </Button>
          </div>
          <div className="scrollbar-thin flex-1 space-y-2 overflow-y-auto p-3">
            {isLoading
              ? Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="flex gap-3 rounded-xl p-3">
                    <Skeleton className="h-[88px] w-[112px] rounded-lg" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-3 w-3/4" />
                      <Skeleton className="h-2.5 w-1/2" />
                      <Skeleton className="h-2.5 w-2/3" />
                    </div>
                  </div>
                ))
              : businesses.slice(0, 12).map((b) => <BusinessCard key={b.id} business={b} layout="list" />)}
          </div>
        </div>
      </div>
    </>
  )
}

function FilterToggle({ label, icon, active, onClick }: { label: string; icon: React.ReactNode; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex w-full items-center justify-between rounded-lg border px-2.5 py-2 text-xs font-medium transition',
        active ? 'border-primary bg-primary/5 text-primary' : 'border-border hover:border-primary/40'
      )}
    >
      <span className="inline-flex items-center gap-1.5">{icon}{label}</span>
      <span className={cn('h-4 w-7 rounded-full p-0.5 transition', active ? 'bg-primary' : 'bg-muted')}>
        <span className={cn('block h-3 w-3 rounded-full bg-white transition', active && 'translate-x-3')} />
      </span>
    </button>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="text-center">
      <p className="text-lg font-bold leading-none">{value}</p>
      <p className="mt-0.5 text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
    </div>
  )
}

function DiscoverySection({
  title,
  subtitle,
  icon,
  businesses,
  layout,
}: {
  title: string
  subtitle: string
  icon: React.ReactNode
  businesses: Business[]
  layout: 'list' | 'grid'
}) {
  if (businesses.length === 0) return null
  return (
    <section>
      <div className="mb-3 flex items-end justify-between">
        <div>
          <div className="flex items-center gap-2">
            {icon}
            <h2 className="text-lg font-bold tracking-tight">{title}</h2>
          </div>
          <p className="text-xs text-muted-foreground">{subtitle}</p>
        </div>
        <span className="text-xs text-muted-foreground">{businesses.length} places</span>
      </div>
      {layout === 'grid' ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {businesses.map((b) => (
            <BusinessCard key={b.id} business={b} layout="grid" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {businesses.map((b) => (
            <BusinessCard key={b.id} business={b} layout="list" />
          ))}
        </div>
      )}
    </section>
  )
}

function VerificationTiers() {
  const tiers = [
    { level: 'basic' as const, desc: 'Listed with basic information' },
    { level: 'verified' as const, desc: 'Phone & documents verified' },
    { level: 'premium' as const, desc: 'Premises audited by Veridian' },
    { level: 'enterprise' as const, desc: 'Full enterprise due diligence' },
  ]
  return (
    <section>
      <div className="mb-3">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-primary" />
          <h2 className="text-lg font-bold tracking-tight">Trust, verified</h2>
        </div>
        <p className="text-xs text-muted-foreground">Four tiers of verification so you always know how much to trust a business.</p>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {tiers.map((t) => (
          <div key={t.level} className="rounded-2xl border border-border bg-card p-4 card-elevated">
            <VerificationBadge level={t.level} size="md" />
            <p className="mt-2 text-xs text-muted-foreground">{t.desc}</p>
          </div>
        ))}
      </div>
    </section>
  )
}

function ERPTeaser() {
  return (
    <section className="relative overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-primary/10 via-card to-accent/30 p-6 sm:p-8">
      <div className="relative z-10 max-w-2xl">
        <div className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-semibold text-primary">
          <Sparkles className="h-3 w-3" /> Free ERP for B2B Suppliers
        </div>
        <h2 className="text-2xl font-bold tracking-tight">A complete B2B operating system — free for every supplier</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Manage inventory, B2B orders, invoices, customers and expenses inside a free ERP. Your product catalog and stock levels sync to your public Veridian profile automatically — so B2B buyers always see accurate, live data.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          {['Inventory & Stock', 'B2B Order Management', 'Invoice Generation', 'Customer CRM', 'Expense Tracking', 'Staff Management'].map((t) => (
            <span key={t} className="rounded-full bg-card border border-border px-2.5 py-1 text-[11px] font-medium">{t}</span>
          ))}
        </div>
        <Button className="mt-5 gap-1.5" onClick={() => useAppStore.getState().setView({ name: 'dashboard' })}>
          Explore the dashboard <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
      <div className="pointer-events-none absolute -right-12 -top-12 h-48 w-48 rounded-full bg-primary/10 blur-2xl" />
      <div className="pointer-events-none absolute -bottom-16 right-20 h-40 w-40 rounded-full bg-chart-2/10 blur-2xl" />
    </section>
  )
}
