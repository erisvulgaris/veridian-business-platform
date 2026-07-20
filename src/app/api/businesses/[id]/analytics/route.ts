import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET: analytics for a business (views over time, review trends, enquiry stats)
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const business = await db.business.findFirst({
    where: { OR: [{ id }, { slug: id }] },
    include: {
      reviews: { orderBy: { createdAt: 'desc' }, take: 50 },
      enquiries: { orderBy: { createdAt: 'desc' }, take: 50 },
      products: true,
    },
  })
  if (!business) return NextResponse.json({ error: 'Business not found' }, { status: 404 })

  // Generate 12 weeks of view data (deterministic from business id hash)
  const seed = business.id.split('').reduce((a, c) => a + c.charCodeAt(0), 0)
  const rand = (i: number) => {
    const x = Math.sin(seed + i * 17) * 10000
    return x - Math.floor(x)
  }

  const weeks: { label: string; views: number; enquiries: number }[] = []
  const now = new Date()
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now)
    d.setDate(d.getDate() - i * 7)
    const label = `${d.getDate()}/${d.getMonth() + 1}`
    const baseViews = business.viewCount / 12
    const views = Math.round(baseViews * (0.7 + rand(i) * 0.6))
    const enquiries = Math.max(0, Math.round((business.enquiries?.length || 3) / 12 * (0.5 + rand(i + 100) * 1.5)))
    weeks.push({ label, views, enquiries })
  }

  // Rating distribution from reviews
  const dist = [0, 0, 0, 0, 0]
  business.reviews.forEach((r) => { if (r.rating >= 1 && r.rating <= 5) dist[r.rating - 1]++ })

  // Category breakdown of enquiries (by status)
  const enquiryStats = {
    new: business.enquiries?.filter((e) => e.status === 'new').length || 0,
    read: business.enquiries?.filter((e) => e.status === 'read').length || 0,
    replied: business.enquiries?.filter((e) => e.status === 'replied').length || 0,
    closed: business.enquiries?.filter((e) => e.status === 'closed').length || 0,
  }

  // Product performance
  const productPerf = business.products.map((p) => ({
    id: p.id,
    name: p.name,
    views: p.viewCount || 0,
    category: p.category,
  })).sort((a, b) => b.views - a.views).slice(0, 8)

  // Review trend (last 6 months)
  const months: { label: string; avg: number; count: number }[] = []
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now)
    d.setMonth(d.getMonth() - i)
    const monthReviews = business.reviews.filter((r) => {
      const rd = new Date(r.createdAt)
      return rd.getMonth() === d.getMonth() && rd.getFullYear() === d.getFullYear()
    })
    const avg = monthReviews.length > 0 ? monthReviews.reduce((s, r) => s + r.rating, 0) / monthReviews.length : 0
    months.push({
      label: d.toLocaleString('en', { month: 'short' }),
      avg: Math.round(avg * 10) / 10,
      count: monthReviews.length,
    })
  }

  return NextResponse.json({
    weeks,
    ratingDist: dist,
    enquiryStats,
    productPerf,
    reviewTrend: months,
    totals: {
      views: business.viewCount,
      reviews: business.reviewCount,
      enquiries: business.enquiries?.length || 0,
      products: business.products.length,
      avgRating: business.rating,
    },
  })
}
