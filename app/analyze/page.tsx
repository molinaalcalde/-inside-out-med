"use client"

import React, { useEffect, useRef, useState, useCallback } from "react"
import { CameraStage, type Scores } from "./camera-stage"

type Stage = "choose" | "upload-guide" | "pre-quiz" | "camera" | "scanning" | "contact" | "results-1" | "gate-quiz" | "results-2" | "error"

// ── MediaPipe landmark indices per zone (upload path — 9 zones) ──
const ZONES = {
  forehead:    [10, 338, 297, 332, 284, 251, 389, 356, 109, 67, 103, 54, 21, 162, 127, 234, 93, 132],
  periocularL: [33, 7, 163, 144, 145, 153, 154, 155, 133, 173, 157, 158, 159, 160, 161, 246],
  periocularR: [362, 382, 381, 380, 374, 373, 390, 249, 263, 466, 388, 387, 386, 385, 384, 398],
  nose:        [1, 2, 98, 327, 168, 6, 197, 195, 5, 4, 240, 97, 370],
  lips:        [61, 185, 40, 39, 37, 0, 267, 269, 270, 409, 291, 375, 321, 405, 314, 17, 84, 181, 91, 146],
  cheekL:      [116, 117, 118, 119, 120, 121, 128, 126, 142, 36, 205, 207, 216],
  cheekR:      [345, 346, 347, 348, 349, 350, 357, 425, 427, 437, 436, 432, 352],
  jaw:         [172, 136, 150, 149, 176, 148, 152, 377, 400, 378, 379, 365, 397, 288, 361, 323],
  neck:        [152, 377, 400, 378, 379, 365, 397, 288, 361],
}

// Zones for the scanning animation (9 zones)
const SCAN_ZONES_ANIM = [
  { label: "Frente",       yPct: 15, color: "#e8a4b0", icon: "◈" },
  { label: "Ojo izq.",     yPct: 28, color: "#d4af88", icon: "◉" },
  { label: "Ojo der.",     yPct: 28, color: "#d4af88", icon: "◉" },
  { label: "Nariz",        yPct: 42, color: "#7ecba1", icon: "◎" },
  { label: "Mejilla izq.", yPct: 48, color: "#e8a4b0", icon: "◈" },
  { label: "Mejilla der.", yPct: 48, color: "#e8a4b0", icon: "◈" },
  { label: "Labios",       yPct: 58, color: "#d4af88", icon: "◉" },
  { label: "Mandíbula",    yPct: 70, color: "#7ecba1", icon: "◎" },
  { label: "Cuello",       yPct: 82, color: "#d4af88", icon: "◉" },
]

// ── Fitzpatrick calibration (matching camera-stage.tsx) ──────────
const FITZ_CALIBRATION: Record<number, { lumBaseline: number; redThreshold: number; inflammationSensitivity: number }> = {
  1: { lumBaseline: 195, redThreshold: 14, inflammationSensitivity: 1.3 },
  2: { lumBaseline: 185, redThreshold: 15, inflammationSensitivity: 1.15 },
  3: { lumBaseline: 170, redThreshold: 16, inflammationSensitivity: 1.0 },
  4: { lumBaseline: 150, redThreshold: 18, inflammationSensitivity: 0.85 },
  5: { lumBaseline: 130, redThreshold: 22, inflammationSensitivity: 0.7 },
  6: { lumBaseline: 110, redThreshold: 28, inflammationSensitivity: 0.55 },
}

function getAgeBaseline(age: number): { glycationOffset: number; ageMid: number } {
  if (age <= 25) return { glycationOffset: -5, ageMid: age }
  if (age <= 35) return { glycationOffset: 0,  ageMid: age }
  if (age <= 45) return { glycationOffset: 5,  ageMid: age }
  return { glycationOffset: 10, ageMid: age }
}

// ── Fitzpatrick tile config ─────────────────────────────────────
const FITZ_TILES = [
  { value: "1", color: "#FDEBD0", label: "Muy clara" },
  { value: "2", color: "#F5CBA7", label: "Clara" },
  { value: "3", color: "#E0B07A", label: "Media" },
  { value: "4", color: "#C49A6C", label: "Morena" },
  { value: "5", color: "#8B6914", label: "Oscura" },
  { value: "6", color: "#5C4033", label: "Muy oscura" },
]

// ── Zone label map ──────────────────────────────────────────────
const ZONE_LABELS: Record<string, string> = {
  forehead:    "Frente",
  periocularL: "Ojo izq.",
  periocularR: "Ojo der.",
  nose:        "Nariz",
  lips:        "Labios",
  cheekL:      "Mejilla izq.",
  cheekR:      "Mejilla der.",
  jaw:         "Mandíbula",
  neck:        "Cuello",
}

// ── Quiz step types ─────────────────────────────────────────────
interface QuizOption {
  value: string
  label: string
  sub?: string
  icon?: string
}

interface QuizStep {
  id: string
  headline: string
  sub: string
  type: "grid4" | "grid6" | "list3" | "fitz6" | "email" | "phone" | "agePicker"
  options: QuizOption[]
}

// ── Pre-scan steps (4 questions before scan) ────────────────────
const PRE_SCAN_STEPS: QuizStep[] = [
  {
    id: "age",
    headline: "¿Cuántos años tienes?",
    sub: "Calibramos todo según tu edad exacta",
    type: "agePicker",
    options: [],
  },
  {
    id: "fitzpatrick",
    headline: "¿Cuál es tu tono de piel?",
    sub: "Calibramos el análisis según tu fototipo para resultados precisos",
    type: "fitz6",
    options: FITZ_TILES,
  },
  {
    id: "concern",
    headline: "¿Qué te preocupa más?",
    sub: "Elige tu prioridad ahora — puedes cambiarla después",
    type: "grid6",
    options: [
      { value: "manchas",     label: "Manchas",     icon: "🌑" },
      { value: "arrugas",     label: "Arrugas",     icon: "〰️" },
      { value: "poros",       label: "Poros",       icon: "⊙" },
      { value: "acne",        label: "Acné",        icon: "●" },
      { value: "hidratacion", label: "Hidratación", icon: "💧" },
      { value: "luminosidad", label: "Luminosidad", icon: "✦" },
    ],
  },
  {
    id: "routine",
    headline: "¿Qué usas en tu cara ahora mismo?",
    sub: "Sin juicios — cada punto de partida es válido",
    type: "list3",
    options: [
      { value: "ninguna",  label: "Nada todavía",          sub: "Empezamos desde cero" },
      { value: "basica",   label: "Limpiador + hidratante", sub: "Base sólida" },
      { value: "completa", label: "Rutina completa",        sub: "Serum, SPF y más" },
    ],
  },
]

// ── Contact steps (2 obligatory after scan) ─────────────────────
const CONTACT_STEPS: QuizStep[] = [
  {
    id: "email",
    headline: "¿A dónde enviamos tu informe?",
    sub: "Tu análisis completo + plan de productos personalizado",
    type: "email",
    options: [],
  },
  {
    id: "phone",
    headline: "Tu WhatsApp para recomendaciones",
    sub: "Te avisamos cuando encontremos productos para tu perfil exacto",
    type: "phone",
    options: [],
  },
]

// ── Gate steps (6 questions to unlock full report) ──────────────
const GATE_STEPS: QuizStep[] = [
  {
    id: "sleep",
    headline: "¿Cuántas horas duermes?",
    sub: "El sueño es el reparador #1 de tu piel",
    type: "grid4",
    options: [
      { value: "<5h",  label: "<5h",  sub: "Poco descanso" },
      { value: "5-6h", label: "5–6h", sub: "Por debajo" },
      { value: "7-8h", label: "7–8h", sub: "Recomendado" },
      { value: "9+h",  label: "9+h",  sub: "Buen descanso" },
    ],
  },
  {
    id: "stress",
    headline: "¿Cómo describes tu nivel de estrés?",
    sub: "El cortisol impacta directamente la salud de tu piel",
    type: "list3",
    options: [
      { value: "bajo",  label: "Bajo",  sub: "Relajado la mayor parte del tiempo" },
      { value: "medio", label: "Medio", sub: "Picos ocasionales de estrés" },
      { value: "alto",  label: "Alto",  sub: "Estrés constante o crónico" },
    ],
  },
  {
    id: "sun",
    headline: "¿Cuánta exposición solar tienes?",
    sub: "El sol es el factor #1 de envejecimiento prematuro",
    type: "list3",
    options: [
      { value: "baja",  label: "Baja",  sub: "Mayormente en interiores" },
      { value: "media", label: "Media", sub: "Algo de sol diario" },
      { value: "alta",  label: "Alta",  sub: "Exposición frecuente o prolongada" },
    ],
  },
  {
    id: "exercise",
    headline: "¿Con qué frecuencia haces ejercicio?",
    sub: "La circulación impacta la oxigenación y el brillo de tu piel",
    type: "list3",
    options: [
      { value: "nunca",  label: "Nunca / casi nunca", sub: "Sedentario" },
      { value: "2-3",    label: "2–3 días",           sub: "Actividad moderada" },
      { value: "4+",     label: "4+ días",            sub: "Muy activo" },
    ],
  },
  {
    id: "diet",
    headline: "¿Cómo es tu alimentación?",
    sub: "Lo que comes se refleja en tu piel",
    type: "list3",
    options: [
      { value: "omnivora",         label: "Omnívora",           sub: "Dieta variada" },
      { value: "vegetariana",      label: "Vegetariana / vegana", sub: "Sin carne o productos animales" },
      { value: "keto",             label: "Keto / otra",        sub: "Dieta específica o restrictiva" },
    ],
  },
  {
    id: "budget",
    headline: "¿Cuánto inviertes en skincare al mes?",
    sub: "Para recomendarte productos dentro de tu rango",
    type: "grid4",
    options: [
      { value: "<30",        label: "<$30 USD",         sub: "Esencial" },
      { value: "30-80",      label: "$30–80 USD",       sub: "Intermedio" },
      { value: "80-200",     label: "$80–200 USD",      sub: "Premium" },
      { value: "200+",       label: "$200+ USD",        sub: "Luxury" },
    ],
  },
]

// ── Load MediaPipe IMAGE mode from LOCAL files ──────────────────
let _landmarkerPromise: Promise<unknown> | null = null

