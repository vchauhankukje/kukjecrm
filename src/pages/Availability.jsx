import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { Container, PageHeader, Card, Field, Select, Input, Button, ErrorText, ProgressSteps, BackLink } from '../components/ui'

export default function Availability() {
  const navigate = useNavigate()
  const [availability, setAvailability] = useState('')
  const [preferredLocation, setPreferredLocation] = useState('')
  const [contractType, setContractType] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const candidateId = localStorage.getItem('candidateId')
    if (!candidateId) return
    supabase
      .from('candidate')
      .select('availability, preferred_location, contract_type')
      .eq('id', candidateId)
      .single()
      .then(({ data }) => {
        if (!data) return
        if (data.availability) setAvailability(data.availability)
        if (data.preferred_location) setPreferredLocation(data.preferred_location)
        if (data.contract_type) setContractType(data.contract_type)
      })
  }, [])

  async function handleContinue() {
    const candidateId = localStorage.getItem('candidateId')
    if (!candidateId) {
      setError('Session lost — please sign up again.')
      return
    }
    if (!availability || !preferredLocation || !contractType) {
      setError('Please fill in all fields.')
      return
    }
    setLoading(true)
    setError('')
    const { error: dbError } = await supabase
      .from('candidate')
      .update({ availability, preferred_location: preferredLocation, contract_type: contractType })
      .eq('id', candidateId)
    setLoading(false)
    if (dbError) {
      setError(dbError.message)
      return
    }
    navigate('/jobs')
  }

  return (
    <Container>
      <ProgressSteps step={4} total={5} />
      <BackLink onClick={() => navigate('/experience')} label="Back" />
      <PageHeader title="Availability" subtitle="When and where can you start?" />
      <Card>
        <Field label="Available from">
          <Select value={availability} onChange={(e) => setAvailability(e.target.value)}>
            <option value="">Select...</option>
            <option value="immediate">Immediate</option>
            <option value="2_weeks">2 weeks</option>
            <option value="1_month_plus">1 month+</option>
          </Select>
        </Field>

        <Field label="Preferred country/city">
          <Input value={preferredLocation} onChange={(e) => setPreferredLocation(e.target.value)} placeholder="e.g. Warsaw, Poland" />
        </Field>

        <Field label="Contract type">
          <Select value={contractType} onChange={(e) => setContractType(e.target.value)}>
            <option value="">Select...</option>
            <option value="full_time">Full-time</option>
            <option value="part_time">Part-time</option>
            <option value="either">Either</option>
          </Select>
        </Field>

        <ErrorText>{error}</ErrorText>
        <Button onClick={handleContinue} disabled={loading} className="w-full">
          {loading ? 'Saving...' : 'Continue'}
        </Button>
      </Card>
    </Container>
  )
}
