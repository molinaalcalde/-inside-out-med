"use client"

import { useEffect, useRef, useState, useCallback } from "react"

// ── Shared Scores type (exported for page.tsx) ─────────────────────
export interface Scores {
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

// ── Oval zone definitions (proportional to oval ellipse) ──────────
const OVAL_ZONES = {
  forehead:   { y1: -0.85, y2: -0.3,  x1: -0.5,  x2:  0.5  },
  leftCheek:  { y1: -0.05, y2:  0.45, x1:  0.15, x2:  0.88 },
  rightCheek: { y1: -0.05, y2:  0.45, x1: -0.88, x2: -0.15 },
  nose:       { y1: -0.15, y2:  0.35, x1: -0.2,  x2:  0.2  },
  chin:       { y1:  0.35, y2:  0.78, x1: -0.42, x2:  0.42 },
} as const

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

function accumulate(a: ZoneAccum, m: ZoneMetrics) {
  a.sumLum += m.avgLum; a.sumR += m.avgR; a.sumG += m.avgG; a.sumB += m.avgB
  a.sumContrast += m.localContrast; a.sumStdDev += m.stdDev
  a.redPix += m.redPixels; a.totalPix += m.total; a.n++
}

function clamp(v: number, lo: number, hi: number) { return Math.max(lo, Math.min(hi, v)) }

function computeScores(acc: Record<string, ZoneAccum>): Scores | null {
  const { forehead, leftCheek, rightCheek, nose, chin } = acc
  if (!forehead.n || !leftCheek.n || !rightCheek.n || !nose.n || !chin.n) return null

  const avg = (a: ZoneAccum, f: 'sumLum'|'sumR'|'sumG'|'sumB'|'sumContrast'|'sumStdDev') => a[f] / a.n

  const avgLumSkin  = (avg(forehead,'sumLum')  + avg(leftCheek,'sumLum')  + avg(rightCheek,'sumLum')  + avg(nose,'sumLum')  + avg(chin,'sumLum'))  / 5
  const avgRSkin    = (avg(forehead,'sumR')     + avg(leftCheek,'sumR')    + avg(rightCheek,'sumR')    + avg(nose,'sumR')    + avg(chin,'sumR'))    / 5
  const avgGSkin    = (avg(forehead,'sumG')     + avg(leftCheek,'sumG')    + avg(rightCheek,'sumG')    + avg(nose,'sumG')    + avg(chin,'sumG'))    / 5
  const avgBSkin    = (avg(forehead,'sumB')     + avg(leftCheek,'sumB')    + avg(rightCheek,'sumB')    + avg(nose,'sumB')    + avg(chin,'sumB'))    / 5
  const avgContrast = (avg(forehead,'sumContrast') + avg(leftCheek,'sumContrast') + avg(rightCheek,'sumContrast')) / 3
  const avgStdDev   = (avg(forehead,'sumStdDev')   + avg(leftCheek,'sumStdDev')   + avg(rightCheek,'sumStdDev'))   / 3
  const redRatio    = (forehead.redPix + leftCheek.redPix + rightCheek.redPix + nose.redPix + chin.redPix) /
                      (forehead.totalPix + leftCheek.totalPix + rightCheek.totalPix + nose.totalPix + chin.totalPix)

  const hydration    = clamp(Math.round((avgLumSkin/210)*100 - avgStdDev*0.1 + (Math.random()-0.5)*5), 40, 98)
  const inflammation = clamp(Math.round(redRatio*350 + (avgRSkin-avgGSkin)*0.15 + (Math.random()-0.5)*6), 5, 62)
  const elasticity   = clamp(Math.round(100 - avgContrast*1.6 - avgStdDev*0.12 + (Math.random()-0.5)*6), 40, 97)
  const melanin      = clamp(Math.round(((avgRSkin-avgGSkin)/(avgGSkin+1))*110 + 35 + (Math.random()-0.5)*8), 25, 82)
  const oxidation    = clamp(Math.round((avgRSkin-avgBSkin)*0.2 + (40-avgLumSkin*0.1) + (Math.random()-0.5)*6), 5, 60)
  const texture      = clamp(Math.round(100 - avg(forehead,'sumContrast')*2.0 + (Math.random()-0.5)*5), 35, 96)
  const luminosity   = clamp(Math.round((avgLumSkin/195)*100 + (Math.random()-0.5)*4), 38, 96)
  const overall      = clamp(Math.round(hydration*0.20 + (100-inflammation)*0.20 + elasticity*0.18 + (100-oxidation)*0.14 + texture*0.14 + luminosity*0.14), 35, 96)

  const zoneScore = (a: ZoneAccum) =>
    Math.round((clamp(Math.round(avg(a,'sumLum')/200*100), 20, 100) + clamp(Math.round(100-(a.redPix/a.totalPix)*400), 30, 100)) / 2)

  return {
    overall, hydration, inflammation, elasticity, melanin, oxidation, texture, luminosity,
    ageApparent: clamp(26 + Math.round((100-overall)*0.2 + (100-elasticity)*0.1), 17, 60),
    zoneScores: {
      forehead: zoneScore(forehead), leftCheek: zoneScore(leftCheek),
      rightCheek: zoneScore(rightCheek), nose: zoneScore(nose), chin: zoneScore(chin),
    }
  }
}

// ── Pixel sampling from oval zone ─────────────────────────────────
function sampleOvalZone(
  ctx: CanvasRenderingContext2D,
  vCx: number, vCy: number, vRx: number, vRy: number,
  zone: { x1: number; x2: number; y1: number; y2: number }
): ZoneMetrics | null {
  const x = Math.max(0, Math.round(vCx + vRx * zone.x1))
  const y = Math.max(0, Math.round(vCy + vRy * zone.y1))
  const w = Math.round(vRx * (zone.x2 - zone.x1))
  const h = Math.round(vRy * (zone.y2 - zone.y1))
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

// ── Canvas helpers ────────────────────────────────────────────────
function ovalParams(W: number, H: number) {
  return { cx: W / 2, cy: H * 0.42, rx: W * 0.30, ry: H * 0.37 }
}

function drawOval(
  ctx: CanvasRenderingContext2D,
  W: number,
  H: number,
  state: "neutral" | "warning" | "success",
  pulse: number
) {
  const { cx, cy, rx, ry } = ovalParams(W, H)

  ctx.save()
  // Dark vignette outside oval
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
    ctx.shadowColor = "rgba(126,203,161,0.9)"
    ctx.shadowBlur  = 22 + pulse * 14
  } else if (state === "warning") {
    ctx.shadowColor = "rgba(212,175,136,0.5)"
    ctx.shadowBlur  = 10
  }

  ctx.beginPath()
  ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2)
  ctx.strokeStyle = color
  ctx.lineWidth   = state === "success" ? 2.5 : 2
  ctx.setLineDash(state === "success" ? [] : [8, 5])
  ctx.stroke()
  ctx.shadowBlur = 0
  ctx.setLineDash([])

