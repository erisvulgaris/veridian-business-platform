import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession, isAdmin } from '@/lib/auth'

export async function GET(req: NextRequest) {
  const user = await getSession(req)
  if (!user || !isAdmin(user)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { searchParams } = req.nextUrl
  const status = searchParams.get('status')
  const businessId = searchParams.get('businessId')

  const where: any = {}
  if (status && status !== 'all') where.status = status
  if (businessId) where.businessId = businessId

  const reviews = await db.review.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: 100,
    include: { business: { select: { name: true } } },
  })

  return NextResponse.json({ reviews, total: reviews.length })
}

// PATCH — moderate a review (change status)
export async function PATCH(req: NextRequest) {
  const user = await getSession(req)
  if (!user || !isAdmin(user)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await req.json()
  const { id, status, reason } = body

  if (!id || !status) return NextResponse.json({ error: 'id and status required' }, { status: 400 })
  if (!['published', 'pending', 'flagged', 'removed'].includes(status)) {
    return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
  }

  const review = await db.review.update({
    where: { id },
    data: { status, flaggedReason: status === 'flagged' ? (reason || 'Flagged by moderator') : null },
  })

  // Recalculate business rating if review was published/removed
  if (status === 'published' || status === 'removed') {
    const reviews = await db.review.findMany({ where: { businessId: review.businessId, status: 'published' } })
    const avg = reviews.length > 0 ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0
    await db.business.update({
      where: { id: review.businessId },
      data: { rating: Math.round(avg * 10) / 10, reviewCount: reviews.length },
    })
  }

  await db.adminAction.create({
    data: {
      adminId: user.id,
      action: `review_${status}`,
      targetType: 'review',
      targetId: id,
      metadata: JSON.stringify({ reason }),
    },
  })

  return NextResponse.json({ review })
}

// DELETE — permanently delete a review
export async function DELETE(req: NextRequest) {
  const user = await getSession(req)
  if (!user || !isAdmin(user)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { searchParams } = req.nextUrl
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

  const review = await db.review.findUnique({ where: { id } })
  if (!review) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  await db.review.delete({ where: { id } })

  // Recalculate business rating
  const reviews = await db.review.findMany({ where: { businessId: review.businessId, status: 'published' } })
  const avg = reviews.length > 0 ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0
  await db.business.update({
    where: { id: review.businessId },
    data: { rating: Math.round(avg * 10) / 10, reviewCount: reviews.length },
  })

  await db.adminAction.create({
    data: {
      adminId: user.id,
      action: 'review_delete',
      targetType: 'review',
      targetId: id,
      metadata: '{}',
    },
  })

  return NextResponse.json({ ok: true })
}
