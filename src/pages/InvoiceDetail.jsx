import { useEffect, useState, useRef } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { invoices as invoicesApi, clients as clientsApi } from '../api/endpoints'
import Badge from '../components/ui/Badge'
import Button from '../components/ui/Button'
import { Input, Select, Textarea } from '../components/ui/Input'
import { ArrowLeft, Printer, Plus, Trash2, ChevronDown, CheckCircle, Edit, X, Save, Info } from 'lucide-react'
import { format } from 'date-fns'

const ALL_STATUSES = ['draft','estimated','confirmed','sent','partial','paid','overdue']
const STATUS_LABEL = { draft:'Draft', estimated:'Estimated', confirmed:'Confirmed', sent:'Sent', partial:'Part Paid', paid:'Paid', overdue:'Overdue' }

const INVOICE_TYPES = [
  { value: 'monthly_service',  label: 'Monthly Service (Section A + B)' },
  { value: 'implementation',   label: 'Implementation / Go-Live Fee' },
  { value: 'project',          label: 'Project (Once-off)' },
  { value: 'infrastructure',   label: 'Infrastructure Pass-Through Only' },
  { value: 'custom',           label: 'Custom' },
]

const SECTION_NAMES = {
  'A': 'Section A: Valo Technology Service Fee',
  'B': 'Section B: Infrastructure Pass-Through (At Cost + FX Cover)',
}

const fmt = (n) => new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR', minimumFractionDigits: 2 }).format(parseFloat(n) || 0)

const newLine = (section = '') => ({
  section_label: section,
  description: '',
  calculation_detail: '',
  item_note: '',
  quantity: 1,
  unit_price: '',
  usd_amount: '',
  total: 0,
  is_discount: false,
})

function groupBySection(items) {
  const sections = {}
  const order = []
  for (const item of items) {
    const key = item.section_label || ''
    if (!sections[key]) { sections[key] = []; order.push(key) }
    sections[key].push(item)
  }
  return order.map(k => ({ label: k, items: sections[k] }))
}

