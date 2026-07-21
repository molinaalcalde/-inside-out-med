"use client"

import { useEffect, useRef, useState, useCallback } from "react"

// ── Shared Scores type (exported for page.tsx) ─────────────────────
export interface Scores {
  overall: number
  luminosity: number
  hydration: number
  uniformity: number
  glycation: number
  inflammation: number
  sunDamage: number
  vascularity: number
  ageApparent: number
  zoneScores: {
    forehead: number
    periocularL: number
    periocularR: number
    nose: number
    lips: number
    cheekL: number
    cheekR: number
    jaw: number
    neck: number
  }
}

// ── 9 Facial Zones — MediaPipe landmark indices ─────────────────
const LANDMARK_ZONES = {
  forehead:    [10, 338, 297, 332, 284, 251, 389, 356, 109, 67, 103, 54, 21, 162, 127, 234, 93, 132],
  periocularL: [33, 7, 163, 144, 145, 153, 154, 155, 133, 173, 157, 158, 159, 160, 161, 246],
  periocularR: [362, 382, 381, 380, 374, 373, 390, 249, 263, 466, 388, 387, 386, 385, 384, 398],
  nose:        [1, 2, 98, 327, 168, 6, 197, 195, 5, 4, 240, 97, 370],
  lips:        [61, 185, 40, 39, 37, 0, 267, 269, 270, 409, 291, 375, 321, 405, 314, 17, 84, 181, 91, 146],
  cheekL:      [116, 117, 118, 119, 120, 121, 128, 126, 142, 36, 205, 207, 216],
  cheekR:      [345, 346, 347, 348, 349, 350, 357, 425, 427, 437, 436, 432, 352],
  jaw:         [172, 136, 150, 149, 176, 148, 152, 377, 400, 378, 379, 365, 397, 288, 361, 323],
  neck:        [152, 377, 400, 378, 379, 365, 397, 288, 361],
} as const

// ── Fallback oval zones (when MediaPipe unavailable) ─────────────
const OVAL_ZONES = {
  forehead:    { y1: -0.85, y2: -0.30, x1: -0.50, x2:  0.50 },
  periocularL: { y1: -0.35, y2: -0.05, x1:  0.15, x2:  0.55 },
  periocularR: { y1: -0.35, y2: -0.05, x1: -0.55, x2: -0.15 },
  nose:        { y1: -0.15, y2:  0.25, x1: -0.15, x2:  0.15 },
  lips:        { y1:  0.25, y2:  0.45, x1: -0.25, x2:  0.25 },
  cheekL:      { y1: -0.05, y2:  0.35, x1:  0.25, x2:  0.85 },
  cheekR:      { y1: -0.05, y2:  0.35, x1: -0.85, x2: -0.25 },
  jaw:         { y1:  0.40, y2:  0.70, x1: -0.50, x2:  0.50 },
  neck:        { y1:  0.65, y2:  0.90, x1: -0.30, x2:  0.30 },
} as const

const ZONE_NAMES = Object.keys(LANDMARK_ZONES)

// ── Fitzpatrick calibration ──────────────────────────────────────
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

// ── Zone metrics & accumulator ────────────────────────────────────
interface ZoneMetrics {
  avgLum: number; avgR: number; avgG: number; avgB: number
  redPixels: number; total: number; localContrast: number; stdDev: number
}

interface ZoneAccum {
  sumLum: number; sumR: number; sumG: number; sumB: number
  sumContrast: number; sumStdDev: number; redPix: number; totalPix: number
  n: number
}

function freshAccum(): ZoneAccum {
  return { sumLum: 0, sumR: 0, sumG: 0, sumB: 0, sumContrast: 0, sumStdDev: 0, redPix: 0, totalPix: 0, n: 0 }
}

function fresh9Zones(): Record<string, ZoneAccum> {
  const acc: Record<string, ZoneAccum> = {}
  for (const z of ZONE_NAMES) acc[z] = freshAccum()
  return acc
}

function accumulate(a: ZoneAccum, m: ZoneMetrics) {
  a.sumLum += m.avgLum; a.sumR += m.avgR; a.sumG += m.avgG; a.sumB += m.avgB
  a.sumContrast += m.localContrast; a.sumStdDev += m.stdDev
  a.redPix += m.redPixels; a.totalPix += m.total; a.n++
}

function clamp(v: number, lo: number, hi: number) { return Math.max(lo, Math.min(hi, v)) }

