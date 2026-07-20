import { create } from 'zustand'
import type { Business, Product, Service } from './types'

// localStorage persistence for user data (saved, recently-viewed, compare, filters, theme prefs)
const STORAGE_KEY = 'veridian:user-state:v1'

interface PersistedState {
  savedBusinessIds: string[]
  savedProductIds: string[]
  followedBusinessIds: string[]
  compareIds: string[]
  recentlyViewed: string[]
  activeCategories: string[]
  filters: { openNow: boolean; verifiedOnly: boolean; minRating: number }
}

function loadPersisted(): Partial<PersistedState> {
  if (typeof window === 'undefined') return {}
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return {}
    return JSON.parse(raw) as Partial<PersistedState>
  } catch {
    return {}
  }
}

function savePersisted(state: PersistedState) {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {
    // ignore quota / privacy mode errors
  }
}

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
  followedBusinessIds: string[]
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
  toggleFollow: (id: string) => void
  toggleCompare: (id: string) => void
  clearCompare: () => void
  addRecentlyViewed: (id: string) => void
  clearRecentlyViewed: () => void
  setAiPanel: (open: boolean) => void
  setSearchQuery: (q: string) => void
}

export const useAppStore = create<AppState>((set, get) => {
  // Hydrate persisted user state on the client
  const persisted = loadPersisted()

  return {
  view: { name: 'home' },
  history: [],
  selectedBusinessId: null,
  hoveredBusinessId: null,
  mapCenter: { lat: 28.6139, lng: 77.209 },
  mapZoom: 13,
  activeCategories: persisted.activeCategories ?? [],
  filters: persisted.filters ?? { openNow: false, verifiedOnly: false, minRating: 0 },
  savedBusinessIds: persisted.savedBusinessIds ?? [],
  savedProductIds: persisted.savedProductIds ?? [],
  followedBusinessIds: persisted.followedBusinessIds ?? [],
  compareIds: persisted.compareIds ?? [],
  recentlyViewed: persisted.recentlyViewed ?? [],
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
    set((s) => {
      const activeCategories = s.activeCategories.includes(slug)
        ? s.activeCategories.filter((c) => c !== slug)
        : [...s.activeCategories, slug]
      savePersisted({ ...get(), activeCategories } as PersistedState)
      return { activeCategories }
    }),
  clearCategories: () => { savePersisted({ ...get(), activeCategories: [] } as PersistedState); set({ activeCategories: [] }) },
  toggleFilter: (key, value) =>
    set((s) => {
      const filters = {
        ...s.filters,
        [key]: value === undefined ? !s.filters[key] : value,
      }
      savePersisted({ ...get(), filters } as PersistedState)
      return { filters }
    }),
  setMinRating: (r) =>
    set((s) => {
      const filters = { ...s.filters, minRating: r === s.filters.minRating ? 0 : r }
      savePersisted({ ...get(), filters } as PersistedState)
      return { filters }
    }),
  toggleSaveBusiness: (id) =>
    set((s) => {
      const savedBusinessIds = s.savedBusinessIds.includes(id)
        ? s.savedBusinessIds.filter((x) => x !== id)
        : [...s.savedBusinessIds, id]
      savePersisted({ ...get(), savedBusinessIds } as PersistedState)
      return { savedBusinessIds }
    }),
  toggleSaveProduct: (id) =>
    set((s) => {
      const savedProductIds = s.savedProductIds.includes(id)
        ? s.savedProductIds.filter((x) => x !== id)
        : [...s.savedProductIds, id]
      savePersisted({ ...get(), savedProductIds } as PersistedState)
      return { savedProductIds }
    }),
  toggleFollow: (id) =>
    set((s) => {
      const followedBusinessIds = s.followedBusinessIds.includes(id)
        ? s.followedBusinessIds.filter((x) => x !== id)
        : [...s.followedBusinessIds, id]
      savePersisted({ ...get(), followedBusinessIds } as PersistedState)
      return { followedBusinessIds }
    }),
  toggleCompare: (id) =>
    set((s) => {
      const compareIds = s.compareIds.includes(id)
        ? s.compareIds.filter((x) => x !== id)
        : s.compareIds.length >= 3
          ? s.compareIds
          : [...s.compareIds, id]
      savePersisted({ ...get(), compareIds } as PersistedState)
      return { compareIds }
    }),
  clearCompare: () => { savePersisted({ ...get(), compareIds: [] } as PersistedState); set({ compareIds: [] }) },
  addRecentlyViewed: (id) =>
    set((s) => {
      const recentlyViewed = [id, ...s.recentlyViewed.filter((x) => x !== id)].slice(0, 12)
      savePersisted({ ...get(), recentlyViewed } as PersistedState)
      return { recentlyViewed }
    }),
  clearRecentlyViewed: () => { savePersisted({ ...get(), recentlyViewed: [] } as PersistedState); set({ recentlyViewed: [] }) },
  setAiPanel: (open) => set({ aiPanelOpen: open }),
  setSearchQuery: (q) => set({ searchQuery: q }),
}})
