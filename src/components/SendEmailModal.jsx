import { useState, useEffect } from 'react'
import Modal from './ui/Modal'
import Button from './ui/Button'
import { Input } from './ui/Input'
import { emailTemplates, emails } from '../api/endpoints'
import { useAuth } from '../context/AuthContext'
import { Send, Eye, EyeOff, Paperclip } from 'lucide-react'

export default function SendEmailModal({ open, onClose, invoice, replyTo }) {
  const { user } = useAuth()
  const [templates, setTemplates]     = useState([])
  const [templateId, setTemplateId]   = useState('')
  const [to, setTo]                   = useState('')
  const [cc, setCc]                   = useState('')
  const [subject, setSubject]         = useState('')
  const [bodyHtml, setBodyHtml]       = useState('')
  const [attachPdf, setAttachPdf]     = useState(true)
  const [preview, setPreview]         = useState(false)
  const [sending, setSending]         = useState(false)
  const [loadingPreview, setLoadingPreview] = useState(false)
  const [sent, setSent]               = useState(false)
  const [error, setError]             = useState('')

  useEffect(() => {
    if (!open) return
    setSent(false)
    setError('')
    emailTemplates.list().then(res => {
      const list = res.templates || []
      setTemplates(list)
      const preferred = list.find(t => t.slug === 'monthly-billing') || list[0]
      if (preferred) setTemplateId(String(preferred.id))
    }).catch(() => {})
    setTo(replyTo || invoice?.accounts_email || invoice?.client_email || '')
    setCc(user?.email || '')
  }, [open, invoice])

  useEffect(() => {
    if (!templateId || !open) return
    setLoadingPreview(true)
    emails.preview({ template_id: parseInt(templateId), invoice_id: invoice?.id })
      .then(res => {
        setSubject(res.subject || '')
        setBodyHtml(res.body_html || '')
      })
      .catch(() => {})
      .finally(() => setLoadingPreview(false))
  }, [templateId, open, invoice?.id])

  const isValidEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim())

  const handleSend = async () => {
    if (!to.trim()) { setError('Recipient email is required.'); return }
    if (!isValidEmail(to)) { setError(`"${to.trim()}" is not a valid email address. Please check and try again.`); return }
    if (cc && !isValidEmail(cc)) { setError(`"${cc.trim()}" is not a valid CC address. Please check and try again.`); return }
    setSending(true)
    setError('')
    try {
      await emails.send({
        template_id: parseInt(templateId),
        invoice_id:  invoice?.id,
        to,
        cc: cc || undefined,
        attach_pdf: attachPdf,
        overrides:  { subject, body_html: bodyHtml },
      })
      setSent(true)
    } catch (e) {
      setError(e?.error || 'The email could not be sent. Please check the recipient address and try again.')
    } finally {
      setSending(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Send Email" size="xl">
      {sent ? (
        <div className="text-center py-8 space-y-3">
          <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center mx-auto">
            <Send size={22} className="text-green-400" />
          </div>
          <p className="text-valo-text font-medium">Email sent successfully</p>
          <p className="text-valo-subtle text-sm">Logged to email history</p>
          <Button variant="secondary" size="sm" onClick={onClose}>Close</Button>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Template selector */}
          <div className="space-y-1">
            <label className="text-xs text-valo-subtle font-medium uppercase tracking-wider">Template</label>
            <select
              value={templateId}
              onChange={e => setTemplateId(e.target.value)}
              className="w-full bg-valo-black border border-valo-border rounded-lg px-3 py-2 text-sm text-valo-text focus:outline-none focus:border-valo-accent"
            >
              {templates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>

          {/* To / CC */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs text-valo-subtle font-medium uppercase tracking-wider">To</label>
              <Input value={to} onChange={e => setTo(e.target.value)} placeholder="recipient@example.com" />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-valo-subtle font-medium uppercase tracking-wider">CC</label>
              <Input value={cc} onChange={e => setCc(e.target.value)} placeholder="Optional" />
            </div>
          </div>

          {/* Subject */}
          <div className="space-y-1">
            <label className="text-xs text-valo-subtle font-medium uppercase tracking-wider">Subject</label>
            <Input value={subject} onChange={e => setSubject(e.target.value)} disabled={loadingPreview} />
          </div>

          {/* Body preview/edit toggle */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="text-xs text-valo-subtle font-medium uppercase tracking-wider">Body</label>
              <button
                onClick={() => setPreview(v => !v)}
                className="flex items-center gap-1 text-xs text-valo-subtle hover:text-valo-text transition-colors"
              >
                {preview ? <><EyeOff size={12} /> Edit HTML</> : <><Eye size={12} /> Preview</>}
              </button>
            </div>
            {loadingPreview ? (
              <div className="h-48 bg-valo-black border border-valo-border rounded-lg flex items-center justify-center text-valo-subtle text-sm">
                Loading preview…
              </div>
            ) : preview ? (
              <div
                className="bg-white rounded-lg overflow-auto max-h-64 border border-valo-border"
                dangerouslySetInnerHTML={{ __html: bodyHtml }}
              />
            ) : (
              <textarea
                value={bodyHtml}
                onChange={e => setBodyHtml(e.target.value)}
                rows={8}
                className="w-full bg-valo-black border border-valo-border rounded-lg px-3 py-2 text-xs text-valo-text font-mono focus:outline-none focus:border-valo-accent resize-y"
              />
            )}
          </div>

          {/* Attach PDF */}
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={attachPdf}
              onChange={e => setAttachPdf(e.target.checked)}
              className="accent-valo-accent w-4 h-4"
            />
            <Paperclip size={13} className="text-valo-subtle" />
            <span className="text-sm text-valo-text">Attach PDF invoice</span>
          </label>

          {error && <p className="text-xs text-red-400">{error}</p>}

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" size="sm" onClick={onClose} disabled={sending}>Cancel</Button>
            <Button variant="primary" size="sm" onClick={handleSend} loading={sending}>
              <Send size={13} /> Send Email
            </Button>
          </div>
        </div>
      )}
    </Modal>
  )
}
