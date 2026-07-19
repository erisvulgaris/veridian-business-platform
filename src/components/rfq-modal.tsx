'use client'

import * as React from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Send, Loader2, Mail, Phone, Building2, User, MessageSquare, Package, IndianRupee, Clock, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

interface RFQModalProps {
  open: boolean
  onClose: () => void
  businessId: string
  businessName: string
  businessSlug: string
  context?: { type: 'product' | 'service'; name: string; id?: string }
}

export function RFQModal({ open, onClose, businessId, businessName, businessSlug, context }: RFQModalProps) {
  const [mounted, setMounted] = React.useState(false)
  React.useEffect(() => setMounted(true), [])

  const [form, setForm] = React.useState({
    customerName: '', customerEmail: '', customerPhone: '', company: '',
    subject: '', message: '', quantity: '', budget: '', timeline: '',
  })
  const [submitting, setSubmitting] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [success, setSuccess] = React.useState(false)

  React.useEffect(() => {
    if (open) {
      setSuccess(false)
      setError(null)
      if (context?.name) {
        setForm((f) => ({ ...f, subject: `Enquiry: ${context.name}`, message: `I'm interested in ${context.name}${context.type === 'product' ? ' and would like a quotation' : ''}. Please share details.` }))
      }
    }
  }, [open, context])

  React.useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => { window.removeEventListener('keydown', onKey); document.body.style.overflow = '' }
  }, [open, onClose])

  if (!mounted) return null

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }))

  const submit = async () => {
    setError(null)
    if (!form.customerName.trim()) { setError('Please enter your name'); return }
    if (!form.customerEmail.trim() || !/^[^@]+@[^@]+\.[^@]+$/.test(form.customerEmail)) { setError('Please enter a valid email'); return }
    if (!form.message.trim()) { setError('Please enter your message'); return }
    setSubmitting(true)
    try {
      const res = await fetch(`/api/businesses/${businessSlug}/enquiries`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          productId: context?.type === 'product' ? context?.id : undefined,
          serviceName: context?.type === 'service' ? context?.name : undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Failed to send'); return }
      setSuccess(true)
      toast.success('Request sent to ' + businessName)
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
            className="w-full max-w-lg max-h-[92vh] overflow-y-auto scrollbar-thin rounded-t-2xl bg-card shadow-2xl sm:rounded-2xl"
          >
            {/* Header */}
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-card/95 px-5 py-3.5 backdrop-blur">
              <div>
                <h2 className="text-base font-bold">{success ? 'Request sent' : 'Request a quotation'}</h2>
                <p className="text-[11px] text-muted-foreground">{businessName}</p>
              </div>
              <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground hover:bg-accent hover:text-foreground" aria-label="Close">
                <X className="h-4 w-4" />
              </button>
            </div>

            {success ? (
              <div className="flex flex-col items-center justify-center px-6 py-12 text-center">
                <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/10">
                  <CheckCircle2 className="h-7 w-7 text-emerald-600 dark:text-emerald-400" />
                </div>
                <p className="text-base font-semibold">Your request is on its way</p>
                <p className="mt-1 max-w-xs text-sm text-muted-foreground">
                  {businessName} typically responds within an hour. We've sent your details — check your email for confirmation.
                </p>
                <Button className="mt-5" onClick={onClose}>Done</Button>
              </div>
            ) : (
              <div className="space-y-3 p-5">
                {context?.name && (
                  <div className="flex items-center gap-2 rounded-lg border border-primary/20 bg-primary/5 px-3 py-2 text-xs">
                    <Package className="h-3.5 w-3.5 text-primary" />
                    <span className="text-muted-foreground">Regarding:</span>
                    <span className="font-medium text-foreground">{context.name}</span>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-3">
                  <Field icon={<User className="h-3.5 w-3.5" />} label="Your name *">
                    <input value={form.customerName} onChange={set('customerName')} placeholder="Rahul Mehta" className={inputCls} />
                  </Field>
                  <Field icon={<Mail className="h-3.5 w-3.5" />} label="Email *">
                    <input type="email" value={form.customerEmail} onChange={set('customerEmail')} placeholder="you@email.com" className={inputCls} />
                  </Field>
                  <Field icon={<Phone className="h-3.5 w-3.5" />} label="Phone">
                    <input value={form.customerPhone} onChange={set('customerPhone')} placeholder="+91…" className={inputCls} />
                  </Field>
                  <Field icon={<Building2 className="h-3.5 w-3.5" />} label="Company">
                    <input value={form.company} onChange={set('company')} placeholder="Optional" className={inputCls} />
                  </Field>
                </div>
                <Field icon={<MessageSquare className="h-3.5 w-3.5" />} label="Subject">
                  <input value={form.subject} onChange={set('subject')} placeholder="Enquiry" className={inputCls} />
                </Field>
                <Field label="Message *">
                  <textarea value={form.message} onChange={set('message')} rows={4} placeholder="Describe what you need, quantities, specifications…" className={cn(inputCls, 'resize-none')} />
                </Field>
                <div className="grid grid-cols-3 gap-3">
                  <Field icon={<Package className="h-3.5 w-3.5" />} label="Quantity">
                    <input value={form.quantity} onChange={set('quantity')} placeholder="200 units" className={inputCls} />
                  </Field>
                  <Field icon={<IndianRupee className="h-3.5 w-3.5" />} label="Budget">
                    <input value={form.budget} onChange={set('budget')} placeholder="₹50k" className={inputCls} />
                  </Field>
                  <Field icon={<Clock className="h-3.5 w-3.5" />} label="Timeline">
                    <input value={form.timeline} onChange={set('timeline')} placeholder="2 weeks" className={inputCls} />
                  </Field>
                </div>
                {error && <p className="text-xs font-medium text-destructive">{error}</p>}
                <div className="flex justify-end gap-2 pt-1">
                  <Button variant="outline" size="sm" onClick={onClose}>Cancel</Button>
                  <Button size="sm" className="gap-1.5" onClick={submit} disabled={submitting}>
                    {submitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                    {submitting ? 'Sending…' : 'Send request'}
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

function Field({ icon, label, children }: { icon?: React.ReactNode; label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 flex items-center gap-1 text-[11px] font-medium text-muted-foreground">
        {icon}{label}
      </span>
      {children}
    </label>
  )
}
