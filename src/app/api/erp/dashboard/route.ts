import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession, canManageBusiness } from '@/lib/auth'

export async function GET(req: NextRequest) {
  const user = await getSession(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = req.nextUrl
  const businessId = searchParams.get('businessId')
  if (!businessId) return NextResponse.json({ error: 'businessId required' }, { status: 400 })
  if (!canManageBusiness(user, businessId)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  // Counts
  const [products, orders, invoices, customers, expenses, staff, lowStockItems] = await Promise.all([
    db.product.count({ where: { businessId } }),
    db.order.count({ where: { businessId } }),
    db.invoice.count({ where: { businessId } }),
    db.customer.count({ where: { businessId } }),
    db.expense.count({ where: { businessId } }),
    db.staff.count({ where: { businessId, active: true } }),
    db.inventoryItem.count({ where: { businessId, stockQty: { lte: db.inventoryItem.fields.reorderLevel } } }),
  ])

  // Revenue (sum of delivered/paid orders)
  const revenueResult = await db.order.aggregate({
    where: { businessId, status: { in: ['delivered'] } },
    _sum: { total: true },
  })
  const revenue = revenueResult._sum.total || 0

  // Pending invoices
  const pendingInvoices = await db.invoice.aggregate({
    where: { businessId, status: { in: ['sent', 'overdue'] } },
    _sum: { total: true },
  })

  // Total expenses
  const expenseResult = await db.expense.aggregate({
    where: { businessId },
    _sum: { amount: true },
  })
  const totalExpenses = expenseResult._sum.amount || 0

  // Recent orders
  const recentOrders = await db.order.findMany({
    where: { businessId },
    orderBy: { createdAt: 'desc' },
    take: 5,
  })

  // Top products by views
  const topProducts = await db.product.findMany({
    where: { businessId },
    orderBy: { viewCount: 'desc' },
    take: 5,
    select: { id: true, name: true, viewCount: true, stockQty: true, priceMin: true },
  })

  // Monthly revenue (last 6 months)
  const now = new Date()
  const monthlyRevenue: { month: string; revenue: number; orders: number }[] = []
  for (let i = 5; i >= 0; i--) {
    const start = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 1)
    const monthOrders = await db.order.findMany({
      where: { businessId, createdAt: { gte: start, lt: end }, status: { in: ['delivered', 'confirmed', 'shipped'] } },
    })
    monthlyRevenue.push({
      month: start.toLocaleString('en', { month: 'short' }),
      revenue: monthOrders.reduce((s, o) => s + o.total, 0),
      orders: monthOrders.length,
    })
  }

  return NextResponse.json({
    stats: {
      products,
      orders,
      invoices,
      customers,
      expenses,
      staff,
      lowStockItems,
      revenue,
      pendingInvoices: pendingInvoices._sum.total || 0,
      totalExpenses,
      netProfit: revenue - totalExpenses,
    },
    recentOrders,
    topProducts,
    monthlyRevenue,
  })
}
