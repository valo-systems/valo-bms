import { useState, useEffect } from 'react'
import { paymentPlans as plansApi } from '../api/endpoints'
import Badge from './ui/Badge'
import Button from './ui/Button'
import Modal from './ui/Modal'
import { Textarea } from './ui/Input'
import {
  Plus, Trash2, Edit, Save, X, FileText, Printer,
  CalendarClock, CheckCircle2, Clock, AlertCircle,
} from 'lucide-react'
import { format } from 'date-fns'
import logoInvoice from '../assets/logo-invoice.png'

const fmt = (n) => n != null
  ? new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR', minimumFractionDigits: 2 }).format(parseFloat(n))
  : '-'

const INST_ICON = {
  paid:    <CheckCircle2 size={13} className="text-valo-green" />,
  pending: <Clock        size={13} className="text-valo-amber" />,
  overdue: <AlertCircle  size={13} className="text-valo-red"   />,
}

function generateInstalments(total, count, firstDate, existing = []) {
  const base = Math.floor((total / count) * 100) / 100
  const last = Math.round((total - base * (count - 1)) * 100) / 100
  return Array.from({ length: count }, (_, i) => {
    const d = new Date(firstDate + 'T12:00:00')
    d.setMonth(d.getMonth() + i)
    return {
      instalment_no: i + 1,
      due_date: d.toISOString().slice(0, 10),
      amount: String(i === count - 1 ? last : base),
      status: existing[i]?.status || 'pending',
      paid_date: existing[i]?.paid_date || '',
      notes: existing[i]?.notes || '',
    }
  })
}

