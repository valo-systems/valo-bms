import { useEffect, useState } from 'react'
import { company as companyApi } from '../api/endpoints'
import Button from '../components/ui/Button'
import { Input, Textarea } from '../components/ui/Input'
import { ListTable, ListRow } from '../components/ui/Table'
import { Link } from 'react-router-dom'
import {
  Building2, CreditCard, Users, Edit, Save, X,
  Shield, FileText, CheckCircle, Copy, ExternalLink,
  Phone, Mail, Globe, MapPin, Briefcase, ChevronRight,
} from 'lucide-react'

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

const DOC_LIST = [
  { name: 'CIPC Registration Certificate (COR14.3)', ref: 'COR14.3', status: 'available', category: 'Registration' },
  { name: 'Notice of Incorporation (COR14.1)', ref: 'COR14.1', status: 'available', category: 'Registration' },
  { name: 'Memorandum of Incorporation (COR15.1A)', ref: 'COR15.1A', status: 'available', category: 'Registration' },
  { name: 'Director Details (COR14.1A)', ref: 'COR14.1A', status: 'available', category: 'Registration' },
  { name: 'SARS Income Tax Registration', ref: 'TaxNumber', status: 'available', category: 'Tax' },
  { name: 'Tax Compliance Status PIN', ref: 'TCS-PIN', status: 'pending', category: 'Tax' },
  { name: 'PAYE / EMP Registration', ref: 'PAYE', status: 'pending', category: 'Tax' },
  { name: 'FNB Account Confirmation Letter', ref: 'FNB-ACC', status: 'available', category: 'Banking' },
  { name: 'FNB Gold Business - Proof of Address', ref: 'FNB-POA', status: 'available', category: 'Banking' },
  { name: 'Capitec Business Account Confirmation', ref: 'CAP-ACC', status: 'available', category: 'Banking' },
  { name: 'B-BBEE Level 1 Certificate (EME)', ref: 'BEE', status: 'available', category: 'Compliance' },
  { name: 'Sworn B-BBEE Affidavit', ref: 'BEE-AFF', status: 'available', category: 'Compliance' },
  { name: 'CSD Supplier Registration Report', ref: 'CSD', status: 'available', category: 'Compliance' },
  { name: 'Company Proof of Address', ref: 'POA', status: 'available', category: 'Compliance' },
]

const STATUS_COLORS = { available: 'bg-green-900/40 text-green-400', pending: 'bg-amber-900/40 text-amber-400', missing: 'bg-red-900/40 text-red-400' }

export default function Company() {
  const [data, setData] = useState(null)
  const [activeTab, setActiveTab] = useState('Overview')
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState(null)
  const [saving, setSaving] = useState(false)
  const [docFilter, setDocFilter] = useState('All')

  useEffect(() => {
    companyApi.get()
      .then(res => { const c = res.company || res; setData(c); setForm(c) })
      .catch(() => {})
  }, [])

  const set = (k) => (e) => setForm(p => ({ ...p, [k]: e.target.value }))

  const handleSave = async () => {
    setSaving(true)
    try { const res = await companyApi.update(form); setData(form); setEditing(false) }
    catch { setData(form); setEditing(false) }
    finally { setSaving(false) }
  }

  if (!data) return <div className="flex items-center justify-center h-64 text-valo-subtle">Loading…</div>
  const d = editing ? form : data

  const docCategories = ['All', ...new Set(DOC_LIST.map(x => x.category))]
  const filteredDocs = docFilter === 'All' ? DOC_LIST : DOC_LIST.filter(x => x.category === docFilter)

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
              <div className="flex items-center gap-2 mb-3">
                <FileText size={15} className="text-valo-accent shrink-0" />
                <span className="text-valo-text font-semibold text-sm">Document Vault</span>
                <span className="text-valo-subtle text-xs">{DOC_LIST.filter(d => d.status === 'available').length}/{DOC_LIST.length} available</span>
              </div>
              {/* Filter tabs — scrollable */}
              <div className="flex gap-1 overflow-x-auto scrollbar-none -mx-1 px-1 pb-0.5">
                {docCategories.map(cat => (
                  <button key={cat} onClick={() => setDocFilter(cat)}
                    className={`shrink-0 px-3 min-h-[32px] text-xs rounded-lg transition-colors whitespace-nowrap ${docFilter === cat ? 'bg-valo-accent text-valo-black font-medium' : 'text-valo-subtle hover:text-valo-text'}`}>
                    {cat}
                  </button>
                ))}
              </div>
            </div>
            <ListTable>
              {filteredDocs.map(doc => (
                <ListRow
                  key={doc.ref}
                  primary={doc.name}
                  secondary={`${doc.ref} · ${doc.category}`}
                  badge={
                    <span className={`shrink-0 text-xs px-2.5 py-0.5 rounded-full font-medium ${STATUS_COLORS[doc.status]}`}>
                      {doc.status === 'available' ? 'Available' : doc.status === 'pending' ? 'Pending' : 'Missing'}
                    </span>
                  }
                />
              ))}
            </ListTable>
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
    </div>
  )
}
