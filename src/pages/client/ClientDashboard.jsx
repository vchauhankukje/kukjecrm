import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { Container, PageHeader, Card, Button, Textarea, Pill } from '../../components/ui'

export default function ClientDashboard() {
  const [client, setClient] = useState(null)
  const [jobs, setJobs] = useState([])
  const [applicationsByJob, setApplicationsByJob] = useState({})
  const [loading, setLoading] = useState(true)
  const [drafts, setDrafts] = useState({}) // applicationId -> { rating, feedback }

  async function load() {
    const { data: userData } = await supabase.auth.getUser()
    const { data: clientRow } = await supabase.from('client').select('*').eq('auth_user_id', userData.user.id).maybeSingle()
    setClient(clientRow)
    if (!clientRow) { setLoading(false); return }

    const { data: jobRows } = await supabase.from('job').select('*').eq('client_id', clientRow.id).order('created_at', { ascending: false })
    setJobs(jobRows || [])

    const grouped = {}
    for (const job of jobRows || []) {
      const { data: apps } = await supabase
        .from('application')
        .select('*, candidate(name, city, job_categories, phone)')
        .eq('job_id', job.id)
        .eq('client_visible', true)
      grouped[job.id] = apps || []
    }
    setApplicationsByJob(grouped)
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  function updateDraft(appId, field, value) {
    setDrafts((prev) => ({ ...prev, [appId]: { ...prev[appId], [field]: value } }))
  }

  async function submitFeedback(appId) {
    const draft = drafts[appId] || {}
    await supabase.from('application').update({ client_rating: draft.rating ?? null, client_feedback: draft.feedback ?? null }).eq('id', appId)
    load()
  }

  if (loading) return <p className="p-8 text-center text-sm text-[var(--color-muted)]">Loading...</p>
  if (!client) return <p className="p-8 text-center text-sm text-[var(--color-muted)]">No client profile linked to this login.</p>

  return (
    <Container narrow={false}>
      <PageHeader title={client.company_name} subtitle="Your jobs and shared candidates" />

      {jobs.length === 0 && <Card className="text-center text-[var(--color-muted)]">No jobs yet — your recruiter will assign jobs to your account.</Card>}

      <div className="space-y-4">
        {jobs.map((job) => (
          <Card key={job.id}>
            <h4 className="mb-1 font-display font-bold text-[var(--color-ink)]">{job.title}</h4>
            <p className="mb-3 text-sm text-[var(--color-muted)]">{job.city}, {job.country} · {job.slots_open}/{job.slots_total} slots</p>

            {(applicationsByJob[job.id] || []).length === 0 && (
              <p className="text-sm text-[var(--color-muted)]">No candidates shared with you yet for this job.</p>
            )}

            <div className="space-y-3">
              {(applicationsByJob[job.id] || []).map((app) => (
                <div key={app.id} className="rounded-lg border border-[var(--color-border)] p-3">
                  <div className="mb-2 flex items-center justify-between">
                    <p className="text-sm font-semibold text-[var(--color-ink)]">{app.candidate?.name}</p>
                    <Pill status={app.status} />
                  </div>
                  <p className="mb-2 text-xs text-[var(--color-muted)]">{app.candidate?.city} · {(app.candidate?.job_categories || []).join(', ')}</p>

                  <label className="mb-1 block text-xs font-semibold text-[var(--color-ink)]">Rating (1-5)</label>
                  <input
                    type="number" min="1" max="5"
                    defaultValue={app.client_rating || ''}
                    onChange={(e) => updateDraft(app.id, 'rating', Number(e.target.value))}
                    className="mb-2 w-20 rounded-lg border border-[var(--color-border)] px-2 py-1 text-sm"
                  />
                  <Textarea rows={2} defaultValue={app.client_feedback || ''} onChange={(e) => updateDraft(app.id, 'feedback', e.target.value)} placeholder="Feedback..." />
                  <Button variant="secondary" className="mt-2" onClick={() => submitFeedback(app.id)}>Save feedback</Button>
                </div>
              ))}
            </div>
          </Card>
        ))}
      </div>

      <Button variant="secondary" onClick={() => supabase.auth.signOut()} className="mt-5 w-full">Log out</Button>
    </Container>
  )
}
