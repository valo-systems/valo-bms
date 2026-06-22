import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { clients as clientsApi, invoices as invoicesApi } from '../api/endpoints'
import Badge from '../components/ui/Badge'
import Button from '../components/ui/Button'
import { Input, Select, Textarea } from '../components/ui/Input'
import { ListTable, ListRow } from '../components/ui/Table'
import { ArrowLeft, Mail, Edit, Receipt, Building2, CreditCard, Info, Save, X } from 'lucide-react'
import { format } from 'date-fns'
import PaymentPlansSection from '../components/PaymentPlansSection'

const fmt = (n) => n != null
  ? new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR', minimumFractionDigits: 2 }).format(parseFloat(n))
  : '-'

function Field({ label, value }) {
  if (!value) return null
  return (
    <div>
      <div className="text-valo-subtle text-xs uppercase tracking-wider mb-1">{label}</div>
      <div className="text-valo-text text-sm">{value}</div>
    </div>
  )
}

export default function ClientDetail() {
  const { id } = useParams()
  const [client, setClient]               = useState(null)
  const [clientInvoices, setClientInvoices] = useState([])
  const [editing, setEditing]             = useState(false)
  const [form, setForm]                   = useState(null)
  const [saving, setSaving]               = useState(false)

  useEffect(() => {
    clientsApi.get(id)
      .then(res => { const c = res.client || res; setClient(c); setForm(c) })
      .catch(() => {})
    invoicesApi.list({ client_id: id })
      .then(res => setClientInvoices(res.invoices || res || []))
      .catch(() => {})
  }, [id])

  const set = (k) => (e) => setForm(p => ({ ...p, [k]: e.target.value }))

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await clientsApi.update(id, form)
      setClient(res.client || res)
      setEditing(false)
    } catch {
      setClient(form)
      setEditing(false)
    } finally {
      setSaving(false)
    }
  }

  if (!client) return <div className="flex items-center justify-center h-64 text-valo-subtle">Loading…</div>

  const d = editing ? form : client
  const totalInvoiced = clientInvoices.reduce((s, i) => s + parseFloat(i.total || 0), 0)

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Top bar */}
      <div className="flex items-center gap-4">
        <Link to="/clients" className="p-2 text-valo-subtle hover:text-valo-text rounded-lg hover:bg-valo-card transition-colors">
          <ArrowLeft size={18} />
        </Link>
        <div className="flex-1">
          <h1 className="text-valo-text text-2xl font-semibold">{client.name}</h1>
          {client.trading_name && client.trading_name !== client.name && (
            <p className="text-valo-subtle text-sm">Trading as {client.trading_name}</p>
          )}
        </div>
        <Badge status={client.status || 'active'} />
        {editing ? (
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" onClick={() => { setForm(client); setEditing(false) }}><X size={14} /> Cancel</Button>
            <Button size="sm" loading={saving} onClick={handleSave}><Save size={14} /> Save</Button>
          </div>
        ) : (
          <Button variant="secondary" size="sm" onClick={() => setEditing(true)}><Edit size={14} /> Edit</Button>
        )}
      </div>

      {editing ? (
        <div className="space-y-6">
          <div className="bg-valo-card border border-valo-border rounded-xl p-6">
            <h2 className="text-valo-text font-semibold text-sm mb-4">Company Details</h2>
            <div className="grid grid-cols-2 gap-4">
              <Input label="Company Name" value={d.name || ''} onChange={set('name')} required />
              <Input label="Client Code" value={d.code || ''} onChange={set('code')} required />
              <Input label="Trading Name" value={d.trading_name || ''} onChange={set('trading_name')} />
              <Input label="Company Registration" value={d.company_registration || ''} onChange={set('company_registration')} />
              <Input label="Contact Person" value={d.contact_person || ''} onChange={set('contact_person')} />
              <Input label="Accounts Email" type="email" value={d.accounts_email || ''} onChange={set('accounts_email')} />
              <Input label="Phone" value={d.phone || ''} onChange={set('phone')} />
              <Input label="General Email" type="email" value={d.email || ''} onChange={set('email')} />
              <div className="col-span-2"><Textarea label="Address" value={d.address || ''} onChange={set('address')} rows={2} /></div>
            </div>
          </div>

          <div className="bg-valo-card border border-valo-border rounded-xl p-6">
            <h2 className="text-valo-text font-semibold text-sm mb-4">Billing Terms</h2>
            <div className="grid grid-cols-2 gap-4">
              <Select label="Billing Model" value={d.billing_model || 'project'} onChange={set('billing_model')}>
                <option value="project">Project (once-off)</option>
                <option value="percentage">% of Revenue</option>
                <option value="retainer">Monthly Retainer</option>
                <option value="passthrough">Infrastructure Pass-Through</option>
                <option value="hourly">Hourly</option>
              </Select>
              <Input label="Payment Terms (days)" type="number" value={d.payment_terms || 30} onChange={set('payment_terms')} />
              <Input label="Service Fee %" type="number" step="0.01" value={d.service_fee_pct || ''} onChange={set('service_fee_pct')} placeholder="e.g. 5" />
              <Input label="Minimum Monthly (ZAR)" type="number" value={d.minimum_monthly || ''} onChange={set('minimum_monthly')} />
              <Input label="Minimum Period (months)" type="number" value={d.minimum_period_months || ''} onChange={set('minimum_period_months')} />
              <Input label="Late Interest Policy" value={d.late_interest_policy || ''} onChange={set('late_interest_policy')} />
              <div className="col-span-2"><Textarea label="Minimum Description" value={d.minimum_description || ''} onChange={set('minimum_description')} rows={2} /></div>
            </div>
          </div>

          <div className="bg-valo-card border border-valo-border rounded-xl p-6">
            <h2 className="text-valo-text font-semibold text-sm mb-4">Infrastructure</h2>
            <div className="grid grid-cols-2 gap-4">
              <Input label="FX Policy" value={d.fx_policy || ''} onChange={set('fx_policy')} />
              <Input label="SMS Rate (ZAR)" type="number" step="0.01" value={d.sms_rate || ''} onChange={set('sms_rate')} />
              <Input label="SMS Provider" value={d.sms_provider || ''} onChange={set('sms_provider')} />
              <Input label="Domain" value={d.domain || ''} onChange={set('domain')} />
              <Input label="Domain Monthly (ZAR)" type="number" step="0.01" value={d.domain_monthly || ''} onChange={set('domain_monthly')} />
              <div className="col-span-2"><Input label="Hosting Details" value={d.hosting || ''} onChange={set('hosting')} /></div>
            </div>
          </div>

          <div className="bg-valo-card border border-valo-border rounded-xl p-6">
            <h2 className="text-valo-text font-semibold text-sm mb-4">Agreement</h2>
            <div className="grid grid-cols-2 gap-4">
              <Input label="Agreement Reference" value={d.agreement_ref || ''} onChange={set('agreement_ref')} />
              <Input label="Platform Live Date" type="date" value={d.platform_live_date?.slice(0,10) || ''} onChange={set('platform_live_date')} />
              <Input label="First Billing Month" value={d.first_billing_month || ''} onChange={set('first_billing_month')} />
              <Select label="Status" value={d.status || 'active'} onChange={set('status')}>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </Select>
              <div className="col-span-2"><Textarea label="Agreement Notes" value={d.agreement_notes || ''} onChange={set('agreement_notes')} rows={3} /></div>
              <div className="col-span-2"><Textarea label="Internal Notes" value={d.notes || ''} onChange={set('notes')} rows={2} /></div>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid lg:grid-cols-3 gap-6">
            <div className="bg-valo-card border border-valo-border rounded-xl p-5">
              <div className="flex items-center gap-2 mb-4"><Mail size={14} className="text-valo-accent" /><h2 className="text-valo-text font-semibold text-sm">Contact</h2></div>
              <div className="space-y-3">
                <Field label="Contact Person" value={client.contact_person} />
                <Field label="Accounts Email" value={client.accounts_email} />
                <Field label="Phone" value={client.phone} />
                <Field label="General Email" value={client.email} />
                <Field label="Address" value={client.address} />
                <Field label="Company Reg" value={client.company_registration} />
              </div>
            </div>

            <div className="bg-valo-card border border-valo-border rounded-xl p-5">
              <div className="flex items-center gap-2 mb-4"><CreditCard size={14} className="text-valo-accent" /><h2 className="text-valo-text font-semibold text-sm">Billing Terms</h2></div>
              <div className="space-y-3">
                <Field label="Billing Model" value={client.billing_model?.replace('_',' ')} />
                <Field label="Payment Terms" value={client.payment_terms ? `${client.payment_terms} days` : null} />
                {client.service_fee_pct && <Field label="Service Fee" value={`${client.service_fee_pct}% of gross delivered order value`} />}
                {client.minimum_monthly && <Field label="Monthly Minimum" value={fmt(client.minimum_monthly)} />}
                {client.minimum_period_months && <Field label="Minimum Period" value={`${client.minimum_period_months} months`} />}
                {client.minimum_description && <Field label="Minimum Terms" value={client.minimum_description} />}
                <Field label="Late Interest" value={client.late_interest_policy} />
              </div>
            </div>

            <div className="bg-valo-card border border-valo-border rounded-xl p-5">
              <div className="flex items-center gap-2 mb-4"><Receipt size={14} className="text-valo-accent" /><h2 className="text-valo-text font-semibold text-sm">Revenue</h2></div>
              <div className="space-y-3">
                <div>
                  <div className="text-valo-subtle text-xs uppercase tracking-wider mb-1">Total Invoiced</div>
                  <div className="text-valo-accent text-xl font-semibold">{fmt(totalInvoiced)}</div>
                </div>
                <Field label="Invoices Issued" value={String(clientInvoices.length)} />
                {client.platform_live_date && <Field label="Platform Live" value={format(new Date(client.platform_live_date), 'd MMM yyyy')} />}
                {client.first_billing_month && <Field label="First Billing Month" value={client.first_billing_month} />}
              </div>
            </div>
          </div>

          {(client.fx_policy || client.sms_rate || client.domain) && (
            <div className="bg-valo-card border border-valo-border rounded-xl p-5">
              <div className="flex items-center gap-2 mb-4"><Building2 size={14} className="text-valo-accent" /><h2 className="text-valo-text font-semibold text-sm">Infrastructure</h2></div>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <Field label="FX Policy" value={client.fx_policy} />
                {client.sms_rate && <Field label="SMS Rate" value={`R${parseFloat(client.sms_rate).toFixed(2)}/SMS (${client.sms_provider || ''})`} />}
                <Field label="Domain" value={client.domain} />
                {client.domain_monthly && <Field label="Domain Monthly" value={fmt(client.domain_monthly)} />}
                {client.hosting && <Field label="Hosting" value={client.hosting} />}
              </div>
            </div>
          )}

          {(client.agreement_ref || client.agreement_notes) && (
            <div className="bg-valo-card border border-valo-border rounded-xl p-5">
              <div className="flex items-center gap-2 mb-4"><Info size={14} className="text-valo-accent" /><h2 className="text-valo-text font-semibold text-sm">Agreement</h2></div>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Reference" value={client.agreement_ref} />
                {client.agreement_notes && (
                  <div className="col-span-2">
                    <div className="text-valo-subtle text-xs uppercase tracking-wider mb-1">Notes</div>
                    <p className="text-valo-text text-sm">{client.agreement_notes}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {client.notes && (
            <div className="bg-valo-card border border-valo-border rounded-xl p-5">
              <h2 className="text-valo-text font-semibold text-sm mb-2">Internal Notes</h2>
              <p className="text-valo-subtle text-sm">{client.notes}</p>
            </div>
          )}

          <PaymentPlansSection
            clientId={id}
            invoiceList={clientInvoices}
            client={client}
          />

          <div className="bg-valo-card border border-valo-border rounded-xl">
            <div className="flex items-center justify-between px-5 py-4 border-b border-valo-border">
              <h2 className="text-valo-text font-semibold text-sm">Invoices</h2>
              <Link to={`/invoices/new?client=${id}`}><Button size="sm"><Receipt size={13} /> New Invoice</Button></Link>
            </div>
            {clientInvoices.length === 0 ? (
              <div className="px-5 py-10 text-center text-valo-subtle text-sm">No invoices yet</div>
            ) : (
              <ListTable>
                {clientInvoices.map(inv => (
                  <Link key={inv.id} to={`/invoices/${inv.id}`} className="block hover:bg-valo-dark transition-colors">
                    <ListRow
                      primary={<span className="font-mono text-valo-accent text-xs">{inv.number}</span>}
                      secondary={`${inv.period || '-'}${inv.date ? ' · ' + format(new Date(inv.date), 'd MMM yyyy') : ''}`}
                      meta={<span className="tabular-nums text-sm font-medium text-valo-text">{fmt(inv.total)}</span>}
                      badge={<Badge status={inv.status} />}
                    />
                  </Link>
                ))}
              </ListTable>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
