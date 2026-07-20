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

export async function POST(req: NextRequest) {
  const { messages, businessId } = await req.json().catch(() => ({ messages: [], businessId: null }))

  // Build context from the database
  const all = await db.business.findMany({
    include: { products: true, services: true },
    take: 30,
  })
  const parsed = all.map(parseBusinessLight)

  const directoryContext = parsed
    .map((b) => {
      const products = (all.find((x) => x.id === b.id)?.products || []).map((p: any) => p.name).join(', ')
      const services = (all.find((x) => x.id === b.id)?.services || []).map((s: any) => s.name).join(', ')
      return `• ${b.name} — ${b.tagline}. Category: ${b.category}. Verified: ${b.verified}. Rating: ${b.rating}/5 (${b.reviewCount} reviews). Area: ${b.area}. Products: ${products || 'n/a'}. Services: ${services || 'n/a'}.`
    })
    .join('\n')

  let businessContext = ''
  if (businessId) {
    const b = await db.business.findFirst({
      where: { OR: [{ id: businessId }, { slug: businessId }] },
      include: { products: true, services: true, reviews: { take: 5, orderBy: { createdAt: 'desc' } } },
    })
    if (b) {
      const pb = parseBusinessLight(b)
      businessContext = `\n\nThe user is currently viewing this business profile:\n${pb.name} — ${pb.tagline}\n${pb.description}\nCategory: ${pb.category} | Verified: ${pb.verified} | Rating: ${pb.rating}/5 (${pb.reviewCount} reviews)\nFacilities: ${pb.facilities.join(', ')}\nCertifications: ${pb.certifications.join(', ')}\nProducts: ${b.products.map((p) => p.name).join(', ')}\nServices: ${b.services.map((s) => s.name).join(', ')}`
    }
  }

  const systemPrompt = `You are Veridian Assistant, the AI discovery guide for the Veridian business discovery platform. You help users discover businesses, products, and services with concise, trustworthy, well-formatted answers.

Here is the live directory of businesses you can recommend from:
${directoryContext}${businessContext}

Guidelines:
- Be concise and scannable. Use short paragraphs and bullet points.
- Recommend specific businesses by name from the directory above. Never invent businesses.
- Mention verification level and rating when relevant to build trust.
- If the user asks for something not in the directory, say so honestly and suggest the closest matches.
- You may use markdown: **bold**, bullet lists, and short headings.
- Keep answers under 180 words unless the user asks for detail.
- Do not ask clarifying questions unless the query is truly ambiguous; make a best effort first.`

  try {
    const ZAI = (await import('z-ai-web-dev-sdk')).default
    const zai = await ZAI.create()
    const completion = await zai.chat.completions.create({
      messages: [
        { role: 'assistant', content: systemPrompt },
        ...messages.map((m: any) => ({ role: m.role, content: m.content })),
      ],
      thinking: { type: 'disabled' },
    })
    const reply = completion.choices[0]?.message?.content || 'I could not generate a response. Please try again.'
    return NextResponse.json({ reply })
  } catch (e: any) {
    return NextResponse.json(
      { reply: `I'm having trouble connecting right now. Meanwhile, you can browse the directory or try the search. (${e?.message || 'unknown error'})` },
      { status: 200 }
    )
  }
}
