'use client'

import * as React from 'react'
import useSWR from 'swr'
import { ArrowLeft, Package, Store, Tag, FileText, Wrench, ChevronRight, ShoppingCart, Share2, GitCompare } from 'lucide-react'
import { useAppStore } from '@/lib/store'
import type { Product, Business } from '@/lib/types'
import { formatPrice } from '@/lib/types'
import { VerificationBadge } from '@/components/verification-badge'
import { RFQModal } from '@/components/rfq-modal'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

const fetcher = (url: string) => fetch(url).then((r) => r.json())

const AVAILABILITY: Record<string, { label: string; color: string }> = {
  in_stock: { label: 'In stock', color: '#10b981' },
  low_stock: { label: 'Low stock', color: '#f59e0b' },
  preorder: { label: 'Pre-order', color: '#3b82f6' },
  out_of_stock: { label: 'Out of stock', color: '#9ca3af' },
  made_to_order: { label: 'Made to order', color: '#8b5cf6' },
}

export function ProductView({ id }: { id: string }) {
  const { data, isLoading } = useSWR<{ product: Product & { business: Business }; related: (Product & { business: Business })[] }>(`/api/products/${id}`, fetcher)
  const { setView, toggleSaveProduct, savedProductIds, toggleCompareProduct, compareProductIds } = useAppStore()
  const p = data?.product
  const [activeImage, setActiveImage] = React.useState(0)
  const [rfqOpen, setRfqOpen] = React.useState(false)

  const share = async () => {
    try {
      if (navigator.share) {
        await navigator.share({ title: p?.name || 'Product', text: p?.description?.slice(0, 100), url: window.location.href })
      } else {
        await navigator.clipboard.writeText(window.location.href)
        toast.success('Link copied to clipboard')
      }
    } catch {}
  }

  React.useEffect(() => { setActiveImage(0) }, [id])

  if (isLoading) {
    return (
      <div className="mx-auto max-w-5xl px-3 py-4 sm:px-4">
        <div className="grid gap-4 md:grid-cols-2">
          <Skeleton className="aspect-square rounded-2xl" />
          <div className="space-y-3">
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        </div>
      </div>
    )
  }
  if (!p) return <div className="py-20 text-center text-muted-foreground">Product not found.</div>

  const saved = savedProductIds.includes(p.id)
  const av = AVAILABILITY[p.availability] || AVAILABILITY.in_stock

  return (
    <div className="mx-auto max-w-5xl px-3 py-4 sm:px-4">
      {/* Breadcrumb */}
      <div className="mb-3 flex items-center gap-1.5 text-xs text-muted-foreground">
        <button onClick={() => setView({ name: 'business', id: p.business.id, slug: p.business.slug })} className="hover:text-foreground">
          {p.business.name}
        </button>
        <ChevronRight className="h-3 w-3" />
        <span className="text-foreground">Products</span>
        <ChevronRight className="h-3 w-3" />
        <span className="truncate text-foreground">{p.name}</span>
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        {/* Gallery */}
        <div>
          <div className="relative aspect-square overflow-hidden rounded-2xl border border-border bg-card">
            <img src={p.images[activeImage]} alt={p.name} className="h-full w-full object-cover" />
            <span className="absolute left-3 top-3 rounded-full px-2 py-0.5 text-[10px] font-bold text-white backdrop-blur" style={{ background: av.color + 'cc' }}>{av.label}</span>
            {p.featured && <span className="absolute right-3 top-3 rounded-full bg-amber-500 px-2 py-0.5 text-[10px] font-bold text-white">FEATURED</span>}
          </div>
          {p.images.length > 1 && (
            <div className="mt-2 flex gap-2">
              {p.images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setActiveImage(i)}
                  className={cn('h-16 w-16 overflow-hidden rounded-lg border-2 transition', activeImage === i ? 'border-primary' : 'border-transparent opacity-60 hover:opacity-100')}
                >
                  <img src={img} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex flex-col">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{p.category}</p>
          <h1 className="mt-1 text-xl font-bold tracking-tight sm:text-2xl">{p.name}</h1>
          <p className="mt-1 text-sm text-muted-foreground">by <button onClick={() => setView({ name: 'business', id: p.business.id, slug: p.business.slug })} className="font-medium text-primary hover:underline">{p.business.name}</button> · Brand: {p.brand}</p>

          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-primary">{formatPrice(p.priceMin, p.priceMax, p.currency)}</span>
            <span className="text-xs text-muted-foreground">est. price</span>
          </div>

          <div className="mt-3 flex flex-wrap gap-1.5">
            <VerificationBadge level={p.business.verified} size="xs" />
            {p.variants.map((v) => (
              <span key={v} className="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-medium">{v}</span>
            ))}
          </div>

          <p className="mt-3 text-sm leading-relaxed text-foreground/90">{p.description}</p>

          {/* Actions */}
          <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
            <Button className="h-10 gap-1.5" onClick={() => setRfqOpen(true)}>
              <ShoppingCart className="h-4 w-4" /> <span className="hidden sm:inline">Quote</span>
            </Button>
            <Button variant="outline" className={cn('h-10 gap-1.5', saved && 'border-primary text-primary')} onClick={() => { toggleSaveProduct(p.id); toast.success(saved ? 'Removed' : 'Saved') }}>
              {saved ? 'Saved' : 'Save'} <Tag className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              className={cn('h-10 gap-1.5', compareProductIds.includes(p.id) && 'border-primary text-primary bg-primary/5')}
              onClick={() => {
                if (!compareProductIds.includes(p.id) && compareProductIds.length >= 3) { toast.error('Compare max 3 products'); return }
                toggleCompareProduct(p.id)
                toast.success(compareProductIds.includes(p.id) ? 'Removed from compare' : `Added to compare (${compareProductIds.length + 1}/3)`)
              }}
            >
              <GitCompare className="h-4 w-4" /> <span className="hidden sm:inline">Compare</span>
            </Button>
            <Button variant="outline" className="h-10 gap-1.5" onClick={share}>
              <Share2 className="h-4 w-4" /> <span className="hidden sm:inline">Share</span>
            </Button>
          </div>

          {/* Specifications */}
          <div className="mt-5 rounded-2xl border border-border bg-card p-4 card-elevated">
            <h3 className="mb-2 text-sm font-semibold">Specifications</h3>
            <div className="grid grid-cols-2 gap-x-4 gap-y-2">
              {p.specifications.map((s) => (
                <div key={s.label} className="text-xs">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{s.label}</p>
                  <p className="font-medium">{s.value}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Documents */}
          {p.documents.length > 0 && (
            <div className="mt-3 rounded-2xl border border-border bg-card p-4 card-elevated">
              <h3 className="mb-2 text-sm font-semibold">Documents</h3>
              <div className="flex flex-wrap gap-2">
                {p.documents.map((d) => (
                  <span key={d} className="inline-flex items-center gap-1.5 rounded-lg bg-secondary px-2.5 py-1 text-xs">
                    <FileText className="h-3.5 w-3.5" /> {d}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* FAQs */}
      {p.faqs.length > 0 && (
        <section className="mt-6">
          <h2 className="mb-3 text-sm font-semibold">Frequently asked</h2>
          <div className="space-y-2">
            {p.faqs.map((f, i) => (
              <div key={i} className="rounded-xl border border-border bg-card p-3">
                <p className="text-sm font-medium">{f.q}</p>
                <p className="mt-1 text-xs text-muted-foreground">{f.a}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Related + price comparison */}
      {data?.related && data.related.length > 0 && (
        <section className="mt-8">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Package className="h-4 w-4 text-primary" />
              <h2 className="text-lg font-bold tracking-tight">Similar products & prices</h2>
            </div>
            <span className="text-xs text-muted-foreground">{data.related.length} alternatives</span>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {data.related.slice(0, 6).map((rp) => {
              const savedRp = savedProductIds.includes(rp.id)
              const inCompare = compareProductIds.includes(rp.id)
              // Price comparison vs current product
              const rpAvg = (rp.priceMin + (rp.priceMax || rp.priceMin)) / 2
              const curAvg = (p.priceMin + (p.priceMax || p.priceMin)) / 2
              const diff = rpAvg - curAvg
              const diffPct = curAvg > 0 ? Math.round((diff / curAvg) * 100) : 0
              return (
                <div key={rp.id} className="group overflow-hidden rounded-xl border border-border bg-card transition hover:border-primary/40 hover:shadow-md">
                  <button onClick={() => setView({ name: 'product', id: rp.id })} className="block w-full text-left">
                    <div className="relative aspect-[4/3] overflow-hidden">
                      <img src={rp.images?.[0]} alt={rp.name} className="h-full w-full object-cover transition group-hover:scale-105" />
                      {diff !== 0 && (
                        <span className={cn('absolute right-2 top-2 rounded-full px-1.5 py-0.5 text-[9px] font-bold text-white', diff > 0 ? 'bg-rose-500' : 'bg-emerald-500')}>
                          {diff > 0 ? '+' : ''}{diffPct}%
                        </span>
                      )}
                    </div>
                    <div className="p-2.5">
                      <p className="truncate text-xs font-semibold">{rp.name}</p>
                      <p className="truncate text-[10px] text-muted-foreground">by {rp.business?.name}</p>
                      <div className="mt-1 flex items-center justify-between">
                        <p className="text-sm font-bold text-primary">{formatPrice(rp.priceMin, rp.priceMax)}</p>
                        {diff !== 0 && (
                          <span className={cn('text-[10px] font-medium', diff > 0 ? 'text-rose-500' : 'text-emerald-600')}>
                            {diff > 0 ? '+' : '−'}{formatPrice(Math.abs(diff), 0)}
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                  <div className="flex items-center gap-1 border-t border-border px-2 py-1.5">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 flex-1 text-[10px]"
                      onClick={() => { toggleSaveProduct(rp.id); toast.success(savedRp ? 'Removed' : 'Saved') }}
                    >
                      <Tag className="h-3 w-3" /> {savedRp ? 'Saved' : 'Save'}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className={cn('h-7 flex-1 text-[10px]', inCompare && 'text-primary')}
                      onClick={() => {
                        if (!inCompare && compareProductIds.length >= 3) { toast.error('Compare max 3'); return }
                        toggleCompareProduct(rp.id)
                        toast.success(inCompare ? 'Removed' : 'Added to compare')
                      }}
                    >
                      <GitCompare className="h-3 w-3" /> {inCompare ? 'Added' : 'Compare'}
                    </Button>
                  </div>
                </div>
              )
            })}
          </div>
        </section>
      )}

      {/* RFQ modal */}
      <RFQModal
        open={rfqOpen}
        onClose={() => setRfqOpen(false)}
        businessId={p.business.id}
        businessName={p.business.name}
        businessSlug={p.business.slug}
        context={{ type: 'product', name: p.name, id: p.id }}
      />
    </div>
  )
}
