'use client'

import * as React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { GitCompare, X, ArrowRight, Trash2, Package, Wrench } from 'lucide-react'
import { useAppStore } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

export function CompareTray() {
  const {
    compareProductIds, clearCompareProducts, toggleCompareProduct,
    compareServiceIds, clearCompareServices, toggleCompareService,
    setView,
  } = useAppStore()
  const [products, setProducts] = React.useState<any[]>([])
  const [services, setServices] = React.useState<any[]>([])

  React.useEffect(() => {
    if (compareProductIds.length === 0) { setProducts([]); return }
    Promise.all(
      compareProductIds.map((id) =>
        fetch(`/api/products/${id}`).then((r) => r.json()).then((d) => d.product).catch(() => null)
      )
    ).then((results) => setProducts(results.filter(Boolean)))
  }, [compareProductIds])

  React.useEffect(() => {
    if (compareServiceIds.length === 0) { setServices([]); return }
    Promise.all(
      compareServiceIds.map((id) =>
        fetch(`/api/services/${id}`).then((r) => r.json()).then((d) => d.service).catch(() => null)
      )
    ).then((results) => setServices(results.filter(Boolean)))
  }, [compareServiceIds])

  const showProducts = compareProductIds.length > 0
  const showServices = compareServiceIds.length > 0
  const open = showProducts || showServices

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 80, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 320, damping: 32 }}
          className="fixed bottom-4 left-1/2 z-40 w-[calc(100%-2rem)] max-w-3xl -translate-x-1/2"
        >
          <div className="space-y-2 rounded-2xl border border-border bg-card/95 p-3 shadow-2xl backdrop-blur-xl card-elevated">
            {/* Products row */}
            {showProducts && (
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Package className="h-3.5 w-3.5" />
                </div>
                <span className="shrink-0 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Products</span>
                <div className="flex flex-1 items-center gap-2 overflow-x-auto no-scrollbar">
                  {products.map((p) => (
                    <div key={p.id} className="group relative flex shrink-0 items-center gap-1.5 rounded-lg border border-border bg-background p-1.5 pr-2">
                      <img src={p.images?.[0]} alt="" className="h-7 w-7 rounded object-cover" />
                      <span className="max-w-[90px] truncate text-[10px] font-medium">{p.name}</span>
                      <button
                        onClick={() => toggleCompareProduct(p.id)}
                        className="flex h-4 w-4 items-center justify-center rounded-full text-muted-foreground hover:bg-rose-500/10 hover:text-rose-500"
                        aria-label="Remove"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <Button
                    size="sm"
                    className="h-7 gap-1 text-[11px]"
                    disabled={compareProductIds.length < 2}
                    onClick={() => setView({ name: 'compare-products', ids: compareProductIds })}
                  >
                    Compare <ArrowRight className="h-3 w-3" />
                  </Button>
                  <button
                    onClick={() => { clearCompareProducts(); toast.success('Products cleared') }}
                    className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-accent hover:text-foreground"
                    aria-label="Clear products"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              </div>
            )}
            {/* Services row */}
            {showServices && (
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Wrench className="h-3.5 w-3.5" />
                </div>
                <span className="shrink-0 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Services</span>
                <div className="flex flex-1 items-center gap-2 overflow-x-auto no-scrollbar">
                  {services.map((s) => (
                    <div key={s.id} className="group relative flex shrink-0 items-center gap-1.5 rounded-lg border border-border bg-background p-1.5 pr-2">
                      <img src={s.photos?.[0]} alt="" className="h-7 w-7 rounded object-cover" />
                      <span className="max-w-[90px] truncate text-[10px] font-medium">{s.name}</span>
                      <button
                        onClick={() => toggleCompareService(s.id)}
                        className="flex h-4 w-4 items-center justify-center rounded-full text-muted-foreground hover:bg-rose-500/10 hover:text-rose-500"
                        aria-label="Remove"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <Button
                    size="sm"
                    className="h-7 gap-1 text-[11px]"
                    disabled={compareServiceIds.length < 2}
                    onClick={() => setView({ name: 'compare-services', ids: compareServiceIds })}
                  >
                    Compare <ArrowRight className="h-3 w-3" />
                  </Button>
                  <button
                    onClick={() => { clearCompareServices(); toast.success('Services cleared') }}
                    className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-accent hover:text-foreground"
                    aria-label="Clear services"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
