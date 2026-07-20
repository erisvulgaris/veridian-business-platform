'use client'

import * as React from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Send, Loader2, User, Mail, MessageSquare, CheckCircle2, MessagesSquare } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

interface MessageModalProps {
  open: boolean
  onClose: () => void
  businessName: string
  businessSlug: string
}

export function MessageModal({ open, onClose, businessName, businessSlug }: MessageModalProps) {
  const [mounted, setMounted] = React.useState(false)
  React.useEffect(() => setMounted(true), [])

  const [form, setForm] = React.useState({ name: '', email: '', message: '' })
  const [submitting, setSubmitting] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [success, setSuccess] = React.useState(false)

  React.useEffect(() => {
    if (open) { setSuccess(false); setError(null) }
  }, [open])

  React.useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => { window.removeEventListener('keydown', onKey); document.body.style.overflow = '' }
  }, [open, onClose])

  if (!mounted) return null

  const submit = async () => {
    setError(null)
    if (!form.name.trim()) { setError('Please enter your name'); return }
    if (!form.email.trim() || !/^[^@]+@[^@]+\.[^@]+$/.test(form.email)) { setError('Please enter a valid email'); return }
    if (!form.message.trim()) { setError('Please enter a message'); return }
    setSubmitting(true)
    try {
      const res = await fetch(`/api/businesses/${businessSlug}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          senderName: form.name,
          senderEmail: form.email,
          content: form.message,
          senderRole: 'customer',
        }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Failed to send'); return }
      setSuccess(true)
      toast.success('Message sent')
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[90] flex items-end justify-center bg-black/50 backdrop-blur-sm sm:items-center sm:p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ y: 40, opacity: 0, scale: 0.98 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 40, opacity: 0, scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 320, damping: 32 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md max-h-[92vh] overflow-y-auto scrollbar-thin rounded-t-2xl bg-card shadow-2xl sm:rounded-2xl"
          >
            {/* Header */}
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-card/95 px-5 py-3.5 backdrop-blur">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <MessagesSquare className="h-4 w-4" />
                </div>
                <div>
                  <h2 className="text-sm font-bold">{success ? 'Message sent' : `Message ${businessName}`}</h2>
                  <p className="text-[10px] text-muted-foreground">{success ? 'We\'ll notify you of replies' : 'Start a conversation'}</p>
                </div>
              </div>
              <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground hover:bg-accent hover:text-foreground" aria-label="Close">
                <X className="h-4 w-4" />
              </button>
            </div>

            {success ? (
              <div className="flex flex-col items-center justify-center px-6 py-10 text-center">
                <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/10">
                  <CheckCircle2 className="h-7 w-7 text-emerald-600 dark:text-emerald-400" />
                </div>
                <p className="text-sm font-semibold">Your message is on its way</p>
                <p className="mt-1 max-w-xs text-xs text-muted-foreground">
                  {businessName} typically responds within an hour. Check your email ({form.email}) for replies.
                </p>
                <Button className="mt-4" size="sm" onClick={onClose}>Done</Button>
              </div>
            ) : (
              <div className="space-y-3 p-5">
                <Field icon={<User className="h-3.5 w-3.5" />} label="Your name *">
                  <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Your name" className={inputCls} />
                </Field>
                <Field icon={<Mail className="h-3.5 w-3.5" />} label="Email *">
                  <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="you@email.com" className={inputCls} />
                </Field>
                <Field icon={<MessageSquare className="h-3.5 w-3.5" />} label="Message *">
                  <textarea
                    value={form.message}
                    onChange={(e) => setForm({ ...form, message: e.target.value })}
                    rows={4}
                    placeholder={`Hi ${businessName}, I'd like to know more about…`}
                    className={cn(inputCls, 'resize-none')}
                  />
                  <p className="mt-1 text-right text-[10px] text-muted-foreground">{form.message.length}/2000</p>
                </Field>
                {error && <p className="text-xs font-medium text-destructive">{error}</p>}
                <div className="flex justify-end gap-2 pt-1">
                  <Button variant="outline" size="sm" onClick={onClose}>Cancel</Button>
                  <Button size="sm" className="gap-1.5" onClick={submit} disabled={submitting}>
                    {submitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                    {submitting ? 'Sending…' : 'Send message'}
                  </Button>
                </div>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  )
}

const inputCls = 'h-9 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-primary/20 placeholder:text-muted-foreground'

function Field({ icon, label, children }: { icon: React.ReactNode; label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 flex items-center gap-1 text-[11px] font-medium text-muted-foreground">{icon}{label}</span>
      {children}
    </label>
  )
}
