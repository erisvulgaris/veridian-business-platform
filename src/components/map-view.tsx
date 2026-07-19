'use client'

import * as React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MapPin, Star, Plus, Minus, Locate, Layers, Compass, Crosshair, Loader2 } from 'lucide-react'
import type { Business, VerificationLevel } from '@/lib/types'
import { VERIFICATION_CONFIG, formatNumber } from '@/lib/types'
import { useAppStore } from '@/lib/store'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

interface MapViewProps {
  businesses: Business[]
  className?: string
}

const CENTER = { lat: 28.6139, lng: 77.209 }

// Project lat/lng → x/y in world coordinates (degrees * scale)
const SCALE = 8000
function project(lat: number, lng: number) {
  return {
    x: (lng - CENTER.lng) * SCALE,
    y: -(lat - CENTER.lat) * SCALE,
  }
}

export function MapView({ businesses, className }: MapViewProps) {
  const { selectedBusinessId, hoveredBusinessId, selectBusiness, hoverBusiness, mapZoom, setMapZoom, setMapCenter, mapCenter } = useAppStore()
  const [offset, setOffset] = React.useState({ x: 0, y: 0 })
  const [dragging, setDragging] = React.useState(false)
  const dragStart = React.useRef({ x: 0, y: 0, ox: 0, oy: 0 })
  const containerRef = React.useRef<HTMLDivElement>(null)
  const [size, setSize] = React.useState({ w: 800, h: 600 })

  React.useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const ro = new ResizeObserver(() => {
      setSize({ w: el.clientWidth, h: el.clientHeight })
    })
    ro.observe(el)
    setSize({ w: el.clientWidth, h: el.clientHeight })
    return () => ro.disconnect()
  }, [])

  // Convert business world coords to screen coords
  const toScreen = React.useCallback(
    (lat: number, lng: number) => {
      const p = project(lat, lng)
      return {
        x: size.w / 2 + (p.x - mapCenter.lng * SCALE) * mapZoom + offset.x,
        y: size.h / 2 + (p.y + mapCenter.lat * SCALE) * mapZoom + offset.y,
      }
    },
    [size, mapZoom, offset, mapCenter]
  )

  // Clustering: group pins that are too close on screen
  const clusters = React.useMemo(() => {
    const threshold = 44
    const groups: { lat: number; lng: number; items: Business[]; x: number; y: number }[] = []
    for (const b of businesses) {
      const s = toScreen(b.lat, b.lng)
      const g = groups.find((grp) => Math.abs(grp.x - s.x) < threshold && Math.abs(grp.y - s.y) < threshold)
      if (g) {
        g.items.push(b)
      } else {
        groups.push({ lat: b.lat, lng: b.lng, items: [b], x: s.x, y: s.y })
      }
    }
    return groups
  }, [businesses, toScreen])

  const handlePointerDown = (e: React.PointerEvent) => {
    if ((e.target as HTMLElement).closest('[data-pin]')) return
    setDragging(true)
    dragStart.current = { x: e.clientX, y: e.clientY, ox: offset.x, oy: offset.y }
    ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
  }
  const handlePointerMove = (e: React.PointerEvent) => {
    if (!dragging) return
    setOffset({
      x: dragStart.current.ox + (e.clientX - dragStart.current.x),
      y: dragStart.current.oy + (e.clientY - dragStart.current.y),
    })
  }
  const handlePointerUp = (e: React.PointerEvent) => {
    setDragging(false)
    try { (e.target as HTMLElement).releasePointerCapture(e.pointerId) } catch {}
  }

  const zoomBy = (factor: number) => {
    setMapZoom(Math.min(Math.max(mapZoom * factor, 0.4), 6))
  }

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault()
    zoomBy(e.deltaY < 0 ? 1.12 : 0.89)
  }

  const recenter = () => {
    setOffset({ x: 0, y: 0 })
    setMapCenter({ lat: CENTER.lat, lng: CENTER.lng })
    setMapZoom(1)
  }

  const [locating, setLocating] = React.useState(false)
  const [userLocation, setUserLocation] = React.useState<{ lat: number; lng: number } | null>(null)

  const findNearMe = () => {
    if (!('geolocation' in navigator)) {
      toast('Geolocation is not supported on this device', { description: 'Try searching by area instead.' })
      return
    }
    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords
        setUserLocation({ lat: latitude, lng: longitude })
        setOffset({ x: 0, y: 0 })
        setMapCenter({ lat: latitude, lng: longitude })
        setMapZoom(1.8)
        setLocating(false)
        toast.success('Centered on your location')
      },
      (err) => {
        setLocating(false)
        toast('Could not access your location', { description: err.message || 'Permission denied. Using default center.' })
      },
      { enableHighAccuracy: true, timeout: 8000 }
    )
  }

  return (
    <div
      ref={containerRef}
      className={cn('relative overflow-hidden touch-none select-none cursor-grab active:cursor-grabbing', className)}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onWheel={handleWheel}
    >
      {/* Stylized map background */}
      <MapBackground width={size.w} height={size.h} offsetX={offset.x} offsetY={offset.y} zoom={mapZoom} />

      {/* Decorative district labels that pan with the map */}
      <DistrictLabels toScreen={toScreen} />

      {/* Pins / Clusters */}
      <div className="absolute inset-0 pointer-events-none">
        {clusters.map((c, i) => {
          if (c.items.length > 1) {
            return (
              <button
                key={i}
                data-pin
                className="absolute pointer-events-auto -translate-x-1/2 -translate-y-1/2 cursor-pointer"
                style={{ left: c.x, top: c.y }}
                onClick={() => {
                  setMapZoom(Math.min(mapZoom * 1.6, 6))
                  setMapCenter({ lat: c.lat, lng: c.lng })
                  setOffset({ x: 0, y: 0 })
                }}
              >
                <div className="relative flex h-11 w-11 items-center justify-center rounded-full bg-foreground text-background shadow-lg ring-2 ring-background text-xs font-semibold">
                  {c.items.length}
                </div>
              </button>
            )
          }
          const b = c.items[0]
          const isSelected = selectedBusinessId === b.id
          const isHovered = hoveredBusinessId === b.id
          return (
            <MapPinMarker
              key={b.id}
              business={b}
              x={c.x}
              y={c.y}
              isSelected={isSelected}
              isHovered={isHovered}
              onClick={() => selectBusiness(b.id)}
              onHover={(h) => hoverBusiness(h ? b.id : null)}
            />
          )
        })}
      </div>

      {/* Hover tooltip */}
      <AnimatePresence>
        {hoveredBusinessId && hoveredBusinessId !== selectedBusinessId && (
          <HoverTooltip business={businesses.find((b) => b.id === hoveredBusinessId)!} toScreen={toScreen} />
        )}
      </AnimatePresence>

      {/* Controls */}
      <div className="absolute right-3 top-3 flex flex-col gap-2">
        <button
          onClick={() => zoomBy(1.2)}
          className="glass card-elevated flex h-10 w-10 items-center justify-center rounded-xl text-foreground hover:bg-accent transition"
          aria-label="Zoom in"
        >
          <Plus className="h-4 w-4" />
        </button>
        <button
          onClick={() => zoomBy(0.83)}
          className="glass card-elevated flex h-10 w-10 items-center justify-center rounded-xl text-foreground hover:bg-accent transition"
          aria-label="Zoom out"
        >
          <Minus className="h-4 w-4" />
        </button>
        <button
          onClick={findNearMe}
          disabled={locating}
          className="glass card-elevated flex h-10 w-10 items-center justify-center rounded-xl text-primary hover:bg-accent transition disabled:opacity-60"
          aria-label="Find businesses near me"
          title="Find businesses near me"
        >
          {locating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Crosshair className="h-4 w-4" />}
        </button>
        <button
          onClick={recenter}
          className="glass card-elevated flex h-10 w-10 items-center justify-center rounded-xl text-foreground hover:bg-accent transition"
          aria-label="Recenter"
        >
          <Locate className="h-4 w-4" />
        </button>
      </div>

      {/* User location pin */}
      {userLocation && (
        <div
          className="absolute pointer-events-none -translate-x-1/2 -translate-y-1/2 z-30"
          style={{ left: toScreen(userLocation.lat, userLocation.lng).x, top: toScreen(userLocation.lat, userLocation.lng).y }}
        >
          <div className="relative flex items-center justify-center">
            <span className="absolute h-8 w-8 rounded-full bg-blue-500/20 animate-ping" />
            <span className="h-4 w-4 rounded-full bg-blue-500 ring-4 ring-white shadow-lg" />
          </div>
        </div>
      )}

      {/* Legend / map meta */}
      <div className="absolute left-3 bottom-3 glass card-elevated rounded-xl px-3 py-2 text-[11px] text-muted-foreground flex items-center gap-2">
        <Compass className="h-3.5 w-3.5" />
        <span className="font-medium text-foreground">Meridian City</span>
        <span>·</span>
        <span>{businesses.length} places</span>
        <span>·</span>
        <span>Zoom {mapZoom.toFixed(1)}×</span>
      </div>
    </div>
  )
}

