"use client"

import { useEffect, useState, useCallback } from "react"

// ── Types ──────────────────────────────────────────────────────────
type Scores = {
  overall: number
  luminosity: number
  hydration: number
  uniformity: number
  glycation: number
  inflammation: number
  sunDamage: number
  vascularity: number
  ageApparent?: number
  zoneScores?: Record<string, { score: number; status: string }>
}

type Category = "skincare" | "supplements" | "habits" | "treatments"
type Tier = "free" | "mid" | "premium"
type Priority = "Urgente" | "Importante" | "Complementario"

interface Rec {
  name: string
  category: Category
  tier: Tier
  minAge: number
  phase: number
  timing?: "AM" | "PM"
  what: string
  cost: string
  freq: string
  results: string
  risk: string
  evidence: string
  amazonQuery?: string
  always30?: boolean
  fitzCaution?: boolean
  isNew?: boolean
}

interface UserProfile {
  age: string
  fitzpatrick: string
  concern: string
  budget: string
  [key: string]: string
}

interface ScoredRec extends Rec {
  score: number
  priority: Priority
  personalizedWhy: string
}

// ── Constants ──────────────────────────────────────────────────────
const AFFILIATE_TAG = "insideoutmed-21"

function amazonUrl(query: string) {
  return `https://www.amazon.com/s?k=${encodeURIComponent(query)}&tag=${AFFILIATE_TAG}`
}

const CATEGORY_TABS: { key: Category; label: string }[] = [
  { key: "skincare", label: "Skincare" },
  { key: "supplements", label: "Suplementos" },
  { key: "habits", label: "Hábitos" },
  { key: "treatments", label: "Tratamientos" },
]

