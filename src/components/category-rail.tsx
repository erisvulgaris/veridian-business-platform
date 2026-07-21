'use client'

import * as React from 'react'
import {
  Factory, Cog, Package, Wrench, Boxes, Truck, Monitor, Building,
  Sprout, Shirt, CircuitBoard, FlaskConical, Ship, type LucideIcon,
} from 'lucide-react'
import { useAppStore } from '@/lib/store'
import type { Category } from '@/lib/types'
import { cn } from '@/lib/utils'

const ICONS: Record<string, LucideIcon> = {
  Factory, Cog, Package, Wrench, Boxes, Truck, Monitor, Building,
  Sprout, Shirt, CircuitBoard, FlaskConical, Ship,
}

export function CategoryRail({ categories }: { categories: Category[] }) {
  const { activeCategories, toggleCategory, clearCategories } = useAppStore()
  const scrollRef = React.useRef<HTMLDivElement>(null)

  return (
    <div className="relative">
      <div
        ref={scrollRef}
        className="no-scrollbar flex gap-2 overflow-x-auto pb-1"
      >
        <button
          onClick={clearCategories}
          className={cn(
            'shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium transition',
            activeCategories.length === 0
              ? 'border-primary bg-primary text-primary-foreground'
              : 'border-border bg-card text-muted-foreground hover:text-foreground hover:border-primary/40'
          )}
        >
          All
        </button>
        {categories.map((c) => {
          const Icon = ICONS[c.icon] || Building2
          const active = activeCategories.includes(c.slug)
          return (
            <button
              key={c.id}
              onClick={() => toggleCategory(c.slug)}
              className={cn(
                'group inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition',
                active
                  ? 'border-primary bg-primary text-primary-foreground shadow-sm'
                  : 'border-border bg-card text-muted-foreground hover:text-foreground hover:border-primary/40'
              )}
              style={active ? {} : { color: undefined }}
            >
              <Icon
                className="h-3.5 w-3.5"
                style={{ color: active ? undefined : c.color }}
              />
              {c.name}
              <span className={cn(
                'ml-0.5 rounded-full px-1.5 text-[10px] font-semibold',
                active ? 'bg-primary-foreground/20 text-primary-foreground' : 'bg-secondary text-muted-foreground'
              )}>
                {c.count}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