// ── Scoring engine (deterministic, Fitzpatrick-calibrated) ───────
function computeScores(acc: Record<string, ZoneAccum>, fitzpatrick: number, age: number): Scores | null {
  // Require at minimum forehead, cheekL, cheekR, nose to have data
  if (!acc.forehead?.n || !acc.cheekL?.n || !acc.cheekR?.n || !acc.nose?.n) return null

  const fitz = FITZ_CALIBRATION[fitzpatrick] || FITZ_CALIBRATION[3]
  const ageCfg = getAgeBaseline(age)

  const avg = (a: ZoneAccum, f: 'sumLum'|'sumR'|'sumG'|'sumB'|'sumContrast'|'sumStdDev') =>
    a.n > 0 ? a[f] / a.n : 0

  // Collect per-zone averages
  const zoneLums: number[] = []
  const zoneAvgs: Record<string, { lum: number; r: number; g: number; b: number; contrast: number; stdDev: number; redRatio: number }> = {}
  for (const z of ZONE_NAMES) {
    const a = acc[z]
    if (!a || !a.n) continue
    const lum = avg(a, 'sumLum')
    const r = avg(a, 'sumR')
    const g = avg(a, 'sumG')
    const b = avg(a, 'sumB')
    zoneLums.push(lum)
    zoneAvgs[z] = {
      lum, r, g, b,
      contrast: avg(a, 'sumContrast'),
      stdDev: avg(a, 'sumStdDev'),
      redRatio: a.totalPix > 0 ? a.redPix / a.totalPix : 0,
    }
  }

  const activeZones = Object.keys(zoneAvgs)
  if (activeZones.length < 4) return null

  // Global averages
  const avgLumSkin = zoneLums.reduce((s, v) => s + v, 0) / zoneLums.length
  const avgR = activeZones.reduce((s, z) => s + zoneAvgs[z].r, 0) / activeZones.length
  const avgG = activeZones.reduce((s, z) => s + zoneAvgs[z].g, 0) / activeZones.length
  const avgB = activeZones.reduce((s, z) => s + zoneAvgs[z].b, 0) / activeZones.length
  const avgContrast = activeZones.reduce((s, z) => s + zoneAvgs[z].contrast, 0) / activeZones.length
  const avgStdDev = activeZones.reduce((s, z) => s + zoneAvgs[z].stdDev, 0) / activeZones.length
  const totalRedPix = activeZones.reduce((s, z) => s + acc[z].redPix, 0)
  const totalPix = activeZones.reduce((s, z) => s + acc[z].totalPix, 0)
  const redRatio = totalPix > 0 ? totalRedPix / totalPix : 0

  // Cross-zone luminance standard deviation (uniformity metric)
  const lumMean = zoneLums.reduce((s, v) => s + v, 0) / zoneLums.length
  const crossZoneStdDev = Math.sqrt(zoneLums.reduce((s, v) => s + (v - lumMean) ** 2, 0) / zoneLums.length)

  // Cheek + nose red ratio (vascularity)
  const cheekNoseRedRatio = (() => {
    let rp = 0, tp = 0
    for (const z of ['cheekL', 'cheekR', 'nose']) {
      if (acc[z]?.n) { rp += acc[z].redPix; tp += acc[z].totalPix }
    }
    return tp > 0 ? rp / tp : 0
  })()

  // ── 7 Biomarkers (deterministic, calibrated) ───────────────────
  const luminosity   = clamp(Math.round((avgLumSkin / fitz.lumBaseline) * 100), 25, 98)
  const hydration    = clamp(Math.round((avgLumSkin / fitz.lumBaseline) * 90 - avgStdDev * 0.15), 30, 98)
  const uniformity   = clamp(Math.round(100 - crossZoneStdDev * 2.5 - avgContrast * 1.2), 25, 96)
  const glycation    = clamp(Math.round(((avgR - avgB) / (avgB + 1)) * 45 + ageCfg.glycationOffset + 15), 5, 75)
  const inflammation = clamp(Math.round((redRatio * 300 + (avgR - avgG) * 0.12) * fitz.inflammationSensitivity), 3, 65)
  const sunDamage    = clamp(Math.round(avgContrast * 1.8 + avgStdDev * 0.2), 5, 70)
  const vascularity  = clamp(Math.round(cheekNoseRedRatio * 250 - 10), 3, 60)

  // Overall: higher = better skin health
  // luminosity, hydration, uniformity are "higher is better"
  // glycation, inflammation, sunDamage, vascularity are "lower is better"
  const overall = clamp(Math.round(
    luminosity * 0.15 + hydration * 0.18 + uniformity * 0.15 +
    (100 - glycation) * 0.12 + (100 - inflammation) * 0.18 +
    (100 - sunDamage) * 0.12 + (100 - vascularity) * 0.10
  ), 30, 96)

  // ── Per-zone score ──────────────────────────────────────────────
  const zoneScore = (z: string): number => {
    const za = zoneAvgs[z]
    if (!za) return 50
    const lumScore = clamp(Math.round((za.lum / fitz.lumBaseline) * 100), 20, 100)
    const redScore = clamp(Math.round(100 - za.redRatio * 400), 30, 100)
    const texScore = clamp(Math.round(100 - za.contrast * 2.0), 30, 100)
    return Math.round(lumScore * 0.35 + redScore * 0.35 + texScore * 0.30)
  }

  // ── Apparent age ────────────────────────────────────────────────
  const ageApparent = clamp(
    ageCfg.ageMid + Math.round((100 - overall) * 0.15 + glycation * 0.08 - 5),
    17, 65
  )

  return {
    overall, luminosity, hydration, uniformity, glycation, inflammation, sunDamage, vascularity,
    ageApparent,
    zoneScores: {
      forehead:    zoneScore('forehead'),
      periocularL: zoneScore('periocularL'),
      periocularR: zoneScore('periocularR'),
      nose:        zoneScore('nose'),
      lips:        zoneScore('lips'),
      cheekL:      zoneScore('cheekL'),
      cheekR:      zoneScore('cheekR'),
      jaw:         zoneScore('jaw'),
      neck:        zoneScore('neck'),
    }
  }
}

