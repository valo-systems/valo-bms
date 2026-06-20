import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { clients as clientsApi } from '../api/endpoints'
import Badge from '../components/ui/Badge'
import Button from '../components/ui/Button'
import Modal from '../components/ui/Modal'
import { Input, Select, Textarea } from '../components/ui/Input'
import { Table, Thead, Th, Tbody, Tr, Td } from '../components/ui/Table'
import { PageHeader, EmptyState } from '../components/ui/Typography'
import { Plus, Search, Building2, Mail, Phone } from 'lucide-react'

const PLACEHOLDER = [
  { id: 1, name: 'Convenient Gas Solutions', code: 'CGS', email: 'accounts@cgs.co.za', phone: '', status: 'active', billing_model: 'percentage', contract_start: '2026-03-24' },
  { id: 2, name: 'Kasi to Home', code: 'K2H', email: 'info@kasitohome.co.za', phone: '', status: 'active', billing_model: 'project', contract_start: '2026-03-24' },
  { id: 3, name: 'OmniSolve', code: 'OS', email: 'info@omnisolve.co.za', phone: '', status: 'active', billing_model: 'passthrough', contract_start: '2026-01-01' },
]

const EMPTY_CLIENT = {
  name: '', code: '', email: '', phone: '', address: '',
  billing_model: 'project', payment_terms: 30, status: 'active', notes: ''
}

function deriveCode(name) {
  return name.trim().split(/\s+/).map(w => w[0] || '').join('').toUpperCase().slice(0, 4)
}

export default function Clients() {
  const [data, setData] = useState([])
  const [search, setSearch] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState(EMPTY_CLIENT)
  const [codeAutoSet, setCodeAutoSet] = useState(true)
  const [saving, setSaving] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    clientsApi.list()
      .then(res => setData(res.clients || res))
      .catch(() => setData(PLACEHOLDER))
  }, [])

  const filtered = data.filter(c =>
    (c.name || '').toLowerCase().includes(search.toLowerCase()) ||
    c.code?.toLowerCase().includes(search.toLowerCase())
  )

  const openNew = () => { setForm(EMPTY_CLIENT); setCodeAutoSet(true); setModalOpen(true) }

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      const res = await clientsApi.create(form)
      setData(prev => [...prev, { ...form, ...(res.client || res) }])
      setModalOpen(false)
    } catch {
      setData(prev => [...prev, { ...form, id: Date.now() }])
      setModalOpen(false)
    } finally {
      setSaving(false)
    }
  }

  const set = (k) => (e) => setForm(p => ({ ...p, [k]: e.target.value }))

  const handleNameChange = (e) => {
    const name = e.target.value
    setForm(p => ({ ...p, name, ...(codeAutoSet ? { code: deriveCode(name) } : {}) }))
  }

  const handleCodeChange = (e) => {
    setCodeAutoSet(false)
    setForm(p => ({ ...p, code: e.target.value.toUpperCase() }))
  }

  return (
    <div className="space-y-6 max-w-6xl">
      <PageHeader title="Clients" subtitle={`${data.length} client${data.length !== 1 ? 's' : ''} registered`}>
        <Button onClick={openNew}><Plus size={15} /> New Client</Button>
      </PageHeader>

      {/* Search */}
      <div className="relative">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-valo-subtle" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search clients…"
          className="w-full max-w-sm bg-valo-card border border-valo-border rounded-lg pl-9 pr-4 py-2 text-valo-text text-sm placeholder:text-valo-muted focus:outline-none focus:border-valo-accent/60 transition-colors"
        />
      </div>

      {/* Grid cards */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(c => (
          <Link
            key={c.id}
            to={`/clients/${c.id}`}
            className="bg-valo-card border border-valo-border rounded-xl p-5 hover:border-valo-accent/30 transition-colors group"
          >
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="w-10 h-10 bg-valo-accent/10 rounded-lg flex items-center justify-center shrink-0">
                <span className="text-valo-accent font-bold text-sm">{c.code || c.name.slice(0, 2).toUpperCase()}</span>
              </div>
              <Badge status={c.status || 'active'} />
            </div>
            <div className="text-valo-text font-semibold text-sm mb-1 group-hover:text-valo-accent transition-colors">{c.name}</div>
            {c.email && (
              <div className="flex items-center gap-1.5 text-valo-subtle text-xs mt-1.5">
                <Mail size={11} /> {c.email}
              </div>
            )}
            {c.billing_model && (
              <div className="text-valo-muted text-xs mt-2 capitalize">{c.billing_model.replace('_', ' ')} billing</div>
            )}
          </Link>
        ))}

        {/* Add new card */}
        <button
          onClick={openNew}
          className="bg-valo-card/50 border border-dashed border-valo-border rounded-xl p-5 hover:border-valo-accent/40 transition-colors flex flex-col items-center justify-center gap-2 text-valo-muted hover:text-valo-subtle"
        >
          <Plus size={20} />
          <span className="text-sm">Add Client</span>
        </button>
      </div>

      {/* New client modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="New Client" size="lg">
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Input label="Company Name" value={form.name} onChange={handleNameChange} required placeholder="e.g. Convenient Gas Solutions" />
            </div>
            <Input label="Client Code" value={form.code} onChange={handleCodeChange} required placeholder="Auto-generated from name" />
            <Select label="Billing Model" value={form.billing_model} onChange={set('billing_model')}>
              <option value="project">Project (once-off)</option>
              <option value="percentage">Percentage of revenue</option>
              <option value="retainer">Monthly retainer</option>
              <option value="passthrough">Infrastructure pass-through</option>
              <option value="hourly">Hourly</option>
            </Select>
            <Input label="Email" type="email" value={form.email} onChange={set('email')} placeholder="accounts@client.co.za" />
            <Input label="Phone" value={form.phone} onChange={set('phone')} placeholder="+27 xx xxx xxxx" />
            <Input label="Payment Terms (days)" type="number" value={form.payment_terms} onChange={set('payment_terms')} />
            <Select label="Status" value={form.status} onChange={set('status')}>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </Select>
            <div className="col-span-2">
              <Textarea label="Address" value={form.address} onChange={set('address')} rows={2} placeholder="Physical / postal address" />
            </div>
            <div className="col-span-2">
              <Textarea label="Notes" value={form.notes} onChange={set('notes')} rows={3} placeholder="Billing terms, special conditions…" />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button type="submit" loading={saving}>Save Client</Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
