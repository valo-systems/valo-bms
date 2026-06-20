import { useEffect } from 'react'
import { X } from 'lucide-react'

export default function Modal({ open, onClose, title, children, size = 'md' }) {
  useEffect(() => {
    const handle = (e) => { if (e.key === 'Escape') onClose() }
    if (open) document.addEventListener('keydown', handle)
    return () => document.removeEventListener('keydown', handle)
  }, [open, onClose])

  if (!open) return null

  const sizes = { sm: 'max-w-md', md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-4xl' }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className={`relative bg-valo-dark border border-valo-border rounded-xl w-full ${sizes[size]} shadow-2xl`}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-valo-border">
          <h2 className="text-valo-text font-semibold text-base">{title}</h2>
          <button onClick={onClose} className="p-1 text-valo-subtle hover:text-valo-text rounded transition-colors">
            <X size={18} />
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  )
}