function StatusDropdown({ status, onChange }) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const ref = useRef()
  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])
  const pick = async (s) => {
    setOpen(false)
    if (s === status) return
    setLoading(true)
    await onChange(s).finally(() => setLoading(false))
  }
  return (
    <div ref={ref} className="relative">
      <button onClick={() => setOpen(v => !v)} disabled={loading} className="flex items-center gap-1">
        <Badge status={status} label={STATUS_LABEL[status] || status} />
        <ChevronDown size={11} className="text-valo-muted" />
      </button>
      {open && (
        <div className="absolute top-full right-0 mt-1 z-50 bg-valo-card border border-valo-border rounded-xl shadow-xl overflow-hidden min-w-[140px]">
          {ALL_STATUSES.map(s => (
            <button key={s} onClick={() => pick(s)}
              className="w-full flex items-center justify-between px-3 py-2.5 text-xs hover:bg-valo-dark transition-colors gap-3">
              <Badge status={s} label={STATUS_LABEL[s]} />
              {s === status && <CheckCircle size={11} className="text-valo-accent" />}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Edit form ─────────────────────────────────────────────────────────────────
function EditForm({ invoice, clientList, onSave, onCancel, saving }) {
  const [form, setForm] = useState({
    ...invoice,
    // normalise booleans that PG returns as strings
    line_items: (invoice.line_items || []).map(l => ({
      ...l,
      is_discount: l.is_discount === true || l.is_discount === 'true' || l.is_discount === 't',
      is_section_header: l.is_section_header === true || l.is_section_header === 'true' || l.is_section_header === 't',
      total: parseFloat(l.total || 0),
      quantity: parseFloat(l.quantity || 1),
      unit_price: parseFloat(l.unit_price || 0),
      usd_amount: l.usd_amount ?? '',
    })),
  })

  const setField = (k) => (e) => setForm(p => ({ ...p, [k]: e.target.value }))

  const setLine = (i, k) => (e) => {
    const val = e.target.type === 'checkbox' ? e.target.checked : e.target.value
    setForm(p => {
      const lines = [...p.line_items]
      lines[i] = { ...lines[i], [k]: val }
      if (k === 'quantity' || k === 'unit_price') {
        const qty   = parseFloat(lines[i].quantity   || 0)
        const price = parseFloat(lines[i].unit_price || 0)
        lines[i].total = lines[i].is_discount ? -(qty * price) : qty * price
      }
      if (k === 'is_discount') {
        lines[i].total = val ? -Math.abs(lines[i].total) : Math.abs(lines[i].total)
      }
      return { ...p, line_items: lines }
    })
  }

  const addLine = (s = '') => setForm(p => ({ ...p, line_items: [...p.line_items, newLine(s)] }))
  const removeLine = (i) => setForm(p => ({ ...p, line_items: p.line_items.filter((_, idx) => idx !== i) }))

  const subtotal = form.line_items.reduce((s, l) => s + parseFloat(l.total || 0), 0)

  const handleSubmit = (e) => {
    e.preventDefault()
    onSave({ ...form, subtotal, total: subtotal })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">

      {/* Invoice Details */}
      <div className="bg-valo-card border border-valo-border rounded-xl p-5 lg:p-6">
        <h2 className="text-valo-text font-semibold text-sm mb-4">Invoice Details</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className="block text-valo-subtle text-xs font-medium uppercase tracking-wide mb-1.5">Client</label>
            <select value={form.client_id} onChange={setField('client_id')} required
              className="w-full bg-valo-black border border-valo-border rounded-lg px-3 py-2.5 text-valo-text text-sm focus:outline-none focus:border-valo-accent/60 transition-colors">
              {clientList.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <Input label="Invoice Number"  value={form.number || ''}      onChange={setField('number')}      required />
          <Select label="Invoice Type"   value={form.invoice_type || 'monthly_service'} onChange={setField('invoice_type')}>
            {INVOICE_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
          </Select>
          <Input label="Invoice Date"    type="date" value={form.date || ''}          onChange={setField('date')}      required />
          <Input label="Due Date"        type="date" value={form.due_date || ''}      onChange={setField('due_date')} />
          <Select label="Status"         value={form.status || 'draft'}   onChange={setField('status')}>
            {ALL_STATUSES.map(s => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
          </Select>
          <Input label="Billing Period"  value={form.period || ''}        onChange={setField('period')}    placeholder="April 2026" />
          <Input label="Period From"     type="date" value={form.period_from || ''}  onChange={setField('period_from')} />
          <Input label="Period To"       type="date" value={form.period_to   || ''}  onChange={setField('period_to')} />
        </div>
      </div>

      {/* FX Rate */}
      <div className="bg-valo-card border border-valo-border rounded-xl p-5 lg:p-6">
        <h2 className="text-valo-text font-semibold text-sm mb-4">Exchange Rate</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input label="FX Rate (R per USD)" type="number" step="0.0001" value={form.fx_rate || ''} onChange={setField('fx_rate')} placeholder="e.g. 20.00" />
          <Input label="FX Policy Note" value={form.fx_policy || ''} onChange={setField('fx_policy')} />
        </div>
      </div>

      {/* Notes */}
      <div className="bg-valo-card border border-valo-border rounded-xl p-5 lg:p-6">
        <h2 className="text-valo-text font-semibold text-sm mb-4">Period &amp; Commercial Notes</h2>
        <div className="space-y-4">
          <Textarea label="Period Note" value={form.period_note || ''} onChange={setField('period_note')} rows={2} />
          <Textarea label="Commercial Conditions" value={form.commercial_conditions || ''} onChange={setField('commercial_conditions')} rows={3} />
          <Textarea label="Footer Note" value={form.footer_note || ''} onChange={setField('footer_note')} rows={2} />
        </div>
      </div>

      {/* Line Items */}
      <div className="bg-valo-card border border-valo-border rounded-xl p-5 lg:p-6">
        <h2 className="text-valo-text font-semibold text-sm mb-4">Line Items</h2>

        {/* Mobile: stacked cards */}
        <div className="space-y-3 lg:hidden">
          {form.line_items.map((line, i) => (
            <div key={i} className="bg-valo-dark border border-valo-border rounded-lg p-4 space-y-3">
              <div className="flex items-center gap-2">
                <input value={line.section_label} onChange={setLine(i, 'section_label')} placeholder="A / B"
                  className="w-14 bg-valo-black border border-valo-border rounded px-2 py-2 text-valo-text text-xs font-mono text-center focus:outline-none focus:border-valo-accent/60" />
                <input value={line.description} onChange={setLine(i, 'description')} placeholder="Description" required
                  className="flex-1 bg-valo-black border border-valo-border rounded px-2 py-2 text-valo-text text-sm focus:outline-none focus:border-valo-accent/60" />
                {form.line_items.length > 1 && (
                  <button type="button" onClick={() => removeLine(i)} className="p-1.5 text-valo-muted hover:text-valo-red transition-colors rounded">
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
              <input value={line.calculation_detail} onChange={setLine(i, 'calculation_detail')} placeholder="Calculation detail"
                className="w-full bg-valo-black border border-valo-border rounded px-2 py-1.5 text-valo-subtle text-xs focus:outline-none focus:border-valo-accent/60" />
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <div className="text-valo-muted text-xs mb-1">USD amt</div>
                  <input type="number" value={line.usd_amount} onChange={setLine(i, 'usd_amount')} placeholder="0.00" step="0.01"
                    className="w-full bg-valo-black border border-valo-border rounded px-2 py-1.5 text-valo-text text-xs text-right focus:outline-none focus:border-valo-accent/60" />
                </div>
                <div>
                  <div className="text-valo-muted text-xs mb-1">Qty</div>
                  <input type="number" value={line.quantity} onChange={setLine(i, 'quantity')} min="0" step="any"
                    className="w-full bg-valo-black border border-valo-border rounded px-2 py-1.5 text-valo-text text-xs text-right focus:outline-none focus:border-valo-accent/60" />
                </div>
                <div>
                  <div className="text-valo-muted text-xs mb-1">Unit (ZAR)</div>
                  <input type="number" value={line.unit_price} onChange={setLine(i, 'unit_price')} placeholder="0.00" step="0.01"
                    className="w-full bg-valo-black border border-valo-border rounded px-2 py-1.5 text-valo-text text-xs text-right focus:outline-none focus:border-valo-accent/60" />
                </div>
              </div>
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 text-xs text-valo-subtle cursor-pointer">
                  <input type="checkbox" checked={line.is_discount} onChange={setLine(i, 'is_discount')}
                    className="rounded border-valo-border bg-valo-black text-valo-green focus:ring-0" />
                  Discount line
                </label>
                <span className={`text-sm font-medium tabular-nums ${line.is_discount ? 'text-valo-green' : 'text-valo-text'}`}>
                  {line.is_discount ? `(${fmt(Math.abs(line.total))})` : fmt(line.total)}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Desktop: grid */}
        <div className="hidden lg:block space-y-2">
          <div className="grid grid-cols-12 gap-2 text-valo-subtle text-xs uppercase tracking-wider px-1 mb-2">
            <div className="col-span-1">Sec</div>
            <div className="col-span-3">Description</div>
            <div className="col-span-2">Detail / Calc</div>
            <div className="col-span-1 text-right">USD</div>
            <div className="col-span-1 text-right">Qty</div>
            <div className="col-span-1 text-right">Unit (ZAR)</div>
            <div className="col-span-1 text-right">Total</div>
            <div className="col-span-1 text-center">Disc</div>
            <div className="col-span-1" />
          </div>
          {form.line_items.map((line, i) => (
            <div key={i} className="grid grid-cols-12 gap-2 items-start">
              <div className="col-span-1">
                <input value={line.section_label} onChange={setLine(i, 'section_label')} placeholder="A"
                  className="w-full bg-valo-black border border-valo-border rounded px-2 py-2 text-valo-text text-xs font-mono text-center focus:outline-none focus:border-valo-accent/60" />
              </div>
              <div className="col-span-3">
                <input value={line.description} onChange={setLine(i, 'description')} placeholder="Description" required
                  className="w-full bg-valo-black border border-valo-border rounded px-2 py-2 text-valo-text text-sm focus:outline-none focus:border-valo-accent/60" />
                <input value={line.item_note} onChange={setLine(i, 'item_note')} placeholder="Note (optional)"
                  className="w-full bg-valo-black border border-valo-border/50 rounded px-2 py-1 text-valo-subtle text-xs mt-1 focus:outline-none focus:border-valo-accent/40" />
              </div>
              <div className="col-span-2">
                <input value={line.calculation_detail} onChange={setLine(i, 'calculation_detail')} placeholder="Calculation"
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
                <span className={`text-xs font-medium tabular-nums ${line.is_discount ? 'text-valo-green' : 'text-valo-text'}`}>
                  {line.is_discount ? `(${fmt(Math.abs(line.total))})` : fmt(line.total)}
                </span>
              </div>
              <div className="col-span-1 flex items-center justify-center pt-2">
                <input type="checkbox" checked={line.is_discount} onChange={setLine(i, 'is_discount')}
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

        <div className="flex flex-wrap gap-4 mt-4">
          <button type="button" onClick={() => addLine('A')} className="flex items-center gap-1.5 text-valo-subtle hover:text-valo-accent text-xs transition-colors">
            <Plus size={13} /> Section A line
          </button>
          <button type="button" onClick={() => addLine('B')} className="flex items-center gap-1.5 text-valo-subtle hover:text-valo-accent text-xs transition-colors">
            <Plus size={13} /> Section B line
          </button>
          <button type="button" onClick={() => addLine('')} className="flex items-center gap-1.5 text-valo-subtle hover:text-valo-text text-xs transition-colors">
            <Plus size={13} /> Add line
          </button>
        </div>

        <div className="mt-6 pt-4 border-t border-valo-border max-w-xs ml-auto space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-valo-subtle">Subtotal</span>
            <span className="text-valo-text tabular-nums">{fmt(subtotal)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-valo-subtle">VAT (0%, not registered)</span>
            <span className="text-valo-text">R 0.00</span>
          </div>
          <div className="flex justify-between font-semibold text-base border-t border-valo-border pt-2">
            <span className="text-valo-text">Total Due</span>
            <span className="text-valo-accent tabular-nums">{fmt(subtotal)}</span>
          </div>
        </div>
      </div>

      {/* Internal notes */}
      <div className="bg-valo-card border border-valo-border rounded-xl p-5 lg:p-6">
        <div className="flex items-center gap-2 mb-3">
          <Info size={14} className="text-valo-amber" />
          <h2 className="text-valo-text font-semibold text-sm">Internal Notes <span className="text-valo-subtle font-normal">(not printed)</span></h2>
        </div>
        <Textarea value={form.internal_notes || ''} onChange={setField('internal_notes')} rows={3} placeholder="Pre-send checklist, data sources…" />
      </div>

      <div className="flex justify-end gap-3 pb-6">
        <Button type="button" variant="secondary" onClick={onCancel}><X size={14} /> Cancel</Button>
        <Button type="submit" loading={saving}><Save size={14} /> Save Changes</Button>
      </div>
    </form>
  )
}

// ── Invoice print document ────────────────────────────────────────────────────
function InvoiceDocument({ invoice }) {
  const sections = groupBySection(invoice.line_items || [])
  const sectionTotals = {}
  for (const sec of sections) {
    sectionTotals[sec.label] = sec.items.reduce((s, i) => s + parseFloat(i.total || 0), 0)
  }
  const subtotal = parseFloat(invoice.subtotal) || sections.reduce((s, sec) => s + (sectionTotals[sec.label] || 0), 0)
  const total    = parseFloat(invoice.total)    || subtotal

  return (
    <div id="invoice-print" className="bg-white text-gray-900 rounded-xl overflow-hidden shadow-2xl">

      {/* Header */}
      <div className="flex items-start justify-between px-6 sm:px-10 py-8 border-b border-gray-200">
        <div>
          <div className="text-2xl font-bold tracking-tight text-gray-900">VALO</div>
          <div className="text-xs text-gray-500 mt-0.5">Trading as Valo Systems</div>
        </div>
        <div className="text-right">
          <div className="text-xl font-bold text-gray-900 mb-2">Tax Invoice</div>
          <table className="text-xs text-right ml-auto">
            <tbody>
              <tr><td className="text-gray-500 pr-3 pb-1">Invoice No</td><td className="font-semibold text-gray-900">{invoice.number}</td></tr>
              <tr><td className="text-gray-500 pr-3 pb-1">Date</td><td>{invoice.date ? format(new Date(invoice.date), 'd MMMM yyyy') : '-'}</td></tr>
              {invoice.due_date && <tr><td className="text-gray-500 pr-3 pb-1">Due Date</td><td>{format(new Date(invoice.due_date), 'd MMMM yyyy')}</td></tr>}
              {invoice.period_from && invoice.period_to && (
                <tr><td className="text-gray-500 pr-3 pb-1">Period</td><td>{format(new Date(invoice.period_from), 'd MMM')} - {format(new Date(invoice.period_to), 'd MMM yyyy')}</td></tr>
              )}
              {invoice.period && !invoice.period_from && (
                <tr><td className="text-gray-500 pr-3 pb-1">Period</td><td>{invoice.period}</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Period note */}
      {invoice.period_note && (
        <div className="px-6 sm:px-10 py-3 bg-gray-50 border-b border-gray-200 text-xs text-gray-600 italic">
          {invoice.period_note}
        </div>
      )}

      {/* Parties */}
      <div className="grid grid-cols-2 gap-8 px-6 sm:px-10 py-6 border-b border-gray-200">
        <div>
          <div className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">From</div>
          <div className="font-bold text-gray-900">VALO (PTY) LTD</div>
          <div className="text-xs text-gray-600 mt-1 space-y-0.5">
            <div>Trading as Valo Systems</div>
            <div>50 C Carlswald Luxury Apartments</div>
            <div>82 Tamboti Rd, Carlswald, Midrand</div>
            <div>Gauteng, 1685, South Africa</div>
            <div>Email: billing@valosystems.co.za</div>
            <div className="mt-1 text-gray-400">Reg No: 2026/072094/07</div>
          </div>
        </div>
        <div>
          <div className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">To</div>
          <div className="font-bold text-gray-900">{invoice.client_name}</div>
          {invoice.client_address && (
            <div className="text-xs text-gray-600 mt-1 whitespace-pre-line">{invoice.client_address}</div>
          )}
          {invoice.client_email && <div className="text-xs text-gray-600 mt-1">Email: {invoice.client_email}</div>}
          {invoice.client_phone && <div className="text-xs text-gray-600">Tel: {invoice.client_phone}</div>}
        </div>
      </div>

      {/* FX note */}
      {invoice.fx_rate && (
        <div className="px-6 sm:px-10 py-3 border-b border-gray-200 bg-blue-50 text-xs text-blue-800">
          <strong>Exchange rate applied:</strong> {invoice.fx_policy || 'SARB interbank mid-rate + 8% FX cover'}, rate: <strong>R{parseFloat(invoice.fx_rate).toFixed(4)}/USD</strong>
        </div>
      )}

      {/* Line item sections */}
      {sections.map((sec) => (
        <div key={sec.label} className="px-6 sm:px-10 py-5 border-b border-gray-200">
          {sec.label && (
            <div className="mb-3">
              <div className="text-xs font-bold uppercase tracking-wider text-gray-900 border-b border-gray-300 pb-1">
                {SECTION_NAMES[sec.label] || `Section ${sec.label}`}
              </div>
            </div>
          )}
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left text-gray-500 font-medium pb-2 pr-4 w-6">#</th>
                <th className="text-left text-gray-500 font-medium pb-2">Description</th>
                {invoice.fx_rate && <th className="text-right text-gray-500 font-medium pb-2 pl-4 w-16">USD</th>}
                <th className="text-right text-gray-500 font-medium pb-2 pl-4 w-28">Amount (ZAR)</th>
              </tr>
            </thead>
            <tbody>
              {sec.items.map((item, i) => {
                const globalIdx = (invoice.line_items || []).indexOf(item)
                const isDisc = item.is_discount === true || item.is_discount === 'true' || item.is_discount === 't'
                return (
                  <tr key={i} className="border-b border-gray-100 align-top">
                    <td className="py-2 pr-4 text-gray-400">{globalIdx + 1}</td>
                    <td className="py-2">
                      <div className={`font-medium ${isDisc ? 'text-green-700' : 'text-gray-900'}`}>{item.description}</div>
                      {item.calculation_detail && <div className="text-gray-500 mt-0.5">{item.calculation_detail}</div>}
                      {item.item_note && <div className="text-gray-400 mt-1 italic">{item.item_note}</div>}
                    </td>
                    {invoice.fx_rate && (
                      <td className="py-2 pl-4 text-right text-gray-500">
                        {item.usd_amount ? `$${parseFloat(item.usd_amount).toFixed(2)}` : '-'}
                      </td>
                    )}
                    <td className={`py-2 pl-4 text-right font-medium tabular-nums ${isDisc ? 'text-green-700' : 'text-gray-900'}`}>
                      {isDisc ? `(${fmt(Math.abs(item.total))})` : fmt(item.total)}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          {sec.label && (
            <div className="flex justify-end mt-3">
              <div className="bg-gray-100 rounded px-4 py-2 text-xs">
                <span className="text-gray-500 mr-6">Section {sec.label} Total</span>
                <span className="font-bold text-gray-900 tabular-nums">{fmt(sectionTotals[sec.label])}</span>
              </div>
            </div>
          )}
        </div>
      ))}

      {/* Invoice Summary */}
      <div className="px-6 sm:px-10 py-6 border-b border-gray-200">
        <div className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">Invoice Summary</div>
        <div className="max-w-xs ml-auto">
          <table className="w-full text-sm">
            <tbody>
              {sections.filter(s => s.label).map(sec => (
                <tr key={sec.label} className="border-b border-gray-100">
                  <td className="py-1.5 text-gray-600 pr-6">{SECTION_NAMES[sec.label] || `Section ${sec.label}`}</td>
                  <td className="py-1.5 text-right tabular-nums text-gray-900">{fmt(sectionTotals[sec.label])}</td>
                </tr>
              ))}
              {sections.filter(s => !s.label).flatMap(s => s.items).map((item, i) => {
                const isDisc = item.is_discount === true || item.is_discount === 'true' || item.is_discount === 't'
                return (
                  <tr key={`unsec-${i}`} className="border-b border-gray-100">
                    <td className="py-1.5 text-gray-600 pr-6">{item.description}</td>
                    <td className={`py-1.5 text-right tabular-nums ${isDisc ? 'text-green-700' : 'text-gray-900'}`}>
                      {isDisc ? `(${fmt(Math.abs(item.total))})` : fmt(item.total)}
                    </td>
                  </tr>
                )
              })}
              <tr className="border-b border-gray-200">
                <td className="py-1.5 text-gray-600">Subtotal</td>
                <td className="py-1.5 text-right tabular-nums font-semibold text-gray-900">{fmt(subtotal)}</td>
              </tr>
              <tr className="border-b border-gray-200">
                <td className="py-1.5 text-gray-400 text-xs">VAT not applicable. VALO (PTY) LTD is not currently VAT registered</td>
                <td className="py-1.5 text-right text-gray-400 text-xs">R 0.00</td>
              </tr>
              <tr>
                <td className="pt-3 pb-1 font-bold text-gray-900">Total Due: {invoice.number}</td>
                <td className="pt-3 pb-1 text-right tabular-nums font-bold text-xl text-gray-900">{fmt(total)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Commercial conditions */}
      {invoice.commercial_conditions && (
        <div className="px-6 sm:px-10 py-5 border-b border-gray-200">
          <div className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">Commercial Conditions</div>
          <div className="text-xs text-gray-700 bg-gray-50 rounded p-3 whitespace-pre-wrap">{invoice.commercial_conditions}</div>
        </div>
      )}

      {/* Banking */}
      <div className="px-6 sm:px-10 py-6 border-b border-gray-200">
        <div className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">Payment Details</div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
          {[
            ['Bank',            'FNB / RMB'],
            ['Account Holder',  'Valo'],
            ['Account Type',    'Gold Business Account'],
            ['Account Number',  '63194158987'],
            ['Branch Code',     '255355'],
            ['Reference',       invoice.number],
          ].map(([label, val]) => (
            <div key={label}>
              <div className="text-gray-400 mb-0.5">{label}</div>
              <div className={`font-semibold text-gray-900 ${label === 'Reference' ? 'text-blue-700' : ''}`}>{val}</div>
            </div>
          ))}
        </div>
        {invoice.due_date && (
          <div className="mt-3 text-xs text-gray-600 bg-yellow-50 border border-yellow-200 rounded p-2">
            Payment due: <strong>{format(new Date(invoice.due_date), 'd MMMM yyyy')}</strong>. Late payments accrue interest at the South African prime lending rate + 2% per annum, calculated daily from the due date.
          </div>
        )}
      </div>

      {/* Notes */}
      {invoice.notes && (
        <div className="px-6 sm:px-10 py-5 border-b border-gray-200">
          <div className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">Notes</div>
          <p className="text-xs text-gray-600">{invoice.notes}</p>
        </div>
      )}

      {/* Footer */}
      <div className="px-6 sm:px-10 py-5 bg-gray-50 text-xs text-gray-400 text-center">
        VALO (PTY) LTD, Reg No: 2026/072094/07, billing@valosystems.co.za
        {invoice.footer_note && <><br /><span className="text-gray-500">{invoice.footer_note}</span></>}
      </div>

      {/* Internal notes — screen only */}
      {invoice.internal_notes && (
        <div className="no-print px-6 sm:px-10 py-5 border-t-2 border-dashed border-amber-400 bg-amber-50">
          <div className="text-xs font-bold uppercase tracking-widest text-amber-600 mb-2">Internal Notes (Not Printed)</div>
          <div className="text-xs text-amber-800 whitespace-pre-wrap">{invoice.internal_notes}</div>
        </div>
      )}
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function InvoiceDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [invoice, setInvoice]     = useState(null)
  const [editing, setEditing]     = useState(false)
  const [saving, setSaving]       = useState(false)
  const [clientList, setClientList] = useState([])

  useEffect(() => {
    invoicesApi.get(id).then(res => setInvoice(res.invoice || res)).catch(() => {})
    clientsApi.list().then(res => setClientList(res.clients || res)).catch(() => {})
  }, [id])

  const handleStatusChange = async (status) => {
    await invoicesApi.updateStatus(id, status)
    setInvoice(prev => ({ ...prev, status }))
  }

  const handleSave = async (data) => {
    setSaving(true)
    try {
      const res = await invoicesApi.update(id, data)
      setInvoice(res.invoice || res)
      setEditing(false)
    } catch (err) {
      alert('Could not save: ' + (err?.message || 'check your connection'))
    } finally {
      setSaving(false)
    }
  }

  if (!invoice) return (
    <div className="flex items-center justify-center h-64 text-valo-subtle">Loading…</div>
  )

  return (
    <div className="max-w-4xl space-y-4">
      {/* Toolbar */}
      <div className="flex items-center gap-3 no-print flex-wrap">
        <Link to="/invoices" className="p-2 text-valo-subtle hover:text-valo-text rounded-lg hover:bg-valo-card transition-colors">
          <ArrowLeft size={18} />
        </Link>
        <div className="flex-1 min-w-0">
          <h1 className="text-valo-text text-lg sm:text-xl font-semibold font-mono truncate">{invoice.number}</h1>
          <p className="text-valo-subtle text-sm truncate">{invoice.client_name}{invoice.period ? ` · ${invoice.period}` : ''}</p>
        </div>
        <StatusDropdown status={invoice.status} onChange={handleStatusChange} />
        {!editing && (
          <>
            <Button variant="secondary" size="sm" onClick={() => setEditing(true)}>
              <Edit size={14} /> Edit
            </Button>
            <Button variant="secondary" size="sm" onClick={() => window.print()} className="hidden sm:flex">
              <Printer size={14} /> Print
            </Button>
          </>
        )}
      </div>

      {editing ? (
        <EditForm
          invoice={invoice}
          clientList={clientList}
          onSave={handleSave}
          onCancel={() => setEditing(false)}
          saving={saving}
        />
      ) : (
        <InvoiceDocument invoice={invoice} />
      )}

      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white; }
          #invoice-print { box-shadow: none; border-radius: 0; }
        }
      `}</style>
    </div>
  )
}
