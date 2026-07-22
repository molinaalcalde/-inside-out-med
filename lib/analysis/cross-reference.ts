// ── Cross-reference: lifestyle × analysis insights ────────────

import type { Scores, UserProfile, CrossRefInsight } from "../types"

export function generateCrossRefInsights(scores: Scores, profile: UserProfile): CrossRefInsight[] {
  const insights: CrossRefInsight[] = []
  const subs = scores.subMetrics || {}

  // Sleep × Bolsas/Ojeras
  const bolsasScore = subs.periocular?.[3]?.score ?? 100
  const ojerasScore = subs.periocular?.[2]?.score ?? 100
  if ((profile.sleep === "<5h" || profile.sleep === "5-6h") && (bolsasScore < 60 || ojerasScore < 60)) {
    insights.push({
      icon: "◐",
      title: "Sueño + contorno de ojos",
      text: `Tus ${bolsasScore < 60 ? "bolsas" : "ojeras"} se amplifican por dormir ${profile.sleep}. El sueño profundo libera hormona de crecimiento que repara la piel del contorno — sin eso, la hinchazón y la pigmentación se acumulan.`,
      severity: "warning",
    })
  }

  // Stress × Inflammation
  if (profile.stress === "alto" && scores.inflammation > 25) {
    insights.push({
      icon: "◈",
      title: "Estrés + inflamación",
      text: `Tu estrés crónico amplifica la inflamación detectada (${scores.inflammation}%). El cortisol elevado degrada el colágeno, activa la rojez y acelera el envejecimiento visible.`,
      severity: "critical",
    })
  }

  // Sun × Sun damage
  if (profile.sun === "alta" && scores.sunDamage > 25) {
    insights.push({
      icon: "◎",
      title: "Exposición solar + daño UV",
      text: `Tu exposición solar frecuente explica el ${scores.sunDamage}% de daño UV acumulado. Sin protección activa, las manchas y la textura irregular seguirán avanzando — el sol explica ~80% del envejecimiento visible.`,
      severity: "critical",
    })
  }

  // Exercise × Luminosity
  if ((profile.exercise === "nunca" || profile.exercise === "0") && scores.luminosity < 60) {
    insights.push({
      icon: "▽",
      title: "Ejercicio + luminosidad",
      text: `La falta de ejercicio impacta tu luminosidad (${scores.luminosity}%). El ejercicio mejora la circulación, la oxigenación y la función mitocondrial — más glow natural y mejor reparación.`,
      severity: "warning",
    })
  }

  // Diet × Glycation
  if (profile.diet === "keto" && scores.glycation < 20) {
    insights.push({
      icon: "◇",
      title: "Dieta + glicación",
      text: `Tu dieta baja en carbohidratos se refleja: tu glicación es baja (${scores.glycation}%). El colágeno no muestra daño por azúcar. Buen trabajo.`,
      severity: "info",
    })
  } else if (scores.glycation > 35) {
    insights.push({
      icon: "◇",
      title: "Glicación elevada",
      text: `Tu nivel de glicación (${scores.glycation}%) sugiere que el azúcar está dañando las fibras de colágeno. Reducir azúcares refinados y ultraprocesados puede frenar este proceso significativamente.`,
      severity: "warning",
    })
  }

  // Stress × Uniformity
  if (profile.stress === "alto" && scores.uniformity < 55) {
    insights.push({
      icon: "△",
      title: "Estrés + tono desigual",
      text: `El estrés crónico puede causar irregularidades de tono (${scores.uniformity}% de uniformidad). El cortisol altera la producción de melanina y amplifica manchas.`,
      severity: "warning",
    })
  }

  // Good sleep + good periocular
  if ((profile.sleep === "7-8h" || profile.sleep === "9+h") && bolsasScore >= 70 && ojerasScore >= 70) {
    insights.push({
      icon: "◉",
      title: "Buen descanso = buena zona ocular",
      text: `Tu sueño de ${profile.sleep} se nota: tu contorno de ojos está en buen estado. El sueño es el reparador #1 de esta zona.`,
      severity: "info",
    })
  }

  return insights
}
