'use client'

import * as React from 'react'
import useSWR from 'swr'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, Area, AreaChart, Legend,
} from 'recharts'
import {
  TrendingUp, Eye, Star, MessageSquare, Package, BarChart3,
  ArrowUpRight, ArrowDownRight, Loader2, Sparkles,
} from 'lucide-react'
import { useAppStore } from '@/lib/store'
import type { Business } from '@/lib/types'
import { formatNumber } from '@/lib/types'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

const fetcher = (url: string) => fetch(url).then((r) => r.json())

interface Analytics {
  weeks: { label: string; views: number; enquiries: number }[]
  ratingDist: number[]
  enquiryStats: { new: number; read: number; replied: number; closed: number }
  productPerf: { id: string; name: string; views: number; category: string }[]
  reviewTrend: { label: string; avg: number; count: number }[]
  totals: { views: number; reviews: number; enquiries: number; products: number; avgRating: number }
}

const PIE_COLORS = ['#0f766e', '#0891b2', '#7c3aed', '#9ca3af']

export function AnalyticsView({ businessSlug }: { businessSlug: string }) {
  const { data, isLoading } = useSWR<Analytics>(`/api/businesses/${businessSlug}/analytics`, fetcher)

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-2xl" />)}
        </div>
        <Skeleton className="h-64 rounded-2xl" />
        <div className="grid gap-4 md:grid-cols-2">
          <Skeleton className="h-56 rounded-2xl" />
          <Skeleton className="h-56 rounded-2xl" />
        </div>
      </div>
    )
  }

  if (!data) {
    return <div className="py-12 text-center text-sm text-muted-foreground">Analytics unavailable.</div>
  }

  const { weeks, ratingDist, enquiryStats, productPerf, reviewTrend, totals } = data
  const enquiryPieData = [
    { name: 'New', value: enquiryStats.new },
    { name: 'Read', value: enquiryStats.read },
    { name: 'Replied', value: enquiryStats.replied },
    { name: 'Closed', value: enquiryStats.closed },
  ].filter((d) => d.value > 0)

  // Compute trends
  const lastWeekViews = weeks[weeks.length - 1]?.views || 0
  const prevWeekViews = weeks[weeks.length - 2]?.views || 0
  const viewsTrend = prevWeekViews > 0 ? Math.round(((lastWeekViews - prevWeekViews) / prevWeekViews) * 100) : 0

  return (
    <div className="space-y-4">
      {/* Stats row */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard icon={<Eye className="h-4 w-4" />} label="Total views" value={formatNumber(totals.views)} trend={viewsTrend} color="#0f766e" />
        <StatCard icon={<Star className="h-4 w-4" />} label="Avg rating" value={`${totals.avgRating}★`} sub={`${totals.reviews} reviews`} color="#f59e0b" />
        <StatCard icon={<MessageSquare className="h-4 w-4" />} label="Enquiries" value={String(totals.enquiries)} sub={`${enquiryStats.new} new`} color="#0891b2" />
        <StatCard icon={<Package className="h-4 w-4" />} label="Products" value={String(totals.products)} sub="live" color="#7c3aed" />
      </div>

      {/* Views + enquiries over time */}
      <div className="rounded-2xl border border-border bg-card p-4 card-elevated">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <h3 className="flex items-center gap-1.5 text-sm font-semibold">
              <TrendingUp className="h-4 w-4 text-primary" /> Views & enquiries
            </h3>
            <p className="text-[11px] text-muted-foreground">Last 12 weeks</p>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={240}>
          <AreaChart data={weeks} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="viewsGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#0f766e" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#0f766e" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="enqGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#0891b2" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#0891b2" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.4} />
            <XAxis dataKey="label" tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} />
            <Tooltip
              contentStyle={{
                background: 'var(--card)',
                border: '1px solid var(--border)',
                borderRadius: '0.75rem',
                fontSize: '12px',
              }}
            />
            <Area type="monotone" dataKey="views" stroke="#0f766e" strokeWidth={2} fill="url(#viewsGrad)" name="Views" />
            <Area type="monotone" dataKey="enquiries" stroke="#0891b2" strokeWidth={2} fill="url(#enqGrad)" name="Enquiries" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Rating distribution */}
        <div className="rounded-2xl border border-border bg-card p-4 card-elevated">
          <h3 className="mb-3 flex items-center gap-1.5 text-sm font-semibold">
            <Star className="h-4 w-4 text-amber-500" /> Rating distribution
          </h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={[
              { star: '5★', count: ratingDist[4] },
              { star: '4★', count: ratingDist[3] },
              { star: '3★', count: ratingDist[2] },
              { star: '2★', count: ratingDist[1] },
              { star: '1★', count: ratingDist[0] },
            ]} margin={{ top: 5, right: 10, left: -25, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.4} />
              <XAxis dataKey="star" tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '0.75rem', fontSize: '12px' }} />
              <Bar dataKey="count" fill="#f59e0b" radius={[4, 4, 0, 0]} name="Reviews" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Enquiry status pie */}
        <div className="rounded-2xl border border-border bg-card p-4 card-elevated">
          <h3 className="mb-3 flex items-center gap-1.5 text-sm font-semibold">
            <MessageSquare className="h-4 w-4 text-primary" /> Enquiry status
          </h3>
          {enquiryPieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={enquiryPieData} cx="50%" cy="50%" innerRadius={45} outerRadius={75} paddingAngle={3} dataKey="value">
                  {enquiryPieData.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '0.75rem', fontSize: '12px' }} />
                <Legend wrapperStyle={{ fontSize: '11px' }} iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-[200px] items-center justify-center text-xs text-muted-foreground">No enquiries yet</div>
          )}
        </div>
      </div>

      {/* Review trend */}
      <div className="rounded-2xl border border-border bg-card p-4 card-elevated">
        <h3 className="mb-3 flex items-center gap-1.5 text-sm font-semibold">
          <Star className="h-4 w-4 text-amber-500" /> Review rating trend
        </h3>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={reviewTrend} margin={{ top: 5, right: 10, left: -25, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.4} />
            <XAxis dataKey="label" tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} />
            <YAxis domain={[0, 5]} tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '0.75rem', fontSize: '12px' }} />
            <Line type="monotone" dataKey="avg" stroke="#f59e0b" strokeWidth={2.5} dot={{ fill: '#f59e0b', r: 4 }} name="Avg rating" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Product performance */}
      {productPerf.length > 0 && (
        <div className="rounded-2xl border border-border bg-card p-4 card-elevated">
          <h3 className="mb-3 flex items-center gap-1.5 text-sm font-semibold">
            <BarChart3 className="h-4 w-4 text-primary" /> Product performance
          </h3>
          <ResponsiveContainer width="100%" height={Math.max(200, productPerf.length * 36)}>
            <BarChart data={productPerf} layout="vertical" margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.4} horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} width={120} />
              <Tooltip contentStyle={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '0.75rem', fontSize: '12px' }} />
              <Bar dataKey="views" fill="#0f766e" radius={[0, 4, 4, 0]} name="Views" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* AI insight */}
      <div className="flex items-start gap-2 rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/5 to-accent/20 p-4">
        <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
        <div className="text-xs text-foreground/80">
          <p className="font-semibold text-foreground">AI Insight</p>
          <p className="mt-1">
            {viewsTrend > 0
              ? `Views are up ${viewsTrend}% week-over-week. Your most viewed product is "${productPerf[0]?.name}". Consider a promotion to convert the ${enquiryStats.new} new enquiries.`
              : `Views are stable. Focus on responding to ${enquiryStats.new} new enquiries to maintain trust and convert leads.`
            }
          </p>
        </div>
      </div>
    </div>
  )
}

function StatCard({ icon, label, value, sub, trend, color }: { icon: React.ReactNode; label: string; value: string; sub?: string; trend?: number; color: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-3 card-elevated">
      <div className="flex items-center justify-between">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg" style={{ background: color + '15', color }}>
          {icon}
        </div>
        {trend !== undefined && trend !== 0 && (
          <span className={cn('flex items-center gap-0.5 text-[10px] font-semibold', trend > 0 ? 'text-emerald-600' : 'text-rose-500')}>
            {trend > 0 ? <ArrowUpRight className="h-2.5 w-2.5" /> : <ArrowDownRight className="h-2.5 w-2.5" />}
            {Math.abs(trend)}%
          </span>
        )}
      </div>
      <p className="mt-2 text-xl font-bold">{value}</p>
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
      {sub && <p className="text-[10px] text-muted-foreground">{sub}</p>}
    </div>
  )
}
