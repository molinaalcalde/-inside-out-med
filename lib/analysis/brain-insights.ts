// ── Brain Insights: evidence-based analysis engine ─────────────
// Takes user scores + profile + papers DB and generates intelligent,
// citation-backed dermatological insights.

export interface BrainInsight {
  title: string
  text: string
  evidence: string
  zone?: string
  severity: "info" | "warning" | "critical"
}

interface BrainScores {
  overall: number
  luminosity: number
  hydration: number
  uniformity: number
  glycation: number
  inflammation: number
  sunDamage: number
  vascularity: number
  texture: number
  wrinkleDepth: number
  darkCircles: number
  symmetry: number
  ageApparent: number
  zoneScores?: Record<string, number>
}

interface BrainProfile {
  age?: number
  sleep?: string
  stress?: string
  sun?: string
  exercise?: string
  diet?: string
  sensitivity?: string
  conditions?: string[]
}

interface BrainPaper {
  key_findings: string
  applicable_zones: string[]
  applicable_treatments: string[]
  authors: string
  year: number
  title: string
  tags?: string[]
}

function findRelevantPapers(
  papers: BrainPaper[],
  tags: string[],
  zones: string[],
  limit: number = 2,
): BrainPaper[] {
  const scored = papers.map(p => {
    let score = 0
    const pTags = (p.tags || []).map(t => t.toLowerCase())
    const pZones = (p.applicable_zones || []).map(z => z.toLowerCase())
    const pTitle = p.title.toLowerCase()
    const pFindings = p.key_findings.toLowerCase()
    for (const tag of tags) {
      const t = tag.toLowerCase()
      if (pTags.includes(t)) score += 3
      if (pTitle.includes(t)) score += 2
      if (pFindings.includes(t)) score += 1
    }
    for (const zone of zones) {
      if (pZones.includes(zone.toLowerCase())) score += 2
    }
    return { paper: p, score }
  })
  return scored
    .filter(s => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(s => s.paper)
}

function cite(p: BrainPaper): string {
  return `${p.authors}, ${p.year}, ${p.title}`
}

export function generateBrainInsights(
  scores: BrainScores,
  profile: BrainProfile,
  papers: BrainPaper[],
): BrainInsight[] {
  const insights: BrainInsight[] = []

  // ── 1. Sun damage analysis ──
  if (scores.sunDamage > 25) {
    const severity: BrainInsight["severity"] = scores.sunDamage > 60 ? "critical" : scores.sunDamage > 40 ? "warning" : "info"
    const relevantPapers = findRelevantPapers(papers, ["SPF", "fotoenvejecimiento", "photoaging", "sun", "sunscreen", "fotodano", "UV"], ["piel", "mejillas"])
    const sunExposureHigh = profile.sun === "alta" || profile.sun === "mucha"
    const text = sunExposureHigh
      ? `Tu nivel de dano solar (${scores.sunDamage}%) combinado con exposicion solar alta sugiere fotoenvejecimiento activo. Estudios demuestran que el uso diario de SPF 50 puede revertir signos visibles en 12 semanas.`
      : `Se detecta dano solar acumulado (${scores.sunDamage}%). Incluso con exposicion moderada, el fotodano explica hasta el 80% del envejecimiento visible. La proteccion diaria es clave para frenar la progresion.`
    insights.push({
      title: "Fotodano acumulado",
      text,
      evidence: relevantPapers.length > 0 ? cite(relevantPapers[0]) : "Hughes et al., 2013, Ann Intern Med",
      zone: "cheekL",
      severity,
    })
  }

  // ── 2. Inflammation + stress analysis ──
  if (scores.inflammation > 25) {
    const severity: BrainInsight["severity"] = scores.inflammation > 60 ? "critical" : scores.inflammation > 40 ? "warning" : "info"
    const relevantPapers = findRelevantPapers(papers, ["inflamacion", "rosacea", "inflammation", "rojez", "barrera", "antiinflamatorio"], ["piel", "mejillas"])
    const stressHigh = profile.stress === "alto"
    const text = stressHigh
      ? `Tu inflamacion (${scores.inflammation}%) esta amplificada por estres cronico. El cortisol elevado degrada el colageno y activa cascadas inflamatorias que aceleran el envejecimiento cutaneo visible.`
      : `Se detecta inflamacion activa (${scores.inflammation}%). La rojez cronica debilita la barrera cutanea y acelera la perdida de colageno. Ingredientes como niacinamida y ceramidas pueden restaurar la funcion de barrera.`
    insights.push({
      title: "Inflamacion cutanea activa",
      text,
      evidence: relevantPapers.length > 0 ? cite(relevantPapers[0]) : "Addor, 2017, An Bras Dermatol",
      zone: "cheekR",
      severity,
    })
  }

  // ── 3. Glycation analysis ──
  if (scores.glycation > 30) {
    const severity: BrainInsight["severity"] = scores.glycation > 60 ? "critical" : scores.glycation > 40 ? "warning" : "info"
    const relevantPapers = findRelevantPapers(papers, ["glicacion", "glycation", "colageno", "collagen", "aging", "envejecimiento"], ["piel"])
    const text = `Tu nivel de glicacion (${scores.glycation}%) indica que los productos finales de glicacion avanzada (AGEs) estan danando las fibras de colageno. Reducir azucares refinados y usar antioxidantes topicos puede frenar este proceso.`
    insights.push({
      title: "Glicacion del colageno",
      text,
      evidence: relevantPapers.length > 0 ? cite(relevantPapers[0]) : "Farage et al., 2008, Int J Cosmetic Science",
      severity,
    })
  }

  // ── 4. Luminosity / hydration analysis ──
  if (scores.luminosity < 60 || scores.hydration < 60) {
    const worst = Math.min(scores.luminosity, scores.hydration)
    const severity: BrainInsight["severity"] = worst < 40 ? "critical" : worst < 60 ? "warning" : "info"
    const relevantPapers = findRelevantPapers(papers, ["vitamina C", "vitamin C", "antioxidante", "luminosidad", "hidratacion", "hyaluronic", "acido hialuronico"], ["piel", "mejillas"])
    const lowExercise = profile.exercise === "nunca" || profile.exercise === "0"
    const text = lowExercise
      ? `Tu luminosidad (${scores.luminosity}%) y suavidad (${scores.hydration}%) estan por debajo del optimo. La falta de ejercicio reduce la circulacion y la oxigenacion cutanea. Vitamina C topica + ejercicio regular pueden mejorar el glow natural.`
      : `Tu piel muestra baja luminosidad (${scores.luminosity}%) y suavidad (${scores.hydration}%). La combinacion de vitamina C topica al 15-20% con acido hialuronico puede mejorar significativamente la hidratacion profunda y el brillo.`
    insights.push({
      title: "Piel deshidratada y opaca",
      text,
      evidence: relevantPapers.length > 0 ? cite(relevantPapers[0]) : "Pullar et al., 2017, Nutrients",
      severity,
    })
  }

  // ── 5. Wrinkle depth + aging ──
  const ageVal = profile.age || 30
  if (scores.wrinkleDepth > 30 || (scores.ageApparent > ageVal + 3)) {
    const severity: BrainInsight["severity"] = scores.wrinkleDepth > 60 || scores.ageApparent > ageVal + 7 ? "critical" : "warning"
    const relevantPapers = findRelevantPapers(papers, ["retinol", "retinoid", "arrugas", "wrinkle", "colageno", "anti-aging", "skin aging"], ["piel", "frente", "periocular"])
    const ageDiff = Math.round(scores.ageApparent - ageVal)
    const text = ageDiff > 0
      ? `Tu rostro aparenta ${Math.round(scores.ageApparent)} anos (${ageDiff} mas de tu edad real). Los retinoides son el tratamiento con mayor evidencia para reducir arrugas y estimular colageno: estudios muestran mejoria visible en 12 semanas con retinol al 0.5%.`
      : `La profundidad de tus arrugas (${scores.wrinkleDepth}%) sugiere perdida de colageno activa. El retinol es el gold standard en anti-aging topico, con evidencia de nivel I para reduccion de lineas finas y mejora de textura.`
    insights.push({
      title: "Envejecimiento cutaneo acelerado",
      text,
      evidence: relevantPapers.length > 0 ? cite(relevantPapers[0]) : "Mukherjee et al., 2006, Clin Interv Aging",
      zone: "forehead",
      severity,
    })
  }

  // ── 6. Dark circles / periocular ──
  if (scores.darkCircles < 55) {
    const severity: BrainInsight["severity"] = scores.darkCircles < 35 ? "critical" : "warning"
    const relevantPapers = findRelevantPapers(papers, ["ojeras", "periocular", "cafeina", "caffeine", "sleep", "sueno"], ["periocular"])
    const poorSleep = profile.sleep === "<5h" || profile.sleep === "5-6h"
    const text = poorSleep
      ? `Tus ojeras (score ${scores.darkCircles}) estan amplificadas por sueno insuficiente (${profile.sleep}). El sueno profundo libera hormona de crecimiento que repara la piel del contorno. Un contorno de ojos con cafeina + peptidos puede reducir la hinchazon.`
      : `Tu zona periocular muestra ojeras marcadas (score ${scores.darkCircles}). La hiperpigmentacion periorbital puede mejorar con vitamina C topica al 10% y retinol suave. Los peptidos estimulan el colageno de esta zona delicada.`
    insights.push({
      title: "Zona periocular comprometida",
      text,
      evidence: relevantPapers.length > 0 ? cite(relevantPapers[0]) : "Herman et al., 2013, Skin Pharmacol",
      zone: "periocularL",
      severity,
    })
  }

  // ── 7. Uniformity / pigmentation ──
  if (scores.uniformity < 55) {
    const severity: BrainInsight["severity"] = scores.uniformity < 35 ? "critical" : "warning"
    const relevantPapers = findRelevantPapers(papers, ["niacinamida", "niacinamide", "manchas", "pigment", "uniformidad", "spots", "melasma"], ["piel", "mejillas"])
    const text = `Tu uniformidad de tono (${scores.uniformity}%) revela irregularidades pigmentarias. La niacinamida al 10% reduce la transferencia de melanina a los queratinocitos, mejorando manchas y textura en 8-12 semanas.`
    insights.push({
      title: "Irregularidad pigmentaria",
      text,
      evidence: relevantPapers.length > 0 ? cite(relevantPapers[0]) : "Bissett, 2005, Dermatol Surg",
      severity,
    })
  }

  // ── 8. Sleep quality impact ──
  if ((profile.sleep === "<5h" || profile.sleep === "5-6h") && scores.overall < 65) {
    const relevantPapers = findRelevantPapers(papers, ["sleep", "sueno", "skin aging", "circadian"], ["piel"])
    // Only add if we haven't already covered sleep in periocular
    const alreadyCoveredSleep = insights.some(i => i.title.includes("periocular"))
    if (!alreadyCoveredSleep) {
      insights.push({
        title: "Impacto del sueno en tu piel",
        text: `Dormir ${profile.sleep} afecta tu score global (${scores.overall}/100). Estudios clinicos demuestran que la privacion de sueno aumenta signos de envejecimiento, reduce la funcion de barrera cutanea y retrasa la reparacion del ADN.`,
        evidence: relevantPapers.length > 0 ? cite(relevantPapers[0]) : "Oyetakin-White et al., 2015, Clin Exp Dermatol",
        severity: "warning",
      })
    }
  }

  // ── 9. Good overall score ──
  if (scores.overall >= 75 && insights.length < 2) {
    const relevantPapers = findRelevantPapers(papers, ["proteccion", "prevention", "SPF", "antioxidante", "collagen"], ["piel"])
    insights.push({
      title: "Piel en buen estado general",
      text: `Tu score global (${scores.overall}/100) refleja una piel bien cuidada. Para mantener estos resultados, la evidencia respalda tres pilares: proteccion solar diaria, retinoides nocturnos y antioxidantes matutinos.`,
      evidence: relevantPapers.length > 0 ? cite(relevantPapers[0]) : "Krutmann et al., 2017, J Dermatological Science",
      severity: "info",
    })
  }

  // ── 10. Vascularity / rosacea signals ──
  if (scores.vascularity > 40) {
    const severity: BrainInsight["severity"] = scores.vascularity > 65 ? "critical" : "warning"
    const relevantPapers = findRelevantPapers(papers, ["rosacea", "vascular", "rojez", "inflammation", "barrera"], ["mejillas", "nariz"])
    const hasSensitivity = profile.sensitivity === "alta" || profile.sensitivity === "si"
    const text = hasSensitivity
      ? `Tu vascularidad elevada (${scores.vascularity}%) combinada con piel sensible sugiere reactividad vascular. Evitar triggers (alcohol, comida picante, temperaturas extremas) y usar cremas con centella asiatica puede reducir la rojez.`
      : `Se detecta rojez vascular significativa (${scores.vascularity}%). La evidencia sugiere que ingredientes como niacinamida, azelaic acid y proteccion solar estricta son la primera linea para controlar la vascularidad facial.`
    insights.push({
      title: "Reactividad vascular",
      text,
      evidence: relevantPapers.length > 0 ? cite(relevantPapers[0]) : "Gallo et al., 2018, J Am Acad Dermatol",
      zone: "nose",
      severity,
    })
  }

  // Sort by severity priority: critical > warning > info
  const severityOrder: Record<string, number> = { critical: 0, warning: 1, info: 2 }
  insights.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity])

  // Max 6 insights
  return insights.slice(0, 6)
}
