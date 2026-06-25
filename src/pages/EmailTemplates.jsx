import { useEffect, useState } from 'react'
import { emailTemplates, emails } from '../api/endpoints'
import Button from '../components/ui/Button'
import Modal from '../components/ui/Modal'
import { PageHeader } from '../components/ui/Typography'
import { Plus, Edit, Trash2, Eye, EyeOff, ToggleLeft, ToggleRight } from 'lucide-react'

const SLUG_RE = /^[a-z0-9-]+$/

function TemplateEditor({ template, onSave, onCancel, saving }) {
  const [form, setForm] = useState(
    template
      ? { ...template, variables: Array.isArray(template.variables) ? template.variables.join(', ') : '' }
      : { name: '', slug: '', subject: '', body_html: DEFAULT_HTML, variables: '', is_active: true }
  )
  const [preview, setPreview] = useState(false)
  const [error, setError]     = useState('')

  const set = (k) => (e) => {
    const val = e.target.type === 'checkbox' ? e.target.checked : e.target.value
    setForm(p => {
      const next = { ...p, [k]: val }
      if (k === 'name' && !template) next.slug = val.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
      return next
    })
  }

  const submit = () => {
    if (!form.name.trim())    { setError('Name is required'); return }
    if (!SLUG_RE.test(form.slug)) { setError('Slug: lowercase letters, numbers and hyphens only'); return }
    if (!form.subject.trim()) { setError('Subject is required'); return }
    if (!form.body_html.trim()) { setError('Body is required'); return }
    setError('')
    const vars = form.variables.split(',').map(v => v.trim()).filter(Boolean)
    onSave({ ...form, variables: vars })
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <label className="text-xs text-valo-subtle uppercase tracking-wider font-medium">Name</label>
          <input value={form.name} onChange={set('name')} className="w-full bg-valo-black border border-valo-border rounded-lg px-3 py-2 text-sm text-valo-text focus:outline-none focus:border-valo-accent" />
        </div>
        <div className="space-y-1">
          <label className="text-xs text-valo-subtle uppercase tracking-wider font-medium">Slug</label>
          <input value={form.slug} onChange={set('slug')} className="w-full bg-valo-black border border-valo-border rounded-lg px-3 py-2 text-sm text-valo-text font-mono focus:outline-none focus:border-valo-accent" />
        </div>
      </div>

      <div className="space-y-1">
        <label className="text-xs text-valo-subtle uppercase tracking-wider font-medium">Subject</label>
        <input value={form.subject} onChange={set('subject')} className="w-full bg-valo-black border border-valo-border rounded-lg px-3 py-2 text-sm text-valo-text focus:outline-none focus:border-valo-accent" />
      </div>

      <div className="space-y-1">
        <label className="text-xs text-valo-subtle uppercase tracking-wider font-medium">Variables (comma-separated)</label>
        <input value={form.variables} onChange={set('variables')} placeholder="contact_name, invoice_number, amount" className="w-full bg-valo-black border border-valo-border rounded-lg px-3 py-2 text-sm text-valo-text font-mono focus:outline-none focus:border-valo-accent" />
        <p className="text-xs text-valo-muted">Use &#123;&#123;variable_name&#125;&#125; in subject and body</p>
      </div>

      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <label className="text-xs text-valo-subtle uppercase tracking-wider font-medium">Body HTML</label>
          <button onClick={() => setPreview(v => !v)} className="flex items-center gap-1 text-xs text-valo-subtle hover:text-valo-text transition-colors">
            {preview ? <><EyeOff size={12} /> Edit</> : <><Eye size={12} /> Preview</>}
          </button>
        </div>
        {preview ? (
          <div className="bg-white rounded-lg overflow-auto max-h-72 border border-valo-border" dangerouslySetInnerHTML={{ __html: form.body_html }} />
        ) : (
          <textarea
            value={form.body_html}
            onChange={set('body_html')}
            rows={12}
            className="w-full bg-valo-black border border-valo-border rounded-lg px-3 py-2 text-xs text-valo-text font-mono focus:outline-none focus:border-valo-accent resize-y"
          />
        )}
      </div>

      <label className="flex items-center gap-2 cursor-pointer">
        <input type="checkbox" checked={form.is_active} onChange={set('is_active')} className="accent-valo-accent w-4 h-4" />
        <span className="text-sm text-valo-text">Active (available when sending emails)</span>
      </label>

      {error && <p className="text-xs text-red-400">{error}</p>}

      <div className="flex justify-end gap-2 pt-2">
        <Button variant="secondary" size="sm" onClick={onCancel}>Cancel</Button>
        <Button variant="primary" size="sm" onClick={submit} loading={saving}>Save Template</Button>
      </div>
    </div>
  )
}

