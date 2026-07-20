import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET: list all message threads for a business (grouped by threadId)
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const business = await db.business.findFirst({ where: { OR: [{ id }, { slug: id }] } })
  if (!business) return NextResponse.json({ error: 'Business not found' }, { status: 404 })

  const messages = await db.message.findMany({
    where: { businessId: business.id },
    orderBy: { createdAt: 'desc' },
    take: 200,
  })

  // Group by threadId
  const threadsMap = new Map<string, {
    threadId: string
    customerName: string
    customerEmail: string
    lastMessage: string
    lastAt: Date
    unread: number
    count: number
  }>()

  for (const m of messages) {
    let t = threadsMap.get(m.threadId)
    if (!t) {
      t = {
        threadId: m.threadId,
        customerName: m.senderRole === 'customer' ? m.senderName : m.senderName,
        customerEmail: m.senderEmail,
        lastMessage: m.content,
        lastAt: m.createdAt,
        unread: 0,
        count: 0,
      }
      threadsMap.set(m.threadId, t)
    }
    t.count++
    if (m.createdAt > t.lastAt) {
      t.lastMessage = m.content
      t.lastAt = m.createdAt
      if (m.senderRole === 'customer') {
        t.customerName = m.senderName
        t.customerEmail = m.senderEmail
      }
    }
    if (m.senderRole === 'customer' && !m.read) t.unread++
  }

  const threads = Array.from(threadsMap.values()).sort((a, b) => b.lastAt.getTime() - a.lastAt.getTime())

  return NextResponse.json({ threads, total: threads.length })
}

// POST: send a new message (creates a thread if none, or appends to existing)
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const body = await req.json().catch(() => ({}))
  const business = await db.business.findFirst({ where: { OR: [{ id }, { slug: id }] } })
  if (!business) return NextResponse.json({ error: 'Business not found' }, { status: 404 })

  const { senderName, senderEmail, content, threadId, senderRole } = body as {
    senderName?: string
    senderEmail?: string
    content?: string
    threadId?: string
    senderRole?: string
  }

  if (!senderName?.trim()) return NextResponse.json({ error: 'Name is required' }, { status: 400 })
  if (!senderEmail?.trim() || !/^[^@]+@[^@]+\.[^@]+$/.test(senderEmail)) return NextResponse.json({ error: 'Valid email is required' }, { status: 400 })
  if (!content?.trim()) return NextResponse.json({ error: 'Message is required' }, { status: 400 })

  const role = senderRole === 'business' ? 'business' : 'customer'
  const tid = threadId || `thread_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`

  const message = await db.message.create({
    data: {
      businessId: business.id,
      threadId: tid,
      senderName: senderName.trim().slice(0, 100),
      senderEmail: senderEmail.trim().slice(0, 120),
      senderRole: role,
      content: content.trim().slice(0, 2000),
      read: role === 'business', // business-sent messages are auto-read
    },
  })

  return NextResponse.json({ message, threadId: tid })
}
