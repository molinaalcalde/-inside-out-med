"use client"

import { useEffect, useRef, useState } from "react"
import { gsap } from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"

const STAGES = [
  { from: 0,    to: 0.20, headline: "Tu piel tiene una historia.", sub: "Invisible a simple vista." },
  { from: 0.20, to: 0.40, headline: "Visible desde afuera…", sub: "Cada zona cuenta algo diferente." },
  { from: 0.40, to: 0.60, headline: "Analizada zona por zona.", sub: "12 biomarcadores. Un mapa completo." },
  { from: 0.60, to: 0.80, headline: "Detectamos lo que no ves.", sub: "Inflamación, oxidación, deshidratación." },
  { from: 0.80, to: 1.0,  headline: "Tu plan, listo en segundos.", sub: "Protocolos médicos personalizados." },
]

const BIOMARKERS = [
  { label: "Hidratación", value: 87, color: "#7ecba1" },
  { label: "Oxidación",   value: 34, color: "#d4af88" },
  { label: "Inflamación", value: 22, color: "#e8a4b0" },
  { label: "Elasticidad", value: 79, color: "#7ecba1" },
  { label: "Melanina",    value: 61, color: "#e8a4b0" },
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
            <p style={{ fontSize: 10, letterSpacing: "0.14em", color: "rgba(245,237,232,0.4)", textTransform: "uppercase", marginBottom: 20, fontWeight: 600 }}>
              Biomarcadores
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {BIOMARKERS.map((b) => (
                <div key={b.label}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                    <span style={{ fontSize: 12, color: "rgba(245,237,232,0.65)" }}>{b.label}</span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: b.color }}>{b.value}%</span>
                  </div>
                  <div style={{ height: 2, background: "rgba(245,237,232,0.06)", borderRadius: 1 }}>
                    <div style={{ height: "100%", width: `${b.value}%`, background: b.color, borderRadius: 1 }} />
                  </div>
                </div>
              ))}
            </div>
            <div style={{ marginTop: 24, paddingTop: 20, borderTop: "1px solid rgba(245,237,232,0.08)" }}>
              <p style={{ fontSize: 10, letterSpacing: "0.1em", color: "rgba(245,237,232,0.3)", marginBottom: 4 }}>SCORE GLOBAL</p>
              <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
                <span style={{ fontSize: 48, fontFamily: "var(--font-fraunces)", fontWeight: 300, color: "#e8a4b0", lineHeight: 1 }}>84</span>
                <span style={{ fontSize: 16, color: "rgba(245,237,232,0.3)" }}>/100</span>
              </div>
            </div>
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
