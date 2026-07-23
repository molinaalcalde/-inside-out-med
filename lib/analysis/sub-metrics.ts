// ── Sub-metric calculations ported from legacy analyzeReal() ──
// Reference: /legacy/InsideOutMed.html lines 3004-3090

import type { SubMetric, RegionData } from "../types"

type Lm = { x: number; y: number; z: number }

function clamp(v: number, lo = 0, hi = 100) {
  return Math.max(lo, Math.min(hi, Math.round(v)))
}

function D(a: Lm, b: Lm) {
  return Math.hypot(a.x - b.x, a.y - b.y)
}

function angle3(a: Lm, b: Lm, c: Lm) {
  const v1 = { x: a.x - b.x, y: a.y - b.y }
  const v2 = { x: c.x - b.x, y: c.y - b.y }
  const d = (v1.x * v2.x + v1.y * v2.y) / ((Math.hypot(v1.x, v1.y) * Math.hypot(v2.x, v2.y)) || 1e-6)
  return Math.acos(Math.max(-1, Math.min(1, d))) * 180 / Math.PI
}

// Pixel-based mappers
function tex(s: RegionData | null): number {
  if (!s) return 50
  return clamp(100 - s.std * 2.4, 10, 99)
}

function dark(region: RegionData | null, ref: RegionData | null): number {
  if (!region || !ref) return 50
  return clamp(100 - (ref.lum - region.lum) * 2.6, 10, 99)
}

function redS(s: RegionData | null): number {
  if (!s) return 50
  return clamp(100 - s.red * 2.2, 10, 98)
}

function avgReg(arr: (RegionData | null)[]): RegionData {
  const valid = arr.filter(Boolean) as RegionData[]
  if (!valid.length) return { lum: 120, std: 10, red: 8, yellow: 14, r: 120, g: 112, b: 104 }
  const n = valid.length
  const k = (f: keyof RegionData) => valid.reduce((a, c) => a + (c[f] || 0), 0) / n
  return { lum: k("lum"), std: k("std"), red: k("red"), yellow: k("yellow"), r: k("r"), g: k("g"), b: k("b") }
}

