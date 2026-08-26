import { useState } from 'react'
import { supabase } from '../../lib/supabase'
import { Container, PageHeader, Card, Field, Input, Button, ErrorText } from '../../components/ui'

function generateCode() {
  return Math.random().toString(36).slice(2, 8).toUpperCase()
}
function generateToken() {
  return Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2)
}

export default function PartnerInvite() {
  const [businessName, setBusinessName] = useState('')
  const [ownerName, setOwnerName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [city, setCity] = useState('')
  const [payoutMethod, setPayoutMethod] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [inviteLink, setInviteLink] = useState(null)

  async function handleSubmit(e) {
    e.preventDefault()
    if (!businessName || !ownerName || !phone) {
      setError('Please fill in business name, owner name, and phone.')
      return
    }
    setLoading(true)
    setError('')
    const referralCode = generateCode()
    const inviteToken = generateToken()
    const { error: dbError } = await supabase.from('partner').insert({
      business_name: businessName,
      owner_name: ownerName,
      phone,
      invited_email: email || null,
      city,
      payout_method: payoutMethod,
      referral_code: referralCode,
      invite_token: inviteToken,
    })
    setLoading(false)
    if (dbError) {
      setError(dbError.message)
      return
    }
    setInviteLink(`${window.location.origin}/partner/onboard?token=${inviteToken}`)
  }

  if (inviteLink) {
    return (
      <Container>
        <PageHeader title="Partner invited" subtitle="Send this link to them to complete onboarding" />
        <Card>
          <p className="mb-2 text-sm font-semibold text-[var(--color-ink)]">{businessName}</p>
          <p className="break-all rounded-lg bg-[var(--color-surface-muted)] p-3 font-mono text-sm text-[var(--color-primary)]">{inviteLink}</p>
          <p className="mt-3 text-xs text-[var(--color-muted)]">
            Copy this and send it to their phone (WhatsApp/SMS) or email — it's the same link either way, nothing is sent automatically.
          </p>
        </Card>
      </Container>
    )
  }

  return (
    <Container>
      <PageHeader title="Invite a partner/agent" subtitle="They'll set their own login via a link you send them" />
      <Card>
        <form onSubmit={handleSubmit}>
          <Field label="Business name">
            <Input value={businessName} onChange={(e) => setBusinessName(e.target.value)} />
          </Field>
          <Field label="Owner name">
            <Input value={ownerName} onChange={(e) => setOwnerName(e.target.value)} />
          </Field>
          <Field label="Phone">
            <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
          </Field>
          <Field label="Email" hint="Optional — pre-fills their onboarding form">
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </Field>
          <Field label="City">
            <Input value={city} onChange={(e) => setCity(e.target.value)} />
          </Field>
          <Field label="Payout method">
            <Input value={payoutMethod} onChange={(e) => setPayoutMethod(e.target.value)} placeholder="e.g. bank transfer" />
          </Field>
          <ErrorText>{error}</ErrorText>
          <Button type="submit" disabled={loading} className="w-full">{loading ? 'Creating...' : 'Create invite'}</Button>
        </form>
      </Card>
    </Container>
  )
}
