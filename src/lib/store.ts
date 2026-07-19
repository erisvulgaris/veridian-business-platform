import { create } from 'zustand'
import type { Business, Product, Service } from './types'

export type View =
  | { name: 'home' }
  | { name: 'search'; query: string }
  | { name: 'category'; slug: string; label?: string }
  | { name: 'business'; id: string; slug: string }
  | { name: 'product'; id: string }
  | { name: 'service'; id: string }
  | { name: 'dashboard' }
  | { name: 'saved' }
  | { name: 'compare'; ids: string[] }

interface AppState {
  view: View
  history: View[]
  selectedBusinessId: string | null
  hoveredBusinessId: string | null
  mapCenter: { lat: number; lng: number }
  mapZoom: number
  activeCategories: string[]
  filters: {
    openNow: boolean
    verifiedOnly: boolean
    minRating: number
  }
  savedBusinessIds: string[]
  savedProductIds: string[]
  compareIds: string[]
  recentlyViewed: string[]
  aiPanelOpen: boolean
  searchQuery: string

  setView: (view: View) => void
  goBack: () => void
  selectBusiness: (id: string | null) => void
  hoverBusiness: (id: string | null) => void
  setMapCenter: (c: { lat: number; lng: number }) => void
  setMapZoom: (z: number) => void
  toggleCategory: (slug: string) => void
  clearCategories: () => void
  toggleFilter: (key: 'openNow' | 'verifiedOnly', value?: boolean) => void
  setMinRating: (r: number) => void
  toggleSaveBusiness: (id: string) => void
  toggleSaveProduct: (id: string) => void
  toggleCompare: (id: string) => void
  clearCompare: () => void
  addRecentlyViewed: (id: string) => void
  clearRecentlyViewed: () => void
  setAiPanel: (open: boolean) => void
  setSearchQuery: (q: string) => void
}

export const useAppStore = create<AppState>((set, get) => ({
  view: { name: 'home' },
  history: [],
  selectedBusinessId: null,
  hoveredBusinessId: null,
  mapCenter: { lat: 28.6139, lng: 77.209 },
  mapZoom: 13,
  activeCategories: [],
  filters: { openNow: false, verifiedOnly: false, minRating: 0 },
  savedBusinessIds: [],
  savedProductIds: [],
  compareIds: [],
  recentlyViewed: [],
  aiPanelOpen: false,
  searchQuery: '',

  setView: (view) =>
    set((s) => ({
      view,
      history: [...s.history, s.view].slice(-20),
      selectedBusinessId: view.name === 'business' ? view.id : s.selectedBusinessId,
    })),
  goBack: () =>
    set((s) => {
      if (s.history.length === 0) return { view: { name: 'home' } }
      const history = [...s.history]
      const prev = history.pop()!
      return { view: prev, history }
    }),
  selectBusiness: (id) => set({ selectedBusinessId: id }),
  hoverBusiness: (id) => set({ hoveredBusinessId: id }),
  setMapCenter: (c) => set({ mapCenter: c }),
  setMapZoom: (z) => set({ mapZoom: z }),
  toggleCategory: (slug) =>
    set((s) => ({
      activeCategories: s.activeCategories.includes(slug)
        ? s.activeCategories.filter((c) => c !== slug)
        : [...s.activeCategories, slug],
    })),
  clearCategories: () => set({ activeCategories: [] }),
  toggleFilter: (key, value) =>
    set((s) => ({
      filters: {
        ...s.filters,
        [key]: value === undefined ? !s.filters[key] : value,
      },
    })),
  setMinRating: (r) =>
    set((s) => ({ filters: { ...s.filters, minRating: r === s.filters.minRating ? 0 : r } })),
  toggleSaveBusiness: (id) =>
    set((s) => ({
      savedBusinessIds: s.savedBusinessIds.includes(id)
        ? s.savedBusinessIds.filter((x) => x !== id)
        : [...s.savedBusinessIds, id],
    })),
  toggleSaveProduct: (id) =>
    set((s) => ({
      savedProductIds: s.savedProductIds.includes(id)
        ? s.savedProductIds.filter((x) => x !== id)
        : [...s.savedProductIds, id],
    })),
  toggleCompare: (id) =>
    set((s) => ({
      compareIds: s.compareIds.includes(id)
        ? s.compareIds.filter((x) => x !== id)
        : s.compareIds.length >= 3
          ? s.compareIds
          : [...s.compareIds, id],
    })),
  clearCompare: () => set({ compareIds: [] }),
  addRecentlyViewed: (id) =>
    set((s) => ({
      recentlyViewed: [id, ...s.recentlyViewed.filter((x) => x !== id)].slice(0, 12),
    })),
  clearRecentlyViewed: () => set({ recentlyViewed: [] }),
  setAiPanel: (open) => set({ aiPanelOpen: open }),
  setSearchQuery: (q) => set({ searchQuery: q }),
}))
