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

// ── Analysis zone landmark indices ─────────────────────────────────
const ANALYSIS_ZONES = {
  forehead:   [10, 67, 69, 104, 108, 109, 151, 337, 338, 297, 299, 333],
  leftCheek:  [116, 111, 117, 118, 119, 120, 121, 128, 36, 205, 207],
  rightCheek: [345, 340, 346, 347, 348, 349, 350, 357, 266, 425, 427],
  nose:       [1, 2, 4, 5, 6, 19, 20, 94, 168, 195, 197],
  chin:       [152, 175, 176, 177, 148, 149, 150, 136, 365, 379, 394, 395, 396, 397, 400],
} as const

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

function sampleZone(
  ctx: CanvasRenderingContext2D,
  lm: Array<{ x: number; y: number }>,
  indices: readonly number[],
  W: number, H: number
): ZoneMetrics | null {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
  for (const idx of indices) {
    const p = lm[idx]; if (!p) continue
    const px = p.x * W, py = p.y * H
    if (px < minX) minX = px; if (px > maxX) maxX = px
    if (py < minY) minY = py; if (py > maxY) maxY = py
  }
  if (!isFinite(minX)) return null
  const pad = 6
  const x = Math.max(0, Math.floor(minX - pad))
  const y = Math.max(0, Math.floor(minY - pad))
  const w = Math.min(W - x, Math.ceil(maxX - minX + pad * 2))
  const h = Math.min(H - y, Math.ceil(maxY - minY + pad * 2))
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

// ── MediaPipe landmark indices ─────────────────────────────────
const FACE_OVAL   = [10,338,297,332,284,251,389,356,454,323,361,288,397,365,379,378,400,377,152,148,176,149,150,136,172,58,132,93,234,127,162,21,54,103,67,109]
const LEFT_EYE    = [33,7,163,144,145,153,154,155,133,173,157,158,159,160,161,246]
const RIGHT_EYE   = [362,382,381,380,374,373,390,249,263,466,388,387,386,385,384,398]
const NOSE_BRIDGE = [1,2,4,5,6,195,197,168,8,9,18,200,199,175]
const LIPS        = [61,84,17,314,405,321,375,291,308,324,318,402,317,14,87,178,88,95]
const LEFT_BROW   = [70,63,105,66,107,55,65,52,53,46]
const RIGHT_BROW  = [300,293,334,296,336,285,295,282,283,276]

// Scan zones in order (indices → label)
const SCAN_ZONES = [
  { label: "Frente",   indices: [10,109,67,103,54,21,162,127,234,93,132,58,172,136,150,149,176,148,152], color: "#e8a4b0" },
  { label: "Ojos",     indices: [...LEFT_EYE, ...RIGHT_EYE, ...LEFT_BROW, ...RIGHT_BROW], color: "#d4af88" },
  { label: "Nariz",    indices: NOSE_BRIDGE, color: "#7ecba1" },
  { label: "Mejillas", indices: [234,93,132,58,172,136,150,149,152,379,378,400,377,397,365,288,361,323,454,356,389,251,284,332], color: "#e8a4b0" },
  { label: "Boca",     indices: LIPS, color: "#7ecba1" },
]

interface FaceCheck {
  ok: boolean
  message: string
  sub: string
  type: "neutral" | "warning" | "success"
  quality: number
  dir: { up: boolean; down: boolean; left: boolean; right: boolean; closer: boolean; farther: boolean }
}

function checkFace(lm: Array<{ x: number; y: number; z: number }>): FaceCheck {
  const nose     = lm[4]
  const leftEye  = lm[33]
  const rightEye = lm[263]
  const noDir    = { up: false, down: false, left: false, right: false, closer: false, farther: false }

  const eyeSpan = Math.abs(rightEye.x - leftEye.x)
  if (eyeSpan < 0.17) return { ok: false, message: "Acércate un poco", sub: "Estás demasiado lejos", type: "warning", quality: 20, dir: { ...noDir, closer: true } }
  if (eyeSpan > 0.52) return { ok: false, message: "Aléjate un poco",  sub: "Estás demasiado cerca", type: "warning", quality: 20, dir: { ...noDir, farther: true } }

  if (nose.x < 0.35) return { ok: false, message: "Mueve a la derecha", sub: "Centra tu rostro", type: "warning", quality: 40, dir: { ...noDir, right: true } }
  if (nose.x > 0.65) return { ok: false, message: "Mueve a la izquierda", sub: "Centra tu rostro", type: "warning", quality: 40, dir: { ...noDir, left: true } }
  if (nose.y < 0.28) return { ok: false, message: "Baja el dispositivo", sub: "Tu frente no se ve",  type: "warning", quality: 40, dir: { ...noDir, down: true } }
  if (nose.y > 0.68) return { ok: false, message: "Sube el dispositivo", sub: "Tu mentón no se ve",  type: "warning", quality: 40, dir: { ...noDir, up: true } }

  const ls  = Math.abs(nose.x - leftEye.x)
  const rs  = Math.abs(rightEye.x - nose.x)
  const yaw = ls / (rs + 0.001)
  if (yaw < 0.55 || yaw > 1.8) return { ok: false, message: "Mira a la cámara", sub: "Gira tu rostro al frente", type: "warning", quality: 30, dir: noDir }

  const quality = Math.round(
    Math.min(eyeSpan / 0.28, 1) * 40 +
    Math.max(0, 1 - Math.abs(nose.x - 0.5) * 8) * 30 +
    Math.max(0, 1 - Math.abs(yaw - 1) * 2) * 30
  )
  return { ok: true, message: "Perfecto · No te muevas", sub: "Analizando…", type: "success", quality: Math.min(100, quality), dir: noDir }
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

// Zone highlight (regions light up as scanned)
function drawZoneHighlight(
  ctx: CanvasRenderingContext2D,
  lm: Array<{ x: number; y: number }>,
  W: number,
  H: number,
  zoneIdx: number,
  progress: number  // 0-1
) {
  if (zoneIdx >= SCAN_ZONES.length) return
  const zone = SCAN_ZONES[zoneIdx]

  function pt(i: number) {
    return { x: (1 - lm[i].x) * W, y: lm[i].y * H }
  }

  ctx.save()
  ctx.globalAlpha = progress * 0.7
  for (const i of zone.indices) {
    const p = pt(i)
    ctx.beginPath()
    ctx.arc(p.x, p.y, 2.5, 0, Math.PI * 2)
    ctx.fillStyle = zone.color
    ctx.shadowColor = zone.color
    ctx.shadowBlur  = 6
    ctx.fill()
  }
  ctx.restore()
}

// Directional arrows for guidance
function drawArrow(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  dir: "up" | "down" | "left" | "right",
  color: string,
  pulse: number
) {
  const size  = 14
  const alpha = 0.7 + pulse * 0.3

  ctx.save()
  ctx.translate(x, y)
  ctx.fillStyle    = color
  ctx.shadowColor  = color
  ctx.shadowBlur   = 12
  ctx.globalAlpha  = alpha
  ctx.beginPath()

  if (dir === "up") {
    ctx.moveTo(0, -size); ctx.lineTo(size * 0.65, 0); ctx.lineTo(-size * 0.65, 0)
  } else if (dir === "down") {
    ctx.moveTo(0, size);  ctx.lineTo(size * 0.65, 0); ctx.lineTo(-size * 0.65, 0)
  } else if (dir === "left") {
    ctx.moveTo(-size, 0); ctx.lineTo(0, size * 0.65); ctx.lineTo(0, -size * 0.65)
  } else {
    ctx.moveTo(size, 0);  ctx.lineTo(0, size * 0.65); ctx.lineTo(0, -size * 0.65)
  }
  ctx.closePath()
  ctx.fill()
  ctx.restore()
}

function drawGuidanceArrows(
  ctx: CanvasRenderingContext2D,
  W: number,
  H: number,
  dir: FaceCheck["dir"],
  pulse: number
) {
  const { cx, cy, rx, ry } = ovalParams(W, H)
  const color = "#d4af88"
  const pad   = 28

  if (dir.up)      drawArrow(ctx, cx,          cy - ry - pad, "up",    color, pulse)
  if (dir.down)    drawArrow(ctx, cx,          cy + ry + pad, "down",  color, pulse)
  if (dir.left)    drawArrow(ctx, cx - rx - pad, cy,          "left",  color, pulse)
  if (dir.right)   drawArrow(ctx, cx + rx + pad, cy,          "right", color, pulse)

  if (dir.closer || dir.farther) {
    const label = dir.closer ? "Acércate →" : "← Aléjate"
    ctx.save()
    ctx.font        = "bold 11px -apple-system, sans-serif"
    ctx.fillStyle   = `rgba(212,175,136,${0.8 + pulse * 0.2})`
    ctx.textAlign   = "center"
    ctx.textBaseline = "middle"
    ctx.shadowColor = "#d4af88"
    ctx.shadowBlur  = 8
    ctx.fillText(label, cx, cy + ry + 32)
    ctx.restore()
  }
}

function drawMesh(
  ctx: CanvasRenderingContext2D,
  lm: Array<{ x: number; y: number }>,
  W: number,
  H: number,
  state: "warning" | "success",
  opacity: number
) {
  const color    = state === "success" ? `rgba(126,203,161,${opacity * 0.55})` : `rgba(232,164,176,${opacity * 0.4})`
  const dotColor = state === "success" ? `rgba(126,203,161,${opacity * 0.85})` : `rgba(232,164,176,${opacity * 0.6})`

  function pt(i: number) { return { x: (1 - lm[i].x) * W, y: lm[i].y * H } }

  function drawLine(indices: number[]) {
    if (indices.length < 2) return
    ctx.beginPath()
    const s = pt(indices[0]); ctx.moveTo(s.x, s.y)
    for (let i = 1; i < indices.length; i++) { const p = pt(indices[i]); ctx.lineTo(p.x, p.y) }
    ctx.strokeStyle = color; ctx.lineWidth = 0.8; ctx.stroke()
  }

  function drawDots(indices: number[], r = 1.5) {
    for (const i of indices) {
      const p = pt(i)
      ctx.beginPath(); ctx.arc(p.x, p.y, r, 0, Math.PI * 2)
      ctx.fillStyle = dotColor; ctx.fill()
    }
  }

  ctx.save()
  drawLine(FACE_OVAL); drawLine(LEFT_EYE); drawLine(RIGHT_EYE)
  drawLine(NOSE_BRIDGE); drawLine(LIPS); drawLine(LEFT_BROW); drawLine(RIGHT_BROW)
  drawDots([...FACE_OVAL, ...LEFT_EYE, ...RIGHT_EYE, ...NOSE_BRIDGE], 1.2)
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

// ── MediaPipe loader ─────────────────────────────────────────────
type LandmarkerResult = { faceLandmarks: Array<Array<{x:number;y:number;z:number}>> }
type VideoLandmarker  = { detectForVideo: (el: HTMLVideoElement, ts: number) => LandmarkerResult }

let _mpVideoLandmarker: VideoLandmarker | null = null
let _mpVideoPromise: Promise<VideoLandmarker> | null = null

async function getVideoLandmarker(): Promise<VideoLandmarker> {
  if (_mpVideoLandmarker) return _mpVideoLandmarker
  if (_mpVideoPromise)    return _mpVideoPromise

  _mpVideoPromise = (async () => {
    const vision = await import(
      /* webpackIgnore: true */
      "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.22/vision_bundle.mjs" as string
    ) as {
      FilesetResolver: { forVisionTasks: (p: string) => Promise<unknown> }
      FaceLandmarker:  { createFromOptions: (r: unknown, o: unknown) => Promise<VideoLandmarker> }
    }
    const resolver = await vision.FilesetResolver.forVisionTasks(
      "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.22/wasm"
    )
    _mpVideoLandmarker = await vision.FaceLandmarker.createFromOptions(resolver, {
      baseOptions: {
        modelAssetPath: "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task",
        delegate: "GPU",
      },
      runningMode: "VIDEO",
      numFaces: 1,
    })
    return _mpVideoLandmarker!
  })()

  return _mpVideoPromise
}

// ── Props ─────────────────────────────────────────────────────────
interface CameraStageProps {
  onCapture: (dataUrl: string, scores: Scores) => void
  onCancel: () => void
  onScanError?: (reason: string) => void
}

export function CameraStage({ onCapture, onCancel, onScanError }: CameraStageProps) {
  const videoRef    = useRef<HTMLVideoElement>(null)
  const canvasRef   = useRef<HTMLCanvasElement>(null)
  const streamRef   = useRef<MediaStream | null>(null)
  const rafRef      = useRef<number>(0)
  const frameRef    = useRef(0)
  const goodRef     = useRef(0)
  const lastLmRef   = useRef<Array<{x:number;y:number;z:number}> | null>(null)
  const pulseRef    = useRef(0)
  const capturedRef = useRef(false)

  // Live analysis refs
  const offscreenRef   = useRef<HTMLCanvasElement | null>(null)
  const accumRef       = useRef<Record<string, ZoneAccum>>({
    forehead: freshAccum(), leftCheek: freshAccum(), rightCheek: freshAccum(),
    nose: freshAccum(), chin: freshAccum(),
  })
  const sampleFrameRef = useRef(0)

  const [mpStatus,   setMpStatus]   = useState<"loading" | "ready" | "error">("loading")
  const [guidance,   setGuidance]   = useState<{ msg: string; sub: string; type: "neutral" | "warning" | "success" }>({ msg: "Iniciando cámara…", sub: "", type: "neutral" })
  const [countdown,  setCountdown]  = useState<number | null>(null)
  const [camError,   setCamError]   = useState<string | null>(null)
  const [scanZone,   setScanZone]   = useState(-1)

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
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          await videoRef.current.play()
        }
      } catch {
        if (!cancelled) setCamError("No se pudo acceder a la cámara. Verifica los permisos.")
        return
      }

      try {
        await getVideoLandmarker()
        if (!cancelled) setMpStatus("ready")
      } catch {
        if (!cancelled) setMpStatus("error")
      }
    }

    init()
    return () => {
      cancelled = true
      streamRef.current?.getTracks().forEach(t => t.stop())
      cancelAnimationFrame(rafRef.current)
    }
  }, [])

  // ── Detection loop ─────────────────────────────────────────────
  useEffect(() => {
    if (mpStatus !== "ready") return

    let countdownStart  = 0
    let countdownActive = false
    let scanBeamY       = 0   // 0-1 vertical position within oval
    let scanBeamDir     = 1   // 1 = down, -1 = up
    let lastZoneChange  = 0
    let currentZone     = -1

    function loop() {
      rafRef.current = requestAnimationFrame(loop)
      frameRef.current++

      const video  = videoRef.current
      const canvas = canvasRef.current
      if (!canvas || !video || video.readyState < 2) return

      const { clientWidth: W, clientHeight: H } = canvas
      if (canvas.width !== W || canvas.height !== H) { canvas.width = W; canvas.height = H }

      const ctx = canvas.getContext("2d")
      if (!ctx) return
      ctx.clearRect(0, 0, W, H)

      pulseRef.current = (Math.sin(Date.now() / 750) + 1) / 2
      const now = Date.now()

      // Run detection every 3 frames
      if (frameRef.current % 3 === 0 && !capturedRef.current) {
        try {
          const result = _mpVideoLandmarker!.detectForVideo(video, performance.now())
          lastLmRef.current = result.faceLandmarks?.length > 0 ? result.faceLandmarks[0] : null
        } catch { /* GPU skip */ }
      }

      const lm = lastLmRef.current

      // ── No face ──────────────────────────────────────────────
      if (!lm) {
        goodRef.current = 0
        countdownActive = false
        currentZone     = -1
        setCountdown(null)
        setScanZone(-1)
        drawOval(ctx, W, H, "neutral", 0)
        updateGuidance("Pon tu rostro en el óvalo", "Asegúrate de tener buena luz", "neutral")
        return
      }

      const check = checkFace(lm)

      // ── Brightness ───────────────────────────────────────────
      let dark = false
      try {
        const nosePx = { x: (1 - lm[4].x) * W, y: lm[4].y * H }
        const tmp    = document.createElement("canvas")
        tmp.width = 60; tmp.height = 60
        const tc = tmp.getContext("2d")!
        tc.save(); tc.scale(-1, 1); tc.drawImage(video, -(nosePx.x + 30), nosePx.y - 30, 60, 60); tc.restore()
        const pd = tc.getImageData(0, 0, 60, 60).data
        let sum  = 0
        for (let i = 0; i < pd.length; i += 4) sum += 0.299 * pd[i] + 0.587 * pd[i+1] + 0.114 * pd[i+2]
        dark = (sum / (60 * 60)) < 38
      } catch { /* fine */ }

      if (dark) {
        goodRef.current = 0; countdownActive = false; currentZone = -1
        setCountdown(null); setScanZone(-1)
        drawOval(ctx, W, H, "warning", 0)
        drawMesh(ctx, lm, W, H, "warning", 0.4)
        updateGuidance("Necesitas más luz", "Busca una ventana o enciende una lámpara", "warning")
        return
      }

      // ── Wrong position ────────────────────────────────────────
      if (!check.ok) {
        goodRef.current = 0; countdownActive = false; currentZone = -1
        setCountdown(null); setScanZone(-1)
        drawOval(ctx, W, H, "warning", pulseRef.current * 0.3)
        drawMesh(ctx, lm, W, H, "warning", 0.45)
        drawGuidanceArrows(ctx, W, H, check.dir, pulseRef.current)
        updateGuidance(check.message, check.sub, "warning")
        return
      }

      // ── Face good ─────────────────────────────────────────────
      goodRef.current++

      // Animate scan beam (starts immediately when face is good)
      const beamSpeed = countdownActive ? 0.018 : 0.012
      scanBeamY += beamSpeed * scanBeamDir
      if (scanBeamY >= 1) { scanBeamY = 1; scanBeamDir = -1 }
      if (scanBeamY <= 0) { scanBeamY = 0; scanBeamDir = 1 }

      if (goodRef.current < 15) {
        // Stabilizing
        drawOval(ctx, W, H, "success", 0)
        drawMesh(ctx, lm, W, H, "success", 0.5)
        drawScanLine(ctx, W, H, scanBeamY, 0.4)
        updateGuidance("Perfecto · No te muevas", "Estabilizando…", "success")
        return
      }

      if (!countdownActive) {
        countdownActive = true
        countdownStart  = now
        lastZoneChange  = now
        // Reset accumulators at countdown start
        accumRef.current = {
          forehead: freshAccum(), leftCheek: freshAccum(), rightCheek: freshAccum(),
          nose: freshAccum(), chin: freshAccum(),
        }
        sampleFrameRef.current = 0
      }

      const elapsed      = now - countdownStart
      const totalMs      = 3000
      const remaining    = Math.max(0, totalMs - elapsed)
      const secondsLeft  = Math.ceil(remaining / 1000)
      const zoneProgress = elapsed / totalMs  // 0-1

      // ── Sample pixels every 6 frames for live analysis ─────
      if (frameRef.current % 6 === 0 && lm) {
        if (!offscreenRef.current) {
          offscreenRef.current = document.createElement('canvas')
        }
        const off = offscreenRef.current
        off.width  = video.videoWidth  || 640
        off.height = video.videoHeight || 480
        const oc = off.getContext('2d')!
        oc.drawImage(video, 0, 0)  // RAW, no flip — landmarks are in raw video space

        for (const [zoneName, indices] of Object.entries(ANALYSIS_ZONES)) {
          const m = sampleZone(oc, lm, indices, off.width, off.height)
          if (m) accumulate(accumRef.current[zoneName], m)
        }
        sampleFrameRef.current++
      }

      // Progress through scan zones (5 zones over 3s)
      const zoneIdx = Math.min(Math.floor(zoneProgress * SCAN_ZONES.length), SCAN_ZONES.length - 1)
      if (zoneIdx !== currentZone) {
        currentZone   = zoneIdx
        lastZoneChange = now
        setScanZone(zoneIdx)
      }
      const zoneFade = Math.min(1, (now - lastZoneChange) / 300)

      // Draw layers
      drawOval(ctx, W, H, "success", pulseRef.current)
      drawMesh(ctx, lm, W, H, "success", 0.6 + zoneProgress * 0.2)
      drawScanLine(ctx, W, H, scanBeamY, 0.7 + pulseRef.current * 0.3)
      drawZoneHighlight(ctx, lm, W, H, zoneIdx, zoneFade)
      drawCountdownRing(ctx, W, H, secondsLeft, 1 - (remaining % 1000) / 1000)

      setCountdown(secondsLeft)

      if (secondsLeft > 0) {
        const zone = SCAN_ZONES[zoneIdx]
        updateGuidance(`Escaneando ${zone?.label ?? "…"}`, `Capturando en ${secondsLeft}…`, "success")
      } else {
        updateGuidance("Captura completada", "", "success")
        if (!capturedRef.current) {
          capturedRef.current = true
          cancelAnimationFrame(rafRef.current)
          doCapture()
        }
      }
    }

    rafRef.current = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(rafRef.current)
  }, [mpStatus]) // eslint-disable-line

  const guidanceRef = useRef({ msg: "", sub: "", type: "neutral" as "neutral" | "warning" | "success" })
  function updateGuidance(msg: string, sub: string, type: "neutral" | "warning" | "success") {
    if (guidanceRef.current.msg !== msg || guidanceRef.current.type !== type) {
      guidanceRef.current = { msg, sub, type }
      setGuidance({ msg, sub, type })
    }
  }

  const doCapture = useCallback(() => {
    const video = videoRef.current
    if (!video) return

    // Compute scores from accumulated live samples
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
      onScanError?.("No pudimos analizar tu piel. Asegúrate de tener buena luz y el rostro visible.")
      return
    }

    onCapture(url, scores)
  }, [onCapture, onScanError])

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
        {mpStatus === "loading" && (
          <>
            <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#d4af88", animation: "pulse-dot 1s ease-in-out infinite" }} />
            <span style={{ fontSize: 11, color: "rgba(245,237,232,0.35)", letterSpacing: "0.1em" }}>Cargando sistema de detección…</span>
          </>
        )}
        {mpStatus === "ready" && !camError && (
          <div style={{ display: "flex", alignItems: "center", gap: 7, transition: "all 0.3s" }}>
            <span style={{ fontSize: 13, color: guidanceColor, fontWeight: 700, transition: "color 0.3s", minWidth: 14, textAlign: "center" }}>{guidanceIcon}</span>
            <span style={{ fontSize: 13, color: guidanceColor, fontWeight: 600, transition: "color 0.3s", letterSpacing: "0.01em" }}>{guidance.msg}</span>
          </div>
        )}
        {(mpStatus === "error" || camError) && (
          <span style={{ fontSize: 12, color: "#e8a4b0" }}>{camError || "Error al cargar el sistema de análisis"}</span>
        )}
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
        {mpStatus === "loading" && (
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
        {mpStatus === "ready" && guidance.sub && (
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

        {/* Scan zone label (top-left, appears during countdown) */}
        {scanZone >= 0 && countdown !== null && (
          <div style={{
            position: "absolute", top: 14, left: 14,
            display: "flex", alignItems: "center", gap: 6,
            animation: "fadeInUp 0.25s ease",
          }}>
            <div style={{
              width: 6, height: 6, borderRadius: "50%",
              background: SCAN_ZONES[scanZone]?.color ?? "#7ecba1",
              boxShadow: `0 0 8px ${SCAN_ZONES[scanZone]?.color ?? "#7ecba1"}`,
              animation: "pulse-dot 0.8s ease-in-out infinite",
            }} />
            <span style={{ fontSize: 10, letterSpacing: "0.15em", textTransform: "uppercase", color: SCAN_ZONES[scanZone]?.color ?? "#7ecba1", fontWeight: 700, opacity: 0.9 }}>
              {SCAN_ZONES[scanZone]?.label}
            </span>
          </div>
        )}

        {/* Signal bars (top-right) */}
        {mpStatus === "ready" && lastLmRef.current && countdown === null && (
          <div style={{ position: "absolute", top: 14, right: 14, display: "flex", gap: 3, alignItems: "flex-end" }}>
            {[1, 2, 3, 4].map((bar) => {
              const active = guidance.type === "success" ? bar <= 4 : guidance.type === "warning" ? bar <= 2 : bar <= 0
              return (
                <div key={bar} style={{
                  width: 4,
                  height: 5 + bar * 3,
                  borderRadius: 2,
                  background: active ? (guidance.type === "success" ? "#7ecba1" : "#d4af88") : "rgba(245,237,232,0.15)",
                  transition: "background 0.3s",
                }} />
              )
            })}
          </div>
        )}

        {/* Zone mini-progress during scan (bottom-right) */}
        {countdown !== null && countdown > 0 && (
          <div style={{
            position: "absolute", bottom: 16, right: 14,
            display: "flex", flexDirection: "column", gap: 3, alignItems: "flex-end",
          }}>
            {SCAN_ZONES.map((z, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 5 }}>
                <span style={{ fontSize: 9, color: i <= scanZone ? z.color : "rgba(245,237,232,0.2)", letterSpacing: "0.1em", transition: "color 0.3s" }}>
                  {z.label}
                </span>
                <div style={{
                  width: 24, height: 2, borderRadius: 1,
                  background: i < scanZone ? z.color : i === scanZone ? z.color + "99" : "rgba(245,237,232,0.1)",
                  transition: "background 0.4s",
                }} />
              </div>
            ))}
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
          disabled={!!camError || mpStatus === "loading"}
          style={{
            flex: 2, padding: "13px",
            background: countdown !== null
              ? "linear-gradient(135deg, #5aab82, #7ecba1)"
              : guidance.type === "success"
              ? "linear-gradient(135deg, #3d9066, #7ecba1)"
              : "linear-gradient(135deg, #e8a4b0, #c97e8e)",
            border: "none", borderRadius: 12, color: "#fff",
            fontSize: 14, fontWeight: 700,
            cursor: (camError || mpStatus === "loading") ? "not-allowed" : "pointer",
            opacity: (camError || mpStatus === "loading") ? 0.5 : 1,
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            transition: "background 0.5s",
          }}
        >
          {countdown !== null ? (
            <>
              <span style={{ fontSize: 20, fontWeight: 800, fontFamily: "var(--font-fraunces)" }}>{countdown}</span>
              <span>Escaneando…</span>
            </>
          ) : guidance.type === "success" ? (
            <>
              <svg width="15" height="15" viewBox="0 0 18 18" fill="none">
                <circle cx="9" cy="9" r="8" stroke="currentColor" strokeWidth="1.5" />
                <path d="M5 9.5l3 3 5-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
              Capturar ahora
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
        @keyframes spin       { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes pulse-dot  { 0%,100% { opacity: 0.4; } 50% { opacity: 1; } }
        @keyframes fadeInUp   { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  )
}
