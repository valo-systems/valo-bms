// ── Table — horizontal-scroll on mobile, full on desktop ──────────────────
export function Table({ children }) {
  return (
    <div className="overflow-x-auto -mx-px scrollbar-none">
      <table className="w-full text-sm min-w-[520px]">{children}</table>
    </div>
  )
}

export function Thead({ children }) {
  return (
    <thead>
      <tr className="border-b border-valo-border">{children}</tr>
    </thead>
  )
}

export function Th({ children, right, className = '' }) {
  return (
    <th className={`px-4 py-3 text-valo-subtle font-medium text-xs uppercase tracking-wider whitespace-nowrap ${right ? 'text-right' : 'text-left'} ${className}`}>
      {children}
    </th>
  )
}

export function Tbody({ children }) {
  return <tbody className="divide-y divide-valo-border">{children}</tbody>
}

export function Tr({ children, onClick, selected = false }) {
  return (
    <tr
      onClick={onClick}
      className={`transition-colors ${onClick ? 'cursor-pointer hover:bg-valo-dark active:bg-valo-muted/20' : ''} ${selected ? 'bg-valo-accent/5' : ''}`}
    >
      {children}
    </tr>
  )
}

export function Td({ children, right, muted, colSpan, className = '' }) {
  return (
    <td
      colSpan={colSpan}
      className={`px-4 py-3 ${right ? 'text-right' : ''} ${muted ? 'text-valo-subtle' : 'text-valo-text'} ${className}`}
    >
      {children}
    </td>
  )
}

// ── ListTable — mobile-first stacked rows, no horizontal scroll ────────────
// Use this for simple name + badge/value lists instead of multi-column tables.
// On mobile each row stacks: primary left, secondary below, badge right.
export function ListTable({ children }) {
  return <div className="divide-y divide-valo-border">{children}</div>
}

export function ListRow({ primary, secondary, badge, meta, onClick, className = '' }) {
  return (
    <div
      onClick={onClick}
      className={`flex items-center gap-3 px-5 py-3.5 ${onClick ? 'cursor-pointer hover:bg-valo-dark active:bg-valo-muted/20 transition-colors' : ''} ${className}`}
    >
      <div className="flex-1 min-w-0">
        <div className="text-valo-text text-sm truncate">{primary}</div>
        {secondary && <div className="text-valo-muted text-xs mt-0.5 truncate">{secondary}</div>}
      </div>
      <div className="flex items-center gap-3 shrink-0">
        {meta && <span className="text-valo-subtle text-xs hidden sm:block">{meta}</span>}
        {badge}
      </div>
    </div>
  )
}
