// ── Percentile calculation by age cohort ──────────────────────

// Simulated normal distribution of overall scores per age bracket
// Based on dermatological literature averages
const PERCENTILE_TABLE: Record<string, { mean: number; stdDev: number }> = {
  "18-25": { mean: 72, stdDev: 10 },
  "26-35": { mean: 65, stdDev: 11 },
  "36-45": { mean: 58, stdDev: 12 },
  "46-55": { mean: 51, stdDev: 12 },
  "56+":   { mean: 44, stdDev: 13 },
}

function getAgeBracket(age: number): string {
  if (age <= 25) return "18-25"
  if (age <= 35) return "26-35"
  if (age <= 45) return "36-45"
  if (age <= 55) return "46-55"
  return "56+"
}

// Approximate CDF of normal distribution
function normalCDF(x: number, mean: number, stdDev: number): number {
  const z = (x - mean) / stdDev
  // Abramowitz and Stegun approximation
  const t = 1 / (1 + 0.2316419 * Math.abs(z))
  const d = 0.3989422804 * Math.exp(-z * z / 2)
  const p = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.8212560 + t * 1.3302744))))
  return z > 0 ? 1 - p : p
}

export function computePercentile(overallScore: number, age: number): {
  percentile: number
  bracket: string
  description: string
} {
  const bracket = getAgeBracket(age)
  const { mean, stdDev } = PERCENTILE_TABLE[bracket]
  const rawPercentile = normalCDF(overallScore, mean, stdDev) * 100
  const percentile = Math.max(1, Math.min(99, Math.round(rawPercentile)))

  let description: string
  if (percentile >= 85) {
    description = `Estás en el top ${100 - percentile}% de personas de ${bracket} años. Tu piel está significativamente mejor que la mayoría de tu grupo de edad.`
  } else if (percentile >= 65) {
    description = `Estás por encima del promedio para ${bracket} años. Tu piel está en buen estado con margen de mejora.`
  } else if (percentile >= 40) {
    description = `Estás en el promedio para ${bracket} años. Hay oportunidad clara de mejorar con una rutina adecuada.`
  } else {
    description = `Estás en el percentil ${percentile} de personas de ${bracket} años: hay margen claro de mejora.`
  }

  return { percentile, bracket, description }
}
