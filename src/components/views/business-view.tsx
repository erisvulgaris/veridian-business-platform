'use client'

import * as React from 'react'
import useSWR from 'swr'
import {
  MapPin, Clock, Phone, Mail, Globe, Bookmark, BookmarkCheck, Share2,
  MessageSquare, BadgeCheck, ShieldCheck, Crown, Award, Languages, CreditCard,
  Truck, Building2, Users, Calendar, Sparkles, ChevronRight, Package, Wrench,
  Star, ThumbsUp, Camera, ArrowRight, Navigation, FileText, Megaphone, Tag,
  Facebook, Instagram, Linkedin, Twitter, GitCompare, CheckCircle2, Loader2,
} from 'lucide-react'
import { useAppStore } from '@/lib/store'
import type { Business, Review } from '@/lib/types'
import { formatPrice, formatNumber, timeAgo } from '@/lib/types'
import { VerificationBadge } from '@/components/verification-badge'
import { RatingStars } from '@/components/rating-stars'
import { BusinessCard } from '@/components/business-card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export function BusinessView({ id, slug }: { id: string; slug: string }) {
  const { data, isLoading } = useSWR<{ business: Business & { products: any[]; services: any[]; reviews: Review[]; nearby: Business[] } }>(
    `/api/businesses/${slug || id}`,
    fetcher
  )
  const b = data?.business

  if (isLoading) {
    return (
      <div className="mx-auto max-w-6xl px-3 py-4 sm:px-4">
        <Skeleton className="h-48 w-full rounded-2xl" />
        <div className="mt-4 flex gap-4">
          <Skeleton className="h-20 w-20 rounded-2xl" />
          <div className="flex-1 space-y-3">
            <Skeleton className="h-6 w-2/3" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-4 w-1/3" />
          </div>
        </div>
        <Skeleton className="mt-6 h-64 w-full rounded-2xl" />
      </div>
    )
  }

  if (!b) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-20 text-center">
        <p className="text-muted-foreground">Business not found.</p>
      </div>
    )
  }

  return <BusinessDetail business={b} />
}

