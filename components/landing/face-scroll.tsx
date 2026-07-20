"use client"

import { useEffect, useRef, useState } from "react"
import { gsap } from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"

const STAGES = [
  { from: 0,    to: 0.20, headline: "Tu piel envejece. ¿Pero cuánto?", sub: "A veces más rápido de lo que crees." },
  { from: 0.20, to: 0.40, headline: "Lo que se ve por fuera…", sub: "…no siempre refleja lo que pasa por dentro." },
  { from: 0.40, to: 0.60, headline: "9 zonas. 7 biomarcadores.", sub: "Un mapa completo de tu piel." },
  { from: 0.60, to: 0.80, headline: "Tu edad facial, revelada.", sub: "Sin filtros. Sin adivinar." },
  { from: 0.80, to: 1.0,  headline: "Tu plan para revertirlo.", sub: "Productos y rutinas que funcionan para TU piel." },
]

const BIOMARKERS = [
  { label: "Luminosidad",          value: 87, color: "#7ecba1" },
  { label: "Hidratación",          value: 72, color: "#d4af88" },
  { label: "Uniformidad",          value: 65, color: "#e8a4b0" },
  { label: "Salud del colágeno",   value: 79, color: "#7ecba1" },
  { label: "Protección solar",     value: 54, color: "#d4af88" },
]

