import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { inbox } from '../api/endpoints'
import Button from '../components/ui/Button'
import { PageHeader } from '../components/ui/Typography'
import { Mail, RefreshCw, ExternalLink, Circle } from 'lucide-react'
import { format } from 'date-fns'
import SendEmailModal from '../components/SendEmailModal'

export default function Inbox() {
  const [messages, setMessages]   = useState([])
  const [unread, setUnread]       = useState(0)
  const [expanded, setExpanded]   = useState(null)
  const [syncing, setSyncing]     = useState(false)
  const [replyTo, setReplyTo]     = useState(null)
  const [filter, setFilter]       = useState('all')

  const load = () =>
    inbox.list({ unread: filter === 'unread' ? 1 : undefined })
      .then(r => { setMessages(r.messages || []); setUnread(r.unread_count || 0) })
      .catch(() => {})

  useEffect(() => { load() }, [filter])

  const handleSync = async () => {
    setSyncing(true)
    try { await inbox.sync(); await load() }
    catch (e) { alert(e?.error || 'Sync failed - check IMAP credentials') }
    finally { setSyncing(false) }
  }

  const handleExpand = async (msg) => {
    if (expanded === msg.id) { setExpanded(null); return }
    setExpanded(msg.id)
    if (!msg.read_at) {
      await inbox.markRead(msg.id).catch(() => {})
      setMessages(prev => prev.map(m => m.id === msg.id ? { ...m, read_at: new Date().toISOString() } : m))
      setUnread(prev => Math.max(0, prev - 1))
    }
  }

  const filtered = messages

  return (
    <div className="max-w-4xl space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <PageHeader
          title={<span>Inbox {unread > 0 && <span className="ml-2 text-xs bg-valo-accent text-valo-black px-2 py-0.5 rounded-full font-semibold">{unread}</span>}</span>}
          subtitle="Replies from clients to billing@valosystems.co.za"
        />
        <Button variant="secondary" size="sm" onClick={handleSync} loading={syncing}>
          <RefreshCw size={13} /> Sync Inbox
        </Button>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 border-b border-valo-border pb-0">
        {['all', 'unread'].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px capitalize ${
              filter === f ? 'border-valo-accent text-valo-accent' : 'border-transparent text-valo-subtle hover:text-valo-text'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      <div className="bg-valo-card border border-valo-border rounded-xl overflow-hidden">
        {filtered.length === 0 ? (
          <div className="py-16 text-center space-y-3">
            <Mail size={28} className="text-valo-subtle mx-auto" />
            <p className="text-valo-subtle text-sm">{filter === 'unread' ? 'No unread messages.' : 'No messages yet. Click Sync Inbox to check for replies.'}</p>
          </div>
        ) : (
          <div className="divide-y divide-valo-border">
            {filtered.map(msg => (
              <div key={msg.id}>
                <button
                  onClick={() => handleExpand(msg)}
                  className={`w-full text-left px-5 py-4 hover:bg-valo-dark transition-colors ${!msg.read_at ? 'bg-valo-accent/5' : ''}`}
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-1 shrink-0">
                      {!msg.read_at
                        ? <Circle size={8} className="text-valo-accent fill-valo-accent" />
                        : <Circle size={8} className="text-valo-border fill-valo-border" />
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <span className={`text-sm truncate ${!msg.read_at ? 'font-semibold text-valo-text' : 'text-valo-text'}`}>
                          {msg.from_name ? `${msg.from_name} <${msg.from_address}>` : msg.from_address}
                        </span>
                        <span className="text-xs text-valo-muted shrink-0">
                          {msg.received_at ? format(new Date(msg.received_at), 'd MMM yyyy, HH:mm') : ''}
                        </span>
                      </div>
                      <div className={`text-sm truncate mt-0.5 ${!msg.read_at ? 'text-valo-text' : 'text-valo-subtle'}`}>
                        {msg.subject || '(no subject)'}
                      </div>
                      <div className="flex items-center gap-3 mt-1">
                        {msg.invoice_id && (
                          <Link
                            to={`/invoices/${msg.invoice_id}`}
                            onClick={e => e.stopPropagation()}
                            className="text-xs text-valo-accent hover:underline flex items-center gap-1"
                          >
                            <ExternalLink size={10} /> Invoice #{msg.invoice_id}
                          </Link>
                        )}
                        {msg.client_id && (
                          <Link
                            to={`/clients/${msg.client_id}`}
                            onClick={e => e.stopPropagation()}
                            className="text-xs text-valo-accent hover:underline flex items-center gap-1"
                          >
                            <ExternalLink size={10} /> Client
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                </button>

                {expanded === msg.id && (
                  <div className="px-5 pb-5 border-t border-valo-border bg-valo-dark">
                    <div className="mt-4">
                      {msg.body_html ? (
                        <div className="bg-white rounded-lg p-4 max-h-96 overflow-auto text-sm border border-valo-border" dangerouslySetInnerHTML={{ __html: msg.body_html }} />
                      ) : (
                        <pre className="whitespace-pre-wrap text-valo-text text-sm bg-valo-black rounded-lg p-4 max-h-96 overflow-auto">{msg.body_text || '(empty)'}</pre>
                      )}
                      <div className="mt-3 flex justify-end">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => setReplyTo(msg)}
                        >
                          <Mail size={13} /> Reply
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <SendEmailModal
        open={!!replyTo}
        onClose={() => setReplyTo(null)}
        invoice={replyTo?.invoice_id ? { id: replyTo.invoice_id } : null}
        replyTo={replyTo?.from_address}
      />
    </div>
  )
}
