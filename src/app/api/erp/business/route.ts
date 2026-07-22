import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession, canManageBusiness } from '@/lib/auth'

// GET business for editing (owner/admin)
export async function GET(req: NextRequest) {
  const user = await getSession(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = req.nextUrl
  const businessId = searchParams.get('businessId')
  if (!businessId) return NextResponse.json({ error: 'businessId required' }, { status: 400 })
  if (!canManageBusiness(user, businessId)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const business = await db.business.findFirst({ where: { OR: [{ id: businessId }, { slug: businessId }] } })
  if (!business) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  return NextResponse.json({
    business: {
      ...business,
      gallery: JSON.parse(business.gallery || '[]'),
      subCategories: JSON.parse(business.subCategories || '[]'),
      hours: JSON.parse(business.hours || '{}'),
      languages: JSON.parse(business.languages || '[]'),
      paymentMethods: JSON.parse(business.paymentMethods || '[]'),
      facilities: JSON.parse(business.facilities || '[]'),
      deliveryOptions: JSON.parse(business.deliveryOptions || '[]'),
      social: JSON.parse(business.social || '{}'),
      certifications: JSON.parse(business.certifications || '[]'),
      awards: JSON.parse(business.awards || '[]'),
    },
  })
}

// PATCH update business profile
export async function PATCH(req: NextRequest) {
  const user = await getSession(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { businessId, ...fields } = body

  if (!businessId) return NextResponse.json({ error: 'businessId required' }, { status: 400 })
  if (!canManageBusiness(user, businessId)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const business = await db.business.findFirst({ where: { OR: [{ id: businessId }, { slug: businessId }] } })
  if (!business) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const updates: any = {}
  const allowedFields = [
    'name', 'tagline', 'description', 'logo', 'coverImage',
    'phone', 'email', 'website', 'whatsapp',
    'address', 'area', 'city', 'state', 'pincode',
    'foundedYear', 'teamSize', 'responseTime', 'brandColor',
  ]
  for (const field of allowedFields) {
    if (fields[field] !== undefined) updates[field] = fields[field]
  }

  // JSON fields
  if (fields.subCategories) updates.subCategories = JSON.stringify(fields.subCategories)
  if (fields.hours) updates.hours = JSON.stringify(fields.hours)
  if (fields.languages) updates.languages = JSON.stringify(fields.languages)
  if (fields.paymentMethods) updates.paymentMethods = JSON.stringify(fields.paymentMethods)
  if (fields.facilities) updates.facilities = JSON.stringify(fields.facilities)
  if (fields.deliveryOptions) updates.deliveryOptions = JSON.stringify(fields.deliveryOptions)
  if (fields.social) updates.social = JSON.stringify(fields.social)
  if (fields.certifications) updates.certifications = JSON.stringify(fields.certifications)
  if (fields.awards) updates.awards = JSON.stringify(fields.awards)
  if (fields.gallery) updates.gallery = JSON.stringify(fields.gallery)
  if (fields.promotion !== undefined) updates.promotion = fields.promotion ? JSON.stringify(fields.promotion) : null
  if (fields.announcement !== undefined) updates.announcement = fields.announcement ? JSON.stringify(fields.announcement) : null

  const updated = await db.business.update({ where: { id: business.id }, data: updates })

  return NextResponse.json({ business: updated })
}
