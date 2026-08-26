import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { uploadFile } from '../lib/uploadFile'
import { Container, PageHeader, Card, Field, Input, Select, Textarea, Button, ErrorText, ProgressSteps, BackLink } from '../components/ui'

const CATEGORY_KEY = {
  'Delivery Driver': 'delivery',
  'Truck Driver': 'truck_driver',
  Housekeeping: 'housekeeping',
  Construction: 'construction',
}

const DRIVER_CATEGORIES = ['Delivery Driver', 'Truck Driver']
const MAX_RECORD_SECONDS = 30

export default function Experience() {
  const navigate = useNavigate()
  const [categories, setCategories] = useState([])
  const [fields, setFields] = useState({})
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const [recording, setRecording] = useState(false)
  const [seconds, setSeconds] = useState(0)
  const [audioBlob, setAudioBlob] = useState(null)
  const [existingVoiceNoteUrl, setExistingVoiceNoteUrl] = useState(null)
  const mediaRecorderRef = useRef(null)
  const timerRef = useRef(null)
  const chunksRef = useRef([])

  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem('candidateCategories') || '[]')
    setCategories(stored)

    const candidateId = localStorage.getItem('candidateId')
    if (!candidateId) return
    supabase.from('candidate').select('experience, voice_note_url').eq('id', candidateId).single().then(({ data }) => {
      if (!data) return
      if (data.voice_note_url) setExistingVoiceNoteUrl(data.voice_note_url)
      if (data.experience) {
        const prefilled = {}
        for (const category of stored) {
          const key = CATEGORY_KEY[category] || category.toLowerCase().replace(/\s+/g, '_')
          if (data.experience[key]) prefilled[category] = data.experience[key]
        }
        setFields(prefilled)
      }
    })
  }, [])

  function setField(category, key, value) {
    setFields((prev) => ({
      ...prev,
      [category]: { ...prev[category], [key]: value },
    }))
  }

  function pickSupportedMimeType() {
    const candidates = [
      'audio/webm;codecs=opus',
      'audio/webm',
      'audio/mp4',
      'audio/aac',
      'audio/ogg;codecs=opus',
    ]
    return candidates.find((type) => window.MediaRecorder?.isTypeSupported?.(type)) || ''
  }

  async function startRecording() {
    setError('')
    let stream
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    } catch {
      setError('Microphone access was denied. Check your browser/app permissions and try again.')
      return
    }

    const mimeType = pickSupportedMimeType()
    let recorder
    try {
      recorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream)
    } catch {
      setError('Voice recording is not supported on this browser.')
      stream.getTracks().forEach((t) => t.stop())
      return
    }

    chunksRef.current = []
    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data)
    }
    recorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: recorder.mimeType || mimeType || 'audio/webm' })
      setAudioBlob(blob)
      stream.getTracks().forEach((t) => t.stop())
    }
    recorder.start()
    mediaRecorderRef.current = recorder
    setRecording(true)
    setSeconds(0)
    timerRef.current = setInterval(() => {
      setSeconds((s) => {
        if (s + 1 >= MAX_RECORD_SECONDS) {
          stopRecording()
          return MAX_RECORD_SECONDS
        }
        return s + 1
      })
    }, 1000)
  }

  function stopRecording() {
    clearInterval(timerRef.current)
    mediaRecorderRef.current?.stop()
    setRecording(false)
  }

  async function handleContinue() {
    const candidateId = localStorage.getItem('candidateId')
    if (!candidateId) {
      setError('Session lost — please sign up again.')
      return
    }
    setLoading(true)
    setError('')

    const experience = {}
    for (const category of categories) {
      const key = CATEGORY_KEY[category] || category.toLowerCase().replace(/\s+/g, '_')
      experience[key] = fields[category] || {}
    }

    let voiceNoteUrl = existingVoiceNoteUrl
    if (audioBlob) {
      try {
        const extension = audioBlob.type.includes('mp4') ? 'm4a' : audioBlob.type.includes('ogg') ? 'ogg' : 'webm'
        const file = new File([audioBlob], `voice-note-${Date.now()}.${extension}`, { type: audioBlob.type })
        voiceNoteUrl = await uploadFile(file, 'voice-notes')
      } catch (err) {
        setLoading(false)
        setError(err.message === 'FILE_TOO_LARGE' ? 'Voice note is too large.' : err.message)
        return
      }
    }

    const { error: dbError } = await supabase
      .from('candidate')
      .update({ experience, voice_note_url: voiceNoteUrl })
      .eq('id', candidateId)
    setLoading(false)
    if (dbError) {
      setError(dbError.message)
      return
    }
    navigate('/availability')
  }

  return (
    <Container>
      <ProgressSteps step={3} total={5} />
      <BackLink onClick={() => navigate('/categories')} label="Back" />
      <PageHeader title="Your experience" subtitle="Tell employers what you bring" />

      <div className="space-y-4">
        {categories.map((category) => (
          <CategoryFields
            key={category}
            category={category}
            values={fields[category] || {}}
            onChange={(key, value) => setField(category, key, value)}
          />
        ))}

        <Card>
          <p className="mb-1 text-sm font-semibold text-[var(--color-ink)]">Optional: 30-second voice note</p>
          <p className="mb-3 text-xs text-[var(--color-muted)]">A short intro in your own words helps employers connect with you.</p>
          <div className="flex items-center gap-3">
            {!recording && (
              <Button type="button" variant="secondary" onClick={startRecording}>
                {audioBlob ? 'Re-record' : 'Record'}
              </Button>
            )}
            {recording && (
              <Button type="button" variant="danger" onClick={stopRecording}>
                Stop ({MAX_RECORD_SECONDS - seconds}s left)
              </Button>
            )}
          </div>
          {audioBlob && !recording && (
            <audio controls src={URL.createObjectURL(audioBlob)} className="mt-3 w-full" />
          )}
          {!audioBlob && existingVoiceNoteUrl && !recording && (
            <audio controls src={existingVoiceNoteUrl} className="mt-3 w-full" />
          )}
        </Card>
      </div>

      <ErrorText>{error}</ErrorText>
      <Button onClick={handleContinue} disabled={loading} className="mt-2 w-full">
        {loading ? 'Saving...' : 'Continue'}
      </Button>
    </Container>
  )
}

