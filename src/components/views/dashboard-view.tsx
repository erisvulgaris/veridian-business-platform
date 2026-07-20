'use client'

import * as React from 'react'
import useSWR from 'swr'
import {
  LayoutDashboard, Package, Wrench, Star, Eye, TrendingUp, Bell, Settings,
  FileText, MessageSquare, Users, BarChart3, Megaphone, Plus, ArrowUpRight,
  ShieldCheck, Boxes, Receipt, ShoppingCart, CreditCard, Calendar, Sparkles,
  Mail, Phone, Building2, Clock, CheckCircle2, Circle, Archive, Reply, ChevronDown,
} from 'lucide-react'
import { useAppStore } from '@/lib/store'
import type { Business } from '@/lib/types'
import { VerificationBadge } from '@/components/verification-badge'
import { RatingStars } from '@/components/rating-stars'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { timeAgo, formatNumber } from '@/lib/types'

const fetcher = (url: string) => fetch(url).then((r) => r.json())

interface Enquiry {
  id: string
  businessId: string
  customerName: string
  customerEmail: string
  customerPhone: string | null
  company: string | null
  subject: string
  message: string
  productId: string | null
  serviceName: string | null
  quantity: string | null
  budget: string | null
  timeline: string | null
  status: string
  createdAt: string
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
  new: { label: 'New', color: '#0f766e', bg: 'rgba(15,118,110,0.1)', icon: <Circle className="h-2.5 w-2.5" /> },
  read: { label: 'Read', color: '#6366f1', bg: 'rgba(99,102,241,0.1)', icon: <Circle className="h-2.5 w-2.5" /> },
  replied: { label: 'Replied', color: '#0891b2', bg: 'rgba(8,145,178,0.1)', icon: <Reply className="h-2.5 w-2.5" /> },
  closed: { label: 'Closed', color: '#9ca3af', bg: 'rgba(156,163,175,0.1)', icon: <CheckCircle2 className="h-2.5 w-2.5" /> },
}

