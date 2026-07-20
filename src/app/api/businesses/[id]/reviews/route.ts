import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// POST a new review (with persistence)
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const body = await req.json().catch(() => ({}))

  const business = await db.business.findFirst({ where: { OR: [{ id }, { slug: id }] } })
  if (!business) return NextResponse.json({ error: 'Business not found' }, { status: 404 })

  const { authorName, rating, title, content, photos } = body as {
    authorName?: string
    rating?: number
    title?: string
    content?: string
    photos?: string[]
  }

  if (!authorName || !authorName.trim()) {
    return NextResponse.json({ error: 'Your name is required' }, { status: 400 })
  }
  const r = Number(rating)
  if (!r || r < 1 || r > 5) {
    return NextResponse.json({ error: 'Rating must be between 1 and 5' }, { status: 400 })
  }
  if (!content || !content.trim()) {
    return NextResponse.json({ error: 'Review content is required' }, { status: 400 })
  }

  const avatarSeed = authorName.trim().toLowerCase().replace(/\s+/g, '-')
  const review = await db.review.create({
    data: {
      businessId: business.id,
      authorName: authorName.trim().slice(0, 80),
      authorAvatar: `https://picsum.photos/seed/${encodeURIComponent(avatarSeed)}/100/100`,
      rating: r,
      title: (title || '').trim().slice(0, 120) || 'Review',
      content: content.trim().slice(0, 2000),
      photos: JSON.stringify((photos || []).slice(0, 4)),
      verified: false,
      helpful: 0,
      businessReply: null,
    },
  })

  // Recalculate aggregate rating + count
  const agg = await db.review.aggregate({
    where: { businessId: business.id },
    _avg: { rating: true },
    _count: { rating: true },
  })
  await db.business.update({
    where: { id: business.id },
    data: {
      rating: Math.round((agg._avg.rating || 0) * 10) / 10,
      reviewCount: agg._count.rating,
    },
  })

  return NextResponse.json({
    review: {
      ...review,
      photos: JSON.parse(review.photos),
    },
    rating: Math.round((agg._avg.rating || 0) * 10) / 10,
    reviewCount: agg._count.rating,
  })
}
