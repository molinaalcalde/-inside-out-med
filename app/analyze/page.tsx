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
          <div style={{ maxWidth: 800, width: "100%" }}>
            <div style={{ textAlign: "center", marginBottom: 48 }}>
              <span style={{ fontSize: 11, letterSpacing: "0.14em", color: "#7ecba1", textTransform: "uppercase", fontWeight: 600 }}>
                Análisis completado
              </span>
              <h1 style={{
                fontFamily: "var(--font-fraunces)",
                fontSize: "clamp(24px, 4vw, 38px)",
                fontWeight: 500,
                marginTop: 12,
                letterSpacing: "-0.03em",
              }}>
                Tu piel habla. Esto es lo que dice.
              </h1>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 20, marginBottom: 40 }}>
              {/* Score */}
              <div style={{ background: "rgba(245,237,232,0.03)", border: "1px solid rgba(245,237,232,0.08)", borderRadius: 20, padding: 32 }}>
                <p style={{ fontSize: 11, letterSpacing: "0.12em", color: "rgba(245,237,232,0.4)", textTransform: "uppercase", marginBottom: 24 }}>
                  Score Global
                </p>
                <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 24 }}>
                  <span style={{ fontSize: 72, fontFamily: "var(--font-fraunces)", fontWeight: 300, color: "#e8a4b0", lineHeight: 1 }}>84</span>
                  <span style={{ fontSize: 20, color: "rgba(245,237,232,0.3)" }}>/100</span>
                </div>
                <div style={{ height: 4, background: "rgba(245,237,232,0.06)", borderRadius: 2, overflow: "hidden", marginBottom: 20 }}>
                  <div style={{ height: "100%", width: "84%", background: "linear-gradient(90deg, #e8a4b0, #d4af88)", borderRadius: 2 }} />
                </div>
                <p style={{ fontSize: 13, color: "rgba(245,237,232,0.5)", lineHeight: 1.7 }}>
                  Tu piel está en excelente estado. Hidratación superior a la media, bajo nivel de inflamación.
                </p>
              </div>

              {/* Biomarkers */}
              <div style={{ background: "rgba(245,237,232,0.03)", border: "1px solid rgba(245,237,232,0.08)", borderRadius: 20, padding: 32 }}>
                <p style={{ fontSize: 11, letterSpacing: "0.12em", color: "rgba(245,237,232,0.4)", textTransform: "uppercase", marginBottom: 24 }}>
                  Biomarcadores
                </p>
                <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
                  {BIOMARKERS.map((b) => (
                    <div key={b.label}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                        <span style={{ fontSize: 13, color: "rgba(245,237,232,0.7)" }}>{b.label}</span>
                        <span style={{ fontSize: 13, fontWeight: 600, color: b.color }}>{b.value}%</span>
                      </div>
                      <div style={{ height: 3, background: "rgba(245,237,232,0.06)", borderRadius: 2, overflow: "hidden" }}>
                        <div style={{ height: "100%", width: `${b.value}%`, background: b.color, borderRadius: 2 }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div style={{ textAlign: "center", display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
              <button
                onClick={reset}
                style={{ background: "none", border: "1px solid rgba(245,237,232,0.15)", borderRadius: 12, padding: "12px 28px", color: "rgba(245,237,232,0.5)", fontSize: 13, cursor: "pointer" }}
              >
                Nuevo análisis
              </button>
              <button style={{ background: "#e8a4b0", border: "none", borderRadius: 12, padding: "12px 28px", color: "#0e0c12", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
                Ver protocolo completo
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