function MapPinMarker({
  business: b,
  x,
  y,
  isSelected,
  isHovered,
  onClick,
  onHover,
}: {
  business: Business
  x: number
  y: number
  isSelected: boolean
  isHovered: boolean
  onClick: () => void
  onHover: (h: boolean) => void
}) {
  const cfg = VERIFICATION_CONFIG[b.verified as VerificationLevel]
  const elevated = isSelected || isHovered
  return (
    <button
      data-pin
      className="absolute pointer-events-auto group"
      style={{ left: x, top: y, transform: 'translate(-50%, -100%)', zIndex: elevated ? 50 : 10 }}
      onClick={(e) => {
        e.stopPropagation()
        onClick()
      }}
      onPointerEnter={() => onHover(true)}
      onPointerLeave={() => onHover(false)}
    >
      <motion.div
        animate={{ scale: elevated ? 1.18 : 1, y: elevated ? -4 : 0 }}
        transition={{ type: 'spring', stiffness: 400, damping: 28 }}
        className="relative flex flex-col items-center"
      >
        {/* Pulse for trending & open */}
        {b.trending && b.isOpen && (
          <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 h-3 w-3 rounded-full pin-pulse" style={{ color: b.brandColor }} />
        )}
        {/* Pin body */}
        <div
          className="relative flex items-center justify-center rounded-full shadow-lg ring-2 ring-white/80 transition-all"
          style={{
            width: elevated ? 38 : 32,
            height: elevated ? 38 : 32,
            background: b.brandColor,
          }}
        >
          <span className="text-[10px] font-bold text-white leading-none">
            {b.rating.toFixed(1)}
          </span>
          {/* Verification dot */}
          <span
            className="absolute -right-0.5 -top-0.5 h-3 w-3 rounded-full border-2 border-white"
            style={{ background: cfg.color }}
            title={cfg.label}
          />
        </div>
        {/* Pointer */}
        <div
          className="h-2.5 w-2.5 -mt-1.5 rotate-45"
          style={{ background: b.brandColor, boxShadow: '1px 1px 2px rgba(0,0,0,0.2)' }}
        />
        {/* Open/closed indicator */}
        {!b.isOpen && (
          <span className="absolute top-1/2 left-full ml-1 -translate-y-1/2 h-2 w-2 rounded-full bg-zinc-400 ring-1 ring-white" />
        )}
      </motion.div>
    </button>
  )
}

