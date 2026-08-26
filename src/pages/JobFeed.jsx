import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useNavigate } from 'react-router-dom'
import { Container, PageHeader, Card, Button, Select, Input, ErrorText, BackLink } from '../components/ui'

const PAGE_SIZE = 10

export default function JobFeed() {
  const navigate = useNavigate()
  const [jobs, setJobs] = useState([])
  const [appliedIds, setAppliedIds] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [countryFilter, setCountryFilter] = useState('')
  const [search, setSearch] = useState('')
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)
  const candidateId = localStorage.getItem('candidateId')
  const categories = JSON.parse(localStorage.getItem('candidateCategories') || '[]')

  useEffect(() => {
    async function load() {
      const { data, error: jobErr } = await supabase
        .from('job')
        .select('*')
        .eq('status', 'active')
        .in('category', categories.length ? categories : ['__none__'])
        .order('created_at', { ascending: false })
      if (jobErr) setError(jobErr.message)
      setJobs(data || [])

      if (candidateId) {
        const { data: apps } = await supabase.from('application').select('job_id').eq('candidate_id', candidateId)
        setAppliedIds((apps || []).map((a) => a.job_id))
      }
      setLoading(false)
    }
    load()
  }, [])

  async function apply(jobId) {
    if (!candidateId) {
      setError('Session lost — please sign up again.')
      return
    }
    const { error: appErr } = await supabase.from('application').insert({ candidate_id: candidateId, job_id: jobId })
    if (appErr) {
      setError(appErr.message)
      return
    }
    setAppliedIds((prev) => [...prev, jobId])
  }

  const filtered = jobs.filter((job) => {
    if (countryFilter && job.country !== countryFilter) return false
    if (search) {
      const term = search.toLowerCase()
      if (!job.title.toLowerCase().includes(term) && !job.city.toLowerCase().includes(term)) return false
    }
    return true
  })
  const visible = filtered.slice(0, visibleCount)
  const countriesInResults = [...new Set(jobs.map((j) => j.country))].sort()

  return (
    <Container>
      <PageHeader title="Jobs for you" subtitle={`${filtered.length} open roles matched to your categories`} />

      <div className="mb-4 flex items-center justify-center gap-4 text-sm font-semibold">
        <button onClick={() => navigate('/availability')} className="text-[var(--color-muted)] hover:text-[var(--color-primary)]">
          ← Edit availability
        </button>
        <a href="/status" className="text-[var(--color-primary)]">My status</a>
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        <Input
          placeholder="Search title or city"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setVisibleCount(PAGE_SIZE) }}
          className="flex-1 min-w-[140px]"
        />
        <Select
          value={countryFilter}
          onChange={(e) => { setCountryFilter(e.target.value); setVisibleCount(PAGE_SIZE) }}
          className="max-w-[160px]"
        >
          <option value="">All countries</option>
          {countriesInResults.map((c) => <option key={c} value={c}>{c}</option>)}
        </Select>
      </div>

      {loading && <p className="text-center text-sm text-[var(--color-muted)]">Loading...</p>}
      <ErrorText>{error}</ErrorText>
      {!loading && filtered.length === 0 && (
        <Card className="text-center text-[var(--color-muted)]">No open jobs match right now. Check back soon.</Card>
      )}

      <div className="space-y-3">
        {visible.map((job) => {
          const isApplied = appliedIds.includes(job.id)
          return (
            <Card key={job.id}>
              <div className="mb-2 flex items-start justify-between gap-2">
                <h4 className="font-display text-base font-bold text-[var(--color-ink)]">{job.title}</h4>
                <span className="whitespace-nowrap rounded-full bg-[var(--color-accent-tint)] px-2.5 py-0.5 text-xs font-semibold text-[var(--color-accent)]">
                  {job.slots_open}/{job.slots_total} slots
                </span>
              </div>
              <p className="mb-0.5 text-sm text-[var(--color-body)]">{job.city}, {job.country}</p>
              <p className="mb-4 text-sm font-semibold text-[var(--color-ink)]">{job.pay_range}</p>
              <Button
                onClick={() => apply(job.id)}
                disabled={isApplied}
                variant={isApplied ? 'secondary' : 'primary'}
                className="w-full"
              >
                {isApplied ? 'Applied ✓' : 'Apply'}
              </Button>
            </Card>
          )
        })}
      </div>

      {visibleCount < filtered.length && (
        <Button variant="secondary" className="mt-4 w-full" onClick={() => setVisibleCount((v) => v + PAGE_SIZE)}>
          Load more ({filtered.length - visibleCount} more)
        </Button>
      )}
    </Container>
  )
}
