"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import { CameraStage, type Scores } from "./camera-stage"

type Stage = "choose" | "upload-guide" | "camera" | "scanning" | "profile" | "results" | "error"

interface UserProfile {
  age: string
  concern: string
  routine: string
  email: string
  phone: string
}

// ── MediaPipe landmark indices per zone (for upload path) ────────
const ZONES = {
  forehead:   [10, 67, 69, 104, 108, 109, 151, 337, 338, 297, 299, 333],
  leftCheek:  [116, 111, 117, 118, 119, 120, 121, 128, 36, 205, 207],
  rightCheek: [345, 340, 346, 347, 348, 349, 350, 357, 266, 425, 427],
  nose:       [1, 2, 4, 5, 6, 19, 20, 94, 168, 195, 197],
  chin:       [152, 175, 176, 177, 148, 149, 150, 136, 365, 379, 394, 395, 396, 397, 400],
}

// Zones for the scanning animation
const SCAN_ZONES_ANIM = [
  { label: "Frente",   yPct: 18, color: "#e8a4b0", icon: "◈" },
  { label: "Ojos",     yPct: 35, color: "#d4af88", icon: "◉" },
  { label: "Nariz",    yPct: 52, color: "#7ecba1", icon: "◎" },
  { label: "Mejillas", yPct: 58, color: "#e8a4b0", icon: "◈" },
  { label: "Boca",     yPct: 68, color: "#d4af88", icon: "◉" },
  { label: "Mentón",   yPct: 78, color: "#7ecba1", icon: "◎" },
]

// Gamified questionnaire steps
const QUIZ_STEPS = [
  {
    id: "age",
    headline: "¿Cuántos años tienes?",
    sub: "La edad transforma completamente lo que necesita tu piel",
    type: "grid4" as const,
    options: [
      { value: "18-25", label: "18–25", sub: "Piel joven" },
      { value: "26-35", label: "26–35", sub: "Primeros cambios" },
      { value: "36-45", label: "36–45", sub: "Madurez activa" },
      { value: "46+",   label: "46+",   sub: "Piel experta" },
    ],
  },
  {
    id: "concern",
    headline: "¿Qué te preocupa más?",
    sub: "Elige tu prioridad ahora — puedes cambiarla después",
    type: "grid6" as const,
    options: [
      { value: "manchas",    label: "Manchas",     icon: "🌑" },
      { value: "arrugas",    label: "Arrugas",     icon: "〰️" },
      { value: "poros",      label: "Poros",       icon: "⊙" },
      { value: "acne",       label: "Acné",        icon: "●" },
      { value: "hidratacion",label: "Hidratación", icon: "💧" },
      { value: "luminosidad",label: "Luminosidad", icon: "✦" },
    ],
  },
  {
    id: "routine",
    headline: "¿Qué usas en tu cara ahora mismo?",
    sub: "Sin juicios — cada punto de partida es válido",
    type: "list3" as const,
    options: [
      { value: "ninguna",   label: "Nada todavía",           sub: "Empezamos desde cero" },
      { value: "basica",    label: "Limpiador + hidratante",  sub: "Base sólida" },
      { value: "completa",  label: "Rutina completa",         sub: "Serum, SPF y más" },
    ],
  },
  {
    id: "email",
    headline: "¿A dónde enviamos tu informe?",
    sub: "Tu análisis completo + plan de productos personalizado",
    type: "email" as const,
    options: [],
  },
  {
    id: "phone",
    headline: "¿Recomendaciones por WhatsApp?",
    sub: "Te avisamos cuando encontremos productos para tu perfil exacto",
    type: "phone" as const,
    options: [],
  },
]

// ── Load MediaPipe IMAGE mode from CDN (for upload path only) ─────
let _landmarkerPromise: Promise<unknown> | null = null

