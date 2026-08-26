import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { Container, Card, Textarea, Button, Pill, Field, Input, Select, Chip, ErrorText, Lookup, PathBar } from '../../components/ui'
import { CATEGORIES } from '../../lib/constants'

const PATH_STAGES = ['applied', 'shortlisted', 'interview', 'placed']
const TABS = ['Details', 'Applications', 'Notes', 'Calls']

export default function CandidateDetail() {
  const { id } = useParams()
  const [candidate, setCandidate] = useState(null)
  const [partners, setPartners] = useState([])
  const [primaryApp, setPrimaryApp] = useState(null)
  const [applications, setApplications] = useState([])
  const [notes, setNotes] = useState([])
  const [newNote, setNewNote] = useState('')
  const [callLogs, setCallLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('Details')

  const [editName, setEditName] = useState('')
  const [editCity, setEditCity] = useState('')
  const [editCategories, setEditCategories] = useState([])
  const [editAvailability, setEditAvailability] = useState('')
  const [editPreferredLocation, setEditPreferredLocation] = useState('')
  const [editContractType, setEditContractType] = useState('')
  const [editReferralCode, setEditReferralCode] = useState(null)
  const [savingProfile, setSavingProfile] = useState(false)
  const [profileError, setProfileError] = useState('')
  const [profileSaved, setProfileSaved] = useState(false)

  async function load() {
    const { data: c } = await supabase.from('candidate').select('*').eq('id', id).single()
    setCandidate(c)
    if (c) {
      setEditName(c.name || '')
      setEditCity(c.city || '')
      setEditCategories(c.job_categories || [])
      setEditAvailability(c.availability || '')
      setEditPreferredLocation(c.preferred_location || '')
      setEditContractType(c.contract_type || '')
      setEditReferralCode(c.referral_code || null)
    }

    const { data: partnerRows } = await supabase.from('partner').select('referral_code, business_name')
    setPartners(partnerRows || [])

    const { data: apps } = await supabase
      .from('application')
      .select('*, job(title, city, country)')
      .eq('candidate_id', id)
      .order('status_updated_at', { ascending: false })
    setApplications(apps || [])
    setPrimaryApp(apps && apps.length > 0 ? apps[0] : null)

    const { data: n } = await supabase.from('note').select('*').eq('candidate_id', id).order('created_at', { ascending: false })
    setNotes(n || [])

    const { data: calls } = await supabase.from('call_log').select('*').eq('candidate_id', id).order('created_at', { ascending: false })
    setCallLogs(calls || [])

    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [id])

  async function changeStatus(status) {
    if (primaryApp) {
      await supabase.from('application').update({ status, status_updated_at: new Date().toISOString() }).eq('id', primaryApp.id)
    } else {
      await supabase.from('application').insert({ candidate_id: id, job_id: null, status })
    }
    load()
  }

  function toggleEditCategory(category) {
    setEditCategories((prev) =>
      prev.includes(category) ? prev.filter((c) => c !== category) : [...prev, category]
    )
  }

  async function saveProfile() {
    setSavingProfile(true)
    setProfileError('')
    setProfileSaved(false)
    const { error: dbError } = await supabase
      .from('candidate')
      .update({
        name: editName,
        city: editCity,
        job_categories: editCategories,
        availability: editAvailability,
        preferred_location: editPreferredLocation,
        contract_type: editContractType,
        referral_code: editReferralCode,
      })
      .eq('id', id)
    setSavingProfile(false)
    if (dbError) {
      setProfileError(dbError.message)
      return
    }
    setProfileSaved(true)
    load()
  }

  async function addNote() {
    if (!newNote.trim()) return
    const { data: userData } = await supabase.auth.getUser()
    await supabase.from('note').insert({ candidate_id: id, recruiter_id: userData.user.id, body: newNote })
    setNewNote('')
    load()
  }

  async function logCall(outcome) {
    const { data: userData } = await supabase.auth.getUser()
    await supabase.from('call_log').insert({ candidate_id: id, recruiter_id: userData.user.id, outcome })
    load()
  }

  if (loading) return <p className="p-8 text-center text-sm text-[var(--color-muted)]">Loading...</p>
  if (!candidate) return <p className="p-8 text-center text-sm text-[var(--color-muted)]">Candidate not found.</p>

  const referredByName = candidate.referral_code
    ? partners.find((p) => p.referral_code === candidate.referral_code)?.business_name || candidate.referral_code
    : 'Direct signup'

  return (
    <Container narrow={false}>
      {/* Highlights panel */}
      <Card className="mb-4">
        <div className="mb-1 flex items-start justify-between gap-2">
          <div>
            <h2 className="text-xl font-bold text-[var(--color-ink)]">{candidate.name}</h2>
            {candidate.candidate_code && (
              <p className="font-mono text-xs font-semibold text-[var(--color-primary)]">{candidate.candidate_code}</p>
            )}
          </div>
          {primaryApp && <Pill status={primaryApp.status} />}
        </div>
        <p className="mb-3 text-sm text-[var(--color-body)]">
          {candidate.phone} · {candidate.city} · {referredByName}
        </p>

        <PathBar
          stages={PATH_STAGES}
          current={primaryApp?.status}
          onSelect={changeStatus}
          closedLabel="rejected"
          closedActive={primaryApp?.status === 'rejected'}
        />

        <a
          href={`tel:${candidate.phone}`}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--color-success)] px-4 py-2.5 text-sm font-semibold text-white no-underline"
        >
          Call {candidate.name}
        </a>
      </Card>

      {/* Tabs */}
      <div className="mb-4 flex gap-1 border-b border-[var(--color-border)]">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm font-semibold ${
              activeTab === tab
                ? 'border-b-2 border-[var(--color-primary)] text-[var(--color-primary)]'
                : 'text-[var(--color-muted)] hover:text-[var(--color-ink)]'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab === 'Details' && (
        <Card>
          {candidate.voice_note_url && <audio controls src={candidate.voice_note_url} className="mb-4 w-full" />}

          <Field label="Name">
            <Input value={editName} onChange={(e) => setEditName(e.target.value)} />
          </Field>
          <Field label="City">
            <Input value={editCity} onChange={(e) => setEditCity(e.target.value)} />
          </Field>

          <p className="mb-1.5 text-sm font-semibold text-[var(--color-ink)]">Job categories</p>
          <div className="mb-4 flex flex-wrap gap-2">
            {CATEGORIES.map((category) => (
              <Chip key={category} selected={editCategories.includes(category)} onClick={() => toggleEditCategory(category)}>
                {category}
              </Chip>
            ))}
          </div>

          <Field label="Available from">
            <Select value={editAvailability} onChange={(e) => setEditAvailability(e.target.value)}>
              <option value="">—</option>
              <option value="immediate">Immediate</option>
              <option value="2_weeks">2 weeks</option>
              <option value="1_month_plus">1 month+</option>
            </Select>
          </Field>
          <Field label="Preferred country/city">
            <Input value={editPreferredLocation} onChange={(e) => setEditPreferredLocation(e.target.value)} />
          </Field>
          <Field label="Contract type">
            <Select value={editContractType} onChange={(e) => setEditContractType(e.target.value)}>
              <option value="">—</option>
              <option value="full_time">Full-time</option>
              <option value="part_time">Part-time</option>
              <option value="either">Either</option>
            </Select>
          </Field>
          <Field label="Referred by (Partner/Agent)">
            <Lookup
              options={partners}
              value={editReferralCode}
              onChange={setEditReferralCode}
              getLabel={(p) => p.business_name}
              getValue={(p) => p.referral_code}
              placeholder="Search partner/agent..."
            />
          </Field>

          <ErrorText>{profileError}</ErrorText>
          {profileSaved && <p className="mb-3 text-sm font-medium text-[var(--color-success)]">Profile updated.</p>}
          <Button onClick={saveProfile} disabled={savingProfile}>{savingProfile ? 'Saving...' : 'Save profile'}</Button>
        </Card>
      )}

      {activeTab === 'Applications' && (
        <Card>
          {applications.length === 0 && <p className="text-sm text-[var(--color-muted)]">No applications yet.</p>}
          <div className="space-y-3">
            {applications.map((a) => (
              <div key={a.id} className="flex items-center justify-between border-b border-[var(--color-border)] pb-3 last:border-0 last:pb-0">
                <div>
                  <p className="text-sm font-semibold text-[var(--color-ink)]">{a.job?.title || 'General application'}</p>
                  {a.job && <p className="text-xs text-[var(--color-muted)]">{a.job.city}, {a.job.country}</p>}
                </div>
                <Pill status={a.status} />
              </div>
            ))}
          </div>
        </Card>
      )}

      {activeTab === 'Notes' && (
        <Card>
          <Textarea rows={3} value={newNote} onChange={(e) => setNewNote(e.target.value)} placeholder="Add a note..." />
          <Button onClick={addNote} className="mt-2">Add note</Button>
          <div className="mt-4 space-y-3 border-t border-[var(--color-border)] pt-3">
            {notes.length === 0 && <p className="text-sm text-[var(--color-muted)]">No notes yet.</p>}
            {notes.map((n) => (
              <div key={n.id}>
                <p className="text-sm text-[var(--color-ink)]">{n.body}</p>
                <p className="text-xs text-[var(--color-muted)]">{new Date(n.created_at).toLocaleString()}</p>
              </div>
            ))}
          </div>
        </Card>
      )}

      {activeTab === 'Calls' && (
        <Card>
          <div className="mb-3 flex flex-wrap gap-2">
            <Button variant="secondary" onClick={() => logCall('connected')}>Log: Connected</Button>
            <Button variant="secondary" onClick={() => logCall('no_answer')}>Log: No answer</Button>
            <Button variant="secondary" onClick={() => logCall('voicemail')}>Log: Voicemail</Button>
          </div>
          {callLogs.length === 0 && <p className="text-sm text-[var(--color-muted)]">No calls logged yet.</p>}
          {callLogs.map((c) => (
            <p key={c.id} className="text-sm text-[var(--color-body)]">
              {new Date(c.created_at).toLocaleString()} — <span className="capitalize">{c.outcome.replace('_', ' ')}</span>
            </p>
          ))}
        </Card>
      )}
    </Container>
  )
}
