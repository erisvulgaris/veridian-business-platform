import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import type { Business } from '@/lib/types'

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
    _count: {
      products: b._count?.products ?? 0,
      services: b._count?.services ?? 0,
      reviews: b._count?.reviews ?? 0,
    },
  }
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const business = await db.business.findFirst({
    where: { OR: [{ id }, { slug: id }] },
    include: {
      products: true,
      services: true,
      reviews: { orderBy: { createdAt: 'desc' }, take: 50 },
      _count: { select: { products: true, services: true, reviews: true } },
    },
  })
  if (!business) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const parsed = parseBusiness(business) as any
  parsed.products = business.products.map((p: any) => ({
    ...p,
    images: JSON.parse(p.images || '[]'),
    variants: JSON.parse(p.variants || '[]'),
    specifications: JSON.parse(p.specifications || '[]'),
    documents: JSON.parse(p.documents || '[]'),
    faqs: JSON.parse(p.faqs || '[]'),
  }))
  parsed.services = business.services.map((s: any) => ({
    ...s,
    requirements: JSON.parse(s.requirements || '[]'),
    deliverables: JSON.parse(s.deliverables || '[]'),
    photos: JSON.parse(s.photos || '[]'),
    faqs: JSON.parse(s.faqs || '[]'),
  }))
  parsed.reviews = business.reviews.map((r: any) => ({
    ...r,
    photos: JSON.parse(r.photos || '[]'),
  }))

  // increment view count asynchronously (fire and forget)
  db.business.update({ where: { id: business.id }, data: { viewCount: { increment: 1 } } }).catch(() => {})

  // nearby businesses
  const nearby = await db.business.findMany({
    where: {
      id: { not: business.id },
      category: business.category,
    },
    take: 4,
    include: { _count: { select: { products: true, services: true, reviews: true } } },
  })
  parsed.nearby = nearby.map(parseBusiness)

  return NextResponse.json({ business: parsed })
}
