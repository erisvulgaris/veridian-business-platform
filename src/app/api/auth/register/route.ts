import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { hashPassword, getSessionToken, SESSION_COOKIE_NAME } from '@/lib/auth'

export async function POST(req: NextRequest) {
  const { email, password, name, role } = await req.json().catch(() => ({}))

  if (!email || !password || !name) {
    return NextResponse.json({ error: 'Name, email and password are required' }, { status: 400 })
  }

  const existing = await db.user.findFirst({ where: { email: email.toLowerCase().trim() } })
  if (existing) {
    return NextResponse.json({ error: 'Email already registered' }, { status: 409 })
  }

  // Only allow customer or owner registration via this endpoint
  const assignedRole = role === 'owner' ? 'owner' : 'customer'

  const user = await db.user.create({
    data: {
      email: email.toLowerCase().trim(),
      name: name.trim(),
      passwordHash: hashPassword(password),
      role: assignedRole,
      permissions: '[]',
    },
  })

  const sessionUser = {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    businessId: user.businessId,
    permissions: [],
  }

  const token = getSessionToken(sessionUser)
  const res = NextResponse.json({ user: sessionUser })
  res.cookies.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60,
    path: '/',
  })

  return res
}
