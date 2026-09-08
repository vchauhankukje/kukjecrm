import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { generateCandidateCode } from '../../lib/constants'
import { Container, Card, Textarea, Button, ErrorText } from '../../components/ui'

const STATUSES = ['new', 'contacted', 'qualified', 'converted', 'lost']

function generateReferralCode() {
  return Math.random().toString(36).slice(2, 8).toUpperCase()
}

export default function LeadDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [lead, setLead] = useState(null)
  const [loading, setLoading] = useState(true)
  const [notes, setNotes] = useState('')
  const [error, setError] = useState('')
  const [converting, setConverting] = useState(false)

  async function load() {
    const { data } = await supabase.from('lead').select('*').eq('id', id).single()
    setLead(data)
    setNotes(data?.notes || '')
    setLoading(false)
  }

  useEffect(() => { load() }, [id])

  async function changeStatus(status) {
    await supabase.from('lead').update({ status }).eq('id', id)
    load()
  }

  async function saveNotes() {
    await supabase.from('lead').update({ notes }).eq('id', id)
    load()
  }

  async function convertToCandidate() {
    setConverting(true)
    setError('')
    const candidateCode = generateCandidateCode()
    const { data: candidate, error: dbError } = await supabase
      .from('candidate')
      .insert({ name: lead.name, phone: lead.phone || '', city: '', auth_verified: false, candidate_code: candidateCode })
      .select()
      .single()
    if (dbError) { setConverting(false); setError(dbError.message); return }
    await supabase.from('lead').update({ status: 'converted', converted_candidate_id: candidate.id }).eq('id', id)
    setConverting(false)
    navigate(`/admin/candidates/${candidate.id}`)
  }

  async function convertToClient() {
    setConverting(true)
    setError('')
    const { data: client, error: dbError } = await supabase
      .from('client')
      .insert({ company_name: lead.company || lead.name, contact_name: lead.name, contact_phone: lead.phone, invited_email: lead.email || null })
      .select()
      .single()
    if (dbError) { setConverting(false); setError(dbError.message); return }
    await supabase.from('lead').update({ status: 'converted', converted_client_id: client.id }).eq('id', id)
    setConverting(false)
    navigate(`/admin/clients/${client.id}`)
  }

  if (loading) return <p className="p-8 text-center text-sm text-[var(--color-muted)]">Loading...</p>
  if (!lead) return <p className="p-8 text-center text-sm text-[var(--color-muted)]">Lead not found.</p>

  return (
    <Container>
      <Card className="mb-4">
        <h2 className="text-xl font-bold text-[var(--color-ink)]">{lead.name}</h2>
        <p className="mb-3 text-sm text-[var(--color-body)] capitalize">{lead.lead_type} lead · {lead.phone} · {lead.email}</p>

        <div className="flex flex-wrap gap-2">
          {STATUSES.map((s) => (
            <button
              key={s}
              onClick={() => changeStatus(s)}
              className={`rounded-full border px-3.5 py-1.5 text-sm font-medium capitalize transition ${
                lead.status === s ? 'border-[var(--color-primary)] bg-[var(--color-primary)] text-white' : 'border-[var(--color-border)] bg-white text-[var(--color-body)] hover:border-[var(--color-primary)]'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </Card>

      {lead.status !== 'converted' && (lead.lead_type === 'candidate' || lead.lead_type === 'employer') && (
        <Card className="mb-4">
          <h4 className="mb-2 font-display font-bold text-[var(--color-ink)]">Convert</h4>
          <ErrorText>{error}</ErrorText>
          {lead.lead_type === 'candidate' && (
            <Button onClick={convertToCandidate} disabled={converting}>{converting ? 'Converting...' : 'Convert to Candidate'}</Button>
          )}
          {lead.lead_type === 'employer' && (
            <Button onClick={convertToClient} disabled={converting}>{converting ? 'Converting...' : 'Convert to Client'}</Button>
          )}
        </Card>
      )}

      {lead.status === 'converted' && (
        <Card className="mb-4 text-sm text-[var(--color-success)]">
          Converted{lead.converted_candidate_id ? ' to candidate' : lead.converted_client_id ? ' to client' : ''}.
        </Card>
      )}

      <Card>
        <h4 className="mb-2 font-display font-bold text-[var(--color-ink)]">Notes</h4>
        <Textarea rows={4} value={notes} onChange={(e) => setNotes(e.target.value)} />
        <Button onClick={saveNotes} className="mt-2">Save notes</Button>
      </Card>
    </Container>
  )
}
