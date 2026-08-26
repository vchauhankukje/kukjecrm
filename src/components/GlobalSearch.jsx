import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function GlobalSearch() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState(null)
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const boxRef = useRef(null)

  useEffect(() => {
    const q = query.trim()
    if (q.length < 2) {
      setResults(null)
      return
    }
    setLoading(true)
    const timer = setTimeout(async () => {
      const [{ data: candidates }, { data: jobs }, { data: partners }] = await Promise.all([
        supabase.from('candidate').select('id, name, phone, city').ilike('name', `%${q}%`).limit(5),
        supabase.from('job').select('id, title, city, country').ilike('title', `%${q}%`).limit(5),
        supabase.from('partner').select('id, business_name, referral_code').ilike('business_name', `%${q}%`).limit(5),
      ])
      setResults({ candidates: candidates || [], jobs: jobs || [], partners: partners || [] })
      setLoading(false)
    }, 250)
    return () => clearTimeout(timer)
  }, [query])

  useEffect(() => {
    function onClickOutside(e) {
      if (boxRef.current && !boxRef.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [])

  function go(path) {
    setOpen(false)
    setQuery('')
    setResults(null)
    navigate(path)
  }

  const hasResults =
    results && (results.candidates.length > 0 || results.jobs.length > 0 || results.partners.length > 0)

  return (
    <div ref={boxRef} className="relative w-64">
      <input
        value={query}
        onChange={(e) => { setQuery(e.target.value); setOpen(true) }}
        onFocus={() => setOpen(true)}
        placeholder="Search candidates, jobs, partners..."
        className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-muted)] px-3 py-1.5 text-sm outline-none transition focus:border-[var(--color-primary)] focus:bg-[var(--color-surface)] focus:ring-2 focus:ring-[var(--color-primary-tint)]"
      />
      {open && query.trim().length >= 2 && (
        <div className="absolute z-20 mt-1 max-h-96 w-80 overflow-y-auto rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-lg">
          {loading && <p className="px-3.5 py-2.5 text-sm text-[var(--color-muted)]">Searching...</p>}
          {!loading && !hasResults && <p className="px-3.5 py-2.5 text-sm text-[var(--color-muted)]">No matches.</p>}
          {!loading && results?.candidates.length > 0 && (
            <ResultGroup label="Candidates">
              {results.candidates.map((c) => (
                <ResultRow key={c.id} onClick={() => go(`/admin/candidates/${c.id}`)} title={c.name} subtitle={[c.city, c.phone].filter(Boolean).join(' · ')} />
              ))}
            </ResultGroup>
          )}
          {!loading && results?.jobs.length > 0 && (
            <ResultGroup label="Jobs">
              {results.jobs.map((j) => (
                <ResultRow key={j.id} onClick={() => go(`/admin/jobs/${j.id}/edit`)} title={j.title} subtitle={[j.city, j.country].filter(Boolean).join(', ')} />
              ))}
            </ResultGroup>
          )}
          {!loading && results?.partners.length > 0 && (
            <ResultGroup label="Partners/Agents">
              {results.partners.map((p) => (
                <ResultRow key={p.id} onClick={() => go('/admin/partners')} title={p.business_name} subtitle={p.referral_code} />
              ))}
            </ResultGroup>
          )}
        </div>
      )}
    </div>
  )
}

function ResultGroup({ label, children }) {
  return (
    <div className="border-b border-[var(--color-border)] py-1 last:border-0">
      <p className="px-3.5 pb-1 pt-1.5 text-xs font-semibold uppercase tracking-wide text-[var(--color-muted)]">{label}</p>
      {children}
    </div>
  )
}

function ResultRow({ onClick, title, subtitle }) {
  return (
    <button
      type="button"
      onMouseDown={onClick}
      className="block w-full px-3.5 py-2 text-left hover:bg-[var(--color-surface-muted)]"
    >
      <p className="text-sm font-semibold text-[var(--color-ink)]">{title}</p>
      {subtitle && <p className="text-xs text-[var(--color-muted)]">{subtitle}</p>}
    </button>
  )
}
