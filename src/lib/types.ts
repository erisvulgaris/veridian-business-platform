// Shared types for the Veridian business discovery platform

export type VerificationLevel = 'basic' | 'verified' | 'premium' | 'enterprise'

export interface BusinessHours {
  days: { day: string; open: string; close: string }[]
  openNow: boolean
}

export interface Business {
  id: string
  name: string
  slug: string
  tagline: string
  description: string
  logo: string
  coverImage: string
  gallery: string[]
  category: string
  subCategories: string[]
  verified: VerificationLevel
  rating: number
  reviewCount: number
  lat: number
  lng: number
  address: string
  area: string
  city: string
  state: string
  pincode: string
  phone: string
  email: string
  website: string
  whatsapp?: string | null
  hours: BusinessHours
  isOpen: boolean
  foundedYear: number
  teamSize: string
  languages: string[]
  paymentMethods: string[]
  facilities: string[]
  deliveryOptions: string[]
  social: { instagram?: string; linkedin?: string; twitter?: string }
  certifications: string[]
  awards: string[]
  viewCount: number
  responseTime: string
  trending: boolean
  featured: boolean
  recentlyVerified: boolean
  promotion?: { title: string; description: string; expires: string } | null
  announcement?: { title: string; body: string; date: string } | null
  brandColor: string
  createdAt: string
  _count?: { products: number; services: number; reviews: number }
}

export interface Product {
  id: string
  businessId: string
  business?: Business
  name: string
  slug: string
  description: string
  images: string[]
  category: string
  brand: string
  priceMin: number
  priceMax: number
  currency: string
  variants: string[]
  specifications: { label: string; value: string }[]
  availability: 'in_stock' | 'low_stock' | 'preorder' | 'out_of_stock' | 'made_to_order'
  documents: string[]
  faqs: { q: string; a: string }[]
  featured: boolean
  viewCount: number
}

export interface Service {
  id: string
  businessId: string
  business?: Business
  name: string
  slug: string
  description: string
  pricing: string
  duration: string
  coverageArea: string
  requirements: string[]
  deliverables: string[]
  photos: string[]
  faqs: { q: string; a: string }[]
}

export interface Review {
  id: string
  businessId: string
  authorName: string
  authorAvatar: string
  rating: number
  title: string
  content: string
  photos: string[]
  verified: boolean
  helpful: number
  businessReply?: string | null
  createdAt: string
}

export interface Category {
  id: string
  name: string
  slug: string
  icon: string
  color: string
  count: number
}

export const VERIFICATION_CONFIG: Record<
  VerificationLevel,
  { label: string; color: string; bg: string; description: string; icon: string }
> = {
  basic: {
    label: 'Listed',
    color: '#64748b',
    bg: 'rgba(100,116,139,0.12)',
    description: 'Basic business listing',
    icon: 'Circle',
  },
  verified: {
    label: 'Verified',
    color: '#0f766e',
    bg: 'rgba(15,118,110,0.12)',
    description: 'Phone & documents verified',
    icon: 'BadgeCheck',
  },
  premium: {
    label: 'Premium Verified',
    color: '#b45309',
    bg: 'rgba(180,83,9,0.12)',
    description: 'Verified + premises audited',
    icon: 'ShieldCheck',
  },
  enterprise: {
    label: 'Enterprise Verified',
    color: '#7c3aed',
    bg: 'rgba(124,58,237,0.12)',
    description: 'Full enterprise due diligence',
    icon: 'Crown',
  },
}

export function formatPrice(min: number, max: number, currency = 'INR'): string {
  const sym = currency === 'INR' ? '₹' : currency === 'USD' ? '$' : ''
  const fmt = (n: number) => {
    if (n >= 10000000) return `${sym}${(n / 10000000).toFixed(2)} Cr`
    if (n >= 100000) return `${sym}${(n / 100000).toFixed(2)} L`
    if (n >= 1000) return `${sym}${(n / 1000).toFixed(1)}k`
    return `${sym}${n}`
  }
  if (max === 0 || min === max) return fmt(min)
  return `${fmt(min)} – ${fmt(max)}`
}

export function formatNumber(n: number): string {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`
  return String(n)
}

export function timeAgo(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date
  const seconds = Math.floor((Date.now() - d.getTime()) / 1000)
  if (seconds < 60) return 'just now'
  const mins = Math.floor(seconds / 60)
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days < 30) return `${days}d ago`
  const months = Math.floor(days / 30)
  if (months < 12) return `${months}mo ago`
  return `${Math.floor(months / 12)}y ago`
}
