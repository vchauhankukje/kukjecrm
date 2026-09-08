import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { Container, PageHeader, Card, Field, Input, Button, ErrorText, Pill } from '../../components/ui'

function generateToken() {
  return Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2)
}

export default function ClientDetail() {
  const { id } = useParams()
  const [client, setClient] = useState(null)
  const [loading, setLoading] = useState(true)
  const [companyName, setCompanyName] = useState('')
  const [contactName, setContactName] = useState('')
  const [contactPhone, setContactPhone] = useState('')
  const [invitedEmail, setInvitedEmail] = useState('')
  const [city, setCity] = useState('')
  const [country, setCountry] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)
  const [regenerating, setRegenerating] = useState(false)

  async function load() {
    const { data } = await supabase.from('client').select('*').eq('id', id).single()
    setClient(data)
    if (data) {
      setCompanyName(data.company_name || '')
      setContactName(data.contact_name || '')
      setContactPhone(data.contact_phone || '')
      setInvitedEmail(data.invited_email || '')
      setCity(data.city || '')
      setCountry(data.country || '')
    }
    setLoading(false)
  }

  useEffect(() => { load() }, [id])

  async function save() {
    setSaving(true)
    setError('')
    setSaved(false)
    const { error: dbError } = await supabase
      .from('client')
      .update({ company_name: companyName, contact_name: contactName, contact_phone: contactPhone, invited_email: invitedEmail || null, city, country })
      .eq('id', id)
    setSaving(false)
    if (dbError) { setError(dbError.message); return }
    setSaved(true)
    load()
  }

  async function regenerateInviteLink() {
    setRegenerating(true)
    const inviteToken = generateToken()
    await supabase.from('client').update({ invite_token: inviteToken }).eq('id', id)
    setRegenerating(false)
    load()
  }

  if (loading) return <p className="p-8 text-center text-sm text-[var(--color-muted)]">Loading...</p>
  if (!client) return <p className="p-8 text-center text-sm text-[var(--color-muted)]">Client not found.</p>

  return (
    <Container>
      <PageHeader title={client.company_name} />

      <Card className="mb-4">
        <div className="flex items-center justify-between">
          <span className="text-sm text-[var(--color-muted)]">Onboarding status</span>
          <div className="flex items-center gap-2">
            {client.auth_user_id ? <Pill status="placed" /> : <Pill status="applied" />}
            <span className="text-sm font-medium text-[var(--color-ink)]">{client.auth_user_id ? 'Active' : 'Invited (not yet activated)'}</span>
          </div>
        </div>
        {!client.auth_user_id && (
          <div className="mt-3 border-t border-[var(--color-border)] pt-3">
            {client.invite_token && (
              <p className="mb-2 break-all rounded-lg bg-[var(--color-surface-muted)] p-3 font-mono text-sm text-[var(--color-primary)]">
                {window.location.origin}/client/onboard?token={client.invite_token}
              </p>
            )}
            <Button variant="secondary" onClick={regenerateInviteLink} disabled={regenerating}>
              {regenerating ? 'Generating...' : client.invite_token ? 'Regenerate link' : 'Generate invite link'}
            </Button>
          </div>
        )}
      </Card>

      <Card>
        <Field label="Company name"><Input value={companyName} onChange={(e) => setCompanyName(e.target.value)} /></Field>
        <Field label="Contact name"><Input value={contactName} onChange={(e) => setContactName(e.target.value)} /></Field>
        <Field label="Contact phone"><Input value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} /></Field>
        <Field label="Email"><Input type="email" value={invitedEmail} onChange={(e) => setInvitedEmail(e.target.value)} /></Field>
        <Field label="City"><Input value={city} onChange={(e) => setCity(e.target.value)} /></Field>
        <Field label="Country"><Input value={country} onChange={(e) => setCountry(e.target.value)} /></Field>
        <ErrorText>{error}</ErrorText>
        {saved && <p className="mb-3 text-sm font-medium text-[var(--color-success)]">Saved.</p>}
        <Button onClick={save} disabled={saving}>{saving ? 'Saving...' : 'Save changes'}</Button>
      </Card>
    </Container>
  )
}
