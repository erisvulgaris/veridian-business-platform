import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession, canManageBusiness } from '@/lib/auth'

// GET inventory items for a business
export async function GET(req: NextRequest) {
  const user = await getSession(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = req.nextUrl
  const businessId = searchParams.get('businessId')
  if (!businessId) return NextResponse.json({ error: 'businessId required' }, { status: 400 })
  if (!canManageBusiness(user, businessId)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const items = await db.inventoryItem.findMany({
    where: { businessId },
    include: { product: true },
    orderBy: { updatedAt: 'desc' },
  })

  // Also include products without inventory items
  const productsWithoutInventory = await db.product.findMany({
    where: { businessId, inventory: { none: {} } },
  })

  return NextResponse.json({
    items: items.map(i => ({
      ...i,
      lowStock: i.stockQty <= i.reorderLevel,
    })),
    productsWithoutInventory: productsWithoutInventory.map(p => ({
      id: p.id,
      name: p.name,
      sku: p.sku,
      stockQty: p.stockQty,
      reorderLevel: p.reorderLevel,
      price: p.priceMin,
      category: p.category,
    })),
  })
}

// POST create/update inventory item (stock adjustment)
export async function POST(req: NextRequest) {
  const user = await getSession(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { businessId, productId, action, quantity, reason } = body

  if (!businessId || !productId || !action || quantity === undefined) {
    return NextResponse.json({ error: 'businessId, productId, action, quantity required' }, { status: 400 })
  }
  if (!canManageBusiness(user, businessId)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  // Find or create inventory item
  let item = await db.inventoryItem.findFirst({ where: { businessId, productId } })
  if (!item) {
    item = await db.inventoryItem.create({
      data: { businessId, productId, stockQty: 0, reorderLevel: 5 },
    })
  }

  const currentQty = item.stockQty
  let newQty = currentQty
  if (action === 'add') newQty = currentQty + Number(quantity)
  else if (action === 'remove') newQty = Math.max(0, currentQty - Number(quantity))
  else if (action === 'set') newQty = Number(quantity)
  else return NextResponse.json({ error: 'Invalid action (add/remove/set)' }, { status: 400 })

  // Update inventory item
  const updated = await db.inventoryItem.update({
    where: { id: item.id },
    data: { stockQty: newQty },
  })

  // Also update product stockQty
  await db.product.update({
    where: { id: productId },
    data: {
      stockQty: newQty,
      availability: newQty === 0 ? 'out_of_stock' : newQty <= updated.reorderLevel ? 'low_stock' : 'in_stock',
    },
  })

  return NextResponse.json({
    item: { ...updated, lowStock: updated.stockQty <= updated.reorderLevel },
    adjustment: { action, quantity: Number(quantity), reason, previousQty: currentQty, newQty },
  })
}
