'use client'

import * as React from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useAppStore } from '@/lib/store'
import { AppHeader } from '@/components/app-header'
import { AppFooter } from '@/components/app-footer'
import { AiAssistant } from '@/components/ai-assistant'
import { HomeView } from '@/components/views/home-view'
import { BusinessView } from '@/components/views/business-view'
import { ProductView } from '@/components/views/product-view'
import { ServiceView } from '@/components/views/service-view'
import { SearchView } from '@/components/views/search-view'
import { CategoryView } from '@/components/views/category-view'
import { DashboardView } from '@/components/views/dashboard-view'
import { SavedView } from '@/components/views/saved-view'
import { CollectionsView } from '@/components/views/collections-view'
import { CompareView } from '@/components/views/compare-view'

export default function Home() {
  const { view, compareIds } = useAppStore()

  // Scroll to top on view change
  React.useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [view])

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <AppHeader />
      <main className="flex-1">
        <AnimatePresence mode="wait">
          <motion.div
            key={viewKey(view)}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
          >
            {renderView(view, compareIds)}
          </motion.div>
        </AnimatePresence>
      </main>
      <AppFooter />
      <AiAssistant />
    </div>
  )
}

function viewKey(view: ReturnType<typeof useAppStore.getState>['view']): string {
  switch (view.name) {
    case 'home': return 'home'
    case 'search': return `search:${view.query}`
    case 'category': return `cat:${view.slug}`
    case 'business': return `biz:${view.id}`
    case 'product': return `prod:${view.id}`
    case 'service': return `svc:${view.id}`
    case 'dashboard': return 'dashboard'
    case 'saved': return 'saved'
    case 'collections': return 'collections'
    case 'compare': return `compare:${view.ids.join(',')}`
    default: return 'home'
  }
}

function renderView(view: ReturnType<typeof useAppStore.getState>['view'], compareIds: string[]) {
  switch (view.name) {
    case 'home': return <HomeView />
    case 'search': return <SearchView query={view.query} />
    case 'category': return <CategoryView slug={view.slug} label={view.label} />
    case 'business': return <BusinessView id={view.id} slug={view.slug} />
    case 'product': return <ProductView id={view.id} />
    case 'service': return <ServiceView id={view.id} />
    case 'dashboard': return <DashboardView />
    case 'saved': return <SavedView />
    case 'collections': return <CollectionsView />
    case 'compare': return <CompareView ids={view.ids} />
    default: return <HomeView />
  }
}