const DEFAULT_HTML = `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><style>
body{font-family:Arial,sans-serif;color:#1a1a1a;font-size:14px;line-height:1.6;max-width:620px;margin:0 auto;padding:24px}
.footer{margin-top:32px;padding-top:16px;border-top:1px solid #e5e5e5;font-size:12px;color:#666}
</style></head>
<body>
<p>Hi {{contact_name}},</p>
<p>Your message here.</p>
<div class="footer">
  <p>Warm regards,<br><strong>Valo Systems</strong><br>billing@valosystems.co.za</p>
</div>
</body>
</html>`

export default function EmailTemplates() {
  const [list, setList]         = useState([])
  const [editing, setEditing]   = useState(null)
  const [creating, setCreating] = useState(false)
  const [saving, setSaving]     = useState(false)
  const [deleteId, setDeleteId] = useState(null)

  const load = () => emailTemplates.list().then(r => setList(r.templates || [])).catch(() => {})

  useEffect(() => { load() }, [])

  const handleSave = async (data) => {
    setSaving(true)
    try {
      if (editing?.id) {
        await emailTemplates.update(editing.id, data)
      } else {
        await emailTemplates.create(data)
      }
      await load()
      setEditing(null)
      setCreating(false)
    } catch (e) {
      alert(e?.error || 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  const handleToggle = async (t) => {
    await emailTemplates.update(t.id, { is_active: !t.is_active }).catch(() => {})
    load()
  }

  const handleDelete = async () => {
    if (!deleteId) return
    await emailTemplates.delete(deleteId).catch(() => {})
    setDeleteId(null)
    load()
  }

  return (
    <div className="max-w-4xl space-y-4">
      <div className="flex items-center justify-between">
        <PageHeader title="Email Templates" subtitle="Manage reusable templates for outbound emails" />
        <Button variant="primary" size="sm" onClick={() => { setCreating(true); setEditing(null) }}>
          <Plus size={14} /> New Template
        </Button>
      </div>

      {(creating || editing) && (
        <div className="bg-valo-card border border-valo-border rounded-xl p-5">
          <h3 className="text-valo-text font-medium mb-4">{editing ? 'Edit Template' : 'New Template'}</h3>
          <TemplateEditor
            template={editing}
            onSave={handleSave}
            onCancel={() => { setEditing(null); setCreating(false) }}
            saving={saving}
          />
        </div>
      )}

      <div className="bg-valo-card border border-valo-border rounded-xl overflow-hidden">
        {list.length === 0 ? (
          <div className="py-12 text-center text-valo-subtle text-sm">No templates yet. Create one above.</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-valo-border">
                <th className="text-left px-5 py-3 text-xs text-valo-subtle font-medium uppercase tracking-wider">Name</th>
                <th className="text-left px-5 py-3 text-xs text-valo-subtle font-medium uppercase tracking-wider hidden sm:table-cell">Slug</th>
                <th className="text-left px-5 py-3 text-xs text-valo-subtle font-medium uppercase tracking-wider hidden md:table-cell">Subject</th>
                <th className="px-5 py-3 text-xs text-valo-subtle font-medium uppercase tracking-wider">Active</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-valo-border">
              {list.map(t => (
                <tr key={t.id} className="hover:bg-valo-dark transition-colors">
                  <td className="px-5 py-3 font-medium text-valo-text">{t.name}</td>
                  <td className="px-5 py-3 text-valo-subtle font-mono text-xs hidden sm:table-cell">{t.slug}</td>
                  <td className="px-5 py-3 text-valo-subtle truncate max-w-xs hidden md:table-cell">{t.subject}</td>
                  <td className="px-5 py-3 text-center">
                    <button onClick={() => handleToggle(t)} className="text-valo-subtle hover:text-valo-text transition-colors">
                      {t.is_active ? <ToggleRight size={20} className="text-valo-accent" /> : <ToggleLeft size={20} />}
                    </button>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => { setEditing(t); setCreating(false) }} className="p-1.5 text-valo-subtle hover:text-valo-text rounded transition-colors">
                        <Edit size={14} />
                      </button>
                      <button onClick={() => setDeleteId(t.id)} className="p-1.5 text-valo-subtle hover:text-red-400 rounded transition-colors">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <Modal open={!!deleteId} onClose={() => setDeleteId(null)} title="Delete Template" size="sm">
        <p className="text-valo-text text-sm mb-5">This template will be permanently deleted. Emails already sent will not be affected.</p>
        <div className="flex justify-end gap-2">
          <Button variant="secondary" size="sm" onClick={() => setDeleteId(null)}>Cancel</Button>
          <Button variant="danger" size="sm" onClick={handleDelete}>Delete</Button>
        </div>
      </Modal>
    </div>
  )
}