  // Corner brackets
  const bLen = 20
  const bX   = cx - rx - 10; const bX2 = cx + rx + 10
  const bY   = cy - ry - 10; const bY2 = cy + ry + 10
  const bCol = state === "success" ? "rgba(126,203,161,0.95)" : state === "warning" ? "rgba(212,175,136,0.8)" : "rgba(245,237,232,0.45)"
  ctx.strokeStyle = bCol; ctx.lineWidth = 2.5; ctx.lineCap = "round"
  ctx.beginPath(); ctx.moveTo(bX, bY + bLen); ctx.lineTo(bX, bY); ctx.lineTo(bX + bLen, bY); ctx.stroke()
  ctx.beginPath(); ctx.moveTo(bX2 - bLen, bY); ctx.lineTo(bX2, bY); ctx.lineTo(bX2, bY + bLen); ctx.stroke()
  ctx.beginPath(); ctx.moveTo(bX, bY2 - bLen); ctx.lineTo(bX, bY2); ctx.lineTo(bX + bLen, bY2); ctx.stroke()
  ctx.beginPath(); ctx.moveTo(bX2 - bLen, bY2); ctx.lineTo(bX2, bY2); ctx.lineTo(bX2, bY2 - bLen); ctx.stroke()

  ctx.restore()

  // Ambient glow
  if (state === "success") {
    const gAlpha = 0.18 + pulse * 0.14
    const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.max(rx, ry) + 60)
    g.addColorStop(0, `rgba(126,203,161,${gAlpha * 0.2})`)
    g.addColorStop(1, "rgba(126,203,161,0)")
    ctx.save(); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H); ctx.restore()
  }
}

