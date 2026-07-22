import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession, isAdmin } from '@/lib/auth'

// GET — export businesses as CSV
export async function GET(req: NextRequest) {
  const user = await getSession(req)
  if (!user || !isAdmin(user)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { searchParams } = req.nextUrl
  const type = searchParams.get('type') || 'businesses'

  let csv = ''
  let filename = ''

  if (type === 'businesses') {
    const businesses = await db.business.findMany({
      include: { _count: { select: { products: true, reviews: true, enquiries: true } } },
      orderBy: { createdAt: 'desc' },
    })
    filename = 'businesses.csv'
    csv = 'Name,Category,Verified,Status,Rating,Reviews,Views,Products,Enquiries,Area,City,Email,Phone,CreatedAt\n'
    for (const b of businesses) {
      csv += `"${b.name}","${b.category}","${b.verified}","${b.status}",${b.rating},${b.reviewCount},${b.viewCount},${b._count.products},${b._count.enquiries},"${b.area}","${b.city}","${b.email}","${b.phone}","${b.createdAt.toISOString()}"\n`
    }
  } else if (type === 'users') {
    const users = await db.user.findMany({ orderBy: { createdAt: 'desc' } })
    filename = 'users.csv'
    csv = 'Name,Email,Role,Active,LastLogin,CreatedAt\n'
    for (const u of users) {
      csv += `"${u.name}","${u.email}","${u.role}",${u.active},"${u.lastLoginAt?.toISOString() || 'Never'}","${u.createdAt.toISOString()}"\n`
    }
  } else if (type === 'subscriptions') {
    const subs = await db.subscription.findMany({
      include: { business: { select: { name: true, email: true } } },
      orderBy: { createdAt: 'desc' },
    })
    filename = 'subscriptions.csv'
    csv = 'Business,Plan,Status,Amount,BillingCycle,StartDate,EndDate\n'
    for (const s of subs) {
      csv += `"${s.business?.name || 'Unknown'}","${s.plan}","${s.status}",${s.amount},"${s.billingCycle}","${s.startDate.toISOString()}","${s.endDate?.toISOString() || 'N/A'}"\n`
    }
  }

  const res = new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  })
  return res
}
