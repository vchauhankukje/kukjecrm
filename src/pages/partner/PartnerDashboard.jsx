import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { Container, PageHeader, Card, Button, ErrorText } from '../../components/ui'

export default function PartnerDashboard() {
  const [stats, setStats] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  async function load() {
    setLoading(true)
    setError('')

    const { data: userData } = await supabase.auth.getUser()
    const { data: partner } = await supabase.from('partner').select('*').eq('auth_user_id', userData.user.id).single()
    if (!partner) {
      setLoading(false)
      setError('No partner profile linked to this login.')
      return
    }

    const { data: candidates } = await supabase.from('candidate').select('id, phone').eq('referral_code', partner.referral_code)
    const candidateIds = (candidates || []).map((c) => c.id)

    let placedPhones = new Set()
    if (candidateIds.length > 0) {
      const { data: apps } = await supabase.from('application').select('candidate_id, status').in('candidate_id', candidateIds).eq('status', 'placed')
      const placedCandidateIds = new Set((apps || []).map((a) => a.candidate_id))
      for (const c of candidates) {
        if (placedCandidateIds.has(c.id)) placedPhones.add(c.phone)
      }
    }

    setStats({ partner, totalReferred: candidateIds.length, payoutEligible: placedPhones.size })
    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [])

  return (
    <Container>
      <PageHeader title="Partner/Agent dashboard" subtitle="Your referral stats" />
      <Card>
        {loading && <p className="text-sm text-[var(--color-muted)]">Loading...</p>}
        <ErrorText>{error}</ErrorText>

        {stats && (
          <div className="space-y-3 text-left">
            <p className="font-display font-bold text-[var(--color-ink)]">{stats.partner.business_name}</p>
            <p className="text-sm text-[var(--color-muted)]">{stats.partner.owner_name}</p>
            <div className="flex gap-3">
              <div className="flex-1 rounded-xl bg-[var(--color-surface-muted)] p-3 text-center">
                <p className="text-2xl font-bold text-[var(--color-ink)]">{stats.totalReferred}</p>
                <p className="text-xs text-[var(--color-muted)]">Referred</p>
              </div>
              <div className="flex-1 rounded-xl bg-[var(--color-success-tint)] p-3 text-center">
                <p className="text-2xl font-bold text-[var(--color-success)]">{stats.payoutEligible}</p>
                <p className="text-xs text-[var(--color-muted)]">Payout-eligible</p>
              </div>
            </div>
            <p className="text-xs text-[var(--color-muted)]">
              One payout credit per unique phone number, only counted once a candidate reaches "Placed" status.
            </p>
          </div>
        )}

        <Button variant="secondary" onClick={() => supabase.auth.signOut()} className="mt-5 w-full">
          Log out
        </Button>
      </Card>
    </Container>
  )
}
