'use client'

import * as React from 'react'
import useSWR from 'swr'
import {
  Shield, Building2, Users, Star, MessageSquare, CheckCircle2, XCircle,
  TrendingUp, DollarSign, AlertCircle, Search, MoreVertical, Ban, Check,
  Trash2, Eye, Filter, Crown, BadgeCheck, Clock, Loader2, FileText,
  Boxes, ArrowRight,
} from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area, PieChart, Pie, Cell, Legend,
} from 'recharts'
import { useAppStore } from '@/lib/store'
import { useAuth } from '@/lib/auth-context'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { formatNumber, formatPrice, timeAgo } from '@/lib/types'

const fetcher = (url: string) => fetch(url).then((r) => r.json())
const PIE_COLORS = ['#0f766e', '#0891b2', '#7c3aed', '#f59e0b', '#ef4444', '#10b981', '#3b82f6', '#ec4899']

export function AdminView() {
  const { user } = useAuth()
  const [tab, setTab] = React.useState<'overview' | 'businesses' | 'users' | 'reviews' | 'claims' | 'subscriptions' | 'audit'>('overview')

  const tabs = [
    { key: 'overview', label: 'Overview', icon: TrendingUp },
    { key: 'businesses', label: 'Businesses', icon: Building2 },
    { key: 'users', label: 'Users', icon: Users },
    { key: 'reviews', label: 'Reviews', icon: Star },
    { key: 'claims', label: 'Claims', icon: CheckCircle2 },
    { key: 'subscriptions', label: 'Billing', icon: DollarSign },
    { key: 'audit', label: 'Audit Log', icon: FileText },
  ] as const

  return (
    <div className="mx-auto max-w-7xl px-3 py-4 sm:px-4">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <Shield className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight sm:text-2xl">Super Admin</h1>
              <p className="text-[11px] text-muted-foreground">Platform control center · {user?.name}</p>
            </div>
          </div>
        </div>
        <span className="rounded-full bg-primary/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-primary">{user?.role}</span>
      </div>

      {/* Tabs */}
      <div className="mb-4 no-scrollbar flex gap-1.5 overflow-x-auto pb-1">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={cn(
              'inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition',
              tab === t.key ? 'border-primary bg-primary text-primary-foreground shadow-sm' : 'border-border hover:border-primary/40'
            )}
          >
            <t.icon className="h-3.5 w-3.5" /> {t.label}
          </button>
        ))}
      </div>

      {tab === 'overview' && <AdminOverview />}
      {tab === 'businesses' && <BusinessManagement />}
      {tab === 'users' && <UserManagement />}
      {tab === 'reviews' && <ReviewModeration />}
      {tab === 'claims' && <ClaimManagement />}
      {tab === 'subscriptions' && <SubscriptionManagement />}
      {tab === 'audit' && <AuditLog />}
    </div>
  )
}

