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

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const business = await db.business.findFirst({
    where: { OR: [{ id }, { slug: id }] },
    include: { products: true, services: true, reviews: { take: 8, orderBy: { createdAt: 'desc' } } },
  })
  if (!business) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const b = parseBusinessLight(business)
  const reviews = business.reviews.map((r) => ({
    rating: r.rating,
    title: r.title,
    content: r.content,
    verified: r.verified,
  }))

  const prompt = `Summarize this business for a prospective customer in 3 short bullet points + a one-line verdict. Be specific and factual. Use the data below.

BUSINESS:
Name: ${b.name}
Tagline: ${b.tagline}
Category: ${b.category} (${b.subCategories.join(', ')})
Verified: ${b.verified}
Rating: ${b.rating}/5 (${b.reviewCount} reviews)
Founded: ${b.foundedYear} | Team: ${b.teamSize}
Area: ${b.area}, ${b.city}
Facilities: ${b.facilities.join(', ')}
Certifications: ${b.certifications.join(', ')}
Awards: ${b.awards.join(', ') || 'n/a'}
Products: ${business.products.map((p) => p.name).join(', ') || 'n/a'}
Services: ${business.services.map((s) => s.name).join(', ') || 'n/a'}

RECENT REVIEWS:
${reviews.map((r) => `(${r.rating}★, ${r.verified ? 'verified' : 'unverified'}) ${r.title}: ${r.content}`).join('\n')}

Format your answer strictly as:
• <bullet 1>
• <bullet 2>
• <bullet 3>
Verdict: <one line>`

  try {
    const ZAI = (await import('z-ai-web-dev-sdk')).default
    const zai = await ZAI.create()
    const completion = await zai.chat.completions.create({
      messages: [
        { role: 'assistant', content: 'You are a concise, trustworthy business summarizer for a discovery platform.' },
        { role: 'user', content: prompt },
      ],
      thinking: { type: 'disabled' },
    })
    const summary = completion.choices[0]?.message?.content || ''
    return NextResponse.json({ summary })
  } catch (e: any) {
    return NextResponse.json(
      { summary: `• ${b.tagline}\n• ${b.verified} business since ${b.foundedYear}, rated ${b.rating}/5 across ${b.reviewCount} reviews.\n• Located in ${b.area} with ${b.facilities.length} facilities and ${b.certifications.length} certifications.\nVerdict: A reliable ${b.category.toLowerCase()} option worth considering.` },
      { status: 200 }
    )
  }
}
