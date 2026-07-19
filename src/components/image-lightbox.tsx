'use client'

import * as React from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { X, ChevronLeft, ChevronRight, ZoomIn, Download } from 'lucide-react'
import { cn } from '@/lib/utils'

interface LightboxProps {
  images: string[]
  open: boolean
  index: number
  onClose: () => void
  onIndexChange: (i: number) => void
  title?: string
}

export function ImageLightbox({ images, open, index, onClose, onIndexChange, title }: LightboxProps) {
  const [mounted, setMounted] = React.useState(false)
  React.useEffect(() => setMounted(true), [])

  React.useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowLeft') onIndexChange((index - 1 + images.length) % images.length)
      if (e.key === 'ArrowRight') onIndexChange((index + 1) % images.length)
    }
    window.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [open, index, images.length, onClose, onIndexChange])

  if (!mounted) return null

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md"
          onClick={onClose}
        >
          {/* Top bar */}
          <div className="absolute left-0 right-0 top-0 flex items-center justify-between p-4 text-white" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-2 text-sm">
              <span className="rounded-full bg-white/10 px-2.5 py-1 text-xs font-medium backdrop-blur">
                {index + 1} / {images.length}
              </span>
              {title && <span className="truncate text-xs text-white/70">{title}</span>}
            </div>
            <button
              onClick={onClose}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur transition hover:bg-white/20"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Prev */}
          {images.length > 1 && (
            <button
              onClick={(e) => { e.stopPropagation(); onIndexChange((index - 1 + images.length) % images.length) }}
              className="absolute left-3 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur transition hover:bg-white/20"
              aria-label="Previous"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
          )}

          {/* Image */}
          <motion.div
            key={index}
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="relative max-h-[85vh] max-w-[92vw]"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={images[index]}
              alt={title || `Image ${index + 1}`}
              className="max-h-[85vh] max-w-[92vw] rounded-xl object-contain shadow-2xl"
            />
          </motion.div>

          {/* Next */}
          {images.length > 1 && (
            <button
              onClick={(e) => { e.stopPropagation(); onIndexChange((index + 1) % images.length) }}
              className="absolute right-3 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur transition hover:bg-white/20"
              aria-label="Next"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          )}

          {/* Thumbnails */}
          {images.length > 1 && (
            <div className="absolute bottom-0 left-0 right-0 flex justify-center p-4" onClick={(e) => e.stopPropagation()}>
              <div className="no-scrollbar flex max-w-[90vw] gap-1.5 overflow-x-auto rounded-2xl bg-black/40 p-2 backdrop-blur">
                {images.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => onIndexChange(i)}
                    className={cn(
                      'h-12 w-12 shrink-0 overflow-hidden rounded-lg border-2 transition',
                      i === index ? 'border-primary opacity-100' : 'border-transparent opacity-50 hover:opacity-90'
                    )}
                  >
                    <img src={img} alt="" className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  )
}

// Hook to manage lightbox state easily
export function useLightbox() {
  const [open, setOpen] = React.useState(false)
  const [index, setIndex] = React.useState(0)
  const openAt = (i: number) => { setIndex(i); setOpen(true) }
  return { open, index, setOpen, setIndex, openAt }
}
