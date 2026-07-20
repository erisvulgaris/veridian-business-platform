import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import type { Business, Product, Service } from '@/lib/types'

function parseBusinessLight(b: any): Business {
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

function parseService(s: any): Service {
  return {
    ...s,
    requirements: JSON.parse(s.requirements || '[]'),
    deliverables: JSON.parse(s.deliverables || '[]'),
    photos: JSON.parse(s.photos || '[]'),
    faqs: JSON.parse(s.faqs || '[]'),
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const q = (searchParams.get('q') || '').trim().toLowerCase()
  const lat = Number(searchParams.get('lat') || 0)
  const lng = Number(searchParams.get('lng') || 0)

  if (!q) {
    return NextResponse.json({ businesses: [], products: [], services: [], suggestions: [] })
  }

  // Tokenize the query for fuzzy matching
  const tokens = q.split(/\s+/).filter((t) => t.length > 1)

  const businesses = await db.business.findMany({
    where: {
      OR: [
        { name: { contains: q } },
        { tagline: { contains: q } },
        { description: { contains: q } },
        { category: { contains: q } },
        { area: { contains: q } },
        { subCategories: { contains: tokens[0] || q } },
        { name: { contains: tokens[0] || q } },
      ],
    },
    include: { _count: { select: { products: true, services: true, reviews: true } } },
    take: 30,
  })

  const products = await db.product.findMany({
    where: {
      OR: [
        { name: { contains: q } },
        { description: { contains: q } },
        { category: { contains: q } },
        { brand: { contains: q } },
      ],
    },
    include: { business: true },
    take: 20,
  })

  const services = await db.service.findMany({
    where: {
      OR: [
        { name: { contains: q } },
        { description: { contains: q } },
      ],
    },
    include: { business: true },
    take: 20,
  })

  // intent detection: "near me" / "nearby"
  const nearMe = q.includes('near me') || q.includes('nearby') || q.includes('around')

  let scoredBusinesses = businesses.map((b) => {
    let score = 0
    if (b.name.toLowerCase().includes(q)) score += 50
    if (b.name.toLowerCase().startsWith(q)) score += 30
    if (b.tagline.toLowerCase().includes(q)) score += 15
    if (b.description.toLowerCase().includes(q)) score += 10
    if (b.category.toLowerCase().includes(q)) score += 20
    if (b.area.toLowerCase().includes(q)) score += 12
    if (b.verified !== 'basic') score += 8
    if (b.featured) score += 6
    if (b.trending) score += 4
    score += b.rating * 5
    if (lat && lng) {
      const d = haversine(lat, lng, b.lat, b.lng)
      score += Math.max(0, 30 - d)
    }
    return { ...parseBusinessLight(b), _score: score }
  })

  scoredBusinesses.sort((a, b) => (b._score || 0) - (a._score || 0))

  // suggestions: matching category names
  const allCats = ['Hospitals', 'Clinics', 'Manufacturers', 'Industrial Machinery', 'Restaurants', 'Pharmacies', 'Schools', 'Colleges', 'Hotels', 'Wholesalers', 'Real Estate', 'Automotive']
  const suggestions = allCats.filter((c) => c.toLowerCase().includes(q) || q.includes(c.toLowerCase())).slice(0, 5)

  return NextResponse.json({
    businesses: scoredBusinesses,
    products: products.map((p) => ({ ...parseProduct(p), business: parseBusinessLight(p.business) })),
    services: services.map((s) => ({ ...parseService(s), business: parseBusinessLight(s.business) })),
    suggestions,
    intent: nearMe ? 'near_me' : 'keyword',
  })
}

function haversine(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLng = ((lng2 - lng1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}
