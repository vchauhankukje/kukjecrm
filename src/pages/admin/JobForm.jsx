import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { loadCountries, loadCities } from '../../lib/locations'
import { CATEGORIES } from '../../lib/constants'
import { Container, PageHeader, Card, Field, Input, Select, Button, ErrorText } from '../../components/ui'

export default function JobForm() {
  const { id } = useParams()
  const isEdit = Boolean(id)
  const navigate = useNavigate()

  const [countries, setCountries] = useState([])
  const [cities, setCities] = useState([])

  const [title, setTitle] = useState('')
  const [category, setCategory] = useState(CATEGORIES[0])
  const [country, setCountry] = useState('')
  const [city, setCity] = useState('')
  const [payRange, setPayRange] = useState('')
  const [slotsTotal, setSlotsTotal] = useState(1)
  const [slotsOpen, setSlotsOpen] = useState(1)
  const [status, setStatus] = useState('active')
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
    const payload = { title, category, city, country, pay_range: payRange, slots_total: Number(slotsTotal), slots_open: Number(slotsOpen), status }
    const { error: dbError } = isEdit
      ? await supabase.from('job').update(payload).eq('id', id)
      : await supabase.from('job').insert(payload)
    if (dbError) {
      setError(dbError.message)
      return
    }
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

        <Field label="Status">
          <Select value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="active">Active</option>
            <option value="paused">Paused</option>
            <option value="filled">Filled</option>
          </Select>
        </Field>

        <ErrorText>{error}</ErrorText>
        <Button onClick={handleSave} className="w-full">Save</Button>
      </Card>
    </Container>
  )
}
