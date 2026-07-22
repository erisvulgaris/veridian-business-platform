'use client'

import * as React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Star, Crosshair, Loader2, Compass } from 'lucide-react'
import type { Business } from '@/lib/types'
import { VERIFICATION_CONFIG, formatNumber } from '@/lib/types'
import { useAppStore } from '@/lib/store'
import { toast } from 'sonner'

interface MapViewProps {
  businesses: Business[]
  className?: string
}

const CENTER = { lat: 28.6139, lng: 77.209 }

// Dynamic import for Leaflet (client-only)
let L: any = null
let MapContainer: any = null
let TileLayer: any = null
let Marker: any = null
let Popup: any = null
let useMap: any = null
let CircleMarker: any = null
let Tooltip: any = null

async function loadLeaflet() {
  if (L) return
  try {
    const leafletModule = await import('leaflet')
    const rl = await import('react-leaflet')
    const leafletLib = leafletModule.default || leafletModule
    L = leafletLib
    MapContainer = rl.MapContainer
    TileLayer = rl.TileLayer
    Marker = rl.Marker
    Popup = rl.Popup
    useMap = rl.useMap
    CircleMarker = rl.CircleMarker
    Tooltip = rl.Tooltip
    // Fix default icon path
    if (leafletLib.Icon && leafletLib.Icon.Default) {
      leafletLib.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      })
    }
  } catch (e) {
    console.error('Failed to load Leaflet:', e)
  }
}

// Custom div icon for business pins
function createBusinessIcon(b: Business) {
  if (!L) return undefined
  const cfg = VERIFICATION_CONFIG[b.verified as keyof typeof VERIFICATION_CONFIG] || VERIFICATION_CONFIG.basic
  const html = `
    <div style="position: relative; display: flex; flex-direction: column; align-items: center;">
      ${b.trending && b.isOpen ? `<div style="position: absolute; width: 30px; height: 30px; border-radius: 50%; background: ${b.brandColor}; opacity: 0.3; animation: pulse 2s infinite; top: -4px; left: 50%; transform: translateX(-50%);"></div>` : ''}
      <div style="width: 36px; height: 36px; border-radius: 50%; background: ${b.brandColor}; border: 2.5px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center; font-size: 10px; font-weight: bold; color: white; position: relative;">
        ${b.rating.toFixed(1)}
      </div>
      <div style="width: 2px; height: 8px; background: ${b.brandColor}; margin-top: -2px;"></div>
      <div style="position: absolute; top: 0; right: 0; width: 10px; height: 10px; border-radius: 50%; background: ${cfg.color}; border: 1.5px solid white;"></div>
    </div>
  `
  return L.divIcon({
    html,
    className: 'business-pin',
    iconSize: [36, 44],
    iconAnchor: [18, 44],
    popupAnchor: [0, -44],
  })
}

// User location icon
function createUserIcon() {
  if (!L) return undefined
  const html = `
    <div style="position: relative; display: flex; align-items: center; justify-content: center;">
      <div style="position: absolute; width: 24px; height: 24px; border-radius: 50%; background: rgba(59,130,246,0.3); animation: pulse 1.5s infinite;"></div>
      <div style="width: 14px; height: 14px; border-radius: 50%; background: #3b82f6; border: 3px solid white; box-shadow: 0 2px 6px rgba(0,0,0,0.3);"></div>
    </div>
  `
  return L.divIcon({ html, className: 'user-pin', iconSize: [24, 24], iconAnchor: [12, 12] })
}

