import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { CATEGORIES } from '../../lib/constants'
import { loadCountries } from '../../lib/locations'
import { Container, Card, Pill, Input, Select, Button } from '../../components/ui'

const PAGE_SIZE = 20

export default function JobList() {
  const [jobs, setJobs] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [countryFilter, setCountryFilter] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)
  const [countries, setCountries] = useState([])

  useEffect(() => {
    supabase.from('job').select('*').order('created_at', { ascending: false }).then(({ data }) => {
      setJobs(data || [])
      setLoading(false)
    })
    loadCountries().then(setCountries)
  }, [])

  const filtered = jobs.filter((j) => {
    if (countryFilter && j.country !== countryFilter) return false
    if (categoryFilter && j.category !== categoryFilter) return false
    if (statusFilter && j.status !== statusFilter) return false
    if (search) {
      const term = search.toLowerCase()
      if (!j.title.toLowerCase().includes(term) && !j.city.toLowerCase().includes(term)) return false
    }
    return true
  })
  const visible = filtered.slice(0, visibleCount)

  function resetPage(setter) {
    return (value) => { setter(value); setVisibleCount(PAGE_SIZE) }
  }

  return (
    <Container narrow={false}>
      <div className="mb-5 flex items-center justify-between">
        <h2 className="text-xl font-bold text-[var(--color-ink)]">Jobs</h2>
        <Link
          to="/admin/jobs/new"
          className="rounded-xl bg-[var(--color-primary)] px-4 py-2 text-sm font-semibold text-white no-underline hover:bg-[var(--color-primary-dark)]"
        >
          + New job
        </Link>
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        <Input placeholder="Search title or city" value={search} onChange={(e) => resetPage(setSearch)(e.target.value)} className="max-w-[200px]" />
        <Select value={categoryFilter} onChange={(e) => resetPage(setCategoryFilter)(e.target.value)} className="max-w-[200px]">
          <option value="">All categories</option>
          {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </Select>
        <Select value={countryFilter} onChange={(e) => resetPage(setCountryFilter)(e.target.value)} className="max-w-[160px]">
          <option value="">All countries</option>
          {countries.map((c) => <option key={c.id} value={c.name}>{c.name}</option>)}
        </Select>
        <Select value={statusFilter} onChange={(e) => resetPage(setStatusFilter)(e.target.value)} className="max-w-[140px]">
          <option value="">All statuses</option>
          <option value="active">Active</option>
          <option value="paused">Paused</option>
          <option value="filled">Filled</option>
        </Select>
      </div>

      <p className="mb-3 text-sm text-[var(--color-muted)]">{filtered.length} of {jobs.length} jobs</p>

      {loading && <p className="text-sm text-[var(--color-muted)]">Loading...</p>}
      {!loading && (
        <Card className="overflow-x-auto p-0">
          <table className="w-full min-w-[640px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-[var(--color-border)] bg-[var(--color-surface-muted)] text-left">
                <th className="px-4 py-3 font-semibold text-[var(--color-ink)]">Title</th>
                <th className="px-4 py-3 font-semibold text-[var(--color-ink)]">Category</th>
                <th className="px-4 py-3 font-semibold text-[var(--color-ink)]">City</th>
                <th className="px-4 py-3 font-semibold text-[var(--color-ink)] tabular-nums">Slots</th>
                <th className="px-4 py-3 font-semibold text-[var(--color-ink)]">Status</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {visible.map((j) => (
                <tr key={j.id} className="border-b border-[var(--color-border)] last:border-0 hover:bg-[var(--color-surface-muted)]">
                  <td className="px-4 py-3 font-medium text-[var(--color-ink)]">{j.title}</td>
                  <td className="px-4 py-3 text-[var(--color-body)]">{j.category}</td>
                  <td className="px-4 py-3 text-[var(--color-body)]">{j.city}, {j.country}</td>
                  <td className="px-4 py-3 tabular-nums text-[var(--color-body)]">{j.slots_open}/{j.slots_total}</td>
                  <td className="px-4 py-3"><Pill status={j.status} /></td>
                  <td className="px-4 py-3"><Link to={`/admin/jobs/${j.id}/edit`} className="font-semibold text-[var(--color-primary)]">Edit</Link></td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      {visibleCount < filtered.length && (
        <Button variant="secondary" className="mt-4" onClick={() => setVisibleCount((v) => v + PAGE_SIZE)}>
          Load more ({filtered.length - visibleCount} more)
        </Button>
      )}
    </Container>
  )
}
