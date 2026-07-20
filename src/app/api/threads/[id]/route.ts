import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET: get all messages in a thread
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const messages = await db.message.findMany({
    where: { threadId: id },
    orderBy: { createdAt: 'asc' },
    take: 100,
  })
  // Mark customer messages as read
  await db.message.updateMany({
    where: { threadId: id, senderRole: 'customer', read: false },
    data: { read: true },
  })
  return NextResponse.json({ messages })
}

// POST: reply in an existing thread
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const body = await req.json().catch(() => ({}))
  const { senderName, senderEmail, content, senderRole } = body as {
    senderName?: string
    senderEmail?: string
    content?: string
    senderRole?: string
  }

  if (!content?.trim()) return NextResponse.json({ error: 'Message is required' }, { status: 400 })

  // Find the business from the thread
  const existing = await db.message.findFirst({ where: { threadId: id } })
  if (!existing) return NextResponse.json({ error: 'Thread not found' }, { status: 404 })

  const role = senderRole === 'customer' ? 'customer' : 'business'
  const message = await db.message.create({
    data: {
      businessId: existing.businessId,
      threadId: id,
      senderName: (senderName || existing.senderName).trim().slice(0, 100),
      senderEmail: (senderEmail || existing.senderEmail).trim().slice(0, 120),
      senderRole: role,
      content: content.trim().slice(0, 2000),
      read: role === 'business',
    },
  })

  return NextResponse.json({ message })
}
