import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession, isSuperAdmin } from '@/lib/auth'

// GET platform settings (categories list)
export async function GET(req: NextRequest) {
  const user = await getSession(req)
  if (!user || !['super_admin', 'admin'].includes(user.role)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const categories = await db.category.findMany({ orderBy: { name: 'asc' } })
  return NextResponse.json({ categories })
}

// POST/PUT — create a new category
export async function POST(req: NextRequest) {
  const user = await getSession(req)
  if (!user || !isSuperAdmin(user)) return NextResponse.json({ error: 'Super admin only' }, { status: 403 })

  const { name, slug, icon, color } = await req.json()
  if (!name || !slug) return NextResponse.json({ error: 'name and slug required' }, { status: 400 })

  const existing = await db.category.findFirst({ where: { OR: [{ name }, { slug }] } })
  if (existing) return NextResponse.json({ error: 'Category already exists' }, { status: 409 })

  const category = await db.category.create({
    data: { name, slug, icon: icon || 'Package', color: color || '#0f766e', count: 0 },
  })
  return NextResponse.json({ category })
}

// PATCH — update a category
export async function PATCH(req: NextRequest) {
  const user = await getSession(req)
  if (!user || !isSuperAdmin(user)) return NextResponse.json({ error: 'Super admin only' }, { status: 403 })

  const { id, name, slug, icon, color } = await req.json()
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

  const updates: any = {}
  if (name) updates.name = name
  if (slug) updates.slug = slug
  if (icon) updates.icon = icon
  if (color) updates.color = color

  const category = await db.category.update({ where: { id }, data: updates })
  return NextResponse.json({ category })
}

// DELETE — delete a category
export async function DELETE(req: NextRequest) {
  const user = await getSession(req)
  if (!user || !isSuperAdmin(user)) return NextResponse.json({ error: 'Super admin only' }, { status: 403 })

  const { searchParams } = req.nextUrl
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

  await db.category.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
