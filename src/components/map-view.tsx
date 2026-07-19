'use client'

import * as React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MapPin, Star, Plus, Minus, Locate, Layers, Compass } from 'lucide-react'
import type { Business, VerificationLevel } from '@/lib/types'
import { VERIFICATION_CONFIG, formatNumber } from '@/lib/types'
import { useAppStore } from '@/lib/store'
import { cn } from '@/lib/utils'

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
          onClick={recenter}
          className="glass card-elevated flex h-10 w-10 items-center justify-center rounded-xl text-foreground hover:bg-accent transition"
          aria-label="Recenter"
        >
          <Locate className="h-4 w-4" />
        </button>
      </div>

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

// Stylized decorative map background
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
    // Horizontal major roads
    for (let i = -2; i <= 6; i++) {
      const y = (i * 180 + offsetY) % (height + 360)
      arr.push({ d: `M0 ${y} L${width} ${y}`, w: i % 2 === 0 ? 14 : 8, major: i % 2 === 0 })
    }
    // Vertical major roads
    for (let i = -2; i <= 8; i++) {
      const x = (i * 200 + offsetX) % (width + 400)
      arr.push({ d: `M${x} 0 L${x} ${height}`, w: i % 2 === 0 ? 14 : 8, major: i % 2 === 0 })
    }
    return arr
  }, [width, height, offsetX, offsetY])

  const blocks = React.useMemo(() => {
    const arr: { x: number; y: number; w: number; h: number; tone: number }[] = []
    for (let i = 0; i < 6; i++) {
      for (let j = 0; j < 5; j++) {
        const x = (i * 200 + 30 + offsetX * 0.6) % (width + 200) - 100
        const y = (j * 180 + 30 + offsetY * 0.6) % (height + 180) - 90
        arr.push({ x, y, w: 140, h: 110, tone: (i + j) % 4 })
      }
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
        <linearGradient id="river" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="oklch(0.85 0.04 220)" />
          <stop offset="100%" stopColor="oklch(0.78 0.06 210)" />
        </linearGradient>
        <radialGradient id="park" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="oklch(0.85 0.08 150)" />
          <stop offset="100%" stopColor="oklch(0.8 0.06 150)" />
        </radialGradient>
      </defs>

      <rect width="100%" height="100%" fill="url(#mapgrid)" opacity="0.5" />

      {/* River — a diagonal wavy band */}
      <path
        d={`M${-100 + offsetX * 0.4} ${height * 0.7}
            C ${width * 0.3 + offsetX * 0.4} ${height * 0.5}, ${width * 0.5 + offsetX * 0.4} ${height * 0.85}, ${width + 100 + offsetX * 0.4} ${height * 0.4}`}
        stroke="url(#river)"
        strokeWidth="70"
        fill="none"
        opacity="0.5"
        strokeLinecap="round"
      />

      {/* Parks */}
      <ellipse cx={width * 0.18 + offsetX * 0.4} cy={height * 0.25 + offsetY * 0.4} rx="90" ry="70" fill="url(#park)" opacity="0.55" />
      <ellipse cx={width * 0.78 + offsetX * 0.4} cy={height * 0.78 + offsetY * 0.4} rx="70" ry="55" fill="url(#park)" opacity="0.5" />

      {/* Blocks */}
      {blocks.map((b, i) => (
        <rect
          key={i}
          x={b.x}
          y={b.y}
          width={b.w}
          height={b.h}
          rx="10"
          fill="var(--secondary)"
          opacity={0.5 + b.tone * 0.08}
        />
      ))}

      {/* Roads */}
      {roads.map((r, i) => (
        <g key={i}>
          <path d={r.d} stroke="var(--background)" strokeWidth={r.w + 4} fill="none" opacity="0.9" />
          <path d={r.d} stroke="var(--muted-foreground)" strokeWidth={r.w} fill="none" opacity={r.major ? 0.18 : 0.12} strokeLinecap="round" />
          {r.major && (
            <path d={r.d} stroke="var(--muted-foreground)" strokeWidth="0.8" strokeDasharray="6 8" fill="none" opacity="0.4" />
          )}
        </g>
      ))}

      {/* Vignette */}
      <radialGradient id="vignette" cx="50%" cy="50%" r="70%">
        <stop offset="60%" stopColor="transparent" />
        <stop offset="100%" stopColor="var(--background)" stopOpacity="0.6" />
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
  ]
  return (
    <div className="absolute inset-0 pointer-events-none">
      {districts.map((d) => {
        const s = toScreen(d.lat, d.lng)
        return (
          <div
            key={d.label}
            className="absolute -translate-x-1/2 -translate-y-1/2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70"
            style={{ left: s.x, top: s.y }}
          >
            {d.label}
          </div>
        )
      })}
    </div>
  )
}
