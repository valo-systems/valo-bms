import { useEffect, useState, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { invoices as invoicesApi } from '../api/endpoints'
import Badge from '../components/ui/Badge'
import Button from '../components/ui/Button'
import { Table, Thead, Th, Tbody, Tr, Td } from '../components/ui/Table'
import { PageHeader, EmptyState } from '../components/ui/Typography'
import { Plus, Search, ChevronDown, CheckCircle, Receipt } from 'lucide-react'
import { format } from 'date-fns'

const fmt = (n) => new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR', minimumFractionDigits: 2 }).format(parseFloat(n) || 0)

const ALL_STATUSES = ['draft', 'estimated', 'confirmed', 'sent', 'partial', 'paid', 'overdue']
const FILTER_TABS  = ['all', 'unpaid', 'paid', 'overdue', 'draft']

const STATUS_LABEL = { draft: 'Draft', estimated: 'Estimated', confirmed: 'Confirmed', sent: 'Sent', partial: 'Part Paid', paid: 'Paid', overdue: 'Overdue' }

function StatusDropdown({ invoice, onUpdated }) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const ref = useRef()

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const change = async (status, e) => {
    e.stopPropagation()
    setOpen(false)
    if (status === invoice.status) return
    setLoading(true)
    try {
      await invoicesApi.updateStatus(invoice.id, status)
      onUpdated(invoice.id, status)
    } catch {}
    finally { setLoading(false) }
  }

  return (
    <div ref={ref} className="relative" onClick={e => e.stopPropagation()}>
      <button
        onClick={() => setOpen(v => !v)}
        disabled={loading}
        className="flex items-center gap-1 group"
      >
        <Badge status={invoice.status} label={STATUS_LABEL[invoice.status] || invoice.status} />
        <ChevronDown size={11} className="text-valo-muted group-hover:text-valo-subtle transition-colors" />
      </button>
      {open && (
        <div className="absolute top-full left-0 mt-1 z-50 bg-valo-card border border-valo-border rounded-xl shadow-xl overflow-hidden min-w-[140px]">
          {ALL_STATUSES.map(s => (
            <button
              key={s}
              onClick={(e) => change(s, e)}
              className="w-full flex items-center justify-between px-3 py-2 text-xs text-left hover:bg-valo-dark transition-colors gap-3"
            >
              <Badge status={s} label={STATUS_LABEL[s]} />
              {s === invoice.status && <CheckCircle size={11} className="text-valo-accent" />}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export default function Invoices() {
  const [data, setData] = useState([])
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')
  const navigate = useNavigate()

  useEffect(() => {
    invoicesApi.list()
      .then(res => setData(res.invoices || res))
      .catch(() => {})
  }, [])

  const handleStatusUpdate = (id, status) => {
    setData(prev => prev.map(inv => inv.id === id ? { ...inv, status } : inv))
  }

  const filtered = data.filter(inv => {
    const q = search.toLowerCase()
    const matchSearch = !q || inv.number?.toLowerCase().includes(q) || inv.client_name?.toLowerCase().includes(q)
    const matchFilter =
      filter === 'all'    ? true :
      filter === 'unpaid' ? ['confirmed', 'sent', 'partial', 'estimated'].includes(inv.status) :
      filter === 'paid'   ? inv.status === 'paid' :
      filter === 'overdue'? inv.status === 'overdue' :
      filter === 'draft'  ? inv.status === 'draft' : true
    return matchSearch && matchFilter
  })

  const total       = filtered.reduce((s, i) => s + parseFloat(i.total || 0), 0)
  const paidTotal   = data.filter(i => i.status === 'paid').reduce((s, i) => s + parseFloat(i.total || 0), 0)
  const unpaidTotal = data.filter(i => ['confirmed','sent','partial','estimated'].includes(i.status))
                         .reduce((s, i) => s + parseFloat(i.total || 0), 0)
  const overdueTotal = data.filter(i => i.status === 'overdue').reduce((s, i) => s + parseFloat(i.total || 0), 0)

  return (
    <div className="space-y-6 max-w-6xl">
      <PageHeader title="Invoices" subtitle={`${data.length} invoice${data.length !== 1 ? 's' : ''} total`}>
        <Link to="/invoices/new"><Button><Plus size={15} /> New Invoice</Button></Link>
      </PageHeader>

      {/* Summary strip */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Collected', value: fmt(paidTotal), color: 'text-valo-green' },
          { label: 'Outstanding', value: fmt(unpaidTotal), color: 'text-valo-amber' },
          { label: 'Overdue', value: fmt(overdueTotal), color: overdueTotal > 0 ? 'text-valo-red' : 'text-valo-subtle' },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-valo-card border border-valo-border rounded-xl px-5 py-4">
            <div className="text-valo-subtle text-xs uppercase tracking-wider mb-1">{label}</div>
            <div className={`text-lg font-semibold ${color}`}>{value}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="relative shrink-0">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-valo-subtle" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search invoices…"
            className="bg-valo-card border border-valo-border rounded-lg pl-9 pr-4 py-2.5 text-valo-text text-sm placeholder:text-valo-muted focus:outline-none focus:border-valo-accent/60 transition-colors w-full sm:w-56"
          />
        </div>
        <div className="flex gap-1.5 overflow-x-auto scrollbar-none pb-0.5">
          {FILTER_TABS.map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`shrink-0 px-3 min-h-[36px] rounded-lg text-xs font-medium transition-colors capitalize whitespace-nowrap ${
                filter === f ? 'bg-valo-accent text-valo-black' : 'bg-valo-card border border-valo-border text-valo-subtle hover:text-valo-text'
              }`}>
              {f === 'unpaid' ? 'Outstanding' : f}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-valo-card border border-valo-border rounded-xl overflow-hidden">
        <Table>
          <Thead>
            <Th>Invoice</Th>
            <Th>Client</Th>
            <Th>Period</Th>
            <Th>Date</Th>
            <Th>Due</Th>
            <Th>Status</Th>
            <Th right>Amount</Th>
          </Thead>
          <Tbody>
            {filtered.map(inv => (
              <Tr key={inv.id} onClick={() => navigate(`/invoices/${inv.id}`)}>
                <Td><span className="text-valo-accent font-mono text-xs">{inv.number}</span></Td>
                <Td>{inv.client_name}</Td>
                <Td muted>{inv.period || '-'}</Td>
                <Td muted>{inv.date ? format(new Date(inv.date), 'd MMM yyyy') : '-'}</Td>
                <Td muted>
                  {inv.due_date
                    ? <span className={new Date(inv.due_date) < new Date() && inv.status !== 'paid' ? 'text-valo-red' : ''}>
                        {format(new Date(inv.due_date), 'd MMM yyyy')}
                      </span>
                    : '-'}
                </Td>
                <Td>
                  <StatusDropdown invoice={inv} onUpdated={handleStatusUpdate} />
                </Td>
                <Td right>
                  <span className={`font-medium ${inv.status === 'paid' ? 'text-valo-green' : ''}`}>{fmt(inv.total)}</span>
                </Td>
              </Tr>
            ))}
            {filtered.length === 0 && (
              <Tr>
                <Td colSpan={7}>
                  <EmptyState
                    icon={Receipt}
                    title={search || filter !== 'all' ? 'No invoices match' : 'No invoices yet'}
                    description={search || filter !== 'all' ? 'Try adjusting your search or filter.' : 'Create your first invoice to start billing clients.'}
                    action={!search && filter === 'all' && <Link to="/invoices/new"><Button size="sm"><Plus size={13} /> New Invoice</Button></Link>}
                  />
                </Td>
              </Tr>
            )}
          </Tbody>
        </Table>
        {filtered.length > 0 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-valo-border bg-valo-dark/50">
            <span className="text-valo-subtle text-xs">{filtered.length} invoice{filtered.length !== 1 ? 's' : ''}</span>
            <span className="text-valo-text text-sm font-semibold">{fmt(total)}</span>
          </div>
        )}
      </div>

      <p className="text-valo-muted text-xs">
        Click the status badge on any invoice to update it. Open an invoice to view or print it.
      </p>
    </div>
  )
}