async function getMediaPipeLandmarker() {
  if (_landmarkerPromise) return _landmarkerPromise

  _landmarkerPromise = (async () => {
    const vision = await import(
      /* webpackIgnore: true */
      "/mediapipe/vision_bundle.mjs" as string
    ) as {
      FilesetResolver: { forVisionTasks: (path: string) => Promise<unknown> }
      FaceLandmarker: {
        createFromOptions: (resolver: unknown, opts: unknown) => Promise<{
          detect: (img: HTMLImageElement | HTMLCanvasElement) => {
            faceLandmarks: Array<Array<{ x: number; y: number; z: number }>>
          }
        }>
      }
    }

    const filesetResolver = await vision.FilesetResolver.forVisionTasks(
      "/mediapipe/wasm"
    )

    return await vision.FaceLandmarker.createFromOptions(filesetResolver, {
      baseOptions: {
        modelAssetPath: "/mediapipe/face_landmarker.task",
        delegate: "CPU",
      },
      runningMode: "IMAGE",
      numFaces: 1,
    })
  })()

  return _landmarkerPromise
}

// ── Pixel analysis on a region (for upload path) ─────────────────
function analyzeRegion(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
  if (w < 4 || h < 4) return null
  const { data } = ctx.getImageData(x, y, w, h)
  const total = w * h
  let sumLum = 0, sumR = 0, sumG = 0, sumB = 0, redPixels = 0
  const lums: number[] = []
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i], g = data[i + 1], b = data[i + 2]
    const lum = 0.299 * r + 0.587 * g + 0.114 * b
    sumLum += lum; sumR += r; sumG += g; sumB += b; lums.push(lum)
    if (r > g + 16 && r > b + 16 && r > 70) redPixels++
  }
  const avgLum = sumLum / total
  let localContrast = 0
  for (let row = 1; row < h - 1; row++) {
    for (let col = 1; col < w - 1; col++) {
      const idx = row * w + col
      const nb = (lums[(row - 1) * w + col] + lums[(row + 1) * w + col] + lums[row * w + col - 1] + lums[row * w + col + 1]) / 4
      localContrast += Math.abs(lums[idx] - nb)
    }
  }
  localContrast /= total
  let variance = 0
  for (const v of lums) variance += (v - avgLum) ** 2
  return { avgLum, avgR: sumR / total, avgG: sumG / total, avgB: sumB / total, redPixels, total, localContrast, stdDev: Math.sqrt(variance / total) }
}

function zoneBBox(landmarks: Array<{ x: number; y: number }>, indices: number[], imgW: number, imgH: number) {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
  for (const idx of indices) {
    const lm = landmarks[idx]
    if (!lm) continue
    if (lm.x * imgW < minX) minX = lm.x * imgW
    if (lm.y * imgH < minY) minY = lm.y * imgH
    if (lm.x * imgW > maxX) maxX = lm.x * imgW
    if (lm.y * imgH > maxY) maxY = lm.y * imgH
  }
  const pad = 8
  return { x: Math.max(0, Math.floor(minX - pad)), y: Math.max(0, Math.floor(minY - pad)), w: Math.min(imgW, Math.ceil(maxX - minX + pad * 2)), h: Math.min(imgH, Math.ceil(maxY - minY + pad * 2)) }
}

function clamp(v: number, lo: number, hi: number) { return Math.max(lo, Math.min(hi, v)) }

// ── Upload analysis — IMAGE mode MediaPipe (9 zones, calibrated) ─
async function runUploadAnalysis(dataUrl: string, fitzpatrick: number, age: number): Promise<Scores | null> {
  const img = await new Promise<HTMLImageElement>((res, rej) => {
    const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = dataUrl
  })

  const scale = Math.min(1, 640 / Math.max(img.width, img.height))
  const W = Math.round(img.width * scale)
  const H = Math.round(img.height * scale)
  const canvas = document.createElement("canvas")
  canvas.width = W; canvas.height = H
  const ctx = canvas.getContext("2d")!
  ctx.drawImage(img, 0, 0, W, H)

  // Brightness gate
  const fullData = ctx.getImageData(0, 0, W, H).data
  let sumLum = 0
  for (let i = 0; i < fullData.length; i += 4)
    sumLum += 0.299 * fullData[i] + 0.587 * fullData[i + 1] + 0.114 * fullData[i + 2]
  if (sumLum / (W * H) < 28) return null

  let landmarks: Array<{ x: number; y: number; z: number }>

  try {
    const landmarker = await getMediaPipeLandmarker() as {
      detect: (el: HTMLCanvasElement) => { faceLandmarks: Array<Array<{ x: number; y: number; z: number }>> }
    }
    const result = landmarker.detect(canvas)
    if (!result.faceLandmarks?.length) return null
    landmarks = result.faceLandmarks[0]
  } catch {
    return null
  }

  // Pixel analysis per zone (9 zones)
  const zoneData: Record<string, ReturnType<typeof analyzeRegion>> = {}
  for (const [zone, indices] of Object.entries(ZONES)) {
    const bbox = zoneBBox(landmarks, indices, W, H)
    zoneData[zone] = analyzeRegion(ctx, bbox.x, bbox.y, bbox.w, bbox.h)
  }

  const z = zoneData
  // Require minimum 4 zones
  if (!z.forehead || !z.cheekL || !z.cheekR || !z.nose) return null

  const fitz = FITZ_CALIBRATION[fitzpatrick] || FITZ_CALIBRATION[3]
  const ageCfg = getAgeBaseline(age)

  // Collect zone averages
  const ZONE_NAMES = Object.keys(ZONES)
  const zoneLums: number[] = []
  const zoneAvgs: Record<string, { lum: number; r: number; g: number; b: number; contrast: number; stdDev: number; redRatio: number }> = {}
  for (const zn of ZONE_NAMES) {
    const d = z[zn]
    if (!d) continue
    zoneLums.push(d.avgLum)
    zoneAvgs[zn] = {
      lum: d.avgLum, r: d.avgR, g: d.avgG, b: d.avgB,
      contrast: d.localContrast, stdDev: d.stdDev,
      redRatio: d.total > 0 ? d.redPixels / d.total : 0,
    }
  }

  const activeZones = Object.keys(zoneAvgs)
  if (activeZones.length < 4) return null

  // Global averages
  const avgLumSkin = zoneLums.reduce((s, v) => s + v, 0) / zoneLums.length
  const avgR = activeZones.reduce((s, zn) => s + zoneAvgs[zn].r, 0) / activeZones.length
  const avgG = activeZones.reduce((s, zn) => s + zoneAvgs[zn].g, 0) / activeZones.length
  const avgB = activeZones.reduce((s, zn) => s + zoneAvgs[zn].b, 0) / activeZones.length
  const avgContrast = activeZones.reduce((s, zn) => s + zoneAvgs[zn].contrast, 0) / activeZones.length
  const avgStdDev = activeZones.reduce((s, zn) => s + zoneAvgs[zn].stdDev, 0) / activeZones.length
  const totalRedPix = activeZones.reduce((s, zn) => s + (z[zn]?.redPixels ?? 0), 0)
  const totalPix = activeZones.reduce((s, zn) => s + (z[zn]?.total ?? 0), 0)
  const redRatio = totalPix > 0 ? totalRedPix / totalPix : 0

  // Cross-zone luminance std dev (uniformity)
  const lumMean = zoneLums.reduce((s, v) => s + v, 0) / zoneLums.length
  const crossZoneStdDev = Math.sqrt(zoneLums.reduce((s, v) => s + (v - lumMean) ** 2, 0) / zoneLums.length)

  // Cheek + nose red ratio (vascularity)
  let vascRedPix = 0, vascTotalPix = 0
  for (const zn of ["cheekL", "cheekR", "nose"]) {
    if (z[zn]) { vascRedPix += z[zn]!.redPixels; vascTotalPix += z[zn]!.total }
  }
  const cheekNoseRedRatio = vascTotalPix > 0 ? vascRedPix / vascTotalPix : 0

  // 7 Biomarkers (deterministic, calibrated)
  const luminosity   = clamp(Math.round((avgLumSkin / fitz.lumBaseline) * 100), 25, 98)
  const hydration    = clamp(Math.round((avgLumSkin / fitz.lumBaseline) * 90 - avgStdDev * 0.15), 30, 98)
  const uniformity   = clamp(Math.round(100 - crossZoneStdDev * 2.5 - avgContrast * 1.2), 25, 96)
  const glycation    = clamp(Math.round(((avgR - avgB) / (avgB + 1)) * 45 + ageCfg.glycationOffset + 15), 5, 75)
  const inflammation = clamp(Math.round((redRatio * 300 + (avgR - avgG) * 0.12) * fitz.inflammationSensitivity), 3, 65)
  const sunDamage    = clamp(Math.round(avgContrast * 1.8 + avgStdDev * 0.2), 5, 70)
  const vascularity  = clamp(Math.round(cheekNoseRedRatio * 250 - 10), 3, 60)

  // Overall (higher = better)
  const overall = clamp(Math.round(
    luminosity * 0.15 + hydration * 0.18 + uniformity * 0.15 +
    (100 - glycation) * 0.12 + (100 - inflammation) * 0.18 +
    (100 - sunDamage) * 0.12 + (100 - vascularity) * 0.10
  ), 30, 96)

  // Per-zone score
  const zoneScore = (zn: string): number => {
    const za = zoneAvgs[zn]
    if (!za) return 50
    const lumScore = clamp(Math.round((za.lum / fitz.lumBaseline) * 100), 20, 100)
    const redScore = clamp(Math.round(100 - za.redRatio * 400), 30, 100)
    const texScore = clamp(Math.round(100 - za.contrast * 2.0), 30, 100)
    return Math.round(lumScore * 0.35 + redScore * 0.35 + texScore * 0.30)
  }

  // Apparent age
  const ageApparent = clamp(
    ageCfg.ageMid + Math.round((100 - overall) * 0.15 + glycation * 0.08 - 5),
    17, 65
  )

  return {
    overall, luminosity, hydration, uniformity, glycation, inflammation, sunDamage, vascularity,
    ageApparent,
    zoneScores: {
      forehead:    zoneScore("forehead"),
      periocularL: zoneScore("periocularL"),
      periocularR: zoneScore("periocularR"),
      nose:        zoneScore("nose"),
      lips:        zoneScore("lips"),
      cheekL:      zoneScore("cheekL"),
      cheekR:      zoneScore("cheekR"),
      jaw:         zoneScore("jaw"),
      neck:        zoneScore("neck"),
    },
  }
}

