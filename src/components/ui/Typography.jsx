// Reusable typography system — use these instead of raw tailwind text classes
// so hierarchy is consistent across the app and easy to change globally.

export function PageTitle({ children, className = '' }) {
  return <h1 className={`text-valo-text text-2xl font-semibold tracking-tight ${className}`}>{children}</h1>
}

export function PageSubtitle({ children, className = '' }) {
  return <p className={`text-valo-subtle text-sm mt-1 ${className}`}>{children}</p>
}

export function SectionTitle({ children, className = '' }) {
  return <h2 className={`text-valo-text font-semibold text-sm ${className}`}>{children}</h2>
}

export function FieldLabel({ children, className = '' }) {
  return <div className={`text-valo-subtle text-xs uppercase tracking-wider font-medium mb-1 ${className}`}>{children}</div>
}

export function FieldValue({ children, mono = false, accent = false, muted = false, className = '' }) {
  const cls = [
    'text-sm',
    mono    ? 'font-mono'             : '',
    accent  ? 'text-valo-accent font-semibold' : muted ? 'text-valo-subtle' : 'text-valo-text',
    className,
  ].filter(Boolean).join(' ')
  return <div className={cls}>{children}</div>
}

export function Mono({ children, className = '' }) {
  return <span className={`font-mono text-sm ${className}`}>{children}</span>
}

export function Caption({ children, className = '' }) {
  return <p className={`text-valo-muted text-xs ${className}`}>{children}</p>
}

export function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-14 px-6 text-center">
      {Icon && (
        <div className="w-12 h-12 rounded-xl bg-valo-card border border-valo-border flex items-center justify-center mb-4">
          <Icon size={22} className="text-valo-muted" />
        </div>
      )}
      <div className="text-valo-text font-medium text-sm">{title}</div>
      {description && <p className="text-valo-subtle text-xs mt-1.5 max-w-xs">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}

export function PageHeader({ title, subtitle, children }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="min-w-0">
        <PageTitle>{title}</PageTitle>
        {subtitle && <PageSubtitle>{subtitle}</PageSubtitle>}
      </div>
      {children && <div className="flex items-center gap-2 shrink-0">{children}</div>}
    </div>
  )
}

export function SectionCard({ icon: Icon, title, action, children, className = '' }) {
  return (
    <div className={`bg-valo-card border border-valo-border rounded-xl ${className}`}>
      <div className="flex items-center justify-between px-5 py-4 border-b border-valo-border">
        <div className="flex items-center gap-2">
          {Icon && <Icon size={15} className="text-valo-accent shrink-0" />}
          <SectionTitle>{title}</SectionTitle>
        </div>
        {action && <div>{action}</div>}
      </div>
      <div className="p-5">{children}</div>
    </div>
  )
}

export function DataGrid({ children, cols = 2, className = '' }) {
  return (
    <div className={`grid gap-4 ${
      cols === 1 ? 'grid-cols-1' :
      cols === 2 ? 'grid-cols-1 sm:grid-cols-2' :
      cols === 3 ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3' :
                   'grid-cols-2 lg:grid-cols-4'
    } ${className}`}>
      {children}
    </div>
  )
}

export function Field({ label, value, mono = false, accent = false, copyable = false }) {
  const [copied, setCopy] = React.useState(false)
  const copy = () => { navigator.clipboard.writeText(String(value)); setCopy(true); setTimeout(() => setCopy(false), 1500) }

  if (value === null || value === undefined || value === '') return null
  return (
    <div>
      <FieldLabel>{label}</FieldLabel>
      <div className={`flex items-center gap-1.5 text-sm ${mono ? 'font-mono' : ''} ${accent ? 'text-valo-accent font-semibold' : 'text-valo-text'}`}>
        <span className="break-all">{value}</span>
        {copyable && (
          <button onClick={copy} className="text-valo-muted hover:text-valo-accent transition-colors shrink-0" title="Copy">
            {copied
              ? <span className="text-green-400 text-xs">✓</span>
              : <span className="text-xs opacity-60">⎘</span>
            }
          </button>
        )}
      </div>
    </div>
  )
}

// Need React for the Field component's useState
import React from 'react'
