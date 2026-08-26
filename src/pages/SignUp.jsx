import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { sendCode, verifyCode } from '../lib/mockOtp'
import { generateCandidateCode } from '../lib/constants'
import { Container, PageHeader, Card, Field, Input, Button, ErrorText, ProgressSteps, BackLink } from '../components/ui'

export default function SignUp() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [step, setStep] = useState('form') // 'form' | 'code' | 'idReveal'
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [city, setCity] = useState('')
  const [referralCode, setReferralCode] = useState(searchParams.get('ref') || '')
  const [displayedCode, setDisplayedCode] = useState('')
  const [enteredCode, setEnteredCode] = useState('')
  const [newCandidateCode, setNewCandidateCode] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  function handleSendCode(e) {
    e.preventDefault()
    if (!name || !phone || !city) {
      setError('Please fill in all fields.')
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

    const { data: existing } = await supabase.from('candidate').select('*').eq('phone', phone).maybeSingle()
    if (existing) {
      setLoading(false)
      localStorage.setItem('candidateId', existing.id)
      localStorage.setItem('candidateCategories', JSON.stringify(existing.job_categories || []))
      localStorage.setItem('candidateCode', existing.candidate_code || '')
      navigate('/status?welcome=1')
      return
    }

    const candidateCode = generateCandidateCode()
    const { data, error: dbError } = await supabase
      .from('candidate')
      .insert({
        name,
        phone,
        city,
        auth_verified: true,
        referral_code: referralCode ? referralCode.trim().toUpperCase() : null,
        candidate_code: candidateCode,
      })
      .select()
      .single()
    setLoading(false)
    if (dbError) {
      setError(dbError.message)
      return
    }
    localStorage.setItem('candidateId', data.id)
    localStorage.setItem('candidateCode', data.candidate_code)
    setNewCandidateCode(data.candidate_code)
    setStep('idReveal')
  }

  return (
    <Container>
      <ProgressSteps step={1} total={5} />
      <PageHeader title="Find work abroad" subtitle="Sign up in under a minute" />
      <Card>
        {step === 'form' && (
          <form onSubmit={handleSendCode}>
            <Field label="Full name">
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Ana Popescu" />
            </Field>
            <Field label="Phone number">
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+40 700 000 000" />
            </Field>
            <Field label="City">
              <Input value={city} onChange={(e) => setCity(e.target.value)} placeholder="e.g. Bucharest" />
            </Field>
            <Field label="Referral code (optional)">
              <Input value={referralCode} onChange={(e) => setReferralCode(e.target.value)} placeholder="e.g. AB12CD" />
            </Field>
            <ErrorText>{error}</ErrorText>
            <Button type="submit" className="w-full">Send verification code</Button>
          </form>
        )}

        {step === 'code' && (
          <form onSubmit={handleVerify}>
            <BackLink onClick={() => setStep('form')} label="Edit details" />
            <div className="mb-4 rounded-xl bg-[var(--color-warning-tint)] px-4 py-3 text-sm text-[var(--color-ink)]">
              <span className="font-semibold">Test mode</span> — no real SMS sent. Your code is{' '}
              <span className="font-mono font-bold">{displayedCode}</span>
            </div>
            <Field label="Enter the code">
              <Input value={enteredCode} onChange={(e) => setEnteredCode(e.target.value)} placeholder="6-digit code" />
            </Field>
            <ErrorText>{error}</ErrorText>
            <Button type="submit" disabled={loading} className="w-full">
              {loading ? 'Verifying...' : 'Verify and continue'}
            </Button>
          </form>
        )}

        {step === 'idReveal' && (
          <div className="text-center">
            <p className="mb-2 text-sm text-[var(--color-muted)]">You're verified! Your Candidate ID is</p>
            <p className="mb-4 font-mono text-2xl font-bold tracking-widest text-[var(--color-primary)]">{newCandidateCode}</p>
            <p className="mb-5 text-sm text-[var(--color-body)]">
              Save this — quote it if you contact support, or use it to look up your status faster.
            </p>
            <Button className="w-full" onClick={() => navigate('/categories')}>Continue</Button>
          </div>
        )}
      </Card>

      {step === 'form' && (
        <p className="mt-4 text-center text-sm text-[var(--color-muted)]">
          Already signed up?{' '}
          <a href="/status" className="font-semibold text-[var(--color-primary)]">Check your status</a>
        </p>
      )}
    </Container>
  )
}
