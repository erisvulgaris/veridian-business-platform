'use client'

import * as React from 'react'
import { GitCompare, X, Minus, ArrowRight, Plus } from 'lucide-react'
import { useAppStore } from '@/lib/store'
import type { Product, Business } from '@/lib/types'
import { formatPrice } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

export function ProductCompareView({ ids }: { ids: string[] }) {
  const { setView, clearCompareProducts, toggleCompareProduct } = useAppStore()
  const [selected, setSelected] = React.useState<(Product & { business: Business })[]>([])

  // Fetch each product by ID directly
  React.useEffect(() => {
    if (ids.length === 0) { setSelected([]); return }
    Promise.all(
      ids.map((id) =>
        fetch(`/api/products/${id}`).then((r) => r.json()).then((d) => d.product).catch(() => null)
      )
    ).then((results) => setSelected(results.filter(Boolean)))
  }, [ids])

  const [loading, setLoading] = React.useState(true)
  React.useEffect(() => { setLoading(true); Promise.all(ids.map((id) => fetch(`/api/products/${id}`).then((r) => r.json()))).then(() => setLoading(false)) }, [ids])

  // Collect all unique spec labels across selected products
  const allSpecLabels = React.useMemo(() => {
    const labels = new Set<string>()
    selected.forEach((p) => p.specifications?.forEach((s) => labels.add(s.label)))
    return Array.from(labels)
  }, [selected])

  const rows: { label: string; get: (p: Product & { business: Business }) => React.ReactNode; highlight?: (p: Product & { business: Business }) => boolean }[] = [
    { label: 'Price', get: (p) => <span className="font-bold text-primary">{formatPrice(p.priceMin, p.priceMax, p.currency)}</span> },
    { label: 'Brand', get: (p) => p.brand },
    { label: 'Category', get: (p) => p.category },
    { label: 'Availability', get: (p) => {
      const cfg: Record<string, { label: string; color: string }> = {
        in_stock: { label: 'In stock', color: '#10b981' },
        low_stock: { label: 'Low stock', color: '#f59e0b' },
        preorder: { label: 'Pre-order', color: '#3b82f6' },
        out_of_stock: { label: 'Out of stock', color: '#9ca3af' },
        made_to_order: { label: 'Made to order', color: '#8b5cf6' },
      }
      const a = cfg[p.availability] || cfg.in_stock
      return <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium text-white" style={{ background: a.color }}>{a.label}</span>
    }},
    { label: 'Variants', get: (p) => p.variants?.length || 0 },
    { label: 'Supplier', get: (p) => <button onClick={() => setView({ name: 'business', id: p.business.id, slug: p.business.slug })} className="font-medium text-primary hover:underline">{p.business.name}</button> },
    ...allSpecLabels.map((label) => ({
      label,
      get: (p: Product & { business: Business }) => {
        const spec = p.specifications?.find((s) => s.label === label)
        return spec ? <span className="font-medium">{spec.value}</span> : <Minus className="h-3 w-3 text-muted-foreground/30" />
      },
    })),
  ]

  return (
    <div className="mx-auto max-w-6xl px-3 py-4 sm:px-4">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <GitCompare className="h-4 w-4 text-primary" />
            <h1 className="text-xl font-bold tracking-tight sm:text-2xl">Compare products</h1>
          </div>
          <p className="text-xs text-muted-foreground">Side-by-side comparison · up to 3 products</p>
        </div>
        {selected.length > 0 && (
          <Button variant="outline" size="sm" onClick={clearCompareProducts}>Clear all</Button>
        )}
      </div>

      {selected.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border py-16 text-center">
          <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-2xl bg-secondary text-muted-foreground">
            <GitCompare className="h-7 w-7" />
          </div>
          <p className="text-sm font-semibold">Nothing to compare yet</p>
          <p className="mt-1 max-w-sm text-xs text-muted-foreground">
            Add up to 3 products to compare prices, specifications, availability and suppliers side by side.
          </p>
          <Button className="mt-4" onClick={() => setView({ name: 'home' })}>Browse businesses</Button>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-border bg-card card-elevated">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="w-32 p-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Attribute</th>
                {selected.map((p) => (
                  <th key={p.id} className="p-3 text-left align-top">
                    <div className="relative group">
                      <button
                        onClick={() => { toggleCompareProduct(p.id); toast.success('Removed from compare') }}
                        className="absolute right-0 top-0 flex h-6 w-6 items-center justify-center rounded-full text-muted-foreground opacity-0 transition hover:bg-rose-500/10 hover:text-rose-500 group-hover:opacity-100"
                        aria-label="Remove"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                      <div className="mb-2 aspect-square w-full max-w-[120px] overflow-hidden rounded-lg">
                        <img src={p.images?.[0]} alt={p.name} className="h-full w-full object-cover" />
                      </div>
                      <button onClick={() => setView({ name: 'product', id: p.id })} className="block text-left">
                        <p className="text-sm font-semibold leading-tight hover:text-primary">{p.name}</p>
                      </button>
                    </div>
                  </th>
                ))}
                {Array.from({ length: 3 - selected.length }).map((_, i) => (
                  <th key={i} className="p-3">
                    <button
                      onClick={() => setView({ name: 'home' })}
                      className="flex h-32 w-full flex-col items-center justify-center rounded-lg border border-dashed border-border text-[10px] text-muted-foreground transition hover:border-primary/40 hover:text-primary"
                    >
                      <Plus className="mb-1 h-4 w-4" /> Add product
                    </button>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr key={row.label} className={cn('border-b border-border/60', i % 2 === 1 && 'bg-secondary/30')}>
                  <td className="p-3 text-xs font-medium text-muted-foreground">{row.label}</td>
                  {selected.map((p) => (
                    <td key={p.id} className="p-3 text-xs">{row.get(p)}</td>
                  ))}
                  {Array.from({ length: 3 - selected.length }).map((_, j) => (
                    <td key={j} className="p-3"><Minus className="h-3 w-3 text-muted-foreground/30" /></td>
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
