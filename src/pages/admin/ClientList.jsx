import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { Container, Card, Pill } from '../../components/ui'

export default function ClientList() {
  const [clients, setClients] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.from('client').select('*').order('created_at', { ascending: false }).then(({ data }) => {
      setClients(data || [])
      setLoading(false)
    })
  }, [])

  return (
    <Container narrow={false}>
      <div className="mb-5 flex items-center justify-between">
        <h2 className="text-xl font-bold text-[var(--color-ink)]">Clients</h2>
        <Link to="/admin/clients/invite" className="rounded-xl bg-[var(--color-primary)] px-4 py-2 text-sm font-semibold text-white no-underline hover:bg-[var(--color-primary-dark)]">
          + Invite client
        </Link>
      </div>

      {loading && <p className="text-sm text-[var(--color-muted)]">Loading...</p>}
      {!loading && (
        <Card className="overflow-x-auto p-0">
          <table className="w-full min-w-[520px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-[var(--color-border)] bg-[var(--color-surface-muted)] text-left">
                <th className="px-4 py-3 font-semibold text-[var(--color-ink)]">Company</th>
                <th className="px-4 py-3 font-semibold text-[var(--color-ink)]">Contact</th>
                <th className="px-4 py-3 font-semibold text-[var(--color-ink)]">City</th>
                <th className="px-4 py-3 font-semibold text-[var(--color-ink)]">Onboarding</th>
              </tr>
            </thead>
            <tbody>
              {clients.map((c) => (
                <tr key={c.id} className="border-b border-[var(--color-border)] last:border-0 hover:bg-[var(--color-surface-muted)]">
                  <td className="px-4 py-3"><Link to={`/admin/clients/${c.id}`} className="font-semibold text-[var(--color-primary)]">{c.company_name}</Link></td>
                  <td className="px-4 py-3 text-[var(--color-body)]">{c.contact_name}</td>
                  <td className="px-4 py-3 text-[var(--color-body)]">{c.city}</td>
                  <td className="px-4 py-3">
                    {c.auth_user_id ? <Pill status="placed" /> : <Pill status="applied" />}
                    <span className="ml-1 text-xs text-[var(--color-muted)]">{c.auth_user_id ? 'Active' : 'Invited'}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
      {!loading && clients.length === 0 && <p className="mt-4 text-sm text-[var(--color-muted)]">No clients yet.</p>}
    </Container>
  )
}
