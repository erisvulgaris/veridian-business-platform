'use client'

import * as React from 'react'
import { Sparkles, Sun, Moon, Bookmark, LayoutGrid, ArrowLeft, Home } from 'lucide-react'
import { useTheme } from 'next-themes'
import { useAppStore } from '@/lib/store'
import { SearchBar } from './search-bar'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export function AppHeader() {
  const { theme, setTheme } = useTheme()
  const { view, setView, goBack, savedBusinessIds, setAiPanel, history } = useAppStore()
  const [mounted, setMounted] = React.useState(false)
  React.useEffect(() => setMounted(true), [])

  const canGoBack = history.length > 0
  const isHome = view.name === 'home'

  return (
    <header className="sticky top-0 z-40 w-full glass-dark border-b border-border/60">
      <div className="mx-auto flex h-14 max-w-[1600px] items-center gap-2 px-3 sm:gap-3 sm:px-4">
        {/* Logo / back */}
        <div className="flex items-center gap-1.5">
          {canGoBack && !isHome ? (
            <Button variant="ghost" size="icon" className="h-9 w-9" onClick={goBack} aria-label="Back">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          ) : null}
          <button
            onClick={() => setView({ name: 'home' })}
            className="flex items-center gap-2 rounded-lg px-1.5 py-1 transition hover:bg-accent"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M12 2L3 7l9 5 9-5-9-5z" strokeLinejoin="round" />
                <path d="M3 12l9 5 9-5" strokeLinejoin="round" />
                <path d="M3 17l9 5 9-5" strokeLinejoin="round" />
              </svg>
            </div>
            <div className="hidden sm:block leading-tight">
              <p className="text-sm font-bold tracking-tight">Veridian</p>
              <p className="text-[9px] text-muted-foreground -mt-0.5">Business Discovery</p>
            </div>
          </button>
        </div>

        {/* Search */}
        <div className="flex-1 max-w-xl mx-auto">
          <SearchBar />
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            className="hidden md:inline-flex h-9 gap-1.5"
            onClick={() => setView({ name: 'dashboard' })}
          >
            <LayoutGrid className="h-4 w-4" />
            <span className="text-xs font-medium">Dashboard</span>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="hidden md:inline-flex h-9 gap-1.5"
            onClick={() => setView({ name: 'saved' })}
          >
            <Bookmark className="h-4 w-4" />
            <span className="text-xs font-medium">Saved</span>
            {savedBusinessIds.length > 0 && (
              <span className="ml-0.5 rounded-full bg-primary px-1.5 text-[10px] font-bold text-primary-foreground">
                {savedBusinessIds.length}
              </span>
            )}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 md:hidden"
            onClick={() => setView({ name: 'saved' })}
            aria-label="Saved"
          >
            <Bookmark className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            className="h-9 gap-1.5 bg-primary text-primary-foreground hover:opacity-90"
            onClick={() => setAiPanel(true)}
          >
            <Sparkles className="h-4 w-4" />
            <span className="hidden sm:inline text-xs font-semibold">Ask AI</span>
          </Button>
          {mounted && (
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
          )}
        </div>
      </div>
    </header>
  )
}
