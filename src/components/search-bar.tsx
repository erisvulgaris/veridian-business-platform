'use client'

import * as React from 'react'
import { Search, Sparkles, X, TrendingUp, MapPin, CornerDownLeft } from 'lucide-react'
import { useAppStore } from '@/lib/store'
import { cn } from '@/lib/utils'

const QUICK_SEARCHES = [
  'Steel supplier near me',
  'CNC machining manufacturer',
  'B2B packaging supplier',
  'Industrial bearings wholesale',
  'Organic rice bulk supplier',
  'Solar panel EPC company',
  'Logistics & warehousing partner',
  'Custom PCB assembly',
]

export function SearchBar({ autoFocus = false, large = false }: { autoFocus?: boolean; large?: boolean }) {
  const { setSearchQuery, setView, searchQuery } = useAppStore()
  const [value, setValue] = React.useState(searchQuery)
  const [focused, setFocused] = React.useState(false)
  const [suggestions, setSuggestions] = React.useState<string[]>([])
  const inputRef = React.useRef<HTMLInputElement>(null)

  React.useEffect(() => {
    setValue(searchQuery)
  }, [searchQuery])

  React.useEffect(() => {
    if (!focused || !value) {
      setSuggestions([])
      return
    }
    // local quick suggestions
    const matches = QUICK_SEARCHES.filter((q) => q.toLowerCase().includes(value.toLowerCase())).slice(0, 5)
    setSuggestions(matches)
  }, [value, focused])

  const submit = (q?: string) => {
    const query = (q ?? value).trim()
    if (!query) return
    setValue(query)
    setSearchQuery(query)
    setView({ name: 'search', query })
    setFocused(false)
    inputRef.current?.blur()
  }

  return (
    <div className={cn('relative w-full', large && 'max-w-2xl')}>
      <div
        className={cn(
          'flex items-center gap-2 rounded-full bg-card border transition-all',
          large ? 'h-12 px-4' : 'h-10 px-3.5',
          focused ? 'border-primary ring-2 ring-primary/15 shadow-sm' : 'border-border hover:border-primary/40'
        )}
      >
        <Search className={cn('shrink-0 text-muted-foreground', large ? 'h-5 w-5' : 'h-4 w-4')} />
        <input
          ref={inputRef}
          value={value}
          autoFocus={autoFocus}
          onChange={(e) => setValue(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setTimeout(() => setFocused(false), 150)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') submit()
            if (e.key === 'Escape') inputRef.current?.blur()
          }}
          placeholder="Search businesses, products, services…"
          className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
        />
        {value && (
          <button
            onClick={() => { setValue(''); setSearchQuery(''); inputRef.current?.focus() }}
            className="flex h-6 w-6 items-center justify-center rounded-full text-muted-foreground hover:bg-accent hover:text-foreground"
            aria-label="Clear"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
        <button
          onClick={() => submit()}
          className={cn(
            'inline-flex shrink-0 items-center gap-1 rounded-full bg-primary font-semibold text-primary-foreground transition hover:opacity-90',
            large ? 'h-8 px-4 text-sm' : 'h-7 px-3 text-xs'
          )}
        >
          <Sparkles className={cn(large ? 'h-3.5 w-3.5' : 'h-3 w-3')} />
          <span className="hidden sm:inline">Search</span>
        </button>
      </div>

      {/* Suggestions dropdown */}
      {focused && (suggestions.length > 0 || !value) && (
        <div className="absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-2xl border bg-popover shadow-xl animate-scale-in">
          {!value && (
            <div className="border-b p-3">
              <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Try asking</p>
              <div className="flex flex-wrap gap-1.5">
                {QUICK_SEARCHES.map((q) => (
                  <button
                    key={q}
                    onMouseDown={(e) => { e.preventDefault(); submit(q) }}
                    className="inline-flex items-center gap-1 rounded-full bg-secondary px-2.5 py-1 text-[11px] text-secondary-foreground transition hover:bg-accent hover:text-accent-foreground"
                  >
                    {q.includes('near') ? <MapPin className="h-3 w-3" /> : <TrendingUp className="h-3 w-3" />}
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}
          {suggestions.length > 0 && (
            <div className="p-1.5">
              {suggestions.map((s) => (
                <button
                  key={s}
                  onMouseDown={(e) => { e.preventDefault(); submit(s) }}
                  className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm transition hover:bg-accent"
                >
                  <Search className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="flex-1">{s}</span>
                  <CornerDownLeft className="h-3 w-3 text-muted-foreground/50" />
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
