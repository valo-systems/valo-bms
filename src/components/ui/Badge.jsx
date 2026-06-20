const variants = {
  confirmed: 'bg-valo-green/15 text-valo-green border-valo-green/20',
  estimated: 'bg-valo-amber/15 text-valo-amber border-valo-amber/20',
  draft: 'bg-valo-muted/40 text-valo-subtle border-valo-border',
  partial: 'bg-valo-blue/15 text-valo-blue border-valo-blue/20',
  paid: 'bg-valo-green/15 text-valo-green border-valo-green/20',
  overdue: 'bg-valo-red/15 text-valo-red border-valo-red/20',
  sent: 'bg-valo-blue/15 text-valo-blue border-valo-blue/20',
  active: 'bg-valo-green/15 text-valo-green border-valo-green/20',
  inactive: 'bg-valo-muted/40 text-valo-subtle border-valo-border',
  admin: 'bg-valo-accent/15 text-valo-accent border-valo-accent/20',
  finance: 'bg-valo-blue/15 text-valo-blue border-valo-blue/20',
}

export default function Badge({ status, label }) {
  const cls = variants[status?.toLowerCase()] || variants.draft
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border ${cls}`}>
      {label || status}
    </span>
  )
}
