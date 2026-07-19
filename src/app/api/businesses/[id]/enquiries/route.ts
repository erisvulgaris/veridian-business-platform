import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// POST: create a new enquiry / RFQ for a business
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const body = await req.json().catch(() => ({}))

  const business = await db.business.findFirst({ where: { OR: [{ id }, { slug: id }] } })
  if (!business) return NextResponse.json({ error: 'Business not found' }, { status: 404 })

  const {
    customerName, customerEmail, customerPhone, company,
    subject, message, productId, serviceName, quantity, budget, timeline,
  } = body as Record<string, string | undefined>

  if (!customerName?.trim()) return NextResponse.json({ error: 'Your name is required' }, { status: 400 })
  if (!customerEmail?.trim()) return NextResponse.json({ error: 'Email is required' }, { status: 400 })
  if (!message?.trim()) return NextResponse.json({ error: 'Message is required' }, { status: 400 })

  const enquiry = await db.enquiry.create({
    data: {
      businessId: business.id,
      customerName: customerName.trim().slice(0, 100),
      customerEmail: customerEmail.trim().slice(0, 120),
      customerPhone: customerPhone?.trim().slice(0, 30) || null,
      company: company?.trim().slice(0, 120) || null,
      subject: (subject || `Enquiry for ${business.name}`).trim().slice(0, 200),
      message: message.trim().slice(0, 3000),
      productId: productId || null,
      serviceName: serviceName || null,
      quantity: quantity?.trim().slice(0, 100) || null,
      budget: budget?.trim().slice(0, 100) || null,
      timeline: timeline?.trim().slice(0, 100) || null,
      status: 'new',
    },
  })

  return NextResponse.json({ enquiry, ok: true })
}

// GET: list enquiries for a business (dashboard inbox)
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const business = await db.business.findFirst({ where: { OR: [{ id }, { slug: id }] } })
  if (!business) return NextResponse.json({ error: 'Business not found' }, { status: 404 })

  const enquiries = await db.enquiry.findMany({
    where: { businessId: business.id },
    orderBy: { createdAt: 'desc' },
    take: 50,
  })
  return NextResponse.json({ enquiries, total: enquiries.length })
}
