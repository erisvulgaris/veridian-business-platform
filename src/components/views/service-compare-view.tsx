'use client'

import * as React from 'react'
import { GitCompare, X, Minus, ArrowRight, Plus, Wrench, Clock, MapPin, IndianRupee, CheckCircle2 } from 'lucide-react'
import { useAppStore } from '@/lib/store'
import type { Service, Business } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

export function ServiceCompareView({ ids }: { ids: string[] }) {
  const { setView, clearCompareServices, toggleCompareService } = useAppStore()
  const [selected, setSelected] = React.useState<(Service & { business: Business })[]>([])

  React.useEffect(() => {
    if (ids.length === 0) { setSelected([]); return }
    Promise.all(
      ids.map((id) =>
        fetch(`/api/services/${id}`).then((r) => r.json()).then((d) => d.service).catch(() => null)
      )
    ).then((results) => setSelected(results.filter(Boolean)))
  }, [ids])

  const rows: { label: string; icon: React.ReactNode; get: (s: Service & { business: Business }) => React.ReactNode }[] = [
    { label: 'Pricing', icon: <IndianRupee className="h-3.5 w-3.5" />, get: (s) => <span className="font-bold text-primary">{s.pricing}</span> },
    { label: 'Duration', icon: <Clock className="h-3.5 w-3.5" />, get: (s) => s.duration },
    { label: 'Coverage', icon: <MapPin className="h-3.5 w-3.5" />, get: (s) => s.coverageArea },
    { label: 'Provider', icon: <Wrench className="h-3.5 w-3.5" />, get: (s) => <button onClick={() => setView({ name: 'business', id: s.business.id, slug: s.business.slug })} className="font-medium text-primary hover:underline">{s.business.name}</button> },
    { label: 'Deliverables', icon: <CheckCircle2 className="h-3.5 w-3.5" />, get: (s) => (
      <div className="space-y-0.5">
        {s.deliverables?.map((d) => <div key={d} className="flex items-center gap-1"><CheckCircle2 className="h-2.5 w-2.5 text-emerald-500" /> {d}</div>)}
      </div>
    )},
    { label: 'Requirements', icon: <Minus className="h-3.5 w-3.5" />, get: (s) => (
      <div className="space-y-0.5">
        {s.requirements?.map((r) => <div key={r} className="text-muted-foreground">• {r}</div>)}
      </div>
    )},
  ]

  return (
    <div className="mx-auto max-w-6xl px-3 py-4 sm:px-4">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <GitCompare className="h-4 w-4 text-primary" />
            <h1 className="text-xl font-bold tracking-tight sm:text-2xl">Compare services</h1>
          </div>
          <p className="text-xs text-muted-foreground">Side-by-side comparison · up to 3 services</p>
        </div>
        {selected.length > 0 && (
          <Button variant="outline" size="sm" onClick={clearCompareServices}>Clear all</Button>
        )}
      </div>

      {selected.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border py-16 text-center">
          <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-2xl bg-secondary text-muted-foreground">
            <GitCompare className="h-7 w-7" />
          </div>
          <p className="text-sm font-semibold">Nothing to compare yet</p>
          <p className="mt-1 max-w-sm text-xs text-muted-foreground">
            Add up to 3 services to compare pricing, duration, coverage, deliverables and providers side by side.
          </p>
          <Button className="mt-4" onClick={() => setView({ name: 'home' })}>Browse businesses</Button>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-border bg-card card-elevated">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="w-32 p-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Attribute</th>
                {selected.map((s) => (
                  <th key={s.id} className="p-3 text-left align-top">
                    <div className="relative group">
                      <button
                        onClick={() => { toggleCompareService(s.id); toast.success('Removed from compare') }}
                        className="absolute right-0 top-0 flex h-6 w-6 items-center justify-center rounded-full text-muted-foreground opacity-0 transition hover:bg-rose-500/10 hover:text-rose-500 group-hover:opacity-100"
                        aria-label="Remove"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                      <div className="mb-2 aspect-video w-full max-w-[140px] overflow-hidden rounded-lg">
                        <img src={s.photos?.[0]} alt={s.name} className="h-full w-full object-cover" />
                      </div>
                      <button onClick={() => setView({ name: 'service', id: s.id })} className="block text-left">
                        <p className="text-sm font-semibold leading-tight hover:text-primary">{s.name}</p>
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
                      <Plus className="mb-1 h-4 w-4" /> Add service
                    </button>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr key={row.label} className={cn('border-b border-border/60', i % 2 === 1 && 'bg-secondary/30')}>
                  <td className="p-3">
                    <span className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                      {row.icon} {row.label}
                    </span>
                  </td>
                  {selected.map((s) => (
                    <td key={s.id} className="p-3 text-xs">{row.get(s)}</td>
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