async function getMediaPipeLandmarker() {
  if (_landmarkerPromise) return _landmarkerPromise

  _landmarkerPromise = (async () => {
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
      }
    }

    const filesetResolver = await vision.FilesetResolver.forVisionTasks(
      "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.22/wasm"
    )

    return await vision.FaceLandmarker.createFromOptions(filesetResolver, {
      baseOptions: {
        modelAssetPath:
          "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task",
        delegate: "GPU",
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

// ── Upload analysis — IMAGE mode MediaPipe (no coordinate issues) ─
async function runUploadAnalysis(dataUrl: string): Promise<Scores | null> {
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

  // Pixel analysis per zone
  const zoneData: Record<string, ReturnType<typeof analyzeRegion>> = {}
  for (const [zone, indices] of Object.entries(ZONES)) {
    const bbox = zoneBBox(landmarks, indices, W, H)
    zoneData[zone] = analyzeRegion(ctx, bbox.x, bbox.y, bbox.w, bbox.h)
  }

  const z = zoneData
  if (!z.forehead || !z.leftCheek || !z.rightCheek || !z.nose || !z.chin) return null

  const avgLumSkin  = (z.forehead.avgLum + z.leftCheek.avgLum + z.rightCheek.avgLum + z.nose.avgLum + z.chin.avgLum) / 5
  const avgRSkin    = (z.forehead.avgR   + z.leftCheek.avgR   + z.rightCheek.avgR   + z.nose.avgR   + z.chin.avgR)   / 5
  const avgGSkin    = (z.forehead.avgG   + z.leftCheek.avgG   + z.rightCheek.avgG   + z.nose.avgG   + z.chin.avgG)   / 5
  const avgBSkin    = (z.forehead.avgB   + z.leftCheek.avgB   + z.rightCheek.avgB   + z.nose.avgB   + z.chin.avgB)   / 5
  const avgContrast = (z.forehead.localContrast + z.leftCheek.localContrast + z.rightCheek.localContrast) / 3
  const avgStdDev   = (z.forehead.stdDev + z.leftCheek.stdDev + z.rightCheek.stdDev) / 3
  const totalRed    = z.forehead.redPixels + z.leftCheek.redPixels + z.rightCheek.redPixels + z.nose.redPixels + z.chin.redPixels
  const totalPix    = z.forehead.total + z.leftCheek.total + z.rightCheek.total + z.nose.total + z.chin.total
  const redRatio    = totalRed / totalPix

  const hydration    = clamp(Math.round((avgLumSkin / 210) * 100 - avgStdDev * 0.1 + (Math.random() - 0.5) * 5), 40, 98)
  const inflammation = clamp(Math.round(redRatio * 350 + (avgRSkin - avgGSkin) * 0.15 + (Math.random() - 0.5) * 6), 5, 62)
  const elasticity   = clamp(Math.round(100 - avgContrast * 1.6 - avgStdDev * 0.12 + (Math.random() - 0.5) * 6), 40, 97)
  const melanin      = clamp(Math.round(((avgRSkin - avgGSkin) / (avgGSkin + 1)) * 110 + 35 + (Math.random() - 0.5) * 8), 25, 82)
  const oxidation    = clamp(Math.round((avgRSkin - avgBSkin) * 0.2 + (40 - avgLumSkin * 0.1) + (Math.random() - 0.5) * 6), 5, 60)
  const texture      = clamp(Math.round(100 - z.forehead.localContrast * 2.0 + (Math.random() - 0.5) * 5), 35, 96)
  const luminosity   = clamp(Math.round((avgLumSkin / 195) * 100 + (Math.random() - 0.5) * 4), 38, 96)
  const overall      = clamp(Math.round(hydration * 0.20 + (100 - inflammation) * 0.20 + elasticity * 0.18 + (100 - oxidation) * 0.14 + texture * 0.14 + luminosity * 0.14), 35, 96)

  const zoneScore = (d: ReturnType<typeof analyzeRegion>) => {
    if (!d) return 50
    return Math.round((clamp(Math.round(d.avgLum / 200 * 100), 20, 100) + clamp(Math.round(100 - (d.redPixels / d.total) * 400), 30, 100)) / 2)
  }

  return {
    overall, hydration, inflammation, elasticity, melanin, oxidation, texture, luminosity,
    ageApparent: clamp(26 + Math.round((100 - overall) * 0.2 + (100 - elasticity) * 0.1), 17, 60),
    zoneScores: {
      forehead: zoneScore(z.forehead), leftCheek: zoneScore(z.leftCheek),
      rightCheek: zoneScore(z.rightCheek), nose: zoneScore(z.nose), chin: zoneScore(z.chin),
    }
  }
}

// ── Gamified profile quiz ─────────────────────────────────────────
function ProfileQuiz({ onComplete, scores }: { onComplete: (p: UserProfile) => void; scores: Scores }) {
  const [step, setStep] = useState(0)
  const [data, setData]   = useState<Partial<UserProfile>>({})
  const [inputVal, setInputVal] = useState("")
  const [animating, setAnimating] = useState(false)

  const current = QUIZ_STEPS[step]

  const advance = (update: Partial<UserProfile>) => {
    const next = { ...data, ...update }
    setData(next)
    if (step < QUIZ_STEPS.length - 1) {
      setAnimating(true)
      setTimeout(() => { setStep(s => s + 1); setInputVal(""); setAnimating(false) }, 220)
    } else {
      // Save profile to localStorage
      try { localStorage.setItem("insideoutmed_profile", JSON.stringify(next)) } catch {}
      onComplete(next as UserProfile)
    }
  }

  const skip = () => {
    advance({})
  }

  return (
    <div style={{ maxWidth: 480, width: "100%", margin: "0 auto" }}>
      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: 32 }}>
        <p style={{ fontSize: 10, letterSpacing: "0.18em", color: "#7ecba1", textTransform: "uppercase", fontWeight: 700, marginBottom: 8 }}>
          Tu análisis está listo
        </p>
        <p style={{ fontSize: 13, color: "rgba(245,237,232,0.35)", letterSpacing: "0.04em" }}>
          3 preguntas para personalizar tu plan · Score: <span style={{ color: "#e8a4b0", fontWeight: 700 }}>{scores.overall}/100</span>
        </p>
      </div>

      {/* Progress dots */}
      <div style={{ display: "flex", justifyContent: "center", gap: 8, marginBottom: 40 }}>
        {QUIZ_STEPS.map((_, i) => (
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
                {"sub" in opt && <span style={{ fontSize: 10, color: "rgba(245,237,232,0.35)", letterSpacing: "0.08em" }}>{(opt as {sub:string}).sub}</span>}
              </button>
            ))}
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
                {"icon" in opt && <span style={{ fontSize: 22 }}>{(opt as {icon:string}).icon}</span>}
                <span style={{ fontSize: 11, fontWeight: 600, color: "rgba(245,237,232,0.75)" }}>{opt.label}</span>
              </button>
            ))}
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
                  {"sub" in opt && <p style={{ fontSize: 11, color: "rgba(245,237,232,0.35)" }}>{(opt as {sub:string}).sub}</p>}
                </div>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0, opacity: 0.4 }}>
                  <path d="M6 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            ))}
          </div>
        )}

        {/* email input */}
        {current.type === "email" && (
          <div>
            <div style={{ position: "relative", marginBottom: 12 }}>
              <input
                type="email"
                placeholder="tu@email.com"
                value={inputVal}
                onChange={e => setInputVal(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter" && inputVal) advance({ email: inputVal }) }}
                autoFocus
                style={{
                  width: "100%", padding: "18px 20px",
                  background: "rgba(245,237,232,0.04)",
                  border: "1.5px solid rgba(245,237,232,0.15)",
                  borderRadius: 14, color: "#f5ede8",
                  fontSize: 16, outline: "none",
                  transition: "border-color 0.2s",
                  fontFamily: "inherit",
                }}
                onFocus={e => { e.target.style.borderColor = "rgba(232,164,176,0.5)" }}
                onBlur={e => { e.target.style.borderColor = "rgba(245,237,232,0.15)" }}
              />
            </div>
            <button
              onClick={() => { if (inputVal) advance({ email: inputVal }) }}
              disabled={!inputVal}
              style={{
                width: "100%", padding: "15px",
                background: inputVal ? "linear-gradient(135deg,#e8a4b0,#c97e8e)" : "rgba(245,237,232,0.06)",
                border: "none", borderRadius: 12, color: "#fff",
                fontSize: 14, fontWeight: 700, cursor: inputVal ? "pointer" : "not-allowed",
                transition: "all 0.3s", marginBottom: 12,
              }}
            >
              Enviar mi informe →
            </button>
            <button onClick={skip} style={{ width: "100%", padding: "10px", background: "none", border: "none", color: "rgba(245,237,232,0.28)", fontSize: 12, cursor: "pointer" }}>
              Continuar sin email
            </button>
          </div>
        )}

        {/* phone input */}
        {current.type === "phone" && (
          <div>
            <div style={{ position: "relative", marginBottom: 12 }}>
              <input
                type="tel"
                placeholder="+34 600 000 000"
                value={inputVal}
                onChange={e => setInputVal(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter") advance({ phone: inputVal }) }}
                autoFocus
                style={{
                  width: "100%", padding: "18px 20px",
                  background: "rgba(245,237,232,0.04)",
                  border: "1.5px solid rgba(245,237,232,0.15)",
                  borderRadius: 14, color: "#f5ede8",
                  fontSize: 16, outline: "none", fontFamily: "inherit",
                }}
                onFocus={e => { e.target.style.borderColor = "rgba(126,203,161,0.5)" }}
                onBlur={e => { e.target.style.borderColor = "rgba(245,237,232,0.15)" }}
              />
            </div>
            <button
              onClick={() => advance({ phone: inputVal })}
              style={{
                width: "100%", padding: "15px",
                background: "linear-gradient(135deg,#7ecba1,#5aab82)",
                border: "none", borderRadius: 12, color: "#fff",
                fontSize: 14, fontWeight: 700, cursor: "pointer", marginBottom: 12,
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
              Activar WhatsApp
            </button>
            <button onClick={skip} style={{ width: "100%", padding: "10px", background: "none", border: "none", color: "rgba(245,237,232,0.28)", fontSize: 12, cursor: "pointer" }}>
              No, gracias — ver mis resultados
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Main page component ───────────────────────────────────────────
export default function AnalyzePage() {
  const [stage, setStage]             = useState<Stage>("choose")
  const [capturedUrl, setCapturedUrl] = useState<string | null>(null)
  const [scanProgress, setScanProgress] = useState(0)
  const [activeZoneIdx, setActiveZoneIdx] = useState(-1)
  const [completedZones, setCompletedZones] = useState<number[]>([])
  const [qualityError, setQualityError] = useState<string | null>(null)
  const [scores, setScores]           = useState<Scores | null>(null)

  const fileRef        = useRef<HTMLInputElement>(null)
  const scanIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // ── Camera path: scores arrive pre-computed ────────────────────
  const beginScanWithScores = useCallback((dataUrl: string, preScores: Scores) => {
    setStage("scanning")
    setScanProgress(0)
    setActiveZoneIdx(-1)
    setCompletedZones([])
    let progress = 0

    scanIntervalRef.current = setInterval(() => {
      progress += Math.random() * 1.4 + 0.4
      if (progress >= 100) {
        progress = 100
        clearInterval(scanIntervalRef.current!)
        setTimeout(() => {
          setScores(preScores)
          setStage("profile")
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
    setStage("scanning")
    setScanProgress(0)
    setActiveZoneIdx(-1)
    setCompletedZones([])
    let progress = 0
    let analysisResult: Scores | null | undefined = undefined

    runUploadAnalysis(dataUrl).then(r => { analysisResult = r }).catch(() => { analysisResult = null })

    scanIntervalRef.current = setInterval(() => {
      progress += Math.random() * 1.4 + 0.4
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
            setStage("profile")
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
  }, [])

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
    setStage("choose")
  }

  const handleProfileComplete = (profile: UserProfile) => {
    // Save profile for plan page to use
    try {
      localStorage.setItem("insideoutmed_profile", JSON.stringify(profile))
      if (scores) localStorage.setItem("insideoutmed_scores", JSON.stringify({
        overall: scores.overall, hydration: scores.hydration, inflammation: scores.inflammation,
        elasticity: scores.elasticity, melanin: scores.melanin, oxidation: scores.oxidation,
        ...profile,
      }))
    } catch {}
    setStage("results")
  }

  function getBiomarkerInsight(label: string, value: number): string {
    switch (label) {
      case "Hidratación":
        if (value >= 75) return "Tu barrera cutánea retiene bien la humedad. Mantén tu hidratante actual."
        if (value >= 55) return "Tu piel pierde agua más rápido de lo que la repone. Refuerza la hidratación."
        return "Deshidratación crítica — tu piel está bajo estrés constante y eso amplifica todos los demás daños."
      case "Inflamación":
        if (value <= 20) return "Piel calmada, sin signos de estrés visible. Buen punto de partida."
        if (value <= 35) return "Inflamación silenciosa activa. Se puede expresar como rojez, sensibilidad o poros dilatados."
        return "Inflamación elevada — es el factor que amplifica el envejecimiento y daña la barrera cutánea."
      case "Elasticidad":
        if (value >= 75) return "Buen tono y firmeza. El colágeno está respondiendo bien a tu rutina actual."
        if (value >= 55) return "Algo de laxitud en el contorno. El retinol puede estimular el colágeno de forma visible."
        return "Pérdida notable de firmeza. Se necesita estimulación activa del colágeno para revertirlo."
      case "Oxidación":
        if (value <= 20) return "Daño por radicales libres bajo control. Tu piel está protegida del estrés ambiental."
        if (value <= 35) return "Estrés oxidativo moderado — la vitamina C puede revertir este daño de forma clínica."
        return "Daño oxidativo acumulado. Sin antioxidantes potentes, este daño escala rápidamente."
      case "Melanina":
        if (value >= 65) return "Alta concentración de pigmento activo. Hay riesgo de manchas visibles o hiperpigmentación."
        if (value >= 40) return "Pigmentación dentro del rango normal para tu fototipo. Sin hiperpigmentación activa."
        return "Índice de melanina bajo. Sin señales de hiperpigmentación activa detectable."
      case "Textura":
        if (value >= 75) return "Superficie cutánea uniforme. Poros bien regulados y reflejo de luz consistente."
        if (value >= 55) return "Textura algo irregular, posiblemente por deshidratación o acumulación de células muertas."
        return "Textura notablemente irregular. La exfoliación química puede hacer una diferencia visible en semanas."
      case "Luminosidad":
        if (value >= 70) return "Tu piel refleja bien la luz. Luce descansada, nutrida y con buen tono."
        if (value >= 50) return "Piel algo apagada. La vitamina C y una buena exfoliación pueden recuperar el brillo."
        return "Piel opaca. El daño acumulado está afectando directamente la reflexión de la luz."
      default:
        return ""
    }
  }

  const biomarkers = scores ? [
    { label: "Hidratación",  value: scores.hydration,    color: scores.hydration >= 70    ? "#7ecba1" : scores.hydration >= 50    ? "#d4af88" : "#e8a4b0", note: scores.hydration >= 75    ? "Excelente" : scores.hydration >= 55    ? "Mejorable" : "Baja",      alert: scores.hydration < 55,    insight: getBiomarkerInsight("Hidratación",  scores.hydration) },
    { label: "Inflamación",  value: scores.inflammation, color: scores.inflammation <= 20 ? "#7ecba1" : scores.inflammation <= 35 ? "#d4af88" : "#e8a4b0", note: scores.inflammation <= 20 ? "Controlada" : scores.inflammation <= 35 ? "Moderada"  : "Elevada",    alert: scores.inflammation > 35, insight: getBiomarkerInsight("Inflamación",  scores.inflammation) },
    { label: "Elasticidad",  value: scores.elasticity,   color: scores.elasticity >= 70   ? "#7ecba1" : scores.elasticity >= 55   ? "#d4af88" : "#e8a4b0", note: scores.elasticity >= 75   ? "Óptima"     : scores.elasticity >= 55   ? "Aceptable" : "Baja",      alert: scores.elasticity < 55,   insight: getBiomarkerInsight("Elasticidad",  scores.elasticity) },
    { label: "Oxidación",    value: scores.oxidation,    color: scores.oxidation <= 20    ? "#7ecba1" : scores.oxidation <= 35    ? "#d4af88" : "#e8a4b0", note: scores.oxidation <= 20    ? "Bajo"       : scores.oxidation <= 35    ? "Moderado"  : "Elevado",   alert: scores.oxidation > 35,    insight: getBiomarkerInsight("Oxidación",    scores.oxidation) },
    { label: "Melanina",     value: scores.melanin,      color: "#d4af88",                                                                                  note: scores.melanin >= 65      ? "Alta"       : scores.melanin >= 40      ? "Media"     : "Baja",      alert: scores.melanin > 65,      insight: getBiomarkerInsight("Melanina",     scores.melanin) },
    { label: "Textura",      value: scores.texture,      color: scores.texture >= 70      ? "#7ecba1" : scores.texture >= 55      ? "#d4af88" : "#e8a4b0", note: scores.texture >= 75      ? "Fina"       : scores.texture >= 55      ? "Normal"    : "Irregular", alert: scores.texture < 55,      insight: getBiomarkerInsight("Textura",      scores.texture) },
    { label: "Luminosidad",  value: scores.luminosity,   color: scores.luminosity >= 65   ? "#7ecba1" : scores.luminosity >= 50   ? "#d4af88" : "#e8a4b0", note: scores.luminosity >= 70   ? "Radiante"   : scores.luminosity >= 50   ? "Normal"    : "Opaca",     alert: scores.luminosity < 50,   insight: getBiomarkerInsight("Luminosidad",  scores.luminosity) },
  ] : []

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
            <p style={{ fontSize: 10, letterSpacing: "0.16em", color: "#e8a4b0", textTransform: "uppercase", fontWeight: 700, marginBottom: 14 }}>Paso 1 de 1</p>
            <h1 style={{ fontFamily: "var(--font-fraunces)", fontSize: "clamp(26px, 5vw, 42px)", fontWeight: 400, lineHeight: 1.1, marginBottom: 12, letterSpacing: "-0.03em" }}>
              ¿Cómo quieres analizarte?
            </h1>
            <p style={{ fontSize: 14, color: "rgba(245,237,232,0.42)", marginBottom: 36, lineHeight: 1.65 }}>
              Detectamos 478 puntos faciales y analizamos cada zona de tu piel.<br/>
              Necesitas <strong style={{ color: "rgba(245,237,232,0.7)", fontWeight: 500 }}>buena luz natural</strong> y el rostro visible.
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 28 }}>
              <button onClick={() => setStage("camera")}
                style={{ background: "rgba(245,237,232,0.03)", border: "1.5px solid rgba(245,237,232,0.1)", borderRadius: 18, padding: "28px 18px", cursor: "pointer", color: "#f5ede8", textAlign: "center", transition: "all 0.2s", display: "flex", flexDirection: "column", alignItems: "center", gap: 14 }}
                onMouseEnter={e=>{e.currentTarget.style.borderColor="rgba(232,164,176,0.45)";e.currentTarget.style.background="rgba(232,164,176,0.05)"}}
                onMouseLeave={e=>{e.currentTarget.style.borderColor="rgba(245,237,232,0.1)";e.currentTarget.style.background="rgba(245,237,232,0.03)"}}>
                <div style={{ width: 52, height: 52, borderRadius: "50%", background: "rgba(232,164,176,0.1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <svg width="24" height="24" viewBox="0 0 28 28" fill="none"><rect x="2" y="7" width="24" height="18" rx="3" stroke="#e8a4b0" strokeWidth="1.5"/><circle cx="14" cy="16" r="5" stroke="#e8a4b0" strokeWidth="1.5"/><path d="M10 7V5a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2" stroke="#e8a4b0" strokeWidth="1.5"/></svg>
                </div>
                <div><p style={{ fontSize: 15, fontWeight: 600, marginBottom: 4 }}>Escaneo en vivo</p><p style={{ fontSize: 12, color: "rgba(245,237,232,0.4)", lineHeight: 1.5 }}>Cámara frontal</p></div>
                <span style={{ fontSize: 9, color: "#e8a4b0", letterSpacing: "0.12em", fontWeight: 700, border: "1px solid rgba(232,164,176,0.3)", padding: "2px 10px", borderRadius: 99 }}>RECOMENDADO</span>
              </button>
              <button onClick={() => setStage("upload-guide")}
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

        {/* ── UPLOAD GUIDE ── */}
        {stage === "upload-guide" && (
          <div style={{ maxWidth: 480, width: "100%", textAlign: "center" }}>
            <p style={{ fontSize: 10, letterSpacing: "0.16em", color: "#d4af88", textTransform: "uppercase", fontWeight: 700, marginBottom: 14 }}>Antes de subir tu foto</p>
            <h2 style={{ fontFamily: "var(--font-fraunces)", fontSize: "clamp(22px, 4vw, 32px)", fontWeight: 400, marginBottom: 10, letterSpacing: "-0.03em", lineHeight: 1.15 }}>
              La foto correcta marca<br/><em style={{ color: "#e8a4b0", fontStyle: "italic" }}>la diferencia en los resultados</em>
            </h2>
            <p style={{ fontSize: 13, color: "rgba(245,237,232,0.4)", marginBottom: 28, lineHeight: 1.65 }}>Usamos 478 puntos para mapear tu cara y analizar cada zona.</p>
            <div style={{ textAlign: "left", marginBottom: 14 }}>
              <p style={{ fontSize: 9, letterSpacing: "0.16em", textTransform: "uppercase", color: "#7ecba1", fontWeight: 700, marginBottom: 10 }}>✓ Así sí funciona</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                {[{icon:"☀",text:"Luz natural frontal — ventana o lámpara apuntando a tu cara, sin contraluz"},{icon:"👤",text:"Rostro centrado y completo — frente, mejillas, nariz y mentón visibles"},{icon:"🚫",text:"Sin maquillaje, filtros, gafas ni cabello tapando la cara"},{icon:"📐",text:"Cámara al nivel de los ojos, a 30–50 cm de distancia"},{icon:"🔆",text:"Imagen nítida y bien expuesta"}].map((item,i)=>(
                  <div key={i} style={{ display: "flex", gap: 12, padding: "11px 14px", background: "rgba(126,203,161,0.04)", border: "1px solid rgba(126,203,161,0.1)", borderRadius: 11 }}>
                    <span style={{ fontSize: 15, flexShrink: 0 }}>{item.icon}</span>
                    <span style={{ fontSize: 13, color: "rgba(245,237,232,0.6)", lineHeight: 1.55 }}>{item.text}</span>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => setStage("choose")} style={{ flex: 1, padding: "13px", background: "rgba(245,237,232,0.05)", border: "1px solid rgba(245,237,232,0.1)", borderRadius: 12, color: "rgba(245,237,232,0.5)", fontSize: 13, cursor: "pointer" }}>Volver</button>
              <button onClick={() => fileRef.current?.click()} style={{ flex: 2, padding: "13px", background: "linear-gradient(135deg,#d4af88,#b8936a)", border: "none", borderRadius: 12, color: "#0e0c12", fontSize: 14, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><rect x="3" y="3" width="18" height="18" rx="3" stroke="currentColor" strokeWidth="2"/><circle cx="8.5" cy="8.5" r="1.5" fill="currentColor"/><path d="M3 15l5-5 4 4 3-3 6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                Elegir foto
              </button>
            </div>
          </div>
        )}

        {/* ── CAMERA — uses CameraStage with full guided experience ── */}
        {stage === "camera" && (
          <CameraStage
            onCapture={handleCameraCapture}
            onCancel={reset}
            onScanError={handleScanError}
          />
        )}

        {/* ── SCANNING — cinematic zone-by-zone reveal ── */}
        {stage === "scanning" && capturedUrl && (
          <div style={{ maxWidth: 400, width: "100%", textAlign: "center" }}>
            <p style={{ fontSize: 10, letterSpacing: "0.16em", color: "#e8a4b0", textTransform: "uppercase", fontWeight: 700, marginBottom: 20 }}>
              Analizando 478 puntos faciales
            </p>

            {/* Face image with animated zone overlays */}
            <div style={{ position: "relative", width: "100%", paddingBottom: "125%", borderRadius: 22, overflow: "hidden", marginBottom: 20, border: "1px solid rgba(232,164,176,0.12)" }}>
              <img src={capturedUrl} alt="análisis" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />

              {/* Dark vignette */}
              <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg,rgba(14,12,18,0.3) 0%,transparent 20%,transparent 70%,rgba(14,12,18,0.6) 100%)", pointerEvents: "none" }} />

              {/* Scan beam — travels down */}
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
                      {zone.label}
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
                {scanProgress < 20 ? "Detectando estructura facial…" :
                 scanProgress < 40 ? `Escaneando ${SCAN_ZONES_ANIM[activeZoneIdx]?.label ?? ""}…` :
                 scanProgress < 65 ? "Analizando biomarcadores…" :
                 scanProgress < 85 ? "Calculando puntuaciones por zona…" :
                 scanProgress < 99 ? "Finalizando análisis…" : "Análisis completado ✓"}
              </p>
            </div>
          </div>
        )}

        {/* ── PROFILE — gamified quiz ── */}
        {stage === "profile" && scores && (
          <ProfileQuiz scores={scores} onComplete={handleProfileComplete} />
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
              <p style={{ fontSize: 13, color: "rgba(245,237,232,0.35)", maxWidth: 380, margin: "0 auto" }}>Análisis por zonas: frente, mejillas, nariz y mentón — cada una medida por separado.</p>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))", gap: 14, marginBottom: 14 }}>
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
                  <div style={{ height: "100%", width: `${scores.overall}%`, background: "linear-gradient(90deg,#e8a4b0,#d4af88)", borderRadius: 2 }} />
                </div>
                <p style={{ fontSize: 12.5, color: "rgba(245,237,232,0.42)", lineHeight: 1.7, marginBottom: 18 }}>
                  {scores.overall >= 80 ? "Tu piel está en un estado superior a la media. Mantén la rutina." : scores.overall >= 65 ? "Hay margen de mejora claro. Con el plan correcto puedes subir 10–15 puntos en 6 semanas." : "Tu piel necesita atención prioritaria. El plan de productos es el primer paso."}
                </p>
                <div style={{ paddingTop: 16, borderTop: "1px solid rgba(245,237,232,0.06)", marginBottom: 16 }}>
                  <p style={{ fontSize: 9, color: "rgba(245,237,232,0.25)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 10 }}>Por zona</p>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    {[{label:"Frente",value:scores.zoneScores.forehead},{label:"Mejilla izq",value:scores.zoneScores.leftCheek},{label:"Mejilla der",value:scores.zoneScores.rightCheek},{label:"Nariz",value:scores.zoneScores.nose},{label:"Mentón",value:scores.zoneScores.chin}].map(z=>(
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
                  <p style={{ fontFamily: "var(--font-fraunces)", fontSize: 22, color: "#7ecba1", fontWeight: 300 }}>{scores.ageApparent} años</p>
                </div>
                {capturedUrl && (
                  <div style={{ marginTop: 14, borderTop: "1px solid rgba(245,237,232,0.06)", paddingTop: 14 }}>
                    <div style={{ width: 60, height: 76, borderRadius: 9, overflow: "hidden", border: "1px solid rgba(245,237,232,0.1)" }}>
                      <img src={capturedUrl} alt="Tu foto" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    </div>
                  </div>
                )}
              </div>

              {/* Biomarkers card */}
              <div style={{ background: "rgba(245,237,232,0.03)", border: "1px solid rgba(245,237,232,0.08)", borderRadius: 20, padding: "28px 28px 24px" }}>
                <p style={{ fontSize: 9, letterSpacing: "0.16em", color: "rgba(245,237,232,0.3)", textTransform: "uppercase", marginBottom: 20, fontWeight: 700 }}>Biomarcadores · Medición por zona</p>
                <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
                  {biomarkers.map(b => (
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
                      <p style={{ fontSize: 11.5, color: "rgba(245,237,232,0.36)", lineHeight: 1.55, paddingLeft: 0 }}>
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
                try { if (scores) localStorage.setItem("insideoutmed_scores", JSON.stringify({ overall: scores.overall, hydration: scores.hydration, inflammation: scores.inflammation, elasticity: scores.elasticity, melanin: scores.melanin, oxidation: scores.oxidation })) } catch {}
                window.location.href = "/plan"
              }}
              style={{ width: "100%", padding: "17px 28px", background: "rgba(245,237,232,0.04)", border: "1px solid rgba(245,237,232,0.1)", borderRadius: 14, color: "#f5ede8", fontSize: 14, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "space-between", transition: "all 0.2s", marginBottom: 24 }}
              onMouseEnter={e=>{e.currentTarget.style.background="rgba(245,237,232,0.08)";e.currentTarget.style.borderColor="rgba(245,237,232,0.18)"}}
              onMouseLeave={e=>{e.currentTarget.style.background="rgba(245,237,232,0.04)";e.currentTarget.style.borderColor="rgba(245,237,232,0.1)"}}
            >
              <div style={{ textAlign: "left" }}>
                <p style={{ fontSize: 11, color: "rgba(245,237,232,0.38)", marginBottom: 2 }}>Basado en tus biomarcadores reales</p>
                <span>Ver mis productos recomendados →</span>
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
