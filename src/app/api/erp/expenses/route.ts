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

  const expenses = await db.expense.findMany({
    where: { businessId },
    orderBy: { date: 'desc' },
    take: 100,
  })

  return NextResponse.json({ expenses })
}

export async function POST(req: NextRequest) {
  const user = await getSession(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { businessId, category, amount, description, date, receipt } = body

  if (!businessId || !category || amount === undefined) {
    return NextResponse.json({ error: 'businessId, category, amount required' }, { status: 400 })
  }
  if (!canManageBusiness(user, businessId)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const expense = await db.expense.create({
    data: {
      businessId,
      userId: user.id,
      category,
      amount: Number(amount),
      description: description || '',
      date: date ? new Date(date) : new Date(),
      receipt: receipt || null,
    },
  })

  return NextResponse.json({ expense })
}

export async function DELETE(req: NextRequest) {
  const user = await getSession(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = req.nextUrl
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

  const expense = await db.expense.findUnique({ where: { id } })
  if (!expense) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (!canManageBusiness(user, expense.businessId)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  await db.expense.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