function BusinessDetail({ business: b }: { business: Business & { products: any[]; services: any[]; reviews: Review[]; nearby: Business[] } }) {
  const { savedBusinessIds, toggleSaveBusiness, compareIds, toggleCompare, setView } = useAppStore()
  const saved = savedBusinessIds.includes(b.id)
  const inCompare = compareIds.includes(b.id)
  const [activeTab, setActiveTab] = React.useState('overview')
  const [showAllGallery, setShowAllGallery] = React.useState(false)

  const gallery = b.gallery
  const visibleGallery = showAllGallery ? gallery : gallery.slice(0, 6)

  const share = async () => {
    try {
      if (navigator.share) {
        await navigator.share({ title: b.name, text: b.tagline, url: window.location.href })
      } else {
        await navigator.clipboard.writeText(window.location.href)
        toast.success('Link copied to clipboard')
      }
    } catch {}
  }

  return (
    <div className="mx-auto max-w-6xl px-3 py-4 sm:px-4">
      {/* Cover */}
      <div className="relative h-44 overflow-hidden rounded-2xl sm:h-56 md:h-64">
        <img src={b.coverImage} alt={b.name} className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-black/10" />
        {b.promotion && (
          <div className="absolute left-3 top-3 flex items-center gap-1.5 rounded-full bg-amber-500/95 px-3 py-1 text-xs font-bold text-white backdrop-blur shadow-lg">
            <Tag className="h-3.5 w-3.5" /> {b.promotion.title}
          </div>
        )}
        <div className="absolute bottom-3 right-3 flex gap-2">
          <Button size="sm" variant="secondary" className="h-8 gap-1.5 glass" onClick={share}>
            <Share2 className="h-3.5 w-3.5" /> Share
          </Button>
        </div>
      </div>

      {/* Header card */}
      <div className="relative -mt-10 mx-3 rounded-2xl border border-border bg-card p-4 card-elevated sm:mx-6 sm:p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
          <img
            src={b.logo}
            alt={b.name}
            className="h-16 w-16 shrink-0 rounded-2xl object-cover ring-2 ring-background shadow-lg sm:h-20 sm:w-20"
          />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-lg font-bold tracking-tight sm:text-xl">{b.name}</h1>
              <VerificationBadge level={b.verified} size="sm" />
              {b.trending && (
                <span className="rounded-full bg-rose-500/10 px-2 py-0.5 text-[10px] font-bold text-rose-600 dark:text-rose-400">TRENDING</span>
              )}
            </div>
            <p className="mt-0.5 text-sm text-muted-foreground">{b.tagline}</p>
            <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
              <RatingStars rating={b.rating} size="sm" count={b.reviewCount} />
              <span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3" />{b.area}, {b.city}</span>
              <span className={cn('inline-flex items-center gap-1 font-medium', b.isOpen ? 'text-emerald-600 dark:text-emerald-400' : 'text-zinc-400')}>
                <span className="h-1.5 w-1.5 rounded-full" style={{ background: b.isOpen ? '#10b981' : '#9ca3af' }} />
                {b.isOpen ? 'Open now' : 'Closed'}
              </span>
              <span className="inline-flex items-center gap-1"><Calendar className="h-3 w-3" />Since {b.foundedYear}</span>
              <span className="inline-flex items-center gap-1"><Users className="h-3 w-3" />{b.teamSize} team</span>
            </div>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {b.subCategories.slice(0, 4).map((s) => (
                <span key={s} className="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-medium text-secondary-foreground">{s}</span>
              ))}
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
          <Button size="sm" className="h-9 gap-1.5" onClick={() => window.open(`tel:${b.phone}`)}>
            <Phone className="h-3.5 w-3.5" /> Call
          </Button>
          <Button size="sm" variant="outline" className="h-9 gap-1.5" onClick={() => toast.success('Quotation request sent')}>
            <MessageSquare className="h-3.5 w-3.5" /> Quote
          </Button>
          <Button
            size="sm"
            variant="outline"
            className={cn('h-9 gap-1.5', saved && 'border-primary text-primary')}
            onClick={() => { toggleSaveBusiness(b.id); toast.success(saved ? 'Removed from saved' : 'Saved to collection') }}
          >
            {saved ? <BookmarkCheck className="h-3.5 w-3.5" /> : <Bookmark className="h-3.5 w-3.5" />}
            {saved ? 'Saved' : 'Save'}
          </Button>
          <Button
            size="sm"
            variant="outline"
            className={cn('h-9 gap-1.5', inCompare && 'border-primary text-primary')}
            onClick={() => {
              toggleCompare(b.id)
              if (!inCompare) toast.success(`Added to compare (${compareIds.length + 1}/3)`)
            }}
          >
            <GitCompare className="h-3.5 w-3.5" /> Compare
          </Button>
        </div>
      </div>

      {/* AI Summary */}
      <AISummary businessId={b.slug} />

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4">
        <TabsList className="h-10 w-full justify-start overflow-x-auto no-scrollbar rounded-xl bg-card border">
          <TabsTrigger value="overview" className="text-xs">Overview</TabsTrigger>
          <TabsTrigger value="products" className="text-xs">Products {b.products.length > 0 && `(${b.products.length})`}</TabsTrigger>
          <TabsTrigger value="services" className="text-xs">Services {b.services.length > 0 && `(${b.services.length})`}</TabsTrigger>
          <TabsTrigger value="reviews" className="text-xs">Reviews ({b.reviewCount})</TabsTrigger>
          <TabsTrigger value="about" className="text-xs">About</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-3 space-y-4">
          <div className="grid gap-4 lg:grid-cols-3">
            <div className="lg:col-span-2 space-y-4">
              {/* Description */}
              <Card title="About">
                <p className="text-sm leading-relaxed text-foreground/90">{b.description}</p>
              </Card>

              {/* Gallery */}
              {gallery.length > 0 && (
                <Card title="Gallery">
                  <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                    {visibleGallery.map((g, i) => (
                      <div key={i} className="group relative aspect-square overflow-hidden rounded-lg">
                        <img src={g} alt="" className="h-full w-full object-cover transition group-hover:scale-110" />
                      </div>
                    ))}
                  </div>
                  {gallery.length > 6 && (
                    <button onClick={() => setShowAllGallery((s) => !s)} className="mt-2 text-xs font-medium text-primary hover:underline">
                      {showAllGallery ? 'Show less' : `Show all ${gallery.length} photos`}
                    </button>
                  )}
                </Card>
              )}

              {/* Announcement */}
              {b.announcement && (
                <div className="flex gap-3 rounded-xl border border-primary/20 bg-primary/5 p-3">
                  <Megaphone className="h-5 w-5 shrink-0 text-primary" />
                  <div>
                    <p className="text-sm font-semibold">{b.announcement.title}</p>
                    <p className="text-xs text-muted-foreground">{b.announcement.body}</p>
                  </div>
                </div>
              )}

              {/* Products preview */}
              {b.products.length > 0 && (
                <Card title="Featured products" action={<button onClick={() => setActiveTab('products')} className="text-xs font-medium text-primary hover:underline inline-flex items-center gap-0.5">View all <ChevronRight className="h-3 w-3" /></button>}>
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    {b.products.filter((p) => p.featured).slice(0, 2).map((p) => (
                      <ProductRow key={p.id} product={p} />
                    ))}
                    {b.products.filter((p) => p.featured).length === 0 && b.products.slice(0, 2).map((p) => (
                      <ProductRow key={p.id} product={p} />
                    ))}
                  </div>
                </Card>
              )}

              {/* Services preview */}
              {b.services.length > 0 && (
                <Card title="Services" action={<button onClick={() => setActiveTab('services')} className="text-xs font-medium text-primary hover:underline inline-flex items-center gap-0.5">View all <ChevronRight className="h-3 w-3" /></button>}>
                  <div className="space-y-2">
                    {b.services.slice(0, 2).map((s) => (
                      <ServiceRow key={s.id} service={s} />
                    ))}
                  </div>
                </Card>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-4">
              <Card title="Contact & location">
                <div className="space-y-2.5 text-xs">
                  <InfoRow icon={<MapPin className="h-3.5 w-3.5" />} value={b.address} />
                  <InfoRow icon={<Phone className="h-3.5 w-3.5" />} value={b.phone} href={`tel:${b.phone}`} />
                  <InfoRow icon={<Mail className="h-3.5 w-3.5" />} value={b.email} href={`mailto:${b.email}`} />
                  <InfoRow icon={<Globe className="h-3.5 w-3.5" />} value={b.website.replace('https://', '')} href={b.website} />
                  {b.whatsapp && <InfoRow icon={<MessageSquare className="h-3.5 w-3.5" />} value={`WhatsApp: ${b.whatsapp}`} />}
                  <InfoRow icon={<Clock className="h-3.5 w-3.5" />} value={b.responseTime} label="Response time" />
                </div>
                {/* Hours */}
                <Separator className="my-3" />
                <div className="space-y-1.5">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Business hours</p>
                  {b.hours.days.map((d) => (
                    <div key={d.day} className="flex justify-between text-xs">
                      <span className="text-muted-foreground">{d.day}</span>
                      <span className={cn('font-medium', d.open === 'Closed' ? 'text-zinc-400' : 'text-foreground')}>
                        {d.open === 'Closed' ? 'Closed' : `${d.open} – ${d.close}`}
                      </span>
                    </div>
                  ))}
                </div>
              </Card>

              <Card title="Languages & payments">
                <div className="space-y-2">
                  <div className="flex flex-wrap gap-1">
                    {b.languages.map((l) => (
                      <span key={l} className="inline-flex items-center gap-1 rounded-full bg-secondary px-2 py-0.5 text-[10px]"><Languages className="h-2.5 w-2.5" />{l}</span>
                    ))}
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {b.paymentMethods.map((p) => (
                      <span key={p} className="inline-flex items-center gap-1 rounded-full bg-secondary px-2 py-0.5 text-[10px]"><CreditCard className="h-2.5 w-2.5" />{p}</span>
                    ))}
                  </div>
                </div>
              </Card>

              <Card title="Facilities">
                <div className="flex flex-wrap gap-1">
                  {b.facilities.map((f) => (
                    <span key={f} className="inline-flex items-center gap-1 rounded-full bg-secondary px-2 py-0.5 text-[10px]"><CheckCircle2 className="h-2.5 w-2.5 text-primary" />{f}</span>
                  ))}
                </div>
              </Card>

              <Card title="Delivery options">
                <div className="flex flex-wrap gap-1">
                  {b.deliveryOptions.map((d) => (
                    <span key={d} className="inline-flex items-center gap-1 rounded-full bg-secondary px-2 py-0.5 text-[10px]"><Truck className="h-2.5 w-2.5" />{d}</span>
                  ))}
                </div>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="products" className="mt-3">
          {b.products.length === 0 ? (
            <EmptyState icon={<Package className="h-8 w-8" />} title="No products listed" subtitle="This business hasn't published products yet." />
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {b.products.map((p) => (
                <ProductCard key={p.id} product={p} businessId={b.id} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="services" className="mt-3">
          {b.services.length === 0 ? (
            <EmptyState icon={<Wrench className="h-8 w-8" />} title="No services listed" subtitle="This business hasn't published services yet." />
          ) : (
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {b.services.map((s) => (
                <ServiceCard key={s.id} service={s} businessId={b.id} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="reviews" className="mt-3">
          <ReviewsSection reviews={b.reviews} rating={b.rating} reviewCount={b.reviewCount} />
        </TabsContent>

        <TabsContent value="about" className="mt-3">
          <AboutSection business={b} />
        </TabsContent>
      </Tabs>

      {/* Nearby */}
      {b.nearby && b.nearby.length > 0 && (
        <section className="mt-8">
          <div className="mb-3 flex items-center gap-2">
            <Building2 className="h-4 w-4 text-primary" />
            <h2 className="text-lg font-bold tracking-tight">Related nearby</h2>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {b.nearby.map((nb) => (
              <BusinessCard key={nb.id} business={nb} layout="grid" />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}

function Card({ title, children, action }: { title: string; children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4 card-elevated">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold">{title}</h3>
        {action}
      </div>
      {children}
    </div>
  )
}

function InfoRow({ icon, value, href, label }: { icon: React.ReactNode; value: string; href?: string; label?: string }) {
  const content = (
    <div className="flex items-start gap-2">
      <span className="mt-0.5 text-muted-foreground">{icon}</span>
      <div className="min-w-0 flex-1">
        {label && <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>}
        <p className="truncate text-foreground">{value}</p>
      </div>
    </div>
  )
  return href ? (
    <a href={href} target={href.startsWith('http') ? '_blank' : undefined} rel="noreferrer" className="block transition hover:text-primary">
      {content}
    </a>
  ) : (
    content
  )
}

function AISummary({ businessId }: { businessId: string }) {
  const { data, isLoading } = useSWR<{ summary: string }>(`/api/businesses/${businessId}/ai-summary`, async (url) => {
    const res = await fetch(url, { method: 'POST' })
    return res.json()
  })
  const { setAiPanel } = useAppStore()

  return (
    <div className="mt-3 overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/5 via-card to-accent/20">
      <div className="flex items-center gap-2 border-b border-primary/10 px-4 py-2.5">
        <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-primary/10">
          <Sparkles className="h-3.5 w-3.5 text-primary" />
        </div>
        <p className="text-xs font-semibold">AI summary</p>
        <span className="ml-auto text-[10px] text-muted-foreground">Generated from business data & reviews</span>
      </div>
      <div className="px-4 py-3">
        {isLoading ? (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Loader2 className="h-3.5 w-3.5 animate-spin" /> Summarizing…
          </div>
        ) : (
          <div className="whitespace-pre-line text-sm leading-relaxed text-foreground/90">{data?.summary}</div>
        )}
        <button onClick={() => setAiPanel(true)} className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline">
          Ask AI about this business <ArrowRight className="h-3 w-3" />
        </button>
      </div>
    </div>
  )
}

function ProductRow({ product: p }: { product: any }) {
  const { setView } = useAppStore()
  return (
    <button
      onClick={() => setView({ name: 'product', id: p.id })}
      className="group flex gap-2.5 rounded-xl border border-border bg-card p-2.5 text-left transition hover:border-primary/40 hover:shadow-sm"
    >
      <img src={p.images?.[0]} alt={p.name} className="h-14 w-14 shrink-0 rounded-lg object-cover" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-xs font-semibold">{p.name}</p>
        <p className="truncate text-[10px] text-muted-foreground">{p.brand} · {p.category}</p>
        <p className="mt-0.5 text-xs font-bold text-primary">{formatPrice(p.priceMin, p.priceMax)}</p>
      </div>
    </button>
  )
}

function ServiceRow({ service: s }: { service: any }) {
  const { setView } = useAppStore()
  return (
    <button
      onClick={() => setView({ name: 'service', id: s.id })}
      className="group flex w-full items-center gap-2.5 rounded-xl border border-border bg-card p-2.5 text-left transition hover:border-primary/40 hover:shadow-sm"
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
        <Wrench className="h-4 w-4 text-primary" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-xs font-semibold">{s.name}</p>
        <p className="truncate text-[10px] text-muted-foreground">{s.pricing}</p>
      </div>
      <ChevronRight className="h-4 w-4 text-muted-foreground" />
    </button>
  )
}

function ProductCard({ product: p, businessId }: { product: any; businessId: string }) {
  const { setView } = useAppStore()
  const availabilityConfig: Record<string, { label: string; color: string }> = {
    in_stock: { label: 'In stock', color: '#10b981' },
    low_stock: { label: 'Low stock', color: '#f59e0b' },
    preorder: { label: 'Pre-order', color: '#3b82f6' },
    out_of_stock: { label: 'Out of stock', color: '#9ca3af' },
    made_to_order: { label: 'Made to order', color: '#8b5cf6' },
  }
  const av = availabilityConfig[p.availability] || availabilityConfig.in_stock
  return (
    <button
      onClick={() => setView({ name: 'product', id: p.id })}
      className="group overflow-hidden rounded-xl border border-border bg-card text-left transition hover:border-primary/40 hover:shadow-md"
    >
      <div className="relative aspect-[4/3] overflow-hidden">
        <img src={p.images?.[0]} alt={p.name} className="h-full w-full object-cover transition group-hover:scale-105" />
        {p.featured && <span className="absolute left-2 top-2 rounded-full bg-amber-500 px-1.5 py-0.5 text-[9px] font-bold text-white">FEATURED</span>}
        <span className="absolute right-2 top-2 rounded-full px-1.5 py-0.5 text-[9px] font-bold text-white backdrop-blur" style={{ background: av.color + 'cc' }}>{av.label}</span>
      </div>
      <div className="p-2.5">
        <p className="truncate text-xs font-semibold">{p.name}</p>
        <p className="truncate text-[10px] text-muted-foreground">{p.brand}</p>
        <p className="mt-1 text-sm font-bold text-primary">{formatPrice(p.priceMin, p.priceMax)}</p>
        {p.variants?.length > 0 && (
          <div className="mt-1 flex flex-wrap gap-1">
            {p.variants.slice(0, 3).map((v: string) => (
              <span key={v} className="rounded bg-secondary px-1.5 py-0.5 text-[9px]">{v}</span>
            ))}
          </div>
        )}
      </div>
    </button>
  )
}

function ServiceCard({ service: s, businessId }: { service: any; businessId: string }) {
  const { setView } = useAppStore()
  return (
    <button
      onClick={() => setView({ name: 'service', id: s.id })}
      className="group flex gap-3 rounded-xl border border-border bg-card p-3 text-left transition hover:border-primary/40 hover:shadow-md"
    >
      <img src={s.photos?.[0]} alt={s.name} className="h-16 w-16 shrink-0 rounded-lg object-cover" />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold">{s.name}</p>
        <p className="mt-0.5 line-clamp-2 text-[11px] text-muted-foreground">{s.description}</p>
        <div className="mt-1.5 flex items-center gap-2 text-[10px] text-muted-foreground">
          <span className="inline-flex items-center gap-0.5"><Clock className="h-2.5 w-2.5" />{s.duration}</span>
          <span className="inline-flex items-center gap-0.5"><Navigation className="h-2.5 w-2.5" />{s.coverageArea}</span>
        </div>
        <p className="mt-1 text-xs font-bold text-primary">{s.pricing}</p>
      </div>
    </button>
  )
}

function ReviewsSection({ reviews, rating, reviewCount }: { reviews: Review[]; rating: number; reviewCount: number }) {
  const dist = React.useMemo(() => {
    const d = [0, 0, 0, 0, 0]
    reviews.forEach((r) => { if (r.rating >= 1 && r.rating <= 5) d[r.rating - 1]++ })
    return d
  }, [reviews])

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-[280px_1fr]">
        {/* Summary */}
        <div className="rounded-2xl border border-border bg-card p-4 card-elevated">
          <div className="flex items-center gap-3">
            <div className="text-center">
              <p className="text-3xl font-bold">{rating.toFixed(1)}</p>
              <RatingStars rating={rating} size="xs" showValue={false} />
              <p className="mt-1 text-[10px] text-muted-foreground">{formatNumber(reviewCount)} reviews</p>
            </div>
            <Separator orientation="vertical" className="h-16" />
            <div className="flex-1 space-y-1">
              {[5, 4, 3, 2, 1].map((star, i) => (
                <div key={star} className="flex items-center gap-1.5">
                  <span className="w-3 text-[10px] text-muted-foreground">{star}</span>
                  <Star className="h-2.5 w-2.5 fill-amber-400 text-amber-400" />
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-secondary">
                    <div className="h-full rounded-full bg-amber-400" style={{ width: `${(dist[star - 1] / Math.max(reviews.length, 1)) * 100}%` }} />
                  </div>
                  <span className="w-4 text-right text-[10px] text-muted-foreground">{dist[star - 1]}</span>
                </div>
              ))}
            </div>
          </div>
          <Separator className="my-3" />
          <div className="flex items-center gap-2 rounded-lg bg-primary/5 p-2.5">
            <Sparkles className="h-4 w-4 text-primary" />
            <p className="text-[11px] text-muted-foreground">Reviews are summarised by AI in the summary above.</p>
          </div>
          <Button variant="outline" size="sm" className="mt-2 w-full" onClick={() => toast.success('Review form coming soon')}>
            <Star className="h-3.5 w-3.5" /> Write a review
          </Button>
        </div>

        {/* Reviews list */}
        <div className="space-y-3">
          {reviews.map((r) => (
            <ReviewCard key={r.id} review={r} />
          ))}
          {reviews.length === 0 && (
            <EmptyState icon={<Star className="h-8 w-8" />} title="No reviews yet" subtitle="Be the first to review this business." />
          )}
        </div>
      </div>
    </div>
  )
}

function ReviewCard({ review: r }: { review: Review }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4 card-elevated">
      <div className="flex items-start gap-3">
        <img src={r.authorAvatar} alt={r.authorName} className="h-9 w-9 rounded-full object-cover" />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold">{r.authorName}</p>
            {r.verified && (
              <span className="inline-flex items-center gap-0.5 rounded-full bg-emerald-500/10 px-1.5 py-0.5 text-[9px] font-semibold text-emerald-600 dark:text-emerald-400">
                <BadgeCheck className="h-2.5 w-2.5" /> Verified
              </span>
            )}
            <span className="ml-auto text-[10px] text-muted-foreground">{timeAgo(r.createdAt)}</span>
          </div>
          <div className="mt-0.5 flex items-center gap-2">
            <RatingStars rating={r.rating} size="xs" showValue={false} />
            <span className="text-[10px] text-muted-foreground">Rated {r.rating}/5</span>
          </div>
          <p className="mt-1.5 text-sm font-medium">{r.title}</p>
          <p className="mt-0.5 text-sm text-muted-foreground">{r.content}</p>
          {r.photos?.length > 0 && (
            <div className="mt-2 flex gap-1.5">
              {r.photos.map((p, i) => (
                <img key={i} src={p} alt="" className="h-14 w-14 rounded-lg object-cover" />
              ))}
            </div>
          )}
          {r.businessReply && (
            <div className="mt-3 rounded-lg bg-secondary/60 p-2.5">
              <p className="text-[10px] font-semibold text-muted-foreground">Response from business</p>
              <p className="mt-0.5 text-xs text-foreground/80">{r.businessReply}</p>
            </div>
          )}
          <div className="mt-2 flex items-center gap-3">
            <button className="inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground">
              <ThumbsUp className="h-3 w-3" /> Helpful ({r.helpful})
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function AboutSection({ business: b }: { business: Business }) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <div className="space-y-4">
        <Card title="Certifications">
          <div className="space-y-2">
            {b.certifications.map((c) => (
              <div key={c} className="flex items-center gap-2 text-sm">
                <Award className="h-4 w-4 text-primary" />
                {c}
              </div>
            ))}
          </div>
        </Card>
        <Card title="Awards & recognition">
          <div className="space-y-2">
            {b.awards.length > 0 ? b.awards.map((a) => (
              <div key={a} className="flex items-center gap-2 text-sm">
                <Crown className="h-4 w-4 text-amber-500" />
                {a}
              </div>
            )) : <p className="text-xs text-muted-foreground">No awards listed.</p>}
          </div>
        </Card>
      </div>
      <div className="space-y-4">
        <Card title="Business details">
          <div className="grid grid-cols-2 gap-3 text-xs">
            <Detail label="Founded" value={String(b.foundedYear)} />
            <Detail label="Team size" value={b.teamSize} />
            <Detail label="Response time" value={b.responseTime} />
            <Detail label="Views" value={formatNumber(b.viewCount)} />
            <Detail label="City" value={b.city} />
            <Detail label="State" value={b.state} />
            <Detail label="Pincode" value={b.pincode} />
            <Detail label="Category" value={b.category} />
          </div>
        </Card>
        <Card title="Social">
          <div className="flex flex-wrap gap-2">
            {b.social.instagram && <SocialPill icon={<Instagram className="h-3.5 w-3.5" />} label={b.social.instagram} />}
            {b.social.linkedin && <SocialPill icon={<Linkedin className="h-3.5 w-3.5" />} label={b.social.linkedin} />}
            {b.social.twitter && <SocialPill icon={<Twitter className="h-3.5 w-3.5" />} label={b.social.twitter} />}
          </div>
        </Card>
      </div>
    </div>
  )
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="font-medium">{value}</p>
    </div>
  )
}

function SocialPill({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-2.5 py-1 text-xs">
      {icon} {label}
    </span>
  )
}

function EmptyState({ icon, title, subtitle }: { icon: React.ReactNode; title: string; subtitle: string }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border py-12 text-center">
      <div className="mb-2 flex h-14 w-14 items-center justify-center rounded-2xl bg-secondary text-muted-foreground">{icon}</div>
      <p className="text-sm font-semibold">{title}</p>
      <p className="text-xs text-muted-foreground">{subtitle}</p>
    </div>
  )
}
