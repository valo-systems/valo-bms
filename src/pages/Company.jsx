import { useEffect, useRef, useState } from 'react'
import { company as companyApi, documents as docsApi } from '../api/endpoints'
import Button from '../components/ui/Button'
import Modal from '../components/ui/Modal'
import { Input, Select, Textarea } from '../components/ui/Input'
import { ListTable, ListRow } from '../components/ui/Table'
import { Link } from 'react-router-dom'
import {
  Building2, CreditCard, Users, Edit, Save, X,
  Shield, FileText, CheckCircle, Copy, ExternalLink,
  Phone, Mail, Globe, MapPin, Briefcase, ChevronRight,
  Plus, Upload, Eye, Download, RefreshCw,
} from 'lucide-react'
import { format } from 'date-fns'

// ── helpers ──────────────────────────────────────────────────────────────────
function Field({ label, value, mono, copyable, accent }) {
  const [copied, setCopied] = useState(false)
  if (!value && value !== 0) return null
  const copy = () => { navigator.clipboard.writeText(String(value)); setCopied(true); setTimeout(() => setCopied(false), 1500) }
  return (
    <div>
      <div className="text-valo-subtle text-xs uppercase tracking-wider mb-1">{label}</div>
      <div className={`text-sm flex items-center gap-2 ${accent ? 'text-valo-accent font-semibold' : 'text-valo-text'} ${mono ? 'font-mono' : ''}`}>
        {value}
        {copyable && (
          <button onClick={copy} className="text-valo-muted hover:text-valo-accent transition-colors ml-1" title="Copy">
            {copied ? <CheckCircle size={12} className="text-green-500" /> : <Copy size={12} />}
          </button>
        )}
      </div>
    </div>
  )
}

function SectionCard({ icon: Icon, title, children }) {
  return (
    <div className="bg-valo-card border border-valo-border rounded-xl p-6">
      <div className="flex items-center gap-2 mb-5">
        <Icon size={15} className="text-valo-accent" />
        <h3 className="text-valo-text font-semibold text-sm">{title}</h3>
      </div>
      {children}
    </div>
  )
}

function BankCard({ label, fields }) {
  return (
    <div className="bg-valo-dark border border-valo-border rounded-xl p-5">
      <div className="text-valo-subtle text-xs uppercase tracking-widest font-bold mb-4">{label}</div>
      <div className="grid grid-cols-2 gap-4">
        {fields.map(([l, v, opts]) => v ? <Field key={l} label={l} value={v} {...(opts || {})} /> : null)}
      </div>
    </div>
  )
}

const TABS = ['Overview', 'Registration & Tax', 'Banking', 'Compliance', 'Team']

const COMPANY_CATS = ['compliance', 'banking', 'tax']
const CAT_PREFIX = { compliance: 'COR', banking: 'BNK', tax: 'TAX' }
const TYPE_COLORS = { compliance: 'text-blue-400', banking: 'text-green-400', tax: 'text-amber-400' }
const STATUS_COLORS = { available: 'bg-green-900/40 text-green-400', pending: 'bg-amber-900/40 text-amber-400', missing: 'bg-red-900/40 text-red-400' }

const today = new Date().toISOString().split('T')[0]
const EMPTY_DOC = { name: '', category: 'compliance', ref: '', file_path: '', status: 'available', notes: '', date: today }

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

