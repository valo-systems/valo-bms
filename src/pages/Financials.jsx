import { useEffect, useState } from 'react'
import { expenses as expensesApi, clients as clientsApi } from '../api/endpoints'
import Button from '../components/ui/Button'
import Modal from '../components/ui/Modal'
import { Input, Select, Textarea } from '../components/ui/Input'
import { Table, Thead, Th, Tbody, Tr, Td } from '../components/ui/Table'
import { PageHeader, EmptyState, SectionCard } from '../components/ui/Typography'
import StatCard from '../components/ui/StatCard'
import { Plus, TrendingDown, TrendingUp, DollarSign, AlertCircle, Search, ArrowUpRight } from 'lucide-react'
import { format } from 'date-fns'

const fmt  = (n) => new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR', minimumFractionDigits: 2 }).format(parseFloat(n) || 0)
const fmtU = (n) => `$${parseFloat(n).toFixed(2)}`

const CATEGORIES = ['infrastructure', 'software', 'operations', 'marketing', 'travel', 'other']
const CAT_COLORS  = {
  infrastructure: 'bg-blue-900/30 text-blue-400',
  software:       'bg-purple-900/30 text-purple-400',
  operations:     'bg-valo-muted/40 text-valo-subtle',
  marketing:      'bg-pink-900/30 text-pink-400',
  travel:         'bg-amber-900/30 text-amber-400',
  other:          'bg-valo-border/40 text-valo-muted',
}
const TABS = ['All', 'Infrastructure', 'Software', 'Operations', 'Other']

const EMPTY = {
  description: '', category: 'infrastructure', supplier: '', amount: '',
  usd_amount: '', fx_rate: '', date: new Date().toISOString().split('T')[0],
  client: '', client_id: '', billable: true, pass_through: true, notes: '',
}

