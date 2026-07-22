import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession, canManageBusiness } from '@/lib/auth'

// PATCH update a product
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSession(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const body = await req.json()

  const product = await db.product.findUnique({ where: { id } })
  if (!product) return NextResponse.json({ error: 'Product not found' }, { status: 404 })
  if (!canManageBusiness(user, product.businessId)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const updates: any = {}
  if (body.name) updates.name = body.name
  if (body.description !== undefined) updates.description = body.description
  if (body.category) updates.category = body.category
  if (body.brand) updates.brand = body.brand
  if (body.priceMin !== undefined) updates.priceMin = Number(body.priceMin)
  if (body.priceMax !== undefined) updates.priceMax = Number(body.priceMax)
  if (body.cost !== undefined) updates.cost = Number(body.cost)
  if (body.sku !== undefined) updates.sku = body.sku
  if (body.availability) updates.availability = body.availability
  if (body.stockQty !== undefined) updates.stockQty = Number(body.stockQty)
  if (body.reorderLevel !== undefined) updates.reorderLevel = Number(body.reorderLevel)
  if (body.featured !== undefined) updates.featured = Boolean(body.featured)
  if (body.variants) updates.variants = JSON.stringify(body.variants)
  if (body.specifications) updates.specifications = JSON.stringify(body.specifications)
  if (body.images) updates.images = JSON.stringify(body.images)

  const updated = await db.product.update({ where: { id }, data: updates })

  // Sync inventory if stock changed
  if (body.stockQty !== undefined) {
    const inv = await db.inventoryItem.findFirst({ where: { productId: id } })
    if (inv) {
      await db.inventoryItem.update({ where: { id: inv.id }, data: { stockQty: Number(body.stockQty) } })
    }
  }

  return NextResponse.json({ product: updated })
}

// DELETE a product
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSession(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const product = await db.product.findUnique({ where: { id } })
  if (!product) return NextResponse.json({ error: 'Product not found' }, { status: 404 })
  if (!canManageBusiness(user, product.businessId)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  await db.product.delete({ where: { id } })

  return NextResponse.json({ ok: true })
}
