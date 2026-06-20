export function Input({ label, error, className = '', mono, ...props }) {
  return (
    <div className="space-y-1.5">
      {label && <label className="block text-valo-subtle text-xs font-medium uppercase tracking-wide">{label}</label>}
      <input
        className={`w-full bg-valo-black border ${error ? 'border-valo-red/50' : 'border-valo-border'}
          rounded-lg px-3 py-2.5 text-valo-text text-sm placeholder:text-valo-muted
          focus:outline-none focus:border-valo-accent/60 transition-colors
          ${mono ? 'font-mono' : ''} ${className}`}
        {...props}
      />
      {error && <p className="text-valo-red text-xs">{error}</p>}
    </div>
  )
}

export function Select({ label, error, children, className = '', ...props }) {
  return (
    <div className="space-y-1.5">
      {label && <label className="block text-valo-subtle text-xs font-medium uppercase tracking-wide">{label}</label>}
      <select
        className={`w-full bg-valo-black border ${error ? 'border-valo-red/50' : 'border-valo-border'}
          rounded-lg px-3 py-2.5 text-valo-text text-sm
          focus:outline-none focus:border-valo-accent/60 transition-colors ${className}`}
        {...props}
      >
        {children}
      </select>
      {error && <p className="text-valo-red text-xs">{error}</p>}
    </div>
  )
}

export function Textarea({ label, error, className = '', ...props }) {
  return (
    <div className="space-y-1.5">
      {label && <label className="block text-valo-subtle text-xs font-medium uppercase tracking-wide">{label}</label>}
      <textarea
        className={`w-full bg-valo-black border ${error ? 'border-valo-red/50' : 'border-valo-border'}
          rounded-lg px-3 py-2.5 text-valo-text text-sm placeholder:text-valo-muted
          focus:outline-none focus:border-valo-accent/60 transition-colors resize-none ${className}`}
        {...props}
      />
      {error && <p className="text-valo-red text-xs">{error}</p>}
    </div>
  )
}