// ── Biomarker insights (7 new biomarkers) ────────────────────────
function getBiomarkerInsight(label: string, value: number): string {
  switch (label) {
    case "Luminosidad":
      if (value >= 70) return "Tu piel refleja bien la luz. Luce descansada, nutrida y con buen tono."
      if (value >= 50) return "Piel algo apagada. La vitamina C y una buena exfoliación pueden recuperar el brillo."
      return "Piel opaca. El daño acumulado está afectando directamente la reflexión de la luz."
    case "Hidratación":
      if (value >= 75) return "Tu barrera cutánea retiene bien la humedad. Mantén tu hidratante actual."
      if (value >= 55) return "Tu piel pierde agua más rápido de lo que la repone. Refuerza la hidratación."
      return "Deshidratación crítica — tu piel está bajo estrés constante y eso amplifica todos los demás daños."
    case "Uniformidad":
      if (value >= 75) return "Tono parejo entre zonas. Tu piel refleja la luz de forma consistente."
      if (value >= 55) return "Hay variaciones de tono entre zonas. Una rutina unificadora puede equilibrarlo."
      return "Diferencias marcadas entre zonas faciales. Manchas o rojeces generan un tono desigual."
    case "Glicación":
      if (value <= 15) return "Sin signos de glicación. El colágeno no muestra daño por azúcar."
      if (value <= 30) return "Glicación leve detectada. Reducir azúcar refinada puede frenar este proceso."
      return "Glicación elevada — el azúcar está dañando las fibras de colágeno, acelerando el envejecimiento."
    case "Inflamación":
      if (value <= 15) return "Piel calmada, sin signos de estrés visible. Buen punto de partida."
      if (value <= 30) return "Inflamación silenciosa activa. Se puede expresar como rojez, sensibilidad o poros dilatados."
      return "Inflamación elevada — es el factor que amplifica el envejecimiento y daña la barrera cutánea."
    case "Daño solar":
      if (value <= 15) return "Mínimo daño solar acumulado. Tu protección UV está funcionando."
      if (value <= 30) return "Daño solar moderado. El SPF diario y antioxidantes pueden revertir parte de este daño."
      return "Daño solar significativo. Sin protección activa, las manchas y la textura irregular seguirán avanzando."
    case "Vascularidad":
      if (value <= 12) return "Red vascular estable. Sin signos de cuperosis ni rojez persistente."
      if (value <= 25) return "Algo de actividad vascular visible. Puede manifestarse como rojez en mejillas y nariz."
      return "Vascularidad elevada — tendencia a rojez, cuperosis o rosácea. Necesita ingredientes calmantes."
    default:
      return ""
  }
}

// ── Zone status helper ──────────────────────────────────────────
function getZoneStatus(score: number): { label: string; color: string; emoji: string } {
  if (score >= 80) return { label: "Excelente", color: "#7ecba1", emoji: "✓" }
  if (score >= 65) return { label: "Bien", color: "#d4af88", emoji: "~" }
  if (score >= 45) return { label: "Mejorable", color: "#e8a4b0", emoji: "!" }
  return { label: "Prioridad", color: "#ef4444", emoji: "!!" }
}

function getZoneInsight(key: string, score: number): string {
  const insights: Record<string, Record<string, string>> = {
    forehead:    { high: "Piel uniforme y bien hidratada", mid: "Algo de textura irregular — exfoliación suave ayudaría", low: "Textura marcada o deshidratación visible" },
    periocularL: { high: "Sin signos de fatiga o líneas finas", mid: "Leve deshidratación periocular", low: "Líneas de expresión o ojeras visibles" },
    periocularR: { high: "Sin signos de fatiga o líneas finas", mid: "Leve deshidratación periocular", low: "Líneas de expresión o ojeras visibles" },
    nose:        { high: "Poros controlados, tono uniforme", mid: "Algo de brillo o poros visibles", low: "Poros dilatados o rojez en la zona T" },
    lips:        { high: "Bien hidratados, sin resequedad", mid: "Algo de resequedad en el contorno", low: "Labios secos o pigmentación irregular" },
    cheekL:      { high: "Tono uniforme, sin rojez", mid: "Leve irregularidad de tono", low: "Rojez o textura irregular notable" },
    cheekR:      { high: "Tono uniforme, sin rojez", mid: "Leve irregularidad de tono", low: "Rojez o textura irregular notable" },
    jaw:         { high: "Firmeza y tono uniformes", mid: "Algo de laxitud o textura", low: "Pérdida de firmeza o acné hormonal" },
    neck:        { high: "Sin líneas ni manchas visibles", mid: "Algo de deshidratación", low: "Líneas horizontales o fotodaño" },
  }
  const zone = insights[key] || { high: "Zona en buen estado", mid: "Zona con margen de mejora", low: "Zona que necesita atención" }
  return score >= 70 ? zone.high : score >= 50 ? zone.mid : zone.low
}

