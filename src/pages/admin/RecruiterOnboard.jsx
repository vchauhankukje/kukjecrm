import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { Container, PageHeader, Card, Field, Input, Button, ErrorText } from '../../components/ui'

export default function RecruiterOnboard() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')
  const [recruiter, setRecruiter] = useState(null)
  const [checking, setChecking] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    async function check() {
      if (!token) { setChecking(false); return }
      const { data } = await supabase.from('recruiter').select('*').eq('invite_token', token).is('user_id', null).maybeSingle()
      setRecruiter(data)
      if (data?.email) setEmail(data.email)
      setChecking(false)
    }
    check()
  }, [token])

  async function handleSubmit(e) {
    e.preventDefault()
    if (!email || !password) { setError('Enter an email and password.'); return }
    setLoading(true)
    setError('')
    const { data: authData, error: authError } = await supabase.auth.signUp({ email, password })
    if (authError) { setLoading(false); setError(authError.message); return }
    const { error: dbError } = await supabase.from('recruiter').update({ user_id: authData.user?.id, invite_token: null }).eq('id', recruiter.id)
    setLoading(false)
    if (dbError) { setError(dbError.message); return }
    navigate('/admin')
  }

  if (checking) return <p className="p-8 text-center text-sm text-[var(--color-muted)]">Checking invite...</p>

  if (!recruiter) {
    return (
      <Container>
        <PageHeader title="Invite not found" subtitle="This link is invalid or has already been used" />
        <p className="text-center text-sm text-[var(--color-muted)]">
          Already onboarded? <a href="/admin/login" className="font-semibold text-[var(--color-primary)]">Log in here</a>.
        </p>
      </Container>
    )
  }

  return (
    <Container>
      <PageHeader title="Complete your recruiter account" subtitle={`Setting up access for ${recruiter.name}`} />
      <Card>
        <form onSubmit={handleSubmit}>
          <Field label="Email" hint="Used to log in to the admin panel">
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </Field>
          <Field label="Password">
            <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
          </Field>
          <ErrorText>{error}</ErrorText>
          <Button type="submit" disabled={loading} className="w-full">{loading ? 'Setting up...' : 'Activate my account'}</Button>
        </form>
      </Card>
    </Container>
  )
}