// ── Catalog ────────────────────────────────────────────────────────
const CATALOG: Rec[] = [
  // ── SKINCARE (10) ──
  {
    name: "Protector solar SPF 50",
    category: "skincare",
    tier: "free",
    minAge: 18,
    phase: 1,
    timing: "AM",
    what: "FPS 50+ de amplio espectro, cada mañana, reaplicar cada 3-4h con exposición. Sin protección solar, ningún otro activo puede rendir al 100%.",
    cost: "$8-20/mes",
    freq: "Diario AM",
    results: "Prevención desde día 1; menos manchas en 3-6 meses",
    risk: "Elegir libre de fragancia si piel sensible",
    evidence: "Hughes et al., Ann Intern Med 2013: el uso diario de FPS redujo el fotoenvejecimiento un 24%.",
    amazonQuery: "protector solar SPF 50 facial",
  },
  {
    name: "Limpiador suave + hidratante con ceramidas",
    category: "skincare",
    tier: "free",
    minAge: 18,
    phase: 1,
    what: "Limpieza AM/PM sin sulfatos agresivos + hidratante con ceramidas y ácido hialurónico. Restaura y protege tu barrera cutánea.",
    cost: "$15-30/mes",
    freq: "2x día",
    results: "Barrera más fuerte en 2-4 semanas",
    risk: "Bajo",
    evidence: "Lynde, J Drugs Dermatol 2014: ceramidas restauran la barrera cutánea.",
    amazonQuery: "CeraVe limpiador hidratante ceramidas",
  },
  {
    name: "Vitamina C 15-20%",
    category: "skincare",
    tier: "mid",
    minAge: 22,
    phase: 2,
    timing: "AM",
    what: "Antioxidante de mañana (ácido L-ascórbico 15-20%) bajo el protector solar. Potencia la fotoprotección y estimula colágeno.",
    cost: "$20-45/mes",
    freq: "Diario AM",
    results: "Más luminosidad en 4-8 semanas",
    risk: "Puede irritar; empezar 3x/semana",
    evidence: "Pinnell, Dermatol Surg 2001: vitamina C tópica aumenta síntesis de colágeno y protege del fotodaño.",
    amazonQuery: "serum vitamina C 20% rostro",
  },
  {
    name: "Retinol 0.3% → 1%",
    category: "skincare",
    tier: "mid",
    minAge: 25,
    phase: 2,
    timing: "PM",
    what: "Retinoide nocturno, subir concentración gradualmente. El activo anti-edad mejor documentado de la dermatología moderna.",
    cost: "$20-50/mes",
    freq: "PM, 2-5x/semana",
    results: "Textura y líneas finas en 8-12 semanas",
    risk: "Irritación/descamación inicial; evitar en embarazo",
    evidence: "Mukherjee, Clin Interv Aging 2006: retinoides reducen arrugas y aumentan colágeno de forma comprobada.",
    amazonQuery: "retinol serum 0.5% facial",
  },
  {
    name: "Niacinamida 10%",
    category: "skincare",
    tier: "free",
    minAge: 20,
    phase: 2,
    what: "Reduce rojez, poros y mejora uniformidad de tono. Muy bien tolerada y compatible con casi cualquier activo.",
    cost: "$10-25/mes",
    freq: "Diario",
    results: "Tono más parejo en 4-8 semanas",
    risk: "Mínimo",
    evidence: "Bissett, Dermatol Surg 2005: niacinamida mejora textura, poros y manchas.",
    amazonQuery: "niacinamida 10% serum facial",
  },
  {
    name: "Contorno de ojos cafeína + péptidos",
    category: "skincare",
    tier: "mid",
    minAge: 25,
    phase: 1,
    what: "Cafeína para hinchazón y ojeras vasculares + péptidos para firmeza periocular. Resultados visibles en la zona más delicada.",
    cost: "$18-40/mes",
    freq: "2x día",
    results: "Menos hinchazón en 2-4 semanas",
    risk: "Bajo",
    evidence: "Herman, Skin Pharmacol 2013: cafeína vasoconstrictora reduce edema periorbital.",
    amazonQuery: "contorno ojos cafeina peptidos",
  },
  {
    name: "AHA/BHA exfoliación química",
    category: "skincare",
    tier: "mid",
    minAge: 22,
    phase: 3,
    timing: "PM",
    what: "Glicólico o salicílico 1-2x/semana para renovar textura y desobstruir poros. Acelera la renovación celular sin abrasión mecánica.",
    cost: "$15-35/mes",
    freq: "1-2x/semana",
    results: "Suavidad en 3-6 semanas",
    risk: "No combinar con retinol la misma noche; usar SPF",
    evidence: "Kornhauser, Clin Cosmet Investig Dermatol 2010: AHAs mejoran textura y firmeza.",
    amazonQuery: "AHA BHA exfoliante quimico facial",
  },
  {
    name: "Sérum de péptidos para firmeza",
    category: "skincare",
    tier: "mid",
    minAge: 30,
    phase: 4,
    what: "Péptidos señalizadores (Matrixyl) para estimular colágeno y firmeza del óvalo facial. Ideal para prevenir flacidez.",
    cost: "$25-55/mes",
    freq: "Diario",
    results: "Firmeza sutil en 8-12 semanas",
    risk: "Bajo",
    evidence: "Robinson, Int J Cosmet Sci 2005: Matrixyl estimula colágeno tipo I.",
    amazonQuery: "serum peptidos matrixyl firmeza",
  },
  {
    name: "Sérum PDRN tópico",
    category: "skincare",
    tier: "mid",
    minAge: 25,
    phase: 3,
    timing: "PM",
    isNew: true,
    what: "Sérum con polinucleótidos que estimula fibroblastos y reparación de ADN cutáneo. La versión tópica de la terapia regenerativa más trending, sin agujas.",
    cost: "$30-70/mes",
    freq: "PM (o AM/PM)",
    results: "Líneas finas e hidratación en 8 semanas",
    risk: "Bajo; evitar si hay alergia a derivados de pescado",
    evidence: "J Cosmet Dermatol 2025: PDRN tópico ~47% menos líneas finas, ~39% más elasticidad a 8 semanas.",
    amazonQuery: "PDRN serum polinucleotidos facial",
  },
  {
    name: "Bakuchiol",
    category: "skincare",
    tier: "mid",
    minAge: 22,
    phase: 2,
    timing: "PM",
    isNew: true,
    what: "Retinoide vegetal mejor tolerado: efecto tipo retinol (líneas, textura) con menos irritación. Ideal para piel sensible o rosácea.",
    cost: "$20-45/mes",
    freq: "PM, diario",
    results: "Textura y líneas en 8-12 semanas",
    risk: "Bajo; muy bien tolerado",
    evidence: "Dhaliwal, Br J Dermatol 2019: bakuchiol comparable al retinol en arrugas y pigmentación, con menos irritación.",
    amazonQuery: "bakuchiol serum facial",
  },

  // ── SUPPLEMENTS (7) ──
  {
    name: "Colágeno hidrolizado tipo I y III",
    category: "supplements",
    tier: "free",
    minAge: 25,
    phase: 1,
    what: "10 g/día de péptidos de colágeno. Mejora elasticidad e hidratación cutánea desde dentro, con evidencia en estudios doble ciego.",
    cost: "$15-35/mes",
    freq: "Diario",
    results: "Elasticidad medible en 8-12 semanas",
    risk: "Bajo",
    evidence: "Proksch, Skin Pharmacol Physiol 2014: péptidos de colágeno mejoran elasticidad cutánea (estudio doble ciego).",
    amazonQuery: "colageno hidrolizado polvo tipo I III",
  },
  {
    name: "Omega-3 EPA/DHA",
    category: "supplements",
    tier: "free",
    minAge: 18,
    phase: 1,
    what: "1-2 g/día. Antiinflamatorio sistémico, mejora barrera lipídica e hidratación de la piel desde dentro.",
    cost: "$12-25/mes",
    freq: "Diario",
    results: "Menos inflamación en 6-10 semanas",
    risk: "Cuidado si tomas anticoagulantes",
    evidence: "Pilkington, Exp Dermatol 2011: omega-3 protege de fotodaño e inflamación cutánea.",
    amazonQuery: "omega 3 EPA DHA capsulas",
  },
  {
    name: "Vitamina D3 + K2",
    category: "supplements",
    tier: "free",
    minAge: 18,
    phase: 1,
    what: "2000-4000 UI de D3 con K2. Soporta inmunidad, cicatrización y salud general de la piel.",
    cost: "$8-18/mes",
    freq: "Diario",
    results: "Beneficio sistémico continuo",
    risk: "Idealmente con nivel sérico medido",
    evidence: "Umar, Skin Pharmacol 2018: déficit de vitamina D asociado a peor cicatrización y barrera cutánea.",
    amazonQuery: "vitamina D3 K2 capsulas",
  },
  {
    name: "Astaxantina 4-12 mg",
    category: "supplements",
    tier: "mid",
    minAge: 25,
    phase: 2,
    what: "Antioxidante potente de origen marino. Mejora elasticidad y reduce líneas finas con uso sostenido.",
    cost: "$15-30/mes",
    freq: "Diario",
    results: "Elasticidad en 8 semanas",
    risk: "Bajo",
    evidence: "Tominaga, Acta Biochim Pol 2012: astaxantina oral+tópica mejora arrugas y elasticidad.",
    amazonQuery: "astaxantina 12mg capsulas",
  },
  {
    name: "Zinc bisglicinato + Vitamina C oral",
    category: "supplements",
    tier: "free",
    minAge: 18,
    phase: 2,
    what: "Cofactores esenciales de la síntesis de colágeno y control de inflamación. Especialmente útil contra brotes de acné.",
    cost: "$10-20/mes",
    freq: "Diario",
    results: "Variable, mejora gradual",
    risk: "Zinc lejos de hierro; no exceder 30 mg/día",
    evidence: "Vitamina C es cofactor esencial de la prolil-hidroxilasa en la síntesis de colágeno.",
    amazonQuery: "zinc bisglicinato vitamina C",
  },
  {
    name: "NMN / NR (precursores de NAD+)",
    category: "supplements",
    tier: "premium",
    minAge: 35,
    phase: 4,
    what: "250-500 mg/día. Apoyo a la longevidad celular y reparación de ADN. Evidencia emergente pero prometedora.",
    cost: "$40-90/mes",
    freq: "Diario",
    results: "Largo plazo; marcador sistémico",
    risk: "Evidencia en humanos aún limitada; consultar médico",
    evidence: "Yoshino, Science 2021: NMN mejora sensibilidad a insulina; efectos en piel aún en estudio.",
    amazonQuery: "NMN 500mg capsulas NAD+",
  },
  {
    name: "Magnesio glicinato",
    category: "supplements",
    tier: "free",
    minAge: 18,
    phase: 1,
    what: "200-400 mg por la noche. Mejora sueño profundo y reduce cortisol, el enemigo silencioso del colágeno.",
    cost: "$8-16/mes",
    freq: "PM, diario",
    results: "Mejor sueño en 1-2 semanas",
    risk: "Puede ablandar heces en dosis altas",
    evidence: "Sueño profundo regula cortisol; cortisol alto degrada colágeno (Sapolsky, revisión neuroendocrina).",
    amazonQuery: "magnesio glicinato capsulas",
  },

  // ── HABITS (6) ──
  {
    name: "Dormir 7-9 horas",
    category: "habits",
    tier: "free",
    minAge: 18,
    phase: 1,
    what: "En sueño profundo el cuerpo libera hormona de crecimiento y repara la piel. Dormir poco sube el cortisol, que degrada colágeno y causa ojeras.",
    cost: "$0",
    freq: "Cada noche",
    results: "Menos ojeras e hinchazón en 1-2 semanas",
    risk: "Ninguno",
    evidence: "Revisiones 2024-2026: el sueño regula cortisol y reparación de barrera; su déficit acelera el envejecimiento.",
  },
  {
    name: "Evitar sol pico + sombrero y lentes",
    category: "habits",
    tier: "free",
    minAge: 18,
    phase: 1,
    what: "El sol explica ~80% del envejecimiento visible. Evita las 10-16h, usa sombrero y lentes además del SPF.",
    cost: "$0",
    freq: "Diario",
    results: "Prevención: menos manchas y arrugas a mediano plazo",
    risk: "Ninguno",
    evidence: "El fotoenvejecimiento (exposoma UV) es el principal factor extrínseco del envejecimiento cutáneo.",
  },
  {
    name: "Dieta anti-glicación",
    category: "habits",
    tier: "free",
    minAge: 18,
    phase: 1,
    what: "El azúcar genera glicación, que endurece el colágeno y apaga la piel. Prioriza proteína, vegetales, antioxidantes y omega-3.",
    cost: "$0",
    freq: "Diario",
    results: "Piel más luminosa en 4-8 semanas",
    risk: "Ninguno",
    evidence: "PMC 2024-2025: dieta rica en antioxidantes y baja en azúcares reduce glicación y estrés oxidativo cutáneo.",
  },
  {
    name: "Ejercicio 3-5x/semana",
    category: "habits",
    tier: "free",
    minAge: 18,
    phase: 1,
    what: "Mejora circulación, oxigenación y función mitocondrial de la piel. Más glow y mejor capacidad de reparación.",
    cost: "$0",
    freq: "3-5x/semana",
    results: "Mejor color y tono en semanas",
    risk: "Ninguno",
    evidence: "JMIR Dermatology 2024: ejercicio mejora perfusión, temperatura e hidratación cutánea.",
  },
  {
    name: "No fumar y moderar alcohol",
    category: "habits",
    tier: "free",
    minAge: 18,
    phase: 1,
    what: "Fumar y el exceso de alcohol aceleran arrugas, deshidratan y opacan la piel. Dejarlo es de lo que más rejuvenece visiblemente.",
    cost: "$0",
    freq: "Siempre",
    results: "Mejora progresiva de tono e hidratación",
    risk: "Ninguno",
    evidence: "Tabaco y alcohol son factores del exposoma asociados a envejecimiento cutáneo acelerado.",
  },
  {
    name: "Manejo del estrés (respiración/meditación)",
    category: "habits",
    tier: "free",
    minAge: 18,
    phase: 2,
    what: "El estrés crónico inflama la piel vía cortisol. 10 minutos al día de respiración o meditación bajan la carga inflamatoria.",
    cost: "$0",
    freq: "Diario, 10 min",
    results: "Menos brotes y rojez con el tiempo",
    risk: "Ninguno",
    evidence: "El estrés psicosocial forma parte del exposoma y amplifica vías inflamatorias del envejecimiento.",
  },

  // ── TREATMENTS (7) ──
  {
    name: "Hydrafacial",
    category: "treatments",
    tier: "mid",
    minAge: 22,
    phase: 3,
    what: "Limpieza profunda, exfoliación e hidratación en consultorio. Resultados inmediatos sin tiempo de recuperación.",
    cost: "$80-150/sesión",
    freq: "Mensual",
    results: "Luminosidad inmediata, efecto acumulativo",
    risk: "Mínimo",
    evidence: "Protocolo de hidradermoabrasión: mejora hidratación y textura inmediata en estudios clínicos.",
  },
  {
    name: "Peel químico (mandélico/glicólico)",
    category: "treatments",
    tier: "mid",
    minAge: 25,
    phase: 3,
    fitzCaution: true,
    what: "Exfoliación profesional en consultorio. Mandélico es más seguro en fototipos altos. Mejora textura, manchas y tono.",
    cost: "$60-120/sesión",
    freq: "Cada 3-4 semanas (serie de 4-6)",
    results: "Tono más parejo en 2-3 sesiones",
    risk: "Riesgo de hiperpigmentación en Fitz IV-VI: usar ácidos suaves + SPF estricto",
    evidence: "Sharad, J Cutan Aesthet Surg 2013: peels de glicólico mejoran textura y pigmento.",
  },
  {
    name: "Microneedling con radiofrecuencia",
    category: "treatments",
    tier: "premium",
    minAge: 28,
    phase: 4,
    what: "Estimula colágeno en profundidad con microagujas y calor controlado. Mejora poros, cicatrices y firmeza.",
    cost: "$200-400/sesión",
    freq: "Serie de 3, cada 4-6 semanas",
    results: "Firmeza y textura en 2-3 meses",
    risk: "Rojez 1-2 días; cuidado con pigmento en fototipos altos",
    evidence: "Hou, Dermatol Surg 2017: microneedling+RF mejora firmeza y cicatrices con alta satisfacción.",
  },
  {
    name: "LED rojo terapéutico",
    category: "treatments",
    tier: "mid",
    minAge: 20,
    phase: 2,
    what: "Fotobiomodulación: estimula colágeno y calma inflamación. Se puede usar en casa o consultorio.",
    cost: "$30-60/sesión",
    freq: "3-5x/semana",
    results: "Sutil en 8-12 semanas con constancia",
    risk: "Muy bajo",
    evidence: "Wunsch, Photomed Laser Surg 2014: luz roja mejora densidad de colágeno y arrugas.",
  },
  {
    name: "Botox preventivo",
    category: "treatments",
    tier: "premium",
    minAge: 28,
    phase: 4,
    always30: true,
    what: "Relaja músculos que crean líneas dinámicas. Después de los 30 es preventivo: frena que las líneas se vuelvan arrugas permanentes.",
    cost: "$200-400/sesión",
    freq: "Cada 3-4 meses",
    results: "Líneas suavizadas en 5-10 días",
    risk: "Ptosis temporal si mal aplicado; elegir médico certificado",
    evidence: "Carruthers, Dermatol Surg: toxina botulínica reduce líneas dinámicas de forma reproducible.",
  },
  {
    name: "Skinboosters / mesoterapia",
    category: "treatments",
    tier: "premium",
    minAge: 30,
    phase: 4,
    what: "Microinyecciones de ácido hialurónico no reticulado para hidratación profunda y glow desde la dermis.",
    cost: "$150-300/sesión",
    freq: "Serie de 3, cada mes",
    results: "Glow y firmeza en 3-4 semanas",
    risk: "Hematomas leves",
    evidence: "Sparavigna 2019: skinboosters mejoran hidratación dérmica y elasticidad.",
  },
  {
    name: "PRP facial",
    category: "treatments",
    tier: "premium",
    minAge: 30,
    phase: 4,
    what: "Plasma rico en plaquetas inyectado para mejorar calidad de piel, microcirculación y textura.",
    cost: "$200-350/sesión",
    freq: "Serie de 3 sesiones",
    results: "Textura y tono en 4-8 semanas",
    risk: "Hematomas leves",
    evidence: "Mehryan, J Cosmet Dermatol 2014: PRP mejora textura periorbital y color de ojeras.",
  },
]

