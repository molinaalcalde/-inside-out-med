"use client"

import { useEffect, useRef } from "react"
import { gsap } from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"

const STEPS = [
  {
    n: "01",
    title: "Una selfie. Sin filtros.",
    body: "Usa tu cámara frontal con luz natural. Sin maquillaje si puedes. Treinta segundos de tu tiempo.",
    accent: "#e8a4b0",
  },
  {
    n: "02",
    title: "Escaneamos 12 zonas clave",
    body: "Hidratación, elasticidad, melanina, inflamación, poros, textura y 6 biomarcadores más. Zona por zona. Sin adivinar.",
    accent: "#d4af88",
  },
  {
    n: "03",
    title: "Tu informe, sin tecnicismos",
    body: "Puntuaciones por área, causas probables y comparativa con tu grupo de edad. Visual, directo, accionable.",
    accent: "#7ecba1",
  },
  {
    n: "04",
    title: "Tu protocolo, solo tuyo",
    body: "Ingredientes activos, rutinas y productos ordenados por urgencia. Adaptados a lo que encontramos en tu piel.",
    accent: "#e8a4b0",
  },
]

export function HowItWorks() {
  const sectionRef = useRef<HTMLDivElement>(null)
  const lineRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger)

    const steps = sectionRef.current?.querySelectorAll(".step-item")
    if (!steps) return

    // Stagger step items
    gsap.fromTo(
      steps,
      { opacity: 0, x: -32 },
      {
        opacity: 1,
        x: 0,
        duration: 0.85,
        stagger: 0.18,
        ease: "power3.out",
        scrollTrigger: { trigger: sectionRef.current, start: "top 75%" },
      }
    )

    // Animated line fill
    if (lineRef.current) {
      gsap.fromTo(
        lineRef.current,
        { scaleY: 0, transformOrigin: "top center" },
        {
          scaleY: 1,
          duration: 1.4,
          ease: "power2.out",
          scrollTrigger: { trigger: sectionRef.current, start: "top 75%" },
        }
      )
    }
  }, [])

  return (
    <section id="how" ref={sectionRef} className="section">
      <div className="container">
        {/* Header */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 16,
            maxWidth: 520,
            marginBottom: 80,
          }}
        >
          <p className="pill" style={{ alignSelf: "flex-start" }}>Proceso</p>
          <h2 className="display-lg">
            De tu selfie
            <br />
            <em style={{ color: "#e8a4b0", fontStyle: "italic" }}>a tu protocolo</em>
            <br />
            en 60 segundos.
          </h2>
          <p style={{ fontSize: 15, color: "rgba(245,237,232,0.45)", lineHeight: 1.75, maxWidth: 420 }}>
            Sin citas, sin laboratorios. Precisión clínica, ahora en tu bolsillo.
          </p>
        </div>

        {/* Vertical timeline */}
        <div style={{ position: "relative", paddingLeft: "clamp(64px, 10vw, 96px)" }}>
          {/* The line */}
          <div
            style={{
              position: "absolute",
              left: "clamp(26px, 4vw, 38px)",
              top: 8,
              bottom: 8,
              width: 1,
              background: "rgba(245,237,232,0.06)",
            }}
          >
            <div
              ref={lineRef}
              style={{
                position: "absolute",
                inset: 0,
                background: "linear-gradient(to bottom, rgba(232,164,176,0.4), rgba(212,175,136,0.25), rgba(126,203,161,0.2), transparent)",
                transformOrigin: "top center",
                scaleY: 0,
              }}
            />
          </div>

          {STEPS.map((step, i) => (
            <div
              key={i}
              className="step-item"
              style={{
                position: "relative",
                display: "flex",
                gap: "clamp(24px, 4vw, 48px)",
                paddingBottom: i < STEPS.length - 1 ? "clamp(48px, 7vw, 80px)" : 0,
                opacity: 0,
              }}
            >
              {/* Dot on the line */}
              <div
                style={{
                  position: "absolute",
                  left: "calc(clamp(26px, 4vw, 38px) - clamp(64px, 10vw, 96px) + 1px)",
                  top: 4,
                  transform: "translateX(-50%)",
                  width: 14,
                  height: 14,
                  borderRadius: "50%",
                  background: "#0e0c12",
                  border: `1.5px solid ${step.accent}`,
                  boxShadow: `0 0 12px ${step.accent}40`,
                  zIndex: 1,
                }}
              />

              {/* Content */}
              <div style={{ flex: 1 }}>
                {/* Watermark number */}
                <div style={{ position: "relative", marginBottom: 12 }}>
                  <span
                    style={{
                      fontFamily: "var(--font-fraunces)",
                      fontSize: "clamp(56px, 10vw, 96px)",
                      fontWeight: 400,
                      fontStyle: "italic",
                      letterSpacing: "-0.04em",
                      lineHeight: 0.85,
                      color: "rgba(245,237,232,0.04)",
                      userSelect: "none",
                      position: "absolute",
                      top: 0,
                      left: -8,
                      pointerEvents: "none",
                    }}
                    aria-hidden
                  >
                    {step.n}
                  </span>

                  <p
                    style={{
                      fontSize: 9,
                      letterSpacing: "0.22em",
                      textTransform: "uppercase",
                      color: step.accent,
                      fontWeight: 700,
                      opacity: 0.65,
                      paddingTop: 4,
                    }}
                  >
                    Paso {step.n}
                  </p>
                </div>

                <h3
                  style={{
                    fontFamily: "var(--font-fraunces)",
                    fontSize: "clamp(20px, 2.8vw, 28px)",
                    fontWeight: 400,
                    letterSpacing: "-0.02em",
                    color: "#f5ede8",
                    lineHeight: 1.2,
                    marginBottom: 14,
                  }}
                >
                  {step.title}
                </h3>

                <p
                  style={{
                    fontSize: 15,
                    color: "rgba(245,237,232,0.48)",
                    lineHeight: 1.75,
                    maxWidth: 480,
                  }}
                >
                  {step.body}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
