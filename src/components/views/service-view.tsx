'use client'

import * as React from 'react'
import useSWR from 'swr'
import { Wrench, ChevronRight, Clock, MapPin, CheckCircle2, FileText, Store } from 'lucide-react'
import { useAppStore } from '@/lib/store'
import type { Service, Business } from '@/lib/types'
import { VerificationBadge } from '@/components/verification-badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export function ServiceView({ id }: { id: string }) {
  const { data, isLoading } = useSWR<{ service: Service & { business: Business } }>(`/api/services/${id}`, fetcher)
  const { setView } = useAppStore()
  const s = data?.service
  const [activePhoto, setActivePhoto] = React.useState(0)

  React.useEffect(() => setActivePhoto(0), [id])

  if (isLoading) {
    return (
      <div className="mx-auto max-w-4xl px-3 py-4 sm:px-4">
        <Skeleton className="h-48 w-full rounded-2xl" />
        <div className="mt-4 space-y-3">
          <Skeleton className="h-6 w-3/4" />
          <Skeleton className="h-20 w-full" />
        </div>
      </div>
    )
  }
  if (!s) return <div className="py-20 text-center text-muted-foreground">Service not found.</div>

  return (
    <div className="mx-auto max-w-4xl px-3 py-4 sm:px-4">
      <div className="mb-3 flex items-center gap-1.5 text-xs text-muted-foreground">
        <button onClick={() => setView({ name: 'business', id: s.business.id, slug: s.business.slug })} className="hover:text-foreground">{s.business.name}</button>
        <ChevronRight className="h-3 w-3" />
        <span className="text-foreground">Services</span>
        <ChevronRight className="h-3 w-3" />
        <span className="truncate text-foreground">{s.name}</span>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-card card-elevated">
        <div className="relative aspect-[16/9] overflow-hidden">
          <img src={s.photos[activePhoto]} alt={s.name} className="h-full w-full object-cover" />
        </div>
        {s.photos.length > 1 && (
          <div className="flex gap-2 p-3">
            {s.photos.map((ph, i) => (
              <button key={i} onClick={() => setActivePhoto(i)} className={`h-14 w-14 overflow-hidden rounded-lg border-2 transition ${activePhoto === i ? 'border-primary' : 'border-transparent opacity-60'}`}>
                <img src={ph} alt="" className="h-full w-full object-cover" />
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="mt-4">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
            <Wrench className="h-4 w-4 text-primary" />
          </div>
          <h1 className="text-xl font-bold tracking-tight sm:text-2xl">{s.name}</h1>
        </div>
        <p className="mt-2 text-sm leading-relaxed text-foreground/90">{s.description}</p>

        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
          <InfoTile icon={<span className="text-base font-bold text-primary">₹</span>} label="Pricing" value={s.pricing} />
          <InfoTile icon={<Clock className="h-4 w-4 text-primary" />} label="Duration" value={s.duration} />
          <InfoTile icon={<MapPin className="h-4 w-4 text-primary" />} label="Coverage" value={s.coverageArea} />
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span className="text-xs text-muted-foreground">Offered by</span>
          <button onClick={() => setView({ name: 'business', id: s.business.id, slug: s.business.slug })} className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-2.5 py-1 text-xs font-medium hover:bg-accent">
            <Store className="h-3 w-3" /> {s.business.name}
          </button>
          <VerificationBadge level={s.business.verified} size="xs" />
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2">
          <Button className="h-10" onClick={() => toast.success('Booking request sent')}>Book service</Button>
          <Button variant="outline" className="h-10" onClick={() => window.open(`tel:${s.business.phone}`)}>Call business</Button>
        </div>

        {/* Deliverables & requirements */}
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-border bg-card p-4 card-elevated">
            <h3 className="mb-2 flex items-center gap-1.5 text-sm font-semibold"><CheckCircle2 className="h-4 w-4 text-emerald-500" /> What's included</h3>
            <ul className="space-y-1.5">
              {s.deliverables.map((d) => (
                <li key={d} className="flex items-center gap-2 text-xs">
                  <CheckCircle2 className="h-3 w-3 text-emerald-500" /> {d}
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-2xl border border-border bg-card p-4 card-elevated">
            <h3 className="mb-2 flex items-center gap-1.5 text-sm font-semibold"><FileText className="h-4 w-4 text-primary" /> Requirements</h3>
            <ul className="space-y-1.5">
              {s.requirements.map((r) => (
                <li key={r} className="flex items-center gap-2 text-xs">
                  <span className="h-1 w-1 rounded-full bg-muted-foreground" /> {r}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {s.faqs.length > 0 && (
          <section className="mt-6">
            <h2 className="mb-3 text-sm font-semibold">FAQs</h2>
            <div className="space-y-2">
              {s.faqs.map((f, i) => (
                <div key={i} className="rounded-xl border border-border bg-card p-3">
                  <p className="text-sm font-medium">{f.q}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{f.a}</p>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  )
}

function InfoTile({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-3">
      <div className="mb-1 flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-muted-foreground">{icon} {label}</div>
      <p className="text-sm font-medium">{value}</p>
    </div>
  )
}
