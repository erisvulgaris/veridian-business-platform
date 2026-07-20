'use client'

import * as React from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Send, Loader2, User, Mail, Phone, Briefcase, FileText, CheckCircle2, ShieldCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

interface ClaimModalProps {
  open: boolean
  onClose: () => void
  businessName: string
  businessSlug: string
}

export function ClaimModal({ open, onClose, businessName, businessSlug }: ClaimModalProps) {
  const [mounted, setMounted] = React.useState(false)
  React.useEffect(() => setMounted(true), [])

  const [form, setForm] = React.useState({
    claimerName: '', claimerEmail: '', claimerPhone: '', role: '', proof: '',
  })
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

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }))

  const submit = async () => {
    setError(null)
    if (!form.claimerName.trim()) { setError('Please enter your name'); return }
    if (!form.claimerEmail.trim() || !/^[^@]+@[^@]+\.[^@]+$/.test(form.claimerEmail)) { setError('Please enter a valid email'); return }
    if (!form.role.trim()) { setError('Please select your role'); return }
    setSubmitting(true)
    try {
      const res = await fetch(`/api/businesses/${businessSlug}/claim`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Failed to submit'); return }
      setSuccess(true)
      toast.success('Claim request submitted')
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
                <h2 className="text-base font-bold">{success ? 'Claim submitted' : 'Claim this business'}</h2>
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
                <p className="text-base font-semibold">Claim request received</p>
                <p className="mt-1 max-w-xs text-sm text-muted-foreground">
                  Our verification team will review your request and contact you within 48 hours. You'll receive a confirmation email at <strong>{form.claimerEmail}</strong>.
                </p>
                <div className="mt-4 flex items-center gap-2 rounded-lg bg-primary/5 p-2.5">
                  <ShieldCheck className="h-4 w-4 text-primary" />
                  <p className="text-[11px] text-muted-foreground">Claiming this business gives you dashboard access to manage profile, products and enquiries.</p>
                </div>
                <Button className="mt-5" onClick={onClose}>Done</Button>
              </div>
            ) : (
              <div className="space-y-3 p-5">
                <div className="flex items-start gap-2 rounded-lg border border-primary/20 bg-primary/5 p-3">
                  <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <p className="text-[11px] text-foreground/80">
                    Claiming <strong>{businessName}</strong> gives you full dashboard access to manage products, services, enquiries, hours and promotions. Verification required.
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Field icon={<User className="h-3.5 w-3.5" />} label="Your name *">
                    <input value={form.claimerName} onChange={set('claimerName')} placeholder="Your full name" className={inputCls} />
                  </Field>
                  <Field icon={<Mail className="h-3.5 w-3.5" />} label="Email *">
                    <input type="email" value={form.claimerEmail} onChange={set('claimerEmail')} placeholder="you@company.com" className={inputCls} />
                  </Field>
                  <Field icon={<Phone className="h-3.5 w-3.5" />} label="Phone">
                    <input value={form.claimerPhone} onChange={set('claimerPhone')} placeholder="+91…" className={inputCls} />
                  </Field>
                  <Field icon={<Briefcase className="h-3.5 w-3.5" />} label="Your role *">
                    <select value={form.role} onChange={set('role')} className={inputCls}>
                      <option value="">Select role</option>
                      <option value="Owner">Owner</option>
                      <option value="Co-founder">Co-founder</option>
                      <option value="Director">Director</option>
                      <option value="Manager">Manager</option>
                      <option value="Authorized representative">Authorized representative</option>
                    </select>
                  </Field>
                </div>
                <Field icon={<FileText className="h-3.5 w-3.5" />} label="Proof of ownership / authorization">
                  <textarea value={form.proof} onChange={set('proof')} rows={3} placeholder="Describe your proof — e.g. business registration number, GSTIN, authorization letter, etc." className={cn(inputCls, 'resize-none')} />
                </Field>
                {error && <p className="text-xs font-medium text-destructive">{error}</p>}
                <div className="flex justify-end gap-2 pt-1">
                  <Button variant="outline" size="sm" onClick={onClose}>Cancel</Button>
                  <Button size="sm" className="gap-1.5" onClick={submit} disabled={submitting}>
                    {submitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                    {submitting ? 'Submitting…' : 'Submit claim'}
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
