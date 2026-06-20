import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { team as teamApi } from '../api/endpoints'
import { Users, Mail, Phone, ChevronRight } from 'lucide-react'

const ROLE_COLORS = {
  admin:   'bg-valo-accent/15 text-valo-accent border-valo-accent/20',
  finance: 'bg-valo-blue/15 text-valo-blue border-valo-blue/20',
  viewer:  'bg-valo-muted/40 text-valo-subtle border-valo-border',
}
const EMPLOYMENT_LABEL = {
  director:   'Director',
  staff:      'Full-time',
  contractor: 'Contractor',
  part_time:  'Part-time',
}

function initials(name) {
  return (name || '').split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
}

export default function Team() {
  const [members, setMembers] = useState([])

  useEffect(() => {
    teamApi.list().then(res => setMembers(res.users || res)).catch(() => {})
  }, [])

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-valo-text text-2xl font-semibold">Team</h1>
        <p className="text-valo-subtle text-sm mt-1">Valo Systems staff &amp; finance department</p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {members.map(m => (
          <Link key={m.id} to={`/team/${m.id}`}
            className="bg-valo-card border border-valo-border rounded-xl p-5 hover:border-valo-accent/40 hover:bg-valo-dark transition-all group">
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-valo-accent/10 border border-valo-accent/20 flex items-center justify-center">
                <span className="text-valo-accent font-bold text-base">{initials(m.name)}</span>
              </div>
              <span className={`text-xs px-2 py-0.5 rounded-md border font-medium ${ROLE_COLORS[m.role] || ROLE_COLORS.viewer}`}>
                {m.role}
              </span>
            </div>

            <div className="mb-3">
              <div className="text-valo-text font-semibold text-sm">{m.name}</div>
              <div className="text-valo-accent text-xs mt-0.5">{m.title || m.role}</div>
              {m.department && <div className="text-valo-muted text-xs mt-0.5">{m.department}</div>}
            </div>

            <div className="space-y-1.5 mb-4">
              <div className="flex items-center gap-2 text-valo-subtle text-xs">
                <Mail size={11} className="shrink-0" />
                <span className="truncate">{m.email}</span>
              </div>
              {m.phone && (
                <div className="flex items-center gap-2 text-valo-subtle text-xs">
                  <Phone size={11} className="shrink-0" />
                  <span>{m.phone}</span>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-valo-border">
              <span className="text-valo-muted text-xs">
                {m.employment_type ? (EMPLOYMENT_LABEL[m.employment_type] || m.employment_type) : 'Team member'}
              </span>
              <ChevronRight size={14} className="text-valo-muted group-hover:text-valo-accent transition-colors" />
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
