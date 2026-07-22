"use client"

import { useEffect, useRef, useState } from "react"
import { gsap } from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"
import { useLanguage } from "@/components/providers/language-provider"

export function FaceScrollSection() {
  const { t } = useLanguage()

  const stages = [
    { from: 0,    to: 0.20, headline: t("scroll.s1.h"), sub: t("scroll.s1.s") },
    { from: 0.20, to: 0.40, headline: t("scroll.s2.h"), sub: t("scroll.s2.s") },
    { from: 0.40, to: 0.60, headline: t("scroll.s3.h"), sub: t("scroll.s3.s") },
    { from: 0.60, to: 0.80, headline: t("scroll.s4.h"), sub: t("scroll.s4.s") },
    { from: 0.80, to: 1.0,  headline: t("scroll.s5.h"), sub: t("scroll.s5.s") },
  ]
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
        const idx = stages.findIndex(s => p >= s.from && p < s.to)
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

  const stage = stages[stageIdx]

  return (
    <section
      ref={sectionRef}
      id="results"
      style={{ position: "relative", height: "600vh", background: "#1a1c22" }}
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
        background: "#1a1c22",
      }}>

        {/* ── Video — fills section, face centered ── */}
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
            objectPosition: "center 35%",
            transform: "scale(1.02)",
          }}
        >
          <source src="/face-scan.mp4" type="video/mp4" />
        </video>

        {/* Light overlay — just enough for text readability, face stays visible */}
        <div style={{
          position: "absolute",
          inset: 0,
          background: "linear-gradient(to right, rgba(14,12,18,0.8) 0%, rgba(14,12,18,0.15) 30%, rgba(14,12,18,0.05) 50%, rgba(14,12,18,0.15) 70%, rgba(14,12,18,0.7) 100%)",
          pointerEvents: "none",
        }} />
        <div style={{
          position: "absolute",
          inset: 0,
          background: "linear-gradient(to bottom, rgba(14,12,18,0.4) 0%, transparent 15%, transparent 60%, rgba(14,12,18,0.5) 80%, rgba(14,12,18,1) 95%)",
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
              {t("scroll.label")}
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

          {/* Right: Slim vertical results card (appears at 65%+ scroll) */}
          <div
            ref={bioRef}
            style={{
              opacity: 0,
              background: "rgba(14,12,18,0.7)",
              backdropFilter: "blur(24px)",
              WebkitBackdropFilter: "blur(24px)",
              border: "1px solid rgba(245,237,232,0.08)",
              borderRadius: 18,
              padding: "28px 28px",
              width: 320,
              marginLeft: "auto",
              marginRight: -20,
            }}
          >
            {/* Header */}
            <p style={{ fontSize: 9, letterSpacing: "0.14em", color: "rgba(245,237,232,0.3)", textTransform: "uppercase", marginBottom: 16, fontWeight: 600, textAlign: "center" }}>
              {t("scroll.panel.title")}
            </p>

            {/* Age comparison */}
            <div style={{ textAlign: "center", marginBottom: 16 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 16, marginBottom: 10 }}>
                <div>
                  <p style={{ fontSize: 9, color: "rgba(245,237,232,0.35)", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 4 }}>{t("scroll.panel.realAge")}</p>
                  <p style={{ fontFamily: "var(--font-fraunces)", fontSize: 34, fontWeight: 300, color: "rgba(245,237,232,0.5)", lineHeight: 1 }}>42 <span style={{ fontSize: 14, color: "rgba(245,237,232,0.3)" }}>años</span></p>
                </div>
                <span style={{ fontSize: 18, color: "rgba(245,237,232,0.15)", marginTop: 14 }}>→</span>
                <div>
                  <p style={{ fontSize: 9, color: "rgba(245,237,232,0.35)", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 4 }}>Aparenta</p>
                  <p style={{ fontFamily: "var(--font-fraunces)", fontSize: 34, fontWeight: 300, color: "#e8a4b0", lineHeight: 1 }}>45 <span style={{ fontSize: 14, color: "rgba(232,164,176,0.5)" }}>años</span></p>
                </div>
              </div>
              <p style={{ fontSize: 11, color: "#e8a4b0", fontWeight: 600, letterSpacing: "0.02em" }}>{t("scroll.panel.above")}</p>
            </div>

            {/* Divider */}
            <div style={{ height: 1, background: "rgba(245,237,232,0.06)", marginBottom: 12 }} />

            {/* What we found */}
            <p style={{ fontSize: 9, letterSpacing: "0.1em", color: "rgba(245,237,232,0.3)", textTransform: "uppercase", marginBottom: 10, fontWeight: 600 }}>
              {t("scroll.panel.detected")}
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
              {[
                { label: t("scroll.panel.solar"),     value: 54, color: "#e8a4b0" },
                { label: t("scroll.panel.hydration"),  value: 62, color: "#d4af88" },
                { label: t("scroll.panel.collagen"),   value: 71, color: "#d4af88" },
              ].map((b) => (
                <div key={b.label}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                    <span style={{ fontSize: 12, color: "rgba(245,237,232,0.55)" }}>{b.label}</span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: b.color }}>{b.value}%</span>
                  </div>
                  <div style={{ height: 3, background: "rgba(245,237,232,0.06)", borderRadius: 2 }}>
                    <div style={{ height: "100%", width: `${b.value}%`, background: `linear-gradient(90deg, ${b.color}88, ${b.color})`, borderRadius: 2 }} />
                  </div>
                </div>
              ))}
            </div>

            {/* Divider */}
            <div style={{ height: 1, background: "rgba(245,237,232,0.06)", margin: "14px 0" }} />

            {/* Recovery promise */}
            <p style={{ fontSize: 11.5, color: "rgba(245,237,232,0.45)", lineHeight: 1.55, marginBottom: 14, textAlign: "center" }}>
              {t("scroll.panel.recovery")}{" "}
              <span style={{ color: "#7ecba1", fontWeight: 600 }}>{t("scroll.panel.orLess")}</span>{" "}
              {t("scroll.panel.weeks")}
            </p>

            {/* CTA */}
            <a href="/analyze" style={{
              display: "block", textAlign: "center",
              background: "linear-gradient(135deg, #e8a4b0, #c97e8e)",
              color: "#fff", fontSize: 13, fontWeight: 700, padding: "13px 18px",
              borderRadius: 10, textDecoration: "none",
              boxShadow: "0 4px 16px rgba(232,164,176,0.25)",
              letterSpacing: "0.01em",
            }}>
              {t("scroll.panel.cta")}
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
            {t("scroll.progress")}
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