// ── Pixel sampling from a bounding box ───────────────────────────
function sampleRegion(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number
): ZoneMetrics | null {
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
      const nb = (lums[(row-1)*w+col] + lums[(row+1)*w+col] + lums[row*w+col-1] + lums[row*w+col+1]) / 4
      localContrast += Math.abs(lums[idx] - nb)
    }
  }
  localContrast /= total
  let variance = 0
  for (const v of lums) variance += (v - avgLum) ** 2
  return { avgLum, avgR: sumR/total, avgG: sumG/total, avgB: sumB/total, redPixels, total, localContrast, stdDev: Math.sqrt(variance/total) }
}

// ── Compute bounding box from landmarks ──────────────────────────
function landmarkBBox(
  landmarks: Array<{ x: number; y: number }>,
  indices: readonly number[],
  imgW: number, imgH: number
) {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
  for (const idx of indices) {
    const lm = landmarks[idx]
    if (!lm) continue
    const px = lm.x * imgW, py = lm.y * imgH
    if (px < minX) minX = px
    if (py < minY) minY = py
    if (px > maxX) maxX = px
    if (py > maxY) maxY = py
  }
  const pad = 8
  return {
    x: Math.max(0, Math.floor(minX - pad)),
    y: Math.max(0, Math.floor(minY - pad)),
    w: Math.min(imgW, Math.ceil(maxX - minX + pad * 2)),
    h: Math.min(imgH, Math.ceil(maxY - minY + pad * 2)),
  }
}

// ── Fallback: sample from oval zone ──────────────────────────────
function sampleOvalZone(
  ctx: CanvasRenderingContext2D,
  vCx: number, vCy: number, vRx: number, vRy: number,
  zone: { x1: number; x2: number; y1: number; y2: number }
): ZoneMetrics | null {
  const x = Math.max(0, Math.round(vCx + vRx * zone.x1))
  const y = Math.max(0, Math.round(vCy + vRy * zone.y1))
  const w = Math.round(vRx * (zone.x2 - zone.x1))
  const h = Math.round(vRy * (zone.y2 - zone.y1))
  return sampleRegion(ctx, x, y, w, h)
}

// ── Canvas helpers ────────────────────────────────────────────────
function ovalParams(W: number, H: number) {
  return { cx: W / 2, cy: H * 0.42, rx: W * 0.30, ry: H * 0.37 }
}

