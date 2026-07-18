"use client"

import { useEffect, useRef } from "react"
import { gsap } from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"

const STATS = [
  {
    value: 50000,
    display: "50.000",
    suffix: "+",
    label: "análisis de piel realizados en beta privada",
    note: "y contando",
  },
  {
    value: 12,
    display: "12",
    suffix: "",
    label: "biomarcadores faciales detectados en tiempo real",
    note: "por escáner",
  },
  {
    value: 60,
    display: "60",
    suffix: "s",
    label: "de tu selfie a un plan de skincare completo",
    note: "sin citas",
  },
  {
    value: 97,
    display: "97",
    suffix: "%",
    label: "de precisión en análisis de zonas faciales",
    note: "validado clínicamente",
  },
]

function Counter({
  value,
  display,
  suffix,
}: {
  value: number
  display: string
  suffix: string
}) {
  const ref = useRef<HTMLSpanElement>(null)
  const animated = useRef(false)

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
        if (!ref.current) return
        const v = Math.round(obj.val)
        ref.current.textContent =
          value >= 1000 ? v.toLocaleString("es") + suffix : v + suffix
      },
    })

    ScrollTrigger.create({
      trigger: el,
      start: "top 88%",
      once: true,
      onEnter: () => {
        if (!animated.current) {
          animated.current = true
          anim.play()
        }
      },
    })

    return () => { anim.kill() }
  }, [value, display, suffix])

  return (
    <span ref={ref} style={{ display: "inline" }}>
      {display}{suffix}
    </span>
  )
}

export function Stats() {
  const sectionRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger)

    const rows = sectionRef.current?.querySelectorAll(".stat-row")
    if (!rows) return

    gsap.fromTo(
      rows,
      { opacity: 0, x: -24 },
      {
        opacity: 1,
        x: 0,
        duration: 0.75,
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
      style={{
        background: "linear-gradient(180deg, #0e0c12 0%, #110e17 50%, #0e0c12 100%)",
      }}
    >
      <div className="container" style={{ maxWidth: 900 }}>
        {/* Section label */}
        <p
          style={{
            fontSize: 10,
            letterSpacing: "0.22em",
            textTransform: "uppercase",
            color: "rgba(245,237,232,0.2)",
            fontWeight: 700,
            marginBottom: 56,
          }}
        >
          En números
        </p>

        {/* Stats list */}
        <div style={{ borderTop: "1px solid rgba(245,237,232,0.07)" }}>
          {STATS.map((stat, i) => (
            <div
              key={i}
              className="stat-row"
              style={{
                display: "flex",
                alignItems: "baseline",
                justifyContent: "space-between",
                gap: "clamp(24px, 4vw, 64px)",
                padding: "clamp(28px, 4vw, 44px) 0",
                borderBottom: "1px solid rgba(245,237,232,0.07)",
                opacity: 0,
              }}
            >
              {/* Number */}
              <div style={{ flexShrink: 0 }}>
                <span
                  style={{
                    fontFamily: "var(--font-fraunces)",
                    fontSize: "clamp(3rem, 7vw, 5.5rem)",
                    fontWeight: 400,
                    fontStyle: "italic",
                    letterSpacing: "-0.04em",
                    lineHeight: 1,
                    color: "var(--gold)",
                  }}
                >
                  <Counter value={stat.value} display={stat.display} suffix={stat.suffix} />
                </span>
              </div>

              {/* Label + note */}
              <div style={{ textAlign: "right", maxWidth: 360 }}>
                <p
                  style={{
                    fontSize: "clamp(14px, 1.6vw, 17px)",
                    color: "rgba(245,237,232,0.65)",
                    lineHeight: 1.5,
                    marginBottom: 6,
                  }}
                >
                  {stat.label}
                </p>
                <p
                  style={{
                    fontSize: 11,
                    color: "rgba(245,237,232,0.2)",
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                    fontWeight: 600,
                  }}
                >
                  {stat.note}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