// ── Compute geometric metrics from 478 landmarks ──────────────
export function computeGeometry(landmarks: Lm[]) {
  const g = (i: number) => landmarks[i]
  const faceH = D(g(10), g(152))
  const faceW = D(g(234), g(454)) || 1e-4
  const axis = g(168).x

  // Symmetry (8 L/R pairs)
  const pairs: [number, number][] = [[33, 263], [133, 362], [61, 291], [50, 280], [172, 397], [58, 288], [70, 300], [105, 334]]
  let symErr = 0
  pairs.forEach(([l, r]) => {
    symErr += Math.abs(Math.abs(axis - g(l).x) - Math.abs(g(r).x - axis)) / faceW
  })
  const symmetry = clamp(100 - (symErr / pairs.length) * 100 * 7)

  // Eye opening
  const eyeOpenL = D(g(159), g(145)) / (D(g(33), g(133)) || 1e-4)
  const eyeOpenR = D(g(386), g(374)) / (D(g(362), g(263)) || 1e-4)
  const eyeSym = clamp(100 - Math.abs(eyeOpenL - eyeOpenR) / ((eyeOpenL + eyeOpenR) / 2) * 200)
  const apertura = clamp(((eyeOpenL + eyeOpenR) / 2) / 0.33 * 100)

  // Brow position & symmetry
  const browL = D(g(105), g(159)) / faceH
  const browR = D(g(334), g(386)) / faceH
  const browSym = clamp(100 - Math.abs(browL - browR) / ((browL + browR) / 2) * 180)
  const browPos = clamp(((browL + browR) / 2) / 0.09 * 100, 30, 100)

  // Lip metrics
  const upper = D(g(0), g(13))
  const lower = D(g(14), g(17))
  const lipRatio = upper / (lower || 1e-4)
  const lipBalance = clamp(100 - Math.abs(lipRatio - 0.62) * 120)
  const lipFull = clamp((upper + lower) / faceH / 0.10 * 100, 20, 100)
  const cupid = clamp(100 - Math.abs((g(37).y + g(267).y) / 2 - g(0).y) / faceH * 900, 30, 98)

  // Nose metrics
  const noseW = D(g(98), g(327)) / faceW
  const noseHarmony = clamp(100 - Math.abs(noseW - 0.32) * 220)
  const nostrilSym = clamp(100 - Math.abs(D(g(98), g(2)) - D(g(327), g(2))) / faceW * 350)

  // Cheek projection (z-depth)
  const cheekProj = clamp(70 - (g(50).z + g(280).z) / 2 * 900)

  // Eye bag z-depth: tear trough vs upper cheek — larger drop = more bags = worse
  const eyeBagZL = g(111).z - g(116).z
  const eyeBagZR = g(340).z - g(345).z
  const eyeBagDepth = clamp(Math.round(80 + ((eyeBagZL + eyeBagZR) / 2) * 400), 20, 95)

  // Forehead convexity: glabella vs temples — more convex = younger
  const foreheadConvexity = g(8).z - (g(112).z + g(341).z) / 2
  const foreheadConvexScore = clamp(Math.round(60 + foreheadConvexity * 600), 25, 95)

  // Jaw z-definition: chin vs gonial angle depth differential
  const jawZDef = (g(172).z + g(397).z) / 2 - g(152).z
  const jawZScore = clamp(Math.round(50 + jawZDef * 300), 25, 95)

  // Lip projection: lips vs nose tip
  const lipProjZ = (g(13).z + g(14).z) / 2 - g(1).z
  const lipProjScore = clamp(Math.round(60 + lipProjZ * 500), 20, 95)

  // Jaw definition
  const jawW = D(g(172), g(397)) / faceW
  const jawDef = clamp(100 - Math.abs(jawW - 0.74) * 150)

  // Gonial symmetry
  const gonialSym = clamp(100 - Math.abs(D(g(172), g(152)) - D(g(397), g(152))) / faceW * 330)

  return {
    symmetry, eyeOpenL, eyeOpenR, eyeSym, apertura,
    browSym, browPos, lipBalance, lipFull, cupid,
    noseHarmony, nostrilSym, cheekProj, jawDef, gonialSym,
    eyeBagDepth, foreheadConvexScore, jawZScore, lipProjScore,
    faceH, faceW,
  }
}

// ── Compute biomarkers from pixel regions ─────────────────────
export function computeBiomarkers(regions: Record<string, RegionData>) {
  const RG = (k: string) => regions[k] || { lum: 120, std: 10, red: 8, yellow: 14, r: 120, g: 112, b: 104 }

  const fhead = avgReg([RG("p151"), RG("p67"), RG("p297")])
  const cheekL = RG("p50")
  const cheekR = RG("p280")
  const nasoL = RG("p205")
  const nasoR = RG("p425")
  const chinR = RG("p152")
  const glab = avgReg([RG("p8"), RG("p168")])

  const allSkin = [fhead, glab, cheekL, cheekR, nasoL, nasoR, chinR]
  const meanLum = allSkin.reduce((a, c) => a + c.lum, 0) / allSkin.length
  const lumStd = Math.sqrt(allSkin.reduce((a, c) => a + (c.lum - meanLum) ** 2, 0) / allSkin.length)
  const meanRed = allSkin.reduce((a, c) => a + c.red, 0) / allSkin.length
  const meanYel = allSkin.reduce((a, c) => a + c.yellow, 0) / allSkin.length
  const meanTex = allSkin.reduce((a, c) => a + c.std, 0) / allSkin.length

  return {
    luminosidad: clamp(meanLum / 210 * 100, 20, 99),
    uniformidad: clamp(100 - lumStd * 3.0, 15, 99),
    vascularidad: clamp(meanRed * 2.0, 5, 95),
    inflamacion: clamp(meanRed * 1.7 + 8, 5, 90),
    glicacion: clamp((meanYel - 18) * 2.4 + 30, 8, 92),
    hidratacion: clamp(meanLum / 210 * 55 + (100 - meanTex * 2.2) * 0.45, 20, 95),
    danoSolar: clamp(meanTex * 1.4 + lumStd * 1.4 + Math.max(0, meanYel - 25) * 1.2, 8, 92),
  }
}