// ── ProfileQuiz — multi-mode gamified questionnaire ─────────────
function ProfileQuiz({ mode, onComplete, scores }: {
  mode: "pre-scan" | "contact" | "gate"
  onComplete: (data: Record<string, string>) => void
  scores?: Scores | null
}) {
  const steps = mode === "pre-scan" ? PRE_SCAN_STEPS : mode === "contact" ? CONTACT_STEPS : GATE_STEPS
  const [step, setStep] = useState(0)
  const [data, setData] = useState<Record<string, string>>({})
  const [inputVal, setInputVal] = useState("")
  const [animating, setAnimating] = useState(false)
  const [pickerAge, setPickerAge] = useState(30)
  const pickerInitRef = useRef(false)

  const current = steps[step]

  const advance = (update: Record<string, string>) => {
    const next = { ...data, ...update }
    setData(next)
    if (step < steps.length - 1) {
      setAnimating(true)
      setTimeout(() => { setStep(s => s + 1); setInputVal(""); setAnimating(false) }, 220)
    } else {
      onComplete(next)
    }
  }

  const headerText = mode === "pre-scan"
    ? "Antes de escanear"
    : mode === "contact"
    ? "Tu análisis está listo"
    : "Desbloquea tu informe completo"

  const headerSub = mode === "pre-scan"
    ? `${steps.length} preguntas para calibrar tu análisis`
    : mode === "contact"
    ? (scores ? `Score: ${scores.overall}/100 — necesitamos tus datos para enviártelo` : "Necesitamos tus datos para enviarte el informe")
    : `${steps.length} preguntas más para personalizar tu plan`

  return (
    <div style={{ maxWidth: 480, width: "100%", margin: "0 auto" }}>
      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: 32 }}>
        <p style={{ fontSize: 10, letterSpacing: "0.18em", color: mode === "contact" ? "#7ecba1" : "#e8a4b0", textTransform: "uppercase", fontWeight: 700, marginBottom: 8 }}>
          {headerText}
        </p>
        <p style={{ fontSize: 13, color: "rgba(245,237,232,0.35)", letterSpacing: "0.04em" }}>
          {headerSub}
        </p>
      </div>

      {/* Progress dots */}
      <div style={{ display: "flex", justifyContent: "center", gap: 8, marginBottom: 40 }}>
        {steps.map((_, i) => (
          <div key={i} style={{
            width: i === step ? 24 : 7, height: 7,
            borderRadius: 4,
            background: i < step ? "#7ecba1" : i === step ? "#e8a4b0" : "rgba(245,237,232,0.12)",
            transition: "all 0.3s ease",
          }} />
        ))}
      </div>

      {/* Question card */}
      <div style={{
        opacity: animating ? 0 : 1,
        transform: animating ? "translateY(8px)" : "translateY(0)",
        transition: "opacity 0.2s, transform 0.2s",
      }}>
        <h2 style={{
          fontFamily: "var(--font-fraunces)",
          fontSize: "clamp(22px, 4vw, 32px)",
          fontWeight: 400,
          letterSpacing: "-0.03em",
          lineHeight: 1.15,
          marginBottom: 10,
          textAlign: "center",
        }}>
          {current.headline}
        </h2>
        <p style={{ fontSize: 13, color: "rgba(245,237,232,0.4)", textAlign: "center", marginBottom: 32, lineHeight: 1.6 }}>
          {current.sub}
        </p>

        {/* grid4: 4 big tiles */}
        {current.type === "grid4" && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            {current.options.map(opt => (
              <button key={opt.value} onClick={() => advance({ [current.id]: opt.value })}
                style={{
                  padding: "24px 16px",
                  background: "rgba(245,237,232,0.03)",
                  border: "1.5px solid rgba(245,237,232,0.10)",
                  borderRadius: 16,
                  cursor: "pointer",
                  color: "#f5ede8",
                  textAlign: "center",
                  transition: "all 0.18s",
                  display: "flex", flexDirection: "column", alignItems: "center", gap: 6,
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(232,164,176,0.5)"; e.currentTarget.style.background = "rgba(232,164,176,0.06)" }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(245,237,232,0.10)"; e.currentTarget.style.background = "rgba(245,237,232,0.03)" }}
              >
                <span style={{ fontFamily: "var(--font-fraunces)", fontSize: 28, fontWeight: 300, color: "#e8a4b0", lineHeight: 1 }}>{opt.label}</span>
                {opt.sub && <span style={{ fontSize: 10, color: "rgba(245,237,232,0.35)", letterSpacing: "0.08em" }}>{opt.sub}</span>}
              </button>
            ))}
          </div>
        )}

        {/* agePicker: Apple-style scroll wheel */}
        {current.type === "agePicker" && (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 28 }}>
            <div style={{ position: "relative", width: 120, height: 260, overflow: "hidden" }}>
              <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 104, background: "linear-gradient(to bottom, #0e0c12, transparent)", zIndex: 2, pointerEvents: "none" }} />
              <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 104, background: "linear-gradient(to top, #0e0c12, transparent)", zIndex: 2, pointerEvents: "none" }} />
              <div style={{
                position: "absolute", top: 104, left: 0, right: 0, height: 52,
                borderTop: "1px solid rgba(232,164,176,0.3)", borderBottom: "1px solid rgba(232,164,176,0.3)",
                background: "rgba(232,164,176,0.06)", zIndex: 1, pointerEvents: "none",
              }} />
              <div
                className="age-scroll"
                ref={(el: HTMLDivElement | null) => {
                  if (el && !pickerInitRef.current) {
                    pickerInitRef.current = true
                    el.scrollTop = (30 - 18) * 52
                  }
                }}
                onScroll={(e) => {
                  const idx = Math.round(e.currentTarget.scrollTop / 52)
                  const clamped = Math.max(0, Math.min(62, idx))
                  setPickerAge(18 + clamped)
                }}
                style={{ height: 260, overflowY: "scroll", position: "relative", zIndex: 3 }}
              >
                <div style={{ height: 104 }} />
                {Array.from({ length: 63 }, (_, i) => i + 18).map(age => (
                  <div key={age} className="age-snap" style={{
                    height: 52, display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    <span style={{
                      fontFamily: "var(--font-fraunces)",
                      fontSize: age === pickerAge ? 42 : 28,
                      fontWeight: age === pickerAge ? 400 : 300,
                      color: age === pickerAge ? "#e8a4b0" : "#f5ede8",
                      opacity: age === pickerAge ? 1 : Math.abs(age - pickerAge) === 1 ? 0.45 : Math.abs(age - pickerAge) === 2 ? 0.2 : 0.1,
                      transform: `scale(${age === pickerAge ? 1 : Math.abs(age - pickerAge) === 1 ? 0.85 : 0.7})`,
                      transition: "all 0.15s ease",
                      lineHeight: 1,
                    }}>
                      {age}
                    </span>
                  </div>
                ))}
                <div style={{ height: 104 }} />
              </div>
            </div>

            <button
              onClick={() => advance({ age: String(pickerAge) })}
              style={{
                padding: "15px 48px",
                background: "linear-gradient(135deg, #e8a4b0, #c97e8e)",
                border: "none", borderRadius: 12, color: "#fff",
                fontSize: 15, fontWeight: 700, cursor: "pointer",
                boxShadow: "0 6px 20px rgba(232,164,176,0.3)",
              }}
            >
              Tengo {pickerAge} años
            </button>

            <style>{`
              .age-scroll::-webkit-scrollbar { display: none; }
              .age-scroll { -ms-overflow-style: none; scrollbar-width: none; -webkit-overflow-scrolling: touch; scroll-snap-type: y mandatory; }
              .age-snap { scroll-snap-align: center; }
            `}</style>
          </div>
        )}

        {/* grid6: 6 icon tiles */}
        {current.type === "grid6" && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
            {current.options.map(opt => (
              <button key={opt.value} onClick={() => advance({ [current.id]: opt.value })}
                style={{
                  padding: "20px 10px",
                  background: "rgba(245,237,232,0.03)",
                  border: "1.5px solid rgba(245,237,232,0.10)",
                  borderRadius: 14,
                  cursor: "pointer", color: "#f5ede8",
                  textAlign: "center", transition: "all 0.18s",
                  display: "flex", flexDirection: "column", alignItems: "center", gap: 8,
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(212,175,136,0.5)"; e.currentTarget.style.background = "rgba(212,175,136,0.06)" }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(245,237,232,0.10)"; e.currentTarget.style.background = "rgba(245,237,232,0.03)" }}
              >
                {opt.icon && <span style={{ fontSize: 22 }}>{opt.icon}</span>}
                <span style={{ fontSize: 11, fontWeight: 600, color: "rgba(245,237,232,0.75)" }}>{opt.label}</span>
              </button>
            ))}
          </div>
        )}

        {/* fitz6: Fitzpatrick 3x2 grid of circular skin tone tiles */}
        {current.type === "fitz6" && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14 }}>
            {FITZ_TILES.map(tile => {
              const isSelected = data[current.id] === tile.value
              return (
                <button key={tile.value} onClick={() => advance({ [current.id]: tile.value })}
                  style={{
                    padding: "18px 10px",
                    background: "rgba(245,237,232,0.03)",
                    border: `1.5px solid ${isSelected ? "rgba(232,164,176,0.6)" : "rgba(245,237,232,0.10)"}`,
                    borderRadius: 16,
                    cursor: "pointer",
                    color: "#f5ede8",
                    textAlign: "center",
                    transition: "all 0.18s",
                    display: "flex", flexDirection: "column", alignItems: "center", gap: 10,
                  }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(232,164,176,0.5)"; e.currentTarget.style.background = "rgba(232,164,176,0.06)" }}
                  onMouseLeave={e => { if (!isSelected) { e.currentTarget.style.borderColor = "rgba(245,237,232,0.10)"; e.currentTarget.style.background = "rgba(245,237,232,0.03)" } }}
                >
                  <div style={{ position: "relative", width: 52, height: 52, borderRadius: "50%", background: tile.color, border: "2px solid rgba(255,255,255,0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    {isSelected && (
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                        <path d="M5 13l4 4L19 7" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 600, color: "rgba(245,237,232,0.65)" }}>{tile.label}</span>
                </button>
              )
            })}
          </div>
        )}

        {/* list3: 3 vertical options */}
        {current.type === "list3" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {current.options.map(opt => (
              <button key={opt.value} onClick={() => advance({ [current.id]: opt.value })}
                style={{
                  padding: "18px 20px",
                  background: "rgba(245,237,232,0.03)",
                  border: "1.5px solid rgba(245,237,232,0.10)",
                  borderRadius: 14,
                  cursor: "pointer", color: "#f5ede8",
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  transition: "all 0.18s",
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(126,203,161,0.5)"; e.currentTarget.style.background = "rgba(126,203,161,0.06)" }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(245,237,232,0.10)"; e.currentTarget.style.background = "rgba(245,237,232,0.03)" }}
              >
                <div style={{ textAlign: "left" }}>
                  <p style={{ fontSize: 14, fontWeight: 600, marginBottom: 2 }}>{opt.label}</p>
                  {opt.sub && <p style={{ fontSize: 11, color: "rgba(245,237,232,0.35)" }}>{opt.sub}</p>}
                </div>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0, opacity: 0.4 }}>
                  <path d="M6 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            ))}
          </div>
        )}

        {/* email input — required, validated */}
        {current.type === "email" && (() => {
          const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(inputVal)
          return (
          <div>
            <div style={{ position: "relative", marginBottom: 12 }}>
              <input
                type="email"
                placeholder="tu@email.com"
                value={inputVal}
                onChange={e => setInputVal(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter" && emailValid) advance({ [current.id]: inputVal }) }}
                autoFocus
                style={{
                  width: "100%", padding: "18px 20px",
                  background: "rgba(245,237,232,0.04)",
                  border: `1.5px solid ${inputVal && !emailValid ? "rgba(232,164,176,0.5)" : "rgba(245,237,232,0.15)"}`,
                  borderRadius: 14, color: "#f5ede8",
                  fontSize: 16, outline: "none",
                  transition: "border-color 0.2s",
                  fontFamily: "inherit",
                }}
                onFocus={e => { e.target.style.borderColor = emailValid ? "rgba(232,164,176,0.5)" : "rgba(245,237,232,0.15)" }}
                onBlur={e => { e.target.style.borderColor = inputVal && !emailValid ? "rgba(232,164,176,0.5)" : "rgba(245,237,232,0.15)" }}
              />
              {inputVal && !emailValid && (
                <p style={{ fontSize: 11, color: "#e8a4b0", marginTop: 6, textAlign: "left" }}>
                  Ingresa un email válido
                </p>
              )}
            </div>
            <button
              onClick={() => { if (emailValid) advance({ [current.id]: inputVal }) }}
              disabled={!emailValid}
              style={{
                width: "100%", padding: "15px",
                background: emailValid ? "linear-gradient(135deg,#e8a4b0,#c97e8e)" : "rgba(245,237,232,0.06)",
                border: "none", borderRadius: 12, color: emailValid ? "#fff" : "rgba(245,237,232,0.3)",
                fontSize: 14, fontWeight: 700, cursor: emailValid ? "pointer" : "not-allowed",
                transition: "all 0.3s", marginBottom: 12,
              }}
            >
              Enviar mi informe →
            </button>
            <p style={{ fontSize: 10, color: "rgba(245,237,232,0.22)", textAlign: "center" }}>
              Necesitamos tu email para enviarte el informe completo
            </p>
          </div>
          )
        })()}

        {/* phone input — numbers only, required, min 8 digits */}
        {current.type === "phone" && (() => {
          const digitsOnly = inputVal.replace(/\D/g, "")
          const isValid = digitsOnly.length >= 8
          return (
          <div>
            <div style={{ position: "relative", marginBottom: 12 }}>
              <input
                type="tel"
                inputMode="numeric"
                placeholder="+52 55 1234 5678"
                value={inputVal}
                onChange={e => {
                  const filtered = e.target.value.replace(/[^\d\s+\-()]/g, "")
                  setInputVal(filtered)
                }}
                onKeyDown={e => { if (e.key === "Enter" && isValid) advance({ [current.id]: inputVal }) }}
                autoFocus
                style={{
                  width: "100%", padding: "18px 20px",
                  background: "rgba(245,237,232,0.04)",
                  border: `1.5px solid ${inputVal && !isValid ? "rgba(232,164,176,0.5)" : "rgba(245,237,232,0.15)"}`,
                  borderRadius: 14, color: "#f5ede8",
                  fontSize: 16, outline: "none", fontFamily: "inherit",
                  transition: "border-color 0.2s",
                }}
                onFocus={e => { e.target.style.borderColor = isValid ? "rgba(126,203,161,0.5)" : "rgba(232,164,176,0.5)" }}
                onBlur={e => { e.target.style.borderColor = inputVal && !isValid ? "rgba(232,164,176,0.5)" : "rgba(245,237,232,0.15)" }}
              />
              {inputVal && !isValid && (
                <p style={{ fontSize: 11, color: "#e8a4b0", marginTop: 6, textAlign: "left" }}>
                  Ingresa un número válido (mínimo 8 dígitos)
                </p>
              )}
            </div>
            <button
              onClick={() => { if (isValid) advance({ [current.id]: inputVal }) }}
              disabled={!isValid}
              style={{
                width: "100%", padding: "15px",
                background: isValid ? "linear-gradient(135deg,#7ecba1,#5aab82)" : "rgba(245,237,232,0.06)",
                border: "none", borderRadius: 12, color: isValid ? "#fff" : "rgba(245,237,232,0.3)",
                fontSize: 14, fontWeight: 700,
                cursor: isValid ? "pointer" : "not-allowed",
                marginBottom: 12,
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                transition: "all 0.3s",
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
              Activar WhatsApp
            </button>
            <p style={{ fontSize: 10, color: "rgba(245,237,232,0.22)", textAlign: "center" }}>
              Necesitamos tu número para enviarte recomendaciones
            </p>
          </div>
          )
        })()}
      </div>
    </div>
  )
}

// ── Main page component ───────────────────────────────────────────
export default function AnalyzePage() {
  const [stage, setStage] = useState<Stage>("choose")
  const [captureMode, setCaptureMode] = useState<"camera" | "upload">("camera")
  const [capturedUrl, setCapturedUrl] = useState<string | null>(null)
  const [scanProgress, setScanProgress] = useState(0)
  const [activeZoneIdx, setActiveZoneIdx] = useState(-1)
  const [completedZones, setCompletedZones] = useState<number[]>([])
  const [qualityError, setQualityError] = useState<string | null>(null)
  const [scores, setScores] = useState<Scores | null>(null)
  const [preQuizData, setPreQuizData] = useState<Record<string, string>>({})
  const [contactData, setContactData] = useState<Record<string, string>>({})
  const [gateData, setGateData] = useState<Record<string, string>>({})

  const fileRef = useRef<HTMLInputElement>(null)
  const scanIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // ── Camera path: scores arrive pre-computed ────────────────────
  const beginScanWithScores = useCallback((dataUrl: string, preScores: Scores) => {
    setStage("scanning")
    setScanProgress(0)
    setActiveZoneIdx(-1)
    setCompletedZones([])
    let progress = 0

    scanIntervalRef.current = setInterval(() => {
      progress += 1.0 + (progress / 100) * 0.6
      if (progress >= 100) {
        progress = 100
        clearInterval(scanIntervalRef.current!)
        setTimeout(() => {
          setScores(preScores)
          setStage("contact")
        }, 500)
      }
      setScanProgress(Math.min(progress, 100))

      const zoneIdx = Math.min(Math.floor((Math.min(progress, 100) / 100) * SCAN_ZONES_ANIM.length), SCAN_ZONES_ANIM.length - 1)
      setActiveZoneIdx(prev => {
        if (zoneIdx > prev) {
          setCompletedZones(c => prev >= 0 ? [...c, prev] : c)
          return zoneIdx
        }
        return prev
      })
    }, 80)
  }, [])

  // ── Upload path: run analysis after capture ────────────────────
  const beginScanWithUpload = useCallback((dataUrl: string) => {
    const fitzpatrick = parseInt(preQuizData.fitzpatrick || "3", 10)
    const age = parseInt(preQuizData.age || "30", 10)

    setStage("scanning")
    setScanProgress(0)
    setActiveZoneIdx(-1)
    setCompletedZones([])
    let progress = 0
    let analysisResult: Scores | null | undefined = undefined

    runUploadAnalysis(dataUrl, fitzpatrick, age).then(r => { analysisResult = r }).catch(() => { analysisResult = null })

    scanIntervalRef.current = setInterval(() => {
      progress += 1.0 + (progress / 100) * 0.6
      if (progress >= 100) {
        progress = 100
        clearInterval(scanIntervalRef.current!)
        const finish = () => {
          if (analysisResult === undefined) { setTimeout(finish, 200); return }
          if (analysisResult === null) {
            setQualityError("No detectamos un rostro con claridad. Necesitamos buena luz frontal y que el rostro esté centrado y visible.")
            setStage("error")
          } else {
            setScores(analysisResult)
            setStage("contact")
          }
        }
        setTimeout(finish, 500)
      }
      setScanProgress(Math.min(progress, 100))

      const zoneIdx = Math.min(Math.floor((Math.min(progress, 100) / 100) * SCAN_ZONES_ANIM.length), SCAN_ZONES_ANIM.length - 1)
      setActiveZoneIdx(prev => {
        if (zoneIdx > prev) {
          setCompletedZones(c => prev >= 0 ? [...c, prev] : c)
          return zoneIdx
        }
        return prev
      })
    }, 80)
  }, [preQuizData])

  const handleCameraCapture = useCallback((dataUrl: string, preScores: Scores) => {
    setCapturedUrl(dataUrl)
    beginScanWithScores(dataUrl, preScores)
  }, [beginScanWithScores])

  const handleScanError = useCallback((reason: string) => {
    setQualityError(reason)
    setStage("error")
  }, [])

  const handleFile = useCallback((file: File) => {
    if (!file.type.startsWith("image/")) return
    const reader = new FileReader()
    reader.onload = e => {
      const url = e.target?.result as string
      setCapturedUrl(url)
      beginScanWithUpload(url)
    }
    reader.readAsDataURL(file)
  }, [beginScanWithUpload])

  useEffect(() => {
    return () => { if (scanIntervalRef.current) clearInterval(scanIntervalRef.current) }
  }, [])

  const reset = () => {
    setCapturedUrl(null)
    setScanProgress(0)
    setActiveZoneIdx(-1)
    setCompletedZones([])
    setQualityError(null)
    setScores(null)
    setPreQuizData({})
    setContactData({})
    setGateData({})
    setStage("choose")
  }

  // ── Pre-quiz complete → go to camera or upload ─────────────────
  const handlePreQuizComplete = (data: Record<string, string>) => {
    setPreQuizData(data)
    if (captureMode === "camera") {
      setStage("camera")
    } else {
      setStage("upload-guide")
    }
  }

  // ── Contact complete → results-1 ──────────────────────────────
  const handleContactComplete = (data: Record<string, string>) => {
    setContactData(data)
    // Save to localStorage
    try {
      localStorage.setItem("insideoutmed_profile", JSON.stringify({ ...preQuizData, ...data }))
      if (scores) {
        localStorage.setItem("insideoutmed_scores", JSON.stringify({
          overall: scores.overall,
          luminosity: scores.luminosity,
          hydration: scores.hydration,
          uniformity: scores.uniformity,
          glycation: scores.glycation,
          inflammation: scores.inflammation,
          sunDamage: scores.sunDamage,
          vascularity: scores.vascularity,
          ...preQuizData, ...data,
        }))
      }
    } catch {}
    setStage("results-1")
  }

  // ── Gate quiz complete → results-2 ─────────────────────────────
  const handleGateComplete = (data: Record<string, string>) => {
    setGateData(data)
    // Save all data to localStorage
    try {
      localStorage.setItem("insideoutmed_profile", JSON.stringify({ ...preQuizData, ...contactData, ...data }))
      if (scores) {
        localStorage.setItem("insideoutmed_scores", JSON.stringify({
          overall: scores.overall,
          luminosity: scores.luminosity,
          hydration: scores.hydration,
          uniformity: scores.uniformity,
          glycation: scores.glycation,
          inflammation: scores.inflammation,
          sunDamage: scores.sunDamage,
          vascularity: scores.vascularity,
          ...preQuizData, ...contactData, ...data,
        }))
      }
    } catch {}
    setStage("results-2")
  }

  // ── Build biomarker list ──────────────────────────────────────
  // For "lower is better" metrics, we show a HEALTH score (100 - raw)
  // so all bars read left-to-right = better, more intuitive for the user
  const biomarkers = scores ? [
    { label: "Luminosidad",      rawValue: scores.luminosity,    higherBetter: true,  friendlyLabel: "Luminosidad" },
    { label: "Hidratación",      rawValue: scores.hydration,     higherBetter: true,  friendlyLabel: "Hidratación" },
    { label: "Uniformidad",      rawValue: scores.uniformity,    higherBetter: true,  friendlyLabel: "Uniformidad de tono" },
    { label: "Glicación",        rawValue: scores.glycation,     higherBetter: false, friendlyLabel: "Salud del colágeno" },
    { label: "Inflamación",      rawValue: scores.inflammation,  higherBetter: false, friendlyLabel: "Control de inflamación" },
    { label: "Daño solar",       rawValue: scores.sunDamage,     higherBetter: false, friendlyLabel: "Protección solar" },
    { label: "Vascularidad",     rawValue: scores.vascularity,   higherBetter: false, friendlyLabel: "Salud vascular" },
  ].map(b => {
    // Display value: always "higher = better" for intuitive reading
    const displayValue = b.higherBetter ? b.rawValue : (100 - b.rawValue)
    const severity = 100 - displayValue // higher severity = worse
    const color = displayValue >= 75 ? "#7ecba1" : displayValue >= 55 ? "#d4af88" : "#e8a4b0"
    const note = displayValue >= 75 ? "Excelente" : displayValue >= 55 ? "Aceptable" : displayValue >= 35 ? "Mejorable" : "Atención"
    const alert = displayValue < 55
    return { ...b, value: displayValue, severity, color, note, alert, insight: getBiomarkerInsight(b.label, b.rawValue) }
  }) : []

  // Top 3 critical findings (sorted by severity)
  const criticalFindings = [...biomarkers].sort((a, b) => b.severity - a.severity).slice(0, 3)

  const percentile = scores ? Math.round(100 - scores.overall * 0.82) : 18

  return (
    <div style={{ minHeight: "100vh", background: "#0e0c12", color: "#f5ede8", fontFamily: "var(--font-inter, sans-serif)", display: "flex", flexDirection: "column" }}>

      {/* Nav */}
      <nav style={{ padding: "0 24px", height: 68, display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid rgba(245,237,232,0.06)", flexShrink: 0 }}>
        <a href="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
          <svg width="26" height="26" viewBox="0 0 28 28" fill="none"><circle cx="14" cy="14" r="13" stroke="#e8a4b0" strokeWidth="1.5"/><circle cx="14" cy="14" r="7" stroke="#e8a4b0" strokeWidth="1" strokeDasharray="3 2"/><circle cx="14" cy="14" r="3" fill="#e8a4b0"/></svg>
          <span style={{ fontFamily: "var(--font-fraunces)", fontSize: 17, fontWeight: 500, color: "#f5ede8" }}>InsideOutMed</span>
        </a>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 10, color: "rgba(245,237,232,0.28)", letterSpacing: "0.14em", textTransform: "uppercase" }}>Análisis Facial</span>
        </div>
      </nav>

      <main style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 24px" }}>

        {/* ── CHOOSE ── */}
        {stage === "choose" && (
          <div style={{ maxWidth: 520, width: "100%", textAlign: "center" }}>
            <p style={{ fontSize: 10, letterSpacing: "0.16em", color: "#e8a4b0", textTransform: "uppercase", fontWeight: 700, marginBottom: 14 }}>Paso 1</p>
            <h1 style={{ fontFamily: "var(--font-fraunces)", fontSize: "clamp(26px, 5vw, 42px)", fontWeight: 400, lineHeight: 1.1, marginBottom: 12, letterSpacing: "-0.03em" }}>
              ¿Cómo quieres analizarte?
            </h1>
            <p style={{ fontSize: 14, color: "rgba(245,237,232,0.42)", marginBottom: 36, lineHeight: 1.65 }}>
              Detectamos 478 puntos faciales y analizamos cada zona de tu piel.<br/>
              Necesitas <strong style={{ color: "rgba(245,237,232,0.7)", fontWeight: 500 }}>buena luz natural</strong> y el rostro visible.
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 28 }}>
              <button onClick={() => { setCaptureMode("camera"); setStage("pre-quiz") }}
                style={{ background: "rgba(245,237,232,0.03)", border: "1.5px solid rgba(245,237,232,0.1)", borderRadius: 18, padding: "28px 18px", cursor: "pointer", color: "#f5ede8", textAlign: "center", transition: "all 0.2s", display: "flex", flexDirection: "column", alignItems: "center", gap: 14 }}
                onMouseEnter={e=>{e.currentTarget.style.borderColor="rgba(232,164,176,0.45)";e.currentTarget.style.background="rgba(232,164,176,0.05)"}}
                onMouseLeave={e=>{e.currentTarget.style.borderColor="rgba(245,237,232,0.1)";e.currentTarget.style.background="rgba(245,237,232,0.03)"}}>
                <div style={{ width: 52, height: 52, borderRadius: "50%", background: "rgba(232,164,176,0.1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <svg width="24" height="24" viewBox="0 0 28 28" fill="none"><rect x="2" y="7" width="24" height="18" rx="3" stroke="#e8a4b0" strokeWidth="1.5"/><circle cx="14" cy="16" r="5" stroke="#e8a4b0" strokeWidth="1.5"/><path d="M10 7V5a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2" stroke="#e8a4b0" strokeWidth="1.5"/></svg>
                </div>
                <div><p style={{ fontSize: 15, fontWeight: 600, marginBottom: 4 }}>Escaneo en vivo</p><p style={{ fontSize: 12, color: "rgba(245,237,232,0.4)", lineHeight: 1.5 }}>Cámara frontal</p></div>
                <span style={{ fontSize: 9, color: "#e8a4b0", letterSpacing: "0.12em", fontWeight: 700, border: "1px solid rgba(232,164,176,0.3)", padding: "2px 10px", borderRadius: 99 }}>RECOMENDADO</span>
              </button>
              <button onClick={() => { setCaptureMode("upload"); setStage("pre-quiz") }}
                style={{ background: "rgba(245,237,232,0.03)", border: "1.5px solid rgba(245,237,232,0.1)", borderRadius: 18, padding: "28px 18px", cursor: "pointer", color: "#f5ede8", textAlign: "center", transition: "all 0.2s", display: "flex", flexDirection: "column", alignItems: "center", gap: 14 }}
                onMouseEnter={e=>{e.currentTarget.style.borderColor="rgba(245,237,232,0.22)";e.currentTarget.style.background="rgba(245,237,232,0.05)"}}
                onMouseLeave={e=>{e.currentTarget.style.borderColor="rgba(245,237,232,0.1)";e.currentTarget.style.background="rgba(245,237,232,0.03)"}}>
                <div style={{ width: 52, height: 52, borderRadius: "50%", background: "rgba(245,237,232,0.06)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <svg width="24" height="24" viewBox="0 0 28 28" fill="none"><rect x="3" y="3" width="22" height="22" rx="4" stroke="rgba(245,237,232,0.55)" strokeWidth="1.5"/><circle cx="10" cy="10" r="2.5" stroke="rgba(245,237,232,0.55)" strokeWidth="1.5"/><path d="M3 18l6-6 4 4 4-5 8 7" stroke="rgba(245,237,232,0.55)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </div>
                <div><p style={{ fontSize: 15, fontWeight: 600, marginBottom: 4 }}>Subir selfie</p><p style={{ fontSize: 12, color: "rgba(245,237,232,0.4)", lineHeight: 1.5 }}>Desde galería</p></div>
                <span style={{ fontSize: 9, color: "rgba(245,237,232,0.3)", letterSpacing: "0.12em", fontWeight: 600 }}>JPG / PNG</span>
              </button>
            </div>
            <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f) }}/>
            <div style={{ background: "rgba(245,237,232,0.025)", border: "1px solid rgba(245,237,232,0.07)", borderRadius: 12, padding: "14px 18px", marginBottom: 20, textAlign: "left", display: "flex", flexDirection: "column", gap: 6 }}>
              {["Luz natural o lámpara frontal. Sin contraluz.","Rostro descubierto, sin gafas ni maquillaje.","Cámara a la altura de los ojos."].map((tip,i)=>(
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ fontSize: 9, color: "#7ecba1", fontWeight: 700 }}>0{i+1}</span>
                  <span style={{ fontSize: 12, color: "rgba(245,237,232,0.45)" }}>{tip}</span>
                </div>
              ))}
            </div>
            <p style={{ fontSize: 10, color: "rgba(245,237,232,0.18)", letterSpacing: "0.07em" }}>478 PUNTOS FACIALES · PROCESAMIENTO LOCAL · 100% PRIVADO</p>
          </div>
        )}

        {/* ── PRE-QUIZ ── */}
        {stage === "pre-quiz" && (
          <ProfileQuiz mode="pre-scan" onComplete={handlePreQuizComplete} />
        )}

        {/* ── UPLOAD GUIDE ── */}
        {stage === "upload-guide" && (
          <div style={{ maxWidth: 480, width: "100%", textAlign: "center" }}>
            <p style={{ fontSize: 10, letterSpacing: "0.16em", color: "#d4af88", textTransform: "uppercase", fontWeight: 700, marginBottom: 14 }}>Antes de subir tu foto</p>
            <h2 style={{ fontFamily: "var(--font-fraunces)", fontSize: "clamp(22px, 4vw, 32px)", fontWeight: 400, marginBottom: 10, letterSpacing: "-0.03em", lineHeight: 1.15 }}>
              La foto correcta marca<br/><em style={{ color: "#e8a4b0", fontStyle: "italic" }}>la diferencia en los resultados</em>
            </h2>
            <p style={{ fontSize: 13, color: "rgba(245,237,232,0.4)", marginBottom: 28, lineHeight: 1.65 }}>Usamos 478 puntos para mapear tu cara y analizar cada zona.</p>
            <div style={{ textAlign: "left", marginBottom: 14 }}>
              <p style={{ fontSize: 9, letterSpacing: "0.16em", textTransform: "uppercase", color: "#7ecba1", fontWeight: 700, marginBottom: 10 }}>Asi funciona</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                {[
                  { icon: "☀", text: "Luz natural frontal — ventana o lámpara apuntando a tu cara, sin contraluz" },
                  { icon: "👤", text: "Rostro centrado y completo — frente, mejillas, nariz y mentón visibles" },
                  { icon: "🚫", text: "Sin maquillaje, filtros, gafas ni cabello tapando la cara" },
                  { icon: "📐", text: "Cámara al nivel de los ojos, a 30–50 cm de distancia" },
                  { icon: "🔆", text: "Imagen nítida y bien expuesta" },
                ].map((item,i)=>(
                  <div key={i} style={{ display: "flex", gap: 12, padding: "11px 14px", background: "rgba(126,203,161,0.04)", border: "1px solid rgba(126,203,161,0.1)", borderRadius: 11 }}>
                    <span style={{ fontSize: 15, flexShrink: 0 }}>{item.icon}</span>
                    <span style={{ fontSize: 13, color: "rgba(245,237,232,0.6)", lineHeight: 1.55 }}>{item.text}</span>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => setStage("pre-quiz")} style={{ flex: 1, padding: "13px", background: "rgba(245,237,232,0.05)", border: "1px solid rgba(245,237,232,0.1)", borderRadius: 12, color: "rgba(245,237,232,0.5)", fontSize: 13, cursor: "pointer" }}>Volver</button>
              <button onClick={() => fileRef.current?.click()} style={{ flex: 2, padding: "13px", background: "linear-gradient(135deg,#d4af88,#b8936a)", border: "none", borderRadius: 12, color: "#0e0c12", fontSize: 14, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><rect x="3" y="3" width="18" height="18" rx="3" stroke="currentColor" strokeWidth="2"/><circle cx="8.5" cy="8.5" r="1.5" fill="currentColor"/><path d="M3 15l5-5 4 4 3-3 6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                Elegir foto
              </button>
            </div>
          </div>
        )}

        {/* ── CAMERA — uses CameraStage with guided experience ── */}
        {stage === "camera" && (
          <CameraStage
            onCapture={handleCameraCapture}
            onCancel={reset}
            onScanError={handleScanError}
            fitzpatrick={parseInt(preQuizData.fitzpatrick || "3", 10)}
            age={parseInt(preQuizData.age || "30", 10)}
          />
        )}

        {/* ── SCANNING — cinematic 9-zone reveal ── */}
        {stage === "scanning" && capturedUrl && (
          <div style={{ maxWidth: 400, width: "100%", textAlign: "center" }}>
            <p style={{ fontSize: 10, letterSpacing: "0.16em", color: "#e8a4b0", textTransform: "uppercase", fontWeight: 700, marginBottom: 20 }}>
              Analizando 9 zonas faciales
            </p>

            {/* Face image with animated zone overlays */}
            <div style={{ position: "relative", width: "100%", paddingBottom: "125%", borderRadius: 22, overflow: "hidden", marginBottom: 20, border: "1px solid rgba(232,164,176,0.12)" }}>
              <img src={capturedUrl} alt="análisis" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />

              {/* Dark vignette */}
              <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg,rgba(14,12,18,0.3) 0%,transparent 20%,transparent 70%,rgba(14,12,18,0.6) 100%)", pointerEvents: "none" }} />

              {/* Scan beam */}
              <div style={{
                position: "absolute", left: 0, right: 0, height: 3,
                background: "linear-gradient(90deg,transparent,#e8a4b0 20%,#d4af88 50%,#7ecba1 80%,transparent)",
                boxShadow: "0 0 20px rgba(232,164,176,0.8), 0 0 40px rgba(232,164,176,0.4)",
                top: `${Math.min(scanProgress, 95)}%`,
                transition: "top 0.12s linear",
                opacity: scanProgress < 99 ? 1 : 0,
              }} />

              {/* Zone labels — appear as they're scanned */}
              {SCAN_ZONES_ANIM.map((zone, i) => {
                const isActive  = activeZoneIdx === i
                const isDone    = completedZones.includes(i)
                const shouldShow = (scanProgress / 100) * SCAN_ZONES_ANIM.length > i
                if (!shouldShow) return null
                return (
                  <div key={i} style={{
                    position: "absolute", left: 12, top: `${zone.yPct}%`,
                    display: "flex", alignItems: "center", gap: 6,
                    animation: "scanZonePop 0.3s ease forwards",
                  }}>
                    <div style={{
                      width: 6, height: 6, borderRadius: "50%",
                      background: isDone ? zone.color : isActive ? zone.color : "rgba(245,237,232,0.3)",
                      boxShadow: isActive ? `0 0 10px ${zone.color}` : "none",
                      animation: isActive ? "pulseDot 0.8s ease-in-out infinite" : "none",
                      transition: "all 0.3s",
                    }} />
                    <span style={{
                      fontSize: 9, letterSpacing: "0.12em", textTransform: "uppercase", fontWeight: 700,
                      color: isDone ? zone.color : isActive ? zone.color : "rgba(245,237,232,0.4)",
                      transition: "color 0.3s",
                      textShadow: isActive ? `0 0 8px ${zone.color}` : "none",
                    }}>
                      {zone.icon} {zone.label}
                    </span>
                    {isDone && (
                      <span style={{ fontSize: 9, color: zone.color, fontWeight: 700 }}>✓</span>
                    )}
                  </div>
                )
              })}

              {/* Scan complete flash */}
              {scanProgress >= 99 && (
                <div style={{
                  position: "absolute", inset: 0,
                  background: "rgba(126,203,161,0.08)",
                  animation: "scanFlash 0.5s ease forwards",
                  pointerEvents: "none",
                }} />
              )}
            </div>

            {/* Progress bar */}
            <div style={{ height: 2, background: "rgba(245,237,232,0.07)", borderRadius: 2, overflow: "hidden", marginBottom: 12 }}>
              <div style={{ height: "100%", width: `${scanProgress}%`, background: `linear-gradient(90deg,#e8a4b0,#d4af88,#7ecba1)`, transition: "width 0.1s linear" }} />
            </div>

            {/* Status text */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
              <div style={{ width: 5, height: 5, borderRadius: "50%", background: SCAN_ZONES_ANIM[activeZoneIdx]?.color ?? "#e8a4b0", animation: "pulseDot 0.8s ease-in-out infinite" }} />
              <p style={{ fontSize: 11, color: "rgba(245,237,232,0.4)", letterSpacing: "0.06em" }}>
                {scanProgress < 15 ? "Detectando estructura facial…" :
                 scanProgress < 30 ? `Escaneando ${SCAN_ZONES_ANIM[activeZoneIdx]?.label ?? ""}…` :
                 scanProgress < 50 ? "Analizando biomarcadores…" :
                 scanProgress < 70 ? "Calculando puntuaciones por zona…" :
                 scanProgress < 85 ? "Evaluando luminosidad e hidratación…" :
                 scanProgress < 99 ? "Finalizando análisis…" : "Análisis completado ✓"}
              </p>
            </div>
          </div>
        )}

        {/* ── CONTACT — email + phone quiz ── */}
        {stage === "contact" && scores && (
          <ProfileQuiz mode="contact" onComplete={handleContactComplete} scores={scores} />
        )}

        {/* ── ERROR ── */}
        {stage === "error" && (
          <div style={{ maxWidth: 460, width: "100%", textAlign: "center" }}>
            <div style={{ width: 64, height: 64, borderRadius: "50%", background: "rgba(232,164,176,0.1)", border: "1px solid rgba(232,164,176,0.25)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 24px" }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none"><path d="M12 9v4M12 17h.01M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" stroke="#e8a4b0" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </div>
            <h2 style={{ fontFamily: "var(--font-fraunces)", fontSize: 24, fontWeight: 400, marginBottom: 12, letterSpacing: "-0.02em" }}>No pudimos leer tu piel</h2>
            <p style={{ fontSize: 14, color: "rgba(245,237,232,0.5)", lineHeight: 1.7, marginBottom: 28, maxWidth: 360, margin: "0 auto 28px" }}>{qualityError}</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 7, maxWidth: 320, margin: "0 auto 28px" }}>
              {["Enciende una luz frontal (lámpara, ventana)","Centra bien tu rostro — debe verse completo","Sin gafas ni cabello cubriendo la cara"].map((tip,i)=>(
                <div key={i} style={{ display: "flex", gap: 10, padding: "10px 14px", background: "rgba(245,237,232,0.03)", border: "1px solid rgba(245,237,232,0.07)", borderRadius: 10, textAlign: "left" }}>
                  <span style={{ fontSize: 10, color: "#7ecba1", fontWeight: 700, flexShrink: 0, paddingTop: 2 }}>0{i+1}</span>
                  <span style={{ fontSize: 13, color: "rgba(245,237,232,0.55)", lineHeight: 1.5 }}>{tip}</span>
                </div>
              ))}
            </div>
            <button onClick={reset} style={{ padding: "13px 36px", background: "linear-gradient(135deg,#e8a4b0,#c97e8e)", border: "none", borderRadius: 12, color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>Intentar de nuevo</button>
          </div>
        )}

        {/* ── RESULTS LAYER 1 — top 3 critical findings ── */}
        {stage === "results-1" && scores && (
          <div style={{ maxWidth: 520, width: "100%" }}>
            <div style={{ textAlign: "center", marginBottom: 32 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginBottom: 14 }}>
                <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#7ecba1", boxShadow: "0 0 8px rgba(126,203,161,0.8)" }} />
                <span style={{ fontSize: 10, letterSpacing: "0.18em", color: "#7ecba1", textTransform: "uppercase", fontWeight: 700 }}>Análisis completado · 9 zonas</span>
              </div>
              <h1 style={{ fontFamily: "var(--font-fraunces)", fontSize: "clamp(24px, 4vw, 38px)", fontWeight: 400, marginBottom: 10, letterSpacing: "-0.03em", lineHeight: 1.1 }}>
                Tu piel habla. <em style={{ color: "#e8a4b0", fontStyle: "italic" }}>Esto es lo que dice.</em>
              </h1>
            </div>

            {/* Score card with photo */}
            <div style={{ background: "rgba(245,237,232,0.04)", border: "1px solid rgba(245,237,232,0.08)", borderRadius: 20, padding: "28px", marginBottom: 16 }}>
              <div style={{ display: "flex", alignItems: "flex-start", gap: 20 }}>
                {/* Score */}
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 9, letterSpacing: "0.16em", color: "rgba(245,237,232,0.3)", textTransform: "uppercase", marginBottom: 12, fontWeight: 700 }}>Score Global</p>
                  <div style={{ display: "flex", alignItems: "flex-end", gap: 8, marginBottom: 6 }}>
                    <span style={{ fontSize: 72, fontFamily: "var(--font-fraunces)", fontWeight: 300, color: "#e8a4b0", lineHeight: 1 }}>{scores.overall}</span>
                    <div style={{ paddingBottom: 8 }}>
                      <span style={{ fontSize: 17, color: "rgba(245,237,232,0.22)" }}>/100</span>
                      <p style={{ fontSize: 9, color: "#7ecba1", fontWeight: 700, letterSpacing: "0.08em", marginTop: 4 }}>TOP {percentile}%</p>
                    </div>
                  </div>
                  <div style={{ height: 2, background: "rgba(245,237,232,0.06)", borderRadius: 2, overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${scores.overall}%`, background: "linear-gradient(90deg,#e8a4b0,#d4af88)", borderRadius: 2 }} />
                  </div>
                </div>
                {/* Captured photo thumbnail */}
                {capturedUrl && (
                  <div style={{ width: 80, height: 100, borderRadius: 12, overflow: "hidden", border: "1px solid rgba(245,237,232,0.1)", flexShrink: 0 }}>
                    <img src={capturedUrl} alt="Tu foto" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  </div>
                )}
              </div>
              <p style={{ fontSize: 12.5, color: "rgba(245,237,232,0.42)", lineHeight: 1.7, marginTop: 16 }}>
                {scores.overall >= 80 ? "Tu piel está en un estado superior a la media. Mantén la rutina." : scores.overall >= 65 ? "Hay margen de mejora claro. Con el plan correcto puedes subir 10–15 puntos en 6 semanas." : "Tu piel necesita atención prioritaria. El plan de productos es el primer paso."}
              </p>
            </div>

            {/* Top 3 critical findings */}
            <div style={{ background: "rgba(245,237,232,0.04)", border: "1px solid rgba(245,237,232,0.08)", borderRadius: 20, padding: "28px", marginBottom: 16 }}>
              <p style={{ fontSize: 9, letterSpacing: "0.16em", color: "rgba(245,237,232,0.3)", textTransform: "uppercase", marginBottom: 20, fontWeight: 700 }}>Hallazgos principales</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                {criticalFindings.map(b => (
                  <div key={b.label}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ fontSize: 13, color: "rgba(245,237,232,0.7)", fontWeight: 500 }}>{b.label}</span>
                        {b.alert && <span style={{ fontSize: 8, color: "#d4af88", background: "rgba(212,175,136,0.1)", border: "1px solid rgba(212,175,136,0.22)", padding: "1px 7px", borderRadius: 99, fontWeight: 700, letterSpacing: "0.08em" }}>ATENCIÓN</span>}
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ fontSize: 9, color: "rgba(245,237,232,0.28)", letterSpacing: "0.06em", textTransform: "uppercase" }}>{b.note}</span>
                        <span style={{ fontSize: 13, fontWeight: 700, color: b.color, minWidth: 36, textAlign: "right" }}>{b.value}%</span>
                      </div>
                    </div>
                    <div style={{ height: 2, background: "rgba(245,237,232,0.06)", borderRadius: 1, overflow: "hidden", marginBottom: 6 }}>
                      <div style={{ height: "100%", width: `${b.value}%`, background: b.color, borderRadius: 1 }} />
                    </div>
                    <p style={{ fontSize: 11.5, color: "rgba(245,237,232,0.36)", lineHeight: 1.55 }}>
                      {b.insight}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* CTA to unlock full report */}
            <button
              onClick={() => setStage("gate-quiz")}
              style={{
                width: "100%", padding: "17px 28px",
                background: "linear-gradient(135deg,#e8a4b0,#c97e8e)",
                border: "none", borderRadius: 14, color: "#fff",
                fontSize: 15, fontWeight: 700, cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                boxShadow: "0 6px 24px rgba(232,164,176,0.3)",
                transition: "all 0.2s",
              }}
            >
              Ver informe completo →
            </button>
          </div>
        )}

        {/* ── GATE QUIZ — 6 questions to unlock full report ── */}
        {stage === "gate-quiz" && (
          <ProfileQuiz mode="gate" onComplete={handleGateComplete} scores={scores} />
        )}

        {/* ── RESULTS LAYER 2 — full report ── */}
        {stage === "results-2" && scores && (
          <div style={{ maxWidth: 900, width: "100%" }}>
            <div style={{ textAlign: "center", marginBottom: 40 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginBottom: 14 }}>
                <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#7ecba1", boxShadow: "0 0 8px rgba(126,203,161,0.8)" }} />
                <span style={{ fontSize: 10, letterSpacing: "0.18em", color: "#7ecba1", textTransform: "uppercase", fontWeight: 700 }}>Informe completo · 9 zonas · 7 biomarcadores</span>
              </div>
              <h1 style={{ fontFamily: "var(--font-fraunces)", fontSize: "clamp(24px, 4vw, 38px)", fontWeight: 400, marginBottom: 10, letterSpacing: "-0.03em", lineHeight: 1.1 }}>
                Tu informe <em style={{ color: "#e8a4b0", fontStyle: "italic" }}>detallado.</em>
              </h1>
              <p style={{ fontSize: 13, color: "rgba(245,237,232,0.35)", maxWidth: 420, margin: "0 auto" }}>Análisis completo: 7 biomarcadores calibrados y 9 zonas faciales medidas por separado.</p>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))", gap: 14, marginBottom: 14 }}>
              {/* Score + Zones card */}
              <div style={{ background: "rgba(245,237,232,0.04)", border: "1px solid rgba(245,237,232,0.08)", borderRadius: 20, padding: "28px 28px 24px" }}>
                <p style={{ fontSize: 9, letterSpacing: "0.16em", color: "rgba(245,237,232,0.3)", textTransform: "uppercase", marginBottom: 18, fontWeight: 700 }}>Score Global</p>
                <div style={{ display: "flex", alignItems: "flex-end", gap: 10, marginBottom: 6 }}>
                  <span style={{ fontSize: 80, fontFamily: "var(--font-fraunces)", fontWeight: 300, color: "#e8a4b0", lineHeight: 1 }}>{scores.overall}</span>
                  <div style={{ paddingBottom: 10 }}>
                    <span style={{ fontSize: 17, color: "rgba(245,237,232,0.22)" }}>/100</span>
                    <p style={{ fontSize: 9, color: "#7ecba1", fontWeight: 700, letterSpacing: "0.08em", marginTop: 4 }}>TOP {percentile}%</p>
                  </div>
                </div>
                <div style={{ height: 2, background: "rgba(245,237,232,0.06)", borderRadius: 2, overflow: "hidden", marginBottom: 16 }}>
                  <div style={{ height: "100%", width: `${scores.overall}%`, background: "linear-gradient(90deg,#e8a4b0,#d4af88)", borderRadius: 2 }} />
                </div>
                <p style={{ fontSize: 12.5, color: "rgba(245,237,232,0.42)", lineHeight: 1.7, marginBottom: 18 }}>
                  {scores.overall >= 80 ? "Tu piel está en un estado superior a la media. Mantén la rutina." : scores.overall >= 65 ? "Hay margen de mejora claro. Con el plan correcto puedes subir 10–15 puntos en 6 semanas." : "Tu piel necesita atención prioritaria. El plan de productos es el primer paso."}
                </p>

                {/* 9-zone analysis */}
                <div style={{ paddingTop: 16, borderTop: "1px solid rgba(245,237,232,0.06)", marginBottom: 16 }}>
                  <p style={{ fontSize: 9, color: "rgba(245,237,232,0.25)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 14, fontWeight: 700 }}>Análisis por zona · 9 zonas</p>
                  <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                    {(Object.entries(scores.zoneScores) as [string, number][]).map(([key, value]) => {
                      const { label: statusLabel, color, emoji } = getZoneStatus(value)
                      const zoneLabel = ZONE_LABELS[key] || key
                      const insight = getZoneInsight(key, value)
                      return (
                        <div key={key} style={{ background: "rgba(245,237,232,0.02)", borderRadius: 10, padding: "10px 12px" }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 5 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                              <span style={{ fontSize: 11, color, fontWeight: 700, width: 16, textAlign: "center" }}>{emoji}</span>
                              <span style={{ fontSize: 12, color: "rgba(245,237,232,0.7)", fontWeight: 600 }}>{zoneLabel}</span>
                            </div>
                            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                              <span style={{ fontSize: 9, color, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase" }}>{statusLabel}</span>
                              <span style={{ fontSize: 13, fontWeight: 700, color, minWidth: 28, textAlign: "right" }}>{value}</span>
                            </div>
                          </div>
                          <div style={{ height: 2, background: "rgba(245,237,232,0.06)", borderRadius: 1, overflow: "hidden", marginBottom: 5 }}>
                            <div style={{ height: "100%", width: `${value}%`, background: color, borderRadius: 1 }} />
                          </div>
                          <p style={{ fontSize: 10.5, color: "rgba(245,237,232,0.35)", lineHeight: 1.45, margin: 0 }}>{insight}</p>
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* Apparent age */}
                <div style={{ paddingTop: 14, borderTop: "1px solid rgba(245,237,232,0.06)" }}>
                  <p style={{ fontSize: 9, color: "rgba(245,237,232,0.25)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 4 }}>Edad aparente</p>
                  <p style={{ fontFamily: "var(--font-fraunces)", fontSize: 22, color: "#7ecba1", fontWeight: 300 }}>{scores.ageApparent} años</p>
                </div>

                {/* Captured photo thumbnail */}
                {capturedUrl && (
                  <div style={{ marginTop: 14, borderTop: "1px solid rgba(245,237,232,0.06)", paddingTop: 14 }}>
                    <div style={{ width: 60, height: 76, borderRadius: 9, overflow: "hidden", border: "1px solid rgba(245,237,232,0.1)" }}>
                      <img src={capturedUrl} alt="Tu foto" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    </div>
                  </div>
                )}
              </div>

              {/* Biomarkers card — all 7 */}
              <div style={{ background: "rgba(245,237,232,0.04)", border: "1px solid rgba(245,237,232,0.08)", borderRadius: 20, padding: "28px 28px 24px" }}>
                <p style={{ fontSize: 9, letterSpacing: "0.16em", color: "rgba(245,237,232,0.3)", textTransform: "uppercase", marginBottom: 6, fontWeight: 700 }}>Biomarcadores · 7 métricas</p>
                <p style={{ fontSize: 10.5, color: "rgba(245,237,232,0.22)", marginBottom: 20, lineHeight: 1.5 }}>Todas las barras miden salud: más llena = mejor estado</p>
                <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                  {biomarkers.map(b => (
                    <div key={b.label}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <span style={{ fontSize: 13, color: "rgba(245,237,232,0.75)", fontWeight: 600 }}>{b.friendlyLabel}</span>
                          {b.alert && <span style={{ fontSize: 8, color: "#d4af88", background: "rgba(212,175,136,0.1)", border: "1px solid rgba(212,175,136,0.22)", padding: "1px 7px", borderRadius: 99, fontWeight: 700, letterSpacing: "0.08em" }}>MEJORABLE</span>}
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <span style={{ fontSize: 9, color: "rgba(245,237,232,0.28)", letterSpacing: "0.06em", textTransform: "uppercase" }}>{b.note}</span>
                          <span style={{ fontSize: 14, fontWeight: 700, color: b.color, minWidth: 36, textAlign: "right" }}>{b.value}%</span>
                        </div>
                      </div>
                      <div style={{ height: 4, background: "rgba(245,237,232,0.06)", borderRadius: 2, overflow: "hidden", marginBottom: 7 }}>
                        <div style={{ height: "100%", width: `${b.value}%`, background: `linear-gradient(90deg, ${b.color}88, ${b.color})`, borderRadius: 2, transition: "width 0.8s ease" }} />
                      </div>
                      <p style={{ fontSize: 11.5, color: "rgba(245,237,232,0.38)", lineHeight: 1.55 }}>
                        {b.insight}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* WhatsApp CTA */}
            <div style={{ background: "linear-gradient(135deg,rgba(232,164,176,0.07) 0%,rgba(212,175,136,0.04) 100%)", border: "1px solid rgba(232,164,176,0.14)", borderRadius: 18, padding: "26px 28px", marginBottom: 12, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 24, flexWrap: "wrap" }}>
              <div>
                <p style={{ fontSize: 9, letterSpacing: "0.14em", color: "#e8a4b0", textTransform: "uppercase", fontWeight: 700, marginBottom: 7 }}>Sin compromiso</p>
                <h3 style={{ fontFamily: "var(--font-fraunces)", fontSize: "clamp(16px,2vw,21px)", fontWeight: 400, letterSpacing: "-0.02em", marginBottom: 5, lineHeight: 1.25 }}>¿Quieres que analicemos tus resultados juntos?</h3>
                <p style={{ fontSize: 12.5, color: "rgba(245,237,232,0.42)", lineHeight: 1.6 }}>20 minutos con un especialista. Te explicamos cada número y qué hacer exactamente.</p>
              </div>
              <a href={`https://wa.me/TUTELEFONO?text=${encodeURIComponent(`Hola, acabo de hacer mi análisis en InsideOutMed. Mi score fue ${scores.overall}/100.`)}`} target="_blank" rel="noopener noreferrer"
                style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "linear-gradient(135deg,#e8a4b0 0%,#c97e8e 100%)", color: "#fff", borderRadius: 12, padding: "13px 24px", fontSize: 13, fontWeight: 700, textDecoration: "none", whiteSpace: "nowrap", boxShadow: "0 6px 20px rgba(232,164,176,0.28)", flexShrink: 0 }}>
                Agendar consulta
              </a>
            </div>

            {/* Plan CTA */}
            <button
              onClick={() => {
                try {
                  if (scores) {
                    localStorage.setItem("insideoutmed_scores", JSON.stringify({
                      overall: scores.overall,
                      luminosity: scores.luminosity,
                      hydration: scores.hydration,
                      uniformity: scores.uniformity,
                      glycation: scores.glycation,
                      inflammation: scores.inflammation,
                      sunDamage: scores.sunDamage,
                      vascularity: scores.vascularity,
                      ...preQuizData, ...contactData, ...gateData,
                    }))
                  }
                } catch {}
                window.location.href = "/plan"
              }}
              style={{ width: "100%", padding: "17px 28px", background: "rgba(245,237,232,0.04)", border: "1px solid rgba(245,237,232,0.1)", borderRadius: 14, color: "#f5ede8", fontSize: 14, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "space-between", transition: "all 0.2s", marginBottom: 24 }}
              onMouseEnter={e=>{e.currentTarget.style.background="rgba(245,237,232,0.08)";e.currentTarget.style.borderColor="rgba(245,237,232,0.18)"}}
              onMouseLeave={e=>{e.currentTarget.style.background="rgba(245,237,232,0.04)";e.currentTarget.style.borderColor="rgba(245,237,232,0.1)"}}
            >
              <div style={{ textAlign: "left" }}>
                <p style={{ fontSize: 11, color: "rgba(245,237,232,0.38)", marginBottom: 2 }}>Basado en tus biomarcadores reales</p>
                <span>Ver plan personalizado →</span>
              </div>
              <svg width="18" height="18" viewBox="0 0 20 20" fill="none"><path d="M4 10h12M11 5l5 5-5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </button>

            <div style={{ textAlign: "center" }}>
              <button onClick={reset} style={{ background: "none", border: "none", color: "rgba(245,237,232,0.28)", fontSize: 12, cursor: "pointer", padding: "8px 16px" }}>Hacer nuevo análisis</button>
            </div>
          </div>
        )}
      </main>

      <style>{`
        @keyframes scanZonePop { from { opacity: 0; transform: translateX(-6px); } to { opacity: 1; transform: translateX(0); } }
        @keyframes pulseDot { 0%,100% { opacity: 0.5; transform: scale(1); } 50% { opacity: 1; transform: scale(1.4); } }
        @keyframes scanFlash { 0% { opacity: 1; } 100% { opacity: 0; } }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  )
}
