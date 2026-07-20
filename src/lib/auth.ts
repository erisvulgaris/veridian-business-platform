import { db } from './db'

export interface SessionUser {
  id: string
  email: string
  name: string
  role: string
  businessId?: string | null
  permissions: string[]
}

// Simple session management using signed cookies
// In production, use NextAuth.js or a more robust session store

const SESSION_COOKIE = 'veridian_session'
const SESSION_SECRET = process.env.SESSION_SECRET || 'veridian-dev-secret-change-in-production'

// Simple base64 encoding for session token (not cryptographically secure — use JWT in production)
function encodeSession(user: SessionUser): string {
  const payload = JSON.stringify({ ...user, exp: Date.now() + 7 * 24 * 60 * 60 * 1000 })
  return Buffer.from(payload).toString('base64url')
}

export function decodeSession(token: string): SessionUser | null {
  try {
    const payload = JSON.parse(Buffer.from(token, 'base64url').toString())
    if (payload.exp && payload.exp < Date.now()) return null
    return payload as SessionUser
  } catch {
    return null
  }
}

export function getSessionToken(user: SessionUser): string {
  return encodeSession(user)
}

export const SESSION_COOKIE_NAME = SESSION_COOKIE

// Password hashing (simple SHA-256 — use bcrypt in production)
import { createHash } from 'crypto'

export function hashPassword(password: string): string {
  return createHash('sha256').update(password + SESSION_SECRET).digest('hex')
}

export function verifyPassword(password: string, hash: string): boolean {
  return hashPassword(password) === hash
}

// Role checking helpers
export function hasRole(user: SessionUser | null, ...roles: string[]): boolean {
  if (!user) return false
  return roles.includes(user.role)
}

export function isAdmin(user: SessionUser | null): boolean {
  return hasRole(user, 'super_admin', 'admin')
}

export function isSuperAdmin(user: SessionUser | null): boolean {
  return hasRole(user, 'super_admin')
}

export function isOwner(user: SessionUser | null): boolean {
  return hasRole(user, 'owner')
}

export function canManageBusiness(user: SessionUser | null, businessId: string): boolean {
  if (!user) return false
  if (isAdmin(user)) return true
  if (user.role === 'owner' && user.businessId === businessId) return true
  if (user.role === 'staff' && user.businessId === businessId) return true
  return false
}

// Get session from request cookies (for API routes)
export async function getSession(request: Request): Promise<SessionUser | null> {
  const cookieHeader = request.headers.get('cookie') || ''
  const cookies = Object.fromEntries(
    cookieHeader.split(';').map(c => {
      const [k, ...v] = c.trim().split('=')
      return [k, v.join('=')]
    })
  )
  const token = cookies[SESSION_COOKIE]
  if (!token) return null
  return decodeSession(token)
}

// Create default super admin on first run
export async function ensureDefaultAdmin() {
  const existing = await db.user.findFirst({ where: { role: 'super_admin' } })
  if (existing) return
  await db.user.create({
    data: {
      email: 'admin@veridian.app',
      name: 'Super Admin',
      passwordHash: hashPassword('admin123'),
      role: 'super_admin',
      permissions: JSON.stringify(['*']),
    },
  })
  console.log('Default super admin created: admin@veridian.app / admin123')
}
