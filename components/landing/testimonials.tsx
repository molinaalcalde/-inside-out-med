"use client"

import { useEffect, useRef } from "react"
import { gsap } from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"

const TESTIMONIALS = [
  {
    quote: "Nunca pensé que una app me iba a decir exactamente qué estaba mal con mi piel. El informe fue más claro que el del dermatólogo.",
    name: "Valentina M.",
    role: "Médica, 34 años",
    score: "91/100",
    avatar: "VM",
    color: "#e8a4b0",
  },
  {
    quote: "Seguí el plan 6 semanas. Mis manchas bajaron notablemente. Nunca había entendido tan bien mi rutina de skincare.",
    name: "Camila R.",
    role: "Nutricionista, 29 años",
    score: "88/100",
    avatar: "CR",
    color: "#d4af88",
  },
  {
    quote: "Lo que más me sorprendió fue la precisión por zonas. Exactamente donde yo notaba los problemas, el análisis lo marcó.",
    name: "Sofía L.",
    role: "Arquitecta, 41 años",
    score: "76/100",
    avatar: "SL",
    color: "#7ecba1",
  },
  {
    quote: "En mi clínica usamos esto como pre-screening. Ahorra tiempo y los pacientes llegan con información real.",
    name: "Dra. Andrea P.",
    role: "Dermatóloga",
    score: "94/100",
    avatar: "AP",
    color: "#e8a4b0",
  },
]

export function Testimonials() {
  const sectionRef = useRef<HTMLDivElement>(null)
  const trackRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger)

    const cards = sectionRef.current?.querySelectorAll(".t-card")
    if (!cards) return

    gsap.fromTo(
      cards,
      { opacity: 0, y: 50, scale: 0.95 },
      {
        opacity: 1,
        y: 0,
        scale: 1,
        duration: 0.9,
        stagger: 0.12,
        ease: "power3.out",
        scrollTrigger: { trigger: sectionRef.current, start: "top 80%" },
      }
    )
  }, [])

  return (
    <section id="testimonials" ref={sectionRef} className="section">
      <div className="container">
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 64 }}>
          <p className="pill" style={{ marginBottom: 20 }}>Testimonios</p>
          <h2 className="display-lg">
            Lo que dicen
            <br />
            <em style={{ color: "#e8a4b0", fontStyle: "italic" }}>las que ya lo probaron</em>
          </h2>
        </div>

        {/* Cards */}
        <div
          ref={trackRef}
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: 16,
          }}
        >
          {TESTIMONIALS.map((t, i) => (
            <div
              key={i}
              className="t-card glass-card"
              style={{
                padding: "32px 28px",
                opacity: 0,
                display: "flex",
                flexDirection: "column",
                gap: 0,
                transition: "border-color 0.2s",
                cursor: "default",
              }}
              onMouseEnter={(e) => {
                ;(e.currentTarget as HTMLElement).style.borderColor = "rgba(232,164,176,0.2)"
              }}
              onMouseLeave={(e) => {
                ;(e.currentTarget as HTMLElement).style.borderColor = "rgba(245,237,232,0.10)"
              }}
            >
              {/* Stars */}
              <div style={{ display: "flex", gap: 3, marginBottom: 20 }}>
                {[...Array(5)].map((_, si) => (
                  <svg key={si} width="12" height="12" viewBox="0 0 12 12" fill="#d4af88">
                    <path d="M6 1l1.5 3 3.2.5-2.3 2.2.5 3.3L6 8.5l-2.9 1.5.5-3.3L1.3 4.5l3.2-.5L6 1z" />
                  </svg>
                ))}
              </div>

              {/* Quote */}
              <p
                style={{
                  fontSize: 15,
                  color: "rgba(245,237,232,0.8)",
                  lineHeight: 1.7,
                  flex: 1,
                  marginBottom: 28,
                  fontStyle: "italic",
                }}
              >
                &ldquo;{t.quote}&rdquo;
              </p>

              {/* Author */}
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: "50%",
                    background: `${t.color}22`,
                    border: `1px solid ${t.color}40`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 11,
                    fontWeight: 700,
                    color: t.color,
                    flexShrink: 0,
                  }}
                >
                  {t.avatar}
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontWeight: 600, fontSize: 13, color: "#f5ede8", marginBottom: 2 }}>
                    {t.name}
                  </p>
                  <p style={{ fontSize: 11, color: "rgba(245,237,232,0.4)" }}>{t.role}</p>
                </div>
                <div
                  style={{
                    padding: "4px 10px",
                    borderRadius: 99,
                    background: `${t.color}15`,
                    border: `1px solid ${t.color}30`,
                    fontSize: 11,
                    fontWeight: 700,
                    color: t.color,
                  }}
                >
                  {t.score}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Press logos */}
        <div
          style={{
            marginTop: 80,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "clamp(24px, 4vw, 60px)",
            flexWrap: "wrap",
          }}
        >
          <p
            style={{
              fontSize: 10,
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              color: "rgba(245,237,232,0.25)",
              fontWeight: 700,
            }}
          >
            Mencionado en
          </p>
          {["Forbes Health", "MIT Review", "Vogue Méx", "W Salud", "TechCrunch"].map((p) => (
            <span
              key={p}
              style={{
                fontFamily: "var(--font-fraunces)",
                fontSize: "clamp(13px, 1.8vw, 18px)",
                color: "rgba(245,237,232,0.18)",
                fontWeight: 400,
                letterSpacing: "-0.01em",
              }}
            >
              {p}
            </span>
          ))}
        </div>
      </div>
    </section>
  )
}
