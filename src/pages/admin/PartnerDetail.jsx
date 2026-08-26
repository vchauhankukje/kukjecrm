import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { Container, PageHeader, Card, Field, Input, Button, ErrorText, Pill } from '../../components/ui'

export default function PartnerDetail() {
  const { id } = useParams()
  const [partner, setPartner] = useState(null)
  const [loading, setLoading] = useState(true)

  const [businessName, setBusinessName] = useState('')
  const [ownerName, setOwnerName] = useState('')
  const [phone, setPhone] = useState('')
  const [invitedEmail, setInvitedEmail] = useState('')
  const [city, setCity] = useState('')
  const [payoutMethod, setPayoutMethod] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)
  const [regenerating, setRegenerating] = useState(false)

  function generateToken() {
    return Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2)
  }

  async function regenerateInviteLink() {
    setRegenerating(true)
    const inviteToken = generateToken()
    const { error: dbError } = await supabase.from('partner').update({ invite_token: inviteToken }).eq('id', id)
    setRegenerating(false)
    if (dbError) {
      setError(dbError.message)
      return
    }
    load()
  }

  async function load() {
    const { data } = await supabase.from('partner').select('*').eq('id', id).single()
    setPartner(data)
    if (data) {
      setBusinessName(data.business_name || '')
      setOwnerName(data.owner_name || '')
      setPhone(data.phone || '')
      setInvitedEmail(data.invited_email || '')
      setCity(data.city || '')
      setPayoutMethod(data.payout_method || '')
    }
    setLoading(false)
  }

  useEffect(() => { load() }, [id])

  async function save() {
    setSaving(true)
    setError('')
    setSaved(false)
    const { error: dbError } = await supabase
      .from('partner')
      .update({
        business_name: businessName,
        owner_name: ownerName,
        phone,
        invited_email: invitedEmail || null,
        city,
        payout_method: payoutMethod,
      })
      .eq('id', id)
    setSaving(false)
    if (dbError) {
      setError(dbError.message)
      return
    }
    setSaved(true)
    load()
  }

  if (loading) return <p className="p-8 text-center text-sm text-[var(--color-muted)]">Loading...</p>
  if (!partner) return <p className="p-8 text-center text-sm text-[var(--color-muted)]">Partner not found.</p>

  return (
    <Container>
      <PageHeader title={partner.business_name} subtitle={`Referral code: ${partner.referral_code}`} />

      <Card className="mb-4">
        <div className="flex items-center justify-between">
          <span className="text-sm text-[var(--color-muted)]">Onboarding status</span>
          <div className="flex items-center gap-2">
            {partner.auth_user_id ? <Pill status="placed" /> : <Pill status="applied" />}
            <span className="text-sm font-medium text-[var(--color-ink)]">{partner.auth_user_id ? 'Active' : 'Invited (not yet activated)'}</span>
          </div>
        </div>

        {!partner.auth_user_id && (
          <div className="mt-3 border-t border-[var(--color-border)] pt-3">
            {partner.invite_token ? (
              <>
                <p className="mb-2 text-xs text-[var(--color-muted)]">Invite link (send to their phone or email):</p>
                <p className="break-all rounded-lg bg-[var(--color-surface-muted)] p-3 font-mono text-sm text-[var(--color-primary)]">
                  {window.location.origin}/partner/onboard?token={partner.invite_token}
                </p>
              </>
            ) : (
              <p className="mb-2 text-sm text-[var(--color-muted)]">No active invite link.</p>
            )}
            <Button variant="secondary" onClick={regenerateInviteLink} disabled={regenerating} className="mt-2">
              {regenerating ? 'Generating...' : partner.invite_token ? 'Regenerate link (invalidates the old one)' : 'Generate invite link'}
            </Button>
          </div>
        )}
      </Card>

      <Card>
        <Field label="Business name">
          <Input value={businessName} onChange={(e) => setBusinessName(e.target.value)} />
        </Field>
        <Field label="Owner name">
          <Input value={ownerName} onChange={(e) => setOwnerName(e.target.value)} />
        </Field>
        <Field label="Phone">
          <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
        </Field>
        <Field label="Email" hint={partner.auth_user_id ? 'Login email is set separately once activated' : 'Pre-fills their onboarding form'}>
          <Input type="email" value={invitedEmail} onChange={(e) => setInvitedEmail(e.target.value)} />
        </Field>
        <Field label="City">
          <Input value={city} onChange={(e) => setCity(e.target.value)} />
        </Field>
        <Field label="Payout method">
          <Input value={payoutMethod} onChange={(e) => setPayoutMethod(e.target.value)} />
        </Field>

        <ErrorText>{error}</ErrorText>
        {saved && <p className="mb-3 text-sm font-medium text-[var(--color-success)]">Saved.</p>}
        <Button onClick={save} disabled={saving}>{saving ? 'Saving...' : 'Save changes'}</Button>
      </Card>
    </Container>
  )
}
