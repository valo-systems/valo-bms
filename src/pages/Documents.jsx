import { useEffect, useRef, useState } from 'react'
import { documents as docsApi, clients as clientsApi } from '../api/endpoints'
import Badge from '../components/ui/Badge'
import Button from '../components/ui/Button'
import Modal from '../components/ui/Modal'
import { Input, Select, Textarea } from '../components/ui/Input'
import { FileText, ExternalLink, Search, Plus, Folder, Upload, RefreshCw, X, Eye, Download } from 'lucide-react'
import { format } from 'date-fns'

function PreviewModal({ doc, onClose }) {
  if (!doc) return null
  const isPdf = doc.file_path?.toLowerCase().endsWith('.pdf')
  const isImage = /\.(png|jpe?g|webp|gif)$/i.test(doc.file_path || '')

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black/90 backdrop-blur-sm">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-valo-dark border-b border-valo-border shrink-0">
        <div className="flex-1 min-w-0 mr-4">
          <div className="text-valo-text font-semibold text-sm truncate">{doc.name}</div>
          {doc.ref && <div className="text-valo-muted text-xs font-mono">{doc.ref}</div>}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <a
            href={doc.file_path}
            download
            className="flex items-center gap-1.5 px-3 py-1.5 bg-valo-accent text-valo-black text-xs font-semibold rounded-lg hover:bg-valo-accent-dim transition-colors"
          >
            <Download size={13} /> Download
          </a>
          <button onClick={onClose}
            className="p-1.5 text-valo-subtle hover:text-valo-text rounded-lg hover:bg-valo-card transition-colors">
            <X size={18} />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden flex items-center justify-center p-4">
        {isPdf ? (
          <iframe
            src={`${doc.file_path}#toolbar=1&navpanes=0`}
            className="w-full h-full rounded-lg border border-valo-border bg-white"
            title={doc.name}
          />
        ) : isImage ? (
          <img src={doc.file_path} alt={doc.name}
            className="max-w-full max-h-full object-contain rounded-lg" />
        ) : (
          <div className="text-center text-valo-subtle space-y-4">
            <FileText size={48} className="mx-auto opacity-30" />
            <p className="text-sm">Preview not available for this file type.</p>
            <a href={doc.file_path} download
              className="inline-flex items-center gap-2 px-4 py-2 bg-valo-accent text-valo-black text-sm font-semibold rounded-lg hover:bg-valo-accent-dim transition-colors">
              <Download size={15} /> Download to view
            </a>
          </div>
        )}
      </div>
    </div>
  )
}

const TYPE_COLORS = {
  agreement: 'text-valo-green',
  partnership: 'text-valo-accent',
  review: 'text-valo-blue',
  sla: 'text-valo-amber',
  other: 'text-valo-subtle',
}

const CAT_PREFIX = {
  agreement: 'AGR', partnership: 'PART', sla: 'SLA', review: 'REV', other: 'DOC',
}

const COMMERCIAL_CATS = ['agreement', 'partnership', 'sla', 'review', 'other']

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

function FileUploadZone({ onUploaded, currentPath, label = 'Attach File' }) {
  const ref = useRef()
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [fileName, setFileName] = useState(currentPath ? currentPath.split('/').pop() : '')
  const [error, setError] = useState('')

  const handleFile = async (file) => {
    if (!file) return
    setUploading(true)
    setError('')
    setProgress(0)
    try {
      const res = await docsApi.upload(file, (e) => {
        if (e.total) setProgress(Math.round((e.loaded / e.total) * 100))
      })
      setFileName(file.name)
      onUploaded(res.file_path)
    } catch {
      setError('Upload failed — check file type (PDF, image, Word) and size (max 20MB)')
    } finally {
      setUploading(false)
      setProgress(0)
    }
  }

  return (
    <div>
      <label className="block text-valo-subtle text-xs font-medium uppercase tracking-wide mb-1.5">{label}</label>
      <div
        onClick={() => ref.current?.click()}
        onDragOver={e => e.preventDefault()}
        onDrop={e => { e.preventDefault(); handleFile(e.dataTransfer.files[0]) }}
        className="border border-dashed border-valo-border rounded-lg px-4 py-3 flex items-center gap-3 cursor-pointer hover:border-valo-accent/50 transition-colors bg-valo-black"
      >
        <Upload size={15} className="text-valo-subtle shrink-0" />
        <div className="flex-1 min-w-0">
          {uploading ? (
            <div className="space-y-1">
              <div className="text-valo-subtle text-xs">Uploading… {progress}%</div>
              <div className="h-1 bg-valo-border rounded-full overflow-hidden">
                <div className="h-full bg-valo-accent transition-all" style={{ width: `${progress}%` }} />
              </div>
            </div>
          ) : fileName ? (
            <span className="text-valo-text text-xs truncate block">{fileName}</span>
          ) : (
            <span className="text-valo-muted text-xs">Click or drag a file here (PDF, image, Word — max 20MB)</span>
          )}
        </div>
        {fileName && !uploading && (
          <button type="button" onClick={e => { e.stopPropagation(); setFileName(''); onUploaded('') }}
            className="text-valo-muted hover:text-valo-red transition-colors shrink-0">
            <X size={13} />
          </button>
        )}
      </div>
      {error && <p className="text-valo-red text-xs mt-1">{error}</p>}
      <input ref={ref} type="file" className="hidden"
        accept=".pdf,.png,.jpg,.jpeg,.webp,.doc,.docx"
        onChange={e => handleFile(e.target.files[0])} />
    </div>
  )
}

