import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { dashboard } from '../api/endpoints'
import StatCard from '../components/ui/StatCard'
import Badge from '../components/ui/Badge'
import { ListTable, ListRow } from '../components/ui/Table'
import { PageHeader, SectionCard, SectionTitle } from '../components/ui/Typography'
import { Receipt, Users, TrendingUp, AlertCircle, ArrowRight, DollarSign } from 'lucide-react'
import { format } from 'date-fns'

const fmt = (n) => new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR', minimumFractionDigits: 2 }).format(parseFloat(n) || 0)

// Placeholder data for when the API isn't connected yet
const PLACEHOLDER = {
  totalRevenue: 25723.43,
  outstanding: 8420.03,
  clientCount: 3,
  invoiceCount: 4,
  recentInvoices: [
    { id: 1, number: 'VAL-CGS-2026-000', client: 'Convenient Gas Solutions', amount: 3600, status: 'confirmed', date: '2026-03-24' },
    { id: 2, number: 'VAL-CGS-2026-001', client: 'Convenient Gas Solutions', amount: 2724.40, status: 'estimated', date: '2026-04-30' },
    { id: 3, number: 'VAL-K2H-2026-000', client: 'Kasi to Home', amount: 10979, status: 'confirmed', date: '2026-03-24' },
    { id: 4, number: 'VAL-OS-2026-001', client: 'OmniSolve', amount: 8420.03, status: 'partial', date: '2026-04-01' },
  ],
  revenueByClient: [
    { client: 'Convenient Gas Solutions', total: 6324.40, invoices: 2 },
    { client: 'Kasi to Home', total: 10979, invoices: 1 },
    { client: 'OmniSolve', total: 8420.03, invoices: 1 },
  ]
}

export default function Dashboard() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    dashboard.summary()
      .then(setData)
      .catch(() => setData(PLACEHOLDER))
      .finally(() => setLoading(false))
  }, [])

  const d = data || PLACEHOLDER

  return (
    <div className="space-y-6 max-w-6xl">
      <PageHeader
        title="Dashboard"
        subtitle={`${format(new Date(), 'EEEE, d MMMM yyyy')}, Overview of Valo Systems operations`}
      />

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
        <StatCard
          label="Total Revenue"
          value={fmt(d.totalRevenue)}
          sub="All time"
          icon={DollarSign}
          color="accent"
        />
        <StatCard
          label="Outstanding"
          value={fmt(d.outstanding)}
          sub="Awaiting payment"
          icon={AlertCircle}
          color="amber"
        />
        <StatCard
          label="Active Clients"
          value={d.clientCount}
          sub="Billable accounts"
          icon={Users}
          color="blue"
        />
        <StatCard
          label="Invoices Issued"
          value={d.invoiceCount}
          sub="Total to date"
          icon={Receipt}
          color="green"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
        {/* Recent invoices */}
        <SectionCard
          title="Recent Invoices"
          icon={Receipt}
          className="lg:col-span-2"
          action={
            <Link to="/invoices" className="text-valo-accent text-xs flex items-center gap-1 hover:underline">
              View all <ArrowRight size={12} />
            </Link>
          }
        >
          <div className="-mx-5 -my-5">
            <ListTable>
              {d.recentInvoices.map((inv) => (
                <Link key={inv.id} to={`/invoices/${inv.id}`} className="block hover:bg-valo-dark transition-colors">
                  <ListRow
                    primary={<span className="font-mono text-valo-accent text-xs">{inv.number}</span>}
                    secondary={inv.client_name || inv.client}
                    meta={<span className="tabular-nums text-sm font-medium text-valo-text">{fmt(inv.total ?? inv.amount)}</span>}
                    badge={<Badge status={inv.status} />}
                  />
                </Link>
              ))}
            </ListTable>
          </div>
        </SectionCard>

        {/* Revenue by client */}
        <SectionCard title="Revenue by Client" icon={TrendingUp}>
          <div className="-mx-5 -my-5 p-5 space-y-4">
            {d.revenueByClient.map((item, i) => {
              const pct = d.totalRevenue > 0 ? Math.round((parseFloat(item.total) / parseFloat(d.totalRevenue)) * 100) : 0
              return (
                <div key={i}>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="text-valo-text text-xs font-medium truncate max-w-[120px]">{item.client}</div>
                    <div className="text-valo-subtle text-xs tabular-nums">{fmt(item.total)}</div>
                  </div>
                  <div className="h-1.5 bg-valo-border rounded-full overflow-hidden">
                    <div className="h-full bg-valo-accent rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                  <div className="text-valo-muted text-xs mt-1">{item.invoices} invoice{item.invoices !== 1 ? 's' : ''} &bull; {pct}%</div>
                </div>
              )
            })}
          </div>
        </SectionCard>
      </div>

      {/* Quick actions */}
      <SectionCard title="Quick Actions">
        <div className="-mx-5 -my-5 p-5">
        <div className="flex flex-wrap gap-3">
          <Link to="/invoices/new" className="flex items-center gap-2 px-4 py-2 bg-valo-accent text-valo-black text-sm font-medium rounded-lg hover:bg-valo-accent-dim transition-colors">
            <Receipt size={15} /> New Invoice
          </Link>
          <Link to="/clients/new" className="flex items-center gap-2 px-4 py-2 bg-valo-dark border border-valo-border text-valo-text text-sm font-medium rounded-lg hover:bg-valo-muted/20 transition-colors">
            <Users size={15} /> Add Client
          </Link>
          <Link to="/expenses/new" className="flex items-center gap-2 px-4 py-2 bg-valo-dark border border-valo-border text-valo-text text-sm font-medium rounded-lg hover:bg-valo-muted/20 transition-colors">
            <TrendingUp size={15} /> Log Expense
          </Link>
        </div>
        </div>
      </SectionCard>
    </div>
  )
}
