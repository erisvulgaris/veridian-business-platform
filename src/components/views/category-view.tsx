'use client'

import * as React from 'react'
import useSWR from 'swr'
import { useAppStore } from '@/lib/store'
import type { Business, Category } from '@/lib/types'
import { BusinessCard } from '@/components/business-card'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export function CategoryView({ slug, label }: { slug: string; label?: string }) {
  const { setView } = useAppStore()
  const { data: catData } = useSWR<{ categories: Category[] }>('/api/categories', fetcher)
  const category = catData?.categories.find((c) => c.slug === slug)

  const { data, isLoading } = useSWR<{ businesses: Business[] }>(
    `/api/businesses?category=${slug}&limit=60`,
    fetcher
  )
  const businesses = data?.businesses ?? []
  const [sort, setSort] = React.useState<'rating' | 'reviews' | 'newest'>('rating')

  const sorted = React.useMemo(() => {
    const arr = [...businesses]
    if (sort === 'rating') arr.sort((a, b) => b.rating - a.rating)
    if (sort === 'reviews') arr.sort((a, b) => b.reviewCount - a.reviewCount)
    return arr
  }, [businesses, sort])

  const displayName = label || category?.name || slug

  return (
    <div className="mx-auto max-w-6xl px-3 py-4 sm:px-4">
      {/* Breadcrumb + title */}
      <div className="mb-4">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <button onClick={() => setView({ name: 'home' })} className="hover:text-foreground">Home</button>
          <span>/</span>
          <span className="capitalize text-foreground">{displayName}</span>
        </div>
        <div className="mt-1 flex items-center gap-2">
          {category && (
            <span className="flex h-8 w-8 items-center justify-center rounded-lg" style={{ background: category.color + '20', color: category.color }}>
              <span className="h-3 w-3 rounded-full" style={{ background: category.color }} />
            </span>
          )}
          <h1 className="text-xl font-bold tracking-tight sm:text-2xl capitalize">{displayName}</h1>
          <span className="text-xs text-muted-foreground">({businesses.length} businesses)</span>
        </div>
      </div>

      {/* Sort */}
      <div className="mb-3 flex items-center gap-2">
        <span className="text-xs text-muted-foreground">Sort by</span>
        {(['rating', 'reviews', 'newest'] as const).map((s) => (
          <button
            key={s}
            onClick={() => setSort(s)}
            className={cn(
              'rounded-full border px-2.5 py-1 text-[11px] font-medium capitalize transition',
              sort === s ? 'border-primary bg-primary text-primary-foreground' : 'border-border hover:border-primary/40'
            )}
          >
            {s === 'newest' ? 'Newest' : s}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-48 rounded-2xl" />)}
        </div>
      ) : sorted.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border py-16 text-center">
          <p className="text-sm font-semibold">No businesses in this category yet</p>
          <p className="mt-1 text-xs text-muted-foreground">Check back soon or explore other categories.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {sorted.map((b) => (
            <BusinessCard key={b.id} business={b} layout="grid" />
          ))}
        </div>
      )}
    </div>
  )
}
