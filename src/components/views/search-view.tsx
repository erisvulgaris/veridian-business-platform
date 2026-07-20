'use client'

import * as React from 'react'
import useSWR from 'swr'
import { Search, Sparkles, Store, Package, Wrench, Loader2, ArrowRight, MapPin, TrendingUp } from 'lucide-react'
import { useAppStore } from '@/lib/store'
import type { Business, Product, Service } from '@/lib/types'
import { BusinessCard } from '@/components/business-card'
import { VerificationBadge } from '@/components/verification-badge'
import { formatPrice } from '@/lib/types'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export function SearchView({ query }: { query: string }) {
  const { setView } = useAppStore()
  const body = React.useMemo(() => ({ query, lat: 28.6139, lng: 77.209 }), [query])

  const { data, isLoading } = useSWR(
    query ? ['/api/ai/search', body] : null,
    async () => {
      const res = await fetch('/api/ai/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      return res.json()
    }
  )

  const businesses: (Business & { _score?: number })[] = data?.businesses ?? []
  const products: (Product & { business?: Business })[] = data?.products ?? []
  const services: (Service & { business?: Business })[] = data?.services ?? []
  const interpretation: string = data?.interpretation ?? ''

  return (
    <div className="mx-auto max-w-6xl px-3 py-4 sm:px-4">
      {/* Search header */}
      <div className="mb-4">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Search className="h-3.5 w-3.5" />
          <span>Search results</span>
        </div>
        <h1 className="mt-1 text-xl font-bold tracking-tight sm:text-2xl">
          {query ? <>"{query}"</> : 'Discover businesses'}
        </h1>
        {interpretation && (
          <div className="mt-2 inline-flex items-start gap-2 rounded-xl border border-primary/20 bg-primary/5 px-3 py-2 text-xs">
            <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
            <span className="text-foreground/80">{interpretation}</span>
          </div>
        )}
      </div>

      {isLoading && (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex gap-3 rounded-xl p-3">
              <Skeleton className="h-[88px] w-[112px] rounded-lg" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-3 w-3/4" />
                <Skeleton className="h-2.5 w-1/2" />
                <Skeleton className="h-2.5 w-2/3" />
              </div>
            </div>
          ))}
        </div>
      )}

      {!isLoading && query && businesses.length === 0 && products.length === 0 && services.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border py-16 text-center">
          <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-2xl bg-secondary text-muted-foreground">
            <Search className="h-7 w-7" />
          </div>
          <p className="text-sm font-semibold">No matches found</p>
          <p className="mt-1 max-w-sm text-xs text-muted-foreground">
            We couldn't find businesses, products or services for "{query}". Try a different keyword or browse categories.
          </p>
        </div>
      )}

      {/* Businesses */}
      {businesses.length > 0 && (
        <section className="mb-6">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Store className="h-4 w-4 text-primary" />
              <h2 className="text-sm font-semibold">Businesses</h2>
              <span className="text-xs text-muted-foreground">({businesses.length})</span>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {businesses.map((b) => (
              <BusinessCard key={b.id} business={b} layout="list" />
            ))}
          </div>
        </section>
      )}

      {/* Products */}
      {products.length > 0 && (
        <section className="mb-6">
          <div className="mb-3 flex items-center gap-2">
            <Package className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-semibold">Products</h2>
            <span className="text-xs text-muted-foreground">({products.length})</span>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {products.map((p) => (
              <button
                key={p.id}
                onClick={() => setView({ name: 'product', id: p.id })}
                className="group overflow-hidden rounded-xl border border-border bg-card text-left transition hover:border-primary/40 hover:shadow-md"
              >
                <div className="relative aspect-[4/3] overflow-hidden">
                  <img src={p.images?.[0]} alt={p.name} className="h-full w-full object-cover transition group-hover:scale-105" />
                </div>
                <div className="p-2.5">
                  <p className="truncate text-xs font-semibold">{p.name}</p>
                  <p className="truncate text-[10px] text-muted-foreground">{p.brand} · {p.category}</p>
                  <p className="mt-1 text-sm font-bold text-primary">{formatPrice(p.priceMin, p.priceMax)}</p>
                  {p.business && (
                    <p className="mt-1 truncate text-[10px] text-muted-foreground">by {p.business.name}</p>
                  )}
                </div>
              </button>
            ))}
          </div>
        </section>
      )}

      {/* Services */}
      {services.length > 0 && (
        <section className="mb-6">
          <div className="mb-3 flex items-center gap-2">
            <Wrench className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-semibold">Services</h2>
            <span className="text-xs text-muted-foreground">({services.length})</span>
          </div>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {services.map((s) => (
              <button
                key={s.id}
                onClick={() => setView({ name: 'service', id: s.id })}
                className="group flex gap-3 rounded-xl border border-border bg-card p-3 text-left transition hover:border-primary/40 hover:shadow-md"
              >
                <img src={s.photos?.[0]} alt={s.name} className="h-16 w-16 shrink-0 rounded-lg object-cover" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold">{s.name}</p>
                  <p className="mt-0.5 line-clamp-2 text-[11px] text-muted-foreground">{s.description}</p>
                  <p className="mt-1 text-xs font-bold text-primary">{s.pricing}</p>
                  {s.business && <p className="mt-0.5 truncate text-[10px] text-muted-foreground">by {s.business.name}</p>}
                </div>
              </button>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
