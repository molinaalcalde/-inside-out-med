"use client"

import { useEffect, useRef } from "react"
import { gsap } from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"

const STATS = [
  { value: 50000, label: "Análisis realizados", suffix: "+", color: "#e8a4b0" },
  { value: 12, label: "Biomarcadores faciales", suffix: "", color: "#d4af88" },
  { value: 60, label: "Segundos al resultado", suffix: "", color: "#7ecba1" },
  { value: 97, label: "Tasa de satisfacción", suffix: "%", color: "#e8a4b0" },
]

function Counter({ value, suffix, color }: { value: number; suffix: string; color: string }) {
  const ref = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger)
    const el = ref.current
    if (!el) return

    const obj = { val: 0 }
    const anim = gsap.to(obj, {
      val: value,
      duration: 1.8,
      ease: "power2.out",
      paused: true,
      onUpdate: () => {
        el.textContent = Math.round(obj.val).toLocaleString("es") + suffix
      },
    })

    ScrollTrigger.create({
      trigger: el,
      start: "top 85%",
      once: true,
      onEnter: () => anim.play(),
    })

    return () => { anim.kill() }
  }, [value, suffix])

  return (
    <span
      ref={ref}
      style={{
        fontFamily: "var(--font-fraunces)",
        fontSize: "clamp(40px, 5vw, 72px)",
        fontWeight: 400,
        letterSpacing: "-0.04em",
        lineHeight: 1,
        color,
      }}
    >
      0{suffix}
    </span>
  )
}

export function Stats() {
  const sectionRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger)
    const cards = sectionRef.current?.querySelectorAll(".stat-card")
    if (!cards) return

    gsap.fromTo(
      cards,
      { opacity: 0, y: 40 },
      {
        opacity: 1,
        y: 0,
        duration: 0.8,
        stagger: 0.12,
        ease: "power3.out",
        scrollTrigger: { trigger: sectionRef.current, start: "top 80%" },
      }
    )
  }, [])

  return (
    <section
      id="results"
      ref={sectionRef}
      className="section"
      style={{ background: "linear-gradient(180deg, #0e0c12 0%, #120f18 50%, #0e0c12 100%)" }}
    >
      <div className="container">
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: 2,
          }}
        >
          {STATS.map((stat, i) => (
            <div
              key={i}
              className="stat-card"
              style={{
                padding: "48px 32px",
                borderLeft: i > 0 ? "1px solid rgba(245,237,232,0.06)" : "none",
                textAlign: "center",
                opacity: 0,
              }}
            >
              <Counter value={stat.value} suffix={stat.suffix} color={stat.color} />
              <p
                style={{
                  marginTop: 12,
                  fontSize: 13,
                  color: "rgba(245,237,232,0.45)",
                  fontWeight: 500,
                  letterSpacing: "0.03em",
                }}
              >
                {stat.label}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
