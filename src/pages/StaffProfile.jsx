import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { team as teamApi } from '../api/endpoints'
import Button from '../components/ui/Button'
import { Input, Select, Textarea } from '../components/ui/Input'
import {
  ArrowLeft, Edit, Save, X, Mail, Phone, MapPin,
  CreditCard, Shield, Briefcase, User, Calendar, Lock,
} from 'lucide-react'
import { format } from 'date-fns'

const ROLE_COLORS = {
  admin:   'bg-valo-accent/15 text-valo-accent border-valo-accent/20',
  finance: 'bg-valo-blue/15 text-valo-blue border-valo-blue/20',
  viewer:  'bg-valo-muted/40 text-valo-subtle border-valo-border',
}
const EMPLOYMENT_LABEL = { director: 'Director', staff: 'Full-time Staff', contractor: 'Contractor', part_time: 'Part-time' }

function initials(name) {
  return (name || '').split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
}

function Field({ label, value, mono }) {
  if (!value) return null
  return (
    <div>
      <div className="text-valo-subtle text-xs uppercase tracking-wider mb-1">{label}</div>
      <div className={`text-valo-text text-sm ${mono ? 'font-mono' : ''}`}>{value}</div>
    </div>
  )
}

function SectionCard({ icon: Icon, title, children, locked }) {
  return (
    <div className="bg-valo-card border border-valo-border rounded-xl p-5">
      <div className="flex items-center gap-2 mb-4">
        <Icon size={14} className={locked ? 'text-valo-muted' : 'text-valo-accent'} />
        <h3 className={`font-semibold text-sm ${locked ? 'text-valo-subtle' : 'text-valo-text'}`}>{title}</h3>
        {locked && (
          <span className="ml-auto flex items-center gap-1 text-valo-muted text-xs">
            <Lock size={10} /> Admin only
          </span>
        )}
      </div>
      {children}
    </div>
  )
}