function HoverTooltip({
  business: b,
  toScreen,
}: {
  business: Business
  toScreen: (lat: number, lng: number) => { x: number; y: number }
}) {
  const s = toScreen(b.lat, b.lng)
  const cfg = VERIFICATION_CONFIG[b.verified as VerificationLevel]
  return (
    <motion.div
      initial={{ opacity: 0, y: 6, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 6, scale: 0.96 }}
      transition={{ duration: 0.15 }}
      className="absolute z-[60] glass card-elevated rounded-xl p-2.5 w-56 pointer-events-none"
      style={{ left: s.x, top: s.y, transform: 'translate(-50%, -100%) translateY(-44px)' }}
    >
      <div className="flex items-start gap-2">
        <img src={b.logo} alt="" className="h-9 w-9 rounded-lg object-cover" />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1">
            <p className="text-xs font-semibold truncate text-foreground">{b.name}</p>
          </div>
          <p className="text-[10px] text-muted-foreground truncate">{b.category}</p>
          <div className="mt-1 flex items-center gap-1.5 text-[10px]">
            <span className="inline-flex items-center gap-0.5 font-medium text-foreground">
              <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
              {b.rating}
            </span>
            <span className="text-muted-foreground">({formatNumber(b.reviewCount)})</span>
            <span
              className="ml-auto rounded-full px-1.5 py-0.5 text-[9px] font-medium"
              style={{ color: cfg.color, background: cfg.bg }}
            >
              {cfg.label}
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

// Stylized decorative map background — premium, layered, living
function MapBackground({
  width,
  height,
  offsetX,
  offsetY,
  zoom,
}: {
  width: number
  height: number
  offsetX: number
  offsetY: number
  zoom: number
}) {
  // Create a deterministic set of decorative roads & blocks
  const roads = React.useMemo(() => {
    const arr: { d: string; w: number; major?: boolean }[] = []
    for (let i = -2; i <= 6; i++) {
      const y = (i * 180 + offsetY) % (height + 360)
      arr.push({ d: `M0 ${y} L${width} ${y}`, w: i % 2 === 0 ? 14 : 8, major: i % 2 === 0 })
    }
    for (let i = -2; i <= 8; i++) {
      const x = (i * 200 + offsetX) % (width + 400)
      arr.push({ d: `M${x} 0 L${x} ${height}`, w: i % 2 === 0 ? 14 : 8, major: i % 2 === 0 })
    }
    return arr
  }, [width, height, offsetX, offsetY])

  const blocks = React.useMemo(() => {
    const arr: { x: number; y: number; w: number; h: number; tone: number; type: number }[] = []
    for (let i = 0; i < 7; i++) {
      for (let j = 0; j < 6; j++) {
        const x = (i * 200 + 30 + offsetX * 0.6) % (width + 200) - 100
        const y = (j * 180 + 30 + offsetY * 0.6) % (height + 180) - 90
        arr.push({ x, y, w: 140, h: 110, tone: (i + j) % 4, type: (i * 3 + j * 7) % 5 })
      }
    }
    return arr
  }, [width, height, offsetX, offsetY])

  // Small building footprints for density/realism
  const buildings = React.useMemo(() => {
    const arr: { x: number; y: number; w: number; h: number; o: number }[] = []
    let seed = 1
    const rand = () => { seed = (seed * 9301 + 49297) % 233280; return seed / 233280 }
    for (let k = 0; k < 60; k++) {
      const x = (rand() * (width + 200) - 100 + offsetX * 0.6) % (width + 200)
      const y = (rand() * (height + 200) - 100 + offsetY * 0.6) % (height + 200)
      const w = 8 + rand() * 16
      const h = 8 + rand() * 16
      arr.push({ x, y, w, h, o: 0.25 + rand() * 0.2 })
    }
    return arr
  }, [width, height, offsetX, offsetY])

  return (
    <svg
      className="absolute inset-0 h-full w-full"
      style={{ background: 'var(--background)' }}
      preserveAspectRatio="xMidYMid slice"
    >
      <defs>
        <pattern id="mapgrid" width="40" height="40" patternUnits="userSpaceOnUse">
          <path d="M40 0 L0 0 0 40" fill="none" stroke="var(--border)" strokeWidth="0.5" opacity="0.4" />
        </pattern>
        <pattern id="finegrid" width="10" height="10" patternUnits="userSpaceOnUse">
          <path d="M10 0 L0 0 0 10" fill="none" stroke="var(--border)" strokeWidth="0.3" opacity="0.18" />
        </pattern>
        <linearGradient id="river" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="oklch(0.85 0.05 225)" />
          <stop offset="50%" stopColor="oklch(0.8 0.06 215)" />
          <stop offset="100%" stopColor="oklch(0.75 0.07 210)" />
        </linearGradient>
        <radialGradient id="park" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="oklch(0.84 0.09 150)" />
          <stop offset="70%" stopColor="oklch(0.8 0.07 150)" />
          <stop offset="100%" stopColor="oklch(0.78 0.05 150)" stopOpacity="0.6" />
        </radialGradient>
        <linearGradient id="terrain" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--background)" />
          <stop offset="100%" stopColor="oklch(0.95 0.01 95)" />
        </linearGradient>
        <filter id="softshadow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur in="SourceAlpha" stdDeviation="2" />
          <feOffset dx="0" dy="1" result="offsetblur" />
          <feComponentTransfer><feFuncA type="linear" slope="0.15" /></feComponentTransfer>
          <feMerge><feMergeNode /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>

      {/* Base terrain gradient */}
      <rect width="100%" height="100%" fill="url(#terrain)" />
      <rect width="100%" height="100%" fill="url(#finegrid)" />
      <rect width="100%" height="100%" fill="url(#mapgrid)" opacity="0.55" />

      {/* Water body — a diagonal river with depth + a lake */}
      <path
        d={`M${-100 + offsetX * 0.4} ${height * 0.72}
            C ${width * 0.28 + offsetX * 0.4} ${height * 0.5}, ${width * 0.52 + offsetX * 0.4} ${height * 0.86}, ${width + 100 + offsetX * 0.4} ${height * 0.42}`}
        stroke="url(#river)"
        strokeWidth="76"
        fill="none"
        opacity="0.55"
        strokeLinecap="round"
      />
      {/* River shimmer line */}
      <path
        d={`M${-100 + offsetX * 0.4} ${height * 0.72}
            C ${width * 0.28 + offsetX * 0.4} ${height * 0.5}, ${width * 0.52 + offsetX * 0.4} ${height * 0.86}, ${width + 100 + offsetX * 0.4} ${height * 0.42}`}
        stroke="oklch(0.92 0.04 220)"
        strokeWidth="2"
        fill="none"
        opacity="0.45"
        strokeLinecap="round"
        strokeDasharray="20 14"
      />

      {/* Lake */}
      <ellipse
        cx={width * 0.85 + offsetX * 0.4}
        cy={height * 0.2 + offsetY * 0.4}
        rx="55"
        ry="40"
        fill="url(#river)"
        opacity="0.5"
      />

      {/* Parks with soft shape */}
      <g filter="url(#softshadow)">
        <ellipse cx={width * 0.18 + offsetX * 0.4} cy={height * 0.25 + offsetY * 0.4} rx="95" ry="72" fill="url(#park)" opacity="0.6" />
        <ellipse cx={width * 0.78 + offsetX * 0.4} cy={height * 0.78 + offsetY * 0.4} rx="72" ry="56" fill="url(#park)" opacity="0.55" />
        <ellipse cx={width * 0.45 + offsetX * 0.4} cy={height * 0.15 + offsetY * 0.4} rx="45" ry="34" fill="url(#park)" opacity="0.5" />
      </g>
      {/* Park tree dots for texture */}
      {[
        [0.18, 0.25], [0.78, 0.78], [0.45, 0.15],
      ].map(([px, py], gi) => (
        <g key={gi}>
          {Array.from({ length: 6 }).map((_, ti) => {
            const angle = (ti / 6) * Math.PI * 2
            const r = 30 + (ti % 3) * 12
            return (
              <circle
                key={ti}
                cx={width * px + Math.cos(angle) * r + offsetX * 0.4}
                cy={height * py + Math.sin(angle) * r * 0.75 + offsetY * 0.4}
                r="3"
                fill="oklch(0.7 0.1 150)"
                opacity="0.5"
              />
            )
          })}
        </g>
      ))}

      {/* Blocks (land parcels) */}
      {blocks.map((b, i) => (
        <rect
          key={i}
          x={b.x}
          y={b.y}
          width={b.w}
          height={b.h}
          rx="10"
          fill="var(--secondary)"
          opacity={0.45 + b.tone * 0.08}
        />
      ))}

      {/* Building footprints for density */}
      {buildings.map((bd, i) => (
        <rect
          key={`b-${i}`}
          x={bd.x}
          y={bd.y}
          width={bd.w}
          height={bd.h}
          rx="2"
          fill="var(--muted-foreground)"
          opacity={bd.o}
        />
      ))}

      {/* Roads — layered: casing + fill + centerline */}
      {roads.map((r, i) => (
        <g key={i}>
          {/* Casing */}
          <path d={r.d} stroke="var(--background)" strokeWidth={r.w + 4} fill="none" opacity="0.95" strokeLinecap="round" />
          {/* Fill */}
          <path d={r.d} stroke="var(--muted-foreground)" strokeWidth={r.w} fill="none" opacity={r.major ? 0.16 : 0.1} strokeLinecap="round" />
          {/* Center dashed line for major roads */}
          {r.major && (
            <path d={r.d} stroke="var(--muted-foreground)" strokeWidth="0.8" strokeDasharray="6 8" fill="none" opacity="0.35" />
          )}
        </g>
      ))}

      {/* Subtle vignette */}
      <radialGradient id="vignette" cx="50%" cy="50%" r="75%">
        <stop offset="55%" stopColor="transparent" />
        <stop offset="100%" stopColor="var(--background)" stopOpacity="0.55" />
      </radialGradient>
      <rect width="100%" height="100%" fill="url(#vignette)" />
    </svg>
  )
}

function DistrictLabels({ toScreen }: { toScreen: (lat: number, lng: number) => { x: number; y: number } }) {
  const districts = [
    { lat: 28.625, lng: 77.195, label: 'Civil Lines' },
    { lat: 28.605, lng: 77.225, label: 'Industrial Area' },
    { lat: 28.62, lng: 77.235, label: 'Knowledge Park' },
    { lat: 28.6, lng: 77.19, label: 'Hospitality District' },
    { lat: 28.615, lng: 77.215, label: 'Central Avenue' },
    { lat: 28.608, lng: 77.245, label: 'Logistics Hub' },
    { lat: 28.628, lng: 77.205, label: 'Wellness Square' },
  ]
  return (
    <div className="absolute inset-0 pointer-events-none">
      {districts.map((d) => {
        const s = toScreen(d.lat, d.lng)
        return (
          <div
            key={d.label}
            className="absolute -translate-x-1/2 -translate-y-1/2"
            style={{ left: s.x, top: s.y }}
          >
            <div className="flex flex-col items-center">
              <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground/60 drop-shadow-sm">
                {d.label}
              </span>
              <span className="mt-0.5 h-px w-8 bg-muted-foreground/20" />
            </div>
          </div>
        )
      })}
    </div>
  )
}
