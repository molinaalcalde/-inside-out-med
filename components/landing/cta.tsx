"use client"

import { useEffect, useRef } from "react"
import { gsap } from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"

export function CTA() {
  const sectionRef = useRef<HTMLDivElement>(null)
  const btnRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger)

    gsap.fromTo(
      sectionRef.current?.querySelectorAll(".cta-anim") ?? [],
      { opacity: 0, y: 40 },
      {
        opacity: 1,
        y: 0,
        duration: 1,
        stagger: 0.15,
        ease: "power3.out",
        scrollTrigger: { trigger: sectionRef.current, start: "top 75%" },
      }
    )

    // Magnetic button effect
    const btn = btnRef.current
    if (!btn) return

    const handleMouseMove = (e: MouseEvent) => {
      const rect = btn.getBoundingClientRect()
      const x = e.clientX - rect.left - rect.width / 2
      const y = e.clientY - rect.top - rect.height / 2
      gsap.to(btn, { x: x * 0.3, y: y * 0.3, duration: 0.4, ease: "power2.out" })
    }

    const handleMouseLeave = () => {
      gsap.to(btn, { x: 0, y: 0, duration: 0.6, ease: "elastic.out(1, 0.5)" })
    }

    btn.addEventListener("mousemove", handleMouseMove)
    btn.addEventListener("mouseleave", handleMouseLeave)

    return () => {
      btn.removeEventListener("mousemove", handleMouseMove)
      btn.removeEventListener("mouseleave", handleMouseLeave)
    }
  }, [])

  return (
    <section
      id="cta"
      ref={sectionRef}
      className="section"
      style={{
        position: "relative",
        overflow: "hidden",
        textAlign: "center",
      }}
    >
      {/* Background glow */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(ellipse 70% 60% at 50% 50%, rgba(232,164,176,0.08) 0%, transparent 65%)",
          pointerEvents: "none",
        }}
      />

      {/* Orbiting ring */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: 600,
          height: 600,
          borderRadius: "50%",
          border: "1px solid rgba(232,164,176,0.06)",
          animation: "grain 20s linear infinite",
          pointerEvents: "none",
        }}
      />
      <div
        aria-hidden
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: 400,
          height: 400,
          borderRadius: "50%",
          border: "1px solid rgba(212,175,136,0.06)",
          pointerEvents: "none",
        }}
      />

      <div className="container" style={{ position: "relative", zIndex: 2 }}>
        <div className="cta-anim" style={{ marginBottom: 24, opacity: 0 }}>
          <span className="pill">Gratis · Sin tarjeta · 60 segundos</span>
        </div>

        <h2
          className="display-xl cta-anim"
          style={{ marginBottom: 24, opacity: 0, maxWidth: 700, margin: "0 auto 24px" }}
        >
          ¿Qué edad
          <br />
          <em style={{ color: "#e8a4b0", fontStyle: "italic" }}>aparentas realmente?</em>
        </h2>

        <p
          className="cta-anim"
          style={{
            fontSize: "clamp(15px, 2vw, 18px)",
            color: "rgba(245,237,232,0.5)",
            marginBottom: 48,
            maxWidth: 440,
            margin: "0 auto 48px",
            lineHeight: 1.7,
            opacity: 0,
          }}
        >
          Una selfie. Descubre qué edad aparentas. Y qué hacer para verte más joven.
        </p>

        <div
          className="cta-anim"
          style={{ display: "flex", justifyContent: "center", gap: 14, flexWrap: "wrap", opacity: 0 }}
        >
          <button
            ref={btnRef}
            className="btn-rose"
            style={{ fontSize: 16, padding: "18px 48px", minWidth: 240 }}
            onClick={() => window.location.href = '/analyze'}
          >
            Descubrir qué edad aparento
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M3.5 9h11M10 4.5l4.5 4.5L10 13.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>

        <p
          className="cta-anim"
          style={{
            marginTop: 24,
            fontSize: 12,
            color: "rgba(245,237,232,0.25)",
            letterSpacing: "0.08em",
            opacity: 0,
          }}
        >
          +50.000 personas ya saben qué edad aparentan · 100% privado
        </p>
      </div>
    </section>
  )
}
