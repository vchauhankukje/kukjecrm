import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { Container, Card, Select, Pill } from '../../components/ui'

const LEAD_TYPES = ['employer', 'candidate', 'student']
const STATUSES = ['new', 'contacted', 'qualified', 'converted', 'lost']

export default function LeadList() {
  const [leads, setLeads] = useState([])
  const [loading, setLoading] = useState(true)
  const [typeFilter, setTypeFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  useEffect(() => {
    supabase.from('lead').select('*').order('created_at', { ascending: false }).then(({ data }) => {
      setLeads(data || [])
      setLoading(false)
    })
  }, [])

  const filtered = leads.filter((l) => {
    if (typeFilter && l.lead_type !== typeFilter) return false
    if (statusFilter && l.status !== statusFilter) return false
    return true
  })

  return (
    <Container narrow={false}>
      <div className="mb-5 flex items-center justify-between">
        <h2 className="text-xl font-bold text-[var(--color-ink)]">Leads</h2>
        <Link to="/admin/leads/new" className="rounded-xl bg-[var(--color-primary)] px-4 py-2 text-sm font-semibold text-white no-underline hover:bg-[var(--color-primary-dark)]">
          + New lead
        </Link>
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        <Select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="max-w-[160px]">
          <option value="">All types</option>
          {LEAD_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
        </Select>
        <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="max-w-[160px]">
          <option value="">All statuses</option>
          {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
        </Select>
      </div>

      {loading && <p className="text-sm text-[var(--color-muted)]">Loading...</p>}
      {!loading && (
        <Card className="overflow-x-auto p-0">
          <table className="w-full min-w-[560px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-[var(--color-border)] bg-[var(--color-surface-muted)] text-left">
                <th className="px-4 py-3 font-semibold text-[var(--color-ink)]">Name</th>
                <th className="px-4 py-3 font-semibold text-[var(--color-ink)]">Type</th>
                <th className="px-4 py-3 font-semibold text-[var(--color-ink)]">Source</th>
                <th className="px-4 py-3 font-semibold text-[var(--color-ink)]">Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((l) => (
                <tr key={l.id} className="border-b border-[var(--color-border)] last:border-0 hover:bg-[var(--color-surface-muted)]">
                  <td className="px-4 py-3"><Link to={`/admin/leads/${l.id}`} className="font-semibold text-[var(--color-primary)]">{l.name}</Link></td>
                  <td className="px-4 py-3 capitalize text-[var(--color-body)]">{l.lead_type}</td>
                  <td className="px-4 py-3 text-[var(--color-body)]">{l.source || '—'}</td>
                  <td className="px-4 py-3"><Pill status={l.status === 'converted' ? 'placed' : l.status === 'lost' ? 'rejected' : 'applied'} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
      {!loading && filtered.length === 0 && <p className="mt-4 text-sm text-[var(--color-muted)]">No leads match these filters.</p>}
    </Container>
  )
}
