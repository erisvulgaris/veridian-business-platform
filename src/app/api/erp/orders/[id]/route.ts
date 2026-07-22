import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession, canManageBusiness } from '@/lib/auth'

// PATCH — update order status
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSession(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const body = await req.json()
  const { status, paymentStatus } = body

  const order = await db.order.findUnique({ where: { id } })
  if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 })
  if (!canManageBusiness(user, order.businessId)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const updates: any = {}
  if (status) updates.status = status
  if (paymentStatus) updates.paymentStatus = paymentStatus

  const updated = await db.order.update({ where: { id }, data: updates })
  return NextResponse.json({ order: updated })
}
