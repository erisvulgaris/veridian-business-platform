import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession, canManageBusiness } from '@/lib/auth'

// GET orders for a business
export async function GET(req: NextRequest) {
  const user = await getSession(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = req.nextUrl
  const businessId = searchParams.get('businessId')
  const status = searchParams.get('status')

  if (!businessId) return NextResponse.json({ error: 'businessId required' }, { status: 400 })
  if (!canManageBusiness(user, businessId)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const orders = await db.order.findMany({
    where: { businessId, ...(status && status !== 'all' ? { status } : {}) },
    orderBy: { createdAt: 'desc' },
    take: 100,
  })

  return NextResponse.json({ orders })
}

// POST create a new order
export async function POST(req: NextRequest) {
  const user = await getSession(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { businessId, customerName, customerEmail, customerPhone, shippingAddress, items, tax, discount, notes } = body

  if (!businessId || !customerName || !items?.length) {
    return NextResponse.json({ error: 'businessId, customerName, items required' }, { status: 400 })
  }
  if (!canManageBusiness(user, businessId)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  // Calculate totals
  const parsedItems = items.map((item: any, i: number) => ({
    productId: item.productId || null,
    name: item.name,
    qty: Number(item.qty) || 1,
    price: Number(item.price) || 0,
    total: (Number(item.qty) || 1) * (Number(item.price) || 0),
  }))
  const subtotal = parsedItems.reduce((s: number, i: any) => s + i.total, 0)
  const taxAmount = Number(tax) || 0
  const discountAmount = Number(discount) || 0
  const total = subtotal + taxAmount - discountAmount

  const count = await db.order.count({ where: { businessId } })
  const orderNumber = `ORD-${String(count + 1).padStart(5, '0')}`

  const order = await db.order.create({
    data: {
      businessId,
      userId: user.id,
      orderNumber,
      customerName,
      customerEmail: customerEmail || null,
      customerPhone: customerPhone || null,
      shippingAddress: shippingAddress || null,
      items: JSON.stringify(parsedItems),
      subtotal,
      tax: taxAmount,
      discount: discountAmount,
      total,
      status: 'new',
      paymentStatus: 'unpaid',
      notes: notes || null,
    },
  })

  // Create order items
  for (const item of parsedItems) {
    await db.orderItem.create({
      data: {
        orderId: order.id,
        productId: item.productId,
        name: item.name,
        qty: item.qty,
        price: item.price,
        total: item.total,
      },
    })

    // Decrement inventory if product has stock
    if (item.productId) {
      const inv = await db.inventoryItem.findFirst({ where: { businessId, productId: item.productId } })
      if (inv) {
        await db.inventoryItem.update({
          where: { id: inv.id },
          data: { stockQty: Math.max(0, inv.stockQty - item.qty) },
        })
        await db.product.update({
          where: { id: item.productId },
          data: {
            stockQty: Math.max(0, inv.stockQty - item.qty),
            availability: inv.stockQty - item.qty <= 0 ? 'out_of_stock' : inv.stockQty - item.qty <= 5 ? 'low_stock' : 'in_stock',
          },
        })
      }
    }
  }

  // Update or create customer
  if (customerEmail) {
    let customer = await db.customer.findFirst({ where: { businessId, email: customerEmail } })
    if (customer) {
      await db.customer.update({
        where: { id: customer.id },
        data: { totalOrders: { increment: 1 }, totalSpent: { increment: total } },
      })
    } else {
      await db.customer.create({
        data: {
          businessId,
          name: customerName,
          email: customerEmail,
          phone: customerPhone || null,
          totalOrders: 1,
          totalSpent: total,
        },
      })
    }
  }

  return NextResponse.json({ order })
}