export default function StaffProfile() {
  const { id } = useParams()
  const [user, setUser]       = useState(null)
  const [editing, setEditing] = useState(false)
  const [form, setForm]       = useState(null)
  const [saving, setSaving]   = useState(false)

  // Get current user from localStorage to know role
  const me = (() => { try { return JSON.parse(localStorage.getItem('valo_user') || '{}') } catch { return {} } })()
  const isAdmin = me.role === 'admin'
  const isSelf  = String(me.id) === String(id)

  useEffect(() => {
    teamApi.get(id)
      .then(res => { const u = res.user || res; setUser(u); setForm(u) })
      .catch(() => {})
  }, [id])

  const set = (k) => (e) => setForm(p => ({ ...p, [k]: e.target.value }))

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await teamApi.update(id, form)
      setUser(res.user || form)
      setEditing(false)
    } catch {
      setUser(form)
      setEditing(false)
    } finally { setSaving(false) }
  }

  if (!user) return <div className="flex items-center justify-center h-64 text-valo-subtle">Loading…</div>
  const d = editing ? form : user

  const canEdit = isAdmin || isSelf

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Top bar */}
      <div className="flex items-center gap-4">
        <Link to="/team" className="p-2 text-valo-subtle hover:text-valo-text rounded-lg hover:bg-valo-card transition-colors">
          <ArrowLeft size={18} />
        </Link>
        <div className="flex-1" />
        {canEdit && (
          editing ? (
            <div className="flex gap-2">
              <Button variant="secondary" size="sm" onClick={() => { setForm(user); setEditing(false) }}><X size={14} /> Cancel</Button>
              <Button size="sm" loading={saving} onClick={handleSave}><Save size={14} /> Save</Button>
            </div>
          ) : (
            <Button variant="secondary" size="sm" onClick={() => setEditing(true)}><Edit size={14} /> Edit Profile</Button>
          )
        )}
      </div>

      {/* Identity header */}
      <div className="bg-valo-card border border-valo-border rounded-xl p-6">
        <div className="flex items-start gap-5">
          <div className="w-16 h-16 rounded-xl bg-valo-accent/10 border border-valo-accent/20 flex items-center justify-center shrink-0">
            <span className="text-valo-accent font-bold text-xl">{initials(d.name)}</span>
          </div>
          <div className="flex-1 min-w-0">
            {editing ? (
              <div className="grid grid-cols-2 gap-3">
                <Input label="Full Name" value={d.name || ''} onChange={set('name')} />
                <Input label="Job Title" value={d.title || ''} onChange={set('title')} placeholder="e.g. Head of Finance" />
                <Input label="Department" value={d.department || ''} onChange={set('department')} />
                <Input label="Phone" value={d.phone || ''} onChange={set('phone')} />
              </div>
            ) : (
              <>
                <div className="text-valo-text text-xl font-semibold">{d.name}</div>
                <div className="text-valo-accent text-sm mt-0.5">{d.title || '-'}</div>
                <div className="text-valo-subtle text-xs mt-0.5">{d.department || ''}</div>
                <div className="flex flex-wrap gap-4 mt-3">
                  <a href={`mailto:${d.email}`} className="flex items-center gap-1.5 text-valo-subtle text-xs hover:text-valo-accent transition-colors">
                    <Mail size={11} />{d.email}
                  </a>
                  {d.phone && (
                    <a href={`tel:${d.phone}`} className="flex items-center gap-1.5 text-valo-subtle text-xs hover:text-valo-accent transition-colors">
                      <Phone size={11} />{d.phone}
                    </a>
                  )}
                </div>
              </>
            )}
          </div>
          <div className="flex flex-col items-end gap-2 shrink-0">
            <span className={`text-xs px-2.5 py-1 rounded-md border font-medium ${ROLE_COLORS[d.role] || ROLE_COLORS.viewer}`}>
              {d.role}
            </span>
            {d.employment_type && (
              <span className="text-valo-muted text-xs">{EMPLOYMENT_LABEL[d.employment_type] || d.employment_type}</span>
            )}
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-5">
        {/* Personal / Identity */}
        <SectionCard icon={User} title="Personal Details">
          {editing ? (
            <div className="grid grid-cols-2 gap-3">
              <Select label="Employment Type" value={d.employment_type || 'staff'} onChange={set('employment_type')}>
                <option value="director">Director</option>
                <option value="staff">Full-time Staff</option>
                <option value="contractor">Contractor</option>
                <option value="part_time">Part-time</option>
              </Select>
              <Input label="Nationality" value={d.nationality || ''} onChange={set('nationality')} />
              <Input label="Start Date" type="date" value={d.start_date?.slice(0,10) || ''} onChange={set('start_date')} />
              <div className="col-span-2"><Textarea label="Address" value={d.address || ''} onChange={set('address')} rows={2} /></div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              <Field label="Employment Type" value={EMPLOYMENT_LABEL[d.employment_type] || d.employment_type} />
              <Field label="Nationality" value={d.nationality} />
              <Field label="Start Date" value={d.start_date ? format(new Date(d.start_date), 'd MMMM yyyy') : null} />
              <Field label="Date of Birth" value={d.date_of_birth ? format(new Date(d.date_of_birth), 'd MMMM yyyy') : null} />
              <Field label="Member Since" value={d.created_at ? format(new Date(d.created_at), 'd MMM yyyy') : null} />
              {d.address && (
                <div className="col-span-2">
                  <Field label="Address" value={d.address} />
                </div>
              )}
            </div>
          )}
        </SectionCard>

        {/* ID & Compliance */}
        <SectionCard icon={Shield} title="Identity & Compliance" locked={!isAdmin && !isSelf}>
          <div className="grid grid-cols-2 gap-4">
            <Field label="ID Number" value={d.id_number} mono />
            <Field label="Date of Birth" value={d.date_of_birth ? format(new Date(d.date_of_birth), 'd MMMM yyyy') : null} />
            <Field label="Nationality" value={d.nationality || 'South African'} />
            <Field label="Tax Number" value={d.tax_number} mono />
          </div>
          {!d.id_number && (
            <div className="text-valo-muted text-xs mt-2 italic">ID and tax details stored securely, visible to admin and staff member only.</div>
          )}
        </SectionCard>
      </div>

      {/* Banking — payroll placeholder */}
      <SectionCard icon={CreditCard} title="Banking Details: Payroll" locked={!isAdmin && !isSelf}>
        {editing && (isAdmin || isSelf) ? (
          <div className="grid grid-cols-2 gap-3">
            <Input label="Bank Name" value={d.bank_name || ''} onChange={set('bank_name')} placeholder="e.g. FNB, Capitec, Standard Bank" />
            <Select label="Account Type" value={d.bank_type || ''} onChange={set('bank_type')}>
              <option value="">Select</option>
              <option value="cheque">Cheque / Current</option>
              <option value="savings">Savings</option>
              <option value="transmission">Transmission</option>
            </Select>
            <Input label="Account Number" value={d.bank_account || ''} onChange={set('bank_account')} mono placeholder="e.g. 62xxxxxxxxx" />
            <Input label="Branch Code" value={d.bank_branch || ''} onChange={set('bank_branch')} mono placeholder="e.g. 250655" />
          </div>
        ) : (d.bank_account ? (
          <div className="grid grid-cols-2 gap-4">
            <Field label="Bank" value={d.bank_name} />
            <Field label="Account Type" value={d.bank_type} />
            <Field label="Account Number" value={d.bank_account} mono />
            <Field label="Branch Code" value={d.bank_branch} mono />
          </div>
        ) : (
          <div className="flex items-center gap-3 py-4">
            <div className="w-8 h-8 rounded-lg bg-valo-border/30 flex items-center justify-center shrink-0">
              <CreditCard size={14} className="text-valo-muted" />
            </div>
            <div>
              <div className="text-valo-subtle text-sm">Banking details not yet added</div>
              <div className="text-valo-muted text-xs mt-0.5">Add account details when setting up payroll</div>
            </div>
            {(isAdmin || isSelf) && !editing && (
              <Button size="sm" variant="secondary" className="ml-auto" onClick={() => setEditing(true)}>
                Add Details
              </Button>
            )}
          </div>
        ))}
      </SectionCard>

      {/* Internal notes — admin only */}
      {(isAdmin || isSelf) && (
        <SectionCard icon={Briefcase} title="Notes" locked={!isAdmin}>
          {editing && isAdmin ? (
            <Textarea label="" value={d.notes || ''} onChange={set('notes')} rows={3} placeholder="Internal notes about this team member…" />
          ) : (
            d.notes
              ? <p className="text-valo-subtle text-sm">{d.notes}</p>
              : <p className="text-valo-muted text-xs italic">No notes</p>
          )}
        </SectionCard>
      )}
    </div>
  )
}