// Scan line sweeping across the oval
function drawScanLine(
  ctx: CanvasRenderingContext2D,
  W: number,
  H: number,
  scanY: number,  // 0-1 within oval vertical range
  alpha: number
) {
  const { cx, cy, rx, ry } = ovalParams(W, H)
  const y = cy - ry + scanY * ry * 2

  // Clip to oval
  ctx.save()
  ctx.beginPath()
  ctx.ellipse(cx, cy, rx - 2, ry - 2, 0, 0, Math.PI * 2)
  ctx.clip()

  // Beam gradient
  const beam = ctx.createLinearGradient(0, y - 28, 0, y + 8)
  beam.addColorStop(0,   `rgba(126,203,161,0)`)
  beam.addColorStop(0.6, `rgba(126,203,161,${alpha * 0.18})`)
  beam.addColorStop(1,   `rgba(126,203,161,${alpha * 0.55})`)
  ctx.fillStyle = beam
  ctx.fillRect(cx - rx, y - 28, rx * 2, 36)

  // Main line
  ctx.beginPath()
  ctx.moveTo(cx - rx, y)
  ctx.lineTo(cx + rx, y)
  const lineGrad = ctx.createLinearGradient(cx - rx, y, cx + rx, y)
  lineGrad.addColorStop(0,   "rgba(126,203,161,0)")
  lineGrad.addColorStop(0.2, `rgba(126,203,161,${alpha * 0.85})`)
  lineGrad.addColorStop(0.5, `rgba(180,240,210,${alpha})`)
  lineGrad.addColorStop(0.8, `rgba(126,203,161,${alpha * 0.85})`)
  lineGrad.addColorStop(1,   "rgba(126,203,161,0)")
  ctx.strokeStyle = lineGrad
  ctx.lineWidth   = 1.5
  ctx.stroke()

  ctx.restore()
}

function drawCountdownRing(
  ctx: CanvasRenderingContext2D,
  W: number,
  H: number,
  secondsLeft: number,
  progress: number  // 0-1, progress within current second
) {
  const { cx, cy } = ovalParams(W, H)

  ctx.save()
  const totalProgress = 1 - (secondsLeft - (1 - progress)) / 3  // 0 at start, 1 at end of 3s
  ctx.beginPath()
  ctx.arc(cx, cy - 12, 28, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * totalProgress)
  ctx.strokeStyle = "rgba(126,203,161,0.8)"
  ctx.lineWidth   = 3
  ctx.stroke()

  if (secondsLeft > 0) {
    ctx.font        = `bold 38px -apple-system, sans-serif`
    ctx.fillStyle   = "rgba(126,203,161,0.95)"
    ctx.textAlign   = "center"
    ctx.textBaseline = "middle"
    ctx.shadowColor  = "rgba(126,203,161,0.7)"
    ctx.shadowBlur   = 16
    ctx.fillText(String(secondsLeft), cx, cy - 12)
  }
  ctx.restore()
}

// ── Props ─────────────────────────────────────────────────────────
interface CameraStageProps {
  onCapture: (dataUrl: string, scores: Scores) => void
  onCancel: () => void
  onScanError?: (reason: string) => void
}

type Phase = "init" | "stabilizing" | "countdown" | "done" | "error"

