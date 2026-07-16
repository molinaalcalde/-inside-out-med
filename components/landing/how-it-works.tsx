"use client"

import { useEffect, useRef } from "react"
import { gsap } from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"

const STEPS = [
  {
    n: "01",
    title: "Toma una selfie",
    body: "Usa tu cámara frontal. Sin maquillaje idealmente. Solo tú, con luz natural.",
    icon: (
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
        <rect x="2" y="6" width="24" height="18" rx="3" stroke="#e8a4b0" strokeWidth="1.4" />
        <circle cx="14" cy="15" r="5" stroke="#e8a4b0" strokeWidth="1.4" />
        <path d="M10 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" stroke="#e8a4b0" strokeWidth="1.4" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    n: "02",
    title: "IA analiza 12 zonas",
    body: "Nuestro modelo detecta hidratación, inflamación, melanina, elasticidad y más biomarcadores.",
    icon: (
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
        <path d="M14 2 L26 8 L26 20 L14 26 L2 20 L2 8 Z" stroke="#d4af88" strokeWidth="1.4" strokeLinejoin="round" />
        <circle cx="14" cy="14" r="4" stroke="#d4af88" strokeWidth="1.4" />
        <path d="M14 10 V6 M14 22 v-4 M10 14 H6 M22 14 h-4" stroke="#d4af88" strokeWidth="1.2" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    n: "03",
    title: "Recibe tu diagnóstico",
    body: "Un reporte claro con puntuaciones por zona, causas probables y comparativa con tu edad.",
    icon: (
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
        <rect x="5" y="2" width="18" height="24" rx="3" stroke="#7ecba1" strokeWidth="1.4" />
        <path d="M9 9h10 M9 14h10 M9 19h6" stroke="#7ecba1" strokeWidth="1.4" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    n: "04",
    title: "Tu plan personalizado",
    body: "Rutinas, ingredientes activos y tratamientos ordenados por prioridad. Adaptados a tu perfil.",
    icon: (
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
        <path d="M14 2 L18 10 L27 11 L20 18 L22 27 L14 23 L6 27 L8 18 L1 11 L10 10 Z" stroke="#e8a4b0" strokeWidth="1.4" strokeLinejoin="round" />
      </svg>
    ),
  },
]

export function HowItWorks() {
  const sectionRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger)

    const cards = sectionRef.current?.querySelectorAll(".step-card")
    if (!cards) return

    gsap.fromTo(
      cards,
      { opacity: 0, x: -30 },
      {
        opacity: 1,
        x: 0,
        duration: 0.9,
        stagger: 0.15,
        ease: "power3.out",
        scrollTrigger: { trigger: sectionRef.current, start: "top 75%" },
      }
    )
  }, [])

  return (
    <section id="how" ref={sectionRef} className="section">
      <div className="container">
        {/* Header */}
        <div style={{ maxWidth: 560, marginBottom: 72 }}>
          <p className="pill" style={{ marginBottom: 20 }}>Proceso</p>
          <h2 className="display-lg" style={{ marginBottom: 20 }}>
            De tu selfie
            <br />
            <em style={{ color: "#e8a4b0", fontStyle: "italic" }}>a tu protocolo</em>
            <br />
            en 60 segundos.
          </h2>
          <p style={{ fontSize: 16, color: "rgba(245,237,232,0.5)", lineHeight: 1.7, maxWidth: 440 }}>
            Sin citas, sin laboratorios. La misma tecnología usada en clínicas premium, ahora en tu bolsillo.
          </p>
        </div>

        {/* Steps grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
            gap: 2,
            position: "relative",
          }}
        >
          {/* Connector line */}
          <div
            aria-hidden
            style={{
              position: "absolute",
              top: 48,
              left: "12.5%",
              right: "12.5%",
              height: 1,
              background: "linear-gradient(to right, transparent, rgba(245,237,232,0.08), transparent)",
            }}
          />

          {STEPS.map((step, i) => (
            <div
              key={i}
              className="step-card"
              style={{
                padding: "40px 32px",
                borderLeft: "1px solid rgba(245,237,232,0.06)",
                position: "relative",
                opacity: 0,
              }}
            >
              {/* Number */}
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: "50%",
                  border: "1px solid rgba(245,237,232,0.12)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: 24,
                  position: "relative",
                }}
              >
                {step.icon}
              </div>

              <p
                style={{
                  fontSize: 10,
                  letterSpacing: "0.2em",
                  textTransform: "uppercase",
                  color: "rgba(245,237,232,0.25)",
                  fontWeight: 700,
                  marginBottom: 10,
                }}
              >
                {step.n}
              </p>

              <h3
                style={{
                  fontFamily: "var(--font-fraunces)",
                  fontSize: 22,
                  fontWeight: 400,
                  letterSpacing: "-0.02em",
                  marginBottom: 12,
                  color: "#f5ede8",
                  lineHeight: 1.2,
                }}
              >
                {step.title}
              </h3>

              <p style={{ fontSize: 14, color: "rgba(245,237,232,0.5)", lineHeight: 1.7 }}>
                {step.body}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
