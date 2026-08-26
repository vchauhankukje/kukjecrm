import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { sendCode, verifyCode } from '../lib/mockOtp'
import { Container, PageHeader, Card, Field, Input, Button, ErrorText, Pill } from '../components/ui'

export default function CheckStatus() {
  const [searchParams] = useSearchParams()
  const [step, setStep] = useState('phone') // 'phone' | 'code' | 'result'
  const [phone, setPhone] = useState('')
  const [displayedCode, setDisplayedCode] = useState('')
  const [enteredCode, setEnteredCode] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [candidate, setCandidate] = useState(null)
  const [applications, setApplications] = useState([])
  const [showWelcomeBanner, setShowWelcomeBanner] = useState(false)

  async function loadCandidateAndApplications(candidateRow) {
    const { data: apps } = await supabase
      .from('application')
      .select('*, job(title, city, country)')
      .eq('candidate_id', candidateRow.id)
      .order('status_updated_at', { ascending: false })

    localStorage.setItem('candidateId', candidateRow.id)
    localStorage.setItem('candidateCategories', JSON.stringify(candidateRow.job_categories || []))
    setCandidate(candidateRow)
    setApplications(apps || [])
    setStep('result')
  }

  useEffect(() => {
    async function loadFromExistingSession() {
      const candidateId = localStorage.getItem('candidateId')
      if (!candidateId) return
      setLoading(true)
      const { data: found } = await supabase.from('candidate').select('*').eq('id', candidateId).maybeSingle()
      if (found) {
        if (searchParams.get('welcome') === '1') setShowWelcomeBanner(true)
        await loadCandidateAndApplications(found)
      }
      setLoading(false)
    }
    loadFromExistingSession()
  }, [])

  function handleSendCode(e) {
    e.preventDefault()
    if (!phone) {
      setError('Enter your phone number.')
      return
    }
    setError('')
    const code = sendCode(phone)
    setDisplayedCode(code)
    setStep('code')
  }

  async function handleVerify(e) {
    e.preventDefault()
    if (!verifyCode(phone, enteredCode)) {
      setError('Incorrect code, try again.')
      return
    }
    setLoading(true)
    setError('')

    const { data: found } = await supabase.from('candidate').select('*').eq('phone', phone).maybeSingle()
    if (!found) {
      setLoading(false)
      setError('No profile found with that phone number.')
      return
    }

    await loadCandidateAndApplications(found)
    setLoading(false)
  }

  return (
    <Container>
      <PageHeader title="Check your status" subtitle="See your profile and job applications" />

      {loading && step !== 'result' && <p className="text-center text-sm text-[var(--color-muted)]">Loading...</p>}

      {!loading && step === 'phone' && (
        <Card>
          <form onSubmit={handleSendCode}>
            <Field label="Phone number">
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+40 700 000 000" />
            </Field>
            <ErrorText>{error}</ErrorText>
            <Button type="submit" className="w-full">Send verification code</Button>
          </form>
        </Card>
      )}

      {step === 'code' && (
        <Card>
          <form onSubmit={handleVerify}>
            <div className="mb-4 rounded-xl bg-[var(--color-warning-tint)] px-4 py-3 text-sm text-[var(--color-ink)]">
              <span className="font-semibold">Test mode</span> — no real SMS sent. Your code is{' '}
              <span className="font-mono font-bold">{displayedCode}</span>
            </div>
            <Field label="Enter the code">
              <Input value={enteredCode} onChange={(e) => setEnteredCode(e.target.value)} placeholder="6-digit code" />
            </Field>
            <ErrorText>{error}</ErrorText>
            <Button type="submit" disabled={loading} className="w-full">
              {loading ? 'Checking...' : 'Verify and view status'}
            </Button>
          </form>
        </Card>
      )}

      {step === 'result' && candidate && (
        <div className="space-y-4">
          {showWelcomeBanner && (
            <div className="rounded-xl bg-[var(--color-primary-tint)] px-4 py-3 text-sm font-medium text-[var(--color-primary)]">
              This phone number is already registered — showing your existing profile below.
            </div>
          )}

          <Card>
            <h4 className="mb-2 font-display font-bold text-[var(--color-ink)]">Your profile</h4>
            {candidate.candidate_code && (
              <p className="mb-2 font-mono text-sm font-bold text-[var(--color-primary)]">{candidate.candidate_code}</p>
            )}
            <p className="text-sm text-[var(--color-body)]">{candidate.name} · {candidate.city}</p>
            <p className="text-sm text-[var(--color-muted)]">{(candidate.job_categories || []).join(', ') || 'No categories selected'}</p>
            {candidate.availability && (
              <p className="mt-1 text-sm text-[var(--color-muted)]">
                Available: {candidate.availability.replace('_', ' ')} · {candidate.contract_type?.replace('_', ' ')} · {candidate.preferred_location}
              </p>
            )}
          </Card>

          <Card>
            <h4 className="mb-3 font-display font-bold text-[var(--color-ink)]">Your applications</h4>
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

          <Button variant="secondary" className="w-full" onClick={() => (window.location.href = '/jobs')}>
            Browse more jobs
          </Button>
        </div>
      )}
    </Container>
  )
}