function drawOval(
  ctx: CanvasRenderingContext2D, W: number, H: number,
  state: "neutral" | "warning" | "success", pulse: number
) {
  const { cx, cy, rx, ry } = ovalParams(W, H)

  ctx.save()
  ctx.fillStyle = "rgba(14,12,18,0.58)"
  ctx.beginPath()
  ctx.rect(0, 0, W, H)
  ctx.ellipse(cx, cy, rx + 2, ry + 2, 0, 0, Math.PI * 2, true)
  ctx.fill("evenodd")

  const color =
    state === "success" ? `rgba(126,203,161,${0.85 + pulse * 0.15})` :
    state === "warning"  ? "rgba(212,175,136,0.9)" :
    "rgba(245,237,232,0.30)"

  if (state === "success") {
    ctx.shadowColor = "rgba(126,203,161,0.9)"; ctx.shadowBlur = 22 + pulse * 14
  } else if (state === "warning") {
    ctx.shadowColor = "rgba(212,175,136,0.5)"; ctx.shadowBlur = 10
  }

  ctx.beginPath()
  ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2)
  ctx.strokeStyle = color
  ctx.lineWidth = state === "success" ? 2.5 : 2
  ctx.setLineDash(state === "success" ? [] : [8, 5])
  ctx.stroke()
  ctx.shadowBlur = 0; ctx.setLineDash([])

  const bLen = 20
  const bX = cx - rx - 10, bX2 = cx + rx + 10
  const bY = cy - ry - 10, bY2 = cy + ry + 10
  const bCol = state === "success" ? "rgba(126,203,161,0.95)" : state === "warning" ? "rgba(212,175,136,0.8)" : "rgba(245,237,232,0.45)"
  ctx.strokeStyle = bCol; ctx.lineWidth = 2.5; ctx.lineCap = "round"
  ctx.beginPath(); ctx.moveTo(bX, bY + bLen); ctx.lineTo(bX, bY); ctx.lineTo(bX + bLen, bY); ctx.stroke()
  ctx.beginPath(); ctx.moveTo(bX2 - bLen, bY); ctx.lineTo(bX2, bY); ctx.lineTo(bX2, bY + bLen); ctx.stroke()
  ctx.beginPath(); ctx.moveTo(bX, bY2 - bLen); ctx.lineTo(bX, bY2); ctx.lineTo(bX + bLen, bY2); ctx.stroke()
  ctx.beginPath(); ctx.moveTo(bX2 - bLen, bY2); ctx.lineTo(bX2, bY2); ctx.lineTo(bX2, bY2 - bLen); ctx.stroke()
  ctx.restore()

  if (state === "success") {
    const gAlpha = 0.18 + pulse * 0.14
    const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.max(rx, ry) + 60)
    g.addColorStop(0, `rgba(126,203,161,${gAlpha * 0.2})`); g.addColorStop(1, "rgba(126,203,161,0)")
    ctx.save(); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H); ctx.restore()
  }
}

function drawScanLine(ctx: CanvasRenderingContext2D, W: number, H: number, scanY: number, alpha: number) {
  const { cx, cy, rx, ry } = ovalParams(W, H)
  const y = cy - ry + scanY * ry * 2
  ctx.save()
  ctx.beginPath(); ctx.ellipse(cx, cy, rx - 2, ry - 2, 0, 0, Math.PI * 2); ctx.clip()
  const beam = ctx.createLinearGradient(0, y - 28, 0, y + 8)
  beam.addColorStop(0, "rgba(126,203,161,0)"); beam.addColorStop(0.6, `rgba(126,203,161,${alpha * 0.18})`); beam.addColorStop(1, `rgba(126,203,161,${alpha * 0.55})`)
  ctx.fillStyle = beam; ctx.fillRect(cx - rx, y - 28, rx * 2, 36)
  ctx.beginPath(); ctx.moveTo(cx - rx, y); ctx.lineTo(cx + rx, y)
  const lg = ctx.createLinearGradient(cx - rx, y, cx + rx, y)
  lg.addColorStop(0, "rgba(126,203,161,0)"); lg.addColorStop(0.2, `rgba(126,203,161,${alpha * 0.85})`); lg.addColorStop(0.5, `rgba(180,240,210,${alpha})`); lg.addColorStop(0.8, `rgba(126,203,161,${alpha * 0.85})`); lg.addColorStop(1, "rgba(126,203,161,0)")
  ctx.strokeStyle = lg; ctx.lineWidth = 1.5; ctx.stroke()
  ctx.restore()
}

function drawCountdownRing(ctx: CanvasRenderingContext2D, W: number, H: number, secondsLeft: number, progress: number) {
  const { cx, cy } = ovalParams(W, H)
  ctx.save()
  const totalProgress = 1 - (secondsLeft - (1 - progress)) / 3
  ctx.beginPath(); ctx.arc(cx, cy - 12, 28, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * totalProgress)
  ctx.strokeStyle = "rgba(126,203,161,0.8)"; ctx.lineWidth = 3; ctx.stroke()
  if (secondsLeft > 0) {
    ctx.font = "bold 38px -apple-system, sans-serif"; ctx.fillStyle = "rgba(126,203,161,0.95)"
    ctx.textAlign = "center"; ctx.textBaseline = "middle"
    ctx.shadowColor = "rgba(126,203,161,0.7)"; ctx.shadowBlur = 16
    ctx.fillText(String(secondsLeft), cx, cy - 12)
  }
  ctx.restore()
}

// ── MediaPipe loader (local files, VIDEO mode, CPU) ──────────────
type FaceLandmarkerInstance = {
  detectForVideo: (video: HTMLVideoElement, timestamp: number) => {
    faceLandmarks: Array<Array<{ x: number; y: number; z: number }>>
  }
}

let _landmarkerVideoPromise: Promise<FaceLandmarkerInstance | null> | null = null