export function DashboardView() {
  const { setView } = useAppStore()
  // Fetch all businesses so the owner can pick which one to manage
  const { data: bizData, isLoading: bizLoading } = useSWR<{ businesses: Business[] }>('/api/businesses?limit=60', fetcher)
  const businesses = bizData?.businesses ?? []
  const [selectedSlug, setSelectedSlug] = React.useState<string | null>(null)
  const [bizPickerOpen, setBizPickerOpen] = React.useState(false)

  // Use the first business by default, or the selected one
  const business = businesses.find((b) => b.slug === selectedSlug) ?? businesses[0]
  const slug = business?.slug

  // Fetch enquiries for the selected business
  const { data: enqData, isLoading: enqLoading, mutate: enqMutate } = useSWR<{ enquiries: Enquiry[]; total: number }>(
    slug ? `/api/businesses/${slug}/enquiries` : null,
    fetcher
  )
  const enquiries = enqData?.enquiries ?? []

  // Fetch business detail for products
  const { data: detailData } = useSWR<{ business: Business & { products: any[]; services: any[] } }>(
    slug ? `/api/businesses/${slug}` : null,
    fetcher
  )
  const products = detailData?.business?.products ?? []

  const newCount = enquiries.filter((e) => e.status === 'new').length
  const unreadCount = enquiries.filter((e) => e.status === 'new' || e.status === 'read').length

  const updateEnquiryStatus = async (id: string, status: string) => {
    // Optimistic update
    enqMutate((prev) => prev ? { ...prev, enquiries: prev.enquiries.map((e) => e.id === id ? { ...e, status } : e) } : prev, false)
    try {
      await fetch(`/api/enquiries/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }) })
      toast.success(`Marked as ${STATUS_CONFIG[status]?.label || status}`)
    } catch {
      toast.error('Failed to update')
      enqMutate()
    }
  }

  const [enquiryFilter, setEnquiryFilter] = React.useState<'all' | 'new' | 'replied' | 'closed'>('all')
  const filteredEnquiries = enquiryFilter === 'all' ? enquiries : enquiries.filter((e) => e.status === enquiryFilter)

  if (bizLoading) {
    return (
      <div className="mx-auto max-w-6xl px-3 py-4 sm:px-4">
        <Skeleton className="h-14 w-64 rounded-xl" />
        <div className="mt-4 grid gap-3 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-2xl" />)}
        </div>
        <Skeleton className="mt-4 h-96 rounded-2xl" />
      </div>
    )
  }

  if (businesses.length === 0) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-20 text-center">
        <LayoutDashboard className="mx-auto h-12 w-12 text-muted-foreground/40" />
        <p className="mt-3 text-sm font-semibold">No businesses yet</p>
        <p className="text-xs text-muted-foreground">Claim or add a business to access the dashboard.</p>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-6xl px-3 py-4 sm:px-4">
      {/* Header */}
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <LayoutDashboard className="h-5 w-5 text-primary" />
            <h1 className="text-xl font-bold tracking-tight sm:text-2xl">Business Dashboard</h1>
          </div>
          <p className="text-xs text-muted-foreground">Manage your profile, products, services and enquiries — all in one place.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-1.5 relative">
            <Bell className="h-3.5 w-3.5" /> Alerts
            {unreadCount > 0 && <span className="ml-0.5 rounded-full bg-rose-500 px-1.5 text-[10px] font-bold text-white">{unreadCount}</span>}
          </Button>
          <Button size="sm" className="gap-1.5" onClick={() => toast.success('Product composer opened')}>
            <Plus className="h-3.5 w-3.5" /> Add product
          </Button>
        </div>
      </div>

      {/* Business identity card with selector */}
      <div className="mb-4 flex flex-col gap-3 rounded-2xl border border-border bg-card p-4 card-elevated sm:flex-row sm:items-center">
        <img src={business.logo} alt="" className="h-14 w-14 rounded-xl object-cover" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-base font-bold truncate">{business.name}</h2>
            <VerificationBadge level={business.verified} size="xs" />
          </div>
          <p className="text-xs text-muted-foreground truncate">{business.tagline}</p>
          <div className="mt-1 flex items-center gap-2">
            <RatingStars rating={business.rating} size="xs" count={business.reviewCount} />
            <span className="text-[10px] text-muted-foreground">· {business.responseTime} response</span>
          </div>
        </div>
        {businesses.length > 1 && (
          <div className="relative">
            <button
              onClick={() => setBizPickerOpen((s) => !s)}
              className="flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5 text-xs font-medium hover:bg-accent transition"
            >
              Switch <ChevronDown className="h-3 w-3" />
            </button>
            {bizPickerOpen && (
              <div className="absolute right-0 top-full z-20 mt-1 max-h-64 w-64 overflow-y-auto rounded-xl border border-border bg-popover p-1 shadow-xl animate-scale-in">
                {businesses.map((b) => (
                  <button
                    key={b.id}
                    onClick={() => { setSelectedSlug(b.slug); setBizPickerOpen(false) }}
                    className={cn('flex w-full items-center gap-2 rounded-lg p-2 text-left transition hover:bg-accent', b.slug === business.slug && 'bg-accent')}
                  >
                    <img src={b.logo} alt="" className="h-8 w-8 rounded-lg object-cover" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-semibold">{b.name}</p>
                      <p className="truncate text-[10px] text-muted-foreground">{b.category}</p>
                    </div>
                    {b.slug === business.slug && <CheckCircle2 className="h-3.5 w-3.5 text-primary" />}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setView({ name: 'business', id: business.id, slug: business.slug })}>View public <ArrowUpRight className="ml-1 h-3 w-3" /></Button>
          <Button variant="outline" size="sm"><Settings className="h-3.5 w-3.5" /></Button>
        </div>
      </div>

      {/* Stats — dynamic */}
      <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard icon={<Eye className="h-4 w-4" />} label="Profile views" value={formatNumber(business.viewCount)} change="+12%" color="#0f766e" />
        <StatCard icon={<MessageSquare className="h-4 w-4" />} label="Enquiries" value={String(enquiries.length)} change={newCount > 0 ? `+${newCount} new` : '0 new'} color="#0891b2" />
        <StatCard icon={<Star className="h-4 w-4" />} label="Reviews" value={String(business.reviewCount)} change={`${business.rating}★`} color="#f59e0b" />
        <StatCard icon={<Package className="h-4 w-4" />} label="Products" value={String(products.length)} change={products.length > 0 ? 'live' : 'none'} color="#7c3aed" />
      </div>

      {/* ERP modules */}
      <div className="mb-4">
        <div className="mb-2 flex items-center gap-2">
          <Boxes className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold">ERP modules <span className="ml-1 rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold text-primary">Beta</span></h3>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
          <ERPModule icon={<Package className="h-4 w-4" />} label="Inventory" badge={products.length > 0 ? String(products.length) : undefined} />
          <ERPModule icon={<Receipt className="h-4 w-4" />} label="Invoices" badge="12" />
          <ERPModule icon={<ShoppingCart className="h-4 w-4" />} label="Orders" badge="5" />
          <ERPModule icon={<Users className="h-4 w-4" />} label="Customers" badge="240" />
          <ERPModule icon={<CreditCard className="h-4 w-4" />} label="Expenses" />
          <ERPModule icon={<Calendar className="h-4 w-4" />} label="Appointments" badge="3" />
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Recent activity */}
        <div className="lg:col-span-2 space-y-4">
          <Section
            title="Enquiries inbox"
            action={
              <div className="flex items-center gap-1">
                {(['all', 'new', 'replied', 'closed'] as const).map((f) => (
                  <button
                    key={f}
                    onClick={() => setEnquiryFilter(f)}
                    className={cn(
                      'rounded-full px-2 py-0.5 text-[10px] font-medium capitalize transition',
                      enquiryFilter === f ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
                    )}
                  >
                    {f}
                  </button>
                ))}
              </div>
            }
          >
            {enqLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-16 rounded-xl" />)}
              </div>
            ) : filteredEnquiries.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Mail className="h-8 w-8 text-muted-foreground/30" />
                <p className="mt-2 text-xs font-medium text-muted-foreground">
                  {enquiries.length === 0 ? 'No enquiries yet' : `No ${enquiryFilter} enquiries`}
                </p>
                <p className="text-[10px] text-muted-foreground/70">
                  {enquiries.length === 0 ? 'RFQs from customers will appear here' : 'Try a different filter'}
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredEnquiries.map((e) => {
                  const sc = STATUS_CONFIG[e.status] || STATUS_CONFIG.new
                  const initials = e.customerName.split(' ').map((n) => n[0]).join('').slice(0, 2)
                  return (
                    <div key={e.id} className={cn('rounded-xl border border-border bg-card p-3 transition', e.status === 'new' && 'ring-1 ring-primary/20')}>
                      <div className="flex items-start gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                          {initials}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-semibold truncate">{e.customerName}</p>
                            <span className="inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[9px] font-semibold" style={{ color: sc.color, background: sc.bg }}>
                              {sc.icon} {sc.label}
                            </span>
                            <span className="ml-auto shrink-0 text-[10px] text-muted-foreground">{timeAgo(e.createdAt)}</span>
                          </div>
                          <p className="mt-0.5 text-xs font-medium text-foreground/80 truncate">{e.subject}</p>
                          <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2">{e.message}</p>
                          {/* Meta tags */}
                          <div className="mt-1.5 flex flex-wrap items-center gap-2 text-[10px] text-muted-foreground">
                            {e.company && <span className="inline-flex items-center gap-0.5"><Building2 className="h-2.5 w-2.5" />{e.company}</span>}
                            {e.quantity && <span className="inline-flex items-center gap-0.5"><Package className="h-2.5 w-2.5" />{e.quantity}</span>}
                            {e.budget && <span className="inline-flex items-center gap-0.5">₹{e.budget}</span>}
                            {e.timeline && <span className="inline-flex items-center gap-0.5"><Clock className="h-2.5 w-2.5" />{e.timeline}</span>}
                            {e.serviceName && <span className="inline-flex items-center gap-0.5"><Wrench className="h-2.5 w-2.5" />{e.serviceName}</span>}
                          </div>
                          {/* Contact + actions */}
                          <div className="mt-2 flex items-center gap-1.5">
                            <a href={`mailto:${e.customerEmail}`} className="inline-flex items-center gap-1 rounded-md bg-secondary px-1.5 py-0.5 text-[10px] font-medium hover:bg-accent">
                              <Mail className="h-2.5 w-2.5" /> {e.customerEmail}
                            </a>
                            {e.customerPhone && (
                              <a href={`tel:${e.customerPhone}`} className="inline-flex items-center gap-1 rounded-md bg-secondary px-1.5 py-0.5 text-[10px] font-medium hover:bg-accent">
                                <Phone className="h-2.5 w-2.5" /> {e.customerPhone}
                              </a>
                            )}
                          </div>
                          {/* Status actions */}
                          <div className="mt-2 flex items-center gap-1">
                            {e.status === 'new' && (
                              <Button size="sm" variant="ghost" className="h-6 text-[10px]" onClick={() => updateEnquiryStatus(e.id, 'read')}>Mark read</Button>
                            )}
                            {(e.status === 'new' || e.status === 'read') && (
                              <Button size="sm" variant="ghost" className="h-6 text-[10px] gap-0.5" onClick={() => updateEnquiryStatus(e.id, 'replied')}>
                                <Reply className="h-2.5 w-2.5" /> Mark replied
                              </Button>
                            )}
                            {e.status !== 'closed' && (
                              <Button size="sm" variant="ghost" className="h-6 text-[10px] gap-0.5" onClick={() => updateEnquiryStatus(e.id, 'closed')}>
                                <Archive className="h-2.5 w-2.5" /> Close
                              </Button>
                            )}
                            {e.status === 'closed' && (
                              <Button size="sm" variant="ghost" className="h-6 text-[10px]" onClick={() => updateEnquiryStatus(e.id, 'new')}>Reopen</Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </Section>

          <Section title="Products performance">
            {products.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-6 text-center">
                <Package className="h-8 w-8 text-muted-foreground/30" />
                <p className="mt-2 text-xs font-medium text-muted-foreground">No products listed yet</p>
                <Button size="sm" variant="outline" className="mt-2 gap-1.5" onClick={() => toast.success('Product composer opened')}>
                  <Plus className="h-3 w-3" /> Add product
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                {products.map((p) => {
                  const views = p.viewCount || 0
                  const trend = ((views % 40) - 10)
                  const stockLabels: Record<string, string> = {
                    in_stock: 'In stock', low_stock: 'Low stock', preorder: 'Pre-order',
                    out_of_stock: 'Out of stock', made_to_order: 'Made to order',
                  }
                  return (
                    <div key={p.id} className="flex items-center gap-3 rounded-xl border border-border bg-card p-2.5">
                      <img src={p.images?.[0]} alt="" className="h-10 w-10 rounded-lg object-cover" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-semibold">{p.name}</p>
                        <p className="text-[10px] text-muted-foreground">{stockLabels[p.availability] || 'In stock'}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-semibold">{formatNumber(views)} views</p>
                        <p className={cn('flex items-center justify-end gap-0.5 text-[10px]', trend >= 0 ? 'text-emerald-600' : 'text-rose-500')}>
                          <TrendingUp className={cn('h-2.5 w-2.5', trend < 0 && 'rotate-180')} /> {Math.abs(trend)}%
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </Section>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <Section title="Verification status">
            <div className="space-y-2">
              {[
                { label: 'Phone verified', done: business.verified !== 'basic' },
                { label: 'Email verified', done: business.verified !== 'basic' },
                { label: 'Documents verified', done: business.verified === 'verified' || business.verified === 'premium' || business.verified === 'enterprise' },
                { label: 'Premises audited', done: business.verified === 'premium' || business.verified === 'enterprise' },
                { label: 'Enterprise due diligence', done: business.verified === 'enterprise' },
              ].map((v) => (
                <div key={v.label} className="flex items-center gap-2 text-xs">
                  <ShieldCheck className={cn('h-3.5 w-3.5', v.done ? 'text-emerald-500' : 'text-muted-foreground/40')} />
                  <span className={cn(v.done ? 'text-foreground' : 'text-muted-foreground')}>{v.label}</span>
                  {v.done ? <CheckIcon /> : <span className="ml-auto text-[10px] text-primary">Verify</span>}
                </div>
              ))}
            </div>
            <div className="mt-3 flex items-center gap-2 rounded-lg bg-primary/5 p-2.5">
              <VerificationBadge level={business.verified} size="xs" />
              <span className="text-[10px] text-muted-foreground">Current trust level</span>
            </div>
          </Section>

          <Section title="Announcements">
            <Button size="sm" variant="outline" className="w-full gap-1.5" onClick={() => toast.success('Announcement composer opened')}>
              <Megaphone className="h-3.5 w-3.5" /> New announcement
            </Button>
            {business.announcement ? (
              <div className="mt-2 rounded-lg bg-secondary/60 p-2.5">
                <p className="text-[10px] font-semibold">{business.announcement.title}</p>
                <p className="mt-0.5 text-[10px] text-muted-foreground">{business.announcement.body}</p>
              </div>
            ) : (
              <p className="mt-2 text-[10px] text-muted-foreground">No active announcements. Announcements appear on your public profile and reach followers.</p>
            )}
          </Section>

          <Section title="AI insights">
            <div className="flex items-start gap-2 rounded-xl bg-primary/5 p-2.5">
              <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
              <p className="text-[11px] text-foreground/80">
                {newCount > 0
                  ? <>You have <strong>{newCount} new enquiry{newCount > 1 ? 'ies' : ''}</strong> awaiting response. Respond within {business.responseTime} to maintain trust.</>
                  : <>Your profile is all caught up. Consider adding a promotion to attract more enquiries.</>
                }
              </p>
            </div>
            <Button size="sm" variant="ghost" className="mt-2 w-full text-xs" onClick={() => useAppStore.getState().setAiPanel(true)}>
              <Sparkles className="h-3 w-3" /> Ask AI for advice
            </Button>
          </Section>
        </div>
      </div>
    </div>
  )
}

function StatCard({ icon, label, value, change, color }: { icon: React.ReactNode; label: string; value: string; change: string; color: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-3 card-elevated">
      <div className="flex items-center justify-between">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg" style={{ background: color + '15', color }}>
          {icon}
        </div>
        <span className="text-[10px] font-semibold text-muted-foreground">{change}</span>
      </div>
      <p className="mt-2 text-xl font-bold">{value}</p>
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
    </div>
  )
}

function ERPModule({ icon, label, badge }: { icon: React.ReactNode; label: string; badge?: string }) {
  return (
    <button className="group flex flex-col items-center gap-1.5 rounded-xl border border-border bg-card p-3 transition hover:border-primary/40 hover:shadow-sm">
      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary transition group-hover:scale-110">{icon}</div>
      <p className="text-[11px] font-medium">{label}</p>
      {badge && <span className="rounded-full bg-secondary px-1.5 py-0.5 text-[9px] font-semibold text-muted-foreground">{badge}</span>}
    </button>
  )
}

function Section({ title, action, children }: { title: string; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4 card-elevated">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h3 className="text-sm font-semibold">{title}</h3>
        {action}
      </div>
      {children}
    </div>
  )
}

function CheckIcon() {
  return <svg className="ml-auto h-3.5 w-3.5 text-emerald-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" /></svg>
}
