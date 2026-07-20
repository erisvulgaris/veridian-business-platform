'use client'

import * as React from 'react'
import useSWR from 'swr'
import { GitCompare, X, Check, Minus, ArrowRight, Star, ShieldCheck } from 'lucide-react'
import { useAppStore } from '@/lib/store'
import type { Business } from '@/lib/types'
import { VerificationBadge } from '@/components/verification-badge'
import { RatingStars } from '@/components/rating-stars'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import { formatNumber } from '@/lib/types'

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export function CompareView({ ids }: { ids: string[] }) {
  const { data, isLoading } = useSWR<{ businesses: Business[] }>('/api/businesses?limit=60', fetcher)
  const { setView, clearCompare } = useAppStore()
  const all = data?.businesses ?? []
  const selected = ids.map((id) => all.find((b) => b.id === id)).filter(Boolean) as Business[]

  const rows: { label: string; get: (b: Business) => React.ReactNode }[] = [
    { label: 'Rating', get: (b) => <RatingStars rating={b.rating} size="xs" count={b.reviewCount} /> },
    { label: 'Verification', get: (b) => <VerificationBadge level={b.verified} size="xs" /> },
    { label: 'Category', get: (b) => b.category },
    { label: 'Area', get: (b) => b.area },
    { label: 'Open now', get: (b) => (b.isOpen ? <Check className="h-4 w-4 text-emerald-500" /> : <X className="h-4 w-4 text-zinc-400" />) },
    { label: 'Founded', get: (b) => b.foundedYear },
    { label: 'Team size', get: (b) => b.teamSize },
    { label: 'Reviews', get: (b) => formatNumber(b.reviewCount) },
    { label: 'Views', get: (b) => formatNumber(b.viewCount) },
    { label: 'Response', get: (b) => b.responseTime },
    { label: 'Languages', get: (b) => b.languages.join(', ') },
    { label: 'Facilities', get: (b) => `${b.facilities.length} facilities` },
    { label: 'Certifications', get: (b) => `${b.certifications.length} certs` },
  ]

  return (
    <div className="mx-auto max-w-6xl px-3 py-4 sm:px-4">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <GitCompare className="h-4 w-4 text-primary" />
            <h1 className="text-xl font-bold tracking-tight sm:text-2xl">Compare businesses</h1>
          </div>
          <p className="text-xs text-muted-foreground">Side-by-side comparison · up to 3 businesses</p>
        </div>
        {selected.length > 0 && (
          <Button variant="outline" size="sm" onClick={clearCompare}>Clear all</Button>
        )}
      </div>

      {selected.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border py-16 text-center">
          <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-2xl bg-secondary text-muted-foreground">
            <GitCompare className="h-7 w-7" />
          </div>
          <p className="text-sm font-semibold">Nothing to compare yet</p>
          <p className="mt-1 max-w-sm text-xs text-muted-foreground">Add up to 3 businesses to compare ratings, verification, facilities and more.</p>
          <Button className="mt-4" onClick={() => setView({ name: 'home' })}>Browse businesses</Button>
        </div>
      ) : isLoading ? (
        <Skeleton className="h-64 rounded-2xl" />
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-border bg-card card-elevated">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="w-32 p-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Attribute</th>
                {selected.map((b) => (
                  <th key={b.id} className="p-3 text-left align-top">
                    <button onClick={() => setView({ name: 'business', id: b.id, slug: b.slug })} className="group block w-full text-left">
                      <div className="flex items-center gap-2">
                        <img src={b.logo} alt="" className="h-9 w-9 rounded-lg object-cover" />
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold group-hover:text-primary">{b.name}</p>
                          <p className="truncate text-[10px] text-muted-foreground">{b.area}</p>
                        </div>
                      </div>
                    </button>
                  </th>
                ))}
                {Array.from({ length: 3 - selected.length }).map((_, i) => (
                  <th key={i} className="p-3">
                    <div className="flex h-16 flex-col items-center justify-center rounded-lg border border-dashed border-border text-[10px] text-muted-foreground">
                      <Plus /> slot {selected.length + i + 1}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr key={row.label} className={cn('border-b border-border/60', i % 2 === 1 && 'bg-secondary/30')}>
                  <td className="p-3 text-xs font-medium text-muted-foreground">{row.label}</td>
                  {selected.map((b) => (
                    <td key={b.id} className="p-3 text-xs">{row.get(b)}</td>
                  ))}
                  {Array.from({ length: 3 - selected.length }).map((_, i) => (
                    <td key={i} className="p-3"><Minus className="h-3 w-3 text-muted-foreground/30" /></td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function Plus() {
  return <span className="text-base leading-none">+</span>
}