// Map controller component (uses useMap hook inside MapContainer)
function MapController({ onMove, userLocation, businesses, onSelect }: {
  onMove?: (center: { lat: number; lng: number }) => void
  userLocation: { lat: number; lng: number } | null
  businesses: Business[]
  onSelect: (id: string) => void
}) {
  const map = useMap()
  const [zoom, setZoom] = React.useState(map.getZoom())

  React.useEffect(() => {
    const handler = () => {
      const c = map.getCenter()
      onMove?.({ lat: c.lat, lng: c.lng })
      setZoom(map.getZoom())
    }
    map.on('moveend', handler)
    map.on('zoomend', handler)
    return () => {
      map.off('moveend', handler)
      map.off('zoomend', handler)
    }
  }, [map, onMove])

  // Pan to user location when it changes
  React.useEffect(() => {
    if (userLocation) {
      map.flyTo([userLocation.lat, userLocation.lng], 14, { duration: 1.5 })
    }
  }, [userLocation, map])

  return null
}

// Recenter button (outside map)
function RecenterButton({ map }: { map: any }) {
  return null
}

export function MapView({ businesses, className }: MapViewProps) {
  const { selectedBusinessId, selectBusiness, hoveredBusinessId, hoverBusiness } = useAppStore()
  const [leafletReady, setLeafletReady] = React.useState(false)
  const [userLocation, setUserLocation] = React.useState<{ lat: number; lng: number } | null>(null)
  const [locating, setLocating] = React.useState(false)
  const [mapRef, setMapRef] = React.useState<any>(null)

  // Load Leaflet on mount
  React.useEffect(() => {
    loadLeaflet().then(() => setLeafletReady(true)).catch(console.error)
  }, [])

  // Inject Leaflet CSS
  React.useEffect(() => {
    if (!document.getElementById('leaflet-css')) {
      const link = document.createElement('link')
      link.id = 'leaflet-css'
      link.rel = 'stylesheet'
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
      document.head.appendChild(link)
    }
    // Inject pulse animation
    if (!document.getElementById('leaflet-pulse')) {
      const style = document.createElement('style')
      style.id = 'leaflet-pulse'
      style.textContent = `
        @keyframes pulse { 0% { transform: scale(0.8); opacity: 0.5; } 70% { transform: scale(2.2); opacity: 0; } 100% { transform: scale(2.2); opacity: 0; } }
        .leaflet-container { background: #e8e8e8; font-family: inherit; }
        .leaflet-popup-content-wrapper { border-radius: 12px; box-shadow: 0 4px 16px rgba(0,0,0,0.12); }
        .leaflet-popup-content { margin: 10px 14px; }
        .business-pin { background: transparent; border: none; }
        .user-pin { background: transparent; border: none; }
      `
      document.head.appendChild(style)
    }
  }, [])

  const findNearMe = () => {
    if (!('geolocation' in navigator)) {
      toast('Geolocation is not supported on this device')
      return
    }
    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude }
        setUserLocation(loc)
        setLocating(false)
        toast.success('Centered on your location')
        if (mapRef) {
          mapRef.flyTo([loc.lat, loc.lng], 14, { duration: 1.5 })
        }
      },
      (err) => {
        setLocating(false)
        toast('Could not access your location', { description: err.message })
      },
      { enableHighAccuracy: true, timeout: 8000 }
    )
  }

  const recenter = () => {
    if (mapRef) {
      mapRef.flyTo([CENTER.lat, CENTER.lng], 13, { duration: 1 })
    }
  }

  if (!leafletReady) {
    return (
      <div className={className} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--secondary)' }}>
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className={className} style={{ position: 'relative' }}>
      <MapContainer
        center={[CENTER.lat, CENTER.lng]}
        zoom={13}
        scrollWheelZoom
        style={{ width: '100%', height: '100%', zIndex: 1 }}
        ref={(ref: any) => setMapRef(ref)}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <MapController
          userLocation={userLocation}
          businesses={businesses}
          onSelect={selectBusiness}
        />

        {/* Business markers */}
        {businesses.map((b) => {
          const cfg = VERIFICATION_CONFIG[b.verified as keyof typeof VERIFICATION_CONFIG] || VERIFICATION_CONFIG.basic
          const isSelected = selectedBusinessId === b.id
          const isHovered = hoveredBusinessId === b.id
          return (
            <Marker
              key={b.id}
              position={[b.lat, b.lng]}
              icon={createBusinessIcon(b)}
              eventHandlers={{
                click: () => selectBusiness(b.id),
                mouseover: () => hoverBusiness(b.id),
                mouseout: () => hoverBusiness(null),
              }}
              zIndexOffset={isSelected || isHovered ? 1000 : 0}
            >
              <Tooltip direction="top" offset={[0, -40]} opacity={1}>
                <div style={{ padding: '4px 8px', minWidth: '180px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <strong style={{ fontSize: '12px' }}>{b.name}</strong>
                  </div>
                  <div style={{ fontSize: '10px', color: '#666', marginTop: '2px' }}>{b.category}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '3px' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '2px', fontSize: '11px', fontWeight: 600 }}>
                      <Star className="h-3 w-3 fill-amber-400 text-amber-400" /> {b.rating}
                    </span>
                    <span style={{ fontSize: '10px', color: '#999' }}>({formatNumber(b.reviewCount)})</span>
                    <span style={{
                      marginLeft: 'auto',
                      fontSize: '9px',
                      fontWeight: 600,
                      color: cfg.color,
                      background: cfg.bg,
                      padding: '1px 6px',
                      borderRadius: '10px',
                    }}>
                      {cfg.label}
                    </span>
                  </div>
                </div>
              </Tooltip>
              <Popup>
                <div style={{ minWidth: '200px' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                    <img src={b.logo} alt="" style={{ width: '36px', height: '36px', borderRadius: '8px', objectFit: 'cover' }} />
                    <div>
                      <strong style={{ fontSize: '13px' }}>{b.name}</strong>
                      <div style={{ fontSize: '10px', color: '#666' }}>{b.category} · {b.area}</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                        <span style={{ fontSize: '11px', fontWeight: 600, color: '#f59e0b' }}>★ {b.rating}</span>
                        <span style={{ fontSize: '10px', color: '#999' }}>({formatNumber(b.reviewCount)})</span>
                      </div>
                    </div>
                  </div>
                </div>
              </Popup>
            </Marker>
          )
        })}

        {/* User location marker */}
        {userLocation && (
          <Marker position={[userLocation.lat, userLocation.lng]} icon={createUserIcon()}>
            <Popup>
              <div style={{ fontWeight: 600, fontSize: '12px' }}>Your location</div>
            </Popup>
          </Marker>
        )}
      </MapContainer>

      {/* Controls overlay */}
      <div className="absolute right-3 top-3 z-[1000] flex flex-col gap-2">
        <button
          onClick={() => mapRef?.zoomIn()}
          className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-foreground shadow-lg transition hover:bg-gray-50"
          aria-label="Zoom in"
        >
          <span className="text-xl font-bold">+</span>
        </button>
        <button
          onClick={() => mapRef?.zoomOut()}
          className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-foreground shadow-lg transition hover:bg-gray-50"
          aria-label="Zoom out"
        >
          <span className="text-xl font-bold">−</span>
        </button>
        <button
          onClick={findNearMe}
          disabled={locating}
          className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-primary shadow-lg transition hover:bg-gray-50 disabled:opacity-60"
          aria-label="Find businesses near me"
          title="Find businesses near me"
        >
          {locating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Crosshair className="h-4 w-4" />}
        </button>
        <button
          onClick={recenter}
          className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-foreground shadow-lg transition hover:bg-gray-50"
          aria-label="Recenter"
        >
          <Compass className="h-4 w-4" />
        </button>
      </div>

      {/* Legend */}
      <div className="absolute left-3 bottom-3 z-[1000] flex items-center gap-2 rounded-xl bg-white/90 px-3 py-2 text-[11px] text-muted-foreground shadow-lg backdrop-blur">
        <Compass className="h-3.5 w-3.5" />
        <span className="font-medium text-foreground">Meridian B2B Hub</span>
        <span>·</span>
        <span>{businesses.length} suppliers</span>
      </div>
    </div>
  )
}
