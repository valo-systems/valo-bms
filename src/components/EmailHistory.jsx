import { useEffect, useState } from 'react'
import { emails } from '../api/endpoints'
import { Mail, CheckCircle, XCircle, ChevronDown, ChevronUp } from 'lucide-react'
import { format } from 'date-fns'

export default function EmailHistory({ invoiceId }) {
  const [log, setLog]         = useState([])
  const [open, setOpen]       = useState(false)
  const [expanded, setExpanded] = useState(null)

  useEffect(() => {
    if (!open) return
    emails.log({ invoice_id: invoiceId })
      .then(res => setLog(res.log || []))
      .catch(() => {})
  }, [open, invoiceId])

  return (
    <div className="bg-valo-card border border-valo-border rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between px-5 py-3.5 text-left hover:bg-valo-dark transition-colors"
      >
        <div className="flex items-center gap-2.5">
          <Mail size={15} className="text-valo-subtle" />
          <span className="text-sm font-medium text-valo-text">Email History</span>
          {log.length > 0 && (
            <span className="text-xs bg-valo-dark text-valo-subtle px-2 py-0.5 rounded-full border border-valo-border">{log.length}</span>
          )}
        </div>
        {open ? <ChevronUp size={14} className="text-valo-subtle" /> : <ChevronDown size={14} className="text-valo-subtle" />}
      </button>

      {open && (
        <div className="border-t border-valo-border">
          {log.length === 0 ? (
            <div className="px-5 py-6 text-center text-valo-subtle text-sm">No emails sent for this invoice yet.</div>
          ) : (
            <div className="divide-y divide-valo-border">
              {log.map(entry => (
                <div key={entry.id} className="px-5 py-3">
                  <div className="flex items-start gap-3">
                    {entry.status === 'sent'
                      ? <CheckCircle size={14} className="text-green-400 mt-0.5 shrink-0" />
                      : <XCircle    size={14} className="text-red-400 mt-0.5 shrink-0" />
                    }
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <span className="text-sm text-valo-text truncate">{entry.subject}</span>
                        <span className="text-xs text-valo-muted shrink-0">
                          {entry.sent_at ? format(new Date(entry.sent_at), 'd MMM yyyy, HH:mm') : ''}
                        </span>
                      </div>
                      <div className="text-xs text-valo-subtle mt-0.5">
                        To: {entry.to}{entry.cc ? ` · CC: ${entry.cc}` : ''}
                        {entry.template_name ? ` · ${entry.template_name}` : ''}
                      </div>
                      {entry.error && (
                        <div className="text-xs text-red-400 mt-0.5">{entry.error}</div>
                      )}
                      <button
                        onClick={() => setExpanded(expanded === entry.id ? null : entry.id)}
                        className="text-xs text-valo-accent hover:underline mt-1"
                      >
                        {expanded === entry.id ? 'Hide' : 'View'} email
                      </button>
                      {expanded === entry.id && (
                        <div
                          className="mt-2 bg-white rounded-lg p-3 max-h-64 overflow-auto border border-valo-border text-xs"
                          dangerouslySetInnerHTML={{ __html: entry.body_html }}
                        />
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