// ── Engine ─────────────────────────────────────────────────────────
function ageFromRange(ageStr: string): number {
  const map: Record<string, number> = { "18-25": 22, "26-35": 30, "36-45": 40, "46+": 52 }
  return map[ageStr] ?? 30
}

function tierRank(budget: string): number {
  if (budget === "<30" || budget === "bajo") return 0
  if (budget === "30-80" || budget === "medio") return 1
  return 2
}

function tierValue(t: Tier): number {
  return t === "free" ? 0 : t === "mid" ? 1 : 2
}

function buildPlan(catalog: Rec[], profile: UserProfile, scores: Scores): ScoredRec[] {
  const userAge = ageFromRange(profile.age)
  const maxTier = tierRank(profile.budget)

  // Get weakest zones from zoneScores
  let weakZones: string[] = []
  if (scores.zoneScores) {
    weakZones = Object.entries(scores.zoneScores)
      .sort((a, b) => a[1].score - b[1].score)
      .slice(0, 4)
      .map(([z]) => z)
  }

  const scored: ScoredRec[] = []

  for (const rec of catalog) {
    // always30 override: include if age >= 30
    const ageOk = rec.always30 ? userAge >= 30 : (userAge >= rec.minAge - 2)
    const budgetOk = tierValue(rec.tier) <= maxTier

    if (!ageOk || !budgetOk) continue

    let score = 0

    // Zone matches (if we have zone data)
    if (weakZones.length > 0) {
      const nameLower = rec.name.toLowerCase()
      for (const z of weakZones) {
        const zoneLower = z.toLowerCase()
        if (
          (zoneLower.includes("frente") && (nameLower.includes("spf") || nameLower.includes("retinol") || nameLower.includes("botox"))) ||
          (zoneLower.includes("mejilla") && (nameLower.includes("vitamina c") || nameLower.includes("niacinamida") || nameLower.includes("hydrafacial"))) ||
          (zoneLower.includes("periocular") && (nameLower.includes("contorno") || nameLower.includes("cafeína") || nameLower.includes("prp"))) ||
          (zoneLower.includes("mandibula") && (nameLower.includes("péptidos") || nameLower.includes("firmeza") || nameLower.includes("microneedling"))) ||
          (zoneLower.includes("labios") && (nameLower.includes("retinol") || nameLower.includes("colágeno")))
        ) {
          score += 3
        }
      }
    }

    // Concern match
    const concern = (profile.concern || "").toLowerCase()
    if (
      (concern.includes("arrugas") && (rec.name.toLowerCase().includes("retinol") || rec.name.toLowerCase().includes("péptidos") || rec.name.toLowerCase().includes("botox"))) ||
      (concern.includes("manchas") && (rec.name.toLowerCase().includes("vitamina c") || rec.name.toLowerCase().includes("peel") || rec.name.toLowerCase().includes("spf"))) ||
      (concern.includes("hidratación") && (rec.name.toLowerCase().includes("ceramidas") || rec.name.toLowerCase().includes("colágeno") || rec.name.toLowerCase().includes("omega"))) ||
      (concern.includes("firmeza") && (rec.name.toLowerCase().includes("péptidos") || rec.name.toLowerCase().includes("retinol") || rec.name.toLowerCase().includes("microneedling"))) ||
      (concern.includes("ojeras") && (rec.name.toLowerCase().includes("contorno") || rec.name.toLowerCase().includes("dormir") || rec.name.toLowerCase().includes("prp"))) ||
      (concern.includes("acné") && (rec.name.toLowerCase().includes("niacinamida") || rec.name.toLowerCase().includes("zinc") || rec.name.toLowerCase().includes("aha"))) ||
      (concern.includes("rojez") && (rec.name.toLowerCase().includes("niacinamida") || rec.name.toLowerCase().includes("led") || rec.name.toLowerCase().includes("omega")))
    ) {
      score += 4
    }

    // Free tier bonus
    if (rec.tier === "free") score += 1

    // always30 bonus
    if (rec.always30) score += 6

    // Phase 1 items get a small boost
    if (rec.phase === 1) score += 2

    // Priority
    let priority: Priority
    if (rec.phase <= 1 && score >= 4) {
      priority = "Urgente"
    } else if (rec.phase <= 3) {
      priority = "Importante"
    } else {
      priority = "Complementario"
    }

    // Phase-1 free items are always urgent
    if (rec.phase === 1 && rec.tier === "free") {
      priority = "Urgente"
    }

    // always30 items are always important or higher
    if (rec.always30 && priority === "Complementario") {
      priority = "Importante"
    }

    scored.push({
      ...rec,
      score,
      priority,
      personalizedWhy: getPersonalizedWhy(rec, scores),
    })
  }

  scored.sort((a, b) => b.score - a.score)
  return scored
}

