// ── Product Catalog — shared between admin and plan ──────────────

export type Category = "skincare" | "supplements" | "habits" | "treatments"
export type Tier = "free" | "mid" | "premium"

export interface Product {
  id: string
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
  problems?: string[]
}

export const PROBLEM_OPTIONS = [
  "Ojeras", "Textura", "Arrugas", "Rojez/Inflamación", "Manchas",
  "Luminosidad", "Daño solar", "Glicación", "Vascularidad", "Suavidad",
  "Simetría", "Firmeza", "Poros", "Acné", "Hidratación",
]

export const CATEGORY_OPTIONS: { key: Category; label: string }[] = [
  { key: "skincare", label: "Skincare" },
  { key: "supplements", label: "Suplementos" },
  { key: "habits", label: "Hábitos" },
  { key: "treatments", label: "Tratamientos" },
]

// ── Default affiliate tag ─────────────────────────────────────────
export const DEFAULT_AFFILIATE_TAG = "insideoutmed-21"

export function amazonUrl(query: string, tag?: string) {
  return `https://www.amazon.com/s?k=${encodeURIComponent(query)}&tag=${tag || DEFAULT_AFFILIATE_TAG}`
}

// ── Referral partner ──────────────────────────────────────────────
export interface ReferralPartner {
  id: string
  name: string
  code: string        // URL param value: ?ref=CODE
  amazonTag: string   // their Amazon affiliate tag
  active: boolean
  createdAt: string
}

// ── Default Catalog ───────────────────────────────────────────────
let _nextId = 1
function pid(): string { return `prod-${_nextId++}` }

