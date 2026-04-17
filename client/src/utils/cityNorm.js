const CITY_NORM = {
  'Tiruchirappalli': 'Trichy',
  'Tiruchirapalli':  'Trichy',
  'Bengaluru':       'Bangalore',
  'Kochi':           'Cochin',
  'Puducherry':      'Pondicherry',
  'Thiruvananthapuram': 'Trivandrum',
}

export function normalizeCity(city) {
  if (!city) return city
  return CITY_NORM[city] ?? city
}