function FileUploadZone({ onUploaded, currentPath, label = 'Attach File' }) {
  const ref = useRef()
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [fileName, setFileName] = useState(currentPath ? currentPath.split('/').pop() : '')
  const [error, setError] = useState('')

  const handleFile = async (file) => {
    if (!file) return
    setUploading(true); setError(''); setProgress(0)
    try {
      const res = await docsApi.upload(file, (e) => {
        if (e.total) setProgress(Math.round((e.loaded / e.total) * 100))
      })
      setFileName(file.name)
      onUploaded(res.file_path)
    } catch {
      setError('Upload failed — check file type (PDF, image, Word) and size (max 20MB)')
    } finally { setUploading(false); setProgress(0) }
  }

  return (
    <div>
      <label className="block text-valo-subtle text-xs font-medium uppercase tracking-wide mb-1.5">{label}</label>
      <div onClick={() => ref.current?.click()} onDragOver={e => e.preventDefault()}
        onDrop={e => { e.preventDefault(); handleFile(e.dataTransfer.files[0]) }}
        className="border border-dashed border-valo-border rounded-lg px-4 py-3 flex items-center gap-3 cursor-pointer hover:border-valo-accent/50 transition-colors bg-valo-black">
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
            className="text-valo-muted hover:text-valo-red transition-colors shrink-0"><X size={13} /></button>
        )}
      </div>
      {error && <p className="text-red-400 text-xs mt-1">{error}</p>}
      <input ref={ref} type="file" className="hidden" accept=".pdf,.png,.jpg,.jpeg,.webp,.doc,.docx"
        onChange={e => handleFile(e.target.files[0])} />
    </div>
  )
}

function PreviewModal({ doc, onClose }) {
  if (!doc) return null
  const isPdf = doc.file_path?.toLowerCase().endsWith('.pdf')
  const isImage = /\.(png|jpe?g|webp|gif)$/i.test(doc.file_path || '')
  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black/90 backdrop-blur-sm">
      <div className="flex items-center justify-between px-4 py-3 bg-valo-dark border-b border-valo-border shrink-0">
        <div className="flex-1 min-w-0 mr-4">
          <div className="text-valo-text font-semibold text-sm truncate">{doc.name}</div>
          {doc.ref && <div className="text-valo-muted text-xs font-mono">{doc.ref}</div>}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <a href={doc.file_path} download
            className="flex items-center gap-1.5 px-3 py-1.5 bg-valo-accent text-valo-black text-xs font-semibold rounded-lg hover:bg-valo-accent-dim transition-colors">
            <Download size={13} /> Download
          </a>
          <button onClick={onClose} className="p-1.5 text-valo-subtle hover:text-valo-text rounded-lg hover:bg-valo-card transition-colors">
            <X size={18} />
          </button>
        </div>
      </div>
      <div className="flex-1 overflow-hidden flex items-center justify-center p-4">
        {isPdf ? (
          <iframe src={`${doc.file_path}#toolbar=1&navpanes=0`}
            className="w-full h-full rounded-lg border border-valo-border bg-white" title={doc.name} />
        ) : isImage ? (
          <img src={doc.file_path} alt={doc.name} className="max-w-full max-h-full object-contain rounded-lg" />
        ) : (
          <div className="text-center text-valo-subtle space-y-4">
            <FileText size={48} className="mx-auto opacity-30" />
            <p className="text-sm">Preview not available for this file type.</p>
            <a href={doc.file_path} download
              className="inline-flex items-center gap-2 px-4 py-2 bg-valo-accent text-valo-black text-sm font-semibold rounded-lg">
              <Download size={15} /> Download to view
            </a>
          </div>
        )}
      </div>
    </div>
  )
}

