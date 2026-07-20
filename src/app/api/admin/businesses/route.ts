import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession, isAdmin } from '@/lib/auth'

export async function GET(req: NextRequest) {
  const user = await getSession(req)
  if (!user || !isAdmin(user)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { searchParams } = req.nextUrl
  const status = searchParams.get('status')
  const verified = searchParams.get('verified')
  const search = searchParams.get('q')
  const limit = Number(searchParams.get('limit') || 100)

  const where: any = {}
  if (status && status !== 'all') where.status = status
  if (verified && verified !== 'all') where.verified = verified
  if (search) {
    where.OR = [
      { name: { contains: search } },
      { email: { contains: search } },
      { city: { contains: search } },
      { category: { contains: search } },
    ]
  }

  const businesses = await db.business.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: limit,
    include: { _count: { select: { products: true, reviews: true, enquiries: true } } },
  })

  return NextResponse.json({ businesses, total: businesses.length })
}

// PATCH — update business status/verification/featured (admin actions)
export async function PATCH(req: NextRequest) {
  const user = await getSession(req)
  if (!user || !isAdmin(user)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await req.json()
  const { id, action, value } = body

  if (!id || !action) return NextResponse.json({ error: 'id and action required' }, { status: 400 })

  const business = await db.business.findUnique({ where: { id } })
  if (!business) return NextResponse.json({ error: 'Business not found' }, { status: 404 })

  const updates: any = {}
  let actionLabel = ''

  if (action === 'status') {
    updates.status = value // active | pending | suspended | rejected
    actionLabel = `business_${value}`
  } else if (action === 'verify') {
    updates.verified = value // basic | verified | premium | enterprise
    if (value !== 'basic') updates.recentlyVerified = true
    actionLabel = `business_verify_${value}`
  } else if (action === 'feature') {
    updates.featured = Boolean(value)
    actionLabel = value ? 'business_feature' : 'business_unfeature'
  } else if (action === 'trending') {
    updates.trending = Boolean(value)
    actionLabel = value ? 'business_trend' : 'business_untrend'
  } else if (action === 'claim') {
    updates.claimStatus = value // claimed | claim_pending | unclaimed
    actionLabel = `business_claim_${value}`
  } else {
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  }

  const updated = await db.business.update({ where: { id }, data: updates })

  // Log admin action
  await db.adminAction.create({
    data: {
      adminId: user.id,
      action: actionLabel,
      targetType: 'business',
      targetId: id,
      metadata: JSON.stringify({ previous: { status: business.status, verified: business.verified, featured: business.featured }, new: updates }),
    },
  })

  return NextResponse.json({ business: updated })
}

// DELETE — delete a business
export async function DELETE(req: NextRequest) {
  const user = await getSession(req)
  if (!user || !isAdmin(user)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { searchParams } = req.nextUrl
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

  await db.business.delete({ where: { id } })

  await db.adminAction.create({
    data: {
      adminId: user.id,
      action: 'business_delete',
      targetType: 'business',
      targetId: id,
      metadata: '{}',
    },
  })

  return NextResponse.json({ ok: true })
}
