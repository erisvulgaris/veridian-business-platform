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

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const category = searchParams.get('category')
  const trending = searchParams.get('trending')
  const featured = searchParams.get('featured')
  const recentlyVerified = searchParams.get('recentlyVerified')
  const openNow = searchParams.get('openNow')
  const verifiedOnly = searchParams.get('verifiedOnly')
  const minRating = Number(searchParams.get('minRating') || 0)
  const lat = Number(searchParams.get('lat') || 0)
  const lng = Number(searchParams.get('lng') || 0)
  const limit = Number(searchParams.get('limit') || 50)
  const bounds = searchParams.get('bounds') // "minLat,minLng,maxLat,maxLng"

  const where: any = {}
  if (category && category !== 'all') {
    const cats = category.split(',')
    where.category = { in: cats }
  }
  if (trending === 'true') where.trending = true
  if (featured === 'true') where.featured = true
  if (recentlyVerified === 'true') where.recentlyVerified = true
  if (openNow === 'true') where.isOpen = true
  if (verifiedOnly === 'true') where.verified = { not: 'basic' }
  if (minRating > 0) where.rating = { gte: minRating }

  if (bounds) {
    const [minLat, minLng, maxLat, maxLng] = bounds.split(',').map(Number)
    where.AND = [
      { lat: { gte: minLat } },
      { lat: { lte: maxLat } },
      { lng: { gte: minLng } },
      { lng: { lte: maxLng } },
    ]
  }

  const businesses = await db.business.findMany({
    where,
    include: { _count: { select: { products: true, services: true, reviews: true } } },
    orderBy: { featured: 'desc' },
    take: limit,
  })

  let result = businesses.map(parseBusiness)

  // Sort by distance if lat/lng provided
  if (lat && lng) {
    result = result
      .map((b) => ({
        ...b,
        _distance: haversine(lat, lng, b.lat, b.lng),
      }))
      .sort((a, b) => (a._distance || 0) - (b._distance || 0))
  }

  return NextResponse.json({ businesses: result, total: result.length })
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