// ── Compute sub-metrics per zone ──────────────────────────────
export function computeSubMetrics(
  landmarks: Lm[],
  regions: Record<string, RegionData>,
  bio: ReturnType<typeof computeBiomarkers>,
): Record<string, SubMetric[]> {
  const RG = (k: string) => regions[k] || null
  const geo = computeGeometry(landmarks)

  const fhead = avgReg([RG("p151"), RG("p67"), RG("p297")])
  const glab = avgReg([RG("p8"), RG("p168")])
  const cfL = RG("cfL")
  const cfR = RG("cfR")
  const ueL = RG("p119")
  const ueR = RG("p348")
  const cheekL = RG("p50")
  const cheekR = RG("p280")
  const nasoL = RG("p205")
  const nasoR = RG("p425")
  const periO = avgReg([RG("p164"), RG("p57"), RG("p287")])
  const jowlL = RG("p172")
  const jowlR = RG("p397")
  const lipC = avgReg([RG("p13"), RG("p14")])
  const chinR = RG("p152")
  const lashRegL = RG("p159")
  const lashRegR = RG("p386")

  const lashL = dark(lashRegL, cheekL)
  const lashR = dark(lashRegR, cheekR)

  const skinSoft = clamp((bio.uniformidad + bio.hidratacion) / 2)

  return {
    frente: [
      { label: "Líneas horizontales", score: tex(fhead) },
      { label: "Glabela / entrecejo", score: tex(glab) },
      { label: "Simetría de cejas", score: geo.browSym },
      { label: "Posición de cejas", score: geo.browPos },
      { label: "Convexidad frontal", score: geo.foreheadConvexScore },
    ],
    periocular: [
      { label: "Apertura ocular", score: geo.apertura },
      { label: "Simetría L/R", score: geo.eyeSym },
      { label: "Ojeras / pigmento", score: Math.round((dark(ueL, cheekL) + dark(ueR, cheekR)) / 2) },
      { label: "Bolsas / hinchazón", score: Math.round((tex(ueL) + tex(ueR)) / 2) },
      { label: "Profundidad de bolsas (z)", score: geo.eyeBagDepth },
      { label: "Patas de gallo", score: Math.round((tex(cfL) + tex(cfR)) / 2) },
      { label: "Densidad de pestañas", score: Math.round((lashL + lashR) / 2) },
    ],
    nariz: [
      { label: "Proporción", score: geo.noseHarmony },
      { label: "Simetría de narinas", score: geo.nostrilSym },
    ],
    labios: [
      { label: "Volumen", score: geo.lipFull },
      { label: "Ratio superior/inferior", score: geo.lipBalance },
      { label: "Arco de Cupido", score: geo.cupid },
      { label: "Proyección labial (z)", score: geo.lipProjScore },
      { label: "Suavidad", score: clamp(lipC.lum / 210 * 100 + 10, 20, 98) },
      { label: "Líneas peribucales", score: tex(periO) },
      { label: "Color / saturación", score: clamp(lipC.red * 2.4 + 30, 20, 98) },
    ],
    mejillas: [
      { label: "Proyección de pómulos", score: geo.cheekProj },
      { label: "Volumen", score: clamp(geo.cheekProj * 0.9 + 8) },
      { label: "Textura", score: Math.round((tex(cheekL) + tex(cheekR)) / 2) },
      { label: "Surco nasogeniano", score: Math.round((tex(nasoL) + tex(nasoR)) / 2) },
      { label: "Drenaje / rojez", score: Math.round((redS(cheekL) + redS(cheekR)) / 2) },
    ],
    mandibula: [
      { label: "Definición mandibular", score: geo.jawDef },
      { label: "Definición z-depth", score: geo.jawZScore },
      { label: "Ángulo gonial", score: clamp(geo.jawDef * 0.9 + 6) },
      { label: "Flacidez (jowl)", score: Math.round((tex(jowlL) + tex(jowlR)) / 2 * 0.5 + geo.jawDef * 0.5) },
      { label: "Simetría L/R", score: geo.gonialSym },
    ],
    cuello: [
      { label: "Definición submentoniana", score: clamp(geo.jawDef * 0.85) },
      { label: "Líneas horizontales", score: clamp(tex(chinR) - 6) },
      { label: "Postura", score: 70 },
    ],
    piel: [
      { label: "Suavidad", score: clamp(100 - (regions["p50"]?.std ?? 10) * 2.4, 10, 99) },
      { label: "Poros / textura", score: Math.round((tex(cheekL) + tex(fhead)) / 2) },
      { label: "Glicación", score: clamp(100 - bio.glicacion) },
      { label: "Manchas / uniformidad", score: bio.uniformidad },
      { label: "Luminosidad", score: bio.luminosidad },
      { label: "Daño solar", score: clamp(100 - bio.danoSolar) },
    ],
  }
}

