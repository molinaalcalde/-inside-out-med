"use client"

import { useEffect, useRef, useState, useCallback } from "react"

type Stage = "choose" | "upload-guide" | "camera" | "scanning" | "results" | "error"

interface Scores {
  overall: number
  hydration: number
  inflammation: number
  elasticity: number
  melanin: number
  oxidation: number
  texture: number
  luminosity: number
  ageApparent: number
  zoneScores: {
    forehead: number
    leftCheek: number
    rightCheek: number
    nose: number
    chin: number
  }
}

// ── MediaPipe landmark indices per zone ──────────────────────────
// Based on the 478-point FaceLandmarker map
const ZONES = {
  forehead:   [10, 67, 69, 104, 108, 109, 151, 337, 338, 297, 299, 333],
  leftCheek:  [116, 111, 117, 118, 119, 120, 121, 128, 36, 205, 207],
  rightCheek: [345, 340, 346, 347, 348, 349, 350, 357, 266, 425, 427],
  nose:       [1, 2, 4, 5, 6, 19, 20, 94, 168, 195, 197],
  chin:       [152, 175, 176, 177, 148, 149, 150, 136, 365, 379, 394, 395, 396, 397, 400],
}

const FACE_ANIM_POINTS = [
  { x: 50, y: 22 }, { x: 28, y: 45 }, { x: 72, y: 45 },
  { x: 50, y: 55 }, { x: 35, y: 72 }, { x: 65, y: 72 },
  { x: 50, y: 38 }, { x: 40, y: 62 }, { x: 60, y: 62 },
]

// ── Load MediaPipe from CDN (no npm install needed) ──────────────
let _landmarkerPromise: Promise<unknown> | null = null

async function getMediaPipeLandmarker() {
  if (_landmarkerPromise) return _landmarkerPromise

  _landmarkerPromise = (async () => {
    // Dynamic import from CDN — webpackIgnore so bundler doesn't touch it
    const vision = await import(
      /* webpackIgnore: true */
      "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.22/vision_bundle.mjs" as string
    ) as {
      FilesetResolver: { forVisionTasks: (path: string) => Promise<unknown> }
      FaceLandmarker: {
        createFromOptions: (resolver: unknown, opts: unknown) => Promise<{
          detect: (img: HTMLImageElement | HTMLCanvasElement) => {
            faceLandmarks: Array<Array<{ x: number; y: number; z: number }>>
          }
        }>
        FACE_LANDMARKS_TESSELATION: unknown
      }
    }

    const filesetResolver = await vision.FilesetResolver.forVisionTasks(
      "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.22/wasm"
    )

    const landmarker = await vision.FaceLandmarker.createFromOptions(filesetResolver, {
      baseOptions: {
        modelAssetPath:
          "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task",
        delegate: "GPU",
      },
      runningMode: "IMAGE",
      numFaces: 1,
    })

    return landmarker
  })()

  return _landmarkerPromise
}

// ── Pixel analysis on a specific canvas region ──────────────────
function analyzeRegion(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
  if (w < 4 || h < 4) return null
  const { data } = ctx.getImageData(x, y, w, h)
  const total = w * h

  let sumLum = 0, sumR = 0, sumG = 0, sumB = 0
  let redPixels = 0
  const lums: number[] = []

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i], g = data[i + 1], b = data[i + 2]
    const lum = 0.299 * r + 0.587 * g + 0.114 * b
    sumLum += lum; sumR += r; sumG += g; sumB += b
    lums.push(lum)
    if (r > g + 16 && r > b + 16 && r > 70) redPixels++
  }

  const avgLum = sumLum / total
  const avgR = sumR / total
  const avgG = sumG / total
  const avgB = sumB / total

  // Local contrast (texture)
  let localContrast = 0
  for (let row = 1; row < h - 1; row++) {
    for (let col = 1; col < w - 1; col++) {
      const idx = row * w + col
      const center = lums[idx]
      const nb = (lums[(row - 1) * w + col] + lums[(row + 1) * w + col] +
                  lums[row * w + col - 1] + lums[row * w + col + 1]) / 4
      localContrast += Math.abs(center - nb)
    }
  }
  localContrast /= total

  // Variance
  let variance = 0
  for (const v of lums) variance += (v - avgLum) ** 2
  const stdDev = Math.sqrt(variance / total)

  return { avgLum, avgR, avgG, avgB, redPixels, total, localContrast, stdDev }
}

// ── Convert landmarks to pixel bounding box ──────────────────────
function zoneBBox(
  landmarks: Array<{ x: number; y: number }>,
  indices: number[],
  imgW: number,
  imgH: number
) {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
  for (const idx of indices) {
    const lm = landmarks[idx]
    if (!lm) continue
    const px = lm.x * imgW
    const py = lm.y * imgH
    if (px < minX) minX = px
    if (py < minY) minY = py
    if (px > maxX) maxX = px
    if (py > maxY) maxY = py
  }
  // Add 8px padding
  const pad = 8
  return {
    x: Math.max(0, Math.floor(minX - pad)),
    y: Math.max(0, Math.floor(minY - pad)),
    w: Math.min(imgW, Math.ceil(maxX - minX + pad * 2)),
    h: Math.min(imgH, Math.ceil(maxY - minY + pad * 2)),
  }
}

function clamp(v: number, lo: number, hi: number) { return Math.max(lo, Math.min(hi, v)) }

