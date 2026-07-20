import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// PATCH: mark a review as helpful (increments helpful count)
export async function PATCH(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const review = await db.review.update({
    where: { id },
    data: { helpful: { increment: 1 } },
  })
  return NextResponse.json({ helpful: review.helpful })
}