export const DEFAULT_CATALOG: Product[] = [
  // ── SKINCARE ──
  {
    id: pid(), name: "Protector solar SPF 50", category: "skincare", tier: "free",
    minAge: 18, phase: 1, timing: "AM",
    what: "FPS 50+ de amplio espectro, cada mañana, reaplicar cada 3-4h con exposición. Sin protección solar, ningún otro activo puede rendir al 100%.",
    cost: "$8-20/mes", freq: "Diario AM",
    results: "Prevención desde día 1; menos manchas en 3-6 meses",
    risk: "Elegir libre de fragancia si piel sensible",
    evidence: "Hughes et al., Ann Intern Med 2013: el uso diario de FPS redujo el fotoenvejecimiento un 24%.",
    amazonQuery: "protector solar SPF 50 facial",
    problems: ["Manchas", "Daño solar", "Arrugas"],
  },
  {
    id: pid(), name: "Limpiador suave + hidratante con ceramidas", category: "skincare", tier: "free",
    minAge: 18, phase: 1,
    what: "Limpieza AM/PM sin sulfatos agresivos + hidratante con ceramidas y ácido hialurónico. Restaura y protege tu barrera cutánea.",
    cost: "$15-30/mes", freq: "2x día",
    results: "Barrera más fuerte en 2-4 semanas",
    risk: "Bajo",
    evidence: "Lynde, J Drugs Dermatol 2014: ceramidas restauran la barrera cutánea.",
    amazonQuery: "CeraVe limpiador hidratante ceramidas",
    problems: ["Hidratación", "Textura", "Rojez/Inflamación"],
  },
  {
    id: pid(), name: "Vitamina C 15-20%", category: "skincare", tier: "mid",
    minAge: 22, phase: 2, timing: "AM",
    what: "Antioxidante de mañana (ácido L-ascórbico 15-20%) bajo el protector solar. Potencia la fotoprotección y estimula colágeno.",
    cost: "$20-45/mes", freq: "Diario AM",
    results: "Más luminosidad en 4-8 semanas",
    risk: "Puede irritar; empezar 3x/semana",
    evidence: "Pinnell, Dermatol Surg 2001: vitamina C tópica aumenta síntesis de colágeno y protege del fotodaño.",
    amazonQuery: "serum vitamina C 20% rostro",
    problems: ["Luminosidad", "Manchas", "Daño solar"],
  },
  {
    id: pid(), name: "Retinol 0.3% → 1%", category: "skincare", tier: "mid",
    minAge: 25, phase: 2, timing: "PM",
    what: "Retinoide nocturno, subir concentración gradualmente. El activo anti-edad mejor documentado de la dermatología moderna.",
    cost: "$20-50/mes", freq: "PM, 2-5x/semana",
    results: "Textura y líneas finas en 8-12 semanas",
    risk: "Irritación/descamación inicial; evitar en embarazo",
    evidence: "Mukherjee, Clin Interv Aging 2006: retinoides reducen arrugas y aumentan colágeno de forma comprobada.",
    amazonQuery: "retinol serum 0.5% facial",
    problems: ["Arrugas", "Textura", "Firmeza"],
  },
  {
    id: pid(), name: "Niacinamida 10%", category: "skincare", tier: "free",
    minAge: 20, phase: 2,
    what: "Reduce rojez, poros y mejora uniformidad de tono. Muy bien tolerada y compatible con casi cualquier activo.",
    cost: "$10-25/mes", freq: "Diario",
    results: "Tono más parejo en 4-8 semanas",
    risk: "Mínimo",
    evidence: "Bissett, Dermatol Surg 2005: niacinamida mejora textura, poros y manchas.",
    amazonQuery: "niacinamida 10% serum facial",
    problems: ["Rojez/Inflamación", "Poros", "Manchas", "Textura"],
  },
  {
    id: pid(), name: "Contorno de ojos cafeína + péptidos", category: "skincare", tier: "mid",
    minAge: 25, phase: 1,
    what: "Cafeína para hinchazón y ojeras vasculares + péptidos para firmeza periocular. Resultados visibles en la zona más delicada.",
    cost: "$18-40/mes", freq: "2x día",
    results: "Menos hinchazón en 2-4 semanas",
    risk: "Bajo",
    evidence: "Herman, Skin Pharmacol 2013: cafeína vasoconstrictora reduce edema periorbital.",
    amazonQuery: "contorno ojos cafeina peptidos",
    problems: ["Ojeras", "Vascularidad"],
  },
  {
    id: pid(), name: "AHA/BHA exfoliación química", category: "skincare", tier: "mid",
    minAge: 22, phase: 3, timing: "PM",
    what: "Glicólico o salicílico 1-2x/semana para renovar textura y desobstruir poros. Acelera la renovación celular sin abrasión mecánica.",
    cost: "$15-35/mes", freq: "1-2x/semana",
    results: "Suavidad en 3-6 semanas",
    risk: "No combinar con retinol la misma noche; usar SPF",
    evidence: "Kornhauser, Clin Cosmet Investig Dermatol 2010: AHAs mejoran textura y firmeza.",
    amazonQuery: "AHA BHA exfoliante quimico facial",
    problems: ["Textura", "Poros", "Suavidad"],
  },
  {
    id: pid(), name: "Sérum de péptidos para firmeza", category: "skincare", tier: "mid",
    minAge: 30, phase: 4,
    what: "Péptidos señalizadores (Matrixyl) para estimular colágeno y firmeza del óvalo facial. Ideal para prevenir flacidez.",
    cost: "$25-55/mes", freq: "Diario",
    results: "Firmeza sutil en 8-12 semanas",
    risk: "Bajo",
    evidence: "Robinson, Int J Cosmet Sci 2005: Matrixyl estimula colágeno tipo I.",
    amazonQuery: "serum peptidos matrixyl firmeza",
    problems: ["Firmeza", "Arrugas", "Glicación"],
  },
  {
    id: pid(), name: "Sérum PDRN tópico", category: "skincare", tier: "mid",
    minAge: 25, phase: 3, timing: "PM", isNew: true,
    what: "Sérum con polinucleótidos que estimula fibroblastos y reparación de ADN cutáneo. La versión tópica de la terapia regenerativa más trending, sin agujas.",
    cost: "$30-70/mes", freq: "PM (o AM/PM)",
    results: "Líneas finas e hidratación en 8 semanas",
    risk: "Bajo; evitar si hay alergia a derivados de pescado",
    evidence: "J Cosmet Dermatol 2025: PDRN tópico ~47% menos líneas finas, ~39% más elasticidad a 8 semanas.",
    amazonQuery: "PDRN serum polinucleotidos facial",
    problems: ["Arrugas", "Hidratación", "Textura"],
  },
  {
    id: pid(), name: "Bakuchiol", category: "skincare", tier: "mid",
    minAge: 22, phase: 2, timing: "PM", isNew: true,
    what: "Retinoide vegetal mejor tolerado: efecto tipo retinol (líneas, textura) con menos irritación. Ideal para piel sensible o rosácea.",
    cost: "$20-45/mes", freq: "PM, diario",
    results: "Textura y líneas en 8-12 semanas",
    risk: "Bajo; muy bien tolerado",
    evidence: "Dhaliwal, Br J Dermatol 2019: bakuchiol comparable al retinol en arrugas y pigmentación, con menos irritación.",
    amazonQuery: "bakuchiol serum facial",
    problems: ["Arrugas", "Textura", "Rojez/Inflamación"],
  },

  // ── SUPPLEMENTS ──
  {
    id: pid(), name: "Colágeno hidrolizado tipo I y III", category: "supplements", tier: "free",
    minAge: 25, phase: 1,
    what: "10 g/día de péptidos de colágeno. Mejora elasticidad e hidratación cutánea desde dentro, con evidencia en estudios doble ciego.",
    cost: "$15-35/mes", freq: "Diario",
    results: "Elasticidad medible en 8-12 semanas",
    risk: "Bajo",
    evidence: "Proksch, Skin Pharmacol Physiol 2014: péptidos de colágeno mejoran elasticidad cutánea (estudio doble ciego).",
    amazonQuery: "colageno hidrolizado polvo tipo I III",
    problems: ["Firmeza", "Hidratación", "Arrugas"],
  },
  {
    id: pid(), name: "Omega-3 EPA/DHA", category: "supplements", tier: "free",
    minAge: 18, phase: 1,
    what: "1-2 g/día. Antiinflamatorio sistémico, mejora barrera lipídica e hidratación de la piel desde dentro.",
    cost: "$12-25/mes", freq: "Diario",
    results: "Menos inflamación en 6-10 semanas",
    risk: "Cuidado si tomas anticoagulantes",
    evidence: "Pilkington, Exp Dermatol 2011: omega-3 protege de fotodaño e inflamación cutánea.",
    amazonQuery: "omega 3 EPA DHA capsulas",
    problems: ["Rojez/Inflamación", "Hidratación", "Daño solar"],
  },
  {
    id: pid(), name: "Vitamina D3 + K2", category: "supplements", tier: "free",
    minAge: 18, phase: 1,
    what: "2000-4000 UI de D3 con K2. Soporta inmunidad, cicatrización y salud general de la piel.",
    cost: "$8-18/mes", freq: "Diario",
    results: "Beneficio sistémico continuo",
    risk: "Idealmente con nivel sérico medido",
    evidence: "Umar, Skin Pharmacol 2018: déficit de vitamina D asociado a peor cicatrización y barrera cutánea.",
    amazonQuery: "vitamina D3 K2 capsulas",
    problems: ["Hidratación"],
  },
  {
    id: pid(), name: "Astaxantina 4-12 mg", category: "supplements", tier: "mid",
    minAge: 25, phase: 2,
    what: "Antioxidante potente de origen marino. Mejora elasticidad y reduce líneas finas con uso sostenido.",
    cost: "$15-30/mes", freq: "Diario",
    results: "Elasticidad en 8 semanas",
    risk: "Bajo",
    evidence: "Tominaga, Acta Biochim Pol 2012: astaxantina oral+tópica mejora arrugas y elasticidad.",
    amazonQuery: "astaxantina 12mg capsulas",
    problems: ["Daño solar", "Arrugas", "Firmeza"],
  },
  {
    id: pid(), name: "Zinc bisglicinato + Vitamina C oral", category: "supplements", tier: "free",
    minAge: 18, phase: 2,
    what: "Cofactores esenciales de la síntesis de colágeno y control de inflamación. Especialmente útil contra brotes de acné.",
    cost: "$10-20/mes", freq: "Diario",
    results: "Variable, mejora gradual",
    risk: "Zinc lejos de hierro; no exceder 30 mg/día",
    evidence: "Vitamina C es cofactor esencial de la prolil-hidroxilasa en la síntesis de colágeno.",
    amazonQuery: "zinc bisglicinato vitamina C",
    problems: ["Acné", "Rojez/Inflamación"],
  },
  {
    id: pid(), name: "NMN / NR (precursores de NAD+)", category: "supplements", tier: "premium",
    minAge: 35, phase: 4,
    what: "250-500 mg/día. Apoyo a la longevidad celular y reparación de ADN. Evidencia emergente pero prometedora.",
    cost: "$40-90/mes", freq: "Diario",
    results: "Largo plazo; marcador sistémico",
    risk: "Evidencia en humanos aún limitada; consultar médico",
    evidence: "Yoshino, Science 2021: NMN mejora sensibilidad a insulina; efectos en piel aún en estudio.",
    amazonQuery: "NMN 500mg capsulas NAD+",
    problems: ["Glicación"],
  },
  {
    id: pid(), name: "Magnesio glicinato", category: "supplements", tier: "free",
    minAge: 18, phase: 1,
    what: "200-400 mg por la noche. Mejora sueño profundo y reduce cortisol, el enemigo silencioso del colágeno.",
    cost: "$8-16/mes", freq: "PM, diario",
    results: "Mejor sueño en 1-2 semanas",
    risk: "Puede ablandar heces en dosis altas",
    evidence: "Sueño profundo regula cortisol; cortisol alto degrada colágeno (Sapolsky, revisión neuroendocrina).",
    amazonQuery: "magnesio glicinato capsulas",
    problems: ["Ojeras", "Firmeza"],
  },

  // ── HABITS ──
  {
    id: pid(), name: "Dormir 7-9 horas", category: "habits", tier: "free",
    minAge: 18, phase: 1,
    what: "En sueño profundo el cuerpo libera hormona de crecimiento y repara la piel. Dormir poco sube el cortisol, que degrada colágeno y causa ojeras.",
    cost: "$0", freq: "Cada noche",
    results: "Menos ojeras e hinchazón en 1-2 semanas",
    risk: "Ninguno",
    evidence: "Revisiones 2024-2026: el sueño regula cortisol y reparación de barrera; su déficit acelera el envejecimiento.",
    problems: ["Ojeras", "Firmeza", "Luminosidad"],
  },
  {
    id: pid(), name: "Evitar sol pico + sombrero y lentes", category: "habits", tier: "free",
    minAge: 18, phase: 1,
    what: "El sol explica ~80% del envejecimiento visible. Evita las 10-16h, usa sombrero y lentes además del SPF.",
    cost: "$0", freq: "Diario",
    results: "Prevención: menos manchas y arrugas a mediano plazo",
    risk: "Ninguno",
    evidence: "El fotoenvejecimiento (exposoma UV) es el principal factor extrínseco del envejecimiento cutáneo.",
    problems: ["Daño solar", "Manchas", "Arrugas"],
  },
  {
    id: pid(), name: "Dieta anti-glicación", category: "habits", tier: "free",
    minAge: 18, phase: 1,
    what: "El azúcar genera glicación, que endurece el colágeno y apaga la piel. Prioriza proteína, vegetales, antioxidantes y omega-3.",
    cost: "$0", freq: "Diario",
    results: "Piel más luminosa en 4-8 semanas",
    risk: "Ninguno",
    evidence: "PMC 2024-2025: dieta rica en antioxidantes y baja en azúcares reduce glicación y estrés oxidativo cutáneo.",
    problems: ["Glicación", "Luminosidad"],
  },
  {
    id: pid(), name: "Ejercicio 3-5x/semana", category: "habits", tier: "free",
    minAge: 18, phase: 1,
    what: "Mejora circulación, oxigenación y función mitocondrial de la piel. Más glow y mejor capacidad de reparación.",
    cost: "$0", freq: "3-5x/semana",
    results: "Mejor color y tono en semanas",
    risk: "Ninguno",
    evidence: "JMIR Dermatology 2024: ejercicio mejora perfusión, temperatura e hidratación cutánea.",
    problems: ["Luminosidad", "Vascularidad"],
  },
  {
    id: pid(), name: "No fumar y moderar alcohol", category: "habits", tier: "free",
    minAge: 18, phase: 1,
    what: "Fumar y el exceso de alcohol aceleran arrugas, deshidratan y opacan la piel. Dejarlo es de lo que más rejuvenece visiblemente.",
    cost: "$0", freq: "Siempre",
    results: "Mejora progresiva de tono e hidratación",
    risk: "Ninguno",
    evidence: "Tabaco y alcohol son factores del exposoma asociados a envejecimiento cutáneo acelerado.",
    problems: ["Arrugas", "Hidratación", "Luminosidad"],
  },
  {
    id: pid(), name: "Manejo del estrés (respiración/meditación)", category: "habits", tier: "free",
    minAge: 18, phase: 2,
    what: "El estrés crónico inflama la piel vía cortisol. 10 minutos al día de respiración o meditación bajan la carga inflamatoria.",
    cost: "$0", freq: "Diario, 10 min",
    results: "Menos brotes y rojez con el tiempo",
    risk: "Ninguno",
    evidence: "El estrés psicosocial forma parte del exposoma y amplifica vías inflamatorias del envejecimiento.",
    problems: ["Rojez/Inflamación", "Acné"],
  },

  // ── TREATMENTS ──
  {
    id: pid(), name: "Hydrafacial", category: "treatments", tier: "mid",
    minAge: 22, phase: 3,
    what: "Limpieza profunda, exfoliación e hidratación en consultorio. Resultados inmediatos sin tiempo de recuperación.",
    cost: "$80-150/sesión", freq: "Mensual",
    results: "Luminosidad inmediata, efecto acumulativo",
    risk: "Mínimo",
    evidence: "Protocolo de hidradermoabrasión: mejora hidratación y textura inmediata en estudios clínicos.",
    problems: ["Luminosidad", "Textura", "Hidratación"],
  },
  {
    id: pid(), name: "Peel químico (mandélico/glicólico)", category: "treatments", tier: "mid",
    minAge: 25, phase: 3, fitzCaution: true,
    what: "Exfoliación profesional en consultorio. Mandélico es más seguro en fototipos altos. Mejora textura, manchas y tono.",
    cost: "$60-120/sesión", freq: "Cada 3-4 semanas (serie de 4-6)",
    results: "Tono más parejo en 2-3 sesiones",
    risk: "Riesgo de hiperpigmentación en Fitz IV-VI: usar ácidos suaves + SPF estricto",
    evidence: "Sharad, J Cutan Aesthet Surg 2013: peels de glicólico mejoran textura y pigmento.",
    problems: ["Manchas", "Textura", "Luminosidad"],
  },
  {
    id: pid(), name: "Microneedling con radiofrecuencia", category: "treatments", tier: "premium",
    minAge: 28, phase: 4,
    what: "Estimula colágeno en profundidad con microagujas y calor controlado. Mejora poros, cicatrices y firmeza.",
    cost: "$200-400/sesión", freq: "Serie de 3, cada 4-6 semanas",
    results: "Firmeza y textura en 2-3 meses",
    risk: "Rojez 1-2 días; cuidado con pigmento en fototipos altos",
    evidence: "Hou, Dermatol Surg 2017: microneedling+RF mejora firmeza y cicatrices con alta satisfacción.",
    problems: ["Firmeza", "Poros", "Arrugas", "Textura"],
  },
  {
    id: pid(), name: "LED rojo terapéutico", category: "treatments", tier: "mid",
    minAge: 20, phase: 2,
    what: "Fotobiomodulación: estimula colágeno y calma inflamación. Se puede usar en casa o consultorio.",
    cost: "$30-60/sesión", freq: "3-5x/semana",
    results: "Sutil en 8-12 semanas con constancia",
    risk: "Muy bajo",
    evidence: "Wunsch, Photomed Laser Surg 2014: luz roja mejora densidad de colágeno y arrugas.",
    problems: ["Rojez/Inflamación", "Arrugas", "Firmeza"],
  },
  {
    id: pid(), name: "Botox preventivo", category: "treatments", tier: "premium",
    minAge: 28, phase: 4, always30: true,
    what: "Relaja músculos que crean líneas dinámicas. Después de los 30 es preventivo: frena que las líneas se vuelvan arrugas permanentes.",
    cost: "$200-400/sesión", freq: "Cada 3-4 meses",
    results: "Líneas suavizadas en 5-10 días",
    risk: "Ptosis temporal si mal aplicado; elegir médico certificado",
    evidence: "Carruthers, Dermatol Surg: toxina botulínica reduce líneas dinámicas de forma reproducible.",
    problems: ["Arrugas"],
  },
  {
    id: pid(), name: "Skinboosters / mesoterapia", category: "treatments", tier: "premium",
    minAge: 30, phase: 4,
    what: "Microinyecciones de ácido hialurónico no reticulado para hidratación profunda y glow desde la dermis.",
    cost: "$150-300/sesión", freq: "Serie de 3, cada mes",
    results: "Glow y firmeza en 3-4 semanas",
    risk: "Hematomas leves",
    evidence: "Sparavigna 2019: skinboosters mejoran hidratación dérmica y elasticidad.",
    problems: ["Hidratación", "Luminosidad", "Firmeza"],
  },
  {
    id: pid(), name: "PRP facial", category: "treatments", tier: "premium",
    minAge: 30, phase: 4,
    what: "Plasma rico en plaquetas inyectado para mejorar calidad de piel, microcirculación y textura.",
    cost: "$200-350/sesión", freq: "Serie de 3 sesiones",
    results: "Textura y tono en 4-8 semanas",
    risk: "Hematomas leves",
    evidence: "Mehryan, J Cosmet Dermatol 2014: PRP mejora textura periorbital y color de ojeras.",
    problems: ["Textura", "Ojeras", "Luminosidad"],
  },
]

