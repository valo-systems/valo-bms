import { useEffect, useState } from 'react'
import { documents as docsApi, clients as clientsApi } from '../api/endpoints'
import Badge from '../components/ui/Badge'
import Button from '../components/ui/Button'
import Modal from '../components/ui/Modal'
import { Input, Select, Textarea } from '../components/ui/Input'
import { FileText, ExternalLink, Search, Plus, Folder } from 'lucide-react'
import { format } from 'date-fns'

const PLACEHOLDER = [
  { id: 1, name: 'CGS Technology Platform Agreement', category: 'agreement', client_name: 'Convenient Gas Solutions', date: '2026-03-24', status: 'available', file_path: '/commercial/technology-platform-agreement.html' },
  { id: 2, name: 'Kasi to Home Website Services Agreement', category: 'agreement', client_name: 'Kasi to Home', date: '2026-03-24', status: 'available', file_path: '/commercial/kasi-to-home-website-agreement.html' },
  { id: 3, name: 'Valo-OmniSolve Partnership Agreement', category: 'partnership', client_name: 'OmniSolve', date: '2026-01-01', status: 'available', file_path: '/commercial/valo-omnisolve-partnership-agreement.html' },
  { id: 4, name: 'OmniSolve-TWL SLA Review', category: 'review', client_name: 'OmniSolve', date: '2026-04-01', status: 'available', file_path: '/commercial/twl-sla-review.html' },
]

const TYPE_COLORS = {
  agreement: 'text-valo-green',
  partnership: 'text-valo-accent',
  review: 'text-valo-blue',
  sla: 'text-valo-amber',
  other: 'text-valo-subtle',
}

const CAT_PREFIX = { agreement: 'AGR', partnership: 'PART', sla: 'SLA', review: 'REV', other: 'DOC' }

function deriveRef(category, existingDocs) {
  const year = new Date().getFullYear()
  const prefix = `${CAT_PREFIX[category] || 'DOC'}-${year}-`
  const nums = existingDocs
    .map(d => d.ref || '')
    .filter(r => r.startsWith(prefix))
    .map(r => parseInt(r.replace(prefix, ''), 10))
    .filter(n => !isNaN(n))
  const next = nums.length ? Math.max(...nums) + 1 : 1
  return `${prefix}${String(next).padStart(3, '0')}`
}

const today = new Date().toISOString().split('T')[0]
const EMPTY_DOC = {
  name: '', category: '', ref: '', client_id: '', file_path: '', status: 'pending', notes: '', date: today
}

export default function Documents() {
  const [data, setData] = useState([])
  const [clientList, setClientList] = useState([])
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState(EMPTY_DOC)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    docsApi.list()
      .then(res => setData(res.documents || res))
      .catch(() => setData(PLACEHOLDER))
    clientsApi.list()
      .then(res => setClientList(res.clients || res))
      .catch(() => {})
  }, [])

  const types = ['all', ...new Set(data.map(d => d.category).filter(Boolean))]

  const filtered = data.filter(d => {
    const matchSearch = (d.name || '').toLowerCase().includes(search.toLowerCase()) ||
      (d.client_name || '').toLowerCase().includes(search.toLowerCase())
    const matchType = typeFilter === 'all' || d.category === typeFilter
    return matchSearch && matchType
  })

  const openNew = () => { setForm(EMPTY_DOC); setModalOpen(true) }

  const handleCategoryChange = (e) => {
    const category = e.target.value
    setForm(p => ({ ...p, category, ref: category ? deriveRef(category, data) : '' }))
  }

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      const res = await docsApi.create(form)
      setData(prev => [...prev, { ...form, ...(res.document || res) }])
      setModalOpen(false)
    } catch {
      setData(prev => [...prev, { ...form, id: Date.now() }])
      setModalOpen(false)
    } finally {
      setSaving(false)
    }
  }

  const set = (k) => (e) => setForm(p => ({ ...p, [k]: e.target.value }))

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-valo-text text-2xl font-semibold">Commercial Docs</h1>
          <p className="text-valo-subtle text-sm mt-1">Agreements, SLAs &amp; commercial contracts</p>
        </div>
        <Button onClick={openNew}><Plus size={15} /> Add Document</Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-valo-subtle" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search documents…"
            className="bg-valo-card border border-valo-border rounded-lg pl-9 pr-4 py-2 text-valo-text text-sm placeholder:text-valo-muted focus:outline-none focus:border-valo-accent/60 transition-colors w-56"
          />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {types.map(t => (
            <button
              key={t}
              onClick={() => setTypeFilter(t)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors capitalize ${
                typeFilter === t
                  ? 'bg-valo-accent text-valo-black'
                  : 'bg-valo-card border border-valo-border text-valo-subtle hover:text-valo-text'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Cards */}
      <div className="grid sm:grid-cols-2 gap-4">
        {filtered.map(doc => (
          <div key={doc.id} className="bg-valo-card border border-valo-border rounded-xl p-5 flex flex-col gap-3">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-valo-dark border border-valo-border rounded-lg flex items-center justify-center shrink-0">
                <FileText size={18} className={TYPE_COLORS[doc.category] || 'text-valo-subtle'} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-valo-text font-semibold text-sm leading-snug">{doc.name}</div>
                {doc.client_name && <div className="text-valo-subtle text-xs mt-0.5">{doc.client_name}</div>}
              </div>
              <Badge status={doc.status || 'pending'} />
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {doc.category && <span className="text-valo-muted text-xs capitalize bg-valo-border/40 px-2 py-0.5 rounded">{doc.category}</span>}
                {doc.date && <span className="text-valo-muted text-xs">{format(new Date(doc.date), 'd MMM yyyy')}</span>}
              </div>
              {doc.file_path && (
                <a
                  href={doc.file_path}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-valo-accent text-xs hover:underline"
                >
                  Open <ExternalLink size={11} />
                </a>
              )}
            </div>
          </div>
        ))}

        {filtered.length === 0 && (
          <div className="col-span-2 text-center py-16 text-valo-subtle">
            <Folder size={32} className="mx-auto mb-3 opacity-30" />
            <p className="text-sm">No documents found</p>
          </div>
        )}
      </div>

      {/* New document modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Add Document" size="lg">
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Input label="Document Name" value={form.name} onChange={set('name')} required placeholder="e.g. CGS Technology Platform Agreement" />
            </div>
            <Select label="Category" value={form.category} onChange={handleCategoryChange}>
              <option value="">— select —</option>
              <option value="agreement">Agreement</option>
              <option value="partnership">Partnership</option>
              <option value="sla">SLA</option>
              <option value="review">Review</option>
              <option value="other">Other</option>
            </Select>
            <Select label="Status" value={form.status} onChange={set('status')}>
              <option value="pending">Pending</option>
              <option value="available">Available</option>
              <option value="missing">Missing</option>
            </Select>
            <Select label="Client" value={form.client_id} onChange={set('client_id')}>
              <option value="">— none —</option>
              {clientList.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </Select>
            <Input label="Reference" value={form.ref} onChange={set('ref')} placeholder="e.g. AGR-2026-001" />
            <div className="col-span-2">
              <Input label="File Path / URL" value={form.file_path} onChange={set('file_path')} placeholder="/commercial/doc.html or https://…" />
            </div>
            <Input label="Date" type="date" value={form.date} onChange={set('date')} />
            <div className="col-span-2">
              <Textarea label="Notes" value={form.notes} onChange={set('notes')} rows={3} placeholder="Any notes…" />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button type="submit" loading={saving}>Save Document</Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