function CategoryFields({ category, values, onChange }) {
  return (
    <Card>
      <h4 className="mb-3 font-display text-base font-bold text-[var(--color-ink)]">{category}</h4>

      <Field label="Years of experience">
        <Input type="number" min="0" value={values.years_experience || ''} onChange={(e) => onChange('years_experience', e.target.value)} />
      </Field>

      {DRIVER_CATEGORIES.includes(category) && (
        <>
          <Field label="License class">
            <Input value={values.license_class || ''} onChange={(e) => onChange('license_class', e.target.value)} placeholder="e.g. B, C, CE" />
          </Field>
          <Field label="Own vehicle">
            <Select value={values.own_vehicle || ''} onChange={(e) => onChange('own_vehicle', e.target.value)}>
              <option value="">Select...</option>
              <option value="car">Car</option>
              <option value="scooter">Scooter</option>
              <option value="none">None</option>
            </Select>
          </Field>
        </>
      )}

      {category === 'Housekeeping' && (
        <Field label="Live-in vs live-out preference">
          <Select value={values.living_preference || ''} onChange={(e) => onChange('living_preference', e.target.value)}>
            <option value="">Select...</option>
            <option value="live-in">Live-in</option>
            <option value="live-out">Live-out</option>
            <option value="either">Either</option>
          </Select>
        </Field>
      )}

      {category === 'Construction' && (
        <Field label="Specific trade / skill">
          <Input value={values.trade || ''} onChange={(e) => onChange('trade', e.target.value)} placeholder="e.g. Electrician" />
        </Field>
      )}

      {!['Delivery Driver', 'Truck Driver', 'Housekeeping', 'Construction'].includes(category) && (
        <Field label="Skill description">
          <Textarea rows={3} value={values.skill_description || ''} onChange={(e) => onChange('skill_description', e.target.value)} />
        </Field>
      )}
    </Card>
  )
}