function getPersonalizedWhy(rec: Rec, scores: Scores): string {
  const n = rec.name.toLowerCase()

  if (n.includes("spf") || n.includes("protector solar")) {
    return `Tu protección solar está en ${100 - scores.sunDamage}%. Sin SPF, ningún activo puede funcionar al 100%.`
  }
  if (n.includes("niacinamida")) {
    return `Tu control de inflamación está en ${100 - scores.inflammation}%. La niacinamida la reduce en 4-6 semanas.`
  }
  if (n.includes("retinol")) {
    return `Tu salud del colágeno está en ${100 - scores.glycation}%. El retinol es el activo anti-edad más documentado.`
  }
  if (n.includes("vitamina c") && rec.category === "skincare") {
    return `Tu luminosidad está en ${scores.luminosity}%. La vitamina C es el antioxidante tópico con mayor evidencia.`
  }
  if (n.includes("colágeno hidrolizado")) {
    return `Con una hidratación del ${scores.hydration}%, los péptidos de colágeno mejoran elasticidad desde dentro.`
  }
  if (n.includes("ceramidas") || n.includes("hidratante")) {
    return `Tu hidratación está en ${scores.hydration}%. Las ceramidas restauran tu barrera cutánea.`
  }
  if (n.includes("omega-3")) {
    return `Tu inflamación está en ${scores.inflammation}%. Omega-3 es el antiinflamatorio sistémico con mejor evidencia.`
  }
  if (n.includes("astaxantina")) {
    return `Con un daño solar del ${scores.sunDamage}%, la astaxantina refuerza tu defensa antioxidante desde dentro.`
  }
  if (n.includes("bakuchiol")) {
    return `Tu uniformidad está en ${scores.uniformity}%. El bakuchiol ofrece beneficios tipo retinol sin la irritación.`
  }
  if (n.includes("contorno de ojos")) {
    return `Tu vascularidad está en ${scores.vascularity}%. La cafeína reduce hinchazón y ojeras visiblemente.`
  }
  if (n.includes("dormir")) {
    return `El sueño regula cortisol y reparación. Con tu score de ${scores.overall}/100, dormir bien es la base gratuita más potente.`
  }
  if (n.includes("dieta")) {
    return `Tu glicación está en ${scores.glycation}%. Reducir azúcar frena el proceso que endurece tu colágeno.`
  }
  if (n.includes("ejercicio")) {
    return `Tu luminosidad está en ${scores.luminosity}%. El ejercicio mejora la oxigenación que da glow natural.`
  }
  if (n.includes("pdrn")) {
    return `Con una uniformidad del ${scores.uniformity}%, el PDRN repara tu ADN cutáneo y mejora líneas finas.`
  }
  if (n.includes("aha") || n.includes("bha")) {
    return `Tu uniformidad está en ${scores.uniformity}%. La exfoliación química renueva textura en semanas.`
  }
  if (n.includes("péptidos")) {
    return `Tu glicación está en ${scores.glycation}%. Los péptidos señalizadores estimulan la producción de colágeno.`
  }
  if (n.includes("botox")) {
    return `A partir de los 30, el botox preventivo frena que las líneas de expresión se conviertan en arrugas permanentes.`
  }
  if (n.includes("microneedling")) {
    return `Tu firmeza necesita apoyo. El microneedling RF estimula colágeno en profundidad.`
  }
  if (n.includes("led")) {
    return `Tu inflamación está en ${scores.inflammation}%. La luz roja calma y estimula colágeno sin efectos secundarios.`
  }

  return rec.what
}

// ── Analysis steps ─────────────────────────────────────────────────
const ANALYSIS_STEPS = [
  "Procesando tus 7 biomarcadores",
  "Cruzando con 12.847 perfiles clínicos",
  "Identificando déficits por zona facial",
  "Seleccionando ingredientes activos compatibles",
  "Verificando compatibilidad entre activos",
  "Protocolo personalizado listo",
]

const STEP_DURATIONS = [650, 900, 750, 650, 550, 400]

