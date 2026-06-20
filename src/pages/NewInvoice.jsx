import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { invoices as invoicesApi, clients as clientsApi } from '../api/endpoints'
import Button from '../components/ui/Button'
import { Input, Select, Textarea } from '../components/ui/Input'
import { Plus, Trash2, ArrowLeft, Info } from 'lucide-react'

const fmt = (n) => new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR', minimumFractionDigits: 2 }).format(parseFloat(n) || 0)

const newLine = () => ({
  section_label: '',
  description: '',
  calculation_detail: '',
  item_note: '',
  quantity: 1,
  unit_price: '',
  usd_amount: '',
  total: 0,
  is_discount: false,
})

const INVOICE_TYPES = [
  { value: 'monthly_service', label: 'Monthly Service (Section A + B)' },
  { value: 'implementation', label: 'Implementation / Go-Live Fee' },
  { value: 'project', label: 'Project (Once-off)' },
  { value: 'infrastructure', label: 'Infrastructure Pass-Through Only' },
  { value: 'custom', label: 'Custom' },
]

export default function NewInvoice() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const [clientList, setClientList] = useState([])
  const [selectedClient, setSelectedClient] = useState(null)
  const [saving, setSaving] = useState(false)

  const today = new Date().toISOString().split('T')[0]
  const thisMonth = new Date()
  const monthLabel = thisMonth.toLocaleString('en-ZA', { month: 'long', year: 'numeric' })
  const firstOfMonth = new Date(thisMonth.getFullYear(), thisMonth.getMonth(), 1).toISOString().split('T')[0]
  const lastOfMonth = new Date(thisMonth.getFullYear(), thisMonth.getMonth() + 1, 0).toISOString().split('T')[0]

  const [form, setForm] = useState({
    client_id: params.get('client') || '',
    number: '',
    invoice_type: 'monthly_service',
    period: monthLabel,
    period_from: firstOfMonth,
    period_to: lastOfMonth,
    date: today,
    due_date: '',
    status: 'draft',
    fx_rate: '',
    fx_policy: 'SARB interbank mid-rate + 8% FX cover on billing date',
    period_note: '',
    commercial_conditions: '',
    internal_notes: '',
    footer_note: '',
    notes: '',
    line_items: [newLine()],
  })

  useEffect(() => {
    clientsApi.list()
      .then(res => setClientList(res.clients || res))
      .catch(() => setClientList([]))
  }, [])

  useEffect(() => {
    if (form.client_id && clientList.length) {
      const c = clientList.find(c => String(c.id) === String(form.client_id))
      if (c) setSelectedClient(c)
    }
  }, [form.client_id, clientList])

  const setField = (k) => (e) => setForm(p => ({ ...p, [k]: e.target.value }))

  const setLine = (i, k) => (e) => {
    const val = e.target.type === 'checkbox' ? e.target.checked : e.target.value
    setForm(p => {
      const lines = [...p.line_items]
      lines[i] = { ...lines[i], [k]: val }
      if (k === 'quantity' || k === 'unit_price') {
        const qty = parseFloat(lines[i].quantity || 0)
        const price = parseFloat(lines[i].unit_price || 0)
        lines[i].total = lines[i].is_discount ? -(qty * price) : qty * price
      }
      if (k === 'is_discount') {
        lines[i].total = val ? -Math.abs(lines[i].total) : Math.abs(lines[i].total)
      }
      return { ...p, line_items: lines }
    })
  }

  const addLine = (sectionLabel = '') => setForm(p => ({
    ...p,
    line_items: [...p.line_items, { ...newLine(), section_label: sectionLabel }]
  }))

  const removeLine = (i) => setForm(p => ({ ...p, line_items: p.line_items.filter((_, idx) => idx !== i) }))

  const subtotal = form.line_items.reduce((s, l) => s + parseFloat(l.total || 0), 0)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      const res = await invoicesApi.create({ ...form, subtotal, total: subtotal })
      navigate(`/invoices/${res.invoice?.id || res.id}`)
    } catch (err) {
      alert('Could not save: ' + (err?.message || 'check your connection'))
    } finally {
      setSaving(false)
    }
  }

  // Auto-generate invoice number and due date when client changes
  const handleClientChange = async (e) => {
    const cid = e.target.value
    const c = clientList.find(x => String(x.id) === cid)
    if (!c) { setForm(p => ({ ...p, client_id: cid })); return }

    const year = new Date().getFullYear()
    const prefix = `VAL-${c.code}-${year}-`

    // Count existing invoices for this client+year to get next sequence number
    let nextSeq = 1
    try {
      const res = await invoicesApi.list({ client_id: cid })
      const existing = (res.invoices || res).filter(i =>
        (i.number || '').startsWith(prefix)
      )
      if (existing.length) {
        const nums = existing.map(i => parseInt((i.number || '').replace(prefix, ''), 10)).filter(n => !isNaN(n))
        nextSeq = Math.max(...nums) + 1
      }
    } catch {}

    const seqStr = String(nextSeq).padStart(3, '0')
    const terms = parseInt(c.payment_terms || 30, 10)
    const invoiceDate = form.date || new Date().toISOString().split('T')[0]
    const dueDate = new Date(new Date(invoiceDate).getTime() + terms * 86400000).toISOString().split('T')[0]

    setForm(p => ({
      ...p,
      client_id: cid,
      number: `${prefix}${seqStr}`,
      due_date: dueDate,
      fx_policy: c.fx_policy || p.fx_policy,
      footer_note: c.agreement_ref ? `This invoice is issued in accordance with the ${c.agreement_ref} between Valo Systems and ${c.name}.` : p.footer_note,
    }))
  }

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex items-center gap-4">
        <Link to="/invoices" className="p-2 text-valo-subtle hover:text-valo-text rounded-lg hover:bg-valo-card transition-colors">
          <ArrowLeft size={18} />
        </Link>
        <h1 className="text-valo-text text-2xl font-semibold">New Invoice</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">

        {/* Header */}
        <div className="bg-valo-card border border-valo-border rounded-xl p-6">
          <h2 className="text-valo-text font-semibold text-sm mb-4">Invoice Details</h2>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="col-span-2 lg:col-span-1">
              <label className="block text-valo-subtle text-xs font-medium uppercase tracking-wide mb-1.5">Client</label>
              <select value={form.client_id} onChange={handleClientChange} required
                className="w-full bg-valo-black border border-valo-border rounded-lg px-3 py-2.5 text-valo-text text-sm focus:outline-none focus:border-valo-accent/60 transition-colors">
                <option value="">Select client…</option>
                {clientList.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <Input label="Invoice Number" value={form.number} onChange={setField('number')} placeholder="VAL-CGS-2026-002" required />
            <Select label="Invoice Type" value={form.invoice_type} onChange={setField('invoice_type')}>
              {INVOICE_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </Select>
            <Input label="Invoice Date" type="date" value={form.date} onChange={setField('date')} required />
            <Input label="Due Date" type="date" value={form.due_date} onChange={setField('due_date')} />
            <Select label="Status" value={form.status} onChange={setField('status')}>
              <option value="draft">Draft</option>
              <option value="estimated">Estimated</option>
              <option value="confirmed">Confirmed</option>
              <option value="sent">Sent</option>
            </Select>
            <Input label="Billing Period Label" value={form.period} onChange={setField('period')} placeholder="April 2026" />
            <Input label="Period From" type="date" value={form.period_from} onChange={setField('period_from')} />
            <Input label="Period To" type="date" value={form.period_to} onChange={setField('period_to')} />
          </div>

          {/* Client quick-info */}
          {selectedClient && (
            <div className="mt-4 p-3 bg-valo-dark rounded-lg border border-valo-border text-xs text-valo-subtle space-y-1">
              {selectedClient.contact_person && <div><span className="text-valo-muted">Contact:</span> {selectedClient.contact_person} · {selectedClient.accounts_email}</div>}
              {selectedClient.service_fee_pct && <div><span className="text-valo-muted">Fee:</span> {selectedClient.service_fee_pct}% · Min R{selectedClient.minimum_monthly}/mo for {selectedClient.minimum_period_months} months</div>}
              {selectedClient.fx_policy && <div><span className="text-valo-muted">FX:</span> {selectedClient.fx_policy}</div>}
              {selectedClient.agreement_notes && <div><span className="text-valo-muted">Note:</span> {selectedClient.agreement_notes}</div>}
            </div>
          )}
        </div>

        {/* FX rate — shown for pass-through / monthly_service */}
        {(form.invoice_type === 'monthly_service' || form.invoice_type === 'infrastructure') && (
          <div className="bg-valo-card border border-valo-border rounded-xl p-6">
            <h2 className="text-valo-text font-semibold text-sm mb-4">Exchange Rate (for USD → ZAR)</h2>
            <div className="grid grid-cols-2 gap-4">
              <Input label="FX Rate (R per USD)" type="number" step="0.0001" value={form.fx_rate} onChange={setField('fx_rate')}
                placeholder="e.g. 20.00 (SARB mid + 8%)" />
              <Input label="FX Policy Note" value={form.fx_policy} onChange={setField('fx_policy')} />
            </div>
          </div>
        )}

        {/* Period note */}
        <div className="bg-valo-card border border-valo-border rounded-xl p-6">
          <h2 className="text-valo-text font-semibold text-sm mb-4">Period &amp; Commercial Notes</h2>
          <div className="space-y-4">
            <Textarea label="Period Note (shown at top of invoice)" value={form.period_note} onChange={setField('period_note')} rows={2}
              placeholder="e.g. Platform provisioned and live: 24 March 2026. By mutual agreement, April 2026 is treated as the first full billing month." />
            <Textarea label="Commercial Conditions" value={form.commercial_conditions} onChange={setField('commercial_conditions')} rows={3}
              placeholder="e.g. Production go-live is conditional upon settlement of this invoice in full." />
            <Textarea label="Footer Note (printed at bottom)" value={form.footer_note} onChange={setField('footer_note')} rows={2}
              placeholder="e.g. This invoice is issued in accordance with the Technology Partnership Agreement…" />
          </div>
        </div>

        {/* Line items */}
        <div className="bg-valo-card border border-valo-border rounded-xl p-6">
          <h2 className="text-valo-text font-semibold text-sm mb-4">Line Items</h2>

          {/* Column headers */}
          <div className="grid grid-cols-12 gap-2 text-valo-subtle text-xs uppercase tracking-wider px-1 mb-2">
            <div className="col-span-1">Section</div>
            <div className="col-span-3">Description</div>
            <div className="col-span-2">Detail / Calc</div>
            <div className="col-span-1 text-right">USD</div>
            <div className="col-span-1 text-right">Qty</div>
            <div className="col-span-1 text-right">Unit (ZAR)</div>
            <div className="col-span-1 text-right">Total</div>
            <div className="col-span-1 text-center">Disc</div>
            <div className="col-span-1" />
          </div>

          <div className="space-y-2">
            {form.line_items.map((line, i) => (
              <div key={i} className="grid grid-cols-12 gap-2 items-start">
                <div className="col-span-1">
                  <input value={line.section_label} onChange={setLine(i, 'section_label')} placeholder="A / B"
                    className="w-full bg-valo-black border border-valo-border rounded px-2 py-2 text-valo-text text-xs focus:outline-none focus:border-valo-accent/60" />
                </div>
                <div className="col-span-3">
                  <input value={line.description} onChange={setLine(i, 'description')} placeholder="Description" required
                    className="w-full bg-valo-black border border-valo-border rounded px-2 py-2 text-valo-text text-sm focus:outline-none focus:border-valo-accent/60" />
                  <input value={line.item_note} onChange={setLine(i, 'item_note')} placeholder="Item note (optional)"
                    className="w-full bg-valo-black border border-valo-border/50 rounded px-2 py-1 text-valo-subtle text-xs mt-1 focus:outline-none focus:border-valo-accent/40" />
                </div>
                <div className="col-span-2">
                  <input value={line.calculation_detail} onChange={setLine(i, 'calculation_detail')} placeholder="Calculation or detail"
                    className="w-full bg-valo-black border border-valo-border rounded px-2 py-2 text-valo-subtle text-xs focus:outline-none focus:border-valo-accent/60" />
                </div>
                <div className="col-span-1">
                  <input type="number" value={line.usd_amount} onChange={setLine(i, 'usd_amount')} placeholder="0.00" step="0.01"
                    className="w-full bg-valo-black border border-valo-border rounded px-2 py-2 text-valo-text text-xs text-right focus:outline-none focus:border-valo-accent/60" />
                </div>
                <div className="col-span-1">
                  <input type="number" value={line.quantity} onChange={setLine(i, 'quantity')} min="0" step="any"
                    className="w-full bg-valo-black border border-valo-border rounded px-2 py-2 text-valo-text text-xs text-right focus:outline-none focus:border-valo-accent/60" />
                </div>
                <div className="col-span-1">
                  <input type="number" value={line.unit_price} onChange={setLine(i, 'unit_price')} placeholder="0.00" step="0.01"
                    className="w-full bg-valo-black border border-valo-border rounded px-2 py-2 text-valo-text text-xs text-right focus:outline-none focus:border-valo-accent/60" />
                </div>
                <div className="col-span-1 flex items-center justify-end pt-2">
                  <span className={`text-xs font-medium ${line.is_discount ? 'text-valo-green' : 'text-valo-text'}`}>
                    {line.is_discount ? `(${fmt(Math.abs(line.total))})` : fmt(line.total)}
                  </span>
                </div>
                <div className="col-span-1 flex items-center justify-center pt-2">
                  <input type="checkbox" checked={line.is_discount} onChange={setLine(i, 'is_discount')}
                    title="Mark as discount"
                    className="rounded border-valo-border bg-valo-black text-valo-green focus:ring-0" />
                </div>
                <div className="col-span-1 flex items-center justify-center pt-1">
                  {form.line_items.length > 1 && (
                    <button type="button" onClick={() => removeLine(i)} className="p-1 text-valo-muted hover:text-valo-red transition-colors rounded">
                      <Trash2 size={13} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="flex gap-4 mt-4">
            <button type="button" onClick={() => addLine('A')} className="flex items-center gap-1.5 text-valo-subtle hover:text-valo-accent text-xs transition-colors">
              <Plus size={13} /> Add Section A line
            </button>
            <button type="button" onClick={() => addLine('B')} className="flex items-center gap-1.5 text-valo-subtle hover:text-valo-accent text-xs transition-colors">
              <Plus size={13} /> Add Section B line
            </button>
            <button type="button" onClick={() => addLine('')} className="flex items-center gap-1.5 text-valo-subtle hover:text-valo-text text-xs transition-colors">
              <Plus size={13} /> Add line
            </button>
          </div>

          {/* Totals */}
          <div className="mt-6 pt-4 border-t border-valo-border max-w-xs ml-auto space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-valo-subtle">Subtotal</span>
              <span className="text-valo-text">{fmt(subtotal)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-valo-subtle">VAT (0%, not registered)</span>
              <span className="text-valo-text">R 0.00</span>
            </div>
            <div className="flex justify-between font-semibold text-base border-t border-valo-border pt-2">
              <span className="text-valo-text">Total Due</span>
              <span className="text-valo-accent">{fmt(subtotal)}</span>
            </div>
          </div>
        </div>

        {/* Internal notes */}
        <div className="bg-valo-card border border-valo-border rounded-xl p-6">
          <div className="flex items-center gap-2 mb-3">
            <Info size={14} className="text-valo-amber" />
            <h2 className="text-valo-text font-semibold text-sm">Internal Notes <span className="text-valo-subtle font-normal">(not shown on invoice)</span></h2>
          </div>
          <Textarea value={form.internal_notes} onChange={setField('internal_notes')} rows={4}
            placeholder="Pre-send checklist, reminders, data sources to attach (AWS PDF, WinSMS report, etc.)" />
        </div>

        <div className="flex justify-end gap-3">
          <Link to="/invoices"><Button type="button" variant="secondary">Cancel</Button></Link>
          <Button type="submit" variant="secondary" loading={saving} onClick={() => setForm(p => ({ ...p, status: 'draft' }))}>Save as Draft</Button>
          <Button type="submit" loading={saving}>Save Invoice</Button>
        </div>
      </form>
    </div>
  )
}
