'use client'

import * as React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { GitCompare, X, ArrowRight, Trash2 } from 'lucide-react'
import { useAppStore } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

export function ProductCompareTray() {
  const { compareProductIds, clearCompareProducts, toggleCompareProduct, setView } = useAppStore()
  const [products, setProducts] = React.useState<any[]>([])

  // Fetch product details for the compare IDs
  React.useEffect(() => {
    if (compareProductIds.length === 0) { setProducts([]); return }
    Promise.all(
      compareProductIds.map((id) =>
        fetch(`/api/products/${id}`).then((r) => r.json()).then((d) => d.product).catch(() => null)
      )
    ).then((results) => setProducts(results.filter(Boolean)))
  }, [compareProductIds])

  const open = compareProductIds.length > 0

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 80, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 320, damping: 32 }}
          className="fixed bottom-4 left-1/2 z-40 w-[calc(100%-2rem)] max-w-2xl -translate-x-1/2"
        >
          <div className="flex items-center gap-3 rounded-2xl border border-border bg-card/95 p-3 shadow-2xl backdrop-blur-xl card-elevated">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <GitCompare className="h-4 w-4" />
            </div>
            <div className="flex flex-1 items-center gap-2 overflow-x-auto no-scrollbar">
              {products.map((p) => (
                <div key={p.id} className="group relative flex shrink-0 items-center gap-1.5 rounded-lg border border-border bg-background p-1.5 pr-2">
                  <img src={p.images?.[0]} alt="" className="h-8 w-8 rounded object-cover" />
                  <span className="max-w-[100px] truncate text-[11px] font-medium">{p.name}</span>
                  <button
                    onClick={() => toggleCompareProduct(p.id)}
                    className="flex h-4 w-4 items-center justify-center rounded-full text-muted-foreground hover:bg-rose-500/10 hover:text-rose-500"
                    aria-label="Remove"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
              {Array.from({ length: 3 - compareProductIds.length }).map((_, i) => (
                <div key={i} className="flex h-[44px] w-12 shrink-0 items-center justify-center rounded-lg border border-dashed border-border text-[10px] text-muted-foreground">
                  +{3 - compareProductIds.length - i}
                </div>
              ))}
            </div>
            <div className="flex shrink-0 items-center gap-1.5">
              <Button
                size="sm"
                className="gap-1.5"
                disabled={compareProductIds.length < 2}
                onClick={() => setView({ name: 'compare-products', ids: compareProductIds })}
              >
                Compare <ArrowRight className="h-3.5 w-3.5" />
              </Button>
              <button
                onClick={() => { clearCompareProducts(); toast.success('Compare cleared') }}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-accent hover:text-foreground"
                aria-label="Clear all"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
