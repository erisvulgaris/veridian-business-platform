import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession, isAdmin } from '@/lib/auth'

export async function GET(req: NextRequest) {
  const user = await getSession(req)
  if (!user || !isAdmin(user)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  // Platform-wide stats
  const [
    totalBusinesses,
    pendingBusinesses,
    verifiedBusinesses,
    totalUsers,
    totalReviews,
    pendingReviews,
    totalEnquiries,
    totalMessages,
    premiumSubscriptions,
  ] = await Promise.all([
    db.business.count(),
    db.business.count({ where: { status: 'pending' } }),
    db.business.count({ where: { verified: { in: ['verified', 'premium', 'enterprise'] } } }),
    db.user.count(),
    db.review.count(),
    db.review.count({ where: { status: 'pending' } }),
    db.enquiry.count(),
    db.message.count({ where: { senderRole: 'customer' } }),
    db.subscription.count({ where: { plan: { in: ['premium', 'enterprise'] }, status: 'active' } }),
  ])

  // Revenue from subscriptions
  const revenueResult = await db.subscription.aggregate({
    where: { status: 'active' },
    _sum: { amount: true },
  })
  const monthlyRevenue = revenueResult._sum.amount || 0

  // Growth data (last 8 weeks)
  const now = new Date()
  const weeks: { label: string; businesses: number; users: number; reviews: number }[] = []
  for (let i = 7; i >= 0; i--) {
    const start = new Date(now)
    start.setDate(start.getDate() - i * 7)
    const end = new Date(start)
    end.setDate(end.getDate() + 7)
    const [b, u, r] = await Promise.all([
      db.business.count({ where: { createdAt: { gte: start, lt: end } } }),
      db.user.count({ where: { createdAt: { gte: start, lt: end } } }),
      db.review.count({ where: { createdAt: { gte: start, lt: end } } }),
    ])
    weeks.push({ label: `${start.getDate()}/${start.getMonth() + 1}`, businesses: b, users: u, reviews: r })
  }

  // Category distribution
  const allBusinesses = await db.business.findMany({ select: { category: true } })
  const categoryDist: Record<string, number> = {}
  allBusinesses.forEach(b => { categoryDist[b.category] = (categoryDist[b.category] || 0) + 1 })
  const categoryData = Object.entries(categoryDist).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 8)

  // Recent activity
  const [newBusinesses, newReviews, newEnquiries] = await Promise.all([
    db.business.findMany({ orderBy: { createdAt: 'desc' }, take: 5, select: { id: true, name: true, category: true, verified: true, status: true, createdAt: true } }),
    db.review.findMany({ orderBy: { createdAt: 'desc' }, take: 5, include: { business: { select: { name: true } } } }),
    db.enquiry.findMany({ orderBy: { createdAt: 'desc' }, take: 5, include: { business: { select: { name: true } } } }),
  ])

  return NextResponse.json({
    stats: {
      totalBusinesses,
      pendingBusinesses,
      verifiedBusinesses,
      totalUsers,
      totalReviews,
      pendingReviews,
      totalEnquiries,
      totalMessages,
      premiumSubscriptions,
      monthlyRevenue,
    },
    growth: weeks,
    categoryData,
    recent: { businesses: newBusinesses, reviews: newReviews, enquiries: newEnquiries },
  })
}
