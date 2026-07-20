import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession, isAdmin } from '@/lib/auth'

export async function GET(req: NextRequest) {
  const user = await getSession(req)
  if (!user || !isAdmin(user)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { searchParams } = req.nextUrl
  const role = searchParams.get('role')
  const search = searchParams.get('q')

  const where: any = {}
  if (role && role !== 'all') where.role = role
  if (search) {
    where.OR = [
      { name: { contains: search } },
      { email: { contains: search } },
    ]
  }

  const users = await db.user.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: 100,
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      businessId: true,
      active: true,
      lastLoginAt: true,
      createdAt: true,
    },
  })

  return NextResponse.json({ users, total: users.length })
}

// PATCH — update user role or active status
export async function PATCH(req: NextRequest) {
  const user = await getSession(req)
  if (!user || !isAdmin(user)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await req.json()
  const { id, role, active } = body

  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

  const target = await db.user.findUnique({ where: { id } })
  if (!target) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  // Don't allow demoting the last super admin
  if (target.role === 'super_admin' && role && role !== 'super_admin') {
    const superAdminCount = await db.user.count({ where: { role: 'super_admin', active: true } })
    if (superAdminCount <= 1) {
      return NextResponse.json({ error: 'Cannot demote the last super admin' }, { status: 400 })
    }
  }

  const updates: any = {}
  if (role) updates.role = role
  if (active !== undefined) updates.active = active

  const updated = await db.user.update({ where: { id }, data: updates })

  await db.adminAction.create({
    data: {
      adminId: user.id,
      action: role ? 'user_role_change' : active !== undefined ? (active ? 'user_activate' : 'user_suspend') : 'user_update',
      targetType: 'user',
      targetId: id,
      metadata: JSON.stringify({ previous: { role: target.role, active: target.active }, new: updates }),
    },
  })

  return NextResponse.json({ user: { id: updated.id, email: updated.email, name: updated.name, role: updated.role, active: updated.active } })
}
