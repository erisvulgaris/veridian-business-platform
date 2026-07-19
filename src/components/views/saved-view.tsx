'use client'

import * as React from 'react'
import useSWR from 'swr'
import { Bookmark, BookmarkX, FolderOpen, Sparkles } from 'lucide-react'
import { useAppStore } from '@/lib/store'
import type { Business } from '@/lib/types'
import { BusinessCard } from '@/components/business-card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export function SavedView() {
  const { savedBusinessIds, setView } = useAppStore()
  const { data, isLoading } = useSWR<{ businesses: Business[] }>('/api/businesses?limit=60', fetcher)
  const all = data?.businesses ?? []
  const saved = all.filter((b) => savedBusinessIds.includes(b.id))

  return (
    <div className="mx-auto max-w-6xl px-3 py-4 sm:px-4">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Bookmark className="h-4 w-4 text-primary" />
            <h1 className="text-xl font-bold tracking-tight sm:text-2xl">Saved businesses</h1>
          </div>
          <p className="text-xs text-muted-foreground">{saved.length} saved to your collection</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => setView({ name: 'home' })}>
          <FolderOpen className="mr-1.5 h-3.5 w-3.5" /> Browse more
        </Button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-48 rounded-2xl" />)}
        </div>
      ) : saved.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border py-16 text-center">
          <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-2xl bg-secondary text-muted-foreground">
            <BookmarkX className="h-7 w-7" />
          </div>
          <p className="text-sm font-semibold">Nothing saved yet</p>
          <p className="mt-1 max-w-sm text-xs text-muted-foreground">Tap the bookmark icon on any business to save it here for quick access.</p>
          <Button className="mt-4 gap-1.5" onClick={() => setView({ name: 'home' })}>
            <Sparkles className="h-3.5 w-3.5" /> Start exploring
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {saved.map((b) => (
            <BusinessCard key={b.id} business={b} layout="grid" />
          ))}
        </div>
      )}
    </div>
  )
}