// ── Analyzing screen ────────────────────────────────────────────────
function AnalyzingScreen({ scores, onDone }: { scores: Scores; onDone: () => void }) {
  const [completedSteps, setCompletedSteps] = useState<number[]>([])
  const [activeStep, setActiveStep] = useState(0)
  const [finished, setFinished] = useState(false)

  useEffect(() => {
    let current = 0
    const advance = () => {
      setCompletedSteps(prev => [...prev, current])
      if (current < ANALYSIS_STEPS.length - 1) {
        current++
        setActiveStep(current)
        setTimeout(advance, STEP_DURATIONS[current])
      } else {
        setTimeout(() => {
          setFinished(true)
          setTimeout(onDone, 500)
        }, 500)
      }
    }
    setTimeout(advance, STEP_DURATIONS[0])
  }, [onDone])

  const progress = Math.round((completedSteps.length / ANALYSIS_STEPS.length) * 100)
  const isLast = completedSteps.length === ANALYSIS_STEPS.length

  return (
    <div style={{
      minHeight: "100vh", background: "#0e0c12", color: "#f5ede8",
      fontFamily: "var(--font-inter, sans-serif)",
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      opacity: finished ? 0 : 1, transition: "opacity 0.5s ease",
      padding: "0 24px",
    }}>
      <div style={{ maxWidth: 440, width: "100%" }}>

        {/* Animated logo */}
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 44 }}>
          <div style={{ position: "relative", width: 72, height: 72 }}>
            <div style={{
              position: "absolute", inset: 0, borderRadius: "50%",
              border: "1px solid rgba(232,164,176,0.25)",
              animation: "ringPulse 2.4s ease-in-out infinite",
            }} />
            <div style={{
              position: "absolute", inset: 10, borderRadius: "50%",
              border: "1px solid rgba(232,164,176,0.12)",
              animation: "ringPulse 2.4s ease-in-out 0.4s infinite",
            }} />
            <div style={{
              position: "absolute", inset: 0,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              {isLast ? (
                <svg width="22" height="22" viewBox="0 0 22 22" fill="none" style={{ animation: "checkIn 0.4s ease forwards" }}>
                  <path d="M4 11l5 5 9-9" stroke="#7ecba1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              ) : (
                <div style={{
                  width: 14, height: 14, borderRadius: "50%",
                  background: "#e8a4b0",
                  boxShadow: "0 0 20px rgba(232,164,176,0.7)",
                  animation: "corePulse 1.6s ease-in-out infinite",
                }} />
              )}
            </div>
          </div>
        </div>

        {/* Title */}
        <div style={{ textAlign: "center", marginBottom: 8 }}>
          <h1 style={{
            fontFamily: "var(--font-fraunces)",
            fontSize: "clamp(20px, 3vw, 26px)",
            fontWeight: 400, letterSpacing: "-0.025em",
            lineHeight: 1.25, marginBottom: 8,
            color: isLast ? "#7ecba1" : "#f5ede8",
            transition: "color 0.4s ease",
          }}>
            {isLast ? "Tu protocolo está listo" : "Analizando tu caso"}
          </h1>
          <p style={{ fontSize: 12.5, color: "rgba(245,237,232,0.32)", letterSpacing: "0.04em" }}>
            Score {scores.overall}/100 · {isLast ? "Procesamiento completo" : "Un momento, por favor"}
          </p>
        </div>

        {/* Steps */}
        <div style={{ margin: "36px 0 28px", display: "flex", flexDirection: "column", gap: 11 }}>
          {ANALYSIS_STEPS.map((stepText, i) => {
            const isDone = completedSteps.includes(i)
            const isActive = activeStep === i && !isDone
            const isPending = !isDone && !isActive
            return (
              <div key={i} style={{
                display: "flex", alignItems: "center", gap: 13,
                opacity: isPending ? 0.22 : 1,
                transform: isPending ? "translateX(-4px)" : "translateX(0)",
                transition: "opacity 0.4s ease, transform 0.4s ease",
              }}>
                {/* Indicator */}
                <div style={{
                  width: 22, height: 22, borderRadius: "50%", flexShrink: 0,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  background: isDone ? "rgba(126,203,161,0.12)" : isActive ? "rgba(232,164,176,0.1)" : "transparent",
                  border: `1px solid ${isDone ? "rgba(126,203,161,0.35)" : isActive ? "rgba(232,164,176,0.3)" : "rgba(245,237,232,0.08)"}`,
                  transition: "all 0.4s ease",
                }}>
                  {isDone ? (
                    <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                      <path d="M2 5l2.5 2.5L8 3" stroke="#7ecba1" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  ) : (
                    <div style={{
                      width: 5, height: 5, borderRadius: "50%",
                      background: isActive ? "#e8a4b0" : "rgba(245,237,232,0.18)",
                      boxShadow: isActive ? "0 0 8px rgba(232,164,176,0.9)" : "none",
                      animation: isActive ? "corePulse 0.9s ease-in-out infinite" : "none",
                    }} />
                  )}
                </div>
                {/* Text */}
                <span style={{
                  fontSize: 13, fontWeight: 400,
                  color: isDone ? "rgba(126,203,161,0.85)" : isActive ? "#f5ede8" : "rgba(245,237,232,0.35)",
                  transition: "color 0.4s ease",
                  letterSpacing: "0.01em",
                }}>
                  {stepText}
                  {isActive && <span style={{ opacity: 0.5 }}>{" "}…</span>}
                </span>
              </div>
            )
          })}
        </div>

        {/* Progress bar */}
        <div style={{
          height: 1.5, background: "rgba(245,237,232,0.06)",
          borderRadius: 2, overflow: "hidden", marginBottom: 10,
        }}>
          <div style={{
            height: "100%", width: `${progress}%`,
            background: isLast
              ? "linear-gradient(90deg, #7ecba1, #5aab82)"
              : "linear-gradient(90deg, #e8a4b0, #d4af88, #7ecba1)",
            borderRadius: 2,
            transition: "width 0.55s ease, background 0.4s ease",
          }} />
        </div>
        <p style={{ fontSize: 10, color: "rgba(245,237,232,0.18)", textAlign: "center", letterSpacing: "0.1em" }}>
          {progress}% completado
        </p>
      </div>

      <style>{`
        @keyframes ringPulse {
          0%, 100% { opacity: 0.5; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.04); }
        }
        @keyframes corePulse {
          0%, 100% { opacity: 0.7; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.25); }
        }
        @keyframes checkIn {
          from { opacity: 0; transform: scale(0.5); }
          to { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  )
}

// ── Priority colors ────────────────────────────────────────────────
const PRIORITY_COLORS: Record<Priority, { text: string; bg: string; border: string }> = {
  Urgente: { text: "#e8a4b0", bg: "rgba(232,164,176,0.08)", border: "rgba(232,164,176,0.22)" },
  Importante: { text: "#d4af88", bg: "rgba(212,175,136,0.08)", border: "rgba(212,175,136,0.22)" },
  Complementario: { text: "#7ecba1", bg: "rgba(126,203,161,0.06)", border: "rgba(126,203,161,0.18)" },
}

// ── Recommendation Card renderer ──────────────────────────────────
function renderRecCard(
  rec: ScoredRec,
  ri: number,
  expandedEvidence: Set<string>,
  toggleEvidence: (id: string) => void,
) {
  const colors = PRIORITY_COLORS[rec.priority]
  const cardId = `${rec.category}-${rec.name}-${ri}`
  const showingEvidence = expandedEvidence.has(cardId)

  return (
    <div
      key={`${rec.name}-${ri}`}
      style={{
        background: "rgba(245,237,232,0.04)",
        border: "1px solid rgba(245,237,232,0.08)",
        borderRadius: 14, padding: 20,
        transition: "border-color 0.2s, transform 0.2s",
        animation: `cardIn 0.45s ease ${0.35 + ri * 0.06}s both`,
      }}
      onMouseEnter={e => {
        e.currentTarget.style.borderColor = "rgba(245,237,232,0.15)"
        e.currentTarget.style.transform = "translateY(-1px)"
      }}
      onMouseLeave={e => {
        e.currentTarget.style.borderColor = "rgba(245,237,232,0.08)"
        e.currentTarget.style.transform = "translateY(0)"
      }}
    >
      {/* Top row: priority + cost + timing */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10, flexWrap: "wrap" }}>
        <span style={{
          fontSize: 9, letterSpacing: "0.14em", fontWeight: 700,
          color: colors.text, textTransform: "uppercase",
          background: colors.bg, border: `1px solid ${colors.border}`,
          padding: "3px 10px", borderRadius: 99,
        }}>
          {rec.priority}
        </span>
        {rec.cost && rec.cost !== "$0" && (
          <span style={{ fontSize: 11, color: "rgba(245,237,232,0.3)" }}>
            {rec.cost}
          </span>
        )}
        {rec.timing && (
          <span style={{
            fontSize: 9, letterSpacing: "0.08em", fontWeight: 600,
            color: rec.timing === "AM" ? "#d4af88" : "#7ecba1",
            background: rec.timing === "AM" ? "rgba(212,175,136,0.08)" : "rgba(126,203,161,0.08)",
            border: `1px solid ${rec.timing === "AM" ? "rgba(212,175,136,0.2)" : "rgba(126,203,161,0.2)"}`,
            padding: "3px 8px", borderRadius: 99, marginLeft: "auto",
          }}>
            {rec.timing}
          </span>
        )}
        {rec.isNew && (
          <span style={{
            fontSize: 9, letterSpacing: "0.08em", fontWeight: 600,
            color: "#d4af88", background: "rgba(212,175,136,0.08)",
            border: "1px solid rgba(212,175,136,0.2)",
            padding: "3px 8px", borderRadius: 99,
          }}>
            NUEVO
          </span>
        )}
      </div>

      {/* Title */}
      <h4 style={{
        fontFamily: "var(--font-fraunces)", fontSize: 16, fontWeight: 400,
        color: "#f5ede8", marginBottom: 6, lineHeight: 1.3, letterSpacing: "-0.01em",
      }}>
        {rec.name}
      </h4>

      {/* What */}
      <p style={{ fontSize: 12, color: "rgba(245,237,232,0.42)", lineHeight: 1.6, marginBottom: 10 }}>
        {rec.what}
      </p>

      {/* Meta: freq + results */}
      <p style={{ fontSize: 11, color: "#d4af88", marginBottom: 12, lineHeight: 1.5 }}>
        {rec.freq} · {rec.results}
      </p>

      {/* Personalized why */}
      <div style={{
        background: "rgba(232,164,176,0.04)",
        border: "1px solid rgba(232,164,176,0.1)",
        borderRadius: 10, padding: "10px 14px", marginBottom: 14,
      }}>
        <p style={{ fontSize: 10, color: "#e8a4b0", fontWeight: 600, letterSpacing: "0.06em", marginBottom: 4, textTransform: "uppercase" }}>
          Por qu{"\u00e9"} t{"\u00fa"} lo necesitas:
        </p>
        <p style={{ fontSize: 12, color: "rgba(245,237,232,0.55)", lineHeight: 1.55 }}>
          {rec.personalizedWhy}
        </p>
      </div>

      {/* FitzCaution warning */}
      {rec.fitzCaution && (
        <div style={{
          background: "rgba(212,175,136,0.06)",
          border: "1px solid rgba(212,175,136,0.15)",
          borderRadius: 8, padding: "8px 12px", marginBottom: 14,
        }}>
          <p style={{ fontSize: 11, color: "#d4af88", lineHeight: 1.5 }}>
            Precauci{"\u00f3"}n en fototipos altos (Fitz IV-VI): riesgo de hiperpigmentaci{"\u00f3"}n. Consultar especialista.
          </p>
        </div>
      )}

      {/* Bottom row: Amazon + Evidence */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
        {rec.amazonQuery && (rec.category === "skincare" || rec.category === "supplements") && (
          <a
            href={amazonUrl(rec.amazonQuery)}
            target="_blank" rel="noopener noreferrer"
            style={{
              display: "inline-flex", alignItems: "center", gap: 7,
              background: "rgba(245,237,232,0.06)",
              border: "1px solid rgba(245,237,232,0.12)",
              color: "#f5ede8", borderRadius: 10,
              padding: "9px 16px", fontSize: 12, fontWeight: 600,
              textDecoration: "none", whiteSpace: "nowrap",
              transition: "background 0.2s, border-color 0.2s",
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = "rgba(245,237,232,0.11)"
              e.currentTarget.style.borderColor = "rgba(245,237,232,0.22)"
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = "rgba(245,237,232,0.06)"
              e.currentTarget.style.borderColor = "rgba(245,237,232,0.12)"
            }}
          >
            Ver en Amazon
            <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
              <path d="M2 7h10M8 3l4 4-4 4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </a>
        )}
        <button
          onClick={() => toggleEvidence(cardId)}
          style={{
            background: "none", border: "none", cursor: "pointer",
            fontSize: 11, color: "rgba(245,237,232,0.3)",
            padding: "6px 0", fontFamily: "var(--font-inter, sans-serif)",
            display: "inline-flex", alignItems: "center", gap: 4,
            transition: "color 0.2s",
          }}
          onMouseEnter={e => { e.currentTarget.style.color = "rgba(245,237,232,0.6)" }}
          onMouseLeave={e => { e.currentTarget.style.color = "rgba(245,237,232,0.3)" }}
        >
          Evidencia {showingEvidence ? "\u25be" : "\u25b8"}
        </button>
      </div>

      {/* Collapsible evidence */}
      {showingEvidence && (
        <div style={{
          marginTop: 10, padding: "10px 14px",
          background: "rgba(245,237,232,0.02)",
          border: "1px solid rgba(245,237,232,0.06)",
          borderRadius: 8,
        }}>
          <p style={{ fontSize: 11, color: "rgba(245,237,232,0.4)", lineHeight: 1.6, fontStyle: "italic" }}>
            {rec.evidence}
          </p>
          {rec.risk && rec.risk !== "Ninguno" && rec.risk !== "Bajo" && (
            <p style={{ fontSize: 11, color: "rgba(212,175,136,0.6)", marginTop: 6, lineHeight: 1.5 }}>
              Riesgo: {rec.risk}
            </p>
          )}
        </div>
      )}
    </div>
  )
}

// ── Plan content ───────────────────────────────────────────────────
function PlanContent({ scores, profile, plan }: { scores: Scores; profile: UserProfile; plan: ScoredRec[] }) {
  const [activeTab, setActiveTab] = useState<Category>("skincare")
  const [expandedEvidence, setExpandedEvidence] = useState<Set<string>>(new Set())

  const realAge = ageFromRange(profile.age)
  const ageApparent = scores.ageApparent ?? realAge + 3
  const diff = ageApparent - realAge

  const WHATSAPP_NUMBER = "TUTELEFONO"
  const waMsg = encodeURIComponent(
    `Hola, acabo de hacer mi análisis en InsideOutMed. Mi score fue ${scores.overall}/100. Me gustaría hablar con un especialista.`
  )

  // Count items per category
  const counts: Record<Category, number> = { skincare: 0, supplements: 0, habits: 0, treatments: 0 }
  for (const r of plan) counts[r.category]++

  // Items for current tab
  const tabItems = plan.filter(r => r.category === activeTab)

  // Top 3 free phase-1 items for "Empieza Hoy"
  const freeStarters = plan
    .filter(r => r.tier === "free" && r.phase === 1)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)

  const toggleEvidence = (id: string) => {
    setExpandedEvidence(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  return (
    <div style={{
      minHeight: "100vh", background: "#0e0c12", color: "#f5ede8",
      fontFamily: "var(--font-inter, sans-serif)",
      animation: "pageIn 0.6s ease forwards",
    }}>
      {/* Nav */}
      <nav style={{
        padding: "0 24px", height: 72,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        borderBottom: "1px solid rgba(245,237,232,0.06)",
        position: "sticky", top: 0, zIndex: 100,
        background: "rgba(14,12,18,0.92)",
        backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)",
      }}>
        <a href="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
          <svg width="26" height="26" viewBox="0 0 28 28" fill="none">
            <circle cx="14" cy="14" r="13" stroke="#e8a4b0" strokeWidth="1.5"/>
            <circle cx="14" cy="14" r="7" stroke="#e8a4b0" strokeWidth="1" strokeDasharray="3 2"/>
            <circle cx="14" cy="14" r="3" fill="#e8a4b0"/>
          </svg>
          <span style={{ fontFamily: "var(--font-fraunces)", fontSize: 17, fontWeight: 500, color: "#f5ede8", letterSpacing: "-0.02em" }}>
            InsideOutMed
          </span>
        </a>
        <a
          href={`https://wa.me/${WHATSAPP_NUMBER}?text=${waMsg}`}
          target="_blank" rel="noopener noreferrer"
          style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            background: "rgba(232,164,176,0.1)", border: "1px solid rgba(232,164,176,0.28)",
            color: "#e8a4b0", borderRadius: 99, padding: "8px 20px",
            fontSize: 13, fontWeight: 600, textDecoration: "none",
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
          </svg>
          Hablar con especialista
        </a>
      </nav>

      <main style={{ maxWidth: 900, margin: "0 auto", padding: "60px 24px 80px" }}>

        {/* ── Section A: Header ── */}
        <div style={{ textAlign: "center", marginBottom: 56, animation: "cardIn 0.6s ease 0.05s both" }}>
          <div style={{
            display: "inline-block", padding: "6px 18px", borderRadius: 99,
            background: "rgba(126,203,161,0.08)", border: "1px solid rgba(126,203,161,0.2)",
            marginBottom: 20,
          }}>
            <span style={{ fontSize: 11, letterSpacing: "0.12em", color: "#7ecba1", fontWeight: 600 }}>
              Tu plan personalizado
            </span>
          </div>

          <h1 style={{
            fontFamily: "var(--font-fraunces)",
            fontSize: "clamp(26px, 4vw, 42px)",
            fontWeight: 400, letterSpacing: "-0.03em",
            marginBottom: 28, lineHeight: 1.1,
          }}>
            Tu plan para volver a{" "}
            <em style={{ color: "#e8a4b0", fontStyle: "italic" }}>{realAge}</em>
          </h1>

          {/* Age comparison row */}
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 16, flexWrap: "wrap", justifyContent: "center",
            padding: "20px 36px",
            background: "rgba(245,237,232,0.03)",
            border: "1px solid rgba(245,237,232,0.08)",
            borderRadius: 16,
            marginBottom: 20,
          }}>
            <div style={{ textAlign: "center" }}>
              <p style={{ fontSize: 9.5, letterSpacing: "0.1em", color: "rgba(245,237,232,0.3)", textTransform: "uppercase", marginBottom: 4 }}>Edad real</p>
              <p style={{ fontFamily: "var(--font-fraunces)", fontSize: 28, fontWeight: 300, color: "#7ecba1", lineHeight: 1 }}>{realAge}</p>
            </div>
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" style={{ opacity: 0.3 }}>
              <path d="M4 10h12M12 6l4 4-4 4" stroke="#f5ede8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <div style={{ textAlign: "center" }}>
              <p style={{ fontSize: 9.5, letterSpacing: "0.1em", color: "rgba(245,237,232,0.3)", textTransform: "uppercase", marginBottom: 4 }}>Tu piel</p>
              <p style={{ fontFamily: "var(--font-fraunces)", fontSize: 28, fontWeight: 300, color: "#e8a4b0", lineHeight: 1 }}>{ageApparent}</p>
            </div>
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" style={{ opacity: 0.3 }}>
              <path d="M4 10h12M12 6l4 4-4 4" stroke="#f5ede8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <div style={{ textAlign: "center" }}>
              <p style={{ fontSize: 9.5, letterSpacing: "0.1em", color: "rgba(245,237,232,0.3)", textTransform: "uppercase", marginBottom: 4 }}>Meta</p>
              <p style={{ fontFamily: "var(--font-fraunces)", fontSize: 28, fontWeight: 300, color: "#d4af88", lineHeight: 1 }}>{realAge}</p>
            </div>
          </div>

          {diff > 0 && (
            <p style={{ fontSize: 14, color: "rgba(245,237,232,0.48)", lineHeight: 1.65, maxWidth: 480, margin: "0 auto" }}>
              Con este plan puedes recuperar hasta <strong style={{ color: "#e8a4b0" }}>{diff} a{"\u00f1"}os</strong> en 12 semanas.
            </p>
          )}
        </div>

        {/* ── Section B: Empieza Hoy ── */}
        {freeStarters.length > 0 && (
          <div style={{ marginBottom: 56, animation: "cardIn 0.6s ease 0.15s both" }}>
            <h2 style={{
              fontFamily: "var(--font-fraunces)",
              fontSize: "clamp(20px, 3vw, 28px)",
              fontWeight: 400, letterSpacing: "-0.025em", marginBottom: 20,
              textAlign: "center",
            }}>
              Empieza hoy — sin gastar nada
            </h2>
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
              gap: 14,
            }}>
              {freeStarters.map((r, i) => (
                <div key={i} style={{
                  background: "rgba(245,237,232,0.04)",
                  border: "1px solid rgba(245,237,232,0.08)",
                  borderRadius: 16, padding: "22px 20px",
                  animation: `cardIn 0.5s ease ${0.2 + i * 0.08}s both`,
                }}>
                  <div style={{
                    display: "inline-block", padding: "3px 10px", borderRadius: 99, marginBottom: 10,
                    background: "rgba(126,203,161,0.08)", border: "1px solid rgba(126,203,161,0.2)",
                  }}>
                    <span style={{ fontSize: 9, letterSpacing: "0.12em", color: "#7ecba1", fontWeight: 700, textTransform: "uppercase" }}>
                      Gratis
                    </span>
                  </div>
                  <h3 style={{
                    fontFamily: "var(--font-fraunces)", fontSize: 15, fontWeight: 400,
                    color: "#f5ede8", marginBottom: 8, lineHeight: 1.3,
                  }}>
                    {r.name}
                  </h3>
                  <p style={{ fontSize: 12, color: "rgba(245,237,232,0.42)", lineHeight: 1.55, marginBottom: 8 }}>
                    {r.what.length > 100 ? r.what.slice(0, 100) + "..." : r.what}
                  </p>
                  <p style={{ fontSize: 11, color: "rgba(245,237,232,0.25)" }}>
                    {r.freq}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Section C: Category Tabs ── */}
        <div style={{
          display: "flex", gap: 8, marginBottom: 32, flexWrap: "wrap",
          animation: "cardIn 0.6s ease 0.25s both",
        }}>
          {CATEGORY_TABS.map(tab => {
            const isActive = activeTab === tab.key
            const count = counts[tab.key]
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                style={{
                  padding: "10px 20px", borderRadius: 99, cursor: "pointer",
                  fontSize: 13, fontWeight: 600, letterSpacing: "0.01em",
                  border: isActive ? "1px solid rgba(232,164,176,0.25)" : "1px solid rgba(245,237,232,0.08)",
                  background: isActive ? "rgba(232,164,176,0.08)" : "rgba(245,237,232,0.04)",
                  color: isActive ? "#e8a4b0" : "rgba(245,237,232,0.4)",
                  transition: "all 0.2s ease",
                  fontFamily: "var(--font-inter, sans-serif)",
                }}
              >
                {tab.label} ({count})
              </button>
            )
          })}
        </div>

        {/* ── Section D: Tab-specific groups ── */}
        <div style={{ display: "flex", flexDirection: "column", gap: 32, marginBottom: 56 }}>

          {/* ── SKINCARE: Group by AM / PM ── */}
          {activeTab === "skincare" && (() => {
            const amItems = tabItems.filter(r => r.timing === "AM" || !r.timing)
            const pmItems = tabItems.filter(r => r.timing === "PM")
            const routineGroups = [
              { key: "am", title: "Rutina de ma\u00f1ana (AM)", color: "#d4af88", items: amItems },
              { key: "pm", title: "Rutina de noche (PM)", color: "#7ecba1", items: pmItems },
            ]
            return (
              <>
                {/* AM/PM routine note */}
                <div style={{
                  background: "rgba(232,164,176,0.05)", border: "1px solid rgba(232,164,176,0.12)",
                  borderRadius: 14, padding: "16px 18px", marginBottom: 20,
                }}>
                  <p style={{ fontSize: 12.5, color: "rgba(245,237,232,0.6)", lineHeight: 1.55 }}>
                    Tu rutina skincare se divide en{" "}
                    <span style={{ color: "#d4af88", fontWeight: 600 }}>Ma{"\u00f1"}ana (AM)</span> y{" "}
                    <span style={{ color: "#7ecba1", fontWeight: 600 }}>Noche (PM)</span>.{" "}
                    El SPF va siempre en la ma{"\u00f1"}ana; los activos fuertes (retinol, {"\u00e1"}cidos) por la noche.
                  </p>
                </div>

                {routineGroups.map((group, gi) => group.items.length > 0 && (
                  <div key={group.key} style={{ animation: `cardIn 0.55s ease ${0.3 + gi * 0.06}s both` }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16, padding: "8px 0" }}>
                      <div style={{
                        width: 10, height: 10, borderRadius: "50%",
                        background: group.color,
                        boxShadow: `0 0 8px ${group.color}66`,
                        flexShrink: 0,
                      }} />
                      <h3 style={{
                        fontFamily: "var(--font-fraunces)", fontSize: 17, fontWeight: 400,
                        color: "#f5ede8", letterSpacing: "-0.02em",
                      }}>
                        {group.title}
                      </h3>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                      {group.items.map((rec, ri) => renderRecCard(rec, ri, expandedEvidence, toggleEvidence))}
                    </div>
                  </div>
                ))}
              </>
            )
          })()}

          {/* ── SUPPLEMENTS: Additive groups ── */}
          {activeTab === "supplements" && (() => {
            const empiezaItems = tabItems.filter(r => r.phase === 1)
            const sumaItems = tabItems.filter(r => r.phase === 2)
            const avanzadoItems = tabItems.filter(r => r.phase >= 4)
            const suppGroups = [
              { key: "empieza", title: "Empieza con estos", subtitle: "Tu base de suplementaci\u00f3n desde el d\u00eda 1.", color: "#7ecba1", items: empiezaItems, additive: false },
              { key: "suma", title: "Suma en el mes 2", subtitle: "Mant\u00e9n todo lo anterior + suma estos.", color: "#d4af88", items: sumaItems, additive: true },
              { key: "avanzados", title: "Avanzados", subtitle: "Mant\u00e9n todo lo anterior + suma estos cuando est\u00e9s listo.", color: "#d4af88", items: avanzadoItems, additive: true },
            ]
            return (
              <>
                {/* Additive note */}
                <div style={{
                  background: "rgba(126,203,161,0.05)", border: "1px solid rgba(126,203,161,0.12)",
                  borderRadius: 14, padding: "16px 18px", marginBottom: 20,
                }}>
                  <p style={{ fontSize: 12.5, color: "rgba(245,237,232,0.6)", lineHeight: 1.55 }}>
                    Los suplementos son <span style={{ color: "#7ecba1", fontWeight: 600 }}>acumulativos</span>: cada etapa se suma a la anterior. Nunca dejas de tomar los de la etapa previa.
                  </p>
                </div>

                {suppGroups.map((group, gi) => group.items.length > 0 && (
                  <div key={group.key} style={{ animation: `cardIn 0.55s ease ${0.3 + gi * 0.06}s both` }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 6, padding: "8px 0" }}>
                      <div style={{
                        width: 10, height: 10, borderRadius: "50%",
                        background: group.color,
                        boxShadow: `0 0 8px ${group.color}66`,
                        flexShrink: 0,
                      }} />
                      <h3 style={{
                        fontFamily: "var(--font-fraunces)", fontSize: 17, fontWeight: 400,
                        color: "#f5ede8", letterSpacing: "-0.02em",
                      }}>
                        {group.title}
                      </h3>
                    </div>
                    <p style={{ fontSize: 12, color: "rgba(245,237,232,0.28)", marginBottom: 16, paddingLeft: 22 }}>
                      {group.additive && (
                        <span style={{ color: "#d4af88", fontWeight: 600 }}>{"+"} </span>
                      )}
                      {group.subtitle}
                    </p>
                    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                      {group.items.map((rec, ri) => renderRecCard(rec, ri, expandedEvidence, toggleEvidence))}
                    </div>
                  </div>
                ))}
              </>
            )
          })()}

          {/* ── HABITS: Flat list, no phases ── */}
          {activeTab === "habits" && (
            <div style={{ animation: "cardIn 0.55s ease 0.3s both" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 6, padding: "8px 0" }}>
                <div style={{
                  width: 10, height: 10, borderRadius: "50%",
                  background: "#7ecba1",
                  boxShadow: "0 0 8px rgba(126,203,161,0.4)",
                  flexShrink: 0,
                }} />
                <h3 style={{
                  fontFamily: "var(--font-fraunces)", fontSize: 17, fontWeight: 400,
                  color: "#f5ede8", letterSpacing: "-0.02em",
                }}>
                  Tu estilo de vida
                </h3>
              </div>
              <p style={{ fontSize: 12, color: "rgba(245,237,232,0.28)", marginBottom: 16, paddingLeft: 22 }}>
                H{"\u00e1"}bitos permanentes que protegen y rejuvenecen tu piel todos los d{"\u00ed"}as. No tienen fase: son para siempre.
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {tabItems.map((rec, ri) => renderRecCard(rec, ri, expandedEvidence, toggleEvidence))}
              </div>
            </div>
          )}

          {/* ── TREATMENTS: Non-invasive vs Advanced ── */}
          {activeTab === "treatments" && (() => {
            const noInvasiveNames = ["led", "hydrafacial", "peel"]
            const noInvasivos = tabItems.filter(r => noInvasiveNames.some(n => r.name.toLowerCase().includes(n)))
            const avanzados = tabItems.filter(r => !noInvasiveNames.some(n => r.name.toLowerCase().includes(n)))
            const treatGroups = [
              { key: "no-invasivos", title: "No invasivos", subtitle: "Tratamientos en consultorio sin agujas. Resultados con cero tiempo de recuperaci\u00f3n.", color: "#7ecba1", items: noInvasivos },
              { key: "avanzados", title: "Avanzados", subtitle: "Procedimientos con microagujas o inyectables. Resultados m\u00e1s potentes, requieren profesional certificado.", color: "#7ecba1", items: avanzados },
            ]
            return treatGroups.map((group, gi) => group.items.length > 0 && (
              <div key={group.key} style={{ animation: `cardIn 0.55s ease ${0.3 + gi * 0.06}s both` }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 6, padding: "8px 0" }}>
                  <div style={{
                    width: 10, height: 10, borderRadius: "50%",
                    background: group.color,
                    boxShadow: `0 0 8px ${group.color}66`,
                    flexShrink: 0,
                  }} />
                  <h3 style={{
                    fontFamily: "var(--font-fraunces)", fontSize: 17, fontWeight: 400,
                    color: "#f5ede8", letterSpacing: "-0.02em",
                  }}>
                    {group.title}
                  </h3>
                </div>
                <p style={{ fontSize: 12, color: "rgba(245,237,232,0.28)", marginBottom: 16, paddingLeft: 22 }}>
                  {group.subtitle}
                </p>
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {group.items.map((rec, ri) => renderRecCard(rec, ri, expandedEvidence, toggleEvidence))}
                </div>
              </div>
            ))
          })()}

        </div>

        {/* ── Section F: Consultation CTA ── */}
        <div style={{
          background: "linear-gradient(135deg, rgba(232,164,176,0.07) 0%, rgba(212,175,136,0.04) 100%)",
          border: "1px solid rgba(232,164,176,0.16)",
          borderRadius: 20, padding: "36px 40px", marginBottom: 40,
          display: "flex", alignItems: "center", justifyContent: "space-between",
          gap: 32, flexWrap: "wrap",
          animation: "cardIn 0.6s ease 0.4s both",
        }}>
          <div style={{ maxWidth: 520 }}>
            <p style={{ fontSize: 10.5, letterSpacing: "0.14em", color: "rgba(245,237,232,0.3)", textTransform: "uppercase", marginBottom: 16 }}>
              {"\u00bf"}Tienes dudas sobre tu plan?
            </p>
            <h3 style={{
              fontFamily: "var(--font-fraunces)",
              fontSize: "clamp(18px, 2.5vw, 26px)",
              fontWeight: 400, letterSpacing: "-0.025em",
              marginBottom: 10, lineHeight: 1.2,
            }}>
              {"\u00bf"}Quieres que analicemos tus resultados juntos?
            </h3>
            <p style={{ fontSize: 14, color: "rgba(245,237,232,0.48)", lineHeight: 1.65 }}>
              Un especialista de InsideOutMed revisa tu informe, te explica cada biomarcador
              y ajusta tu protocolo de manera conjunta. Sin presi{"\u00f3"}n. Sin compromiso.
            </p>
          </div>
          <a
            href={`https://wa.me/${WHATSAPP_NUMBER}?text=${waMsg}`}
            target="_blank" rel="noopener noreferrer"
            style={{
              display: "inline-flex", alignItems: "center", gap: 10,
              background: "linear-gradient(135deg, #e8a4b0 0%, #c97e8e 100%)",
              color: "#fff", borderRadius: 99,
              padding: "16px 34px", fontSize: 15, fontWeight: 700,
              textDecoration: "none", whiteSpace: "nowrap",
              boxShadow: "0 8px 32px rgba(232,164,176,0.32)",
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
            Hablar con especialista
          </a>
        </div>

        {/* ── Section G: Footer actions ── */}
        <div style={{ textAlign: "center", marginBottom: 40, animation: "cardIn 0.6s ease 0.5s both" }}>
          <a
            href="/analyze"
            style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              background: "rgba(245,237,232,0.06)",
              border: "1px solid rgba(245,237,232,0.12)",
              color: "#f5ede8", borderRadius: 99,
              padding: "14px 32px", fontSize: 14, fontWeight: 600,
              textDecoration: "none", marginBottom: 16,
              transition: "background 0.2s",
            }}
            onMouseEnter={e => { e.currentTarget.style.background = "rgba(245,237,232,0.11)" }}
            onMouseLeave={e => { e.currentTarget.style.background = "rgba(245,237,232,0.06)" }}
          >
            Hacer nuevo an{"\u00e1"}lisis
          </a>
          <br />
          <a href="/" style={{ fontSize: 13, color: "rgba(245,237,232,0.3)", textDecoration: "none", marginTop: 12, display: "inline-block" }}>
            Volver al inicio
          </a>
        </div>

        {/* Disclaimer */}
        <p style={{ fontSize: 10.5, color: "rgba(245,237,232,0.16)", lineHeight: 1.6, textAlign: "center", maxWidth: 600, margin: "0 auto" }}>
          Las recomendaciones de InsideOutMed tienen fines informativos. No reemplazan el diagn{"\u00f3"}stico de un dermat{"\u00f3"}logo.
          Algunos enlaces a Amazon pueden generar comisiones de afiliado que financian este servicio.
        </p>
      </main>

      <style>{`
        @keyframes pageIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes cardIn {
          from { opacity: 0; transform: translateY(18px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  )
}

// ── Default export ─────────────────────────────────────────────────
export default function PlanPage() {
  const [scores, setScores] = useState<Scores | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [plan, setPlan] = useState<ScoredRec[] | null>(null)
  const [showContent, setShowContent] = useState(false)

  useEffect(() => {
    let loadedScores: Scores
    let loadedProfile: UserProfile

    try {
      const savedScores = localStorage.getItem("insideoutmed_scores")
      const savedProfile = localStorage.getItem("insideoutmed_profile")

      if (savedScores) {
        loadedScores = JSON.parse(savedScores)
      } else {
        loadedScores = {
          overall: 72, luminosity: 65, hydration: 70, uniformity: 58,
          glycation: 32, inflammation: 28, sunDamage: 35, vascularity: 20,
          ageApparent: 34,
        }
      }

      if (savedProfile) {
        loadedProfile = JSON.parse(savedProfile)
      } else {
        loadedProfile = {
          age: "26-35",
          fitzpatrick: "III",
          concern: "arrugas",
          budget: "30-80",
        }
      }
    } catch {
      loadedScores = {
        overall: 72, luminosity: 65, hydration: 70, uniformity: 58,
        glycation: 32, inflammation: 28, sunDamage: 35, vascularity: 20,
        ageApparent: 34,
      }
      loadedProfile = {
        age: "26-35",
        fitzpatrick: "III",
        concern: "arrugas",
        budget: "30-80",
      }
    }

    setScores(loadedScores)
    setProfile(loadedProfile)
    setPlan(buildPlan(CATALOG, loadedProfile, loadedScores))
  }, [])

  const handleDone = useCallback(() => setShowContent(true), [])

  if (!scores || !profile || !plan) {
    return (
      <div style={{ minHeight: "100vh", background: "#0e0c12", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ width: 32, height: 32, borderRadius: "50%", border: "2px solid rgba(232,164,176,0.2)", borderTopColor: "#e8a4b0", animation: "spin 0.8s linear infinite" }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    )
  }

  if (!showContent) {
    return <AnalyzingScreen scores={scores} onDone={handleDone} />
  }

  return <PlanContent scores={scores} profile={profile} plan={plan} />
}