export function FaceScrollSection() {
  const sectionRef   = useRef<HTMLDivElement>(null)
  const videoRef     = useRef<HTMLVideoElement>(null)
  const headlineRef  = useRef<HTMLParagraphElement>(null)
  const subRef       = useRef<HTMLParagraphElement>(null)
  const progressRef  = useRef<HTMLDivElement>(null)
  const bioRef       = useRef<HTMLDivElement>(null)

  const [stageIdx, setStageIdx] = useState(0)
  const targetTimeRef = useRef(0)
  const rafRef = useRef<number>(0)

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger)

    const video = videoRef.current
    if (!video) return

    // Preload video, set to first frame
    video.load()
    video.currentTime = 0

    let dur = 10
    const onMeta = () => { dur = video.duration || 10 }
    video.addEventListener("loadedmetadata", onMeta)

    // Smooth lerp loop — interpolates toward target time each RAF frame
    let running = true
    const lerp = (a: number, b: number, t: number) => a + (b - a) * t
    const tick = () => {
      if (!running) return
      if (video.readyState >= 2) {
        const current = video.currentTime
        const target  = targetTimeRef.current
        const diff    = Math.abs(target - current)
        if (diff > 0.01) {
          video.currentTime = lerp(current, target, 0.12)
        }
      }
      rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)

    // ── Main scroll trigger ──────────────────────────────────
    const st = ScrollTrigger.create({
      trigger: sectionRef.current,
      start: "top top",
      end: "bottom bottom",
      pin: false,
      scrub: 1,
      onUpdate: (self) => {
        const p = self.progress  // 0 → 1

        // Set target time — lerp loop handles smooth scrubbing
        targetTimeRef.current = p * dur

        // Biomarkers panel: fade in after 70%
        if (bioRef.current) {
          const bioOpacity = p > 0.65 ? Math.min((p - 0.65) / 0.15, 1) : 0
          gsap.set(bioRef.current, { opacity: bioOpacity, y: bioOpacity < 1 ? 24 * (1 - bioOpacity) : 0 })
        }

        // Progress bar
        if (progressRef.current) {
          gsap.set(progressRef.current, { scaleX: p, transformOrigin: "left center" })
        }

        // Caption stage
        const idx = STAGES.findIndex(s => p >= s.from && p < s.to)
        if (idx !== -1) setStageIdx(idx)
      },
    })

    return () => {
      running = false
      cancelAnimationFrame(rafRef.current)
      video.removeEventListener("loadedmetadata", onMeta)
      st.kill()
    }
  }, [])

  const stage = STAGES[stageIdx]

  return (
    <section
      ref={sectionRef}
      id="results"
      style={{ position: "relative", height: "600vh", background: "#0e0c12" }}
    >
      {/* ── Sticky container ── */}
      <div style={{
        position: "sticky",
        top: 0,
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
      }}>

        {/* ── Video — full bleed background ── */}
        <video
          ref={videoRef}
          muted
          playsInline
          preload="auto"
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
            objectPosition: "center top",
            transform: "scale(1.18)",
            transformOrigin: "center 30%",
          }}
        >
          <source src="/face-scan.mp4" type="video/mp4" />
        </video>

        {/* Dark gradient overlay — keeps text legible */}
        <div style={{
          position: "absolute",
          inset: 0,
          background: "linear-gradient(to right, rgba(14,12,18,0.85) 0%, rgba(14,12,18,0.2) 50%, rgba(14,12,18,0.6) 100%)",
          pointerEvents: "none",
        }} />
        <div style={{
          position: "absolute",
          inset: 0,
          background: "linear-gradient(to bottom, rgba(14,12,18,0.5) 0%, transparent 18%, transparent 55%, rgba(14,12,18,0.7) 78%, rgba(14,12,18,1) 93%)",
          pointerEvents: "none",
        }} />

        {/* ── Layout grid ── */}
        <div style={{
          position: "relative",
          zIndex: 10,
          width: "100%",
          maxWidth: 1200,
          padding: "0 40px",
          display: "grid",
          gridTemplateColumns: "1fr auto",
          alignItems: "center",
          gap: 60,
        }}>

          {/* Left: Caption */}
          <div>
            <span style={{
              display: "block",
              fontSize: 11,
              letterSpacing: "0.16em",
              color: "#e8a4b0",
              textTransform: "uppercase",
              fontWeight: 600,
              marginBottom: 20,
            }}>
              InsideOutMed
            </span>

            <h2
              key={stageIdx + "-h"}
              style={{
                fontFamily: "var(--font-fraunces)",
                fontSize: "clamp(32px, 5vw, 64px)",
                fontWeight: 400,
                lineHeight: 1.05,
                letterSpacing: "-0.03em",
                color: "#f5ede8",
                marginBottom: 20,
                maxWidth: 560,
                animation: "fadeUp 0.5s ease forwards",
              }}
            >
              {stage.headline}
            </h2>

            <p
              key={stageIdx + "-s"}
              style={{
                fontSize: "clamp(14px, 1.8vw, 18px)",
                color: "rgba(245,237,232,0.55)",
                lineHeight: 1.65,
                maxWidth: 400,
                animation: "fadeUp 0.5s 0.1s ease both",
              }}
            >
              {stage.sub}
            </p>
          </div>

          {/* Right: Biomarkers panel (appears at 65%+ scroll) */}
          <div
            ref={bioRef}
            style={{
              opacity: 0,
              background: "rgba(14,12,18,0.75)",
              backdropFilter: "blur(20px)",
              WebkitBackdropFilter: "blur(20px)",
              border: "1px solid rgba(245,237,232,0.10)",
              borderRadius: 20,
              padding: "28px 32px",
              minWidth: 260,
            }}
          >
            {/* Hook */}
            <p style={{ fontSize: 9, letterSpacing: "0.14em", color: "rgba(245,237,232,0.35)", textTransform: "uppercase", marginBottom: 14, fontWeight: 600 }}>
              Lo que no te dice el espejo
            </p>
            <p style={{ fontFamily: "var(--font-fraunces)", fontSize: 18, fontWeight: 400, color: "#f5ede8", lineHeight: 1.35, marginBottom: 4, letterSpacing: "-0.02em" }}>
              Tu piel puede aparentar hasta{" "}
              <span style={{ color: "#e8a4b0" }}>3–5 años más</span>{" "}
              de los que tienes.
            </p>
            <p style={{ fontSize: 10.5, color: "rgba(245,237,232,0.32)", lineHeight: 1.5, marginBottom: 18 }}>
              Sin que lo notes.
            </p>

            {/* Divider */}
            <div style={{ height: 1, background: "rgba(245,237,232,0.08)", marginBottom: 16 }} />

            {/* Aging factors */}
            <p style={{ fontSize: 9, letterSpacing: "0.12em", color: "rgba(245,237,232,0.35)", textTransform: "uppercase", marginBottom: 12, fontWeight: 600 }}>
              Lo que más envejece tu piel
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {[
                { factor: "Falta de protección solar", impact: "hasta +2 años" },
                { factor: "Inflamación silenciosa",    impact: "hasta +1.5 años" },
                { factor: "Deshidratación crónica",    impact: "hasta +1 año" },
              ].map((item) => (
                <div key={item.factor} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: 11, color: "rgba(245,237,232,0.55)" }}>{item.factor}</span>
                  <span style={{ fontSize: 10, fontWeight: 700, color: "#e8a4b0", letterSpacing: "0.02em", flexShrink: 0, marginLeft: 10 }}>{item.impact}</span>
                </div>
              ))}
            </div>

            {/* Divider */}
            <div style={{ height: 1, background: "rgba(245,237,232,0.08)", margin: "16px 0" }} />

            {/* Recovery */}
            <p style={{ fontSize: 11, color: "rgba(245,237,232,0.5)", lineHeight: 1.55, marginBottom: 16 }}>
              Con una rutina personalizada puedes reducir tu edad facial{" "}
              <span style={{ color: "#7ecba1", fontWeight: 600 }}>hasta 2 años en 12 semanas.</span>
            </p>

            {/* CTA */}
            <a href="/analyze" style={{
              display: "flex", alignItems: "center", justifyContent: "center",
              background: "linear-gradient(135deg, #e8a4b0, #c97e8e)",
              color: "#fff", fontSize: 12, fontWeight: 700, padding: "12px 18px",
              borderRadius: 10, textDecoration: "none",
              boxShadow: "0 4px 16px rgba(232,164,176,0.25)",
              letterSpacing: "0.01em",
            }}>
              ¿Cuántos años aparenta tu piel?
            </a>
          </div>
        </div>

        {/* ── Bottom progress bar ── */}
        <div style={{
          position: "absolute",
          bottom: 40,
          left: "50%",
          transform: "translateX(-50%)",
          width: 200,
          zIndex: 10,
          textAlign: "center",
        }}>
          <div style={{
            height: 1,
            background: "rgba(245,237,232,0.12)",
            borderRadius: 1,
            overflow: "hidden",
            marginBottom: 12,
          }}>
            <div
              ref={progressRef}
              style={{
                height: "100%",
                background: "linear-gradient(90deg, #e8a4b0, #d4af88)",
                transformOrigin: "left center",
                transform: "scaleX(0)",
              }}
            />
          </div>
          <span style={{ fontSize: 10, letterSpacing: "0.14em", color: "rgba(245,237,232,0.3)", textTransform: "uppercase" }}>
            Scroll
          </span>
        </div>
      </div>

      {/* ── Keyframes inline ── */}
      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </section>
  )
}
