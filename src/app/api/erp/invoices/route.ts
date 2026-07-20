import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession, canManageBusiness } from '@/lib/auth'

// GET invoices for a business
export async function GET(req: NextRequest) {
  const user = await getSession(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = req.nextUrl
  const businessId = searchParams.get('businessId')
  if (!businessId) return NextResponse.json({ error: 'businessId required' }, { status: 400 })
  if (!canManageBusiness(user, businessId)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const invoices = await db.invoice.findMany({
    where: { businessId },
    orderBy: { createdAt: 'desc' },
    take: 100,
  })

  return NextResponse.json({ invoices })
}

// POST create invoice
export async function POST(req: NextRequest) {
  const user = await getSession(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { businessId, orderId, customerName, customerEmail, items, tax, dueDate, notes } = body

  if (!businessId || !customerName || !items?.length) {
    return NextResponse.json({ error: 'businessId, customerName, items required' }, { status: 400 })
  }
  if (!canManageBusiness(user, businessId)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const parsedItems = items.map((item: any) => ({
    name: item.name,
    qty: Number(item.qty) || 1,
    price: Number(item.price) || 0,
    total: (Number(item.qty) || 1) * (Number(item.price) || 0),
  }))
  const subtotal = parsedItems.reduce((s: number, i: any) => s + i.total, 0)
  const taxAmount = Number(tax) || 0
  const total = subtotal + taxAmount

  const count = await db.invoice.count({ where: { businessId } })
  const invoiceNumber = `INV-${String(count + 1).padStart(5, '0')}`

  const invoice = await db.invoice.create({
    data: {
      businessId,
      orderId: orderId || null,
      userId: user.id,
      invoiceNumber,
      customerName,
      customerEmail: customerEmail || null,
      items: JSON.stringify(parsedItems),
      subtotal,
      tax: taxAmount,
      total,
      status: 'draft',
      dueDate: dueDate ? new Date(dueDate) : null,
      notes: notes || null,
    },
  })

  return NextResponse.json({ invoice })
}
