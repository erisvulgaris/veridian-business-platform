import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import type { Service, Business } from '@/lib/types'

function parseService(s: any): Service {
  return {
    ...s,
    requirements: JSON.parse(s.requirements || '[]'),
    deliverables: JSON.parse(s.deliverables || '[]'),
    photos: JSON.parse(s.photos || '[]'),
    faqs: JSON.parse(s.faqs || '[]'),
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
  const service = await db.service.findFirst({
    where: { OR: [{ id }, { slug: id }] },
    include: { business: true },
  })
  if (!service) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  return NextResponse.json({
    service: { ...parseService(service), business: parseBusiness(service.business) },
  })
}
