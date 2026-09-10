/**
 * Sri Lankan Land Unit Conversion Logic
 * 1 perch = 25.293 m² = 272.25 sq ft
 * 40 perches = 1 rood
 * 160 perches = 4 roods = 1 acre
 */

const SQ_M_PER_PERCH = 25.29285
const SQ_FT_PER_PERCH = 272.25

export function perchesToAcres(perches: number): number {
  return perches / 160
}

export function perchesToSqM(perches: number): number {
  return perches * SQ_M_PER_PERCH
}

export function perchesToSqFt(perches: number): number {
  return perches * SQ_FT_PER_PERCH
}

/**
 * Formats perches into A-R-P format
 * e.g. 175 perches -> "1A-0R-15P"
 */
export function formatARP(perches: number): string {
  const acres = Math.floor(perches / 160)
  const remainderAfterAcres = perches % 160
  
  const roods = Math.floor(remainderAfterAcres / 40)
  const remainingPerches = remainderAfterAcres % 40

  if (acres === 0 && roods === 0) {
    return `${remainingPerches}P`
  }
  
  if (acres === 0) {
    return `${roods}R-${remainingPerches}P`
  }

  return `${acres}A-${roods}R-${remainingPerches}P`
}

/**
 * Formats the standard land extent string as requested in the SRS
 * e.g. "20 Perches (0.125 Acres · 505.9 m² · 5,445 sq ft)"
 */
export function formatLandExtentDetail(perches: number): string {
  const acres = perchesToAcres(perches).toFixed(3).replace(/\.?0+$/, '')
  const sqM = perchesToSqM(perches).toLocaleString(undefined, { maximumFractionDigits: 1 })
  const sqFt = perchesToSqFt(perches).toLocaleString(undefined, { maximumFractionDigits: 0 })

  return `${perches} Perches (${acres} Acres · ${sqM} m² · ${sqFt} sq ft)`
}
