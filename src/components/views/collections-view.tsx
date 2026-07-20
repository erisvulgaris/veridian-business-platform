'use client'

import * as React from 'react'
import useSWR from 'swr'
import {
  FolderOpen, FolderPlus, Trash2, Edit3, Check, X, Plus, Bookmark,
  Sparkles, Folder, ArrowRight,
} from 'lucide-react'
import { useAppStore } from '@/lib/store'
import type { Business } from '@/lib/types'
import { BusinessCard } from '@/components/business-card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export function CollectionsView() {
  const { collections, createCollection, deleteCollection, renameCollection, setActiveCollection, setView } = useAppStore()
  const [creating, setCreating] = React.useState(false)
  const [newName, setNewName] = React.useState('')
  const [editingId, setEditingId] = React.useState<string | null>(null)
  const [editName, setEditName] = React.useState('')

  const submitCreate = () => {
    if (!newName.trim()) { toast.error('Please enter a name'); return }
    const id = createCollection(newName)
    toast.success('Collection created')
    setNewName('')
    setCreating(false)
    setActiveCollection(id)
  }

  const startEdit = (id: string, name: string) => {
    setEditingId(id)
    setEditName(name)
  }
  const submitEdit = () => {
    if (editingId && editName.trim()) {
      renameCollection(editingId, editName)
      toast.success('Collection renamed')
    }
    setEditingId(null)
    setEditName('')
  }

  return (
    <div className="mx-auto max-w-6xl px-3 py-4 sm:px-4">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <FolderOpen className="h-4 w-4 text-primary" />
            <h1 className="text-xl font-bold tracking-tight sm:text-2xl">Collections</h1>
          </div>
          <p className="text-xs text-muted-foreground">Organize businesses into named lists for projects, comparisons or later reference.</p>
        </div>
        <Button size="sm" className="gap-1.5" onClick={() => setCreating((s) => !s)}>
          <FolderPlus className="h-3.5 w-3.5" /> New collection
        </Button>
      </div>

      {creating && (
        <div className="mb-4 flex items-center gap-2 rounded-xl border-2 border-primary/20 bg-primary/[0.03] p-3 animate-scale-in">
          <FolderPlus className="h-4 w-4 text-primary" />
          <input
            autoFocus
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') submitCreate(); if (e.key === 'Escape') setCreating(false) }}
            placeholder="Collection name (e.g. 'Office suppliers', 'Home renovation')"
            className="h-9 flex-1 rounded-lg border border-border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-primary/20"
          />
          <Button size="sm" className="gap-1" onClick={submitCreate}><Check className="h-3.5 w-3.5" /> Create</Button>
          <Button size="sm" variant="ghost" onClick={() => setCreating(false)}><X className="h-3.5 w-3.5" /></Button>
        </div>
      )}

      {collections.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border py-16 text-center">
          <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-2xl bg-secondary text-muted-foreground">
            <Folder className="h-7 w-7" />
          </div>
          <p className="text-sm font-semibold">No collections yet</p>
          <p className="mt-1 max-w-sm text-xs text-muted-foreground">
            Create your first collection to group businesses by project, category or any theme you like.
          </p>
          <Button className="mt-4 gap-1.5" onClick={() => setCreating(true)}>
            <FolderPlus className="h-3.5 w-3.5" /> Create collection
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {collections.map((c) => (
            <div key={c.id} className="group rounded-2xl border border-border bg-card p-4 card-elevated transition hover:border-primary/30">
              <div className="flex items-start justify-between gap-2">
                <div className="flex min-w-0 items-center gap-2">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Folder className="h-4 w-4" />
                  </div>
                  {editingId === c.id ? (
                    <input
                      autoFocus
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') submitEdit(); if (e.key === 'Escape') setEditingId(null) }}
                      className="h-8 min-w-0 flex-1 rounded-lg border border-border bg-background px-2 text-sm font-semibold outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  ) : (
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold">{c.name}</p>
                      <p className="text-[10px] text-muted-foreground">{c.businessIds.length} business{c.businessIds.length !== 1 ? 'es' : ''}</p>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-0.5 opacity-0 transition group-hover:opacity-100">
                  {editingId === c.id ? (
                    <>
                      <button onClick={submitEdit} className="flex h-7 w-7 items-center justify-center rounded-lg text-emerald-600 hover:bg-emerald-500/10"><Check className="h-3.5 w-3.5" /></button>
                      <button onClick={() => setEditingId(null)} className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground hover:bg-accent"><X className="h-3.5 w-3.5" /></button>
                    </>
                  ) : (
                    <>
                      <button onClick={() => startEdit(c.id, c.name)} className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground"><Edit3 className="h-3.5 w-3.5" /></button>
                      <button onClick={() => { if (confirm(`Delete "${c.name}"?`)) { deleteCollection(c.id); toast.success('Collection deleted') } }} className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground hover:bg-rose-500/10 hover:text-rose-500"><Trash2 className="h-3.5 w-3.5" /></button>
                    </>
                  )}
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="mt-3 w-full gap-1.5"
                onClick={() => { setActiveCollection(c.id); setView({ name: 'saved' }) }}
              >
                Open collection <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
