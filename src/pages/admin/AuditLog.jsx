import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { Container, Card, Select } from '../../components/ui'

export default function AuditLog() {
  const [entries, setEntries] = useState([])
  const [loading, setLoading] = useState(true)
  const [objectFilter, setObjectFilter] = useState('')

  useEffect(() => {
    supabase.from('audit_log').select('*').order('created_at', { ascending: false }).limit(200).then(({ data }) => {
      setEntries(data || [])
      setLoading(false)
    })
  }, [])

  const objectTypes = [...new Set(entries.map((e) => e.object_type))].sort()
  const filtered = objectFilter ? entries.filter((e) => e.object_type === objectFilter) : entries

  return (
    <Container narrow={false}>
      <h2 className="mb-1 text-xl font-bold text-[var(--color-ink)]">Audit Log</h2>
      <p className="mb-5 text-sm text-[var(--color-muted)]">Every material change made from the admin panel (most recent 200).</p>

      <Select value={objectFilter} onChange={(e) => setObjectFilter(e.target.value)} className="mb-4 max-w-[200px]">
        <option value="">All objects</option>
        {objectTypes.map((o) => <option key={o} value={o}>{o}</option>)}
      </Select>

      {loading && <p className="text-sm text-[var(--color-muted)]">Loading...</p>}
      {!loading && (
        <Card className="overflow-x-auto p-0">
          <table className="w-full min-w-[640px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-[var(--color-border)] bg-[var(--color-surface-muted)] text-left">
                <th className="px-4 py-3 font-semibold text-[var(--color-ink)]">When</th>
                <th className="px-4 py-3 font-semibold text-[var(--color-ink)]">Actor</th>
                <th className="px-4 py-3 font-semibold text-[var(--color-ink)]">Action</th>
                <th className="px-4 py-3 font-semibold text-[var(--color-ink)]">Object</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((e) => (
                <tr key={e.id} className="border-b border-[var(--color-border)] last:border-0">
                  <td className="px-4 py-3 text-xs text-[var(--color-muted)]">{new Date(e.created_at).toLocaleString()}</td>
                  <td className="px-4 py-3 text-[var(--color-body)]">{e.actor_email || '—'}</td>
                  <td className="px-4 py-3 capitalize text-[var(--color-body)]">{e.action}</td>
                  <td className="px-4 py-3 text-[var(--color-body)]">{e.object_type} <span className="font-mono text-xs text-[var(--color-muted)]">{e.object_id?.slice(0, 8)}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
      {!loading && filtered.length === 0 && <p className="mt-4 text-sm text-[var(--color-muted)]">No activity yet.</p>}
    </Container>
  )
}