// === Overview ===
function AdminOverview() {
  const { data, isLoading } = useSWR('/api/admin/dashboard', fetcher)

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-2xl" />)}</div>
        <Skeleton className="h-64 rounded-2xl" />
      </div>
    )
  }

  const stats = data?.stats
  const growth = data?.growth ?? []
  const categoryData = data?.categoryData ?? []
  const recent = data?.recent ?? {}

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-5">
        <StatCard icon={<Building2 className="h-4 w-4" />} label="Businesses" value={formatNumber(stats?.totalBusinesses || 0)} sub={`${stats?.pendingBusinesses || 0} pending`} color="#0f766e" />
        <StatCard icon={<Users className="h-4 w-4" />} label="Users" value={formatNumber(stats?.totalUsers || 0)} color="#0891b2" />
        <StatCard icon={<Star className="h-4 w-4" />} label="Reviews" value={formatNumber(stats?.totalReviews || 0)} sub={`${stats?.pendingReviews || 0} pending`} color="#f59e0b" />
        <StatCard icon={<MessageSquare className="h-4 w-4" />} label="Enquiries" value={formatNumber(stats?.totalEnquiries || 0)} color="#7c3aed" />
        <StatCard icon={<DollarSign className="h-4 w-4" />} label="MRR" value={formatPrice(stats?.monthlyRevenue || 0, 0)} sub={`${stats?.premiumSubscriptions || 0} premium`} color="#10b981" />
      </div>

      {/* Growth chart */}
      <div className="rounded-2xl border border-border bg-card p-4 card-elevated">
        <h3 className="mb-3 flex items-center gap-1.5 text-sm font-semibold"><TrendingUp className="h-4 w-4 text-primary" /> Platform growth (last 8 weeks)</h3>
        <ResponsiveContainer width="100%" height={240}>
          <AreaChart data={growth}>
            <defs>
              <linearGradient id="bizGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#0f766e" stopOpacity={0.3} /><stop offset="95%" stopColor="#0f766e" stopOpacity={0} /></linearGradient>
              <linearGradient id="userGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#0891b2" stopOpacity={0.3} /><stop offset="95%" stopColor="#0891b2" stopOpacity={0} /></linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.4} />
            <XAxis dataKey="label" tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '0.75rem', fontSize: '12px' }} />
            <Area type="monotone" dataKey="businesses" stroke="#0f766e" strokeWidth={2} fill="url(#bizGrad)" name="Businesses" />
            <Area type="monotone" dataKey="users" stroke="#0891b2" strokeWidth={2} fill="url(#userGrad)" name="Users" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Category distribution + Recent activity */}
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-border bg-card p-4 card-elevated">
          <h3 className="mb-3 text-sm font-semibold">Businesses by category</h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={categoryData} cx="50%" cy="50%" innerRadius={45} outerRadius={75} paddingAngle={3} dataKey="value">
                {categoryData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
              </Pie>
              <Tooltip contentStyle={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '0.75rem', fontSize: '12px' }} />
              <Legend wrapperStyle={{ fontSize: '11px' }} iconType="circle" />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="rounded-2xl border border-border bg-card p-4 card-elevated">
          <h3 className="mb-3 text-sm font-semibold">Recent businesses</h3>
          <div className="space-y-2">
            {recent.businesses?.map((b: any) => (
              <div key={b.id} className="flex items-center gap-2 text-xs">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg" style={{ background: b.brandColor + '20' }}>
                  <Building2 className="h-3.5 w-3.5" style={{ color: b.brandColor }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="truncate font-medium">{b.name}</p>
                  <p className="text-[10px] text-muted-foreground">{b.category} · {timeAgo(b.createdAt)}</p>
                </div>
                <span className={cn('rounded-full px-1.5 py-0.5 text-[9px] font-bold capitalize', b.status === 'active' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-amber-500/10 text-amber-600')}>{b.status}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// === Business Management ===
function BusinessManagement() {
  const { setView } = useAppStore()
  const [filter, setFilter] = React.useState<'all' | 'active' | 'pending' | 'suspended'>('all')
  const [verifiedFilter, setVerifiedFilter] = React.useState<'all' | 'basic' | 'verified' | 'premium' | 'enterprise'>('all')
  const [search, setSearch] = React.useState('')
  const [debouncedSearch, setDebouncedSearch] = React.useState('')

  React.useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300)
    return () => clearTimeout(t)
  }, [search])

  const query = new URLSearchParams({
    status: filter,
    verified: verifiedFilter,
    q: debouncedSearch,
    limit: '100',
  }).toString()
  const { data, isLoading, mutate } = useSWR(`/api/admin/businesses?${query}`, fetcher)
  const businesses = data?.businesses ?? []
  const [actionLoading, setActionLoading] = React.useState<string | null>(null)

  const act = async (id: string, action: string, value: string) => {
    setActionLoading(id + action)
    try {
      const res = await fetch('/api/admin/businesses', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, action, value }),
      })
      const d = await res.json()
      if (!res.ok) { toast.error(d.error); return }
      toast.success(`Action: ${action} = ${value}`)
      mutate()
    } finally {
      setActionLoading(null)
    }
  }

  const del = async (id: string) => {
    if (!confirm('Delete this business? This cannot be undone.')) return
    await fetch(`/api/admin/businesses?id=${id}`, { method: 'DELETE' })
    mutate()
    toast.success('Business deleted')
  }

  return (
    <div className="space-y-3">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search businesses…" className="h-9 w-48 rounded-lg border border-border bg-card pl-8 pr-3 text-sm outline-none focus:ring-2 focus:ring-primary/20" />
        </div>
        <select value={filter} onChange={(e) => setFilter(e.target.value as any)} className="h-9 rounded-lg border border-border bg-card px-2 text-sm outline-none">
          <option value="all">All status</option>
          <option value="active">Active</option>
          <option value="pending">Pending</option>
          <option value="suspended">Suspended</option>
        </select>
        <select value={verifiedFilter} onChange={(e) => setVerifiedFilter(e.target.value as any)} className="h-9 rounded-lg border border-border bg-card px-2 text-sm outline-none">
          <option value="all">All verification</option>
          <option value="basic">Basic</option>
          <option value="verified">Verified</option>
          <option value="premium">Premium</option>
          <option value="enterprise">Enterprise</option>
        </select>
        <span className="ml-auto text-xs text-muted-foreground">{businesses.length} businesses</span>
      </div>

      {isLoading ? (
        <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-xl" />)}</div>
      ) : businesses.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border py-12 text-center text-sm text-muted-foreground">No businesses found</div>
      ) : (
        <div className="space-y-2">
          {businesses.map((b: any) => (
            <div key={b.id} className="rounded-xl border border-border bg-card p-3 card-elevated">
              <div className="flex items-center gap-3">
                <img src={b.logo} alt="" className="h-10 w-10 rounded-lg object-cover" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <p className="truncate text-sm font-semibold">{b.name}</p>
                    <span className={cn('rounded-full px-1.5 py-0.5 text-[9px] font-bold capitalize', b.status === 'active' ? 'bg-emerald-500/10 text-emerald-600' : b.status === 'pending' ? 'bg-amber-500/10 text-amber-600' : 'bg-rose-500/10 text-rose-500')}>{b.status}</span>
                  </div>
                  <p className="text-[10px] text-muted-foreground">{b.category} · {b.area}, {b.city} · ⭐{b.rating} ({b.reviewCount})</p>
                </div>
                {/* Verification */}
                <select
                  value={b.verified}
                  onChange={(e) => act(b.id, 'verify', e.target.value)}
                  disabled={actionLoading === b.id + 'verify'}
                  className="h-7 rounded-md border border-border bg-background px-1.5 text-[10px] outline-none"
                >
                  <option value="basic">Basic</option>
                  <option value="verified">Verified</option>
                  <option value="premium">Premium</option>
                  <option value="enterprise">Enterprise</option>
                </select>
              </div>
              {/* Actions */}
              <div className="mt-2 flex flex-wrap items-center gap-1.5">
                <Button size="sm" variant="ghost" className="h-7 gap-1 text-[10px]" onClick={() => setView({ name: 'business', id: b.id, slug: b.slug })}><Eye className="h-3 w-3" /> View</Button>
                {b.status === 'pending' && <Button size="sm" variant="ghost" className="h-7 gap-1 text-[10px] text-emerald-600" onClick={() => act(b.id, 'status', 'active')} disabled={actionLoading === b.id + 'status'}><CheckCircle2 className="h-3 w-3" /> Approve</Button>}
                {b.status === 'active' && <Button size="sm" variant="ghost" className="h-7 gap-1 text-[10px] text-amber-600" onClick={() => act(b.id, 'status', 'suspended')} disabled={actionLoading === b.id + 'status'}><Ban className="h-3 w-3" /> Suspend</Button>}
                {b.status === 'suspended' && <Button size="sm" variant="ghost" className="h-7 gap-1 text-[10px] text-emerald-600" onClick={() => act(b.id, 'status', 'active')} disabled={actionLoading === b.id + 'status'}><Check className="h-3 w-3" /> Activate</Button>}
                <Button size="sm" variant="ghost" className={cn('h-7 gap-1 text-[10px]', b.featured && 'text-amber-500')} onClick={() => act(b.id, 'feature', String(!b.featured))} disabled={actionLoading === b.id + 'feature'}><Crown className="h-3 w-3" /> {b.featured ? 'Unfeature' : 'Feature'}</Button>
                <Button size="sm" variant="ghost" className="h-7 gap-1 text-[10px] text-rose-500" onClick={() => del(b.id)}><Trash2 className="h-3 w-3" /> Delete</Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// === User Management ===
function UserManagement() {
  const [roleFilter, setRoleFilter] = React.useState('all')
  const [search, setSearch] = React.useState('')
  const [debouncedSearch, setDebouncedSearch] = React.useState('')

  React.useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300)
    return () => clearTimeout(t)
  }, [search])

  const query = new URLSearchParams({ role: roleFilter, q: debouncedSearch }).toString()
  const { data, isLoading, mutate } = useSWR(`/api/admin/users?${query}`, fetcher)
  const users = data?.users ?? []
  const [acting, setActing] = React.useState<string | null>(null)

  const setRole = async (id: string, role: string) => {
    setActing(id + role)
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, role }),
      })
      const d = await res.json()
      if (!res.ok) { toast.error(d.error); return }
      toast.success(`Role changed to ${role}`)
      mutate()
    } finally {
      setActing(null)
    }
  }

  const toggleActive = async (u: any) => {
    setActing(u.id + 'active')
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: u.id, active: !u.active }),
      })
      if (!res.ok) { const d = await res.json(); toast.error(d.error); return }
      toast.success(u.active ? 'User suspended' : 'User activated')
      mutate()
    } finally {
      setActing(null)
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search users…" className="h-9 w-48 rounded-lg border border-border bg-card pl-8 pr-3 text-sm outline-none focus:ring-2 focus:ring-primary/20" />
        </div>
        <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} className="h-9 rounded-lg border border-border bg-card px-2 text-sm outline-none">
          <option value="all">All roles</option>
          <option value="super_admin">Super Admin</option>
          <option value="admin">Admin</option>
          <option value="moderator">Moderator</option>
          <option value="owner">Owner</option>
          <option value="staff">Staff</option>
          <option value="customer">Customer</option>
        </select>
        <span className="ml-auto text-xs text-muted-foreground">{users.length} users</span>
      </div>

      {isLoading ? (
        <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-16 rounded-xl" />)}</div>
      ) : users.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border py-12 text-center text-sm text-muted-foreground">No users found</div>
      ) : (
        <div className="space-y-2">
          {users.map((u: any) => (
            <div key={u.id} className="flex items-center gap-3 rounded-xl border border-border bg-card p-3 card-elevated">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                {u.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <p className="truncate text-sm font-semibold">{u.name}</p>
                  {!u.active && <span className="rounded-full bg-rose-500/10 px-1.5 py-0.5 text-[9px] font-bold text-rose-500">SUSPENDED</span>}
                </div>
                <p className="truncate text-[10px] text-muted-foreground">{u.email} · Last login: {u.lastLoginAt ? timeAgo(u.lastLoginAt) : 'never'}</p>
              </div>
              <select
                value={u.role}
                onChange={(e) => setRole(u.id, e.target.value)}
                disabled={acting === u.id + u.role}
                className="h-7 rounded-md border border-border bg-background px-1.5 text-[10px] outline-none"
              >
                <option value="customer">Customer</option>
                <option value="owner">Owner</option>
                <option value="staff">Staff</option>
                <option value="moderator">Moderator</option>
                <option value="admin">Admin</option>
                <option value="super_admin">Super Admin</option>
              </select>
              <button
                onClick={() => toggleActive(u)}
                disabled={u.role === 'super_admin'}
                className={cn('rounded-full px-2 py-0.5 text-[10px] font-medium', u.active ? 'bg-emerald-500/10 text-emerald-600' : 'bg-zinc-500/10 text-zinc-500', u.role === 'super_admin' && 'opacity-40')}
              >
                {u.active ? 'Active' : 'Suspended'}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// === Review Moderation ===
function ReviewModeration() {
  const [statusFilter, setStatusFilter] = React.useState<'all' | 'published' | 'pending' | 'flagged' | 'removed'>('all')
  const query = new URLSearchParams({ status: statusFilter }).toString()
  const { data, isLoading, mutate } = useSWR(`/api/admin/reviews?${query}`, fetcher)
  const reviews = data?.reviews ?? []
  const [acting, setActing] = React.useState<string | null>(null)

  const moderate = async (id: string, status: string) => {
    setActing(id + status)
    try {
      await fetch('/api/admin/reviews', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status }),
      })
      toast.success(`Review ${status}`)
      mutate()
    } finally {
      setActing(null)
    }
  }

  const del = async (id: string) => {
    if (!confirm('Delete this review permanently?')) return
    await fetch(`/api/admin/reviews?id=${id}`, { method: 'DELETE' })
    mutate()
    toast.success('Review deleted')
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as any)} className="h-9 rounded-lg border border-border bg-card px-2 text-sm outline-none">
          <option value="all">All reviews</option>
          <option value="published">Published</option>
          <option value="pending">Pending</option>
          <option value="flagged">Flagged</option>
          <option value="removed">Removed</option>
        </select>
        <span className="ml-auto text-xs text-muted-foreground">{reviews.length} reviews</span>
      </div>

      {isLoading ? (
        <div className="space-y-2">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}</div>
      ) : reviews.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border py-12 text-center text-sm text-muted-foreground">No reviews found</div>
      ) : (
        <div className="space-y-2">
          {reviews.map((r: any) => (
            <div key={r.id} className="rounded-xl border border-border bg-card p-3 card-elevated">
              <div className="flex items-start gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-[10px] font-bold text-primary">
                  {r.authorName.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <p className="text-sm font-semibold">{r.authorName}</p>
                    <span className="text-[10px] text-amber-500">{'★'.repeat(r.rating)}</span>
                    <span className={cn('rounded-full px-1.5 py-0.5 text-[9px] font-bold capitalize', r.status === 'published' ? 'bg-emerald-500/10 text-emerald-600' : r.status === 'flagged' ? 'bg-rose-500/10 text-rose-500' : 'bg-amber-500/10 text-amber-600')}>{r.status}</span>
                    <span className="ml-auto text-[10px] text-muted-foreground">{timeAgo(r.createdAt)}</span>
                  </div>
                  <p className="text-xs font-medium">{r.title}</p>
                  <p className="text-xs text-muted-foreground line-clamp-2">{r.content}</p>
                  <p className="text-[10px] text-muted-foreground">on {r.business?.name}</p>
                </div>
              </div>
              <div className="mt-2 flex gap-1.5">
                {r.status !== 'published' && <Button size="sm" variant="ghost" className="h-7 gap-1 text-[10px] text-emerald-600" onClick={() => moderate(r.id, 'published')} disabled={acting === r.id + 'published'}><CheckCircle2 className="h-3 w-3" /> Publish</Button>}
                {r.status !== 'flagged' && <Button size="sm" variant="ghost" className="h-7 gap-1 text-[10px] text-amber-600" onClick={() => moderate(r.id, 'flagged')} disabled={acting === r.id + 'flagged'}><AlertCircle className="h-3 w-3" /> Flag</Button>}
                {r.status !== 'removed' && <Button size="sm" variant="ghost" className="h-7 gap-1 text-[10px] text-zinc-500" onClick={() => moderate(r.id, 'removed')} disabled={acting === r.id + 'removed'}><XCircle className="h-3 w-3" /> Remove</Button>}
                <Button size="sm" variant="ghost" className="h-7 gap-1 text-[10px] text-rose-500" onClick={() => del(r.id)}><Trash2 className="h-3 w-3" /> Delete</Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// === Claim Management ===
function ClaimManagement() {
  const { data, isLoading, mutate } = useSWR('/api/admin/claims', fetcher)
  const claims = data?.claims ?? []
  const [acting, setActing] = React.useState<string | null>(null)

  const act = async (businessId: string, action: 'approve' | 'reject') => {
    setActing(businessId + action)
    try {
      await fetch('/api/admin/claims', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ businessId, action }),
      })
      toast.success(`Claim ${action}d`)
      mutate()
    } finally {
      setActing(null)
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">Business Claims</h3>
        <span className="text-xs text-muted-foreground">{claims.length} pending</span>
      </div>
      {isLoading ? (
        <div className="space-y-2">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-xl" />)}</div>
      ) : claims.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border py-12 text-center">
          <CheckCircle2 className="h-8 w-8 text-muted-foreground/30" />
          <p className="mt-2 text-sm font-medium text-muted-foreground">No pending claims</p>
          <p className="text-xs text-muted-foreground/70">All claim requests have been processed</p>
        </div>
      ) : (
        <div className="space-y-2">
          {claims.map((b: any) => (
            <div key={b.id} className="rounded-xl border border-border bg-card p-3 card-elevated">
              <div className="flex items-center gap-3">
                <img src={b.logo} alt="" className="h-10 w-10 rounded-lg object-cover" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{b.name}</p>
                  <p className="text-[10px] text-muted-foreground">{b.category} · {b.email}</p>
                </div>
              </div>
              <div className="mt-2 flex gap-1.5">
                <Button size="sm" className="h-7 gap-1 text-[10px]" onClick={() => act(b.id, 'approve')} disabled={acting === b.id + 'approve'}><CheckCircle2 className="h-3 w-3" /> Approve claim</Button>
                <Button size="sm" variant="outline" className="h-7 gap-1 text-[10px]" onClick={() => act(b.id, 'reject')} disabled={acting === b.id + 'reject'}><XCircle className="h-3 w-3" /> Reject</Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// === Shared ===
function StatCard({ icon, label, value, sub, color }: { icon: React.ReactNode; label: string; value: string; sub?: string; color: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-3 card-elevated">
      <div className="flex h-8 w-8 items-center justify-center rounded-lg" style={{ background: color + '15', color }}>{icon}</div>
      <p className="mt-2 text-lg font-bold">{value}</p>
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
      {sub && <p className="text-[10px] text-muted-foreground">{sub}</p>}
    </div>
  )
}

// === Subscription Management ===
function SubscriptionManagement() {
  const [planFilter, setPlanFilter] = React.useState('all')
  const [statusFilter, setStatusFilter] = React.useState('all')
  const query = new URLSearchParams({ plan: planFilter, status: statusFilter }).toString()
  const { data, isLoading, mutate } = useSWR(`/api/admin/subscriptions?${query}`, fetcher)
  const subscriptions = data?.subscriptions ?? []
  const stats = data?.stats
  const [acting, setActing] = React.useState<string | null>(null)

  const act = async (id: string, action: string, plan?: string) => {
    setActing(id + action)
    try {
      const res = await fetch('/api/admin/subscriptions', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, action, plan }),
      })
      const d = await res.json()
      if (!res.ok) { toast.error(d.error); return }
      toast.success(`Subscription ${action}ed`)
      mutate()
    } finally {
      setActing(null)
    }
  }

  return (
    <div className="space-y-3">
      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard icon={<DollarSign className="h-4 w-4" />} label="MRR" value={formatPrice(stats?.mrr || 0, 0)} color="#10b981" />
        <StatCard icon={<Crown className="h-4 w-4" />} label="Premium" value={String(stats?.premium || 0)} color="#f59e0b" />
        <StatCard icon={<Shield className="h-4 w-4" />} label="Enterprise" value={String(stats?.enterprise || 0)} color="#7c3aed" />
        <StatCard icon={<CheckCircle2 className="h-4 w-4" />} label="Active" value={String(stats?.activeCount || 0)} color="#0f766e" />
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2">
        <select value={planFilter} onChange={(e) => setPlanFilter(e.target.value)} className="h-9 rounded-lg border border-border bg-card px-2 text-sm outline-none">
          <option value="all">All plans</option>
          <option value="free">Free</option>
          <option value="premium">Premium</option>
          <option value="enterprise">Enterprise</option>
        </select>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="h-9 rounded-lg border border-border bg-card px-2 text-sm outline-none">
          <option value="all">All status</option>
          <option value="active">Active</option>
          <option value="cancelled">Cancelled</option>
          <option value="expired">Expired</option>
        </select>
        <span className="ml-auto text-xs text-muted-foreground">{subscriptions.length} subscriptions</span>
      </div>

      {isLoading ? (
        <div className="space-y-2">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-16 rounded-xl" />)}</div>
      ) : subscriptions.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border py-12 text-center text-sm text-muted-foreground">No subscriptions found. Create subscriptions from business profiles.</div>
      ) : (
        <div className="space-y-2">
          {subscriptions.map((s: any) => (
            <div key={s.id} className="rounded-xl border border-border bg-card p-3 card-elevated">
              <div className="flex items-center gap-3">
                <div className={cn('flex h-9 w-9 items-center justify-center rounded-lg', s.plan === 'enterprise' ? 'bg-violet-500/10 text-violet-500' : s.plan === 'premium' ? 'bg-amber-500/10 text-amber-500' : 'bg-secondary text-muted-foreground')}>
                  {s.plan === 'enterprise' ? <Shield className="h-4 w-4" /> : s.plan === 'premium' ? <Crown className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{s.business?.name || 'Unknown'}</p>
                  <p className="text-[10px] text-muted-foreground capitalize">{s.plan} · {s.billingCycle} · {formatPrice(s.amount, 0)}/mo</p>
                </div>
                <span className={cn('rounded-full px-1.5 py-0.5 text-[9px] font-bold capitalize', s.status === 'active' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-zinc-500/10 text-zinc-500')}>{s.status}</span>
              </div>
              <div className="mt-2 flex gap-1.5">
                {s.plan !== 'premium' && <Button size="sm" variant="ghost" className="h-7 gap-1 text-[10px] text-amber-600" onClick={() => act(s.id, 'upgrade', 'premium')} disabled={acting === s.id + 'upgrade'}><Crown className="h-3 w-3" /> Upgrade to Premium</Button>}
                {s.plan !== 'enterprise' && <Button size="sm" variant="ghost" className="h-7 gap-1 text-[10px] text-violet-600" onClick={() => act(s.id, 'upgrade', 'enterprise')} disabled={acting === s.id + 'upgrade'}><Shield className="h-3 w-3" /> Upgrade to Enterprise</Button>}
                {s.status === 'active' && <Button size="sm" variant="ghost" className="h-7 gap-1 text-[10px] text-rose-500" onClick={() => act(s.id, 'cancel')} disabled={acting === s.id + 'cancel'}><XCircle className="h-3 w-3" /> Cancel</Button>}
                {s.status !== 'active' && <Button size="sm" variant="ghost" className="h-7 gap-1 text-[10px] text-emerald-600" onClick={() => act(s.id, 'reactivate')} disabled={acting === s.id + 'reactivate'}><CheckCircle2 className="h-3 w-3" /> Reactivate</Button>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// === Audit Log ===
function AuditLog() {
  const { data, isLoading } = useSWR('/api/admin/audit-log?limit=50', fetcher)
  const actions = data?.actions ?? []

  const actionIcon = (action: string) => {
    if (action.includes('verify')) return <BadgeCheck className="h-3.5 w-3.5 text-emerald-500" />
    if (action.includes('suspend') || action.includes('delete') || action.includes('remove') || action.includes('cancel')) return <XCircle className="h-3.5 w-3.5 text-rose-500" />
    if (action.includes('approve') || action.includes('activate') || action.includes('publish')) return <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
    if (action.includes('feature')) return <Crown className="h-3.5 w-3.5 text-amber-500" />
    if (action.includes('upgrade')) return <ArrowRight className="h-3.5 w-3.5 text-violet-500" />
    return <FileText className="h-3.5 w-3.5 text-muted-foreground" />
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold">Audit Log</h3>
          <p className="text-[11px] text-muted-foreground">All admin actions — {actions.length} entries</p>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-14 rounded-xl" />)}</div>
      ) : actions.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border py-12 text-center">
          <FileText className="h-8 w-8 text-muted-foreground/30" />
          <p className="mt-2 text-sm font-medium text-muted-foreground">No actions logged yet</p>
          <p className="text-xs text-muted-foreground/70">Admin actions will appear here</p>
        </div>
      ) : (
        <div className="space-y-1.5">
          {actions.map((a: any) => (
            <div key={a.id} className="flex items-start gap-3 rounded-xl border border-border bg-card p-3 card-elevated">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-secondary">
                {actionIcon(a.action)}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-xs font-semibold capitalize">{a.action.replace(/_/g, ' ')}</p>
                  <span className="rounded-full bg-secondary px-1.5 py-0.5 text-[9px] text-muted-foreground">{a.targetType}</span>
                  <span className="ml-auto text-[10px] text-muted-foreground">{timeAgo(a.createdAt)}</span>
                </div>
                <p className="text-[10px] text-muted-foreground">by {a.admin?.name || 'Unknown'} · {a.admin?.email}</p>
                <p className="text-[10px] text-muted-foreground/70 font-mono">target: {a.targetId.slice(0, 20)}…</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