function loadMediaPipeVideo(): Promise<FaceLandmarkerInstance | null> {
  if (_landmarkerVideoPromise) return _landmarkerVideoPromise
  _landmarkerVideoPromise = (async () => {
    try {
      const vision = await import(
        /* webpackIgnore: true */
        "/mediapipe/vision_bundle.mjs" as string
      ) as {
        FilesetResolver: { forVisionTasks: (path: string) => Promise<unknown> }
        FaceLandmarker: { createFromOptions: (resolver: unknown, opts: unknown) => Promise<FaceLandmarkerInstance> }
      }
      const filesetResolver = await vision.FilesetResolver.forVisionTasks("/mediapipe/wasm")
      return await vision.FaceLandmarker.createFromOptions(filesetResolver, {
        baseOptions: { modelAssetPath: "/mediapipe/face_landmarker.task", delegate: "CPU" },
        runningMode: "VIDEO", numFaces: 1,
      })
    } catch (err) {
      console.warn("[InsideOutMed] MediaPipe failed to load, using fallback oval zones:", err)
      return null
    }
  })()
  return _landmarkerVideoPromise
}

// ── Props ─────────────────────────────────────────────────────────
interface CameraStageProps {
  onCapture: (dataUrl: string, scores: Scores) => void
  onCancel: () => void
  onScanError?: (reason: string) => void
  fitzpatrick: number
  age: number
}

type Phase = "init" | "loading-ai" | "stabilizing" | "countdown" | "done" | "error"

