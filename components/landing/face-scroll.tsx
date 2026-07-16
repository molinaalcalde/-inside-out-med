"use client"

/**
 * APPLE-STYLE SCROLL STORYTELLING
 *
 * Sección pinneada de 500vh de alto.
 * Mientras el usuario hace scroll, una historia visual se despliega:
 *   0–20%  → Face outline aparece
 *   20–40% → Scan line barre el rostro
 *   40–60% → Zonas se iluminan una a una
 *   60–80% → Data points y labels aparecen
 *   80–100% → Estado final: resultados completos
 *
 * TO INTEGRATE REAL VIDEO:
 * 1. Place video frames as /public/frames/frame_{0001..0300}.jpg
 * 2. Uncomment the ImageSequence component below
 * 3. It will be driven by the same scroll progress
 */

import { useEffect, useRef } from "react"
import { gsap } from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"

const CAPTION_STAGES = [
  { from: 0, to: 0.18, headline: "Tu piel tiene una historia.", sub: "Invisible a simple vista." },
  { from: 0.2, to: 0.38, headline: "Visible desde afuera…", sub: "Cada zona cuenta algo diferente." },
  { from: 0.4, to: 0.58, headline: "Analizada zona por zona.", sub: "12 biomarcadores. Un mapa completo." },
  { from: 0.6, to: 0.78, headline: "Detectamos lo que no ves.", sub: "Inflamación, oxidación, deshidratación y más." },
  { from: 0.8, to: 1.0, headline: "Tu plan, listo en segundos.", sub: "Protocolos médicos personalizados para ti." },
]

const ZONES = [
  { id: "frente", label: "Frente", x: 200, y: 135, color: "#e8a4b0", score: "92" },
  { id: "ojo-i",  label: "Ojo izq.", x: 148, y: 195, color: "#d4af88", score: "78" },
  { id: "ojo-d",  label: "Ojo der.", x: 252, y: 195, color: "#d4af88", score: "81" },
  { id: "nariz",  label: "T-Zone",   x: 200, y: 265, color: "#e8b86d", score: "65" },
  { id: "mejilla-i", label: "Mejilla", x: 128, y: 295, color: "#7ecba1", score: "88" },
  { id: "mejilla-d", label: "Mejilla", x: 272, y: 295, color: "#7ecba1", score: "85" },
  { id: "menton", label: "Mentón",   x: 200, y: 390, color: "#e8a4b0", score: "74" },
]

