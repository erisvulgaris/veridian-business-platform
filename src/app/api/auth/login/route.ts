import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { verifyPassword, getSessionToken, SESSION_COOKIE_NAME, ensureDefaultAdmin } from '@/lib/auth'

export async function POST(req: NextRequest) {
  await ensureDefaultAdmin()
  const { email, password } = await req.json().catch(() => ({}))

  if (!email || !password) {
    return NextResponse.json({ error: 'Email and password are required' }, { status: 400 })
  }

  const user = await db.user.findFirst({ where: { email: email.toLowerCase().trim() } })
  if (!user || !user.active) {
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
  }

  if (!verifyPassword(password, user.passwordHash)) {
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
  }

  await db.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } })

  const sessionUser = {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    businessId: user.businessId,
    permissions: JSON.parse(user.permissions || '[]'),
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
