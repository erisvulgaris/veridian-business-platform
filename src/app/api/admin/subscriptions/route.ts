import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession, isAdmin, isSuperAdmin } from '@/lib/auth'

// GET all subscriptions
export async function GET(req: NextRequest) {
  const user = await getSession(req)
  if (!user || !isAdmin(user)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { searchParams } = req.nextUrl
  const plan = searchParams.get('plan')
  const status = searchParams.get('status')

  const where: any = {}
  if (plan && plan !== 'all') where.plan = plan
  if (status && status !== 'all') where.status = status

  const subscriptions = await db.subscription.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: 100,
    include: {
      business: { select: { name: true, email: true, category: true } },
    },
  })

  // Summary stats
  const allSubs = await db.subscription.findMany({ where: { status: 'active' } })
  const mrr = allSubs
    .filter(s => s.status === 'active')
    .reduce((sum, s) => sum + (s.billingCycle === 'yearly' ? s.amount / 12 : s.amount), 0)

  const planCounts = {
    free: allSubs.filter(s => s.plan === 'free').length,
    premium: allSubs.filter(s => s.plan === 'premium').length,
    enterprise: allSubs.filter(s => s.plan === 'enterprise').length,
  }

  return NextResponse.json({
    subscriptions,
    total: subscriptions.length,
    stats: {
      mrr: Math.round(mrr),
      activeCount: allSubs.length,
      ...planCounts,
    },
  })
}

// PATCH — update subscription (upgrade/downgrade/cancel)
export async function PATCH(req: NextRequest) {
  const user = await getSession(req)
  if (!user || !isSuperAdmin(user)) return NextResponse.json({ error: 'Super admin only' }, { status: 403 })

  const body = await req.json()
  const { id, action, plan, status } = body

  if (!id || !action) return NextResponse.json({ error: 'id and action required' }, { status: 400 })

  const sub = await db.subscription.findUnique({ where: { id } })
  if (!sub) return NextResponse.json({ error: 'Subscription not found' }, { status: 404 })

  const updates: any = {}
  if (action === 'upgrade' && plan) {
    updates.plan = plan
    updates.amount = plan === 'premium' ? 999 : plan === 'enterprise' ? 4999 : 0
    if (plan !== 'free') {
      updates.endDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // +30 days
    }
  } else if (action === 'cancel') {
    updates.status = 'cancelled'
    updates.endDate = new Date()
  } else if (action === 'reactivate') {
    updates.status = 'active'
    updates.startDate = new Date()
    updates.endDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
  } else if (action === 'status' && status) {
    updates.status = status
  }

  const updated = await db.subscription.update({ where: { id }, data: updates })

  // Also update business verification level for premium/enterprise
  if (action === 'upgrade' && plan) {
    await db.business.update({
      where: { id: sub.businessId },
      data: { verified: plan === 'premium' ? 'premium' : plan === 'enterprise' ? 'enterprise' : 'verified' },
    })
  }

  await db.adminAction.create({
    data: {
      adminId: user.id,
      action: `subscription_${action}`,
      targetType: 'subscription',
      targetId: id,
      metadata: JSON.stringify({ previous: { plan: sub.plan, status: sub.status }, new: updates }),
    },
  })

  return NextResponse.json({ subscription: updated })
}
