import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import type { Business } from '@/lib/types'

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

// AI-powered search that understands intent and can match natural language queries
export async function POST(req: NextRequest) {
  const { query, lat, lng } = await req.json().catch(() => ({ query: '', lat: 0, lng: 0 }))
  const q = (query || '').trim()
  if (!q) return NextResponse.json({ businesses: [], interpretation: '' })

  // First, do a broad local fetch of all businesses so we can rank semantically
  const all = await db.business.findMany({
    include: { products: true, services: true, _count: { select: { reviews: true } } },
    take: 60,
  })

  const parsed = all.map((b) => {
    const light = parseBusinessLight(b)
    return {
      ...light,
      productNames: (b.products || []).map((p: any) => p.name).join(' '),
      serviceNames: (b.services || []).map((s: any) => s.name).join(' '),
    }
  })

  // Lightweight semantic-ish scoring: tokenize query and match against many fields
  const tokens = q.toLowerCase().split(/[\s,]+/).filter((t) => t.length > 1)
  const stopWords = new Set(['the', 'a', 'an', 'best', 'top', 'good', 'near', 'me', 'in', 'for', 'with', 'and', 'of'])
  const meaningful = tokens.filter((t) => !stopWords.has(t))

  const scored = parsed
    .map((b) => {
      const haystack = `${b.name} ${b.tagline} ${b.description} ${b.category} ${b.subCategories.join(' ')} ${b.area} ${b.productNames} ${b.serviceNames} ${b.certifications.join(' ')} ${b.facilities.join(' ')}`.toLowerCase()
      let score = 0
      for (const t of meaningful) {
        if (b.name.toLowerCase().includes(t)) score += 40
        if (b.category.toLowerCase().includes(t)) score += 35
        if (b.subCategories.join(' ').toLowerCase().includes(t)) score += 30
        if (b.productNames.toLowerCase().includes(t)) score += 28
        if (b.serviceNames.toLowerCase().includes(t)) score += 28
        if (b.tagline.toLowerCase().includes(t)) score += 15
        if (b.area.toLowerCase().includes(t)) score += 20
        if (b.facilities.join(' ').toLowerCase().includes(t)) score += 18
        if (b.certifications.join(' ').toLowerCase().includes(t)) score += 12
        if (haystack.includes(t)) score += 6
      }
      // intent boosts
      if (q.toLowerCase().includes('verified') && b.verified !== 'basic') score += 15
      if (q.toLowerCase().includes('open') && b.isOpen) score += 12
      if (q.toLowerCase().includes('rated') || q.toLowerCase().includes('best')) score += b.rating * 8
      if (b.featured) score += 5
      if (b.trending) score += 4
      if (lat && lng) {
        const d = haversine(lat, lng, b.lat, b.lng)
        score += Math.max(0, 25 - d)
      }
      return { ...b, _score: score }
    })
    .filter((b) => b._score > 0)
    .sort((a, b) => b._score - a._score)
    .slice(0, 20)

  // Build a short interpretation using simple rules
  const intentParts: string[] = []
  const ql = q.toLowerCase()
  if (ql.includes('hospital')) intentParts.push('hospitals')
  if (ql.includes('clinic')) intentParts.push('clinics')
  if (ql.includes('pharmac') || ql.includes('medicine') || ql.includes('insulin')) intentParts.push('pharmacies')
  if (ql.includes('manufactur') || ql.includes('mill') || ql.includes('machine')) intentParts.push('manufacturers & machinery')
  if (ql.includes('school') || ql.includes('cbse')) intentParts.push('schools')
  if (ql.includes('college')) intentParts.push('colleges')
  if (ql.includes('hotel')) intentParts.push('hotels')
  if (ql.includes('restaurant') || ql.includes('food')) intentParts.push('restaurants')
  if (ql.includes('wholesale')) intentParts.push('wholesalers')
  if (ql.includes('real estate') || ql.includes('property')) intentParts.push('real estate')
  if (ql.includes('car') || ql.includes('automotive') || ql.includes('service center')) intentParts.push('automotive')
  const nearMe = ql.includes('near me') || ql.includes('nearby') || ql.includes('around')
  const interpretation = intentParts.length
    ? `Showing ${intentParts.join(', ')}${nearMe ? ' near you' : ''} — ranked by relevance, verification and rating.`
    : `Showing matches for "${q}" — ranked by relevance.`

  return NextResponse.json({
    businesses: scored.map(({ productNames, serviceNames, ...b }) => b),
    interpretation,
    intent: nearMe ? 'near_me' : 'keyword',
    tokens: meaningful,
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
