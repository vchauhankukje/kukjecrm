import { useState } from 'react'

export function Container({ children, className = '', narrow = true }) {
  return (
    <div className={`mx-auto w-full ${narrow ? 'max-w-md' : 'max-w-4xl'} px-5 py-8 ${className}`}>
      {children}
    </div>
  )
}

export function BackLink({ onClick, label = 'Back' }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="mb-3 inline-flex items-center gap-1 text-sm font-semibold text-[var(--color-muted)] hover:text-[var(--color-primary)]"
    >
      ← {label}
    </button>
  )
}

export function PageHeader({ title, subtitle }) {
  return (
    <div className="mb-6 text-center">
      <h2 className="text-2xl font-bold tracking-tight">{title}</h2>
      {subtitle && <p className="mt-1 text-sm text-[var(--color-muted)]">{subtitle}</p>}
    </div>
  )
}

export function Card({ children, className = '' }) {
  return (
    <div className={`rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-sm ${className}`}>
      {children}
    </div>
  )
}

export function Field({ label, children, hint }) {
  return (
    <label className="mb-4 block text-left">
      {label && <span className="mb-1.5 block text-sm font-semibold text-[var(--color-ink)]">{label}</span>}
      {children}
      {hint && <span className="mt-1 block text-xs text-[var(--color-muted)]">{hint}</span>}
    </label>
  )
}

const inputBase =
  'w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3.5 py-2.5 text-[var(--color-ink)] outline-none transition placeholder:text-[var(--color-muted)] focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary-tint)]'

export function Input(props) {
  return <input {...props} className={`${inputBase} ${props.className || ''}`} />
}

export function Select(props) {
  return <select {...props} className={`${inputBase} ${props.className || ''}`} />
}

export function Textarea(props) {
  return <textarea {...props} className={`${inputBase} ${props.className || ''}`} />
}

const buttonVariants = {
  primary: 'bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-dark)] shadow-sm shadow-blue-900/10',
  secondary: 'bg-[var(--color-surface)] text-[var(--color-ink)] border border-[var(--color-border)] hover:bg-[var(--color-surface-muted)]',
  danger: 'bg-[var(--color-danger)] text-white hover:opacity-90',
  success: 'bg-[var(--color-success)] text-white hover:opacity-90',
  ghost: 'text-[var(--color-primary)] hover:bg-[var(--color-primary-tint)]',
}

export function Button({ variant = 'primary', className = '', children, ...props }) {
  return (
    <button
      {...props}
      className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${buttonVariants[variant]} ${className}`}
    >
      {children}
    </button>
  )
}

export function LinkButton({ to, variant = 'primary', className = '', children }) {
  return (
    <a
      href={to}
      className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold no-underline transition ${buttonVariants[variant]} ${className}`}
    >
      {children}
    </a>
  )
}

export function Chip({ selected, children, ...props }) {
  return (
    <button
      type="button"
      {...props}
      className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
        selected
          ? 'border-[var(--color-primary)] bg-[var(--color-primary)] text-white'
          : 'border-[var(--color-border)] bg-white text-[var(--color-body)] hover:border-[var(--color-primary)]'
      }`}
    >
      {children}
    </button>
  )
}

const pillVariants = {
  applied: 'bg-slate-100 text-slate-600',
  shortlisted: 'bg-[var(--color-primary-tint)] text-[var(--color-primary)]',
  interview: 'bg-purple-100 text-purple-700',
  placed: 'bg-[var(--color-success-tint)] text-[var(--color-success)]',
  rejected: 'bg-[var(--color-danger-tint)] text-[var(--color-danger)]',
  active: 'bg-[var(--color-success-tint)] text-[var(--color-success)]',
  paused: 'bg-[var(--color-warning-tint)] text-[var(--color-warning)]',
  filled: 'bg-slate-100 text-slate-600',
}

export function Pill({ status }) {
  return (
    <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${pillVariants[status] || 'bg-slate-100 text-slate-600'}`}>
      {status?.replace('_', ' ')}
    </span>
  )
}