// ── Instalment Statement (print-ready document) ───────────────────────────────
export function InstalmentStatement({ plan, instalment, client }) {
  const all     = plan.instalments || []
  const total   = parseFloat(plan.total_amount || 0)
  const paid    = all.filter(i => i.status === 'paid').reduce((s, i) => s + parseFloat(i.amount || 0), 0)
  const thisAmt = parseFloat(instalment.amount || 0)
  const remaining = Math.max(0, total - paid - (instalment.status !== 'paid' ? thisAmt : 0))

  return (
    <div id="statement-print" className="bg-white text-gray-900 rounded-xl overflow-hidden">

      <div className="flex items-start justify-between px-8 py-6 border-b border-gray-200">
        <img src={logoInvoice} alt="Valo Systems" className="h-16 w-auto" />
        <div className="text-right">
          <div className="text-lg font-bold text-gray-900 mb-1">Payment Schedule Statement</div>
          <div className="text-xs text-gray-500">Generated {format(new Date(), 'd MMMM yyyy')}</div>
          <div className="text-xs font-mono text-blue-700 mt-1">{plan.reference}</div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-8 px-8 py-5 border-b border-gray-200">
        <div>
          <div className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-1">From</div>
          <div className="font-bold text-gray-900">VALO (PTY) LTD</div>
          <div className="text-xs text-gray-500 mt-0.5">Trading as Valo Systems · billing@valosystems.co.za</div>
          <div className="text-xs text-gray-400 mt-0.5">Reg No: 2026/072094/07</div>
        </div>
        <div>
          <div className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-1">To</div>
          <div className="font-bold text-gray-900">{client?.name || plan.client_name}</div>
          {client?.accounts_email && <div className="text-xs text-gray-500 mt-0.5">{client.accounts_email}</div>}
        </div>
      </div>

      <div className="px-8 py-4 bg-blue-50 border-b border-blue-100">
        <div className="text-xs text-blue-600 uppercase tracking-wider font-semibold mb-0.5">
          Instalment {instalment.instalment_no} of {all.length}
        </div>
        <div className="text-2xl font-bold text-blue-900">{fmt(thisAmt)}</div>
        <div className="text-xs text-blue-700 mt-0.5">
          Due {instalment.due_date ? format(new Date(instalment.due_date), 'd MMMM yyyy') : '—'}
          {instalment.notes && <span className="ml-2 text-blue-500 italic">· {instalment.notes}</span>}
        </div>
        {plan.description && <div className="text-xs text-blue-600 mt-1">{plan.description}</div>}
      </div>

      <div className="px-8 py-5 border-b border-gray-200">
        <div className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">Full Payment Schedule</div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left text-gray-500 font-medium pb-2 pr-4 w-8">#</th>
              <th className="text-left text-gray-500 font-medium pb-2">Due Date</th>
              <th className="text-right text-gray-500 font-medium pb-2">Amount</th>
              <th className="text-center text-gray-500 font-medium pb-2 pl-4">Status</th>
              <th className="text-left text-gray-500 font-medium pb-2 pl-4">Note</th>
            </tr>
          </thead>
          <tbody>
            {all.map((inst, i) => {
              const isCurrent = inst.instalment_no === instalment.instalment_no
              return (
                <tr key={i} className={`border-b ${isCurrent ? 'bg-blue-50' : 'border-gray-100'}`}>
                  <td className={`py-2.5 pr-4 font-mono text-xs ${isCurrent ? 'text-blue-700 font-bold' : 'text-gray-400'}`}>
                    {inst.instalment_no}
                  </td>
                  <td className={`py-2.5 ${isCurrent ? 'text-blue-900 font-semibold' : 'text-gray-700'}`}>
                    {inst.due_date ? format(new Date(inst.due_date), 'd MMM yyyy') : '—'}
                    {isCurrent && <span className="ml-2 text-xs text-blue-500 font-normal">← this statement</span>}
                  </td>
                  <td className={`py-2.5 text-right tabular-nums font-medium ${isCurrent ? 'text-blue-900 font-bold' : 'text-gray-900'}`}>
                    {fmt(inst.amount)}
                  </td>
                  <td className="py-2.5 text-center pl-4">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                      inst.status === 'paid'    ? 'bg-green-100 text-green-700' :
                      inst.status === 'overdue' ? 'bg-red-100 text-red-700'    :
                      isCurrent                 ? 'bg-blue-100 text-blue-700'  :
                                                  'bg-gray-100 text-gray-500'
                    }`}>
                      {inst.status === 'paid' ? 'Paid' : inst.status === 'overdue' ? 'Overdue' : isCurrent ? 'Due' : 'Pending'}
                    </span>
                  </td>
                  <td className="py-2.5 pl-4 text-xs text-gray-400 italic">{inst.notes || ''}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <div className="px-8 py-5 border-b border-gray-200">
        <div className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">Account Summary</div>
        <div className="max-w-xs ml-auto">
          <table className="w-full text-sm">
            <tbody>
              <tr className="border-b border-gray-100">
                <td className="py-1.5 text-gray-600 pr-8">Total agreement value</td>
                <td className="py-1.5 text-right tabular-nums text-gray-900 font-medium">{fmt(total)}</td>
              </tr>
              <tr className="border-b border-gray-100">
                <td className="py-1.5 text-gray-600">Paid to date</td>
                <td className="py-1.5 text-right tabular-nums text-green-700 font-medium">{fmt(paid)}</td>
              </tr>
              <tr className="border-b border-gray-200">
                <td className="py-1.5 text-blue-700 font-semibold">This instalment</td>
                <td className="py-1.5 text-right tabular-nums text-blue-900 font-bold text-base">{fmt(thisAmt)}</td>
              </tr>
              <tr>
                <td className="pt-2 pb-1 text-gray-500 text-xs">Remaining after this payment</td>
                <td className="pt-2 pb-1 text-right tabular-nums text-gray-700 font-semibold">{fmt(remaining)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div className="px-8 py-5 border-b border-gray-200">
        <div className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">Payment Details</div>
        <div className="grid grid-cols-3 gap-4 text-xs">
          {[
            ['Bank',           'FNB / RMB'],
            ['Account Holder', 'Valo'],
            ['Account Type',   'Gold Business Account'],
            ['Account Number', '63194158987'],
            ['Branch Code',    '255355'],
            ['Reference',      plan.reference],
          ].map(([label, val]) => (
            <div key={label}>
              <div className="text-gray-400 mb-0.5">{label}</div>
              <div className={`font-semibold text-gray-900 ${label === 'Reference' ? 'text-blue-700' : ''}`}>{val}</div>
            </div>
          ))}
        </div>
        <div className="mt-3 text-xs text-gray-600 bg-yellow-50 border border-yellow-200 rounded p-2">
          Please use the reference <strong>{plan.reference}</strong> when making payment. Late payments accrue interest at the South African prime lending rate + 2% per annum, calculated daily from the due date.
        </div>
      </div>

      <div className="px-8 py-4 bg-gray-50 text-xs text-gray-400 text-center">
        VALO (PTY) LTD · Reg No: 2026/072094/07 · billing@valosystems.co.za
        <br />This statement is issued in accordance with the payment arrangement under {plan.reference}.
      </div>
    </div>
  )
}

// ── Statement modal ───────────────────────────────────────────────────────────
export function StatementModal({ open, onClose, plan, instalment, client }) {
  if (!plan || !instalment) return null
  return (
    <Modal open={open} onClose={onClose} title={`Statement — Instalment ${instalment.instalment_no} of ${plan.instalments?.length}`} size="xl">
      <div className="max-h-[75vh] overflow-y-auto -mx-6 px-6">
        <InstalmentStatement plan={plan} instalment={instalment} client={client} />
      </div>
      <div className="flex justify-end gap-3 pt-4 mt-2 border-t border-valo-border">
        <Button variant="secondary" onClick={onClose}><X size={14} /> Close</Button>
        <Button onClick={() => window.print()}><Printer size={14} /> Print / Save PDF</Button>
      </div>
      <style>{`
        @media print {
          body > * { display: none !important; }
          #statement-print { display: block !important; }
        }
      `}</style>
    </Modal>
  )
}

// ── Plan modal (create / edit) ────────────────────────────────────────────────
export function PlanModal({ open, onClose, plan, clientId, defaultInvoiceId, invoiceList, onSaved }) {
  const editing = !!plan

  const [invoiceId, setInvoiceId]   = useState('')
  const [count, setCount]           = useState('4')
  const [firstDate, setFirstDate]   = useState('')
  const [instalments, setInstalments] = useState([])
  const [notes, setNotes]           = useState('')
  const [saving, setSaving]         = useState(false)

  const selectedInvoice = invoiceList.find(inv => String(inv.id) === String(invoiceId))
  const invoiceTotal    = parseFloat(selectedInvoice?.total || 0)
  const autoRef         = selectedInvoice ? `${selectedInvoice.number}-PP` : ''

  // Initialise when modal opens
  useEffect(() => {
    if (!open) return
    if (plan) {
      setInvoiceId(String(plan.invoice_id || ''))
      setCount(String(plan.instalments?.length || 4))
      setFirstDate(plan.instalments?.[0]?.due_date?.slice(0, 10) || '')
      setInstalments((plan.instalments || []).map(i => ({ ...i })))
      setNotes(plan.notes || '')
    } else {
      const preselect = defaultInvoiceId
        ? String(defaultInvoiceId)
        : invoiceList[0] ? String(invoiceList[0].id) : ''
      setInvoiceId(preselect)
      setCount('4')
      setFirstDate('')
      setInstalments([])
      setNotes('')
    }
  }, [open])  // eslint-disable-line react-hooks/exhaustive-deps

  // Reactively regenerate schedule when inputs change (create mode only)
  useEffect(() => {
    if (editing) return
    const n = parseInt(count)
    if (invoiceTotal > 0 && n >= 1 && firstDate) {
      setInstalments(generateInstalments(invoiceTotal, n, firstDate))
    } else {
      setInstalments([])
    }
  }, [invoiceTotal, count, firstDate, editing])

  const setInstField = (i, field, val) => setInstalments(prev => {
    const rows = [...prev]
    rows[i] = { ...rows[i], [field]: val }
    return rows
  })

  const handleSave = async (e) => {
    e.preventDefault()
    if (!invoiceId || instalments.length === 0) return
    setSaving(true)
    try {
      const payload = {
        client_id: clientId,
        invoice_id: invoiceId,
        reference: plan?.reference || autoRef,
        total_amount: invoiceTotal || plan?.total_amount,
        currency: 'ZAR',
        status: 'active',
        notes,
        instalments,
      }
      const res = editing
        ? await plansApi.update(plan.id, payload)
        : await plansApi.create(payload)
      onSaved(res.plan)
      onClose()
    } catch (err) {
      alert('Could not save: ' + (err?.message || err?.error || 'unknown error'))
    } finally {
      setSaving(false)
    }
  }

  const canSave = invoiceId && instalments.length > 0

  return (
    <Modal open={open} onClose={onClose} title={editing ? 'Edit Payment Plan' : 'New Payment Plan'} size="md">
      <form onSubmit={handleSave} className="space-y-5">

        {/* Invoice selector */}
        <div>
          <label className="block text-valo-subtle text-xs font-medium uppercase tracking-wide mb-1.5">
            Invoice <span className="text-valo-red">*</span>
          </label>
          <select
            value={invoiceId}
            onChange={e => setInvoiceId(e.target.value)}
            required
            disabled={editing}
            className="w-full bg-valo-black border border-valo-border rounded-lg px-3 py-2.5 text-valo-text text-sm focus:outline-none focus:border-valo-accent/60 transition-colors disabled:opacity-60"
          >
            <option value="">— select invoice —</option>
            {invoiceList.map(inv => (
              <option key={inv.id} value={inv.id}>
                {inv.number} · {fmt(inv.total)}
              </option>
            ))}
          </select>
        </div>

        {/* Auto-derived: reference + total */}
        {(selectedInvoice || editing) && (
          <div className="flex items-center justify-between bg-valo-black/50 border border-valo-border/50 rounded-lg px-4 py-3">
            <div>
              <div className="text-valo-muted text-xs mb-0.5">Reference (auto)</div>
              <div className="text-valo-accent font-mono font-semibold text-sm">{plan?.reference || autoRef}</div>
            </div>
            <div className="text-right">
              <div className="text-valo-muted text-xs mb-0.5">Total</div>
              <div className="text-valo-text font-semibold">{fmt(invoiceTotal || plan?.total_amount)}</div>
            </div>
          </div>
        )}

        {/* Count + first date */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-valo-subtle text-xs font-medium uppercase tracking-wide mb-1.5">Instalments</label>
            <input
              type="number" min="1" max="60" value={count}
              onChange={e => setCount(e.target.value)}
              className="w-full bg-valo-black border border-valo-border rounded-lg px-3 py-2.5 text-valo-text text-sm focus:outline-none focus:border-valo-accent/60 transition-colors"
            />
          </div>
          <div>
            <label className="block text-valo-subtle text-xs font-medium uppercase tracking-wide mb-1.5">First payment date</label>
            <input
              type="date" value={firstDate}
              onChange={e => setFirstDate(e.target.value)}
              className="w-full bg-valo-black border border-valo-border rounded-lg px-3 py-2.5 text-valo-text text-sm focus:outline-none focus:border-valo-accent/60 transition-colors"
            />
          </div>
        </div>

        {/* Generated schedule */}
        {instalments.length > 0 ? (
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-valo-text font-semibold text-xs uppercase tracking-wide">Schedule</span>
              <span className="text-valo-muted text-xs">{instalments.length} instalments · {fmt(instalments.reduce((s,i) => s + parseFloat(i.amount||0), 0))}</span>
            </div>
            <div className="space-y-1.5 max-h-56 overflow-y-auto pr-0.5">
              {instalments.map((inst, i) => (
                <div key={i} className="flex items-center gap-2 bg-valo-black/40 rounded-lg px-3 py-2">
                  <span className="text-valo-muted text-xs font-mono w-5 shrink-0">#{inst.instalment_no}</span>
                  <span className="text-valo-subtle text-xs w-24 shrink-0">
                    {inst.due_date ? format(new Date(inst.due_date), 'd MMM yyyy') : '—'}
                  </span>
                  <span className="text-valo-text text-xs font-medium tabular-nums w-20 text-right shrink-0">{fmt(inst.amount)}</span>
                  <select
                    value={inst.status}
                    onChange={e => setInstField(i, 'status', e.target.value)}
                    className="bg-valo-black border border-valo-border rounded px-1.5 py-1 text-valo-text text-xs focus:outline-none shrink-0"
                  >
                    <option value="pending">Pending</option>
                    <option value="paid">Paid</option>
                    <option value="overdue">Overdue</option>
                  </select>
                  <input
                    value={inst.notes || ''}
                    onChange={e => setInstField(i, 'notes', e.target.value)}
                    placeholder="note…"
                    className="flex-1 min-w-0 bg-transparent border-b border-valo-border/40 text-valo-subtle text-xs py-0.5 focus:outline-none focus:border-valo-accent/40"
                  />
                </div>
              ))}
            </div>
          </div>
        ) : invoiceId ? (
          <div className="text-center py-5 text-valo-muted text-xs border border-dashed border-valo-border rounded-lg">
            Enter number of instalments and first payment date
          </div>
        ) : null}

        <Textarea
          label="Notes (internal)"
          value={notes}
          onChange={e => setNotes(e.target.value)}
          rows={2}
          placeholder="Any terms or context"
        />

        <div className="flex justify-end gap-3 pt-1">
          <Button type="button" variant="secondary" onClick={onClose}><X size={14} /> Cancel</Button>
          <Button type="submit" loading={saving} disabled={!canSave}>
            <Save size={14} /> {editing ? 'Save Changes' : 'Create Plan'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}

// ── Full section (used in ClientDetail and InvoiceDetail) ─────────────────────
export default function PaymentPlansSection({ clientId, invoiceId, invoiceList, client }) {
  const [plans, setPlans]         = useState([])
  const [planModal, setPlanModal] = useState({ open: false, plan: null })
  const [stmtModal, setStmtModal] = useState({ open: false, plan: null, instalment: null })

  useEffect(() => {
    if (!clientId) return
    plansApi.list({ client_id: clientId })
      .then(res => setPlans(res.plans || []))
      .catch(() => {})
  }, [clientId])

  const visiblePlans = invoiceId
    ? plans.filter(p => String(p.invoice_id) === String(invoiceId))
    : plans

  const handlePlanSaved = (plan) => {
    setPlans(prev => {
      const idx = prev.findIndex(p => p.id === plan.id)
      if (idx >= 0) { const n = [...prev]; n[idx] = plan; return n }
      return [plan, ...prev]
    })
  }

  const handleDelete = async (planId) => {
    if (!window.confirm('Delete this payment plan and all instalments?')) return
    await plansApi.delete(planId)
    setPlans(prev => prev.filter(p => p.id !== planId))
  }

  return (
    <>
      <div className="bg-valo-card border border-valo-border rounded-xl no-print">
        <div className="flex items-center justify-between px-5 py-4 border-b border-valo-border">
          <div className="flex items-center gap-2">
            <CalendarClock size={14} className="text-valo-accent" />
            <h2 className="text-valo-text font-semibold text-sm">Payment Plans</h2>
          </div>
          <Button size="sm" onClick={() => setPlanModal({ open: true, plan: null })}>
            <Plus size={13} /> New Plan
          </Button>
        </div>

        {visiblePlans.length === 0 ? (
          <div className="px-5 py-8 text-center text-valo-subtle text-sm">
            {invoiceId ? 'No payment plan linked to this invoice yet' : 'No payment plans yet'}
          </div>
        ) : (
          <div className="divide-y divide-valo-border">
            {visiblePlans.map(plan => {
              const paid  = plan.instalments?.filter(i => i.status === 'paid').reduce((s, i) => s + parseFloat(i.amount || 0), 0) || 0
              const total = parseFloat(plan.total_amount || 0)
              const pct   = total > 0 ? Math.min(100, Math.round((paid / total) * 100)) : 0
              return (
                <div key={plan.id} className="px-5 py-4">
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div>
                      <div className="font-mono text-valo-accent text-xs font-semibold">{plan.reference}</div>
                      {plan.description && <div className="text-valo-subtle text-xs mt-0.5">{plan.description}</div>}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge status={plan.status} label={plan.status.charAt(0).toUpperCase() + plan.status.slice(1)} />
                      <button onClick={() => setPlanModal({ open: true, plan })} title="Edit"
                        className="p-1 text-valo-muted hover:text-valo-text transition-colors">
                        <Edit size={13} />
                      </button>
                      <button onClick={() => handleDelete(plan.id)} title="Delete"
                        className="p-1 text-valo-muted hover:text-valo-red transition-colors">
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>

                  <div className="mb-4">
                    <div className="flex justify-between text-xs text-valo-subtle mb-1">
                      <span className="text-valo-green font-medium">{fmt(paid)} paid</span>
                      <span>{fmt(total)} total · {pct}%</span>
                    </div>
                    <div className="h-1.5 bg-valo-dark rounded-full overflow-hidden">
                      <div className="h-full bg-valo-accent rounded-full transition-all" style={{ width: `${pct}%` }} />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    {plan.instalments?.map(inst => (
                      <div key={inst.id} className="flex items-center gap-2 text-xs group">
                        {INST_ICON[inst.status]}
                        <span className="text-valo-subtle w-5 font-mono">#{inst.instalment_no}</span>
                        <span className="text-valo-text tabular-nums font-medium w-24">{fmt(inst.amount)}</span>
                        <span className="text-valo-muted">
                          due {inst.due_date ? format(new Date(inst.due_date), 'd MMM yyyy') : '—'}
                        </span>
                        {inst.notes && <span className="text-valo-subtle italic truncate">{inst.notes}</span>}
                        <button
                          onClick={() => setStmtModal({ open: true, plan, instalment: inst })}
                          className="ml-auto opacity-0 group-hover:opacity-100 flex items-center gap-1 text-valo-muted hover:text-valo-accent transition-all px-2 py-0.5 rounded border border-transparent hover:border-valo-border"
                          title="View statement"
                        >
                          <FileText size={11} /> Statement
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      <PlanModal
        open={planModal.open}
        onClose={() => setPlanModal({ open: false, plan: null })}
        plan={planModal.plan}
        clientId={clientId}
        defaultInvoiceId={invoiceId}
        invoiceList={invoiceList || []}
        onSaved={handlePlanSaved}
      />

      <StatementModal
        open={stmtModal.open}
        onClose={() => setStmtModal({ open: false, plan: null, instalment: null })}
        plan={stmtModal.plan}
        instalment={stmtModal.instalment}
        client={client}
      />
    </>
  )
}
