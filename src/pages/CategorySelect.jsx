import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { Container, PageHeader, Chip, Button, ErrorText, ProgressSteps, BackLink } from '../components/ui'
import { CATEGORIES } from '../lib/constants'

export default function CategorySelect() {
  const navigate = useNavigate()
  const [selected, setSelected] = useState([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem('candidateCategories') || '[]')
    if (stored.length) setSelected(stored)
  }, [])

  function toggle(category) {
    setSelected((prev) =>
      prev.includes(category) ? prev.filter((c) => c !== category) : [...prev, category]
    )
  }

  async function handleContinue() {
    const candidateId = localStorage.getItem('candidateId')
    if (!candidateId) {
      setError('Session lost — please sign up again.')
      return
    }
    if (selected.length === 0) {
      setError('Select at least one category.')
      return
    }
    setLoading(true)
    setError('')
    const { error: dbError } = await supabase
      .from('candidate')
      .update({ job_categories: selected })
      .eq('id', candidateId)
    setLoading(false)
    if (dbError) {
      setError(dbError.message)
      return
    }
    localStorage.setItem('candidateCategories', JSON.stringify(selected))
    navigate('/experience')
  }

  return (
    <Container>
      <ProgressSteps step={2} total={5} />
      <BackLink onClick={() => navigate('/')} label="Back to sign up" />
      <PageHeader title="What kind of work?" subtitle="Select all that apply" />

      <div className="mb-6 flex flex-wrap justify-center gap-2">
        {CATEGORIES.map((category) => (
          <Chip key={category} selected={selected.includes(category)} onClick={() => toggle(category)}>
            {category}
          </Chip>
        ))}
      </div>

      <ErrorText>{error}</ErrorText>
      <Button onClick={handleContinue} disabled={loading} className="w-full">
        {loading ? 'Saving...' : 'Continue'}
      </Button>
    </Container>
  )
}
