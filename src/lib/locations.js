import { supabase } from './supabase'

let countriesCache = null
let citiesCache = null

export async function loadCountries() {
  if (countriesCache) return countriesCache
  const { data } = await supabase.from('country').select('*').order('name')
  countriesCache = data || []
  return countriesCache
}

export async function loadCities() {
  if (citiesCache) return citiesCache
  const { data } = await supabase.from('city').select('*').order('name')
  citiesCache = data || []
  return citiesCache
}

export function clearLocationsCache() {
  countriesCache = null
  citiesCache = null
}