export function FaceScrollSection() {
  const sectionRef = useRef<HTMLDivElement>(null)
  const stickyRef = useRef<HTMLDivElement>(null)
  const svgRef = useRef<SVGSVGElement>(null)
  const captionRef = useRef<HTMLDivElement>(null)
  const progressBarRef = useRef<HTMLDivElement>(null)

  // Refs for animated elements
  const facePathRef = useRef<SVGPathElement>(null)
  const scanLineRef = useRef<SVGLineElement>(null)
  const zoneRefs = useRef<SVGEllipseElement[]>([])
  const dotRefs = useRef<SVGCircleElement[]>([])
  const labelRefs = useRef<SVGLineElement[]>([])
  const scoreRefs = useRef<SVGTextElement[]>([])
  const glowRef = useRef<SVGEllipseElement>(null)

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger)

    const ctx = gsap.context(() => {
      // Measure face path length for stroke animation
      const facePath = facePathRef.current
      if (facePath) {
        const len = facePath.getTotalLength()
        gsap.set(facePath, { strokeDasharray: len, strokeDashoffset: len })
      }

      // Set initial states
      gsap.set(scanLineRef.current, { opacity: 0 })
      gsap.set(zoneRefs.current, { opacity: 0, scale: 0, transformOrigin: "center" })
      gsap.set(dotRefs.current, { opacity: 0, scale: 0, transformOrigin: "center" })
      gsap.set(labelRefs.current, { opacity: 0, x: -8 })
      gsap.set(scoreRefs.current, { opacity: 0 })
      gsap.set(glowRef.current, { opacity: 0 })
      gsap.set(captionRef.current?.querySelectorAll(".caption-stage") ?? [], { opacity: 0 })

      // Show first caption immediately
      const firstCaption = captionRef.current?.querySelector(".caption-stage[data-index='0']")
      if (firstCaption) gsap.set(firstCaption, { opacity: 1 })

      ScrollTrigger.create({
        trigger: sectionRef.current,
        start: "top top",
        end: "+=500%",
        pin: stickyRef.current,
        scrub: 1.2,
        onUpdate: (self) => {
          const p = self.progress

          // ── Face draw-in (0 → 0.2) ──
          if (facePath) {
            const len = facePath.getTotalLength()
            const drawProgress = Math.min(p / 0.2, 1)
            gsap.set(facePath, { strokeDashoffset: len * (1 - drawProgress) })
          }

          // ── Scan line (0.18 → 0.42) ──
          const scanStart = 0.18, scanEnd = 0.42
          if (p >= scanStart && p <= scanEnd) {
            const sp = (p - scanStart) / (scanEnd - scanStart)
            const y = 80 + sp * 360 // from top to bottom of face
            gsap.set(scanLineRef.current, {
              opacity: sp < 0.05 || sp > 0.95 ? sp < 0.05 ? sp / 0.05 : (1 - sp) / 0.05 : 1,
              attr: { y1: y, y2: y },
            })
          } else {
            gsap.set(scanLineRef.current, { opacity: 0 })
          }

          // ── Zones illuminate (0.38 → 0.62) ──
          const zoneStart = 0.38
          ZONES.forEach((_, i) => {
            const zp = (p - (zoneStart + i * 0.035)) / 0.06
            const clamped = Math.max(0, Math.min(1, zp))
            if (zoneRefs.current[i]) {
              gsap.set(zoneRefs.current[i], {
                opacity: clamped * 0.35,
                scale: 0.6 + clamped * 0.4,
              })
            }
          })

          // ── Data dots & labels (0.58 → 0.82) ──
          const dotStart = 0.58
          ZONES.forEach((_, i) => {
            const dp = (p - (dotStart + i * 0.03)) / 0.07
            const clamped = Math.max(0, Math.min(1, dp))
            if (dotRefs.current[i]) gsap.set(dotRefs.current[i], { opacity: clamped, scale: 0.5 + clamped * 0.5 })
            if (labelRefs.current[i]) gsap.set(labelRefs.current[i], { opacity: clamped, x: -8 + clamped * 8 })
            if (scoreRefs.current[i]) gsap.set(scoreRefs.current[i], { opacity: p > 0.72 ? clamped : 0 })
          })

          // ── Final glow (0.82 → 1.0) ──
          const gp = Math.max(0, (p - 0.82) / 0.18)
          if (glowRef.current) gsap.set(glowRef.current, { opacity: gp * 0.4 })

          // ── Progress bar ──
          if (progressBarRef.current) {
            gsap.set(progressBarRef.current, { scaleX: p })
          }

          // ── Captions ──
          CAPTION_STAGES.forEach((stage, i) => {
            const el = captionRef.current?.querySelector(`.caption-stage[data-index='${i}']`)
            if (!el) return
            const inRange = p >= stage.from && p <= stage.to
            const fade = inRange ? 1 : 0
            gsap.to(el, { opacity: fade, duration: 0.01 })
          })
        },
      })
    }, sectionRef)

    return () => ctx.revert()
  }, [])

  return (
    <section
      id="face-scroll"
      ref={sectionRef}
      style={{ height: "600vh", position: "relative" }}
    >
      <div
        ref={stickyRef}
        style={{
          height: "100vh",
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
          overflow: "hidden",
          background: "#0e0c12",
        }}
      >
        {/* Background ambient */}
        <div
          aria-hidden
          style={{
            position: "absolute",
            inset: 0,
            background:
              "radial-gradient(ellipse 60% 50% at 50% 50%, rgba(232,164,176,0.05) 0%, transparent 70%)",
            pointerEvents: "none",
          }}
        />

        {/* Grid layout: face + captions */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr auto 1fr",
            alignItems: "center",
            gap: "clamp(24px, 4vw, 80px)",
            width: "100%",
            maxWidth: 1100,
            padding: "0 24px",
          }}
        >
          {/* Left caption */}
          <div
            ref={captionRef}
            style={{ textAlign: "right", position: "relative", height: 180 }}
          >
            {CAPTION_STAGES.map((stage, i) => (
              <div
                key={i}
                className="caption-stage"
                data-index={i}
                style={{
                  position: "absolute",
                  top: 0,
                  right: 0,
                  width: "100%",
                  opacity: 0,
                }}
              >
                <p
                  style={{
                    fontSize: "clamp(9px, 1vw, 11px)",
                    letterSpacing: "0.18em",
                    textTransform: "uppercase",
                    color: "#e8a4b0",
                    fontWeight: 700,
                    marginBottom: 12,
                  }}
                >
                  InsideOutMed
                </p>
                <h2
                  className="display-md"
                  style={{ marginBottom: 14, textAlign: "right" }}
                >
                  {stage.headline}
                </h2>
                <p
                  style={{
                    fontSize: "clamp(13px, 1.4vw, 17px)",
                    color: "rgba(245,237,232,0.55)",
                    lineHeight: 1.6,
                  }}
                >
                  {stage.sub}
                </p>
              </div>
            ))}
          </div>

          {/* SVG Face */}
          <div style={{ position: "relative", flexShrink: 0 }}>
            <svg
              ref={svgRef}
              viewBox="0 0 400 480"
              style={{
                width: "clamp(260px, 28vw, 380px)",
                height: "auto",
                overflow: "visible",
              }}
            >
              <defs>
                <filter id="glow-filter">
                  <feGaussianBlur stdDeviation="3" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
                <linearGradient id="scan-grad" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="transparent" />
                  <stop offset="20%" stopColor="#e8a4b0" stopOpacity="0.8" />
                  <stop offset="50%" stopColor="#e8a4b0" />
                  <stop offset="80%" stopColor="#e8a4b0" stopOpacity="0.8" />
                  <stop offset="100%" stopColor="transparent" />
                </linearGradient>
                <radialGradient id="zone-rose" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#e8a4b0" stopOpacity="1" />
                  <stop offset="100%" stopColor="#e8a4b0" stopOpacity="0" />
                </radialGradient>
                <radialGradient id="zone-gold" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#d4af88" stopOpacity="1" />
                  <stop offset="100%" stopColor="#d4af88" stopOpacity="0" />
                </radialGradient>
                <radialGradient id="zone-green" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#7ecba1" stopOpacity="1" />
                  <stop offset="100%" stopColor="#7ecba1" stopOpacity="0" />
                </radialGradient>
              </defs>

              {/* ── Ambient glow (final state) ── */}
              <ellipse
                ref={glowRef}
                cx="200"
                cy="240"
                rx="160"
                ry="200"
                fill="url(#zone-rose)"
                opacity="0"
                filter="url(#glow-filter)"
              />

              {/* ── Zone fills ── */}
              {/* Frente */}
              <ellipse ref={(el) => { if (el) zoneRefs.current[0] = el }} cx="200" cy="135" rx="75" ry="40" fill="#e8a4b0" opacity="0" />
              {/* Ojo izq */}
              <ellipse ref={(el) => { if (el) zoneRefs.current[1] = el }} cx="148" cy="195" rx="38" ry="22" fill="#d4af88" opacity="0" />
              {/* Ojo der */}
              <ellipse ref={(el) => { if (el) zoneRefs.current[2] = el }} cx="252" cy="195" rx="38" ry="22" fill="#d4af88" opacity="0" />
              {/* Nariz/T-zone */}
              <ellipse ref={(el) => { if (el) zoneRefs.current[3] = el }} cx="200" cy="260" rx="32" ry="50" fill="#e8b86d" opacity="0" />
              {/* Mejilla izq */}
              <ellipse ref={(el) => { if (el) zoneRefs.current[4] = el }} cx="130" cy="295" rx="45" ry="50" fill="#7ecba1" opacity="0" />
              {/* Mejilla der */}
              <ellipse ref={(el) => { if (el) zoneRefs.current[5] = el }} cx="270" cy="295" rx="45" ry="50" fill="#7ecba1" opacity="0" />
              {/* Mentón */}
              <ellipse ref={(el) => { if (el) zoneRefs.current[6] = el }} cx="200" cy="390" rx="50" ry="35" fill="#e8a4b0" opacity="0" />

              {/* ── Face outline ── */}
              <path
                ref={facePathRef}
                d="
                  M 200 65
                  C 260 65 310 95 325 145
                  C 338 188 338 235 332 275
                  C 325 320 305 365 278 400
                  C 258 428 232 445 200 445
                  C 168 445 142 428 122 400
                  C 95 365 75 320 68 275
                  C 62 235 62 188 75 145
                  C 90 95 140 65 200 65 Z
                "
                fill="none"
                stroke="#e8a4b0"
                strokeWidth="1.5"
                opacity="0.8"
              />

              {/* ── Eyebrows ── */}
              <path
                d="M 128 178 Q 150 168 175 175"
                fill="none"
                stroke="rgba(245,237,232,0.4)"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
              <path
                d="M 225 175 Q 250 168 272 178"
                fill="none"
                stroke="rgba(245,237,232,0.4)"
                strokeWidth="1.5"
                strokeLinecap="round"
              />

              {/* ── Eyes ── */}
              <ellipse cx="150" cy="197" rx="26" ry="14" fill="none" stroke="rgba(245,237,232,0.5)" strokeWidth="1.2" />
              <ellipse cx="250" cy="197" rx="26" ry="14" fill="none" stroke="rgba(245,237,232,0.5)" strokeWidth="1.2" />
              <circle cx="150" cy="197" r="6" fill="rgba(245,237,232,0.15)" />
              <circle cx="250" cy="197" r="6" fill="rgba(245,237,232,0.15)" />
              <circle cx="152" cy="195" r="2" fill="rgba(245,237,232,0.5)" />
              <circle cx="252" cy="195" r="2" fill="rgba(245,237,232,0.5)" />

              {/* ── Nose ── */}
              <path
                d="M 200 220 L 188 275 Q 200 283 212 275 L 200 220"
                fill="none"
                stroke="rgba(245,237,232,0.3)"
                strokeWidth="1"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {/* ── Lips ── */}
              <path
                d="M 168 338 Q 185 330 200 333 Q 215 330 232 338"
                fill="none"
                stroke="rgba(245,237,232,0.45)"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
              <path
                d="M 168 338 Q 200 360 232 338"
                fill="rgba(245,237,232,0.05)"
                stroke="rgba(245,237,232,0.35)"
                strokeWidth="1.2"
              />

              {/* ── Scan line ── */}
              <line
                ref={scanLineRef}
                x1="60"
                y1="200"
                x2="340"
                y2="200"
                stroke="url(#scan-grad)"
                strokeWidth="2"
                opacity="0"
              />
              <line
                x1="60"
                y1="200"
                x2="340"
                y2="200"
                stroke="rgba(232,164,176,0.15)"
                strokeWidth="8"
                ref={(el) => {
                  // Second glow line, synced to scan line
                  if (el && scanLineRef.current) {
                    const update = () => {
                      const s = scanLineRef.current
                      if (s && el) {
                        el.setAttribute("y1", s.getAttribute("y1") ?? "200")
                        el.setAttribute("y2", s.getAttribute("y2") ?? "200")
                        el.style.opacity = s.style.opacity
                      }
                      requestAnimationFrame(update)
                    }
                    update()
                  }
                }}
              />

              {/* ── Data dots ── */}
              {ZONES.map((zone, i) => (
                <circle
                  key={zone.id}
                  ref={(el) => { if (el) dotRefs.current[i] = el }}
                  cx={zone.x}
                  cy={zone.y}
                  r="5"
                  fill={zone.color}
                  opacity="0"
                  filter="url(#glow-filter)"
                />
              ))}

              {/* ── Labels ── */}
              {ZONES.map((zone, i) => (
                <g key={`label-${zone.id}`}>
                  {/* Connector line */}
                  <line
                    ref={(el) => { if (el) labelRefs.current[i] = el }}
                    x1={zone.x + (zone.x < 200 ? -5 : 5)}
                    y1={zone.y}
                    x2={zone.x + (zone.x < 200 ? -45 : 45)}
                    y2={zone.y}
                    stroke={zone.color}
                    strokeWidth="0.8"
                    opacity="0"
                  />
                  {/* Label text */}
                  <text
                    x={zone.x + (zone.x < 200 ? -52 : 52)}
                    y={zone.y - 2}
                    fill={zone.color}
                    fontSize="9"
                    fontFamily="var(--font-inter)"
                    fontWeight="600"
                    letterSpacing="0.1em"
                    textAnchor={zone.x < 200 ? "end" : "start"}
                    opacity="0"
                  >
                    {zone.label.toUpperCase()}
                  </text>
                  {/* Score */}
                  <text
                    ref={(el) => { if (el) scoreRefs.current[i] = el }}
                    x={zone.x + (zone.x < 200 ? -52 : 52)}
                    y={zone.y + 11}
                    fill="rgba(245,237,232,0.5)"
                    fontSize="10"
                    fontFamily="var(--font-fraunces)"
                    textAnchor={zone.x < 200 ? "end" : "start"}
                    opacity="0"
                  >
                    {zone.score}/100
                  </text>
                </g>
              ))}

              {/* ── Outer ring (final state) ── */}
              <ellipse
                cx="200"
                cy="255"
                rx="170"
                ry="205"
                fill="none"
                stroke="rgba(232,164,176,0.08)"
                strokeWidth="1"
                strokeDasharray="4 8"
                ref={(el) => {
                  if (el) gsap.to(el, { rotation: 360, duration: 40, repeat: -1, ease: "none", transformOrigin: "200px 255px" })
                }}
              />
            </svg>

            {/* Progress bar (bottom of face) */}
            <div
              style={{
                marginTop: 24,
                height: 1,
                background: "rgba(245,237,232,0.08)",
                borderRadius: 1,
                overflow: "hidden",
                width: "100%",
              }}
            >
              <div
                ref={progressBarRef}
                style={{
                  height: "100%",
                  background: "linear-gradient(to right, #e8a4b0, #d4af88)",
                  transformOrigin: "left",
                  transform: "scaleX(0)",
                }}
              />
            </div>
            <p
              style={{
                textAlign: "center",
                marginTop: 10,
                fontSize: 10,
                letterSpacing: "0.2em",
                color: "rgba(245,237,232,0.3)",
                textTransform: "uppercase",
              }}
            >
              Analizando
            </p>
          </div>

          {/* Right: live data panel */}
          <div style={{ position: "relative", height: 380 }}>
            <div
              className="glass-card"
              style={{ padding: "24px 20px", maxWidth: 220 }}
            >
              <p
                style={{
                  fontSize: 9,
                  letterSpacing: "0.2em",
                  textTransform: "uppercase",
                  color: "#e8a4b0",
                  fontWeight: 700,
                  marginBottom: 16,
                }}
              >
                Biomarcadores
              </p>
              {[
                { label: "Hidratación", value: 87, color: "#7ecba1" },
                { label: "Oxidación", value: 34, color: "#e8a4b0" },
                { label: "Inflamación", value: 22, color: "#e8b86d" },
                { label: "Elasticidad", value: 79, color: "#d4af88" },
                { label: "Melanina", value: 61, color: "#e8a4b0" },
              ].map((item) => (
                <div key={item.label} style={{ marginBottom: 14 }}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      marginBottom: 5,
                    }}
                  >
                    <span style={{ fontSize: 11, color: "rgba(245,237,232,0.6)", fontWeight: 500 }}>
                      {item.label}
                    </span>
                    <span style={{ fontSize: 11, fontWeight: 700, color: item.color }}>
                      {item.value}%
                    </span>
                  </div>
                  <div
                    style={{
                      height: 3,
                      background: "rgba(245,237,232,0.08)",
                      borderRadius: 2,
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        height: "100%",
                        width: `${item.value}%`,
                        background: item.color,
                        borderRadius: 2,
                        boxShadow: `0 0 8px ${item.color}60`,
                      }}
                    />
                  </div>
                </div>
              ))}
              <div
                style={{
                  marginTop: 20,
                  padding: "12px 0 0",
                  borderTop: "1px solid rgba(245,237,232,0.08)",
                }}
              >
                <p style={{ fontSize: 9, letterSpacing: "0.15em", textTransform: "uppercase", color: "rgba(245,237,232,0.3)", marginBottom: 6 }}>
                  Score global
                </p>
                <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
                  <span
                    style={{
                      fontFamily: "var(--font-fraunces)",
                      fontSize: 36,
                      fontWeight: 400,
                      color: "#e8a4b0",
                      letterSpacing: "-0.03em",
                      lineHeight: 1,
                    }}
                  >
                    84
                  </span>
                  <span style={{ fontSize: 13, color: "rgba(245,237,232,0.4)", fontWeight: 500 }}>/100</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile: stack vertically */}
        <style>{`
          @media (max-width: 768px) {
            #face-scroll-inner {
              grid-template-columns: 1fr !important;
              grid-template-rows: auto auto auto !important;
              text-align: center !important;
            }
            #face-scroll-inner > div:first-child { text-align: center !important; order: 1; }
            #face-scroll-inner > div:nth-child(2) { order: 0; }
            #face-scroll-inner > div:last-child { display: none; }
            .caption-stage { right: auto !important; text-align: center !important; }
            .caption-stage h2 { text-align: center !important; }
          }
        `}</style>
      </div>
    </section>
  )
}
