import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { Container, Card, Pill } from '../../components/ui'

export default function PartnerList() {
  const [partners, setPartners] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.from('partner').select('*').then(({ data }) => {
      setPartners(data || [])
      setLoading(false)
    })
  }, [])

  return (
    <Container narrow={false}>
      <div className="mb-5 flex items-center justify-between">
        <h2 className="text-xl font-bold text-[var(--color-ink)]">Partners/Agents</h2>
        <Link
          to="/admin/partners/invite"
          className="rounded-xl bg-[var(--color-primary)] px-4 py-2 text-sm font-semibold text-white no-underline hover:bg-[var(--color-primary-dark)]"
        >
          + Invite partner
        </Link>
      </div>

      {loading && <p className="text-sm text-[var(--color-muted)]">Loading...</p>}
      {!loading && (
        <Card className="overflow-x-auto p-0">
          <table className="w-full min-w-[520px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-[var(--color-border)] bg-[var(--color-surface-muted)] text-left">
                <th className="px-4 py-3 font-semibold text-[var(--color-ink)]">Business</th>
                <th className="px-4 py-3 font-semibold text-[var(--color-ink)]">Owner</th>
                <th className="px-4 py-3 font-semibold text-[var(--color-ink)]">City</th>
                <th className="px-4 py-3 font-semibold text-[var(--color-ink)]">Referral code</th>
                <th className="px-4 py-3 font-semibold text-[var(--color-ink)]">Onboarding</th>
              </tr>
            </thead>
            <tbody>
              {partners.map((p) => (
                <tr key={p.id} className="border-b border-[var(--color-border)] last:border-0 hover:bg-[var(--color-surface-muted)]">
                  <td className="px-4 py-3">
                    <Link to={`/admin/partners/${p.id}`} className="font-semibold text-[var(--color-primary)]">{p.business_name}</Link>
                  </td>
                  <td className="px-4 py-3 text-[var(--color-body)]">{p.owner_name}</td>
                  <td className="px-4 py-3 text-[var(--color-body)]">{p.city}</td>
                  <td className="px-4 py-3 font-mono text-[var(--color-primary)]">{p.referral_code}</td>
                  <td className="px-4 py-3">
                    {p.auth_user_id ? <Pill status="placed" /> : <Pill status="applied" />}
                    <span className="ml-1 text-xs text-[var(--color-muted)]">{p.auth_user_id ? 'Active' : 'Invited'}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
      {!loading && partners.length === 0 && <p className="mt-4 text-sm text-[var(--color-muted)]">No partners yet.</p>}
    </Container>
  )
}
