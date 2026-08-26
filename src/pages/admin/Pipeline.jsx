import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { Container } from '../../components/ui'

const STATUSES = ['applied', 'shortlisted', 'interview', 'placed', 'rejected']
const COLUMN_COLORS = {
  applied: 'border-t-slate-400',
  shortlisted: 'border-t-[var(--color-primary)]',
  interview: 'border-t-purple-500',
  placed: 'border-t-[var(--color-success)]',
  rejected: 'border-t-[var(--color-danger)]',
}

export default function Pipeline() {
  const [candidates, setCandidates] = useState([])
  const [loading, setLoading] = useState(true)
  const [draggingId, setDraggingId] = useState(null)

  async function load() {
    const { data: cands } = await supabase.from('candidate').select('*').order('created_at', { ascending: false })
    const { data: apps } = await supabase.from('application').select('*').order('status_updated_at', { ascending: false })

    const latestAppByCandidate = {}
    for (const app of apps || []) {
      if (!latestAppByCandidate[app.candidate_id]) latestAppByCandidate[app.candidate_id] = app
    }

    setCandidates(
      (cands || []).map((c) => ({
        ...c,
        applicationId: latestAppByCandidate[c.id]?.id || null,
        status: latestAppByCandidate[c.id]?.status || 'applied',
      }))
    )
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function moveCandidate(candidate, newStatus) {
    if (candidate.status === newStatus) return
    setCandidates((prev) => prev.map((c) => (c.id === candidate.id ? { ...c, status: newStatus } : c)))
    if (candidate.applicationId) {
      await supabase.from('application').update({ status: newStatus, status_updated_at: new Date().toISOString() }).eq('id', candidate.applicationId)
    } else {
      await supabase.from('application').insert({ candidate_id: candidate.id, job_id: null, status: newStatus })
    }
    load()
  }

  if (loading) return <p className="p-8 text-center text-sm text-[var(--color-muted)]">Loading...</p>

  return (
    <Container narrow={false}>
      <h2 className="mb-1 text-xl font-bold text-[var(--color-ink)]">Pipeline</h2>
      <p className="mb-5 text-sm text-[var(--color-muted)]">Drag a candidate card between columns to update their status.</p>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {STATUSES.map((status) => (
          <div
            key={status}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault()
              const candidate = candidates.find((c) => c.id === draggingId)
              if (candidate) moveCandidate(candidate, status)
            }}
            className={`min-w-0 rounded-xl border-t-4 bg-[var(--color-surface-muted)] p-3 ${COLUMN_COLORS[status]}`}
          >
            <div className="mb-3 flex items-center justify-between">
              <h4 className="text-sm font-bold capitalize text-[var(--color-ink)]">{status}</h4>
              <span className="text-xs text-[var(--color-muted)]">{candidates.filter((c) => c.status === status).length}</span>
            </div>
            <div className="max-h-[65vh] space-y-2 overflow-y-auto">
              {candidates
                .filter((c) => c.status === status)
                .map((c) => (
                  <div
                    key={c.id}
                    draggable
                    onDragStart={() => setDraggingId(c.id)}
                    className="cursor-grab rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-3 shadow-sm active:cursor-grabbing"
                  >
                    <Link to={`/admin/candidates/${c.id}`} className="text-sm font-semibold text-[var(--color-primary)]">{c.name}</Link>
                    <p className="text-xs text-[var(--color-muted)]">{(c.job_categories || []).join(', ')}</p>
                    <p className="text-xs text-[var(--color-muted)]">{c.city}</p>
                  </div>
                ))}
            </div>
          </div>
        ))}
      </div>
    </Container>
  )
}