export default function Company() {
  const [data, setData] = useState(null)
  const [activeTab, setActiveTab] = useState('Overview')
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState(null)
  const [saving, setSaving] = useState(false)
  const [docFilter, setDocFilter] = useState('all')
  const [docs, setDocs] = useState([])
  const [docModalOpen, setDocModalOpen] = useState(false)
  const [editDoc, setEditDoc] = useState(null)
  const [docForm, setDocForm] = useState(EMPTY_DOC)
  const [docSaving, setDocSaving] = useState(false)
  const [previewDoc, setPreviewDoc] = useState(null)

  useEffect(() => {
    companyApi.get()
      .then(res => { const c = res.company || res; setData(c); setForm(c) })
      .catch(() => {})
    docsApi.list()
      .then(res => setDocs((res.documents || res).filter(d => COMPANY_CATS.includes(d.category))))
      .catch(() => {})
  }, [])

  const set = (k) => (e) => setForm(p => ({ ...p, [k]: e.target.value }))
  const setDoc = (k) => (e) => setDocForm(p => ({ ...p, [k]: e.target.value }))

  const handleSave = async () => {
    setSaving(true)
    try { await companyApi.update(form); setData(form); setEditing(false) }
    catch { setData(form); setEditing(false) }
    finally { setSaving(false) }
  }

  const openNewDoc = () => {
    setEditDoc(null)
    setDocForm({ ...EMPTY_DOC, ref: deriveRef('compliance', docs) })
    setDocModalOpen(true)
  }
  const openEditDoc = (doc) => { setEditDoc(doc); setDocForm({ ...doc }); setDocModalOpen(true) }

  const handleCategoryChange = (e) => {
    const category = e.target.value
    setDocForm(p => ({ ...p, category, ref: !editDoc ? deriveRef(category, docs) : p.ref }))
  }

  const handleDocSave = async (e) => {
    e.preventDefault()
    setDocSaving(true)
    try {
      if (editDoc) {
        const res = await docsApi.update(editDoc.id, docForm)
        setDocs(prev => prev.map(d => d.id === editDoc.id ? { ...d, ...(res.document || res) } : d))
      } else {
        const res = await docsApi.create(docForm)
        setDocs(prev => [...prev, { ...docForm, ...(res.document || res) }])
      }
      setDocModalOpen(false)
    } catch {
      if (!editDoc) setDocs(prev => [...prev, { ...docForm, id: Date.now() }])
      setDocModalOpen(false)
    } finally { setDocSaving(false) }
  }

  if (!data) return <div className="flex items-center justify-center h-64 text-valo-subtle">Loading…</div>
  const d = editing ? form : data

  const docCategories = ['all', ...COMPANY_CATS]
  const filteredDocs = docs.filter(doc =>
    docFilter === 'all' || doc.category === docFilter
  )

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-valo-text text-2xl font-semibold">Company</h1>
          <p className="text-valo-subtle text-sm mt-1">VALO (PTY) LTD, Reg 2026/072094/07</p>
        </div>
        {editing ? (
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" onClick={() => { setForm(data); setEditing(false) }}><X size={14} /> Cancel</Button>
            <Button size="sm" loading={saving} onClick={handleSave}><Save size={14} /> Save</Button>
          </div>
        ) : (
          activeTab !== 'Documents' && (
            <Button variant="secondary" size="sm" onClick={() => setEditing(true)}><Edit size={14} /> Edit</Button>
          )
        )}
      </div>

      {/* Tabs — scrollable on mobile */}
      <div className="flex gap-0 border-b border-valo-border overflow-x-auto scrollbar-none -mx-4 px-4 lg:mx-0 lg:px-0">
        {TABS.map(tab => (
          <button
            key={tab}
            onClick={() => { setActiveTab(tab); setEditing(false); setForm(data) }}
            className={`shrink-0 px-4 min-h-[44px] text-sm font-medium transition-colors border-b-2 -mb-px whitespace-nowrap ${
              activeTab === tab
                ? 'border-valo-accent text-valo-accent'
                : 'border-transparent text-valo-subtle hover:text-valo-text'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* ── OVERVIEW ── */}
      {activeTab === 'Overview' && (
        <div className="space-y-6">
          {/* Identity strip */}
          <div className="bg-valo-card border border-valo-border rounded-xl p-6">
            <div className="flex items-start gap-5">
              <div className="w-14 h-14 rounded-xl bg-valo-accent/10 border border-valo-accent/20 flex items-center justify-center shrink-0">
                <span className="text-valo-accent font-bold text-xl tracking-tight">V</span>
              </div>
              <div className="flex-1">
                <div className="text-valo-text text-xl font-bold">{d.name}</div>
                {d.trading_name && <div className="text-valo-subtle text-sm mt-0.5">Trading as {d.trading_name}</div>}
                <div className="flex flex-wrap gap-3 mt-3">
                  {d.email && <a href={`mailto:${d.email}`} className="flex items-center gap-1.5 text-valo-subtle text-xs hover:text-valo-accent transition-colors"><Mail size={12} />{d.email}</a>}
                  {d.phone && <a href={`tel:${d.phone}`} className="flex items-center gap-1.5 text-valo-subtle text-xs hover:text-valo-accent transition-colors"><Phone size={12} />{d.phone}</a>}
                  {d.website && <span className="flex items-center gap-1.5 text-valo-subtle text-xs"><Globe size={12} />{d.website}</span>}
                </div>
              </div>
            </div>
          </div>

          {editing ? (
            <div className="space-y-6">
              <div className="bg-valo-card border border-valo-border rounded-xl p-6 grid grid-cols-2 gap-4">
                <div className="col-span-2"><Input label="Legal Name" value={d.name || ''} onChange={set('name')} /></div>
                <Input label="Trading Name" value={d.trading_name || ''} onChange={set('trading_name')} />
                <Input label="Email" type="email" value={d.email || ''} onChange={set('email')} />
                <Input label="Phone" value={d.phone || ''} onChange={set('phone')} />
                <Input label="Website" value={d.website || ''} onChange={set('website')} />
                <div className="col-span-2"><Textarea label="Address" value={d.address || ''} onChange={set('address')} rows={2} /></div>
              </div>
            </div>
          ) : (
            <div className="grid lg:grid-cols-2 gap-5">
              <SectionCard icon={Building2} title="Company Details">
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Reg Number" value={d.reg_number} mono copyable />
                  <Field label="Tax Number" value={d.tax_number} mono copyable />
                  <Field label="CSD Number" value={d.csd_number} mono copyable />
                  <Field label="Financial Year End" value={d.financial_year_end} />
                  <Field label="Registered" value={d.registration_date ? new Date(d.registration_date).toLocaleDateString('en-ZA', { day:'numeric', month:'long', year:'numeric' }) : null} />
                  <Field label="VAT" value={d.vat_number || 'Not registered'} />
                  <div className="col-span-2"><Field label="Address" value={d.address} /></div>
                </div>
              </SectionCard>

              <SectionCard icon={Shield} title="Compliance Status">
                <div className="space-y-3">
                  {[
                    { label: 'B-BBEE Level', value: `Level ${d.bee_level || 1}, ${d.bee_type || 'EME'}`, ok: true },
                    { label: 'B-BBEE Procurement Recognition', value: '135%', ok: true },
                    { label: 'Black Ownership', value: '100%', ok: true },
                    { label: 'Certificate Expiry', value: d.bee_expiry ? new Date(d.bee_expiry).toLocaleDateString('en-ZA', { day:'numeric', month:'long', year:'numeric' }) : '1 January 2027', ok: true },
                    { label: 'Tax Compliant', value: 'Yes (CSD verified)', ok: true },
                    { label: 'VAT Registered', value: 'No, EME below threshold', ok: null },
                    { label: 'SETA Classification', value: 'MICT SETA (ICT/Software)', ok: null },
                  ].map(({ label, value, ok }) => (
                    <div key={label} className="flex items-center justify-between py-2 border-b border-valo-border last:border-0">
                      <span className="text-valo-subtle text-xs">{label}</span>
                      <span className={`text-xs font-medium flex items-center gap-1.5 ${ok === true ? 'text-green-400' : 'text-valo-text'}`}>
                        {ok === true && <CheckCircle size={11} />}
                        {value}
                      </span>
                    </div>
                  ))}
                </div>
              </SectionCard>
            </div>
          )}
        </div>
      )}

      {/* ── REGISTRATION & TAX ── */}
      {activeTab === 'Registration & Tax' && (
        <div className="space-y-5">
          {editing ? (
            <div className="bg-valo-card border border-valo-border rounded-xl p-6 grid grid-cols-2 gap-4">
              <Input label="CIPC Reg Number" value={d.reg_number || ''} onChange={set('reg_number')} />
              <Input label="Tax Number (SARS)" value={d.tax_number || ''} onChange={set('tax_number')} />
              <Input label="VAT Number" value={d.vat_number || ''} onChange={set('vat_number')} placeholder="Not registered" />
              <Input label="CSD Supplier Number" value={d.csd_number || ''} onChange={set('csd_number')} />
              <Input label="Financial Year End" value={d.financial_year_end || ''} onChange={set('financial_year_end')} />
              <Input label="Registration Date" type="date" value={d.registration_date?.slice(0,10) || ''} onChange={set('registration_date')} />
            </div>
          ) : (
            <>
              <SectionCard icon={FileText} title="CIPC Registration">
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-5">
                  <Field label="Legal Name" value="VALO (PTY) LTD" />
                  <Field label="Trading Name" value={d.trading_name || 'Valo Systems'} />
                  <Field label="Enterprise Type" value="Private Company" />
                  <Field label="Registration Number" value={d.reg_number} mono copyable accent />
                  <Field label="Registration Date" value={d.registration_date ? new Date(d.registration_date).toLocaleDateString('en-ZA', { day:'numeric', month:'long', year:'numeric' }) : '29 January 2026'} />
                  <Field label="Financial Year End" value={d.financial_year_end || 'February'} />
                  <Field label="Enterprise Status" value="In Business" />
                  <Field label="Registered Office" value={d.address} />
                </div>
              </SectionCard>

              <SectionCard icon={Building2} title="Director">
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-5">
                  <Field label="Full Name" value={d.director_name || 'Sibusiso Siphosenkosi Mashita'} />
                  <Field label="ID Number" value={d.director_id || '9103275496084'} mono copyable />
                  <Field label="Appointment Date" value="29 January 2026" />
                  <Field label="Email" value={d.director_email || 'sibusiso.mashita@valosystems.co.za'} />
                  <Field label="Phone" value={d.director_phone || '078 078 5043'} />
                </div>
              </SectionCard>

              <SectionCard icon={FileText} title="SARS Tax Details">
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-5">
                  <Field label="Income Tax Number" value={d.tax_number || '9594324221'} mono copyable accent />
                  <Field label="VAT Status" value="Not registered, below threshold" />
                  <Field label="Tax Compliance" value="Compliant (CSD verified)" />
                  <Field label="Provisional Tax" value="From 2027 tax period" />
                  <Field label="Provisional Dates" value="August & February annually" />
                  <Field label="SETA Classification" value="MICT SETA (expected)" />
                </div>
              </SectionCard>

              <SectionCard icon={Shield} title="CSD Supplier Registration">
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-5">
                  <Field label="CSD Supplier Number" value={d.csd_number || 'MAAA1722994'} mono copyable accent />
                  <Field label="Supplier Type" value="CIPC Company, Private Company (Pty)(Ltd)" />
                  <Field label="Business Status" value="In Business (Active)" />
                  <Field label="Commodity" value="Software" />
                  <Field label="Tax Status on CSD" value="Compliant" />
                  <Field label="B-BBEE on CSD" value="Manual verification required" />
                </div>
              </SectionCard>
            </>
          )}
        </div>
      )}

      {/* ── BANKING ── */}
      {activeTab === 'Banking' && (
        <div className="space-y-5">
          {editing ? (
            <div className="space-y-5">
              <div className="bg-valo-card border border-valo-border rounded-xl p-6">
                <div className="text-valo-text font-semibold text-sm mb-4">FNB / RMB - Primary Account</div>
                <div className="grid grid-cols-2 gap-4">
                  <Input label="Bank" value={d.bank_name || ''} onChange={set('bank_name')} />
                  <Input label="Account Type" value={d.account_type || ''} onChange={set('account_type')} />
                  <Input label="Account Holder" value={d.account_holder || ''} onChange={set('account_holder')} />
                  <Input label="Account Number" value={d.account_number || ''} onChange={set('account_number')} />
                  <Input label="Branch Code" value={d.branch_code || ''} onChange={set('branch_code')} />
                </div>
              </div>
              <div className="bg-valo-card border border-valo-border rounded-xl p-6">
                <div className="text-valo-text font-semibold text-sm mb-4">Capitec Business - Secondary Account</div>
                <div className="grid grid-cols-2 gap-4">
                  <Input label="Account Number" value={d.capitec_account_number || ''} onChange={set('capitec_account_number')} />
                  <Input label="Branch Code" value={d.capitec_branch_code || ''} onChange={set('capitec_branch_code')} />
                  <Input label="SWIFT / BIC" value={d.capitec_swift || ''} onChange={set('capitec_swift')} />
                </div>
              </div>
            </div>
          ) : (
            <>
              <div className="grid lg:grid-cols-2 gap-5">
                <BankCard label="FNB / RMB - Primary (Invoicing)" fields={[
                  ['Bank', d.bank_name || 'FNB / RMB'],
                  ['Account Type', d.account_type || 'Gold Business Account'],
                  ['Account Holder', d.account_holder || 'Valo', { accent: true }],
                  ['Account Number', d.account_number || '63194158987', { mono: true, copyable: true, accent: true }],
                  ['Branch Code', d.branch_code || '255355', { mono: true, copyable: true }],
                  ['Universal Branch', '250655', { mono: true }],
                ]} />

                <BankCard label="Capitec Business - Secondary" fields={[
                  ['Bank', 'Capitec Business'],
                  ['Account Type', 'Business Account'],
                  ['Account Holder', 'VALO (PTY) LTD', { accent: true }],
                  ['Account Number', d.capitec_account_number || '1055332383', { mono: true, copyable: true, accent: true }],
                  ['Branch Code', d.capitec_branch_code || '450105', { mono: true, copyable: true }],
                  ['SWIFT / BIC', d.capitec_swift || 'CABLZAJJ', { mono: true, copyable: true }],
                ]} />
              </div>

              <div className="bg-valo-card border border-valo-border rounded-xl p-5">
                <div className="text-valo-subtle text-xs uppercase tracking-widest font-bold mb-3">Payment Reference Guide</div>
                <div className="space-y-2 text-sm text-valo-subtle">
                  <div className="flex items-start gap-2"><ChevronRight size={14} className="text-valo-accent mt-0.5 shrink-0" /><span>Always use the <strong className="text-valo-text">invoice number</strong> (e.g. VAL-CGS-2026-001) as the payment reference, this links the payment to the invoice automatically.</span></div>
                  <div className="flex items-start gap-2"><ChevronRight size={14} className="text-valo-accent mt-0.5 shrink-0" /><span>FNB account is the <strong className="text-valo-text">primary billing account</strong>, all client invoices should be paid here.</span></div>
                  <div className="flex items-start gap-2"><ChevronRight size={14} className="text-valo-accent mt-0.5 shrink-0" /><span>Late payments accrue interest at the South African prime lending rate + 2% per annum, calculated daily from the due date.</span></div>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* ── COMPLIANCE (Documents) ── */}
      {activeTab === 'Compliance' && (
        <div className="space-y-5">
          {/* Summary tiles */}
          <div className="grid grid-cols-3 lg:grid-cols-5 gap-3">
            {[
              { label: 'B-BBEE Level', value: '1', sub: 'EME, 135%', color: 'text-green-400' },
              { label: 'Black Ownership', value: '100%', sub: 'Empowering Supplier', color: 'text-green-400' },
              { label: 'Tax Compliant', value: 'Yes', sub: 'CSD verified', color: 'text-green-400' },
              { label: 'CSD Registered', value: 'Yes', sub: 'MAAA1722994', color: 'text-green-400' },
              { label: 'BEE Expiry', value: 'Jan 2027', sub: 'Active certificate', color: 'text-amber-400' },
            ].map(({ label, value, sub, color }) => (
              <div key={label} className="bg-valo-card border border-valo-border rounded-xl p-4 text-center">
                <div className={`text-lg font-bold ${color}`}>{value}</div>
                <div className="text-valo-text text-xs font-medium mt-0.5">{label}</div>
                <div className="text-valo-muted text-xs mt-0.5">{sub}</div>
              </div>
            ))}
          </div>

          {/* Document vault */}
          <div className="bg-valo-card border border-valo-border rounded-xl">
            <div className="px-5 py-4 border-b border-valo-border">
              <div className="flex items-center justify-between gap-3 mb-3">
                <div className="flex items-center gap-2">
                  <FileText size={15} className="text-valo-accent shrink-0" />
                  <span className="text-valo-text font-semibold text-sm">Company Documents</span>
                  <span className="text-valo-subtle text-xs">{docs.filter(d => d.status === 'available').length}/{docs.length} available</span>
                </div>
                <Button size="sm" onClick={openNewDoc}><Plus size={13} /> Add</Button>
              </div>
              <div className="flex gap-1 overflow-x-auto scrollbar-none -mx-1 px-1 pb-0.5">
                {docCategories.map(cat => (
                  <button key={cat} onClick={() => setDocFilter(cat)}
                    className={`shrink-0 px-3 min-h-[32px] text-xs rounded-lg transition-colors whitespace-nowrap capitalize ${docFilter === cat ? 'bg-valo-accent text-valo-black font-medium' : 'text-valo-subtle hover:text-valo-text'}`}>
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {filteredDocs.length === 0 ? (
              <div className="py-12 text-center text-valo-subtle text-sm">No documents yet</div>
            ) : (
              <div className="divide-y divide-valo-border">
                {filteredDocs.map(doc => (
                  <div key={doc.id} className="flex items-center gap-3 px-5 py-3">
                    <FileText size={15} className={TYPE_COLORS[doc.category] || 'text-valo-subtle'} />
                    <div className="flex-1 min-w-0">
                      <div className="text-valo-text text-sm truncate">{doc.name}</div>
                      <div className="text-valo-muted text-xs font-mono">{doc.ref}{doc.date ? ` · ${format(new Date(doc.date), 'd MMM yyyy')}` : ''}</div>
                    </div>
                    <span className={`shrink-0 text-xs px-2.5 py-0.5 rounded-full font-medium ${STATUS_COLORS[doc.status] || STATUS_COLORS.pending}`}>
                      {doc.status === 'available' ? 'Available' : doc.status === 'pending' ? 'Pending' : 'Missing'}
                    </span>
                    <div className="flex items-center gap-2 shrink-0">
                      <button onClick={() => openEditDoc(doc)} title="Edit" className="text-valo-muted hover:text-valo-text transition-colors"><RefreshCw size={12} /></button>
                      {doc.file_path && (
                        <>
                          <a href={doc.file_path} download title="Download" className="text-valo-muted hover:text-valo-text transition-colors"><Download size={12} /></a>
                          <button onClick={() => setPreviewDoc(doc)} title="Preview" className="text-valo-accent hover:text-valo-accent/80 transition-colors"><Eye size={12} /></button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* CIPC details */}
          <SectionCard icon={Shield} title="Key Reference Numbers">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
              <Field label="CIPC Reg Number" value="2026/072094/07" mono copyable accent />
              <Field label="Tax Number" value="9594324221" mono copyable />
              <Field label="CSD Number" value="MAAA1722994" mono copyable />
              <Field label="CIPC Tracking" value="9451327276" mono copyable />
              <Field label="FNB Verify Ref" value="VODS3ZS6VKBQ" mono copyable />
              <Field label="BEE Certificate" value="BEE 2602-01" mono copyable />
              <Field label="Capitec SkyQR" value="6a6a-5030-5548" mono copyable />
            </div>
          </SectionCard>
        </div>
      )}

      {/* ── TEAM ── */}
      {activeTab === 'Team' && (
        <div className="space-y-5">
          <SectionCard icon={Users} title="Team Access">
            <div className="space-y-2">
              {(d.team || []).map((member, i) => (
                <Link key={i} to={`/team/${member.id}`}
                  className="flex items-center justify-between px-4 py-3 bg-valo-dark rounded-lg hover:border hover:border-valo-accent/30 transition-all group">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-valo-accent/10 rounded-full flex items-center justify-center shrink-0">
                      <span className="text-valo-accent text-xs font-bold">
                        {member.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                      </span>
                    </div>
                    <div>
                      <div className="text-valo-text text-sm font-medium">{member.name}</div>
                      <div className="text-valo-subtle text-xs">{member.email}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-valo-subtle text-xs bg-valo-border/40 px-2.5 py-1 rounded capitalize">{member.role}</span>
                    <ChevronRight size={13} className="text-valo-muted group-hover:text-valo-accent transition-colors" />
                  </div>
                </Link>
              ))}
              <div className="flex items-center gap-3 px-4 py-3 border border-dashed border-valo-border rounded-lg text-valo-muted text-sm">
                <div className="w-9 h-9 border border-dashed border-valo-border rounded-full flex items-center justify-center">
                  <Users size={13} />
                </div>
                <div>
                  <div className="text-sm">Finance partner & additional team members</div>
                  <div className="text-xs text-valo-muted mt-0.5">Invite via @valosystems.co.za company email</div>
                </div>
              </div>
            </div>
          </SectionCard>

          <SectionCard icon={Briefcase} title="Company Services">
            <div className="grid grid-cols-2 gap-2">
              {[
                'Software Development', 'Web Application Development', 'Mobile Application Development',
                'Cloud & Infrastructure Support', 'Business Systems Development', 'Automation & Workflow Systems',
                'Website Development', 'Digital Platform Development', 'Technology Consulting',
                'System Integration', 'Database-backed Application Development', 'API & Integration Services',
                'UI/UX Design Support', 'Technical Maintenance & Support',
              ].map(s => (
                <div key={s} className="flex items-center gap-2 text-xs text-valo-subtle py-1.5 border-b border-valo-border/40 last:border-0">
                  <div className="w-1 h-1 rounded-full bg-valo-accent shrink-0" />
                  {s}
                </div>
              ))}
            </div>
          </SectionCard>
        </div>
      )}

      {/* Doc add/edit modal */}
      <Modal open={docModalOpen} onClose={() => setDocModalOpen(false)}
        title={editDoc ? 'Edit Document' : 'Add Company Document'} size="lg">
        <form onSubmit={handleDocSave} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Input label="Document Name" value={docForm.name} onChange={setDoc('name')} required
                placeholder="e.g. SARS Tax Registration Certificate" />
            </div>
            <Select label="Category" value={docForm.category} onChange={handleCategoryChange}>
              <option value="compliance">Compliance</option>
              <option value="banking">Banking</option>
              <option value="tax">Tax</option>
            </Select>
            <Select label="Status" value={docForm.status} onChange={setDoc('status')}>
              <option value="available">Available</option>
              <option value="pending">Pending</option>
              <option value="missing">Missing</option>
            </Select>
            <Input label="Reference" value={docForm.ref} onChange={setDoc('ref')} placeholder="e.g. COR-2026-001" />
            <Input label="Date" type="date" value={docForm.date} onChange={setDoc('date')} />
            <div className="col-span-2">
              <FileUploadZone
                label={editDoc && docForm.file_path ? 'Replace File' : 'Attach File'}
                currentPath={docForm.file_path}
                onUploaded={(path) => setDocForm(p => ({ ...p, file_path: path }))}
              />
            </div>
            <div className="col-span-2">
              <Textarea label="Notes" value={docForm.notes || ''} onChange={setDoc('notes')} rows={2} placeholder="Any notes…" />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={() => setDocModalOpen(false)}>Cancel</Button>
            <Button type="submit" loading={docSaving}>{editDoc ? 'Save Changes' : 'Save Document'}</Button>
          </div>
        </form>
      </Modal>

      {previewDoc && <PreviewModal doc={previewDoc} onClose={() => setPreviewDoc(null)} />}
    </div>
  )
}
