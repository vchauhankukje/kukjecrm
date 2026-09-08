import { useState } from 'react'
import { supabase } from '../../lib/supabase'
import { Container, PageHeader, Card, Field, Input, Button, ErrorText } from '../../components/ui'

function generateToken() {
  return Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2)
}

export default function ClientInvite() {
  const [companyName, setCompanyName] = useState('')
  const [industry, setIndustry] = useState('')
  const [city, setCity] = useState('')
  const [country, setCountry] = useState('')
  const [contactName, setContactName] = useState('')
  const [contactPhone, setContactPhone] = useState('')
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [inviteLink, setInviteLink] = useState(null)

  async function handleSubmit(e) {
    e.preventDefault()
    if (!companyName || !contactName) { setError('Enter company name and contact name.'); return }
    setLoading(true)
    setError('')
    const inviteToken = generateToken()
    const { error: dbError } = await supabase.from('client').insert({
      company_name: companyName,
      industry,
      city,
      country,
      contact_name: contactName,
      contact_phone: contactPhone,
      invited_email: email || null,
      invite_token: inviteToken,
    })
    setLoading(false)
    if (dbError) { setError(dbError.message); return }
    setInviteLink(`${window.location.origin}/client/onboard?token=${inviteToken}`)
  }

  if (inviteLink) {
    return (
      <Container>
        <PageHeader title="Client invited" subtitle="Send this link to complete onboarding" />
        <Card>
          <p className="mb-2 text-sm font-semibold text-[var(--color-ink)]">{companyName}</p>
          <p className="break-all rounded-lg bg-[var(--color-surface-muted)] p-3 font-mono text-sm text-[var(--color-primary)]">{inviteLink}</p>
        </Card>
      </Container>
    )
  }

  return (
    <Container>
      <PageHeader title="Invite a client" subtitle="They'll set their own login and see jobs/candidates you share" />
      <Card>
        <form onSubmit={handleSubmit}>
          <Field label="Company name"><Input value={companyName} onChange={(e) => setCompanyName(e.target.value)} /></Field>
          <Field label="Industry"><Input value={industry} onChange={(e) => setIndustry(e.target.value)} /></Field>
          <Field label="City"><Input value={city} onChange={(e) => setCity(e.target.value)} /></Field>
          <Field label="Country"><Input value={country} onChange={(e) => setCountry(e.target.value)} /></Field>
          <Field label="Contact name"><Input value={contactName} onChange={(e) => setContactName(e.target.value)} /></Field>
          <Field label="Contact phone"><Input value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} /></Field>
          <Field label="Email" hint="Optional — pre-fills their onboarding form">
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </Field>
          <ErrorText>{error}</ErrorText>
          <Button type="submit" disabled={loading} className="w-full">{loading ? 'Creating...' : 'Create invite'}</Button>
        </form>
      </Card>
    </Container>
  )
}
