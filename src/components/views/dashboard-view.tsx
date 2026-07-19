'use client'

import * as React from 'react'
import useSWR from 'swr'
import {
  LayoutDashboard, Package, Wrench, Star, Eye, TrendingUp, Bell, Settings,
  FileText, MessageSquare, Users, BarChart3, Megaphone, Plus, ArrowUpRight,
  ShieldCheck, Boxes, Receipt, ShoppingCart, CreditCard, Calendar, Sparkles,
} from 'lucide-react'
import { useAppStore } from '@/lib/store'
import type { Business, Category } from '@/lib/types'
import { VerificationBadge } from '@/components/verification-badge'
import { RatingStars } from '@/components/rating-stars'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Card } from '@/components/ui/card'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export function DashboardView() {
  const { data, isLoading } = useSWR<{ businesses: Business[] }>('/api/businesses?featured=true&limit=1', fetcher)
  const { setView } = useAppStore()
  const business = data?.businesses?.[0]

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
          <Button variant="outline" size="sm" className="gap-1.5"><Bell className="h-3.5 w-3.5" /> Alerts <span className="ml-0.5 rounded-full bg-rose-500 px-1.5 text-[10px] font-bold text-white">3</span></Button>
          <Button size="sm" className="gap-1.5"><Plus className="h-3.5 w-3.5" /> Add product</Button>
        </div>
      </div>

      {isLoading || !business ? (
        <div className="grid gap-3 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-2xl" />)}
        </div>
      ) : (
        <>
          {/* Business identity card */}
          <div className="mb-4 flex flex-col gap-3 rounded-2xl border border-border bg-card p-4 card-elevated sm:flex-row sm:items-center">
            <img src={business.logo} alt="" className="h-14 w-14 rounded-xl object-cover" />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-base font-bold">{business.name}</h2>
                <VerificationBadge level={business.verified} size="xs" />
              </div>
              <p className="text-xs text-muted-foreground">{business.tagline}</p>
              <div className="mt-1 flex items-center gap-2">
                <RatingStars rating={business.rating} size="xs" count={business.reviewCount} />
                <span className="text-[10px] text-muted-foreground">· {business.responseTime} response</span>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setView({ name: 'business', id: business.id, slug: business.slug })}>View public <ArrowUpRight className="ml-1 h-3 w-3" /></Button>
              <Button variant="outline" size="sm"><Settings className="h-3.5 w-3.5" /></Button>
            </div>
          </div>

          {/* Stats */}
          <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-4">
            <StatCard icon={<Eye className="h-4 w-4" />} label="Profile views" value="4.2k" change="+12%" color="#0f766e" />
            <StatCard icon={<MessageSquare className="h-4 w-4" />} label="Enquiries" value="38" change="+8%" color="#0891b2" />
            <StatCard icon={<Star className="h-4 w-4" />} label="New reviews" value="6" change="+2" color="#f59e0b" />
            <StatCard icon={<TrendingUp className="h-4 w-4" />} label="Products viewed" value="1.1k" change="+24%" color="#7c3aed" />
          </div>

          {/* ERP modules */}
          <div className="mb-4">
            <div className="mb-2 flex items-center gap-2">
              <Boxes className="h-4 w-4 text-primary" />
              <h3 className="text-sm font-semibold">ERP modules <span className="ml-1 rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold text-primary">Beta</span></h3>
            </div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
              <ERPModule icon={<Package className="h-4 w-4" />} label="Inventory" badge="Live" />
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
              <Section title="Recent enquiries" action={<Button variant="ghost" size="sm" className="h-7 text-xs">View all</Button>}>
                <div className="space-y-2">
                  {[
                    { name: 'Rahul Mehta', msg: 'Interested in Sona Masoori Rice 25kg — need 200 bags', time: '12m ago', unread: true },
                    { name: 'Sneha Kapoor', msg: 'Quotation for Automatic Flour Mill Machine 30 TPD', time: '1h ago', unread: true },
                    { name: 'Vijay Traders', msg: 'Bulk order enquiry for Whole Wheat Atta', time: '3h ago', unread: false },
                    { name: 'Priya Nair', msg: 'Export enquiry — 1 container SS316 tanks', time: '1d ago', unread: false },
                  ].map((e, i) => (
                    <div key={i} className={cn('flex items-start gap-3 rounded-xl border border-border bg-card p-3', e.unread && 'ring-1 ring-primary/20')}>
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                        {e.name.split(' ').map((n) => n[0]).join('')}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold">{e.name}</p>
                          {e.unread && <span className="h-1.5 w-1.5 rounded-full bg-primary" />}
                          <span className="ml-auto text-[10px] text-muted-foreground">{e.time}</span>
                        </div>
                        <p className="mt-0.5 truncate text-xs text-muted-foreground">{e.msg}</p>
                      </div>
                      <Button size="sm" variant="outline" className="h-7 shrink-0 text-xs" onClick={() => toast.success('Reply sent')}>Reply</Button>
                    </div>
                  ))}
                </div>
              </Section>

              <Section title="Products performance">
                <div className="space-y-2">
                  {[
                    { name: 'Sona Masoori Rice (Premium)', views: 1240, trend: 18, stock: 'In stock' },
                    { name: 'Automatic Flour Mill Machine 30 TPD', views: 860, trend: 32, stock: 'Made to order' },
                    { name: 'Whole Wheat Atta (Stone Ground)', views: 540, trend: -4, stock: 'In stock' },
                    { name: 'Besan (Gram Flour)', views: 320, trend: 6, stock: 'Low stock' },
                  ].map((p, i) => (
                    <div key={i} className="flex items-center gap-3 rounded-xl border border-border bg-card p-2.5">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-secondary"><Package className="h-4 w-4 text-muted-foreground" /></div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-semibold">{p.name}</p>
                        <p className="text-[10px] text-muted-foreground">{p.stock}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-semibold">{p.views.toLocaleString()} views</p>
                        <p className={cn('flex items-center justify-end gap-0.5 text-[10px]', p.trend >= 0 ? 'text-emerald-600' : 'text-rose-500')}>
                          <TrendingUp className={cn('h-2.5 w-2.5', p.trend < 0 && 'rotate-180')} /> {Math.abs(p.trend)}%
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </Section>
            </div>

            {/* Sidebar */}
            <div className="space-y-4">
              <Section title="Verification status">
                <div className="space-y-2">
                  {[
                    { label: 'Phone verified', done: true },
                    { label: 'Email verified', done: true },
                    { label: 'Documents verified', done: true },
                    { label: 'Premises audited', done: true },
                    { label: 'Enterprise due diligence', done: false },
                  ].map((v) => (
                    <div key={v.label} className="flex items-center gap-2 text-xs">
                      <ShieldCheck className={cn('h-3.5 w-3.5', v.done ? 'text-emerald-500' : 'text-muted-foreground/40')} />
                      <span className={cn(v.done ? 'text-foreground' : 'text-muted-foreground')}>{v.label}</span>
                      {v.done ? <CheckIcon /> : <span className="ml-auto text-[10px] text-primary">Verify</span>}
                    </div>
                  ))}
                </div>
              </Section>

              <Section title="Announcements">
                <Button size="sm" variant="outline" className="w-full gap-1.5" onClick={() => toast.success('Announcement composer opened')}>
                  <Megaphone className="h-3.5 w-3.5" /> New announcement
                </Button>
                <p className="mt-2 text-[10px] text-muted-foreground">Announcements appear on your public profile and reach followers.</p>
              </Section>

              <Section title="AI insights">
                <div className="flex items-start gap-2 rounded-xl bg-primary/5 p-2.5">
                  <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
                  <p className="text-[11px] text-foreground/80">
                    Your <strong>Automatic Flour Mill Machine</strong> is trending. Consider a promotion to convert the 12 active enquiries.
                  </p>
                </div>
                <Button size="sm" variant="ghost" className="mt-2 w-full text-xs">View all insights</Button>
              </Section>
            </div>
          </div>
        </>
      )}
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
        <span className="text-[10px] font-semibold text-emerald-600">{change}</span>
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
      <div className="mb-3 flex items-center justify-between">
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
