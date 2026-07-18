"use client"

import { useEffect, useRef } from "react"
import { gsap } from "gsap"

export function Hero() {
  const heroRef = useRef<HTMLDivElement>(null)
  const headlineRef = useRef<HTMLHeadingElement>(null)
  const subRef = useRef<HTMLParagraphElement>(null)
  const pillRef = useRef<HTMLDivElement>(null)
  const ctaRef = useRef<HTMLDivElement>(null)
  const orbRef1 = useRef<HTMLDivElement>(null)
  const orbRef2 = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Entrance timeline
      const tl = gsap.timeline({ delay: 0.2 })

      tl.fromTo(
          headlineRef.current,
          { opacity: 0, y: 40 },
          { opacity: 1, y: 0, duration: 1.0, ease: "power3.out" },
          "-=0.4"
        )
        .fromTo(
          subRef.current,
          { opacity: 0, y: 24 },
          { opacity: 1, y: 0, duration: 0.8, ease: "power2.out" },
          "-=0.5"
        )
        .fromTo(
          ctaRef.current,
          { opacity: 0, y: 20 },
          { opacity: 1, y: 0, duration: 0.7, ease: "power2.out" },
          "-=0.4"
        )

      // Floating orbs
      gsap.to(orbRef1.current, {
        y: -30,
        x: 15,
        duration: 6,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
      })
      gsap.to(orbRef2.current, {
        y: 20,
        x: -20,
        duration: 8,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
        delay: 1,
      })

      // Parallax on scroll
      gsap.to(headlineRef.current, {
        yPercent: -25,
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
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        overflow: "hidden",
        padding: "120px 24px 80px",
      }}
    >
      {/* Background gradient */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(ellipse 80% 60% at 50% 0%, rgba(232,164,176,0.08) 0%, transparent 60%), radial-gradient(ellipse 60% 40% at 80% 80%, rgba(212,175,136,0.06) 0%, transparent 50%)",
          pointerEvents: "none",
        }}
      />

      {/* Orbs */}
      <div
        ref={orbRef1}
        className="orb orb-rose"
        style={{ width: 500, height: 500, top: "5%", left: "-10%", position: "absolute" }}
        aria-hidden
      />
      <div
        ref={orbRef2}
        className="orb orb-gold"
        style={{ width: 400, height: 400, bottom: "10%", right: "-8%", position: "absolute" }}
        aria-hidden
      />

      {/* Content */}
      <div style={{ position: "relative", zIndex: 2, maxWidth: 820 }}>
        {/* Headline */}
        <h1
          ref={headlineRef}
          className="display-xl"
          style={{ marginBottom: 28, opacity: 0 }}
        >
          Tu piel tiene
          <br />
          <em style={{ color: "#e8a4b0", fontStyle: "italic" }}>una historia.</em>
          <br />
          Nosotros la leemos.
        </h1>

        {/* Sub */}
        <p
          ref={subRef}
          style={{
            fontSize: "clamp(16px, 2vw, 20px)",
            color: "rgba(245,237,232,0.65)",
            maxWidth: 560,
            margin: "0 auto 44px",
            lineHeight: 1.65,
            opacity: 0,
          }}
        >
          Análisis visual de 12 biomarcadores. Sin agujas, sin esperas.
          Tu plan personalizado en menos de 60 segundos.
        </p>

        {/* CTAs */}
        <div
          ref={ctaRef}
          style={{
            display: "flex",
            gap: 14,
            justifyContent: "center",
            flexWrap: "wrap",
            opacity: 0,
          }}
        >
          <button className="btn-rose" onClick={handleStart} style={{ minWidth: 200 }}>
            Analizar mi piel gratis
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <button className="btn-ghost">
            Ver cómo funciona
          </button>
        </div>

        {/* Trust line */}
        <p
          style={{
            marginTop: 40,
            fontSize: 12,
            color: "rgba(245,237,232,0.35)",
            letterSpacing: "0.08em",
          }}
        >
          Sin tarjeta de crédito · Resultados en 60 segundos · 100% privado
        </p>
      </div>

      {/* Scroll indicator */}
      <div
        style={{
          position: "absolute",
          bottom: 36,
          left: "50%",
          transform: "translateX(-50%)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 8,
          opacity: 0.4,
          animation: "fadeIn 1s 2s both",
        }}
        aria-hidden
      >
        <span style={{ fontSize: 10, letterSpacing: "0.2em", textTransform: "uppercase" }}>scroll</span>
        <div
          style={{
            width: 1,
            height: 48,
            background: "linear-gradient(to bottom, rgba(245,237,232,0.5), transparent)",
            animation: "scan-line 2s ease-in-out infinite",
          }}
        />
      </div>
    </section>
  )
}
