import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession, canManageBusiness } from '@/lib/auth'

// GET products for a business
export async function GET(req: NextRequest) {
  const user = await getSession(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = req.nextUrl
  const businessId = searchParams.get('businessId')
  if (!businessId) return NextResponse.json({ error: 'businessId required' }, { status: 400 })
  if (!canManageBusiness(user, businessId)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const products = await db.product.findMany({
    where: { businessId },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json({ products: products.map(p => ({
    ...p,
    images: JSON.parse(p.images || '[]'),
    variants: JSON.parse(p.variants || '[]'),
    specifications: JSON.parse(p.specifications || '[]'),
    documents: JSON.parse(p.documents || '[]'),
    faqs: JSON.parse(p.faqs || '[]'),
  })) })
}

// POST create a new product
export async function POST(req: NextRequest) {
  const user = await getSession(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { businessId, name, description, category, brand, priceMin, priceMax, variants, specifications, availability, sku, cost, reorderLevel, images } = body

  if (!businessId || !name) return NextResponse.json({ error: 'businessId and name required' }, { status: 400 })
  if (!canManageBusiness(user, businessId)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') + '-' + Date.now().toString(36)

  const product = await db.product.create({
    data: {
      businessId,
      name,
      slug,
      description: description || '',
      images: JSON.stringify(images || ['https://picsum.photos/seed/' + slug + '/800/600']),
      category: category || 'General',
      brand: brand || 'N/A',
      priceMin: Number(priceMin) || 0,
      priceMax: Number(priceMax) || Number(priceMin) || 0,
      currency: 'INR',
      cost: Number(cost) || 0,
      sku: sku || null,
      variants: JSON.stringify(variants || []),
      specifications: JSON.stringify(specifications || []),
      availability: availability || 'in_stock',
      stockQty: 0,
      reorderLevel: Number(reorderLevel) || 5,
      documents: JSON.stringify([]),
      faqs: JSON.stringify([
        { q: 'What is the MOQ?', a: 'Please contact us for B2B bulk pricing and MOQ.' },
        { q: 'Do you offer credit terms?', a: 'Yes, we offer 30/60/90 day credit to verified B2B buyers.' },
      ]),
      featured: false,
      viewCount: 0,
    },
  })

  // Also create inventory item
  await db.inventoryItem.create({
    data: {
      businessId,
      productId: product.id,
      sku: sku || null,
      stockQty: 0,
      reorderLevel: Number(reorderLevel) || 5,
    },
  })

  return NextResponse.json({ product })
}
