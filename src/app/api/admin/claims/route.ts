import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession, isAdmin } from '@/lib/auth'

// GET all claim requests (businesses with claimStatus = claim_pending)
export async function GET(req: NextRequest) {
  const user = await getSession(req)
  if (!user || !isAdmin(user)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const businesses = await db.business.findMany({
    where: { claimStatus: 'claim_pending' },
    orderBy: { updatedAt: 'desc' },
    take: 50,
  })

  return NextResponse.json({ claims: businesses, total: businesses.length })
}

// PATCH — approve or reject a claim
export async function PATCH(req: NextRequest) {
  const user = await getSession(req)
  if (!user || !isAdmin(user)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await req.json()
  const { businessId, action } = body // action: approve | reject

  if (!businessId || !action) return NextResponse.json({ error: 'businessId and action required' }, { status: 400 })

  const business = await db.business.findUnique({ where: { id: businessId } })
  if (!business) return NextResponse.json({ error: 'Business not found' }, { status: 404 })

  if (action === 'approve') {
    const updated = await db.business.update({
      where: { id: businessId },
      data: { claimStatus: 'claimed' },
    })
    await db.adminAction.create({
      data: { adminId: user.id, action: 'claim_approve', targetType: 'business', targetId: businessId, metadata: '{}' },
    })
    return NextResponse.json({ business: updated, approved: true })
  } else if (action === 'reject') {
    const updated = await db.business.update({
      where: { id: businessId },
      data: { claimStatus: 'unclaimed' },
    })
    await db.adminAction.create({
      data: { adminId: user.id, action: 'claim_reject', targetType: 'business', targetId: businessId, metadata: '{}' },
    })
    return NextResponse.json({ business: updated, approved: false })
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
}