// ── Compute zone scores from sub-metrics ──────────────────────
export function computeZoneScores(subMetrics: Record<string, SubMetric[]>): Record<string, number> {
  const scores: Record<string, number> = {}
  for (const [zone, subs] of Object.entries(subMetrics)) {
    scores[zone] = Math.round(subs.reduce((a, s) => a + s.score, 0) / subs.length)
  }
  return scores
}

// ── Compute visible age from aging-relevant sub-metrics ───────
export function computeVisibleAge(
  subMetrics: Record<string, SubMetric[]>,
  chronologicalAge: number,
): { visibleAge: number; ageDelta: number; percentile: number; ageRange: number } {
  // Same aging markers as legacy (lines 3092-3098)
  const ageMarkers: number[] = []

  const piel = subMetrics.piel || []
  const periocular = subMetrics.periocular || []
  const mejillas = subMetrics.mejillas || []
  const mandibula = subMetrics.mandibula || []
  const labios = subMetrics.labios || []

  // Piel: suavidad, poros, manchas, daño solar
  if (piel[0]) ageMarkers.push(piel[0].score)
  if (piel[1]) ageMarkers.push(piel[1].score)
  if (piel[3]) ageMarkers.push(piel[3].score)
  if (piel[5]) ageMarkers.push(piel[5].score)
  // Periocular: ojeras, bolsas, z-depth bolsas, patas de gallo
  if (periocular[2]) ageMarkers.push(periocular[2].score)
  if (periocular[3]) ageMarkers.push(periocular[3].score)
  if (periocular[4]) ageMarkers.push(periocular[4].score) // z-depth eye bags
  if (periocular[5]) ageMarkers.push(periocular[5].score) // patas de gallo
  // Mejillas: textura, nasogeniano
  if (mejillas[2]) ageMarkers.push(mejillas[2].score)
  if (mejillas[3]) ageMarkers.push(mejillas[3].score)
  // Mandíbula: z-depth definition, flacidez
  if (mandibula[1]) ageMarkers.push(mandibula[1].score) // z-depth jaw definition
  if (mandibula[3]) ageMarkers.push(mandibula[3].score) // flacidez (jowl)
  // Labios: peribucales
  if (labios[5]) ageMarkers.push(labios[5].score)

  if (!ageMarkers.length) {
    return { visibleAge: chronologicalAge, ageDelta: 0, percentile: 50, ageRange: 4 }
  }

  const agingScore = ageMarkers.reduce((a, b) => a + b, 0) / ageMarkers.length
  const agingStd = Math.sqrt(ageMarkers.reduce((a, v) => a + (v - agingScore) ** 2, 0) / ageMarkers.length)
  const as = Math.max(30, Math.min(98, agingScore))

  // Legacy formula: visibleAge = 22 + (95-as)/(95-35) * (64-22)
  const visibleAge = Math.round(Math.max(19, Math.min(72, 22 + (95 - as) / (95 - 35) * 42)) * 10) / 10
  const ageDelta = Math.round((visibleAge - chronologicalAge) * 10) / 10
  const percentile = Math.max(3, Math.min(98, Math.round(55 + (chronologicalAge - visibleAge) * 4.5)))
  const ageRange = Math.round(Math.max(2, Math.min(9, 2 + agingStd / 12)))

  return { visibleAge, ageDelta, percentile, ageRange }
}
