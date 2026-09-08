import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { Container, PageHeader, Card, Field, Input, Select, Button, ErrorText } from '../../components/ui'

export default function LeadForm() {
  const navigate = useNavigate()
  const [leadType, setLeadType] = useState('candidate')
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [company, setCompany] = useState('')
  const [source, setSource] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSave() {
    if (!name) { setError('Enter a name.'); return }
    setLoading(true)
    setError('')
    const { data, error: dbError } = await supabase
      .from('lead')
      .insert({ lead_type: leadType, name, phone, email, company, source })
      .select()
      .single()
    setLoading(false)
    if (dbError) { setError(dbError.message); return }
    navigate(`/admin/leads/${data.id}`)
  }

  return (
    <Container>
      <PageHeader title="New lead" />
      <Card>
        <Field label="Lead type">
          <Select value={leadType} onChange={(e) => setLeadType(e.target.value)}>
            <option value="candidate">Candidate / Job Seeker</option>
            <option value="employer">Employer / HR Service</option>
            <option value="student">Student / Admission</option>
          </Select>
        </Field>
        <Field label="Name"><Input value={name} onChange={(e) => setName(e.target.value)} /></Field>
        <Field label="Phone"><Input value={phone} onChange={(e) => setPhone(e.target.value)} /></Field>
        <Field label="Email"><Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} /></Field>
        {leadType === 'employer' && <Field label="Company"><Input value={company} onChange={(e) => setCompany(e.target.value)} /></Field>}
        <Field label="Source" hint="e.g. website, referral, walk-in, campaign">
          <Input value={source} onChange={(e) => setSource(e.target.value)} />
        </Field>
        <ErrorText>{error}</ErrorText>
        <Button onClick={handleSave} disabled={loading} className="w-full">{loading ? 'Saving...' : 'Save lead'}</Button>
      </Card>
    </Container>
  )
}
