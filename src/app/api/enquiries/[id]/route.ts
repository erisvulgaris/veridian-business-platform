import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// PATCH: update enquiry status (new | read | replied | closed)
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const { status } = await req.json().catch(() => ({}))
  const valid = ['new', 'read', 'replied', 'closed']
  if (!valid.includes(status)) {
    return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
  }
  const enquiry = await db.enquiry.update({
    where: { id },
    data: { status },
  })
  return NextResponse.json({ enquiry })
}