export function ErrorText({ children }) {
  if (!children) return null
  return <p className="mb-3 text-sm font-medium text-[var(--color-danger)]">{children}</p>
}

export function Lookup({ options, value, onChange, placeholder = 'Search...', getLabel = (o) => o.label, getValue = (o) => o.value }) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')

  const selected = options.find((o) => getValue(o) === value)
  const matches = options.filter((o) => getLabel(o).toLowerCase().includes(query.toLowerCase())).slice(0, 20)

  return (
    <div className="relative">
      <Input
        value={open ? query : selected ? getLabel(selected) : ''}
        onChange={(e) => { setQuery(e.target.value); setOpen(true) }}
        onFocus={() => { setQuery(''); setOpen(true) }}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        placeholder={placeholder}
      />
      {open && (
        <div className="absolute z-10 mt-1 max-h-56 w-full overflow-y-auto rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-lg">
          <button
            type="button"
            onMouseDown={() => { onChange(null); setOpen(false) }}
            className="block w-full px-3.5 py-2 text-left text-sm text-[var(--color-muted)] hover:bg-[var(--color-surface-muted)]"
          >
            — None (direct) —
          </button>
          {matches.map((o) => (
            <button
              key={getValue(o)}
              type="button"
              onMouseDown={() => { onChange(getValue(o)); setOpen(false) }}
              className="block w-full px-3.5 py-2 text-left text-sm text-[var(--color-ink)] hover:bg-[var(--color-surface-muted)]"
            >
              {getLabel(o)}
            </button>
          ))}
          {matches.length === 0 && <p className="px-3.5 py-2 text-sm text-[var(--color-muted)]">No matches.</p>}
        </div>
      )}
    </div>
  )
}

export function PathBar({ stages, current, onSelect, closedLabel, closedActive }) {
  const currentIndex = stages.indexOf(current)
  return (
    <div className="mb-4 flex w-full overflow-hidden rounded-xl border border-[var(--color-border)] text-sm font-semibold">
      {stages.map((stage, i) => {
        const done = i < currentIndex || closedActive
        const active = i === currentIndex && !closedActive
        return (
          <button
            key={stage}
            type="button"
            onClick={() => onSelect?.(stage)}
            style={{ '--chevron-notch': '14px' }}
            className={`relative flex-1 whitespace-nowrap px-5 py-2.5 text-center capitalize transition first:pl-4 last:pr-4 ${
              i !== 0 ? 'ml-[-14px] pl-6' : ''
            } ${
              active
                ? 'z-10 bg-[var(--color-primary)] text-white'
                : done
                ? 'bg-[var(--color-primary-tint)] text-[var(--color-primary)]'
                : 'bg-[var(--color-surface-muted)] text-[var(--color-muted)] hover:bg-[var(--color-border)]'
            }`}
          >
            <span
              className="pointer-events-none absolute inset-y-0 right-[-14px] z-10 w-7"
              style={{
                clipPath: 'polygon(0 0, 50% 50%, 0 100%)',
                background: active ? 'var(--color-primary)' : done ? 'var(--color-primary-tint)' : 'var(--color-surface-muted)',
              }}
            />
            {stage.replace('_', ' ')}
          </button>
        )
      })}
      {closedLabel && (
        <button
          type="button"
          onClick={() => onSelect?.(closedLabel)}
          className={`ml-[-14px] flex-1 whitespace-nowrap px-6 py-2.5 pr-4 text-center capitalize transition ${
            closedActive
              ? 'bg-[var(--color-danger)] text-white'
              : 'bg-[var(--color-danger-tint)] text-[var(--color-danger)] hover:opacity-80'
          }`}
        >
          {closedLabel.replace('_', ' ')}
        </button>
      )}
    </div>
  )
}

export function ProgressSteps({ step, total }) {
  return (
    <div className="mb-6 flex items-center justify-center gap-1.5">
      {Array.from({ length: total }).map((_, i) => (
        <span
          key={i}
          className={`h-1.5 rounded-full transition-all ${
            i < step ? 'w-6 bg-[var(--color-primary)]' : 'w-3 bg-[var(--color-border)]'
          }`}
        />
      ))}
    </div>
  )
}
