import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { clearLocationsCache } from '../../lib/locations'
import { Container, Card, Input, Button, ErrorText } from '../../components/ui'

export default function LocationManager() {
  const [countries, setCountries] = useState([])
  const [cities, setCities] = useState([])
  const [newCountry, setNewCountry] = useState('')
  const [newCityByCountry, setNewCityByCountry] = useState({})
  const [error, setError] = useState('')

  async function load() {
    const { data: c } = await supabase.from('country').select('*').order('name')
    const { data: ci } = await supabase.from('city').select('*').order('name')
    setCountries(c || [])
    setCities(ci || [])
  }

  useEffect(() => { load() }, [])

  async function addCountry() {
    if (!newCountry.trim()) return
    const { error: dbError } = await supabase.from('country').insert({ name: newCountry.trim() })
    if (dbError) { setError(dbError.message); return }
    setNewCountry('')
    clearLocationsCache()
    load()
  }

  async function deleteCountry(id) {
    await supabase.from('country').delete().eq('id', id)
    clearLocationsCache()
    load()
  }

  async function addCity(countryId) {
    const name = (newCityByCountry[countryId] || '').trim()
    if (!name) return
    const { error: dbError } = await supabase.from('city').insert({ name, country_id: countryId })
    if (dbError) { setError(dbError.message); return }
    setNewCityByCountry((prev) => ({ ...prev, [countryId]: '' }))
    clearLocationsCache()
    load()
  }

  async function deleteCity(id) {
    await supabase.from('city').delete().eq('id', id)
    clearLocationsCache()
    load()
  }

  return (
    <Container narrow={false}>
      <h2 className="mb-1 text-xl font-bold text-[var(--color-ink)]">Countries & Cities</h2>
      <p className="mb-5 text-sm text-[var(--color-muted)]">Manage the location list used across job postings — add a country/city here and it's available immediately, no code changes needed.</p>

      <Card className="mb-5">
        <div className="flex gap-2">
          <Input placeholder="New country name" value={newCountry} onChange={(e) => setNewCountry(e.target.value)} />
          <Button onClick={addCountry}>Add country</Button>
        </div>
        <ErrorText>{error}</ErrorText>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2">
        {countries.map((country) => (
          <Card key={country.id}>
            <div className="mb-2 flex items-center justify-between">
              <h4 className="font-display font-bold text-[var(--color-ink)]">{country.name}</h4>
              <button onClick={() => deleteCountry(country.id)} className="text-xs font-semibold text-[var(--color-danger)]">Delete country</button>
            </div>
            <ul className="mb-3 space-y-1">
              {cities.filter((c) => c.country_id === country.id).map((city) => (
                <li key={city.id} className="flex items-center justify-between text-sm text-[var(--color-body)]">
                  {city.name}
                  <button onClick={() => deleteCity(city.id)} className="text-xs text-[var(--color-danger)]">Remove</button>
                </li>
              ))}
            </ul>
            <div className="flex gap-2">
              <Input
                placeholder="New city"
                value={newCityByCountry[country.id] || ''}
                onChange={(e) => setNewCityByCountry((prev) => ({ ...prev, [country.id]: e.target.value }))}
              />
              <Button variant="secondary" onClick={() => addCity(country.id)}>Add</Button>
            </div>
          </Card>
        ))}
      </div>
    </Container>
  )
}
