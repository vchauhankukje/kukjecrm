export const CATEGORIES = [
  'Delivery Driver',
  'Truck Driver',
  'Housekeeping',
  'Construction',
  'Kitchen/Food Prep',
  'Warehouse/Loader',
  'Caregiver',
  'Maintenance',
  'Other',
]

export const COUNTRY_CITIES = {
  Belarus: ['Minsk', 'Gomel', 'Mogilev', 'Vitebsk', 'Hrodna'],
  Bulgaria: ['Sofia', 'Plovdiv', 'Varna', 'Burgas', 'Ruse'],
  'Czech Republic': ['Prague', 'Brno', 'Ostrava', 'Plzen', 'Liberec'],
  Hungary: ['Budapest', 'Debrecen', 'Szeged', 'Miskolc', 'Pecs'],
  Moldova: ['Chisinau', 'Balti', 'Tiraspol', 'Cahul', 'Comrat'],
  Poland: ['Warsaw', 'Krakow', 'Lodz', 'Wroclaw', 'Poznan', 'Gdansk'],
  Romania: ['Bucharest', 'Cluj-Napoca', 'Timisoara', 'Iasi', 'Constanta'],
  Russia: ['Moscow', 'Saint Petersburg', 'Novosibirsk', 'Yekaterinburg', 'Nizhny Novgorod'],
  Slovakia: ['Bratislava', 'Kosice', 'Presov', 'Zilina', 'Nitra'],
  Ukraine: ['Kyiv', 'Kharkiv', 'Odesa', 'Dnipro', 'Lviv', 'Donetsk'],
}

export const COUNTRIES = Object.keys(COUNTRY_CITIES)

export function generateCandidateCode() {
  return 'KJ-' + Math.random().toString(36).slice(2, 7).toUpperCase()
}