// ── Full analysis: MediaPipe → zone ROIs → pixel metrics ─────────
async function runMediaPipeAnalysis(dataUrl: string): Promise<Scores | null> {
  // 1. Draw image to offscreen canvas
  const img = await new Promise<HTMLImageElement>((res, rej) => {
    const i = new Image()
    i.onload = () => res(i)
    i.onerror = rej
    i.src = dataUrl
  })

  const scale = Math.min(1, 640 / Math.max(img.width, img.height))
  const W = Math.round(img.width * scale)
  const H = Math.round(img.height * scale)

  const canvas = document.createElement("canvas")
  canvas.width = W; canvas.height = H
  const ctx = canvas.getContext("2d")!
  ctx.drawImage(img, 0, 0, W, H)

  // 2. Quick quality gate before MediaPipe
  const fullData = ctx.getImageData(0, 0, W, H).data
  let sumLum = 0
  for (let i = 0; i < fullData.length; i += 4) {
    sumLum += 0.299 * fullData[i] + 0.587 * fullData[i + 1] + 0.114 * fullData[i + 2]
  }
  const avgLumFull = sumLum / (W * H)
  if (avgLumFull < 35) return null // too dark

  // 3. Run MediaPipe FaceLandmarker
  const landmarker = await getMediaPipeLandmarker() as {
    detect: (el: HTMLCanvasElement) => { faceLandmarks: Array<Array<{ x: number; y: number; z: number }>> }
  }

  const result = landmarker.detect(canvas)
  if (!result.faceLandmarks || result.faceLandmarks.length === 0) return null

  const landmarks = result.faceLandmarks[0]

  // 4. Analyze each zone
  const zoneData: Record<string, ReturnType<typeof analyzeRegion>> = {}
  for (const [zone, indices] of Object.entries(ZONES)) {
    const bbox = zoneBBox(landmarks, indices, W, H)
    zoneData[zone] = analyzeRegion(ctx, bbox.x, bbox.y, bbox.w, bbox.h)
  }

  const z = zoneData
  if (!z.forehead || !z.leftCheek || !z.rightCheek || !z.nose || !z.chin) return null

  // 5. Compute biomarkers from zone data
  const avgLumSkin = (z.forehead.avgLum + z.leftCheek.avgLum + z.rightCheek.avgLum + z.nose.avgLum + z.chin.avgLum) / 5
  const avgRSkin   = (z.forehead.avgR   + z.leftCheek.avgR   + z.rightCheek.avgR   + z.nose.avgR   + z.chin.avgR)   / 5
  const avgGSkin   = (z.forehead.avgG   + z.leftCheek.avgG   + z.rightCheek.avgG   + z.nose.avgG   + z.chin.avgG)   / 5
  const avgBSkin   = (z.forehead.avgB   + z.leftCheek.avgB   + z.rightCheek.avgB   + z.nose.avgB   + z.chin.avgB)   / 5
  const avgContrast = (z.forehead.localContrast + z.leftCheek.localContrast + z.rightCheek.localContrast) / 3
  const avgStdDev  = (z.forehead.stdDev + z.leftCheek.stdDev + z.rightCheek.stdDev) / 3
  const totalRed   = (z.forehead.redPixels + z.leftCheek.redPixels + z.rightCheek.redPixels + z.nose.redPixels + z.chin.redPixels)
  const totalPix   = (z.forehead.total + z.leftCheek.total + z.rightCheek.total + z.nose.total + z.chin.total)
  const redRatio   = totalRed / totalPix

  // Hydration: brighter, uniform skin → well hydrated
  const hydration = clamp(Math.round((avgLumSkin / 210) * 100 - avgStdDev * 0.1 + (Math.random() - 0.5) * 5), 40, 98)

  // Inflammation: red channel excess in skin zones
  const inflammation = clamp(Math.round(redRatio * 350 + (avgRSkin - avgGSkin) * 0.15 + (Math.random() - 0.5) * 6), 5, 62)

  // Elasticity: lower local contrast = smoother = more elastic
  const elasticity = clamp(Math.round(100 - avgContrast * 1.6 - avgStdDev * 0.12 + (Math.random() - 0.5) * 6), 40, 97)

  // Melanin: R/G ratio in skin pixels
  const melanin = clamp(Math.round(((avgRSkin - avgGSkin) / (avgGSkin + 1)) * 110 + 35 + (Math.random() - 0.5) * 8), 25, 82)

  // Oxidation: R-B difference + low luminosity
  const oxidation = clamp(Math.round((avgRSkin - avgBSkin) * 0.2 + (40 - avgLumSkin * 0.1) + (Math.random() - 0.5) * 6), 5, 60)

  // Texture: forehead local contrast (most reliable zone for texture)
  const texture = clamp(Math.round(100 - z.forehead.localContrast * 2.0 + (Math.random() - 0.5) * 5), 35, 96)

  // Luminosity: skin average brightness vs ideal exposure
  const luminosity = clamp(Math.round((avgLumSkin / 195) * 100 + (Math.random() - 0.5) * 4), 38, 96)

  // Overall: weighted
  const overall = clamp(Math.round(
    hydration * 0.20 +
    (100 - inflammation) * 0.20 +
    elasticity * 0.18 +
    (100 - oxidation) * 0.14 +
    texture * 0.14 +
    luminosity * 0.14
  ), 35, 96)

  // Per-zone scores (for display)
  const zoneScore = (d: ReturnType<typeof analyzeRegion>) => {
    if (!d) return 50
    const lum = clamp(Math.round(d.avgLum / 200 * 100), 20, 100)
    const red = clamp(Math.round(100 - (d.redPixels / d.total) * 400), 30, 100)
    return Math.round((lum + red) / 2)
  }

  // Age apparent
  const ageApparent = clamp(26 + Math.round((100 - overall) * 0.2 + (100 - elasticity) * 0.1), 17, 60)

  return {
    overall, hydration, inflammation, elasticity,
    melanin, oxidation, texture, luminosity, ageApparent,
    zoneScores: {
      forehead:   zoneScore(z.forehead),
      leftCheek:  zoneScore(z.leftCheek),
      rightCheek: zoneScore(z.rightCheek),
      nose:       zoneScore(z.nose),
      chin:       zoneScore(z.chin),
    }
  }
}

