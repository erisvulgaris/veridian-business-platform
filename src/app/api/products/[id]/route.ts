import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import type { Product, Business } from '@/lib/types'

function parseProduct(p: any): Product {
  return {
    ...p,
    images: JSON.parse(p.images || '[]'),
    variants: JSON.parse(p.variants || '[]'),
    specifications: JSON.parse(p.specifications || '[]'),
    documents: JSON.parse(p.documents || '[]'),
    faqs: JSON.parse(p.faqs || '[]'),
  }
}
function parseBusiness(b: any): Business {
  return {
    ...b,
    gallery: JSON.parse(b.gallery || '[]'),
    subCategories: JSON.parse(b.subCategories || '[]'),
    hours: JSON.parse(b.hours || '{}'),
    languages: JSON.parse(b.languages || '[]'),
    paymentMethods: JSON.parse(b.paymentMethods || '[]'),
    facilities: JSON.parse(b.facilities || '[]'),
    deliveryOptions: JSON.parse(b.deliveryOptions || '[]'),
    social: JSON.parse(b.social || '{}'),
    certifications: JSON.parse(b.certifications || '[]'),
    awards: JSON.parse(b.awards || '[]'),
    promotion: b.promotion ? JSON.parse(b.promotion) : null,
    announcement: b.announcement ? JSON.parse(b.announcement) : null,
    _count: { products: 0, services: 0, reviews: 0 },
  }
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const product = await db.product.findFirst({
    where: { OR: [{ id }, { slug: id }] },
    include: { business: true },
  })
  if (!product) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  // related products from same business / category
  const related = await db.product.findMany({
    where: {
      id: { not: product.id },
      OR: [{ businessId: product.businessId }, { category: product.category }],
    },
    include: { business: true },
    take: 6,
  })

  return NextResponse.json({
    product: { ...parseProduct(product), business: parseBusiness(product.business) },
    related: related.map((r) => ({ ...parseProduct(r), business: parseBusiness(r.business) })),
  })
}
