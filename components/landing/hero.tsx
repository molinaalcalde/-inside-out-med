"use client"

import { useEffect, useRef } from "react"
import { gsap } from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"

const BIOMARKERS = [
  { label: "Hidratación", value: 87, color: "#7ecba1" },
  { label: "Elasticidad", value: 79, color: "#d4af88" },
  { label: "Inflamación", value: 18, color: "#e8a4b0" },
]

const FACE_POINTS: [number, number][] = [
  [90, 52], [60, 95], [120, 95],
  [90, 120], [68, 148], [112, 148],
  [47, 122], [133, 122],
]

function FaceScanCard() {
  return (
    <div
      style={{
        background: "rgba(245,237,232,0.035)",
        border: "1px solid rgba(245,237,232,0.09)",
        borderRadius: 24,
        padding: "28px 28px 24px",
        backdropFilter: "blur(24px)",
        WebkitBackdropFilter: "blur(24px)",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Live indicator */}
      <div style={{ position: "absolute", top: 20, right: 20, display: "flex", alignItems: "center", gap: 6 }}>
        <div
          style={{
            width: 6,
            height: 6,
            borderRadius: "50%",
            background: "#7ecba1",
            boxShadow: "0 0 8px rgba(126,203,161,0.9)",
            animation: "pulse-ring 2s ease-in-out infinite",
          }}
        />
        <span style={{ fontSize: 9, letterSpacing: "0.16em", color: "rgba(126,203,161,0.75)", textTransform: "uppercase", fontWeight: 700 }}>
          En vivo
        </span>
      </div>

      {/* Face SVG */}
      <div style={{ display: "flex", justifyContent: "center", marginBottom: 20, position: "relative" }}>
        <svg width="180" height="210" viewBox="0 0 180 210" fill="none">
          {/* Glow */}
          <ellipse cx="90" cy="108" rx="68" ry="86" fill="rgba(232,164,176,0.03)" />

          {/* Face oval dashed */}
          <ellipse
            cx="90" cy="108" rx="62" ry="80"
            stroke="rgba(232,164,176,0.22)"
            strokeWidth="0.8"
            strokeDasharray="4 3"
          />

          {/* Bracket corners */}
          <path d="M28 32 L28 24 L36 24" stroke="#e8a4b0" strokeWidth="1.2" fill="none" strokeLinecap="round" />
          <path d="M144 24 L152 24 L152 32" stroke="#e8a4b0" strokeWidth="1.2" fill="none" strokeLinecap="round" />
          <path d="M28 184 L28 192 L36 192" stroke="#e8a4b0" strokeWidth="1.2" fill="none" strokeLinecap="round" />
          <path d="M152 184 L152 192 L144 192" stroke="#e8a4b0" strokeWidth="1.2" fill="none" strokeLinecap="round" />

          {/* Horizontal scan line */}
          <line x1="28" y1="108" x2="152" y2="108" stroke="#e8a4b0" strokeWidth="0.5" strokeOpacity="0.5">
            <animateTransform
              attributeName="transform"
              type="translate"
              values="0 -70; 0 70; 0 -70"
              dur="4s"
              repeatCount="indefinite"
            />
            <animate attributeName="stroke-opacity" values="0.2; 0.7; 0.2" dur="4s" repeatCount="indefinite" />
          </line>

          {/* Horizontal sweep glow */}
          <rect x="28" y="105" width="124" height="6" fill="url(#scanGlow)" opacity="0.6">
            <animateTransform
              attributeName="transform"
              type="translate"
              values="0 -70; 0 70; 0 -70"
              dur="4s"
              repeatCount="indefinite"
            />
            <animate attributeName="opacity" values="0.1; 0.6; 0.1" dur="4s" repeatCount="indefinite" />
          </rect>
          <defs>
            <linearGradient id="scanGlow" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="rgba(232,164,176,0)" />
              <stop offset="0.5" stopColor="rgba(232,164,176,0.8)" />
              <stop offset="1" stopColor="rgba(232,164,176,0)" />
            </linearGradient>
          </defs>

          {/* Facial landmark points */}
          {FACE_POINTS.map(([cx, cy], i) => (
            <g key={i}>
              <circle cx={cx} cy={cy} r="4" fill="none" stroke="#e8a4b0" strokeWidth="0.8" strokeOpacity="0.4" />
              <circle cx={cx} cy={cy} r="1.5" fill="#e8a4b0" fillOpacity="0.7" />
            </g>
          ))}

          {/* Connection mesh */}
          <polyline points="60,95 90,52 120,95" stroke="#e8a4b0" strokeWidth="0.35" strokeOpacity="0.18" fill="none" />
          <line x1="60" y1="95" x2="47" y2="122" stroke="#e8a4b0" strokeWidth="0.3" strokeOpacity="0.15" />
          <line x1="120" y1="95" x2="133" y2="122" stroke="#e8a4b0" strokeWidth="0.3" strokeOpacity="0.15" />
          <line x1="68" y1="148" x2="112" y2="148" stroke="#e8a4b0" strokeWidth="0.3" strokeOpacity="0.12" />
        </svg>

        {/* Floating tags */}
        <div style={{
          position: "absolute", top: "6%", right: "-4px",
          fontSize: 9, letterSpacing: "0.1em", color: "#7ecba1",
          background: "rgba(14,12,18,0.85)", border: "1px solid rgba(126,203,161,0.25)",
          padding: "3px 9px", borderRadius: 5, whiteSpace: "nowrap", fontWeight: 700,
          backdropFilter: "blur(8px)",
        }}>
          Hidratación 87%
        </div>
        <div style={{
          position: "absolute", bottom: "8%", left: "-4px",
          fontSize: 9, letterSpacing: "0.1em", color: "#e8a4b0",
          background: "rgba(14,12,18,0.85)", border: "1px solid rgba(232,164,176,0.25)",
          padding: "3px 9px", borderRadius: 5, whiteSpace: "nowrap", fontWeight: 700,
          backdropFilter: "blur(8px)",
        }}>
          Inflamación 18%
        </div>
      </div>

      {/* Score row */}
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "14px 18px",
        background: "rgba(245,237,232,0.03)",
        border: "1px solid rgba(245,237,232,0.06)",
        borderRadius: 12,
        marginBottom: 14,
      }}>
        <div>
          <p style={{ fontSize: 8.5, letterSpacing: "0.15em", color: "rgba(245,237,232,0.3)", textTransform: "uppercase", marginBottom: 3 }}>
            Score Global
          </p>
          <div style={{ display: "flex", alignItems: "baseline", gap: 3 }}>
            <span style={{ fontSize: 34, fontFamily: "var(--font-fraunces)", fontWeight: 300, color: "#e8a4b0", lineHeight: 1 }}>84</span>
            <span style={{ fontSize: 12, color: "rgba(245,237,232,0.28)" }}>/100</span>
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <p style={{ fontSize: 8.5, letterSpacing: "0.1em", color: "rgba(245,237,232,0.28)", textTransform: "uppercase", marginBottom: 3 }}>
            Edad aparente
          </p>
          <p style={{ fontFamily: "var(--font-fraunces)", fontSize: 22, color: "#7ecba1", fontWeight: 300, lineHeight: 1 }}>
            27 <span style={{ fontSize: 11, color: "rgba(245,237,232,0.28)", fontFamily: "var(--font-sans)" }}>años</span>
          </p>
          <p style={{ fontSize: 9, color: "rgba(126,203,161,0.65)", marginTop: 2 }}>4 años menos que tu edad real</p>
        </div>
      </div>

      {/* Biomarker bars */}
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {BIOMARKERS.map((b) => (
          <div key={b.label}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
              <span style={{ fontSize: 11, color: "rgba(245,237,232,0.5)" }}>{b.label}</span>
              <span style={{ fontSize: 11, fontWeight: 700, color: b.color }}>{b.value}%</span>
            </div>
            <div style={{ height: 2, background: "rgba(245,237,232,0.06)", borderRadius: 1, overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${b.value}%`, background: b.color, borderRadius: 1 }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export function Hero() {
  const heroRef = useRef<HTMLDivElement>(null)
  const leftRef = useRef<HTMLDivElement>(null)
  const rightRef = useRef<HTMLDivElement>(null)
  const orbRef1 = useRef<HTMLDivElement>(null)
  const orbRef2 = useRef<HTMLDivElement>(null)

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger)

    const ctx = gsap.context(() => {
      // Entrance
      const tl = gsap.timeline({ delay: 0.25 })
      tl.fromTo(
        leftRef.current?.querySelectorAll(".hero-anim") ?? [],
        { opacity: 0, y: 28 },
        { opacity: 1, y: 0, duration: 0.9, stagger: 0.11, ease: "power3.out" }
      ).fromTo(
        rightRef.current,
        { opacity: 0, x: 20, scale: 0.97 },
        { opacity: 1, x: 0, scale: 1, duration: 1, ease: "power2.out" },
        "-=0.65"
      )

      // Floating orbs
      gsap.to(orbRef1.current, { y: -30, x: 15, duration: 6, repeat: -1, yoyo: true, ease: "sine.inOut" })
      gsap.to(orbRef2.current, { y: 20, x: -20, duration: 8, repeat: -1, yoyo: true, ease: "sine.inOut", delay: 1 })

      // Parallax on scroll
      gsap.to(leftRef.current, {
        yPercent: -18,
        ease: "none",
        scrollTrigger: {
          trigger: heroRef.current,
          start: "top top",
          end: "bottom top",
          scrub: 1,
        },
      })
    }, heroRef)

    return () => ctx.revert()
  }, [])

  const handleStart = () => {
    const el = document.querySelector("#face-scroll")
    const lenis = (window as typeof window & { lenis?: { scrollTo: (t: Element, o: object) => void } }).lenis
    if (el && lenis) lenis.scrollTo(el, { duration: 1.6 })
    else el?.scrollIntoView({ behavior: "smooth" })
  }

  return (
    <section
      ref={heroRef}
      style={{
        position: "relative",
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        overflow: "hidden",
        padding: "0 24px",
      }}
    >
      {/* Background radial gradients */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(ellipse 80% 55% at 25% 55%, rgba(232,164,176,0.07) 0%, transparent 60%), " +
            "radial-gradient(ellipse 55% 40% at 85% 60%, rgba(212,175,136,0.05) 0%, transparent 55%)",
          pointerEvents: "none",
        }}
      />

      {/* Top dark gradient — protects nav readability */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          top: 0, left: 0, right: 0,
          height: 130,
          background: "linear-gradient(to bottom, rgba(14,12,18,0.85) 0%, rgba(14,12,18,0.0) 100%)",
          zIndex: 1,
          pointerEvents: "none",
        }}
      />

      {/* Orbs */}
      <div
        ref={orbRef1}
        className="orb orb-rose"
        style={{ width: 580, height: 580, top: "-8%", left: "-12%", position: "absolute" }}
        aria-hidden
      />
      <div
        ref={orbRef2}
        className="orb orb-gold"
        style={{ width: 420, height: 420, bottom: "5%", right: "-6%", position: "absolute" }}
        aria-hidden
      />

      {/* Main grid */}
      <div
        style={{
          position: "relative",
          zIndex: 2,
          width: "100%",
          maxWidth: 1200,
          margin: "0 auto",
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "clamp(40px, 6vw, 96px)",
          alignItems: "center",
          paddingTop: "clamp(80px, 10vh, 100px)",
          paddingBottom: "clamp(60px, 8vh, 80px)",
        }}
        className="hero-grid"
      >
        {/* ── Left: Text ── */}
        <div ref={leftRef} style={{ maxWidth: 560 }}>
          {/* Badge */}
          <div className="hero-anim" style={{ opacity: 0, marginBottom: 20 }}>
            <span className="pill">IA Médica · Análisis Facial</span>
          </div>

          {/* Headline */}
          <h1
            className="display-xl hero-anim"
            style={{ marginBottom: 24, opacity: 0, textAlign: "left", lineHeight: 0.95 }}
          >
            Tu piel tiene
            <br />
            <em style={{ color: "#e8a4b0", fontStyle: "italic" }}>una historia.</em>
            <br />
            Nosotros la leemos.
          </h1>

          {/* Subtitle */}
          <p
            className="hero-anim"
            style={{
              fontSize: "clamp(15px, 1.6vw, 18px)",
              color: "rgba(245,237,232,0.55)",
              maxWidth: 440,
              marginBottom: 36,
              lineHeight: 1.7,
              opacity: 0,
            }}
          >
            Detectamos 12 biomarcadores de tu piel en tiempo real.
            Sin agujas. Sin cita médica.{" "}
            <strong style={{ color: "rgba(245,237,232,0.82)", fontWeight: 500 }}>
              Tu protocolo personalizado en 60 segundos.
            </strong>
          </p>

          {/* CTAs */}
          <div
            className="hero-anim"
            style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 28, opacity: 0 }}
          >
            <button className="btn-rose" onClick={handleStart} style={{ minWidth: 210 }}>
              Analizar mi piel gratis
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            <button className="btn-ghost">Ver cómo funciona</button>
          </div>

          {/* Social proof */}
          <div className="hero-anim" style={{ opacity: 0, display: "flex", flexDirection: "column", gap: 8 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              {/* Avatar stack */}
              <div style={{ display: "flex" }}>
                {["#e8a4b0", "#d4af88", "#7ecba1", "#e8a4b0"].map((c, i) => (
                  <div
                    key={i}
                    style={{
                      width: 26,
                      height: 26,
                      borderRadius: "50%",
                      background: `${c}28`,
                      border: `1.5px solid rgba(14,12,18,0.9)`,
                      marginLeft: i > 0 ? -7 : 0,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 8,
                      color: c,
                      fontWeight: 700,
                      flexShrink: 0,
                    }}
                  >
                    {["V", "C", "S", "A"][i]}
                  </div>
                ))}
              </div>
              <p style={{ fontSize: 12, color: "rgba(245,237,232,0.4)" }}>
                <span style={{ color: "rgba(245,237,232,0.75)", fontWeight: 600 }}>+50.000 pieles</span> ya analizadas
              </p>
            </div>
            <p style={{ fontSize: 10.5, color: "rgba(245,237,232,0.25)", letterSpacing: "0.07em" }}>
              Sin tarjeta · Resultados en 60 segundos · 100% privado
            </p>
          </div>
        </div>

        {/* ── Right: Face scan card ── */}
        <div ref={rightRef} style={{ opacity: 0 }} className="hidden md:block">
          <FaceScanCard />
        </div>
      </div>

      {/* Scroll indicator */}
      <div
        style={{
          position: "absolute",
          bottom: 32,
          left: "50%",
          transform: "translateX(-50%)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 8,
          opacity: 0.35,
          zIndex: 2,
          animation: "fadeIn 1s 2.8s both",
        }}
        aria-hidden
      >
        <span style={{ fontSize: 9, letterSpacing: "0.22em", textTransform: "uppercase" }}>scroll</span>
        <div
          style={{
            width: 1,
            height: 44,
            background: "linear-gradient(to bottom, rgba(245,237,232,0.5), transparent)",
            animation: "scan-line 2s ease-in-out infinite",
          }}
        />
      </div>

      {/* Responsive: 1-col on mobile */}
      <style>{`
        @media (max-width: 768px) {
          .hero-grid {
            grid-template-columns: 1fr !important;
            text-align: center;
          }
          .hero-grid h1 { text-align: center !important; }
          .hero-grid .hidden { display: none !important; }
        }
      `}</style>
    </section>
  )
}