export default function Financials() {
  const [expenses, setExpenses]   = useState([])
  const [clients, setClients]     = useState([])
  const [tab, setTab]             = useState('All')
  const [search, setSearch]       = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm]           = useState(EMPTY)
  const [saving, setSaving]       = useState(false)

  useEffect(() => {
    expensesApi.list().then(res => setExpenses(res.expenses || res)).catch(() => {})
    clientsApi.list().then(res => setClients(res.clients || res)).catch(() => {})
  }, [])

  const set = (k) => (e) => setForm(p => ({ ...p, [k]: e.target.value }))

  // When client selected from dropdown, also populate the text code
  const handleClientChange = (e) => {
    const cid = e.target.value
    const cl  = clients.find(c => String(c.id) === String(cid))
    setForm(p => ({ ...p, client_id: cid, client: cl?.code || '' }))
  }

  const handleSave = async (evt) => {
    evt.preventDefault()
    setSaving(true)
    try {
      const res = await expensesApi.create({ ...form, billable: form.billable ? true : false, pass_through: form.pass_through ? true : false })
      setExpenses(prev => [res.expense || res, ...prev])
      setModalOpen(false)
      setForm(EMPTY)
    } catch {}
    finally { setSaving(false) }
  }

  const filtered = expenses.filter(exp => {
    const q = search.toLowerCase()
    const matchSearch = !q || exp.description?.toLowerCase().includes(q) || (exp.client_name || exp.client || '').toLowerCase().includes(q) || exp.supplier?.toLowerCase().includes(q)
    const matchTab =
      tab === 'All'            ? true :
      tab === 'Infrastructure' ? exp.category === 'infrastructure' :
      tab === 'Software'       ? exp.category === 'software' :
      tab === 'Operations'     ? exp.category === 'operations' :
      ['marketing','travel','other'].includes(exp.category)
    return matchSearch && matchTab
  })

  const totalAll      = expenses.reduce((s, e) => s + parseFloat(e.amount || 0), 0)
  const billableTotal = expenses.filter(e => e.billable || e.pass_through).reduce((s, e) => s + parseFloat(e.amount || 0), 0)
  const internalTotal = totalAll - billableTotal
  const infraTotal    = expenses.filter(e => e.category === 'infrastructure').reduce((s, e) => s + parseFloat(e.amount || 0), 0)

  // Group by client for pass-through summary
  const byClient = {}
  expenses.filter(e => e.billable || e.pass_through).forEach(e => {
    const key = e.client_name || e.client || 'Unassigned'
    byClient[key] = (byClient[key] || 0) + parseFloat(e.amount || 0)
  })

  return (
    <div className="space-y-6 max-w-6xl">
      <PageHeader title="Financials" subtitle="Expenses, infrastructure costs &amp; pass-throughs">
        <Button onClick={() => { setForm(EMPTY); setModalOpen(true) }}>
          <Plus size={15} /> Log Expense
        </Button>
      </PageHeader>

      {/* Summary tiles */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
        <StatCard label="Total Expenses"   value={fmt(totalAll)}      sub={`${expenses.length} entries`}      icon={TrendingDown} color="red" />
        <StatCard label="Billable / Pass"  value={fmt(billableTotal)} sub="Recoverable from clients"          icon={ArrowUpRight}  color="green" />
        <StatCard label="Valo Internal"    value={fmt(internalTotal)} sub="Direct cost, not billed"          icon={DollarSign}   color="amber" />
        <StatCard label="Infrastructure"   value={fmt(infraTotal)}    sub="SMS, hosting, cloud"               icon={AlertCircle}  color="blue" />
      </div>

      {/* Pass-through by client */}
      {Object.keys(byClient).length > 0 && (
        <SectionCard title="Billable Costs by Client" icon={ArrowUpRight}>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {Object.entries(byClient).sort((a, b) => b[1] - a[1]).map(([client, total]) => (
              <div key={client} className="bg-valo-dark border border-valo-border rounded-lg p-3">
                <div className="text-valo-subtle text-xs mb-1">{client}</div>
                <div className="text-valo-text text-sm font-semibold tabular-nums">{fmt(total)}</div>
                <div className="h-1 mt-2 bg-valo-border rounded-full overflow-hidden">
                  <div className="h-full bg-valo-accent rounded-full" style={{ width: `${Math.min(100, (total / billableTotal) * 100)}%` }} />
                </div>
              </div>
            ))}
          </div>
        </SectionCard>
      )}

      {/* Tabs + search */}
      <div className="flex items-center justify-between gap-3 border-b border-valo-border pb-3 overflow-x-auto scrollbar-none">
        <div className="flex gap-1 shrink-0">
          {TABS.map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-3 min-h-[36px] text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${
                tab === t ? 'bg-valo-accent text-valo-black' : 'text-valo-subtle hover:text-valo-text'
              }`}>
              {t}
            </button>
          ))}
        </div>
        <div className="relative">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-valo-subtle" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search expenses…"
            className="bg-valo-card border border-valo-border rounded-lg pl-8 pr-4 py-1.5 text-valo-text text-sm placeholder:text-valo-muted focus:outline-none focus:border-valo-accent/60 w-48" />
        </div>
      </div>

      {/* Table */}
      <div className="bg-valo-card border border-valo-border rounded-xl overflow-hidden">
        <Table>
          <Thead>
            <Th>Description</Th>
            <Th>Supplier</Th>
            <Th>Client</Th>
            <Th>Category</Th>
            <Th>Date</Th>
            <Th>Type</Th>
            <Th right>Amount</Th>
          </Thead>
          <Tbody>
            {filtered.map(exp => (
              <Tr key={exp.id}>
                <Td>
                  <div className="text-valo-text text-sm">{exp.description}</div>
                  {exp.usd_amount && (
                    <div className="text-valo-muted text-xs mt-0.5">{fmtU(exp.usd_amount)}{exp.fx_rate ? ` @ R${parseFloat(exp.fx_rate).toFixed(2)}` : ''}</div>
                  )}
                  {exp.notes && <div className="text-valo-muted text-xs mt-0.5 italic">{exp.notes}</div>}
                </Td>
                <Td muted>{exp.supplier || '-'}</Td>
                <Td muted>{exp.client_name || exp.client || '-'}</Td>
                <Td>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${CAT_COLORS[exp.category] || CAT_COLORS.other}`}>
                    {exp.category}
                  </span>
                </Td>
                <Td muted>{exp.date ? format(new Date(exp.date), 'd MMM yyyy') : '-'}</Td>
                <Td>
                  {(exp.pass_through || exp.billable)
                    ? <span className="text-valo-green text-xs font-medium">Pass-through</span>
                    : <span className="text-valo-muted text-xs">Internal</span>
                  }
                </Td>
                <Td right><span className="font-medium text-sm">{fmt(exp.amount)}</span></Td>
              </Tr>
            ))}
            {filtered.length === 0 && (
              <Tr>
                <Td colSpan={7}>
                  <EmptyState
                    icon={TrendingDown}
                    title={search || tab !== 'All' ? 'No expenses match' : 'No expenses logged yet'}
                    description={search || tab !== 'All' ? 'Try adjusting your search or category filter.' : 'Log your first expense to start tracking costs and pass-throughs.'}
                    action={!search && tab === 'All' && <Button size="sm" onClick={() => { setForm(EMPTY); setModalOpen(true) }}><Plus size={13} /> Log Expense</Button>}
                  />
                </Td>
              </Tr>
            )}
          </Tbody>
        </Table>
        <div className="flex items-center justify-between px-4 py-3 border-t border-valo-border bg-valo-dark/50">
          <span className="text-valo-subtle text-xs">{filtered.length} expense{filtered.length !== 1 ? 's' : ''}</span>
          <span className="text-valo-text text-sm font-semibold">
            {fmt(filtered.reduce((s, e) => s + parseFloat(e.amount || 0), 0))}
          </span>
        </div>
      </div>

      {/* Log expense modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Log Expense" size="md">
        <form onSubmit={handleSave} className="space-y-4">
          <Textarea label="Description" value={form.description} onChange={set('description')} required rows={2} placeholder="e.g. WinSMS - CGS (327 messages × R0.38, May 2026)" />

          <div className="grid grid-cols-2 gap-4">
            <Select label="Category" value={form.category} onChange={set('category')}>
              {CATEGORIES.map(c => <option key={c} value={c} className="capitalize">{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
            </Select>
            <Input label="Supplier / Vendor" value={form.supplier} onChange={set('supplier')} placeholder="e.g. WinSMS" />
            <Input label="Amount (ZAR)" type="number" step="0.01" min="0" value={form.amount} onChange={set('amount')} required placeholder="0.00" />
            <Input label="Date" type="date" value={form.date} onChange={set('date')} required />
            <Input label="USD Amount (if applicable)" type="number" step="0.0001" min="0" value={form.usd_amount} onChange={set('usd_amount')} placeholder="Optional" />
            <Input label="FX Rate used" type="number" step="0.0001" value={form.fx_rate} onChange={set('fx_rate')} placeholder="e.g. 18.9500" />
            <Select label="Client" value={form.client_id} onChange={handleClientChange}>
              <option value="">Valo internal</option>
              {clients.map(c => <option key={c.id} value={c.id}>{c.name} ({c.code})</option>)}
            </Select>
          </div>

          <div className="flex flex-col gap-2 pt-1">
            <label className="flex items-center gap-2 text-sm text-valo-text cursor-pointer">
              <input type="checkbox" checked={form.pass_through} onChange={e => setForm(p => ({ ...p, pass_through: e.target.checked, billable: e.target.checked }))}
                className="rounded border-valo-border bg-valo-black text-valo-accent focus:ring-0" />
              Pass-through to client (billed at cost on invoice)
            </label>
          </div>

          <Input label="Notes" value={form.notes} onChange={set('notes')} placeholder="e.g. included on VAL-CGS-2026-002" />

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button type="submit" loading={saving}>Save Expense</Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
