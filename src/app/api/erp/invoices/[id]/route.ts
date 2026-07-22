import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession, canManageBusiness } from '@/lib/auth'

// PATCH — update invoice status
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSession(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const body = await req.json()
  const { status } = body

  const invoice = await db.invoice.findUnique({ where: { id } })
  if (!invoice) return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
  if (!canManageBusiness(user, invoice.businessId)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const updates: any = { status }
  if (status === 'paid') updates.paidAt = new Date()

  const updated = await db.invoice.update({ where: { id }, data: updates })
  return NextResponse.json({ invoice: updated })
}
