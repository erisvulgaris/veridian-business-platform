'use client'

import * as React from 'react'
import useSWR from 'swr'
import {
  Package, ShoppingCart, Receipt, Users, CreditCard, Briefcase, BarChart3,
  TrendingUp, TrendingDown, Plus, ArrowUpRight, ArrowDownRight, Search,
  Filter, MoreVertical, CheckCircle2, Clock, AlertCircle, IndianRupee,
  Boxes, Trash2, Edit3, Send, Loader2,
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
import { formatNumber, formatPrice } from '@/lib/types'

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export function ErpView() {
  const { setView } = useAppStore()
  const { user } = useAuth()
  const [activeModule, setActiveModule] = React.useState<'overview' | 'inventory' | 'orders' | 'invoices' | 'customers' | 'expenses' | 'staff'>('overview')
  const [selectedBusinessId, setSelectedBusinessId] = React.useState<string | null>(null)

  // Fetch businesses the user can manage
  const { data: bizData } = useSWR<{ businesses: any[] }>('/api/businesses?limit=60', fetcher)
  const businesses = bizData?.businesses ?? []
  const businessId = selectedBusinessId || businesses[0]?.id

  const modules = [
    { key: 'overview', label: 'Overview', icon: BarChart3 },
    { key: 'inventory', label: 'Inventory', icon: Boxes },
    { key: 'orders', label: 'Orders', icon: ShoppingCart },
    { key: 'invoices', label: 'Invoices', icon: Receipt },
    { key: 'customers', label: 'Customers', icon: Users },
    { key: 'expenses', label: 'Expenses', icon: CreditCard },
    { key: 'staff', label: 'Staff', icon: Briefcase },
  ] as const

  return (
    <div className="mx-auto max-w-7xl px-3 py-4 sm:px-4">
      {/* Header */}
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Boxes className="h-5 w-5 text-primary" />
            <h1 className="text-xl font-bold tracking-tight sm:text-2xl">Free ERP</h1>
            <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">FREE FOREVER</span>
          </div>
          <p className="text-xs text-muted-foreground">Manage inventory, orders, invoices, customers, expenses & staff</p>
        </div>
        {businesses.length > 0 && (
          <select
            value={businessId || ''}
            onChange={(e) => setSelectedBusinessId(e.target.value)}
            className="h-9 rounded-lg border border-border bg-card px-3 text-sm outline-none focus:ring-2 focus:ring-primary/20"
          >
            {businesses.map((b) => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>
        )}
      </div>

      {/* Module tabs */}
      <div className="mb-4 no-scrollbar flex gap-1.5 overflow-x-auto pb-1">
        {modules.map((m) => (
          <button
            key={m.key}
            onClick={() => setActiveModule(m.key)}
            className={cn(
              'inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition',
              activeModule === m.key
                ? 'border-primary bg-primary text-primary-foreground shadow-sm'
                : 'border-border hover:border-primary/40'
            )}
          >
            <m.icon className="h-3.5 w-3.5" /> {m.label}
          </button>
        ))}
      </div>

      {!businessId ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border py-16 text-center">
          <Boxes className="h-10 w-10 text-muted-foreground/40" />
          <p className="mt-2 text-sm font-semibold">No business selected</p>
          <p className="text-xs text-muted-foreground">Claim or add a business to access the ERP.</p>
          <Button className="mt-3" onClick={() => setView({ name: 'home' })}>Browse businesses</Button>
        </div>
      ) : (
        <>
          {activeModule === 'overview' && <ErpOverview businessId={businessId} />}
          {activeModule === 'inventory' && <InventoryModule businessId={businessId} />}
          {activeModule === 'orders' && <OrdersModule businessId={businessId} />}
          {activeModule === 'invoices' && <InvoicesModule businessId={businessId} />}
          {activeModule === 'customers' && <CustomersModule businessId={businessId} />}
          {activeModule === 'expenses' && <ExpensesModule businessId={businessId} />}
          {activeModule === 'staff' && <StaffModule businessId={businessId} />}
        </>
      )}
    </div>
  )
}

// === Overview ===
function ErpOverview({ businessId }: { businessId: string }) {
  const { data, isLoading } = useSWR(`/api/erp/dashboard?businessId=${businessId}`, fetcher)

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-2xl" />)}
        </div>
        <Skeleton className="h-64 rounded-2xl" />
      </div>
    )
  }

  const stats = data?.stats
  const monthlyRevenue = data?.monthlyRevenue ?? []
  const topProducts = data?.topProducts ?? []
  const recentOrders = data?.recentOrders ?? []

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard icon={<IndianRupee className="h-4 w-4" />} label="Revenue" value={formatPrice(stats?.revenue || 0, 0)} color="#0f766e" trend="+12%" />
        <StatCard icon={<ShoppingCart className="h-4 w-4" />} label="Orders" value={String(stats?.orders || 0)} color="#0891b2" trend={`${stats?.orders || 0} total`} />
        <StatCard icon={<Receipt className="h-4 w-4" />} label="Pending invoices" value={formatPrice(stats?.pendingInvoices || 0, 0)} color="#f59e0b" trend="awaiting payment" />
        <StatCard icon={<TrendingDown className="h-4 w-4" />} label="Net profit" value={formatPrice(stats?.netProfit || 0, 0)} color={stats?.netProfit >= 0 ? '#10b981' : '#ef4444'} trend={`${stats?.netProfit >= 0 ? '+' : ''}${Math.round((stats?.netProfit / Math.max(stats?.revenue, 1)) * 100)}% margin`} />
      </div>

      {/* Revenue chart */}
      <div className="rounded-2xl border border-border bg-card p-4 card-elevated">
        <h3 className="mb-3 flex items-center gap-1.5 text-sm font-semibold"><TrendingUp className="h-4 w-4 text-primary" /> Revenue (last 6 months)</h3>
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={monthlyRevenue}>
            <defs>
              <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#0f766e" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#0f766e" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.4} />
            <XAxis dataKey="month" tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '0.75rem', fontSize: '12px' }} />
            <Area type="monotone" dataKey="revenue" stroke="#0f766e" strokeWidth={2} fill="url(#revGrad)" name="Revenue" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Top products + Recent orders */}
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-border bg-card p-4 card-elevated">
          <h3 className="mb-3 text-sm font-semibold">Top products (by views)</h3>
          {topProducts.length === 0 ? (
            <p className="py-4 text-center text-xs text-muted-foreground">No products yet</p>
          ) : (
            <div className="space-y-2">
              {topProducts.map((p, i) => (
                <div key={p.id} className="flex items-center gap-2 text-xs">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-secondary text-[10px] font-bold">{i + 1}</span>
                  <span className="flex-1 truncate font-medium">{p.name}</span>
                  <span className="text-muted-foreground">{formatNumber(p.viewCount)} views</span>
                  <span className="font-bold text-primary">{formatPrice(p.priceMin, 0)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="rounded-2xl border border-border bg-card p-4 card-elevated">
          <h3 className="mb-3 text-sm font-semibold">Recent orders</h3>
          {recentOrders.length === 0 ? (
            <p className="py-4 text-center text-xs text-muted-foreground">No orders yet</p>
          ) : (
            <div className="space-y-2">
              {recentOrders.map((o) => (
                <div key={o.id} className="flex items-center gap-2 text-xs">
                  <span className="font-mono text-[10px] text-muted-foreground">{o.orderNumber}</span>
                  <span className="flex-1 truncate font-medium">{o.customerName}</span>
                  <StatusBadge status={o.status} />
                  <span className="font-bold text-primary">{formatPrice(o.total, 0)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// === Inventory ===
function InventoryModule({ businessId }: { businessId: string }) {
  const { data, isLoading, mutate } = useSWR(`/api/erp/inventory?businessId=${businessId}`, fetcher)
  const [adjusting, setAdjusting] = React.useState<string | null>(null)
  const [qty, setQty] = React.useState('')
  const [reason, setReason] = React.useState('')

  const adjust = async (productId: string, action: 'add' | 'remove' | 'set') => {
    if (!qty) { toast.error('Enter quantity'); return }
    setAdjusting(productId)
    try {
      const res = await fetch('/api/erp/inventory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ businessId, productId, action, quantity: Number(qty), reason }),
      })
      const d = await res.json()
      if (!res.ok) { toast.error(d.error); return }
      toast.success(`Stock ${action}ed by ${qty}`)
      setQty(''); setReason('')
      mutate()
    } finally {
      setAdjusting(null)
    }
  }

  const items = data?.items ?? []
  const untracked = data?.productsWithoutInventory ?? []

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold">Inventory Management</h3>
          <p className="text-[11px] text-muted-foreground">{items.length} tracked · {untracked.length} untracked</p>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-2">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-16 rounded-xl" />)}</div>
      ) : items.length === 0 && untracked.length === 0 ? (
        <EmptyState icon={<Boxes className="h-8 w-8" />} title="No inventory" subtitle="Add products first to track inventory." />
      ) : (
        <div className="space-y-2">
          {items.map((item: any) => (
            <div key={item.id} className="rounded-xl border border-border bg-card p-3 card-elevated">
              <div className="flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <p className="truncate text-sm font-semibold">{item.product?.name}</p>
                  <p className="text-[10px] text-muted-foreground">SKU: {item.sku || 'N/A'} · {item.product?.category}</p>
                </div>
                <div className="text-right">
                  <p className={cn('text-lg font-bold', item.lowStock && 'text-amber-500')}>{item.stockQty}</p>
                  <p className="text-[10px] text-muted-foreground">in stock</p>
                </div>
                {item.lowStock && <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-[9px] font-bold text-amber-600">LOW</span>}
              </div>
              {adjusting === item.id ? (
                <div className="mt-2 flex items-center gap-1.5">
                  <input type="number" value={qty} onChange={(e) => setQty(e.target.value)} placeholder="Qty" className="h-8 w-20 rounded-lg border border-border px-2 text-xs outline-none focus:ring-2 focus:ring-primary/20" />
                  <input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Reason" className="h-8 flex-1 rounded-lg border border-border px-2 text-xs outline-none focus:ring-2 focus:ring-primary/20" />
                  <Button size="sm" className="h-8 gap-1 text-xs" onClick={() => adjust(item.productId, 'add')} disabled={adjusting === 'loading'}><Plus className="h-3 w-3" />Add</Button>
                  <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => adjust(item.productId, 'remove')}>Remove</Button>
                  <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => adjust(item.productId, 'set')}>Set</Button>
                </div>
              ) : (
                <button onClick={() => { setAdjusting(item.id); setQty(''); setReason('') }} className="mt-2 text-[11px] font-medium text-primary hover:underline">Adjust stock</button>
              )}
            </div>
          ))}
          {untracked.length > 0 && (
            <div className="rounded-xl border border-dashed border-border p-3">
              <p className="mb-2 text-[11px] font-medium text-muted-foreground">Untracked products ({untracked.length})</p>
              {untracked.map((p: any) => (
                <div key={p.id} className="flex items-center gap-2 py-1 text-xs">
                  <span className="flex-1 truncate">{p.name}</span>
                  <span className="text-muted-foreground">{p.category}</span>
                  <button onClick={() => { setAdjusting(p.id); setQty('') }} className="text-primary hover:underline">Track</button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// === Orders ===
function OrdersModule({ businessId }: { businessId: string }) {
  const { data, isLoading, mutate } = useSWR(`/api/erp/orders?businessId=${businessId}`, fetcher)
  const [showForm, setShowForm] = React.useState(false)
  const orders = data?.orders ?? []

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold">Orders</h3>
          <p className="text-[11px] text-muted-foreground">{orders.length} orders</p>
        </div>
        <Button size="sm" className="gap-1.5" onClick={() => setShowForm(s => !s)}><Plus className="h-3.5 w-3.5" /> New order</Button>
      </div>
      {showForm && <OrderForm businessId={businessId} onDone={() => { setShowForm(false); mutate() }} />}
      {isLoading ? (
        <div className="space-y-2">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-16 rounded-xl" />)}</div>
      ) : orders.length === 0 ? (
        <EmptyState icon={<ShoppingCart className="h-8 w-8" />} title="No orders yet" subtitle="Create your first order to start tracking sales." />
      ) : (
        <div className="space-y-2">
          {orders.map((o: any) => (
            <div key={o.id} className="rounded-xl border border-border bg-card p-3 card-elevated">
              <div className="flex items-center gap-2">
                <span className="font-mono text-[10px] text-muted-foreground">{o.orderNumber}</span>
                <span className="flex-1 truncate text-sm font-semibold">{o.customerName}</span>
                <StatusBadge status={o.status} />
                <span className="font-bold text-primary">{formatPrice(o.total, 0)}</span>
              </div>
              <div className="mt-1 flex items-center gap-2 text-[10px] text-muted-foreground">
                <span>{new Date(o.createdAt).toLocaleDateString()}</span>
                <span>·</span>
                <span>{o.paymentStatus}</span>
                <span>·</span>
                <span>{JSON.parse(o.items).length} item(s)</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function OrderForm({ businessId, onDone }: { businessId: string; onDone: () => void }) {
  const { data: prodData } = useSWR(`/api/businesses?limit=60`, fetcher)
  const [customerName, setCustomerName] = React.useState('')
  const [customerEmail, setCustomerEmail] = React.useState('')
  const [customerPhone, setCustomerPhone] = React.useState('')
  const [items, setItems] = React.useState<{ productId: string; name: string; qty: number; price: number }[]>([])
  const [selectedProduct, setSelectedProduct] = React.useState('')
  const [loading, setLoading] = React.useState(false)

  const products = prodData?.businesses?.find((b: any) => b.id === businessId)?.products ?? []

  const addItem = () => {
    const p = products.find((x: any) => x.id === selectedProduct)
    if (!p) return
    setItems([...items, { productId: p.id, name: p.name, qty: 1, price: p.priceMin }])
    setSelectedProduct('')
  }

  const submit = async () => {
    if (!customerName || items.length === 0) { toast.error('Customer name and items required'); return }
    setLoading(true)
    try {
      const res = await fetch('/api/erp/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ businessId, customerName, customerEmail, customerPhone, items }),
      })
      const d = await res.json()
      if (!res.ok) { toast.error(d.error); return }
      toast.success('Order created')
      onDone()
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="rounded-xl border-2 border-primary/20 bg-primary/[0.03] p-3 animate-scale-in">
      <div className="space-y-2">
        <div className="grid grid-cols-2 gap-2">
          <input value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="Customer name *" className="h-9 rounded-lg border border-border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-primary/20" />
          <input value={customerEmail} onChange={(e) => setCustomerEmail(e.target.value)} placeholder="Email" className="h-9 rounded-lg border border-border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-primary/20" />
        </div>
        <input value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} placeholder="Phone" className="h-9 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-primary/20" />
        <div className="flex gap-2">
          <select value={selectedProduct} onChange={(e) => setSelectedProduct(e.target.value)} className="h-9 flex-1 rounded-lg border border-border bg-background px-2 text-sm outline-none focus:ring-2 focus:ring-primary/20">
            <option value="">Select product…</option>
            {products.map((p: any) => <option key={p.id} value={p.id}>{p.name} (₹{p.priceMin})</option>)}
          </select>
          <Button size="sm" variant="outline" onClick={addItem}>Add</Button>
        </div>
        {items.map((item, i) => (
          <div key={i} className="flex items-center gap-2 text-xs">
            <span className="flex-1 truncate">{item.name}</span>
            <input type="number" value={item.qty} onChange={(e) => setItems(items.map((it, j) => j === i ? { ...it, qty: Number(e.target.value) } : it))} className="h-7 w-16 rounded border border-border px-1 text-xs" />
            <span>×</span>
            <input type="number" value={item.price} onChange={(e) => setItems(items.map((it, j) => j === i ? { ...it, price: Number(e.target.value) } : it))} className="h-7 w-20 rounded border border-border px-1 text-xs" />
            <button onClick={() => setItems(items.filter((_, j) => j !== i))} className="text-rose-500"><Trash2 className="h-3.5 w-3.5" /></button>
          </div>
        ))}
        <div className="flex justify-end gap-2 pt-1">
          <Button size="sm" variant="outline" onClick={onDone}>Cancel</Button>
          <Button size="sm" onClick={submit} disabled={loading}>{loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Create order'}</Button>
        </div>
      </div>
    </div>
  )
}

// === Invoices ===
function InvoicesModule({ businessId }: { businessId: string }) {
  const { data, isLoading, mutate } = useSWR(`/api/erp/invoices?businessId=${businessId}`, fetcher)
  const [showForm, setShowForm] = React.useState(false)
  const invoices = data?.invoices ?? []

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold">Invoices</h3>
          <p className="text-[11px] text-muted-foreground">{invoices.length} invoices</p>
        </div>
        <Button size="sm" className="gap-1.5" onClick={() => setShowForm(s => !s)}><Plus className="h-3.5 w-3.5" /> New invoice</Button>
      </div>
      {showForm && <InvoiceForm businessId={businessId} onDone={() => { setShowForm(false); mutate() }} />}
      {isLoading ? (
        <div className="space-y-2">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-16 rounded-xl" />)}</div>
      ) : invoices.length === 0 ? (
        <EmptyState icon={<Receipt className="h-8 w-8" />} title="No invoices yet" subtitle="Create invoices for your customers." />
      ) : (
        <div className="space-y-2">
          {invoices.map((inv: any) => (
            <div key={inv.id} className="rounded-xl border border-border bg-card p-3 card-elevated">
              <div className="flex items-center gap-2">
                <span className="font-mono text-[10px] text-muted-foreground">{inv.invoiceNumber}</span>
                <span className="flex-1 truncate text-sm font-semibold">{inv.customerName}</span>
                <StatusBadge status={inv.status} />
                <span className="font-bold text-primary">{formatPrice(inv.total, 0)}</span>
              </div>
              <div className="mt-1 text-[10px] text-muted-foreground">
                {new Date(inv.createdAt).toLocaleDateString()} {inv.dueDate && `· Due: ${new Date(inv.dueDate).toLocaleDateString()}`}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function InvoiceForm({ businessId, onDone }: { businessId: string; onDone: () => void }) {
  const [customerName, setCustomerName] = React.useState('')
  const [customerEmail, setCustomerEmail] = React.useState('')
  const [items, setItems] = React.useState<{ name: string; qty: number; price: number }[]>([])
  const [itemName, setItemName] = React.useState('')
  const [itemQty, setItemQty] = React.useState('1')
  const [itemPrice, setItemPrice] = React.useState('')
  const [loading, setLoading] = React.useState(false)

  const addItem = () => {
    if (!itemName) return
    setItems([...items, { name: itemName, qty: Number(itemQty), price: Number(itemPrice) }])
    setItemName(''); setItemQty('1'); setItemPrice('')
  }

  const submit = async () => {
    if (!customerName || items.length === 0) { toast.error('Customer name and items required'); return }
    setLoading(true)
    try {
      const res = await fetch('/api/erp/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ businessId, customerName, customerEmail, items }),
      })
      const d = await res.json()
      if (!res.ok) { toast.error(d.error); return }
      toast.success('Invoice created')
      onDone()
    } finally {
      setLoading(false)
    }
  }

  const subtotal = items.reduce((s, i) => s + i.qty * i.price, 0)

  return (
    <div className="rounded-xl border-2 border-primary/20 bg-primary/[0.03] p-3 animate-scale-in">
      <div className="space-y-2">
        <input value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="Customer name *" className="h-9 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-primary/20" />
        <input value={customerEmail} onChange={(e) => setCustomerEmail(e.target.value)} placeholder="Email" className="h-9 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-primary/20" />
        <div className="flex gap-2">
          <input value={itemName} onChange={(e) => setItemName(e.target.value)} placeholder="Item name" className="h-9 flex-1 rounded-lg border border-border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-primary/20" />
          <input type="number" value={itemQty} onChange={(e) => setItemQty(e.target.value)} placeholder="Qty" className="h-9 w-16 rounded-lg border border-border bg-background px-2 text-sm outline-none focus:ring-2 focus:ring-primary/20" />
          <input type="number" value={itemPrice} onChange={(e) => setItemPrice(e.target.value)} placeholder="Price" className="h-9 w-24 rounded-lg border border-border bg-background px-2 text-sm outline-none focus:ring-2 focus:ring-primary/20" />
          <Button size="sm" variant="outline" onClick={addItem}>Add</Button>
        </div>
        {items.length > 0 && (
          <div className="rounded-lg bg-secondary/50 p-2">
            {items.map((item, i) => (
              <div key={i} className="flex items-center gap-2 text-xs py-0.5">
                <span className="flex-1 truncate">{item.name}</span>
                <span>{item.qty} × ₹{item.price}</span>
                <span className="font-bold">₹{item.qty * item.price}</span>
                <button onClick={() => setItems(items.filter((_, j) => j !== i))} className="text-rose-500"><Trash2 className="h-3 w-3" /></button>
              </div>
            ))}
            <div className="mt-1 border-t border-border pt-1 text-right text-sm font-bold">Subtotal: ₹{subtotal}</div>
          </div>
        )}
        <div className="flex justify-end gap-2 pt-1">
          <Button size="sm" variant="outline" onClick={onDone}>Cancel</Button>
          <Button size="sm" onClick={submit} disabled={loading}>{loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Create invoice'}</Button>
        </div>
      </div>
    </div>
  )
}

// === Customers ===
function CustomersModule({ businessId }: { businessId: string }) {
  const { data, isLoading, mutate } = useSWR(`/api/erp/customers?businessId=${businessId}`, fetcher)
  const [showForm, setShowForm] = React.useState(false)
  const customers = data?.customers ?? []

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold">Customers</h3>
          <p className="text-[11px] text-muted-foreground">{customers.length} customers</p>
        </div>
        <Button size="sm" className="gap-1.5" onClick={() => setShowForm(s => !s)}><Plus className="h-3.5 w-3.5" /> Add customer</Button>
      </div>
      {showForm && <CustomerForm businessId={businessId} onDone={() => { setShowForm(false); mutate() }} />}
      {isLoading ? (
        <div className="space-y-2">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-16 rounded-xl" />)}</div>
      ) : customers.length === 0 ? (
        <EmptyState icon={<Users className="h-8 w-8" />} title="No customers yet" subtitle="Add customers or they'll be created automatically when orders come in." />
      ) : (
        <div className="space-y-2">
          {customers.map((c: any) => (
            <div key={c.id} className="flex items-center gap-3 rounded-xl border border-border bg-card p-3 card-elevated">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                {c.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="truncate text-sm font-semibold">{c.name}</p>
                <p className="truncate text-[10px] text-muted-foreground">{c.email || c.phone || 'No contact'}</p>
              </div>
              <div className="text-right">
                <p className="text-xs font-bold">{c.totalOrders} orders</p>
                <p className="text-[10px] text-muted-foreground">{formatPrice(c.totalSpent, 0)}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function CustomerForm({ businessId, onDone }: { businessId: string; onDone: () => void }) {
  const [name, setName] = React.useState('')
  const [email, setEmail] = React.useState('')
  const [phone, setPhone] = React.useState('')
  const [company, setCompany] = React.useState('')
  const [loading, setLoading] = React.useState(false)

  const submit = async () => {
    if (!name) { toast.error('Name required'); return }
    setLoading(true)
    try {
      const res = await fetch('/api/erp/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ businessId, name, email, phone, company }),
      })
      const d = await res.json()
      if (!res.ok) { toast.error(d.error); return }
      toast.success('Customer added')
      onDone()
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="rounded-xl border-2 border-primary/20 bg-primary/[0.03] p-3 animate-scale-in">
      <div className="space-y-2">
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Name *" className="h-9 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-primary/20" />
        <div className="grid grid-cols-2 gap-2">
          <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" className="h-9 rounded-lg border border-border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-primary/20" />
          <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Phone" className="h-9 rounded-lg border border-border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-primary/20" />
        </div>
        <input value={company} onChange={(e) => setCompany(e.target.value)} placeholder="Company" className="h-9 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-primary/20" />
        <div className="flex justify-end gap-2 pt-1">
          <Button size="sm" variant="outline" onClick={onDone}>Cancel</Button>
          <Button size="sm" onClick={submit} disabled={loading}>{loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Add customer'}</Button>
        </div>
      </div>
    </div>
  )
}

// === Expenses ===
function ExpensesModule({ businessId }: { businessId: string }) {
  const { data, isLoading, mutate } = useSWR(`/api/erp/expenses?businessId=${businessId}`, fetcher)
  const [showForm, setShowForm] = React.useState(false)
  const expenses = data?.expenses ?? []
  const total = expenses.reduce((s, e) => s + e.amount, 0)

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold">Expenses</h3>
          <p className="text-[11px] text-muted-foreground">{expenses.length} expenses · Total: {formatPrice(total, 0)}</p>
        </div>
        <Button size="sm" className="gap-1.5" onClick={() => setShowForm(s => !s)}><Plus className="h-3.5 w-3.5" /> Add expense</Button>
      </div>
      {showForm && <ExpenseForm businessId={businessId} onDone={() => { setShowForm(false); mutate() }} />}
      {isLoading ? (
        <div className="space-y-2">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-16 rounded-xl" />)}</div>
      ) : expenses.length === 0 ? (
        <EmptyState icon={<CreditCard className="h-8 w-8" />} title="No expenses yet" subtitle="Track your business expenses here." />
      ) : (
        <div className="space-y-2">
          {expenses.map((e: any) => (
            <div key={e.id} className="flex items-center gap-3 rounded-xl border border-border bg-card p-3 card-elevated">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-rose-500/10 text-rose-500"><CreditCard className="h-4 w-4" /></div>
              <div className="flex-1 min-w-0">
                <p className="truncate text-sm font-medium">{e.description || e.category}</p>
                <p className="text-[10px] text-muted-foreground">{e.category} · {new Date(e.date).toLocaleDateString()}</p>
              </div>
              <p className="font-bold text-rose-500">−{formatPrice(e.amount, 0)}</p>
              <button onClick={async () => { await fetch(`/api/erp/expenses?id=${e.id}`, { method: 'DELETE' }); mutate(); toast.success('Deleted') }} className="text-muted-foreground hover:text-rose-500"><Trash2 className="h-3.5 w-3.5" /></button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function ExpenseForm({ businessId, onDone }: { businessId: string; onDone: () => void }) {
  const [category, setCategory] = React.useState('')
  const [amount, setAmount] = React.useState('')
  const [description, setDescription] = React.useState('')
  const [loading, setLoading] = React.useState(false)

  const submit = async () => {
    if (!category || !amount) { toast.error('Category and amount required'); return }
    setLoading(true)
    try {
      const res = await fetch('/api/erp/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ businessId, category, amount: Number(amount), description }),
      })
      const d = await res.json()
      if (!res.ok) { toast.error(d.error); return }
      toast.success('Expense added')
      onDone()
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="rounded-xl border-2 border-primary/20 bg-primary/[0.03] p-3 animate-scale-in">
      <div className="space-y-2">
        <div className="grid grid-cols-2 gap-2">
          <input value={category} onChange={(e) => setCategory(e.target.value)} placeholder="Category *" className="h-9 rounded-lg border border-border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-primary/20" />
          <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="Amount *" className="h-9 rounded-lg border border-border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-primary/20" />
        </div>
        <input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Description" className="h-9 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-primary/20" />
        <div className="flex justify-end gap-2 pt-1">
          <Button size="sm" variant="outline" onClick={onDone}>Cancel</Button>
          <Button size="sm" onClick={submit} disabled={loading}>{loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Add expense'}</Button>
        </div>
      </div>
    </div>
  )
}

// === Staff ===
function StaffModule({ businessId }: { businessId: string }) {
  const { data, isLoading, mutate } = useSWR(`/api/erp/staff?businessId=${businessId}`, fetcher)
  const [showForm, setShowForm] = React.useState(false)
  const staff = data?.staff ?? []

  const toggleActive = async (s: any) => {
    await fetch('/api/erp/staff', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: s.id, active: !s.active }),
    })
    mutate()
    toast.success(s.active ? 'Deactivated' : 'Activated')
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold">Staff</h3>
          <p className="text-[11px] text-muted-foreground">{staff.filter(s => s.active).length} active · {staff.length} total</p>
        </div>
        <Button size="sm" className="gap-1.5" onClick={() => setShowForm(s => !s)}><Plus className="h-3.5 w-3.5" /> Add staff</Button>
      </div>
      {showForm && <StaffForm businessId={businessId} onDone={() => { setShowForm(false); mutate() }} />}
      {isLoading ? (
        <div className="space-y-2">{Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="h-16 rounded-xl" />)}</div>
      ) : staff.length === 0 ? (
        <EmptyState icon={<Briefcase className="h-8 w-8" />} title="No staff yet" subtitle="Add staff members to help manage your business." />
      ) : (
        <div className="space-y-2">
          {staff.map((s: any) => (
            <div key={s.id} className="flex items-center gap-3 rounded-xl border border-border bg-card p-3 card-elevated">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                {s.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="truncate text-sm font-semibold">{s.name}</p>
                <p className="truncate text-[10px] text-muted-foreground">{s.email}</p>
              </div>
              <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-medium capitalize">{s.role}</span>
              <button onClick={() => toggleActive(s)} className={cn('rounded-full px-2 py-0.5 text-[10px] font-medium', s.active ? 'bg-emerald-500/10 text-emerald-600' : 'bg-zinc-500/10 text-zinc-500')}>
                {s.active ? 'Active' : 'Inactive'}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function StaffForm({ businessId, onDone }: { businessId: string; onDone: () => void }) {
  const [name, setName] = React.useState('')
  const [email, setEmail] = React.useState('')
  const [role, setRole] = React.useState('staff')
  const [loading, setLoading] = React.useState(false)

  const submit = async () => {
    if (!name || !email) { toast.error('Name and email required'); return }
    setLoading(true)
    try {
      const res = await fetch('/api/erp/staff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ businessId, name, email, role }),
      })
      const d = await res.json()
      if (!res.ok) { toast.error(d.error); return }
      toast.success('Staff member added')
      onDone()
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="rounded-xl border-2 border-primary/20 bg-primary/[0.03] p-3 animate-scale-in">
      <div className="space-y-2">
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Name *" className="h-9 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-primary/20" />
        <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email *" className="h-9 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-primary/20" />
        <select value={role} onChange={(e) => setRole(e.target.value)} className="h-9 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-primary/20">
          <option value="staff">Staff</option>
          <option value="manager">Manager</option>
          <option value="accountant">Accountant</option>
        </select>
        <div className="flex justify-end gap-2 pt-1">
          <Button size="sm" variant="outline" onClick={onDone}>Cancel</Button>
          <Button size="sm" onClick={submit} disabled={loading}>{loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Add staff'}</Button>
        </div>
      </div>
    </div>
  )
}

// === Shared ===
function StatCard({ icon, label, value, color, trend }: { icon: React.ReactNode; label: string; value: string; color: string; trend?: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-3 card-elevated">
      <div className="flex items-center justify-between">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg" style={{ background: color + '15', color }}>{icon}</div>
      </div>
      <p className="mt-2 text-lg font-bold">{value}</p>
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
      {trend && <p className="text-[10px] text-muted-foreground">{trend}</p>}
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { color: string; bg: string }> = {
    new: { color: '#0f766e', bg: 'rgba(15,118,110,0.1)' },
    confirmed: { color: '#0891b2', bg: 'rgba(8,145,178,0.1)' },
    shipped: { color: '#7c3aed', bg: 'rgba(124,58,237,0.1)' },
    delivered: { color: '#10b981', bg: 'rgba(16,185,129,0.1)' },
    cancelled: { color: '#ef4444', bg: 'rgba(239,68,68,0.1)' },
    draft: { color: '#6b7280', bg: 'rgba(107,114,128,0.1)' },
    sent: { color: '#0891b2', bg: 'rgba(8,145,178,0.1)' },
    paid: { color: '#10b981', bg: 'rgba(16,185,129,0.1)' },
    overdue: { color: '#ef4444', bg: 'rgba(239,68,68,0.1)' },
    unpaid: { color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
    published: { color: '#10b981', bg: 'rgba(16,185,129,0.1)' },
    pending: { color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
    flagged: { color: '#ef4444', bg: 'rgba(239,68,68,0.1)' },
    removed: { color: '#9ca3af', bg: 'rgba(156,163,175,0.1)' },
  }
  const c = config[status] || config.new
  return <span className="rounded-full px-1.5 py-0.5 text-[9px] font-bold capitalize" style={{ color: c.color, background: c.bg }}>{status}</span>
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