export function CameraStage({ onCapture, onCancel, onScanError, fitzpatrick, age }: CameraStageProps) {
  const videoRef     = useRef<HTMLVideoElement>(null)
  const canvasRef    = useRef<HTMLCanvasElement>(null)
  const streamRef    = useRef<MediaStream | null>(null)
  const rafRef       = useRef<number>(0)
  const frameRef     = useRef(0)
  const pulseRef     = useRef(0)
  const capturedRef  = useRef(false)
  const offscreenRef = useRef<HTMLCanvasElement | null>(null)
  const accumRef     = useRef<Record<string, ZoneAccum>>(fresh9Zones())
  const phaseStartRef    = useRef(0)
  const landmarkerRef    = useRef<FaceLandmarkerInstance | null>(null)
  const faceDetectedRef  = useRef(false)
  const landmarkFramesRef = useRef(0)
  const noFaceFramesRef   = useRef(0)

  const [phase, setPhase]         = useState<Phase>("init")
  const [guidance, setGuidance]   = useState<{ msg: string; sub: string; type: "neutral" | "warning" | "success" }>({ msg: "Iniciando cámara…", sub: "", type: "neutral" })
  const [countdown, setCountdown] = useState<number | null>(null)
  const [camError, setCamError]   = useState<string | null>(null)
  const [usingAI, setUsingAI]     = useState(false)

  const guidanceRef = useRef({ msg: "", sub: "", type: "neutral" as "neutral" | "warning" | "success" })
  function updateGuidance(msg: string, sub: string, type: "neutral" | "warning" | "success") {
    if (guidanceRef.current.msg !== msg || guidanceRef.current.type !== type) {
      guidanceRef.current = { msg, sub, type }
      setGuidance({ msg, sub, type })
    }
  }

  // ── Camera + MediaPipe init ────────────────────────────────────
  useEffect(() => {
    let cancelled = false
    async function init() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 720 } },
        })
        if (cancelled) { stream.getTracks().forEach(t => t.stop()); return }
        streamRef.current = stream
        if (videoRef.current) { videoRef.current.srcObject = stream; await videoRef.current.play() }
      } catch {
        if (!cancelled) setCamError("No se pudo acceder a la cámara. Verifica los permisos.")
        return
      }
      setPhase("loading-ai")
      const landmarker = await loadMediaPipeVideo()
      if (cancelled) return
      landmarkerRef.current = landmarker
      setUsingAI(!!landmarker)
      phaseStartRef.current = Date.now()
      setPhase("stabilizing")
    }
    init()
    return () => { cancelled = true; streamRef.current?.getTracks().forEach(t => t.stop()); cancelAnimationFrame(rafRef.current) }
  }, [])

  // ── Capture logic ──────────────────────────────────────────────
  const doCapture = useCallback(() => {
    const video = videoRef.current
    if (!video) return

    if (landmarkerRef.current && landmarkFramesRef.current < 3) {
      streamRef.current?.getTracks().forEach(t => t.stop())
      onScanError?.("No detectamos tu rostro correctamente. Centra tu cara frente a la cámara con buena luz.")
      return
    }

    const scores = computeScores(accumRef.current, fitzpatrick, age)

    const canvas = document.createElement("canvas")
    canvas.width = video.videoWidth || 640; canvas.height = video.videoHeight || 480
    const ctx = canvas.getContext("2d")!
    ctx.scale(-1, 1)
    ctx.drawImage(video, -canvas.width, 0, canvas.width, canvas.height)
    const url = canvas.toDataURL("image/jpeg", 0.92)

    streamRef.current?.getTracks().forEach(t => t.stop())

    if (!scores) {
      onScanError?.("No pudimos analizar la piel. Asegúrate de tener buena luz y el rostro visible.")
      return
    }
    onCapture(url, scores)
  }, [onCapture, onScanError, fitzpatrick, age])

  // ── Main animation loop ────────────────────────────────────────
  useEffect(() => {
    if (phase !== "stabilizing" && phase !== "countdown") return
    let countdownStart = 0
    const STABILIZE_MS = 1500, COUNTDOWN_MS = 3000

    function loop() {
      rafRef.current = requestAnimationFrame(loop)
      frameRef.current++
      const video = videoRef.current, canvas = canvasRef.current
      if (!canvas || !video || video.readyState < 2) return
      const W = canvas.clientWidth, H = canvas.clientHeight
      if (canvas.width !== W || canvas.height !== H) { canvas.width = W; canvas.height = H }
      const ctx = canvas.getContext("2d")
      if (!ctx) return
      ctx.clearRect(0, 0, W, H)
      pulseRef.current = (Math.sin(Date.now() / 750) + 1) / 2
      const now = Date.now()

      // ── STABILIZING ─────────────────────────────────────────
      if (phase === "stabilizing") {
        if (landmarkerRef.current && frameRef.current % 8 === 0) {
          try {
            const result = landmarkerRef.current.detectForVideo(video, performance.now())
            if (result.faceLandmarks?.length) {
              const lm = result.faceLandmarks[0]
              const noseX = lm[1].x, noseY = lm[1].y
              const centered = noseX > 0.3 && noseX < 0.7 && noseY > 0.25 && noseY < 0.65
              const upright = lm[10].y < lm[152].y
              faceDetectedRef.current = centered && upright
            } else { faceDetectedRef.current = false }
          } catch { faceDetectedRef.current = false }
        }

        const faceOk = landmarkerRef.current ? faceDetectedRef.current : true
        if (faceOk) {
          drawOval(ctx, W, H, "neutral", pulseRef.current * 0.5)
          updateGuidance("Centra tu rostro en el óvalo", "Mantén la cámara estable", "neutral")
        } else {
          drawOval(ctx, W, H, "warning", 0)
          updateGuidance("No detecto tu rostro", "Ponte frente a la cámara con el rostro derecho", "warning")
          phaseStartRef.current = now - 1000
          return
        }

        if (now - phaseStartRef.current > STABILIZE_MS) {
          const { cx, cy, rx, ry } = ovalParams(W, H)
          const tmpC = document.createElement("canvas"); tmpC.width = 120; tmpC.height = 160
          const tc = tmpC.getContext("2d")!
          const sx = (video.videoWidth || 640) / W, sy = (video.videoHeight || 480) / H
          tc.drawImage(video, (cx - rx * 0.6) * sx, (cy - ry * 0.5) * sy, rx * 1.2 * sx, ry * 1.0 * sy, 0, 0, 120, 160)
          const pd = tc.getImageData(0, 0, 120, 160).data
          let sum = 0
          for (let i = 0; i < pd.length; i += 4) sum += 0.299 * pd[i] + 0.587 * pd[i+1] + 0.114 * pd[i+2]
          const avgLum = sum / (120 * 160)
          if (avgLum < 65) { updateGuidance("Necesitas más luz", "Busca una ventana o enciende una lámpara", "warning"); drawOval(ctx, W, H, "warning", 0); phaseStartRef.current = now - 1200; return }
          if (avgLum > 230) { updateGuidance("Demasiada luz directa", "Aléjate de la fuente de luz", "warning"); drawOval(ctx, W, H, "warning", 0); phaseStartRef.current = now - 1200; return }

          accumRef.current = fresh9Zones()
          landmarkFramesRef.current = 0; noFaceFramesRef.current = 0
          setPhase("countdown")
          return
        }
        return
      }

      // ── COUNTDOWN ───────────────────────────────────────────
      if (phase === "countdown") {
        if (countdownStart === 0) countdownStart = now
        const elapsed = now - countdownStart
        const remaining = Math.max(0, COUNTDOWN_MS - elapsed)
        const secLeft = Math.ceil(remaining / 1000)

        // Brightness check every 18 frames
        if (frameRef.current % 18 === 0 && !capturedRef.current) {
          const { cx: bCx, cy: bCy, rx: bRx, ry: bRy } = ovalParams(W, H)
          const bC = document.createElement("canvas"); bC.width = 60; bC.height = 80
          const bc = bC.getContext("2d")!
          const bSx = (video.videoWidth || 640) / W, bSy = (video.videoHeight || 480) / H
          bc.drawImage(video, (bCx - bRx * 0.5) * bSx, (bCy - bRy * 0.4) * bSy, bRx * 1.0 * bSx, bRy * 0.8 * bSy, 0, 0, 60, 80)
          const bd = bc.getImageData(0, 0, 60, 80).data
          let bSum = 0
          for (let i = 0; i < bd.length; i += 4) bSum += 0.299 * bd[i] + 0.587 * bd[i+1] + 0.114 * bd[i+2]
          if (bSum / (60 * 80) < 55) {
            capturedRef.current = false; accumRef.current = fresh9Zones()
            landmarkFramesRef.current = 0; noFaceFramesRef.current = 0
            phaseStartRef.current = Date.now(); setPhase("stabilizing"); return
          }
        }

        // Sample pixels every 6 frames
        if (frameRef.current % 6 === 0 && !capturedRef.current) {
          if (!offscreenRef.current) offscreenRef.current = document.createElement("canvas")
          const off = offscreenRef.current
          off.width = video.videoWidth || 640; off.height = video.videoHeight || 480
          const oc = off.getContext("2d")!
          oc.drawImage(video, 0, 0)

          let usedLandmarks = false
          if (landmarkerRef.current) {
            try {
              const result = landmarkerRef.current.detectForVideo(video, performance.now())
              if (result.faceLandmarks?.length) {
                const lm = result.faceLandmarks[0]
                const noseX = lm[1].x, noseY = lm[1].y
                const centered = noseX > 0.25 && noseX < 0.75 && noseY > 0.2 && noseY < 0.7
                const upright = lm[10].y < lm[152].y
                if (centered && upright) {
                  for (const [zoneName, indices] of Object.entries(LANDMARK_ZONES)) {
                    const bbox = landmarkBBox(lm, indices, off.width, off.height)
                    const m = sampleRegion(oc, bbox.x, bbox.y, bbox.w, bbox.h)
                    if (m) accumulate(accumRef.current[zoneName], m)
                  }
                  usedLandmarks = true; landmarkFramesRef.current++; noFaceFramesRef.current = 0
                } else { noFaceFramesRef.current++ }
              } else { noFaceFramesRef.current++ }
            } catch { noFaceFramesRef.current++ }

            if (noFaceFramesRef.current > 5) {
              capturedRef.current = false; accumRef.current = fresh9Zones()
              landmarkFramesRef.current = 0; noFaceFramesRef.current = 0
              phaseStartRef.current = Date.now(); setPhase("stabilizing")
              updateGuidance("Rostro perdido", "Centra tu cara y quédate quieto", "warning"); return
            }
          }

          if (!usedLandmarks && !landmarkerRef.current) {
            const { cx, cy, rx, ry } = ovalParams(W, H)
            const sx = off.width / W, sy = off.height / H
            const vCx = cx * sx, vCy = cy * sy, vRx = rx * sx, vRy = ry * sy
            for (const [zoneName, zone] of Object.entries(OVAL_ZONES)) {
              const m = sampleOvalZone(oc, vCx, vCy, vRx, vRy, zone)
              if (m) accumulate(accumRef.current[zoneName], m)
            }
          }
        }

        const scanY = (elapsed % 1200) / 1200
        drawOval(ctx, W, H, "success", pulseRef.current)
        drawScanLine(ctx, W, H, scanY, 0.7 + pulseRef.current * 0.3)
        drawCountdownRing(ctx, W, H, secLeft, 1 - (remaining % 1000) / 1000)
        setCountdown(secLeft)
        updateGuidance(secLeft > 0 ? `Escaneando… ${secLeft}` : "Análisis completado ✓", "No te muevas", "success")

        if (secLeft <= 0 && !capturedRef.current) {
          capturedRef.current = true; cancelAnimationFrame(rafRef.current); doCapture()
        }
      }
    }
    rafRef.current = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(rafRef.current)
  }, [phase, doCapture]) // eslint-disable-line react-hooks/exhaustive-deps

  const manualCapture = () => {
    if (capturedRef.current) return
    if (landmarkerRef.current && !faceDetectedRef.current) return
    capturedRef.current = true; cancelAnimationFrame(rafRef.current); doCapture()
  }

  const guidanceColor = guidance.type === "success" ? "#7ecba1" : guidance.type === "warning" ? "#d4af88" : "rgba(245,237,232,0.5)"
  const guidanceIcon = guidance.type === "success" ? "✓" : guidance.type === "warning" ? "▲" : "·"

  return (
    <div style={{ maxWidth: 400, width: "100%", textAlign: "center" }}>
      <div style={{ marginBottom: 14, height: 28, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
        {(phase === "init" || phase === "loading-ai") && (
          <>
            <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#d4af88", animation: "pulse-dot 1s ease-in-out infinite" }} />
            <span style={{ fontSize: 11, color: "rgba(245,237,232,0.35)", letterSpacing: "0.1em" }}>
              {phase === "init" ? "Iniciando cámara…" : "Cargando motor de análisis…"}
            </span>
          </>
        )}
        {phase !== "init" && phase !== "loading-ai" && !camError && (
          <div style={{ display: "flex", alignItems: "center", gap: 7, transition: "all 0.3s" }}>
            <span style={{ fontSize: 13, color: guidanceColor, fontWeight: 700, transition: "color 0.3s", minWidth: 14, textAlign: "center" }}>{guidanceIcon}</span>
            <span style={{ fontSize: 13, color: guidanceColor, fontWeight: 600, transition: "color 0.3s", letterSpacing: "0.01em" }}>{guidance.msg}</span>
          </div>
        )}
        {camError && <span style={{ fontSize: 12, color: "#e8a4b0" }}>{camError}</span>}
      </div>

      <div style={{
        position: "relative", width: "100%", paddingBottom: "133%", borderRadius: 24, overflow: "hidden",
        background: "#060409", marginBottom: 16,
        boxShadow: guidance.type === "success" ? "0 0 0 1.5px rgba(126,203,161,0.4), 0 0 40px rgba(126,203,161,0.18)" : guidance.type === "warning" ? "0 0 0 1.5px rgba(212,175,136,0.3), 0 0 20px rgba(212,175,136,0.1)" : "0 0 0 1px rgba(245,237,232,0.07)",
        transition: "box-shadow 0.5s ease",
      }}>
        <video ref={videoRef} playsInline muted style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", transform: "scaleX(-1)" }} />
        <canvas ref={canvasRef} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none" }} />

        {(phase === "init" || phase === "loading-ai") && (
          <div style={{ position: "absolute", inset: 0, background: phase === "init" ? "rgba(6,4,9,0.78)" : "rgba(6,4,9,0.45)", display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(4px)", transition: "background 0.5s" }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 14 }}>
              <div style={{ width: 40, height: 40, borderRadius: "50%", border: "2px solid rgba(245,237,232,0.1)", borderTop: `2px solid ${phase === "loading-ai" ? "#7ecba1" : "#e8a4b0"}`, animation: "spin 1s linear infinite" }} />
              <span style={{ fontSize: 11, color: "rgba(245,237,232,0.35)", letterSpacing: "0.1em" }}>{phase === "init" ? "Iniciando…" : "Cargando IA…"}</span>
            </div>
          </div>
        )}

        {phase !== "init" && phase !== "loading-ai" && guidance.sub && (
          <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "28px 20px 16px", background: "linear-gradient(to top, rgba(6,4,9,0.9), transparent)", textAlign: "center" }}>
            <p style={{ fontSize: 11, color: "rgba(245,237,232,0.5)", letterSpacing: "0.06em" }}>{guidance.sub}</p>
          </div>
        )}

        {usingAI && phase !== "init" && phase !== "loading-ai" && (
          <div style={{ position: "absolute", top: 12, right: 12, padding: "4px 10px", background: "rgba(126,203,161,0.12)", border: "1px solid rgba(126,203,161,0.25)", borderRadius: 8, fontSize: 9, color: "#7ecba1", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase" }}>
            AI Landmarks
          </div>
        )}
      </div>

      <div style={{ display: "flex", gap: 10 }}>
        <button onClick={onCancel} style={{ flex: 1, padding: "13px", background: "rgba(245,237,232,0.05)", border: "1px solid rgba(245,237,232,0.1)", borderRadius: 12, color: "rgba(245,237,232,0.5)", fontSize: 13, cursor: "pointer" }}>Cancelar</button>
        <button onClick={manualCapture} disabled={!!camError || phase === "init" || phase === "loading-ai"} style={{
          flex: 2, padding: "13px",
          background: phase === "countdown" ? "linear-gradient(135deg, #5aab82, #7ecba1)" : "linear-gradient(135deg, #e8a4b0, #c97e8e)",
          border: "none", borderRadius: 12, color: "#fff", fontSize: 14, fontWeight: 700,
          cursor: (camError || phase === "init" || phase === "loading-ai") ? "not-allowed" : "pointer",
          opacity: (camError || phase === "init" || phase === "loading-ai") ? 0.5 : 1,
          display: "flex", alignItems: "center", justifyContent: "center", gap: 8, transition: "background 0.5s",
        }}>
          {countdown !== null && countdown > 0 ? (
            <><span style={{ fontSize: 20, fontWeight: 800, fontFamily: "var(--font-fraunces)" }}>{countdown}</span><span>Escaneando…</span></>
          ) : (
            <><svg width="15" height="15" viewBox="0 0 18 18" fill="none"><circle cx="9" cy="9" r="8" stroke="currentColor" strokeWidth="1.5" /><circle cx="9" cy="9" r="4" fill="currentColor" /></svg>Capturar y analizar</>
          )}
        </button>
      </div>

      <style>{`
        @keyframes spin      { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes pulse-dot { 0%,100% { opacity: 0.4; } 50% { opacity: 1; } }
      `}</style>
    </div>
  )
}
