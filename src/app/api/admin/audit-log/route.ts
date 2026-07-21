import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession, isAdmin } from '@/lib/auth'

export async function GET(req: NextRequest) {
  const user = await getSession(req)
  if (!user || !isAdmin(user)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { searchParams } = req.nextUrl
  const limit = Number(searchParams.get('limit') || 50)
  const action = searchParams.get('action')

  const where: any = {}
  if (action && action !== 'all') {
    where.action = { contains: action }
  }

  const actions = await db.adminAction.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: Math.min(limit, 200),
    include: {
      admin: { select: { name: true, email: true, role: true } },
    },
  })

  return NextResponse.json({ actions, total: actions.length })
}