export function CameraStage({ onCapture, onCancel, onScanError }: CameraStageProps) {
  const videoRef     = useRef<HTMLVideoElement>(null)
  const canvasRef    = useRef<HTMLCanvasElement>(null)
  const streamRef    = useRef<MediaStream | null>(null)
  const rafRef       = useRef<number>(0)
  const frameRef     = useRef(0)
  const pulseRef     = useRef(0)
  const capturedRef  = useRef(false)
  const offscreenRef = useRef<HTMLCanvasElement | null>(null)
  const accumRef     = useRef<Record<string, ZoneAccum>>({
    forehead: freshAccum(), leftCheek: freshAccum(), rightCheek: freshAccum(),
    nose: freshAccum(), chin: freshAccum(),
  })
  const phaseStartRef = useRef(0)

  const [phase, setPhase]         = useState<Phase>("init")
  const [guidance, setGuidance]   = useState<{ msg: string; sub: string; type: "neutral" | "warning" | "success" }>({ msg: "Iniciando cámara…", sub: "", type: "neutral" })
  const [countdown, setCountdown] = useState<number | null>(null)
  const [camError, setCamError]   = useState<string | null>(null)

  const guidanceRef = useRef({ msg: "", sub: "", type: "neutral" as "neutral" | "warning" | "success" })
  function updateGuidance(msg: string, sub: string, type: "neutral" | "warning" | "success") {
    if (guidanceRef.current.msg !== msg || guidanceRef.current.type !== type) {
      guidanceRef.current = { msg, sub, type }
      setGuidance({ msg, sub, type })
    }
  }

  // ── Camera init ────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false

    async function init() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 720 } },
        })
        if (cancelled) { stream.getTracks().forEach(t => t.stop()); return }
        streamRef.current = stream
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          await videoRef.current.play()
        }
        phaseStartRef.current = Date.now()
        setPhase("stabilizing")
      } catch {
        if (!cancelled) setCamError("No se pudo acceder a la cámara. Verifica los permisos.")
      }
    }

    init()
    return () => {
      cancelled = true
      streamRef.current?.getTracks().forEach(t => t.stop())
      cancelAnimationFrame(rafRef.current)
    }
  }, [])

  // ── Capture logic ──────────────────────────────────────────────
  const doCapture = useCallback(() => {
    const video = videoRef.current
    if (!video) return

    const scores = computeScores(accumRef.current)

    // Capture mirrored image for display
    const canvas = document.createElement("canvas")
    canvas.width  = video.videoWidth  || 640
    canvas.height = video.videoHeight || 480
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
  }, [onCapture, onScanError])

  // ── Main animation loop ────────────────────────────────────────
  useEffect(() => {
    if (phase !== "stabilizing" && phase !== "countdown") return

    let countdownStart = 0
    const STABILIZE_MS = 1500
    const COUNTDOWN_MS = 3000

    function loop() {
      rafRef.current = requestAnimationFrame(loop)
      frameRef.current++

      const video  = videoRef.current
      const canvas = canvasRef.current
      if (!canvas || !video || video.readyState < 2) return

      const W = canvas.clientWidth
      const H = canvas.clientHeight
      if (canvas.width !== W || canvas.height !== H) { canvas.width = W; canvas.height = H }

      const ctx = canvas.getContext("2d")
      if (!ctx) return
      ctx.clearRect(0, 0, W, H)

      pulseRef.current = (Math.sin(Date.now() / 750) + 1) / 2
      const now = Date.now()

      // ── STABILIZING ─────────────────────────────────────────────
      if (phase === "stabilizing") {
        drawOval(ctx, W, H, "neutral", pulseRef.current * 0.5)
        updateGuidance("Centra tu rostro en el óvalo", "Mantén la cámara estable", "neutral")

        if (now - phaseStartRef.current > STABILIZE_MS) {
          // Brightness check — sample the entire oval region, not just center
          const { cx, cy, rx, ry } = ovalParams(W, H)
          const tmpC = document.createElement("canvas")
          tmpC.width = 120; tmpC.height = 160
          const tc = tmpC.getContext("2d")!
          const sx = (video.videoWidth || 640) / W
          const sy = (video.videoHeight || 480) / H
          // Sample a larger area covering the face oval
          const vx = (cx - rx * 0.6) * sx, vy = (cy - ry * 0.5) * sy
          const vw = rx * 1.2 * sx, vh = ry * 1.0 * sy
          tc.drawImage(video, vx, vy, vw, vh, 0, 0, 120, 160)
          const pd = tc.getImageData(0, 0, 120, 160).data
          let sum = 0
          for (let i = 0; i < pd.length; i += 4)
            sum += 0.299 * pd[i] + 0.587 * pd[i+1] + 0.114 * pd[i+2]
          const avgLum = sum / (120 * 160)

          // Needs meaningful light: at least lum 65/255 (~25% brightness)
          // Also reject overexposed (> 230) as blown out
          if (avgLum < 65) {
            updateGuidance("Necesitas más luz", "Busca una ventana o enciende una lámpara", "warning")
            drawOval(ctx, W, H, "warning", 0)
            phaseStartRef.current = now - 1200
            return
          }
          if (avgLum > 230) {
            updateGuidance("Demasiada luz directa", "Aléjate de la fuente de luz", "warning")
            drawOval(ctx, W, H, "warning", 0)
            phaseStartRef.current = now - 1200
            return
          }

          // Good light → start countdown
          accumRef.current = {
            forehead: freshAccum(), leftCheek: freshAccum(), rightCheek: freshAccum(),
            nose: freshAccum(), chin: freshAccum(),
          }
          setPhase("countdown")
          return
        }
        return
      }

      // ── COUNTDOWN ───────────────────────────────────────────────
      if (phase === "countdown") {
        if (countdownStart === 0) countdownStart = now

        const elapsed   = now - countdownStart
        const remaining = Math.max(0, COUNTDOWN_MS - elapsed)
        const secLeft   = Math.ceil(remaining / 1000)

        // Brightness sanity check every 18 frames during countdown
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
            // Too dark mid-scan → restart stabilizing
            capturedRef.current = false
            accumRef.current = { forehead: freshAccum(), leftCheek: freshAccum(), rightCheek: freshAccum(), nose: freshAccum(), chin: freshAccum() }
            phaseStartRef.current = Date.now()
            setPhase("stabilizing")
            return
          }
        }

        // Sample pixels every 6 frames
        if (frameRef.current % 6 === 0 && !capturedRef.current) {
          if (!offscreenRef.current) offscreenRef.current = document.createElement("canvas")
          const off = offscreenRef.current
          off.width  = video.videoWidth  || 640
          off.height = video.videoHeight || 480
          const oc   = off.getContext("2d")!
          oc.drawImage(video, 0, 0) // raw, no flip

          // Map oval from canvas display to video frame
          const { cx, cy, rx, ry } = ovalParams(W, H)
          const sx = off.width / W, sy = off.height / H
          const vCx = cx * sx, vCy = cy * sy
          const vRx = rx * sx, vRy = ry * sy

          for (const [zoneName, zone] of Object.entries(OVAL_ZONES)) {
            const m = sampleOvalZone(oc, vCx, vCy, vRx, vRy, zone)
            if (m) accumulate(accumRef.current[zoneName], m)
          }
        }

        // Draw
        const scanY = (elapsed % 1200) / 1200
        drawOval(ctx, W, H, "success", pulseRef.current)
        drawScanLine(ctx, W, H, scanY, 0.7 + pulseRef.current * 0.3)
        drawCountdownRing(ctx, W, H, secLeft, 1 - (remaining % 1000) / 1000)

        setCountdown(secLeft)
        updateGuidance(
          secLeft > 0 ? `Escaneando… ${secLeft}` : "Análisis completado ✓",
          "No te muevas",
          "success"
        )

        if (secLeft <= 0 && !capturedRef.current) {
          capturedRef.current = true
          cancelAnimationFrame(rafRef.current)
          doCapture()
        }
      }
    }

    rafRef.current = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(rafRef.current)
  }, [phase, doCapture]) // eslint-disable-line react-hooks/exhaustive-deps

  const manualCapture = () => {
    if (capturedRef.current) return
    capturedRef.current = true
    cancelAnimationFrame(rafRef.current)
    doCapture()
  }

  const guidanceColor = guidance.type === "success" ? "#7ecba1" : guidance.type === "warning" ? "#d4af88" : "rgba(245,237,232,0.5)"
  const guidanceIcon  = guidance.type === "success" ? "✓" : guidance.type === "warning" ? "▲" : "·"

  return (
    <div style={{ maxWidth: 400, width: "100%", textAlign: "center" }}>

      {/* Top status bar */}
      <div style={{
        marginBottom: 14, height: 28,
        display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
      }}>
        {phase === "init" && (
          <>
            <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#d4af88", animation: "pulse-dot 1s ease-in-out infinite" }} />
            <span style={{ fontSize: 11, color: "rgba(245,237,232,0.35)", letterSpacing: "0.1em" }}>Iniciando cámara…</span>
          </>
        )}
        {phase !== "init" && !camError && (
          <div style={{ display: "flex", alignItems: "center", gap: 7, transition: "all 0.3s" }}>
            <span style={{ fontSize: 13, color: guidanceColor, fontWeight: 700, transition: "color 0.3s", minWidth: 14, textAlign: "center" }}>{guidanceIcon}</span>
            <span style={{ fontSize: 13, color: guidanceColor, fontWeight: 600, transition: "color 0.3s", letterSpacing: "0.01em" }}>{guidance.msg}</span>
          </div>
        )}
        {camError && <span style={{ fontSize: 12, color: "#e8a4b0" }}>{camError}</span>}
      </div>

      {/* Camera container */}
      <div style={{
        position: "relative",
        width: "100%",
        paddingBottom: "133%",
        borderRadius: 24,
        overflow: "hidden",
        background: "#060409",
        marginBottom: 16,
        boxShadow: guidance.type === "success"
          ? "0 0 0 1.5px rgba(126,203,161,0.4), 0 0 40px rgba(126,203,161,0.18)"
          : guidance.type === "warning"
          ? "0 0 0 1.5px rgba(212,175,136,0.3), 0 0 20px rgba(212,175,136,0.1)"
          : "0 0 0 1px rgba(245,237,232,0.07)",
        transition: "box-shadow 0.5s ease",
      }}>
        {/* Video */}
        <video
          ref={videoRef}
          playsInline
          muted
          style={{
            position: "absolute", inset: 0, width: "100%", height: "100%",
            objectFit: "cover",
            transform: "scaleX(-1)",
          }}
        />

        {/* Canvas overlay */}
        <canvas
          ref={canvasRef}
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none" }}
        />

        {/* Loading overlay */}
        {phase === "init" && (
          <div style={{
            position: "absolute", inset: 0,
            background: "rgba(6,4,9,0.78)",
            display: "flex", alignItems: "center", justifyContent: "center",
            backdropFilter: "blur(4px)",
          }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 14 }}>
              <div style={{
                width: 40, height: 40, borderRadius: "50%",
                border: "2px solid rgba(245,237,232,0.1)",
                borderTop: "2px solid #e8a4b0",
                animation: "spin 1s linear infinite",
              }} />
              <span style={{ fontSize: 11, color: "rgba(245,237,232,0.35)", letterSpacing: "0.1em" }}>Iniciando…</span>
            </div>
          </div>
        )}

        {/* Sub-text at bottom */}
        {phase !== "init" && guidance.sub && (
          <div style={{
            position: "absolute", bottom: 0, left: 0, right: 0,
            padding: "28px 20px 16px",
            background: "linear-gradient(to top, rgba(6,4,9,0.9), transparent)",
            textAlign: "center",
          }}>
            <p style={{ fontSize: 11, color: "rgba(245,237,232,0.5)", letterSpacing: "0.06em" }}>
              {guidance.sub}
            </p>
          </div>
        )}
      </div>

      {/* Buttons */}
      <div style={{ display: "flex", gap: 10 }}>
        <button
          onClick={onCancel}
          style={{
            flex: 1, padding: "13px",
            background: "rgba(245,237,232,0.05)",
            border: "1px solid rgba(245,237,232,0.1)",
            borderRadius: 12, color: "rgba(245,237,232,0.5)",
            fontSize: 13, cursor: "pointer",
          }}
        >
          Cancelar
        </button>
        <button
          onClick={manualCapture}
          disabled={!!camError || phase === "init"}
          style={{
            flex: 2, padding: "13px",
            background: phase === "countdown"
              ? "linear-gradient(135deg, #5aab82, #7ecba1)"
              : "linear-gradient(135deg, #e8a4b0, #c97e8e)",
            border: "none", borderRadius: 12, color: "#fff",
            fontSize: 14, fontWeight: 700,
            cursor: (camError || phase === "init") ? "not-allowed" : "pointer",
            opacity: (camError || phase === "init") ? 0.5 : 1,
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            transition: "background 0.5s",
          }}
        >
          {countdown !== null && countdown > 0 ? (
            <>
              <span style={{ fontSize: 20, fontWeight: 800, fontFamily: "var(--font-fraunces)" }}>{countdown}</span>
              <span>Escaneando…</span>
            </>
          ) : (
            <>
              <svg width="15" height="15" viewBox="0 0 18 18" fill="none">
                <circle cx="9" cy="9" r="8" stroke="currentColor" strokeWidth="1.5" />
                <circle cx="9" cy="9" r="4" fill="currentColor" />
              </svg>
              Capturar y analizar
            </>
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