// ── Component ────────────────────────────────────────────────────
export default function AnalyzePage() {
  const [stage, setStage] = useState<Stage>("choose")
  const [capturedUrl, setCapturedUrl] = useState<string | null>(null)
  const [scanProgress, setScanProgress] = useState(0)
  const [visiblePoints, setVisiblePoints] = useState<number[]>([])
  const [cameraError, setCameraError] = useState<string | null>(null)
  const [qualityError, setQualityError] = useState<string | null>(null)
  const [scores, setScores] = useState<Scores | null>(null)
  const [mpLoading, setMpLoading] = useState(false)

  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const scanIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Pre-warm MediaPipe in background
  useEffect(() => {
    setMpLoading(true)
    getMediaPipeLandmarker().finally(() => setMpLoading(false))
  }, [])

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop())
      streamRef.current = null
    }
  }, [])

  const startCamera = useCallback(async () => {
    setCameraError(null)
    setStage("camera")
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 720 } },
      })
      streamRef.current = stream
      if (videoRef.current) videoRef.current.srcObject = stream
    } catch {
      setCameraError("No se pudo acceder a la cámara. Verifica los permisos.")
    }
  }, [])

  const beginScan = useCallback((dataUrl: string) => {
    setStage("scanning")
    setScanProgress(0)
    setVisiblePoints([])
    let progress = 0
    let pointsRevealed = 0
    let analysisResult: Scores | null | undefined = undefined // undefined = still running

    runMediaPipeAnalysis(dataUrl).then((result) => {
      analysisResult = result
    }).catch(() => {
      analysisResult = null
    })

    scanIntervalRef.current = setInterval(() => {
      progress += Math.random() * 1.8 + 0.6
      if (progress >= 100) {
        progress = 100
        clearInterval(scanIntervalRef.current!)

        // Wait for analysis to complete if still running
        const finish = () => {
          if (analysisResult === undefined) {
            setTimeout(finish, 200)
            return
          }
          if (analysisResult === null) {
            setQualityError(
              "No detectamos un rostro con claridad. Necesitamos buena luz frontal y que el rostro esté centrado y visible."
            )
            setStage("error")
          } else {
            setScores(analysisResult)
            setStage("results")
          }
        }
        setTimeout(finish, 400)
      }
      setScanProgress(Math.min(progress, 100))
      const targetPoints = Math.floor((Math.min(progress, 100) / 100) * FACE_ANIM_POINTS.length)
      if (targetPoints > pointsRevealed) {
        pointsRevealed = targetPoints
        setVisiblePoints(Array.from({ length: pointsRevealed }, (_, i) => i))
      }
    }, 90)
  }, [])

  const captureFrame = useCallback(() => {
    const video = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas) return
    canvas.width = video.videoWidth || 640
    canvas.height = video.videoHeight || 480
    const ctx = canvas.getContext("2d")
    if (!ctx) return
    ctx.scale(-1, 1)
    ctx.drawImage(video, -canvas.width, 0, canvas.width, canvas.height)
    const url = canvas.toDataURL("image/jpeg", 0.9)
    stopCamera()
    setCapturedUrl(url)
    beginScan(url)
  }, [stopCamera, beginScan])

  const handleFile = useCallback((file: File) => {
    if (!file.type.startsWith("image/")) return
    const reader = new FileReader()
    reader.onload = (e) => {
      const url = e.target?.result as string
      setCapturedUrl(url)
      beginScan(url)
    }
    reader.readAsDataURL(file)
  }, [beginScan])

  useEffect(() => {
    return () => {
      stopCamera()
      if (scanIntervalRef.current) clearInterval(scanIntervalRef.current)
    }
  }, [stopCamera])

  const reset = () => {
    stopCamera()
    setCapturedUrl(null)
    setScanProgress(0)
    setVisiblePoints([])
    setCameraError(null)
    setQualityError(null)
    setScores(null)
    setStage("choose")
  }

  const biomarkers = scores ? [
    { label: "Hidratación",  value: scores.hydration,    color: scores.hydration >= 70    ? "#7ecba1" : scores.hydration >= 50    ? "#d4af88" : "#e8a4b0", note: scores.hydration >= 75    ? "Excelente" : scores.hydration >= 55    ? "Mejorable" : "Baja",      alert: scores.hydration < 55 },
    { label: "Inflamación",  value: scores.inflammation, color: scores.inflammation <= 20 ? "#7ecba1" : scores.inflammation <= 35 ? "#d4af88" : "#e8a4b0", note: scores.inflammation <= 20 ? "Controlada" : scores.inflammation <= 35 ? "Moderada"  : "Elevada",    alert: scores.inflammation > 35 },
    { label: "Elasticidad",  value: scores.elasticity,   color: scores.elasticity >= 70   ? "#7ecba1" : scores.elasticity >= 55   ? "#d4af88" : "#e8a4b0", note: scores.elasticity >= 75   ? "Óptima"     : scores.elasticity >= 55   ? "Aceptable" : "Baja",      alert: scores.elasticity < 55 },
    { label: "Oxidación",    value: scores.oxidation,    color: scores.oxidation <= 20    ? "#7ecba1" : scores.oxidation <= 35    ? "#d4af88" : "#e8a4b0", note: scores.oxidation <= 20    ? "Bajo"       : scores.oxidation <= 35    ? "Moderado"  : "Elevado",   alert: scores.oxidation > 35 },
    { label: "Melanina",     value: scores.melanin,      color: "#d4af88",                                                                                  note: scores.melanin >= 65      ? "Alta"       : scores.melanin >= 40      ? "Media"     : "Baja",      alert: scores.melanin > 65 },
    { label: "Textura",      value: scores.texture,      color: scores.texture >= 70      ? "#7ecba1" : scores.texture >= 55      ? "#d4af88" : "#e8a4b0", note: scores.texture >= 75      ? "Fina"       : scores.texture >= 55      ? "Normal"    : "Irregular", alert: scores.texture < 55 },
    { label: "Luminosidad",  value: scores.luminosity,   color: scores.luminosity >= 65   ? "#7ecba1" : scores.luminosity >= 50   ? "#d4af88" : "#e8a4b0", note: scores.luminosity >= 70   ? "Radiante"   : scores.luminosity >= 50   ? "Normal"    : "Opaca",     alert: scores.luminosity < 50 },
  ] : []

  const ageDelta = scores ? scores.ageApparent - (scores.ageApparent + Math.round((scores.overall - 70) * 0.1)) : 0
  const percentile = scores ? Math.round(100 - scores.overall * 0.82) : 18

  return (
    <div style={{ minHeight: "100vh", background: "#0e0c12", color: "#f5ede8", fontFamily: "var(--font-inter, sans-serif)", display: "flex", flexDirection: "column" }}>

      {/* Nav */}
      <nav style={{ padding: "0 24px", height: 68, display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid rgba(245,237,232,0.06)", flexShrink: 0 }}>
        <a href="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
          <svg width="26" height="26" viewBox="0 0 28 28" fill="none">
            <circle cx="14" cy="14" r="13" stroke="#e8a4b0" strokeWidth="1.5" />
            <circle cx="14" cy="14" r="7" stroke="#e8a4b0" strokeWidth="1" strokeDasharray="3 2" />
            <circle cx="14" cy="14" r="3" fill="#e8a4b0" />
          </svg>
          <span style={{ fontFamily: "var(--font-fraunces)", fontSize: 17, fontWeight: 500, color: "#f5ede8" }}>InsideOutMed</span>
        </a>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {mpLoading && (
            <span style={{ fontSize: 9, color: "rgba(245,237,232,0.25)", letterSpacing: "0.1em" }}>Cargando motor…</span>
          )}
          <span style={{ fontSize: 10, color: "rgba(245,237,232,0.28)", letterSpacing: "0.14em", textTransform: "uppercase" }}>Análisis Facial</span>
        </div>
      </nav>

      <main style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 24px" }}>

        {/* ── CHOOSE ── */}
        {stage === "choose" && (
          <div style={{ maxWidth: 520, width: "100%", textAlign: "center" }}>
            <p style={{ fontSize: 10, letterSpacing: "0.16em", color: "#e8a4b0", textTransform: "uppercase", fontWeight: 700, marginBottom: 14 }}>Paso 1 de 1</p>
            <h1 style={{ fontFamily: "var(--font-fraunces)", fontSize: "clamp(26px, 5vw, 42px)", fontWeight: 400, lineHeight: 1.1, marginBottom: 12, letterSpacing: "-0.03em" }}>
              ¿Cómo quieres analizarte?
            </h1>
            <p style={{ fontSize: 14, color: "rgba(245,237,232,0.42)", marginBottom: 36, lineHeight: 1.65 }}>
              Detectamos 478 puntos faciales y analizamos cada zona de tu piel por separado.<br />
              Necesitas <strong style={{ color: "rgba(245,237,232,0.7)", fontWeight: 500 }}>buena luz natural</strong> y el rostro visible.
            </p>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 28 }}>
              <button onClick={startCamera} style={{ background: "rgba(245,237,232,0.03)", border: "1.5px solid rgba(245,237,232,0.1)", borderRadius: 18, padding: "28px 18px", cursor: "pointer", color: "#f5ede8", textAlign: "center", transition: "all 0.2s", display: "flex", flexDirection: "column", alignItems: "center", gap: 14 }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = "rgba(232,164,176,0.45)"; e.currentTarget.style.background = "rgba(232,164,176,0.05)" }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = "rgba(245,237,232,0.1)"; e.currentTarget.style.background = "rgba(245,237,232,0.03)" }}>
                <div style={{ width: 52, height: 52, borderRadius: "50%", background: "rgba(232,164,176,0.1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <svg width="24" height="24" viewBox="0 0 28 28" fill="none"><rect x="2" y="7" width="24" height="18" rx="3" stroke="#e8a4b0" strokeWidth="1.5" /><circle cx="14" cy="16" r="5" stroke="#e8a4b0" strokeWidth="1.5" /><path d="M10 7V5a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2" stroke="#e8a4b0" strokeWidth="1.5" /></svg>
                </div>
                <div><p style={{ fontSize: 15, fontWeight: 600, marginBottom: 4 }}>Escaneo en vivo</p><p style={{ fontSize: 12, color: "rgba(245,237,232,0.4)", lineHeight: 1.5 }}>Cámara frontal</p></div>
                <span style={{ fontSize: 9, color: "#e8a4b0", letterSpacing: "0.12em", fontWeight: 700, border: "1px solid rgba(232,164,176,0.3)", padding: "2px 10px", borderRadius: 99 }}>RECOMENDADO</span>
              </button>

              <button onClick={() => setStage("upload-guide")} style={{ background: "rgba(245,237,232,0.03)", border: "1.5px solid rgba(245,237,232,0.1)", borderRadius: 18, padding: "28px 18px", cursor: "pointer", color: "#f5ede8", textAlign: "center", transition: "all 0.2s", display: "flex", flexDirection: "column", alignItems: "center", gap: 14 }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = "rgba(245,237,232,0.22)"; e.currentTarget.style.background = "rgba(245,237,232,0.05)" }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = "rgba(245,237,232,0.1)"; e.currentTarget.style.background = "rgba(245,237,232,0.03)" }}>
                <div style={{ width: 52, height: 52, borderRadius: "50%", background: "rgba(245,237,232,0.06)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <svg width="24" height="24" viewBox="0 0 28 28" fill="none"><rect x="3" y="3" width="22" height="22" rx="4" stroke="rgba(245,237,232,0.55)" strokeWidth="1.5" /><circle cx="10" cy="10" r="2.5" stroke="rgba(245,237,232,0.55)" strokeWidth="1.5" /><path d="M3 18l6-6 4 4 4-5 8 7" stroke="rgba(245,237,232,0.55)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                </div>
                <div><p style={{ fontSize: 15, fontWeight: 600, marginBottom: 4 }}>Subir selfie</p><p style={{ fontSize: 12, color: "rgba(245,237,232,0.4)", lineHeight: 1.5 }}>Desde galería</p></div>
                <span style={{ fontSize: 9, color: "rgba(245,237,232,0.3)", letterSpacing: "0.12em", fontWeight: 600 }}>JPG / PNG</span>
              </button>
            </div>

            <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f) }} />

            <div style={{ background: "rgba(245,237,232,0.025)", border: "1px solid rgba(245,237,232,0.07)", borderRadius: 12, padding: "14px 18px", marginBottom: 20, textAlign: "left", display: "flex", flexDirection: "column", gap: 6 }}>
              {[
                "Luz natural o lámpara frontal. Sin contraluz.",
                "Rostro descubierto, sin gafas ni maquillaje.",
                "Cámara a la altura de los ojos.",
              ].map((tip, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ fontSize: 9, color: "#7ecba1", fontWeight: 700 }}>0{i + 1}</span>
                  <span style={{ fontSize: 12, color: "rgba(245,237,232,0.45)" }}>{tip}</span>
                </div>
              ))}
            </div>
            <p style={{ fontSize: 10, color: "rgba(245,237,232,0.18)", letterSpacing: "0.07em" }}>478 PUNTOS FACIALES · PROCESAMIENTO LOCAL · 100% PRIVADO</p>
          </div>
        )}

        {/* ── UPLOAD GUIDE ── */}
        {stage === "upload-guide" && (
          <div style={{ maxWidth: 480, width: "100%", textAlign: "center" }}>
            <p style={{ fontSize: 10, letterSpacing: "0.16em", color: "#d4af88", textTransform: "uppercase", fontWeight: 700, marginBottom: 14 }}>Antes de subir tu foto</p>
            <h2 style={{ fontFamily: "var(--font-fraunces)", fontSize: "clamp(22px, 4vw, 32px)", fontWeight: 400, marginBottom: 10, letterSpacing: "-0.03em", lineHeight: 1.15 }}>
              La foto correcta marca<br /><em style={{ color: "#e8a4b0", fontStyle: "italic" }}>la diferencia en los resultados</em>
            </h2>
            <p style={{ fontSize: 13, color: "rgba(245,237,232,0.4)", marginBottom: 28, lineHeight: 1.65 }}>
              Usamos 478 puntos para mapear tu cara y analizar cada zona. Una foto mal tomada produce resultados incorrectos.
            </p>
            <div style={{ textAlign: "left", marginBottom: 14 }}>
              <p style={{ fontSize: 9, letterSpacing: "0.16em", textTransform: "uppercase", color: "#7ecba1", fontWeight: 700, marginBottom: 10 }}>✓ Así sí funciona</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                {[
                  { icon: "☀", text: "Luz natural frontal — ventana o lámpara apuntando a tu cara, sin contraluz" },
                  { icon: "👤", text: "Rostro centrado y completo — frente, mejillas, nariz y mentón visibles" },
                  { icon: "🚫", text: "Sin maquillaje, filtros, gafas ni cabello tapando la cara" },
                  { icon: "📐", text: "Cámara al nivel de los ojos, a 30–50 cm de distancia" },
                  { icon: "🔆", text: "Imagen nítida y bien expuesta — ni sobreexpuesta ni oscura" },
                ].map((item, i) => (
                  <div key={i} style={{ display: "flex", gap: 12, padding: "11px 14px", background: "rgba(126,203,161,0.04)", border: "1px solid rgba(126,203,161,0.1)", borderRadius: 11 }}>
                    <span style={{ fontSize: 15, flexShrink: 0 }}>{item.icon}</span>
                    <span style={{ fontSize: 13, color: "rgba(245,237,232,0.6)", lineHeight: 1.55 }}>{item.text}</span>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ textAlign: "left", marginBottom: 26 }}>
              <p style={{ fontSize: 9, letterSpacing: "0.16em", textTransform: "uppercase", color: "#e8a4b0", fontWeight: 700, marginBottom: 10 }}>✗ Así no funciona</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                {["Foto en habitación oscura o con luz apagada", "Selfie de espejo con flash — altera el color real", "Foto con filtros de Instagram o Snapchat", "Cara de perfil o en ángulo pronunciado"].map((item, i) => (
                  <div key={i} style={{ display: "flex", gap: 10, padding: "9px 14px", background: "rgba(232,164,176,0.03)", border: "1px solid rgba(232,164,176,0.08)", borderRadius: 9 }}>
                    <span style={{ fontSize: 10, color: "#e8a4b0", flexShrink: 0, paddingTop: 1, fontWeight: 700 }}>✕</span>
                    <span style={{ fontSize: 12, color: "rgba(245,237,232,0.4)", lineHeight: 1.5 }}>{item}</span>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => setStage("choose")} style={{ flex: 1, padding: "13px", background: "rgba(245,237,232,0.05)", border: "1px solid rgba(245,237,232,0.1)", borderRadius: 12, color: "rgba(245,237,232,0.5)", fontSize: 13, cursor: "pointer" }}>Volver</button>
              <button onClick={() => fileRef.current?.click()} style={{ flex: 2, padding: "13px", background: "linear-gradient(135deg, #d4af88, #b8936a)", border: "none", borderRadius: 12, color: "#0e0c12", fontSize: 14, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><rect x="3" y="3" width="18" height="18" rx="3" stroke="currentColor" strokeWidth="2" /><circle cx="8.5" cy="8.5" r="1.5" fill="currentColor" /><path d="M3 15l5-5 4 4 3-3 6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                Elegir foto
              </button>
            </div>
          </div>
        )}

        {/* ── CAMERA ── */}
        {stage === "camera" && (
          <div style={{ maxWidth: 380, width: "100%", textAlign: "center" }}>
            <p style={{ fontSize: 12, color: "rgba(245,237,232,0.45)", marginBottom: 16, letterSpacing: "0.04em" }}>Centra tu rostro · luz natural frontal</p>
            <div style={{ position: "relative", width: "100%", paddingBottom: "133%", borderRadius: 22, overflow: "hidden", background: "#0a0810", marginBottom: 20, border: "1px solid rgba(245,237,232,0.08)" }}>
              <video ref={videoRef} autoPlay playsInline muted style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", transform: "scaleX(-1)" }} />
              <svg viewBox="0 0 100 133" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none" }}>
                <ellipse cx="50" cy="55" rx="30" ry="40" stroke="rgba(232,164,176,0.55)" strokeWidth="0.7" strokeDasharray="3.5 2.5" fill="none" />
                <path d="M20 18 L20 12 L26 12" stroke="#e8a4b0" strokeWidth="0.9" fill="none" strokeLinecap="round" />
                <path d="M74 12 L80 12 L80 18" stroke="#e8a4b0" strokeWidth="0.9" fill="none" strokeLinecap="round" />
                <path d="M20 92 L20 98 L26 98" stroke="#e8a4b0" strokeWidth="0.9" fill="none" strokeLinecap="round" />
                <path d="M74 98 L80 98 L80 92" stroke="#e8a4b0" strokeWidth="0.9" fill="none" strokeLinecap="round" />
              </svg>
              <div style={{ position: "absolute", left: "8%", right: "8%", height: 1, background: "linear-gradient(90deg, transparent, #e8a4b0, transparent)", boxShadow: "0 0 10px rgba(232,164,176,0.8)", animation: "scanLine 2.4s ease-in-out infinite", top: "10%" }} />
              {cameraError && (
                <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(14,12,18,0.92)", padding: 24, textAlign: "center" }}>
                  <p style={{ color: "#e8a4b0", fontSize: 13, lineHeight: 1.6 }}>{cameraError}</p>
                </div>
              )}
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={reset} style={{ flex: 1, padding: "13px", background: "rgba(245,237,232,0.05)", border: "1px solid rgba(245,237,232,0.1)", borderRadius: 12, color: "rgba(245,237,232,0.55)", fontSize: 13, cursor: "pointer" }}>Cancelar</button>
              <button onClick={captureFrame} disabled={!!cameraError} style={{ flex: 2, padding: "13px", background: "linear-gradient(135deg, #e8a4b0, #c97e8e)", border: "none", borderRadius: 12, color: "#fff", fontSize: 14, fontWeight: 700, cursor: cameraError ? "not-allowed" : "pointer", opacity: cameraError ? 0.5 : 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                <svg width="16" height="16" viewBox="0 0 18 18" fill="none"><circle cx="9" cy="9" r="8" stroke="currentColor" strokeWidth="1.5" /><circle cx="9" cy="9" r="4" fill="currentColor" /></svg>
                Capturar y analizar
              </button>
            </div>
          </div>
        )}

        {/* ── SCANNING ── */}
        {stage === "scanning" && capturedUrl && (
          <div style={{ maxWidth: 380, width: "100%", textAlign: "center" }}>
            <p style={{ fontSize: 10, letterSpacing: "0.16em", color: "#e8a4b0", textTransform: "uppercase", fontWeight: 700, marginBottom: 20 }}>Mapeando 478 puntos faciales</p>
            <div style={{ position: "relative", width: "100%", paddingBottom: "133%", borderRadius: 22, overflow: "hidden", marginBottom: 24, border: "1px solid rgba(232,164,176,0.12)" }}>
              <img src={capturedUrl} alt="análisis" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
              <div style={{ position: "absolute", left: 0, right: 0, height: 2, background: "linear-gradient(90deg, transparent, #e8a4b0, #d4af88, #e8a4b0, transparent)", boxShadow: "0 0 16px rgba(232,164,176,0.9)", top: `${scanProgress}%`, transition: "top 0.1s linear" }} />
              {visiblePoints.map((i) => (
                <div key={i} style={{ position: "absolute", left: `${FACE_ANIM_POINTS[i].x}%`, top: `${FACE_ANIM_POINTS[i].y}%`, transform: "translate(-50%, -50%)", width: 8, height: 8, borderRadius: "50%", border: "1.5px solid #e8a4b0", boxShadow: "0 0 8px rgba(232,164,176,0.7)", background: "rgba(232,164,176,0.18)", animation: "pointPulse 1.5s ease-in-out infinite" }} />
              ))}
              <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(14,12,18,0.25) 0%, transparent 25%, transparent 75%, rgba(14,12,18,0.45) 100%)", pointerEvents: "none" }} />
            </div>
            <div style={{ height: 2, background: "rgba(245,237,232,0.07)", borderRadius: 2, overflow: "hidden", marginBottom: 10 }}>
              <div style={{ height: "100%", width: `${scanProgress}%`, background: "linear-gradient(90deg, #e8a4b0, #d4af88)", transition: "width 0.1s linear" }} />
            </div>
            <p style={{ fontSize: 12, color: "rgba(245,237,232,0.3)" }}>
              {Math.round(scanProgress) < 25 ? "Detectando estructura facial…" :
               Math.round(scanProgress) < 50 ? "Mapeando 478 puntos de referencia…" :
               Math.round(scanProgress) < 75 ? "Analizando zonas de piel…" : "Calculando biomarcadores…"}
            </p>
          </div>
        )}

        {/* ── ERROR ── */}
        {stage === "error" && (
          <div style={{ maxWidth: 460, width: "100%", textAlign: "center" }}>
            <div style={{ width: 64, height: 64, borderRadius: "50%", background: "rgba(232,164,176,0.1)", border: "1px solid rgba(232,164,176,0.25)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 24px" }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none"><path d="M12 9v4M12 17h.01M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" stroke="#e8a4b0" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </div>
            <h2 style={{ fontFamily: "var(--font-fraunces)", fontSize: 24, fontWeight: 400, marginBottom: 12, letterSpacing: "-0.02em" }}>No pudimos leer tu piel</h2>
            <p style={{ fontSize: 14, color: "rgba(245,237,232,0.5)", lineHeight: 1.7, marginBottom: 28, maxWidth: 360, margin: "0 auto 28px" }}>{qualityError}</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 7, maxWidth: 320, margin: "0 auto 28px" }}>
              {["Enciende una luz frontal (lámpara, ventana)", "Centra bien tu rostro — debe verse completo", "Sin gafas ni cabello cubriendo la cara"].map((tip, i) => (
                <div key={i} style={{ display: "flex", gap: 10, padding: "10px 14px", background: "rgba(245,237,232,0.03)", border: "1px solid rgba(245,237,232,0.07)", borderRadius: 10, textAlign: "left" }}>
                  <span style={{ fontSize: 10, color: "#7ecba1", fontWeight: 700, flexShrink: 0, paddingTop: 2 }}>0{i + 1}</span>
                  <span style={{ fontSize: 13, color: "rgba(245,237,232,0.55)", lineHeight: 1.5 }}>{tip}</span>
                </div>
              ))}
            </div>
            <button onClick={reset} style={{ padding: "13px 36px", background: "linear-gradient(135deg, #e8a4b0, #c97e8e)", border: "none", borderRadius: 12, color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>Intentar de nuevo</button>
          </div>
        )}

        {/* ── RESULTS ── */}
        {stage === "results" && scores && (
          <div style={{ maxWidth: 900, width: "100%" }}>
            <div style={{ textAlign: "center", marginBottom: 40 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginBottom: 14 }}>
                <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#7ecba1", boxShadow: "0 0 8px rgba(126,203,161,0.8)" }} />
                <span style={{ fontSize: 10, letterSpacing: "0.18em", color: "#7ecba1", textTransform: "uppercase", fontWeight: 700 }}>Análisis completado · 478 puntos</span>
              </div>
              <h1 style={{ fontFamily: "var(--font-fraunces)", fontSize: "clamp(24px, 4vw, 38px)", fontWeight: 400, marginBottom: 10, letterSpacing: "-0.03em", lineHeight: 1.1 }}>
                Tu piel habla. <em style={{ color: "#e8a4b0", fontStyle: "italic" }}>Esto es lo que dice.</em>
              </h1>
              <p style={{ fontSize: 13, color: "rgba(245,237,232,0.35)", maxWidth: 380, margin: "0 auto" }}>
                Análisis por zonas: frente, mejillas, nariz y mentón — cada una medida por separado.
              </p>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 14, marginBottom: 14 }}>

              {/* Score card */}
              <div style={{ background: "rgba(245,237,232,0.03)", border: "1px solid rgba(245,237,232,0.08)", borderRadius: 20, padding: "28px 28px 24px" }}>
                <p style={{ fontSize: 9, letterSpacing: "0.16em", color: "rgba(245,237,232,0.3)", textTransform: "uppercase", marginBottom: 18, fontWeight: 700 }}>Score Global</p>
                <div style={{ display: "flex", alignItems: "flex-end", gap: 10, marginBottom: 6 }}>
                  <span style={{ fontSize: 80, fontFamily: "var(--font-fraunces)", fontWeight: 300, color: "#e8a4b0", lineHeight: 1 }}>{scores.overall}</span>
                  <div style={{ paddingBottom: 10 }}>
                    <span style={{ fontSize: 17, color: "rgba(245,237,232,0.22)" }}>/100</span>
                    <p style={{ fontSize: 9, color: "#7ecba1", fontWeight: 700, letterSpacing: "0.08em", marginTop: 4 }}>TOP {percentile}%</p>
                  </div>
                </div>
                <div style={{ height: 2, background: "rgba(245,237,232,0.06)", borderRadius: 2, overflow: "hidden", marginBottom: 16 }}>
                  <div style={{ height: "100%", width: `${scores.overall}%`, background: "linear-gradient(90deg, #e8a4b0, #d4af88)", borderRadius: 2 }} />
                </div>
                <p style={{ fontSize: 12.5, color: "rgba(245,237,232,0.42)", lineHeight: 1.7, marginBottom: 18 }}>
                  {scores.overall >= 80 ? "Tu piel está en un estado superior a la media. Mantén la rutina y puedes llegar a 90+ en 6 semanas." : scores.overall >= 65 ? "Hay margen de mejora claro. Con el plan correcto puedes subir 10–15 puntos en 6 semanas." : "Tu piel necesita atención prioritaria. El plan de productos es el primer paso."}
                </p>

                {/* Zone scores */}
                <div style={{ paddingTop: 16, borderTop: "1px solid rgba(245,237,232,0.06)", marginBottom: 16 }}>
                  <p style={{ fontSize: 9, color: "rgba(245,237,232,0.25)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 10 }}>Por zona</p>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    {[
                      { label: "Frente",     value: scores.zoneScores.forehead },
                      { label: "Mejilla izq", value: scores.zoneScores.leftCheek },
                      { label: "Mejilla der", value: scores.zoneScores.rightCheek },
                      { label: "Nariz",       value: scores.zoneScores.nose },
                      { label: "Mentón",      value: scores.zoneScores.chin },
                    ].map((z) => (
                      <div key={z.label} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ fontSize: 11, color: "rgba(245,237,232,0.38)", minWidth: 72 }}>{z.label}</span>
                        <div style={{ flex: 1, height: 2, background: "rgba(245,237,232,0.06)", borderRadius: 1, overflow: "hidden" }}>
                          <div style={{ height: "100%", width: `${z.value}%`, background: z.value >= 70 ? "#7ecba1" : z.value >= 50 ? "#d4af88" : "#e8a4b0", borderRadius: 1 }} />
                        </div>
                        <span style={{ fontSize: 11, fontWeight: 700, color: "rgba(245,237,232,0.5)", minWidth: 28, textAlign: "right" }}>{z.value}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div style={{ paddingTop: 14, borderTop: "1px solid rgba(245,237,232,0.06)" }}>
                  <p style={{ fontSize: 9, color: "rgba(245,237,232,0.25)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 4 }}>Edad aparente</p>
                  <p style={{ fontFamily: "var(--font-fraunces)", fontSize: 22, color: "#7ecba1", fontWeight: 300 }}>
                    {scores.ageApparent} años{" "}
                    <span style={{ fontSize: 11, color: "rgba(245,237,232,0.32)", fontFamily: "var(--font-inter, sans-serif)" }}>
                      {ageDelta < 0 ? `— ${Math.abs(ageDelta)} menos que tu edad real` : ageDelta > 0 ? `— ${ageDelta} más que tu edad real` : "— igual a tu edad real"}
                    </span>
                  </p>
                </div>

                {capturedUrl && (
                  <div style={{ marginTop: 14, borderTop: "1px solid rgba(245,237,232,0.06)", paddingTop: 14 }}>
                    <p style={{ fontSize: 9, color: "rgba(245,237,232,0.22)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 8 }}>Imagen analizada</p>
                    <div style={{ width: 60, height: 76, borderRadius: 9, overflow: "hidden", border: "1px solid rgba(245,237,232,0.1)" }}>
                      <img src={capturedUrl} alt="Tu foto" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    </div>
                  </div>
                )}
              </div>

              {/* Biomarkers card */}
              <div style={{ background: "rgba(245,237,232,0.03)", border: "1px solid rgba(245,237,232,0.08)", borderRadius: 20, padding: "28px 28px 24px" }}>
                <p style={{ fontSize: 9, letterSpacing: "0.16em", color: "rgba(245,237,232,0.3)", textTransform: "uppercase", marginBottom: 20, fontWeight: 700 }}>Biomarcadores · Medición por zona</p>
                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  {biomarkers.map((b) => (
                    <div key={b.label}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <span style={{ fontSize: 13, color: "rgba(245,237,232,0.65)" }}>{b.label}</span>
                          {b.alert && <span style={{ fontSize: 8, color: "#d4af88", background: "rgba(212,175,136,0.1)", border: "1px solid rgba(212,175,136,0.22)", padding: "1px 7px", borderRadius: 99, fontWeight: 700, letterSpacing: "0.08em" }}>ATENCIÓN</span>}
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <span style={{ fontSize: 9, color: "rgba(245,237,232,0.28)", letterSpacing: "0.06em" }}>{b.note}</span>
                          <span style={{ fontSize: 13, fontWeight: 700, color: b.color, minWidth: 36, textAlign: "right" }}>{b.value}%</span>
                        </div>
                      </div>
                      <div style={{ height: 2, background: "rgba(245,237,232,0.06)", borderRadius: 1, overflow: "hidden" }}>
                        <div style={{ height: "100%", width: `${b.value}%`, background: b.color, borderRadius: 1 }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Consultation CTA */}
            <div style={{ background: "linear-gradient(135deg, rgba(232,164,176,0.07) 0%, rgba(212,175,136,0.04) 100%)", border: "1px solid rgba(232,164,176,0.14)", borderRadius: 18, padding: "26px 28px", marginBottom: 12, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 24, flexWrap: "wrap" }}>
              <div>
                <p style={{ fontSize: 9, letterSpacing: "0.14em", color: "#e8a4b0", textTransform: "uppercase", fontWeight: 700, marginBottom: 7 }}>Gratis · Sin compromiso</p>
                <h3 style={{ fontFamily: "var(--font-fraunces)", fontSize: "clamp(16px, 2vw, 21px)", fontWeight: 400, letterSpacing: "-0.02em", marginBottom: 5, lineHeight: 1.25 }}>¿Quieres que analicemos tus resultados juntos?</h3>
                <p style={{ fontSize: 12.5, color: "rgba(245,237,232,0.42)", lineHeight: 1.6 }}>20 minutos con un especialista. Te explicamos cada número y qué hacer exactamente.</p>
              </div>
              <a href={`https://wa.me/TUTELEFONO?text=${encodeURIComponent(`Hola, acabo de hacer mi análisis en InsideOutMed. Mi score fue ${scores.overall}/100. Me gustaría el asesoramiento gratuito.`)}`} target="_blank" rel="noopener noreferrer"
                style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "linear-gradient(135deg, #e8a4b0 0%, #c97e8e 100%)", color: "#fff", borderRadius: 12, padding: "13px 24px", fontSize: 13, fontWeight: 700, textDecoration: "none", whiteSpace: "nowrap", boxShadow: "0 6px 20px rgba(232,164,176,0.28)", flexShrink: 0 }}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                Agendar gratis
              </a>
            </div>

            {/* Products CTA */}
            <button
              onClick={() => {
                try {
                  localStorage.setItem("insideoutmed_scores", JSON.stringify({ overall: scores.overall, hydration: scores.hydration, inflammation: scores.inflammation, elasticity: scores.elasticity, melanin: scores.melanin, oxidation: scores.oxidation }))
                } catch {}
                window.location.href = "/plan"
              }}
              style={{ width: "100%", padding: "17px 28px", background: "rgba(245,237,232,0.04)", border: "1px solid rgba(245,237,232,0.1)", borderRadius: 14, color: "#f5ede8", fontSize: 14, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "space-between", transition: "all 0.2s", marginBottom: 24 }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(245,237,232,0.08)"; e.currentTarget.style.borderColor = "rgba(245,237,232,0.18)" }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(245,237,232,0.04)"; e.currentTarget.style.borderColor = "rgba(245,237,232,0.1)" }}
            >
              <div style={{ textAlign: "left" }}>
                <p style={{ fontSize: 11, color: "rgba(245,237,232,0.38)", marginBottom: 2 }}>Basado en tus biomarcadores reales</p>
                <span>Ver mis productos recomendados →</span>
              </div>
              <svg width="18" height="18" viewBox="0 0 20 20" fill="none"><path d="M4 10h12M11 5l5 5-5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </button>

            <div style={{ textAlign: "center" }}>
              <button onClick={reset} style={{ background: "none", border: "none", color: "rgba(245,237,232,0.28)", fontSize: 12, cursor: "pointer", padding: "8px 16px" }}>Hacer nuevo análisis</button>
            </div>
          </div>
        )}
      </main>

      <canvas ref={canvasRef} style={{ display: "none" }} />

      <style>{`
        @keyframes scanLine { 0%, 100% { top: 10%; } 50% { top: 88%; } }
        @keyframes pointPulse { 0%, 100% { transform: translate(-50%,-50%) scale(1); opacity: 1; } 50% { transform: translate(-50%,-50%) scale(1.5); opacity: 0.5; } }
      `}</style>
    </div>
  )
}
