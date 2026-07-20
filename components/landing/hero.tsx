"use client"

import { useEffect, useRef } from "react"
import { gsap } from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"

const MARKERS = [
  "Luminosidad", "Hidratación", "Uniformidad", "Salud del colágeno",
  "Control de inflamación", "Protección solar", "Salud vascular",
  "Frente", "Contorno ocular", "Mejillas", "Zona T", "Mandíbula",
]

export function Hero() {
  const heroRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const orbRef1 = useRef<HTMLDivElement>(null)
  const orbRef2 = useRef<HTMLDivElement>(null)

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger)

    const ctx = gsap.context(() => {
      // Staggered entrance
      const tl = gsap.timeline({ delay: 0.2 })
      tl.fromTo(
        contentRef.current?.querySelectorAll(".hero-anim") ?? [],
        { opacity: 0, y: 32, filter: "blur(4px)" },
        {
          opacity: 1,
          y: 0,
          filter: "blur(0px)",
          duration: 0.9,
          stagger: 0.12,
          ease: "power3.out",
        }
      )

      // Floating orbs
      gsap.to(orbRef1.current, { y: -30, x: 12, duration: 7, repeat: -1, yoyo: true, ease: "sine.inOut" })
      gsap.to(orbRef2.current, { y: 20, x: -18, duration: 9, repeat: -1, yoyo: true, ease: "sine.inOut", delay: 1.5 })

      // Parallax on scroll
      gsap.to(contentRef.current, {
        yPercent: -12,
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
    window.location.href = "/analyze"
  }

  const handleHowItWorks = () => {
    const el = document.querySelector("#how")
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
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
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
            "radial-gradient(ellipse 70% 55% at 30% 45%, rgba(232,164,176,0.09) 0%, transparent 60%), " +
            "radial-gradient(ellipse 50% 40% at 75% 65%, rgba(212,175,136,0.06) 0%, transparent 55%)",
          pointerEvents: "none",
        }}
      />

      {/* Top dark gradient — protects nav readability */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          top: 0, left: 0, right: 0,
          height: 140,
          background: "linear-gradient(to bottom, rgba(14,12,18,0.9) 0%, transparent 100%)",
          zIndex: 1,
          pointerEvents: "none",
        }}
      />

      {/* Orbs */}
      <div
        ref={orbRef1}
        className="orb orb-rose"
        style={{ width: 640, height: 640, top: "-10%", left: "-15%", position: "absolute" }}
        aria-hidden
      />
      <div
        ref={orbRef2}
        className="orb orb-gold"
        style={{ width: 460, height: 460, bottom: "2%", right: "-8%", position: "absolute" }}
        aria-hidden
      />

      {/* Main content — centered */}
      <div
        ref={contentRef}
        style={{
          position: "relative",
          zIndex: 2,
          width: "100%",
          maxWidth: 780,
          margin: "0 auto",
          textAlign: "center",
          paddingTop: "clamp(80px, 12vh, 120px)",
          paddingBottom: "clamp(48px, 8vh, 72px)",
        }}
      >
        {/* Badge */}
        <div className="hero-anim" style={{ opacity: 0, marginBottom: 28 }}>
          <span className="pill">Análisis facial en 60 segundos</span>
        </div>

        {/* Headline */}
        <h1
          className="display-xl hero-anim"
          style={{
            opacity: 0,
            marginBottom: 28,
            lineHeight: 0.95,
            textAlign: "center",
          }}
        >
          ¿Qué edad
          <br />
          <em style={{ color: "#e8a4b0", fontStyle: "italic" }}>aparentas?</em>
          <br />
          Descúbrelo gratis.
        </h1>

        {/* Divider */}
        <div
          className="hero-anim"
          style={{
            opacity: 0,
            width: 48,
            height: 1,
            background: "rgba(232,164,176,0.35)",
            margin: "0 auto 28px",
          }}
        />

        {/* Subtitle */}
        <p
          className="hero-anim"
          style={{
            fontSize: "clamp(15px, 1.7vw, 18px)",
            color: "rgba(245,237,232,0.52)",
            maxWidth: 560,
            margin: "0 auto 40px",
            lineHeight: 1.78,
            opacity: 0,
          }}
        >
          Tu rostro dice una edad. A veces coincide con la tuya. A veces no.{" "}
          <strong style={{ color: "rgba(245,237,232,0.88)", fontWeight: 500 }}>
            Escaneamos tu cara y te decimos qué edad aparentas — y qué hacer para mantenerla o mejorarla.
          </strong>{" "}
          60 segundos. Una selfie. Sin compromiso.
        </p>

        {/* CTAs */}
        <div
          className="hero-anim"
          style={{
            display: "flex",
            justifyContent: "center",
            gap: 12,
            flexWrap: "wrap",
            marginBottom: 32,
            opacity: 0,
          }}
        >
          <button className="btn-rose" onClick={handleStart} style={{ minWidth: 220 }}>
            Descubrir qué edad aparento
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <button className="btn-ghost" onClick={handleHowItWorks}>Ver cómo funciona</button>
        </div>

        {/* Social proof */}
        <div
          className="hero-anim"
          style={{
            opacity: 0,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 10,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            {/* Avatar stack */}
            <div style={{ display: "flex" }}>
              {["#e8a4b0", "#d4af88", "#7ecba1", "#e8a4b0"].map((c, i) => (
                <div
                  key={i}
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: "50%",
                    background: `${c}28`,
                    border: `1.5px solid rgba(14,12,18,0.9)`,
                    marginLeft: i > 0 ? -8 : 0,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 9,
                    color: c,
                    fontWeight: 700,
                    flexShrink: 0,
                  }}
                >
                  {["V", "C", "S", "A"][i]}
                </div>
              ))}
            </div>
            <p style={{ fontSize: 12.5, color: "rgba(245,237,232,0.42)" }}>
              <span style={{ color: "rgba(245,237,232,0.8)", fontWeight: 600 }}>+50.000 personas</span> ya saben qué edad aparentan
            </p>
          </div>
          <p style={{ fontSize: 10.5, color: "rgba(245,237,232,0.22)", letterSpacing: "0.08em" }}>
            Sin tarjeta · Resultado en 60 segundos · 100% privado
          </p>
        </div>
      </div>

      {/* Biomarker ticker strip */}
      <div
        className="hero-anim"
        style={{
          position: "relative",
          zIndex: 2,
          width: "100%",
          overflow: "hidden",
          paddingBottom: "clamp(32px, 6vh, 60px)",
          opacity: 0,
          WebkitMaskImage: "linear-gradient(to right, transparent, black 12%, black 88%, transparent)",
          maskImage: "linear-gradient(to right, transparent, black 12%, black 88%, transparent)",
        }}
      >
        <div className="biomarker-track">
          {[...MARKERS, ...MARKERS].map((m, i) => (
            <span
              key={i}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                padding: "6px 16px",
                marginRight: 10,
                border: "1px solid rgba(245,237,232,0.08)",
                borderRadius: 99,
                fontSize: 10.5,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                color: "rgba(245,237,232,0.3)",
                whiteSpace: "nowrap",
                background: "rgba(245,237,232,0.025)",
              }}
            >
              <span
                style={{
                  width: 4,
                  height: 4,
                  borderRadius: "50%",
                  background: i % 3 === 0 ? "#e8a4b0" : i % 3 === 1 ? "#d4af88" : "#7ecba1",
                  flexShrink: 0,
                  opacity: 0.7,
                }}
              />
              {m}
            </span>
          ))}
        </div>
      </div>

      {/* Scroll indicator */}
      <div
        style={{
          position: "absolute",
          bottom: 28,
          left: "50%",
          transform: "translateX(-50%)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 8,
          opacity: 0.28,
          zIndex: 2,
          animation: "fadeIn 1s 3s both",
        }}
        aria-hidden
      >
        <span style={{ fontSize: 9, letterSpacing: "0.24em", textTransform: "uppercase" }}>scroll</span>
        <div
          style={{
            width: 1,
            height: 44,
            background: "linear-gradient(to bottom, rgba(245,237,232,0.6), transparent)",
            animation: "scan-line 2s ease-in-out infinite",
          }}
        />
      </div>

      <style>{`
        @keyframes biomarker-scroll {
          from { transform: translateX(0); }
          to   { transform: translateX(-50%); }
        }
        .biomarker-track {
          display: inline-flex;
          animation: biomarker-scroll 30s linear infinite;
          will-change: transform;
        }
      `}</style>
    </section>
  )
}