// ── localStorage helpers ──────────────────────────────────────────
const CATALOG_KEY = "iom_product_catalog"
const REFERRALS_KEY = "iom_referral_partners"

export function loadCatalog(): Product[] {
  if (typeof window === "undefined") return DEFAULT_CATALOG
  const stored = localStorage.getItem(CATALOG_KEY)
  if (stored) {
    try { return JSON.parse(stored) } catch {}
  }
  return DEFAULT_CATALOG
}

export function saveCatalog(products: Product[]) {
  localStorage.setItem(CATALOG_KEY, JSON.stringify(products))
}

export function loadReferrals(): ReferralPartner[] {
  if (typeof window === "undefined") return []
  const stored = localStorage.getItem(REFERRALS_KEY)
  if (stored) {
    try { return JSON.parse(stored) } catch {}
  }
  return []
}

export function saveReferrals(partners: ReferralPartner[]) {
  localStorage.setItem(REFERRALS_KEY, JSON.stringify(partners))
}

export function getAffiliateTag(refCode?: string | null): string {
  if (!refCode) return DEFAULT_AFFILIATE_TAG
  const partners = loadReferrals()
  const partner = partners.find(p => p.code === refCode && p.active)
  return partner?.amazonTag || DEFAULT_AFFILIATE_TAG
}