export default function Documents() {
  const [data, setData] = useState([])
  const [clientList, setClientList] = useState([])
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [modalOpen, setModalOpen] = useState(false)
  const [editDoc, setEditDoc] = useState(null)
  const [form, setForm] = useState(EMPTY_DOC)
  const [saving, setSaving] = useState(false)
  const [previewDoc, setPreviewDoc] = useState(null)

  useEffect(() => {
    docsApi.list()
      .then(res => setData(res.documents || res))
      .catch(() => setData([]))
    clientsApi.list()
      .then(res => setClientList(res.clients || res))
      .catch(() => {})
  }, [])

  const commercialData = data.filter(d => COMMERCIAL_CATS.includes(d.category))
  const types = ['all', ...new Set(commercialData.map(d => d.category).filter(Boolean))]

  const filtered = commercialData.filter(d => {
    const matchSearch = (d.name || '').toLowerCase().includes(search.toLowerCase()) ||
      (d.client_name || '').toLowerCase().includes(search.toLowerCase()) ||
      (d.ref || '').toLowerCase().includes(search.toLowerCase())
    const matchType = typeFilter === 'all' || d.category === typeFilter
    return matchSearch && matchType
  })

  const openNew = () => { setEditDoc(null); setForm(EMPTY_DOC); setModalOpen(true) }
  const openEdit = (doc) => { setEditDoc(doc); setForm({ ...doc, client_id: doc.client_id || '' }); setModalOpen(true) }

  const handleCategoryChange = (e) => {
    const category = e.target.value
    setForm(p => ({ ...p, category, ref: category && !editDoc ? deriveRef(category, data) : p.ref }))
  }

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      if (editDoc) {
        const res = await docsApi.update(editDoc.id, form)
        setData(prev => prev.map(d => d.id === editDoc.id ? { ...d, ...(res.document || res) } : d))
      } else {
        const res = await docsApi.create(form)
        setData(prev => [...prev, { ...form, ...(res.document || res) }])
      }
      setModalOpen(false)
    } catch {
      if (!editDoc) setData(prev => [...prev, { ...form, id: Date.now() }])
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
          <p className="text-valo-subtle text-sm mt-1">{filtered.length} document{filtered.length !== 1 ? 's' : ''} — agreements, SLAs &amp; client contracts</p>
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
            <button key={t} onClick={() => setTypeFilter(t)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors capitalize ${
                typeFilter === t
                  ? 'bg-valo-accent text-valo-black'
                  : 'bg-valo-card border border-valo-border text-valo-subtle hover:text-valo-text'
              }`}>
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
                {doc.ref && <div className="text-valo-muted text-xs font-mono mt-0.5">{doc.ref}</div>}
                {doc.client_name && <div className="text-valo-subtle text-xs mt-0.5">{doc.client_name}</div>}
              </div>
              <Badge status={doc.status || 'pending'} />
            </div>
            <div className="flex items-center justify-between mt-auto pt-1">
              <div className="flex items-center gap-2">
                {doc.category && <span className="text-valo-muted text-xs capitalize bg-valo-border/40 px-2 py-0.5 rounded">{doc.category}</span>}
                {doc.date && <span className="text-valo-muted text-xs">{format(new Date(doc.date), 'd MMM yyyy')}</span>}
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => openEdit(doc)}
                  title="Replace file or edit details"
                  className="flex items-center gap-1 text-valo-subtle hover:text-valo-text text-xs transition-colors">
                  <RefreshCw size={11} /> Replace
                </button>
                {doc.file_path && (
                  <>
                    <a href={doc.file_path} download
                      title="Download"
                      className="flex items-center gap-1 text-valo-subtle hover:text-valo-text text-xs transition-colors">
                      <Download size={11} /> Download
                    </a>
                    <button onClick={() => setPreviewDoc(doc)}
                      title="Preview"
                      className="flex items-center gap-1 text-valo-accent hover:text-valo-accent/80 text-xs font-medium transition-colors">
                      <Eye size={11} /> Preview
                    </button>
                  </>
                )}
              </div>
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

      {/* PDF / image preview */}
      {previewDoc && <PreviewModal doc={previewDoc} onClose={() => setPreviewDoc(null)} />}

      {/* Add / Edit modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)}
        title={editDoc ? 'Edit Document' : 'Add Document'} size="lg">
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Input label="Document Name" value={form.name} onChange={set('name')} required
                placeholder="e.g. Valo CIPC Registration Certificate" />
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
              <option value="">— Valo Systems (internal) —</option>
              {clientList.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </Select>
            <Input label="Reference" value={form.ref} onChange={set('ref')} placeholder="e.g. COR-2026-001" />
            <div className="col-span-2">
              <FileUploadZone
                label={editDoc && form.file_path ? 'Replace File' : 'Attach File'}
                currentPath={form.file_path}
                onUploaded={(path) => setForm(p => ({ ...p, file_path: path }))}
              />
            </div>
            <Input label="Date" type="date" value={form.date} onChange={set('date')} />
            <div className="col-span-2">
              <Textarea label="Notes" value={form.notes} onChange={set('notes')} rows={2} placeholder="Any notes…" />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button type="submit" loading={saving}>{editDoc ? 'Save Changes' : 'Save Document'}</Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
