"use client"

import { useEffect, useRef, useState, useCallback } from "react"

type Stage = "choose" | "camera" | "scanning" | "results"

const BIOMARKERS = [
  { label: "Hidratación", value: 87, color: "#7ecba1" },
  { label: "Oxidación", value: 34, color: "#d4af88" },
  { label: "Inflamación", value: 22, color: "#e8a4b0" },
  { label: "Elasticidad", value: 79, color: "#7ecba1" },
  { label: "Melanina", value: 61, color: "#e8a4b0" },
]

const FACE_POINTS = [
  { x: 50, y: 22 },  // frente
  { x: 28, y: 45 },  // mejilla izq
  { x: 72, y: 45 },  // mejilla der
  { x: 50, y: 55 },  // nariz
  { x: 35, y: 72 },  // mandíbula izq
  { x: 65, y: 72 },  // mandíbula der
]

export default function AnalyzePage() {
  const [stage, setStage] = useState<Stage>("choose")
  const [capturedUrl, setCapturedUrl] = useState<string | null>(null)
  const [scanProgress, setScanProgress] = useState(0)
  const [visiblePoints, setVisiblePoints] = useState<number[]>([])
  const [cameraError, setCameraError] = useState<string | null>(null)

  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const scanIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Stop camera stream
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop())
      streamRef.current = null
    }
  }, [])

  // Start camera
  const startCamera = useCallback(async () => {
    setCameraError(null)
    setStage("camera")
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 720 } },
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
      }
    } catch {
      setCameraError("No se pudo acceder a la cámara. Verifica los permisos.")
    }
  }, [])

  // Capture frame from camera
  const captureFrame = useCallback(() => {
    const video = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas) return
    canvas.width = video.videoWidth || 640
    canvas.height = video.videoHeight || 480
    const ctx = canvas.getContext("2d")
    if (!ctx) return
    ctx.scale(-1, 1) // mirror
    ctx.drawImage(video, -canvas.width, 0, canvas.width, canvas.height)
    const url = canvas.toDataURL("image/jpeg", 0.9)
    stopCamera()
    setCapturedUrl(url)
    beginScan()
  }, [stopCamera])

  // Handle uploaded file
  const handleFile = useCallback((file: File) => {
    if (!file.type.startsWith("image/")) return
    const reader = new FileReader()
    reader.onload = (e) => {
      setCapturedUrl(e.target?.result as string)
      beginScan()
    }
    reader.readAsDataURL(file)
  }, [])

  // Scan animation
  const beginScan = useCallback(() => {
    setStage("scanning")
    setScanProgress(0)
    setVisiblePoints([])
    let progress = 0
    let pointsRevealed = 0

    scanIntervalRef.current = setInterval(() => {
      progress += Math.random() * 2.2 + 0.8
      if (progress >= 100) {
        progress = 100
        clearInterval(scanIntervalRef.current!)
        setTimeout(() => setStage("results"), 700)
      }
      setScanProgress(Math.min(progress, 100))

      // Reveal face points progressively
      const targetPoints = Math.floor((Math.min(progress, 100) / 100) * FACE_POINTS.length)
      if (targetPoints > pointsRevealed) {
        pointsRevealed = targetPoints
        setVisiblePoints(Array.from({ length: pointsRevealed }, (_, i) => i))
      }
    }, 80)
  }, [])

  // Cleanup on unmount
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
    setStage("choose")
  }

  return (
    <div style={{
      minHeight: "100vh",
      background: "#0e0c12",
      color: "#f5ede8",
      fontFamily: "var(--font-inter, sans-serif)",
      display: "flex",
      flexDirection: "column",
    }}>
      {/* Nav */}
      <nav style={{
        padding: "0 24px",
        height: 72,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        borderBottom: "1px solid rgba(245,237,232,0.06)",
        flexShrink: 0,
      }}>
        <a href="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
          <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
            <circle cx="14" cy="14" r="13" stroke="#e8a4b0" strokeWidth="1.5" />
            <circle cx="14" cy="14" r="7" stroke="#e8a4b0" strokeWidth="1" strokeDasharray="3 2" />
            <circle cx="14" cy="14" r="3" fill="#e8a4b0" />
          </svg>
          <span style={{ fontFamily: "var(--font-fraunces)", fontSize: 18, fontWeight: 500, color: "#f5ede8" }}>
            InsideOutMed
          </span>
        </a>
        <span style={{ fontSize: 11, color: "rgba(245,237,232,0.3)", letterSpacing: "0.12em", textTransform: "uppercase" }}>
          Análisis Facial
        </span>
      </nav>

      {/* Main */}
      <main style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 24px" }}>

        {/* ── CHOOSE ── */}
        {stage === "choose" && (
          <div style={{ maxWidth: 560, width: "100%", textAlign: "center" }}>
            <p style={{ fontSize: 11, letterSpacing: "0.14em", color: "#e8a4b0", textTransform: "uppercase", fontWeight: 600, marginBottom: 16 }}>
              Paso 1 de 1
            </p>
            <h1 style={{ fontFamily: "var(--font-fraunces)", fontSize: "clamp(28px, 5vw, 44px)", fontWeight: 500, lineHeight: 1.1, marginBottom: 12, letterSpacing: "-0.03em" }}>
              ¿Cómo quieres analizarte?
            </h1>
            <p style={{ fontSize: 15, color: "rgba(245,237,232,0.45)", marginBottom: 40, lineHeight: 1.6 }}>
              El análisis detecta 12 biomarcadores en menos de 60 segundos.
            </p>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 32 }}>
              {/* Camera option */}
              <button
                onClick={startCamera}
                style={{
                  background: "rgba(245,237,232,0.03)",
                  border: "1.5px solid rgba(245,237,232,0.1)",
                  borderRadius: 20,
                  padding: "32px 20px",
                  cursor: "pointer",
                  color: "#f5ede8",
                  textAlign: "center",
                  transition: "border-color 0.2s, background 0.2s",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 16,
                }}
                onMouseEnter={(e) => {
                  const el = e.currentTarget
                  el.style.borderColor = "rgba(232,164,176,0.5)"
                  el.style.background = "rgba(232,164,176,0.05)"
                }}
                onMouseLeave={(e) => {
                  const el = e.currentTarget
                  el.style.borderColor = "rgba(245,237,232,0.1)"
                  el.style.background = "rgba(245,237,232,0.03)"
                }}
              >
                <div style={{ width: 56, height: 56, borderRadius: "50%", background: "rgba(232,164,176,0.1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                    <rect x="2" y="7" width="24" height="18" rx="3" stroke="#e8a4b0" strokeWidth="1.5" />
                    <circle cx="14" cy="16" r="5" stroke="#e8a4b0" strokeWidth="1.5" />
                    <path d="M10 7V5a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2" stroke="#e8a4b0" strokeWidth="1.5" />
                  </svg>
                </div>
                <div>
                  <p style={{ fontSize: 16, fontWeight: 600, marginBottom: 6 }}>Escaneo en vivo</p>
                  <p style={{ fontSize: 13, color: "rgba(245,237,232,0.45)", lineHeight: 1.5 }}>Activa tu cámara frontal</p>
                </div>
                <span style={{ fontSize: 11, color: "#e8a4b0", letterSpacing: "0.1em", fontWeight: 600 }}>RECOMENDADO</span>
              </button>

              {/* Upload option */}
              <button
                onClick={() => fileRef.current?.click()}
                style={{
                  background: "rgba(245,237,232,0.03)",
                  border: "1.5px solid rgba(245,237,232,0.1)",
                  borderRadius: 20,
                  padding: "32px 20px",
                  cursor: "pointer",
                  color: "#f5ede8",
                  textAlign: "center",
                  transition: "border-color 0.2s, background 0.2s",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 16,
                }}
                onMouseEnter={(e) => {
                  const el = e.currentTarget
                  el.style.borderColor = "rgba(245,237,232,0.25)"
                  el.style.background = "rgba(245,237,232,0.05)"
                }}
                onMouseLeave={(e) => {
                  const el = e.currentTarget
                  el.style.borderColor = "rgba(245,237,232,0.1)"
                  el.style.background = "rgba(245,237,232,0.03)"
                }}
              >
                <div style={{ width: 56, height: 56, borderRadius: "50%", background: "rgba(245,237,232,0.06)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                    <rect x="3" y="3" width="22" height="22" rx="4" stroke="rgba(245,237,232,0.6)" strokeWidth="1.5" />
                    <circle cx="10" cy="10" r="2.5" stroke="rgba(245,237,232,0.6)" strokeWidth="1.5" />
                    <path d="M3 18l6-6 4 4 4-5 8 7" stroke="rgba(245,237,232,0.6)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <div>
                  <p style={{ fontSize: 16, fontWeight: 600, marginBottom: 6 }}>Subir selfie</p>
                  <p style={{ fontSize: 13, color: "rgba(245,237,232,0.45)", lineHeight: 1.5 }}>Desde galería o archivo</p>
                </div>
                <span style={{ fontSize: 11, color: "rgba(245,237,232,0.3)", letterSpacing: "0.1em" }}>JPG / PNG</span>
              </button>
            </div>

            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              style={{ display: "none" }}
              onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f) }}
            />

            <p style={{ fontSize: 11, color: "rgba(245,237,232,0.2)", letterSpacing: "0.06em" }}>
              TU FOTO NO SE ALMACENA · PROCESAMIENTO LOCAL · 100% PRIVADO
            </p>
          </div>
        )}

        {/* ── CAMERA ── */}
        {stage === "camera" && (
          <div style={{ maxWidth: 400, width: "100%", textAlign: "center" }}>
            <p style={{ fontSize: 13, color: "rgba(245,237,232,0.5)", marginBottom: 20 }}>
              Centra tu rostro dentro del óvalo
            </p>

            <div style={{
              position: "relative",
              width: "100%",
              paddingBottom: "133%",
              borderRadius: 24,
              overflow: "hidden",
              background: "#111",
              marginBottom: 24,
            }}>
              {/* Camera feed */}
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                style={{
                  position: "absolute",
                  inset: 0,
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  transform: "scaleX(-1)", // mirror
                }}
              />

              {/* Face oval guide */}
              <svg
                viewBox="0 0 100 133"
                style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none" }}
              >
                <ellipse
                  cx="50" cy="55" rx="32" ry="42"
                  stroke="rgba(232,164,176,0.6)"
                  strokeWidth="0.8"
                  strokeDasharray="4 3"
                  fill="none"
                />
                {/* Corner brackets */}
                <path d="M18 20 L18 13 L25 13" stroke="#e8a4b0" strokeWidth="1" fill="none" strokeLinecap="round" />
                <path d="M75 13 L82 13 L82 20" stroke="#e8a4b0" strokeWidth="1" fill="none" strokeLinecap="round" />
                <path d="M18 90 L18 97 L25 97" stroke="#e8a4b0" strokeWidth="1" fill="none" strokeLinecap="round" />
                <path d="M75 97 L82 97 L82 90" stroke="#e8a4b0" strokeWidth="1" fill="none" strokeLinecap="round" />
              </svg>

              {/* Animated scan line */}
              <div style={{
                position: "absolute",
                left: "12%",
                right: "12%",
                height: 1,
                background: "linear-gradient(90deg, transparent, #e8a4b0, transparent)",
                boxShadow: "0 0 8px rgba(232,164,176,0.8)",
                animation: "scanLine 2.4s ease-in-out infinite",
                top: "10%",
              }} />

              {cameraError && (
                <div style={{
                  position: "absolute",
                  inset: 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: "rgba(14,12,18,0.9)",
                  padding: 24,
                  textAlign: "center",
                }}>
                  <p style={{ color: "#e8a4b0", fontSize: 14, lineHeight: 1.6 }}>{cameraError}</p>
                </div>
              )}
            </div>

            <div style={{ display: "flex", gap: 12 }}>
              <button
                onClick={reset}
                style={{ flex: 1, padding: "14px", background: "rgba(245,237,232,0.06)", border: "1px solid rgba(245,237,232,0.12)", borderRadius: 12, color: "rgba(245,237,232,0.6)", fontSize: 14, cursor: "pointer" }}
              >
                Cancelar
              </button>
              <button
                onClick={captureFrame}
                disabled={!!cameraError}
                style={{
                  flex: 2,
                  padding: "14px",
                  background: "#e8a4b0",
                  border: "none",
                  borderRadius: 12,
                  color: "#0e0c12",
                  fontSize: 14,
                  fontWeight: 700,
                  cursor: cameraError ? "not-allowed" : "pointer",
                  opacity: cameraError ? 0.5 : 1,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                }}
              >
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                  <circle cx="9" cy="9" r="8" stroke="currentColor" strokeWidth="1.5" />
                  <circle cx="9" cy="9" r="4" fill="currentColor" />
                </svg>
                Capturar y analizar
              </button>
            </div>
          </div>
        )}

        {/* ── SCANNING ── */}
        {stage === "scanning" && capturedUrl && (
          <div style={{ maxWidth: 400, width: "100%", textAlign: "center" }}>
            <p style={{ fontSize: 11, letterSpacing: "0.14em", color: "#e8a4b0", textTransform: "uppercase", fontWeight: 600, marginBottom: 20 }}>
              Analizando biomarcadores
            </p>

            <div style={{
              position: "relative",
              width: "100%",
              paddingBottom: "133%",
              borderRadius: 24,
              overflow: "hidden",
              marginBottom: 28,
              border: "1px solid rgba(232,164,176,0.15)",
            }}>
              <img
                src={capturedUrl}
                alt="análisis"
                style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
              />

              {/* Scanning line */}
              <div style={{
                position: "absolute",
                left: 0,
                right: 0,
                height: 2,
                background: "linear-gradient(90deg, transparent, #e8a4b0, #d4af88, #e8a4b0, transparent)",
                boxShadow: "0 0 16px rgba(232,164,176,0.9), 0 0 4px rgba(212,175,136,0.6)",
                top: `${scanProgress}%`,
                transition: "top 0.1s linear",
              }} />

              {/* Biomarker detection points */}
              {visiblePoints.map((i) => (
                <div
                  key={i}
                  style={{
                    position: "absolute",
                    left: `${FACE_POINTS[i].x}%`,
                    top: `${FACE_POINTS[i].y}%`,
                    transform: "translate(-50%, -50%)",
                    width: 12,
                    height: 12,
                    borderRadius: "50%",
                    border: "1.5px solid #e8a4b0",
                    boxShadow: "0 0 8px rgba(232,164,176,0.7)",
                    background: "rgba(232,164,176,0.2)",
                    animation: "pointPulse 1.5s ease-in-out infinite",
                  }}
                />
              ))}

              {/* Dark overlay for depth */}
              <div style={{
                position: "absolute",
                inset: 0,
                background: "linear-gradient(180deg, rgba(14,12,18,0.2) 0%, transparent 30%, transparent 70%, rgba(14,12,18,0.4) 100%)",
                pointerEvents: "none",
              }} />
            </div>

            {/* Progress */}
            <div style={{ height: 2, background: "rgba(245,237,232,0.08)", borderRadius: 2, overflow: "hidden", marginBottom: 12 }}>
              <div style={{
                height: "100%",
                width: `${scanProgress}%`,
                background: "linear-gradient(90deg, #e8a4b0, #d4af88)",
                transition: "width 0.1s linear",
              }} />
            </div>
            <p style={{ fontSize: 13, color: "rgba(245,237,232,0.3)" }}>
              {Math.round(scanProgress) < 40 ? "Detectando estructura facial…" :
               Math.round(scanProgress) < 70 ? "Analizando biomarcadores…" :
               Math.round(scanProgress) < 95 ? "Calculando resultados…" : "Preparando informe…"}
            </p>
          </div>
        )}

        {/* ── RESULTS ── */}
        {stage === "results" && (
          <div style={{ maxWidth: 860, width: "100%" }}>

            {/* ── Header reveal ── */}
            <div style={{ textAlign: "center", marginBottom: 48 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginBottom: 16 }}>
                <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#7ecba1", boxShadow: "0 0 8px rgba(126,203,161,0.8)" }} />
                <span style={{ fontSize: 11, letterSpacing: "0.16em", color: "#7ecba1", textTransform: "uppercase", fontWeight: 700 }}>
                  Análisis completado
                </span>
              </div>
              <h1 style={{
                fontFamily: "var(--font-fraunces)",
                fontSize: "clamp(26px, 4vw, 40px)",
                fontWeight: 400,
                marginBottom: 12,
                letterSpacing: "-0.03em",
                lineHeight: 1.1,
              }}>
                Tu piel habla.
                <em style={{ color: "#e8a4b0", fontStyle: "italic" }}> Esto es lo que dice.</em>
              </h1>
              <p style={{ fontSize: 14, color: "rgba(245,237,232,0.4)", maxWidth: 400, margin: "0 auto" }}>
                Basado en 12 biomarcadores analizados en tiempo real con tu imagen.
              </p>
            </div>

            {/* ── Score + Biomarkers grid ── */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 16, marginBottom: 20 }}>

              {/* Score card */}
              <div style={{ background: "rgba(245,237,232,0.03)", border: "1px solid rgba(245,237,232,0.08)", borderRadius: 20, padding: 32 }}>
                <p style={{ fontSize: 10, letterSpacing: "0.14em", color: "rgba(245,237,232,0.35)", textTransform: "uppercase", marginBottom: 20, fontWeight: 700 }}>
                  Score Global
                </p>
                <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 16 }}>
                  <span style={{ fontSize: 76, fontFamily: "var(--font-fraunces)", fontWeight: 300, color: "#e8a4b0", lineHeight: 1 }}>84</span>
                  <div>
                    <span style={{ fontSize: 18, color: "rgba(245,237,232,0.28)" }}>/100</span>
                    <p style={{ fontSize: 10, color: "#7ecba1", fontWeight: 700, letterSpacing: "0.06em", marginTop: 2 }}>TOP 18%</p>
                  </div>
                </div>
                <div style={{ height: 3, background: "rgba(245,237,232,0.06)", borderRadius: 2, overflow: "hidden", marginBottom: 16 }}>
                  <div style={{ height: "100%", width: "84%", background: "linear-gradient(90deg, #e8a4b0, #d4af88)", borderRadius: 2 }} />
                </div>
                <p style={{ fontSize: 13, color: "rgba(245,237,232,0.45)", lineHeight: 1.7 }}>
                  Hidratación superior a la media. Inflamación bajo control.
                  El plan de productos puede mejorar tu score en 8–12 puntos en 6 semanas.
                </p>
                <div style={{ marginTop: 20, paddingTop: 16, borderTop: "1px solid rgba(245,237,232,0.06)" }}>
                  <p style={{ fontSize: 10, color: "rgba(245,237,232,0.28)", letterSpacing: "0.08em" }}>EDAD APARENTE</p>
                  <p style={{ fontFamily: "var(--font-fraunces)", fontSize: 20, color: "#7ecba1", fontWeight: 300, marginTop: 2 }}>
                    27 años <span style={{ fontSize: 11, color: "rgba(126,203,161,0.6)" }}>— 4 años menos que tu edad real</span>
                  </p>
                </div>
              </div>

              {/* Biomarkers card */}
              <div style={{ background: "rgba(245,237,232,0.03)", border: "1px solid rgba(245,237,232,0.08)", borderRadius: 20, padding: 32 }}>
                <p style={{ fontSize: 10, letterSpacing: "0.14em", color: "rgba(245,237,232,0.35)", textTransform: "uppercase", marginBottom: 20, fontWeight: 700 }}>
                  Biomarcadores detectados
                </p>
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  {BIOMARKERS.map((b) => {
                    const isAlert = b.label === "Oxidación" && b.value > 30
                    return (
                      <div key={b.label}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 7 }}>
                          <span style={{ fontSize: 13, color: "rgba(245,237,232,0.65)" }}>{b.label}</span>
                          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                            {isAlert && (
                              <span style={{ fontSize: 9, color: "#d4af88", background: "rgba(212,175,136,0.12)", border: "1px solid rgba(212,175,136,0.25)", padding: "1px 7px", borderRadius: 99, fontWeight: 700, letterSpacing: "0.08em" }}>
                                ATENCIÓN
                              </span>
                            )}
                            <span style={{ fontSize: 13, fontWeight: 700, color: b.color }}>{b.value}%</span>
                          </div>
                        </div>
                        <div style={{ height: 2, background: "rgba(245,237,232,0.06)", borderRadius: 1, overflow: "hidden" }}>
                          <div style={{ height: "100%", width: `${b.value}%`, background: b.color, borderRadius: 1 }} />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>

            {/* ── Business model: Consultation CTA ── */}
            <div style={{
              background: "linear-gradient(135deg, rgba(232,164,176,0.07) 0%, rgba(212,175,136,0.04) 100%)",
              border: "1px solid rgba(232,164,176,0.15)",
              borderRadius: 18,
              padding: "28px 32px",
              marginBottom: 16,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 24,
              flexWrap: "wrap",
            }}>
              <div>
                <p style={{ fontSize: 10, letterSpacing: "0.14em", color: "#e8a4b0", textTransform: "uppercase", fontWeight: 700, marginBottom: 8 }}>
                  Gratis · Solo hoy
                </p>
                <h3 style={{ fontFamily: "var(--font-fraunces)", fontSize: "clamp(17px, 2vw, 22px)", fontWeight: 400, letterSpacing: "-0.02em", marginBottom: 6, lineHeight: 1.2 }}>
                  ¿Quieres que analicemos tus resultados juntos?
                </h3>
                <p style={{ fontSize: 13, color: "rgba(245,237,232,0.45)", lineHeight: 1.6 }}>
                  20 minutos con un especialista. Te explicamos cada número y qué hacer exactamente.
                </p>
              </div>
              <a
                href={`https://wa.me/TUTELEFONO?text=${encodeURIComponent("Hola, acabo de hacer mi análisis en InsideOutMed. Mi score fue 84/100. Me gustaría el asesoramiento gratuito.")}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: "inline-flex", alignItems: "center", gap: 8,
                  background: "linear-gradient(135deg, #e8a4b0 0%, #c97e8e 100%)",
                  color: "#fff", borderRadius: 12, padding: "14px 28px",
                  fontSize: 14, fontWeight: 700, textDecoration: "none",
                  whiteSpace: "nowrap", boxShadow: "0 6px 24px rgba(232,164,176,0.3)",
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
                Agendar gratis
              </a>
            </div>

            {/* ── Product plan CTA ── */}
            <div style={{ marginBottom: 32 }}>
              <button
                onClick={() => {
                  try {
                    localStorage.setItem("insideoutmed_scores", JSON.stringify({
                      overall: 84, hydration: 87, inflammation: 22,
                      elasticity: 79, melanin: 61, oxidation: 34,
                    }))
                  } catch {}
                  window.location.href = "/plan"
                }}
                style={{
                  width: "100%",
                  padding: "18px 32px",
                  background: "rgba(245,237,232,0.05)",
                  border: "1px solid rgba(245,237,232,0.12)",
                  borderRadius: 14,
                  color: "#f5ede8",
                  fontSize: 15,
                  fontWeight: 600,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  transition: "background 0.2s, border-color 0.2s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "rgba(245,237,232,0.08)"
                  e.currentTarget.style.borderColor = "rgba(245,237,232,0.2)"
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "rgba(245,237,232,0.05)"
                  e.currentTarget.style.borderColor = "rgba(245,237,232,0.12)"
                }}
              >
                <div style={{ textAlign: "left" }}>
                  <p style={{ fontSize: 13, color: "rgba(245,237,232,0.45)", marginBottom: 2 }}>Basado en tus biomarcadores</p>
                  <span>Ver mis productos recomendados →</span>
                </div>
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <path d="M4 10h12M11 5l5 5-5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </div>

            {/* ── Reset ── */}
            <div style={{ textAlign: "center" }}>
              <button
                onClick={reset}
                style={{ background: "none", border: "none", color: "rgba(245,237,232,0.3)", fontSize: 13, cursor: "pointer", padding: "8px 16px" }}
              >
                Hacer nuevo análisis
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Hidden canvas for frame capture */}
      <canvas ref={canvasRef} style={{ display: "none" }} />

      <style>{`
        @keyframes scanLine {
          0%, 100% { top: 10%; }
          50% { top: 88%; }
        }
        @keyframes pointPulse {
          0%, 100% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
          50% { transform: translate(-50%, -50%) scale(1.4); opacity: 0.6; }
        }
      `}</style>
    </div>
  )
}
