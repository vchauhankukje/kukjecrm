import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { loadCountries, loadCities } from '../../lib/locations'
import { CATEGORIES } from '../../lib/constants'
import { logAudit } from '../../lib/permissions'
import { Container, PageHeader, Card, Field, Input, Select, Button, ErrorText } from '../../components/ui'

const STAGES = ['draft', 'submitted', 'kukje_review', 'approved', 'sourcing', 'interview', 'selected', 'rejected', 'hold', 'closed']

export default function JobForm() {
  const { id } = useParams()
  const isEdit = Boolean(id)
  const navigate = useNavigate()

  const [countries, setCountries] = useState([])
  const [cities, setCities] = useState([])
  const [clients, setClients] = useState([])

  const [title, setTitle] = useState('')
  const [category, setCategory] = useState(CATEGORIES[0])
  const [country, setCountry] = useState('')
  const [city, setCity] = useState('')
  const [payRange, setPayRange] = useState('')
  const [slotsTotal, setSlotsTotal] = useState(1)
  const [slotsOpen, setSlotsOpen] = useState(1)
  const [status, setStatus] = useState('active')
  const [stage, setStage] = useState('draft')
  const [clientId, setClientId] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    async function init() {
      const [countryList, cityList] = await Promise.all([loadCountries(), loadCities()])
      setCountries(countryList)
      setCities(cityList)
      if (!isEdit && countryList.length) {
        setCountry(countryList[0].name)
        const firstCity = cityList.find((c) => c.country_id === countryList[0].id)
        setCity(firstCity?.name || '')
      }
      const { data: clientList } = await supabase.from('client').select('id, company_name').order('company_name')
      setClients(clientList || [])
    }
    init()
  }, [])

  useEffect(() => {
    if (!isEdit) return
    supabase.from('job').select('*').eq('id', id).single().then(({ data }) => {
      if (!data) return
      setTitle(data.title || '')
      setCategory(data.category || CATEGORIES[0])
      setCountry(data.country || '')
      setCity(data.city || '')
      setPayRange(data.pay_range || '')
      setSlotsTotal(data.slots_total ?? 1)
      setSlotsOpen(data.slots_open ?? 1)
      setStatus(data.status || 'active')
      setStage(data.stage || 'draft')
      setClientId(data.client_id || '')
    })
  }, [id])

  function citiesForCountryName(countryName) {
    const countryRow = countries.find((c) => c.name === countryName)
    return countryRow ? cities.filter((c) => c.country_id === countryRow.id) : []
  }

  function handleCountryChange(nextCountry) {
    setCountry(nextCountry)
    setCity(citiesForCountryName(nextCountry)[0]?.name || '')
  }

  async function handleSave() {
    const payload = {
      title, category, city, country, pay_range: payRange,
      slots_total: Number(slotsTotal), slots_open: Number(slotsOpen),
      status, stage, client_id: clientId || null,
    }
    const { data, error: dbError } = isEdit
      ? await supabase.from('job').update(payload).eq('id', id).select().single()
      : await supabase.from('job').insert(payload).select().single()
    if (dbError) {
      setError(dbError.message)
      return
    }
    await logAudit({ action: isEdit ? 'update' : 'create', objectType: 'job', objectId: data.id, after: payload })
    navigate('/admin/jobs')
  }

  return (
    <Container>
      <PageHeader title={isEdit ? 'Edit job' : 'New job'} />
      <Card>
        <Field label="Title">
          <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Warehouse Supervisor" />
        </Field>

        <Field label="Category">
          <Select value={category} onChange={(e) => setCategory(e.target.value)}>
            {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </Select>
        </Field>

        <Field label="Country">
          <Select value={country} onChange={(e) => handleCountryChange(e.target.value)}>
            {countries.map((c) => <option key={c.id} value={c.name}>{c.name}</option>)}
          </Select>
        </Field>

        <Field label="City">
          <Select value={city} onChange={(e) => setCity(e.target.value)}>
            {citiesForCountryName(country).map((c) => <option key={c.id} value={c.name}>{c.name}</option>)}
          </Select>
        </Field>

        <Field label="Pay range">
          <Input value={payRange} onChange={(e) => setPayRange(e.target.value)} placeholder="e.g. €900-1100/month" />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Total slots">
            <Input type="number" min="1" value={slotsTotal} onChange={(e) => setSlotsTotal(e.target.value)} />
          </Field>
          <Field label="Open slots">
            <Input type="number" min="0" value={slotsOpen} onChange={(e) => setSlotsOpen(e.target.value)} />
          </Field>
        </div>

        <Field label="Status" hint="Controls whether candidates see this job">
          <Select value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="active">Active</option>
            <option value="paused">Paused</option>
            <option value="filled">Filled</option>
          </Select>
        </Field>

        <Field label="Recruitment stage" hint="Internal lifecycle tracking, not shown to candidates">
          <Select value={stage} onChange={(e) => setStage(e.target.value)}>
            {STAGES.map((s) => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
          </Select>
        </Field>

        <Field label="Client" hint="Optional — leave blank for a direct/internal job">
          <Select value={clientId} onChange={(e) => setClientId(e.target.value)}>
            <option value="">No client</option>
            {clients.map((c) => <option key={c.id} value={c.id}>{c.company_name}</option>)}
          </Select>
        </Field>

        <ErrorText>{error}</ErrorText>
        <Button onClick={handleSave} className="w-full">Save</Button>
      </Card>
    </Container>
  )
}
