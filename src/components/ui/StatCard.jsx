const COLORS = {
  accent: 'text-valo-accent bg-valo-accent/10',
  green:  'text-valo-green  bg-valo-green/10',
  red:    'text-valo-red    bg-valo-red/10',
  amber:  'text-valo-amber  bg-valo-amber/10',
  blue:   'text-valo-blue   bg-valo-blue/10',
}

export default function StatCard({ label, value, sub, icon: Icon, color = 'accent', trend, onClick }) {
  const cls = COLORS[color] || COLORS.accent
  const [iconCls, bgCls] = cls.split(' ')

  return (
    <div
      onClick={onClick}
      className={`bg-valo-card border border-valo-border rounded-xl p-4 lg:p-5
        ${onClick ? 'cursor-pointer hover:border-valo-accent/40 active:scale-[0.99] transition-all' : ''}`}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <span className="text-valo-subtle text-xs font-medium uppercase tracking-wider leading-tight">{label}</span>
        {Icon && (
          <div className={`shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ${bgCls} ${iconCls}`}>
            <Icon size={16} />
          </div>
        )}
      </div>
      <div className="text-valo-text text-xl lg:text-2xl font-semibold leading-none tabular-nums">{value}</div>
      {sub && <div className="text-valo-muted text-xs mt-1.5 truncate">{sub}</div>}
      {trend !== undefined && (
        <div className={`text-xs mt-1.5 font-medium ${trend >= 0 ? 'text-valo-green' : 'text-valo-red'}`}>
          {trend >= 0 ? '↑' : '↓'} {Math.abs(trend)}% vs last month
        </div>
      )}
    </div>
  )
}
