'use client'

import * as React from 'react'
import { motion } from 'framer-motion'
import { X, Mail, Lock, Loader2, ShieldCheck, User, ArrowRight, Sparkles } from 'lucide-react'
import { useAppStore } from '@/lib/store'
import { useAuth } from '@/lib/auth-context'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

export function AuthModal() {
  const { aiPanelOpen, setView } = useAppStore()
  const { login, register } = useAuth()
  const [open, setOpen] = React.useState(false)
  const [mode, setMode] = React.useState<'login' | 'register'>('login')
  const [email, setEmail] = React.useState('')
  const [password, setPassword] = React.useState('')
  const [name, setName] = React.useState('')
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  // Expose open function globally via store event
  React.useEffect(() => {
    const handler = () => setOpen(true)
    window.addEventListener('veridian:open-auth', handler)
    return () => window.removeEventListener('veridian:open-auth', handler)
  }, [])

  const submit = async () => {
    setError(null)
    setLoading(true)
    try {
      const result = mode === 'login'
        ? await login(email, password)
        : await register(name, email, password)
      if (!result.ok) {
        setError(result.error || 'Failed')
      } else {
        toast.success(mode === 'login' ? 'Welcome back!' : 'Account created!')
        setOpen(false)
        setEmail(''); setPassword(''); setName('')
      }
    } finally {
      setLoading(false)
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={() => setOpen(false)}>
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="w-full max-w-md overflow-hidden rounded-2xl bg-card shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="relative overflow-hidden bg-gradient-to-br from-primary/10 to-accent/30 px-6 py-5">
          <button onClick={() => setOpen(false)} className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground hover:bg-accent hover:text-foreground">
            <X className="h-4 w-4" />
          </button>
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold">{mode === 'login' ? 'Welcome back' : 'Create account'}</h2>
              <p className="text-[11px] text-muted-foreground">{mode === 'login' ? 'Sign in to your Veridian account' : 'Join Veridian — it\'s free'}</p>
            </div>
          </div>
        </div>

        {/* Form */}
        <div className="space-y-3 p-6">
          {mode === 'register' && (
            <div>
              <label className="mb-1 flex items-center gap-1 text-[11px] font-medium text-muted-foreground"><User className="h-3.5 w-3.5" /> Name</label>
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" className={inputCls} />
            </div>
          )}
          <div>
            <label className="mb-1 flex items-center gap-1 text-[11px] font-medium text-muted-foreground"><Mail className="h-3.5 w-3.5" /> Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@email.com" className={inputCls} />
          </div>
          <div>
            <label className="mb-1 flex items-center gap-1 text-[11px] font-medium text-muted-foreground"><Lock className="h-3.5 w-3.5" /> Password</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') submit() }} placeholder="••••••••" className={inputCls} />
          </div>
          {error && <p className="text-xs font-medium text-destructive">{error}</p>}

          <div className="rounded-lg bg-primary/5 p-2.5 text-[10px] text-muted-foreground">
            <Sparkles className="mb-0.5 inline h-3 w-3 text-primary" /> Demo admin: <strong>admin@veridian.app</strong> / <strong>admin123</strong>
          </div>

          <Button className="w-full gap-1.5" onClick={submit} disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {mode === 'login' ? 'Sign in' : 'Create account'}
            {!loading && <ArrowRight className="h-4 w-4" />}
          </Button>

          <div className="text-center text-[11px] text-muted-foreground">
            {mode === 'login' ? (
              <>Don't have an account? <button onClick={() => { setMode('register'); setError(null) }} className="font-medium text-primary hover:underline">Sign up</button></>
            ) : (
              <>Already have an account? <button onClick={() => { setMode('login'); setError(null) }} className="font-medium text-primary hover:underline">Sign in</button></>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  )
}

const inputCls = 'h-10 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-primary/20 placeholder:text-muted-foreground'

// Helper to open the auth modal from anywhere
export function openAuthModal() {
  window.dispatchEvent(new Event('veridian:open-auth'))
}
