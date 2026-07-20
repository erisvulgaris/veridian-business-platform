import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// POST: submit a claim request for a business
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const body = await req.json().catch(() => ({}))

  const business = await db.business.findFirst({ where: { OR: [{ id }, { slug: id }] } })
  if (!business) return NextResponse.json({ error: 'Business not found' }, { status: 404 })

  const {
    claimerName, claimerEmail, claimerPhone, role, proof,
  } = body as Record<string, string | undefined>

  if (!claimerName?.trim()) return NextResponse.json({ error: 'Your name is required' }, { status: 400 })
  if (!claimerEmail?.trim() || !/^[^@]+@[^@]+\.[^@]+$/.test(claimerEmail)) return NextResponse.json({ error: 'Valid email is required' }, { status: 400 })
  if (!role?.trim()) return NextResponse.json({ error: 'Your role is required' }, { status: 400 })

  // In a real app, this would create a Claim record for review.
  // For now, we just validate and return success — the business stays unclaimed until an admin approves.
  return NextResponse.json({
    ok: true,
    message: `Claim request received for ${business.name}. Our team will verify and contact you within 48 hours.`,
    claim: {
      businessId: business.id,
      businessName: business.name,
      claimerName: claimerName.trim(),
      claimerEmail: claimerEmail.trim(),
      role: role.trim(),
      submittedAt: new Date().toISOString(),
    },
  })
}
