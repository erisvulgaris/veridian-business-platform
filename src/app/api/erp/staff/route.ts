import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession, canManageBusiness } from '@/lib/auth'

export async function GET(req: NextRequest) {
  const user = await getSession(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = req.nextUrl
  const businessId = searchParams.get('businessId')
  if (!businessId) return NextResponse.json({ error: 'businessId required' }, { status: 400 })
  if (!canManageBusiness(user, businessId)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const staff = await db.staff.findMany({
    where: { businessId },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json({ staff })
}

export async function POST(req: NextRequest) {
  const user = await getSession(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { businessId, name, email, role, permissions } = body

  if (!businessId || !name || !email) {
    return NextResponse.json({ error: 'businessId, name, email required' }, { status: 400 })
  }
  if (!canManageBusiness(user, businessId)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const staff = await db.staff.create({
    data: {
      businessId,
      name,
      email,
      role: role || 'staff',
      permissions: JSON.stringify(permissions || []),
    },
  })

  return NextResponse.json({ staff })
}

export async function PATCH(req: NextRequest) {
  const user = await getSession(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { id, active, role, permissions } = body

  const staff = await db.staff.findUnique({ where: { id } })
  if (!staff) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (!canManageBusiness(user, staff.businessId)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const updated = await db.staff.update({
    where: { id },
    data: {
      ...(active !== undefined && { active }),
      ...(role && { role }),
      ...(permissions && { permissions: JSON.stringify(permissions) }),
    },
  })

  return NextResponse.json({ staff: updated })
}
