import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { Container, Card, Select, Input, Pill } from '../../components/ui'
import { CATEGORIES } from '../../lib/constants'

const STATUSES = ['applied', 'shortlisted', 'interview', 'placed', 'rejected']

export default function CandidateList() {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [categoryFilter, setCategoryFilter] = useState('')
  const [idFilter, setIdFilter] = useState('')
  const [cityFilter, setCityFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [partnerFilter, setPartnerFilter] = useState('') // '' = all, 'direct' = no referral, or a referral_code
  const [partners, setPartners] = useState([])

  useEffect(() => {
    async function load() {
      const { data: candidates } = await supabase.from('candidate').select('*').order('created_at', { ascending: false })
      const { data: applications } = await supabase
        .from('application')
        .select('*')
        .order('status_updated_at', { ascending: false })
      const { data: partnerRows } = await supabase.from('partner').select('referral_code, business_name')
      setPartners(partnerRows || [])

      const latestStatusByCandidate = {}
      for (const app of applications || []) {
        if (!latestStatusByCandidate[app.candidate_id]) latestStatusByCandidate[app.candidate_id] = app.status
      }
      const partnerNameByCode = {}
      for (const p of partnerRows || []) partnerNameByCode[p.referral_code] = p.business_name

      setRows(
        (candidates || []).map((c) => ({
          ...c,
          status: latestStatusByCandidate[c.id] || 'applied',
          referredBy: c.referral_code ? partnerNameByCode[c.referral_code] || c.referral_code : null,
        }))
      )
      setLoading(false)
    }
    load()
  }, [])

  const filtered = rows.filter((r) => {
    if (idFilter && !r.candidate_code?.toLowerCase().includes(idFilter.toLowerCase().replace(/^kj-?/, ''))) return false
    if (categoryFilter && !(r.job_categories || []).includes(categoryFilter)) return false
    if (cityFilter && !r.city?.toLowerCase().includes(cityFilter.toLowerCase())) return false
    if (statusFilter && r.status !== statusFilter) return false
    if (partnerFilter === 'direct' && r.referral_code) return false
    if (partnerFilter && partnerFilter !== 'direct' && r.referral_code !== partnerFilter) return false
    return true
  })

  return (
    <Container narrow={false}>
      <div className="mb-5 flex items-center justify-between">
        <h2 className="text-xl font-bold text-[var(--color-ink)]">Candidates</h2>
        <span className="text-sm text-[var(--color-muted)]">{filtered.length} of {rows.length}</span>
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        <Input placeholder="Search Candidate ID" value={idFilter} onChange={(e) => setIdFilter(e.target.value)} className="max-w-[160px] font-mono" />
        <Input placeholder="Filter by city" value={cityFilter} onChange={(e) => setCityFilter(e.target.value)} className="max-w-[180px]" />
        <Select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="max-w-[200px]">
          <option value="">All categories</option>
          {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </Select>
        <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="max-w-[160px]">
          <option value="">All statuses</option>
          {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
        </Select>
        <Select value={partnerFilter} onChange={(e) => setPartnerFilter(e.target.value)} className="max-w-[200px]">
          <option value="">All sources</option>
          <option value="direct">Direct only</option>
          {partners.map((p) => (
            <option key={p.referral_code} value={p.referral_code}>{p.business_name}</option>
          ))}
        </Select>
      </div>

      {loading && <p className="text-sm text-[var(--color-muted)]">Loading...</p>}

      {!loading && (
        <Card className="overflow-x-auto p-0">
          <table className="w-full min-w-[560px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-[var(--color-border)] bg-[var(--color-surface-muted)] text-left">
                <th className="px-4 py-3 font-semibold text-[var(--color-ink)]">ID</th>
                <th className="px-4 py-3 font-semibold text-[var(--color-ink)]">Name</th>
                <th className="px-4 py-3 font-semibold text-[var(--color-ink)]">Category</th>
                <th className="px-4 py-3 font-semibold text-[var(--color-ink)]">City</th>
                <th className="px-4 py-3 font-semibold text-[var(--color-ink)]">Referred by</th>
                <th className="px-4 py-3 font-semibold text-[var(--color-ink)]">Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
                <tr key={r.id} className="border-b border-[var(--color-border)] last:border-0 hover:bg-[var(--color-surface-muted)]">
                  <td className="px-4 py-3 font-mono text-xs text-[var(--color-muted)]">{r.candidate_code || '—'}</td>
                  <td className="px-4 py-3">
                    <Link to={`/admin/candidates/${r.id}`} className="font-semibold text-[var(--color-primary)]">{r.name}</Link>
                  </td>
                  <td className="px-4 py-3 text-[var(--color-body)]">{(r.job_categories || []).join(', ')}</td>
                  <td className="px-4 py-3 text-[var(--color-body)]">{r.city}</td>
                  <td className="px-4 py-3 text-[var(--color-body)]">{r.referredBy || <span className="text-[var(--color-muted)]">Direct</span>}</td>
                  <td className="px-4 py-3"><Pill status={r.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
      {!loading && filtered.length === 0 && <p className="mt-4 text-sm text-[var(--color-muted)]">No candidates match these filters.</p>}
    </Container>
  )
}
