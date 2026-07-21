'use client'

import { useAppStore } from '@/lib/store'
import { Sparkles } from 'lucide-react'

export function AppFooter() {
  const { setView, setAiPanel } = useAppStore()
  return (
    <footer className="mt-auto border-t border-border bg-card/50">
      <div className="mx-auto max-w-[1600px] px-4 py-6">
        <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M12 2L3 7l9 5 9-5-9-5z" strokeLinejoin="round" />
                  <path d="M3 12l9 5 9-5" strokeLinejoin="round" />
                  <path d="M3 17l9 5 9-5" strokeLinejoin="round" />
                </svg>
              </div>
              <span className="text-sm font-bold">Veridian</span>
            </div>
            <p className="text-xs text-muted-foreground max-w-xs">
              The B2B marketplace for discovering verified manufacturers, distributors, suppliers and industrial service providers. Free ERP included.
            </p>
          </div>
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Discover</p>
            <ul className="space-y-1.5 text-xs">
              <li><button className="text-foreground/80 hover:text-primary" onClick={() => setView({ name: 'home' })}>Map</button></li>
              <li><button className="text-foreground/80 hover:text-primary" onClick={() => setView({ name: 'category', slug: 'manufacturers' })}>Manufacturers</button></li>
              <li><button className="text-foreground/80 hover:text-primary" onClick={() => setView({ name: 'category', slug: 'wholesalers-distributors' })}>Wholesalers</button></li>
              <li><button className="text-foreground/80 hover:text-primary" onClick={() => setView({ name: 'category', slug: 'raw-materials' })}>Raw Materials</button></li>
            </ul>
          </div>
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">For Business</p>
            <ul className="space-y-1.5 text-xs">
              <li><button className="text-foreground/80 hover:text-primary" onClick={() => setView({ name: 'dashboard' })}>Claim your profile</button></li>
              <li><button className="text-foreground/80 hover:text-primary" onClick={() => setView({ name: 'dashboard' })}>Free ERP</button></li>
              <li><button className="text-foreground/80 hover:text-primary">Verification</button></li>
              <li><button className="text-foreground/80 hover:text-primary">Advertising</button></li>
            </ul>
          </div>
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Intelligence</p>
            <ul className="space-y-1.5 text-xs">
              <li><button className="inline-flex items-center gap-1 text-foreground/80 hover:text-primary" onClick={() => setAiPanel(true)}><Sparkles className="h-3 w-3" /> AI Assistant</button></li>
              <li><button className="text-foreground/80 hover:text-primary">API</button></li>
              <li><button className="text-foreground/80 hover:text-primary">Developer Docs</button></li>
              <li><button className="text-foreground/80 hover:text-primary">Partner Program</button></li>
            </ul>
          </div>
        </div>
        <div className="mt-6 flex flex-col items-center justify-between gap-2 border-t border-border pt-4 sm:flex-row">
          <p className="text-[11px] text-muted-foreground">© {new Date().getFullYear()} Veridian. The B2B supplier discovery platform.</p>
          <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
            <button className="hover:text-foreground">Privacy</button>
            <button className="hover:text-foreground">Terms</button>
            <button className="hover:text-foreground">Trust</button>
          </div>
        </div>
      </div>
    </footer>
  )
}
