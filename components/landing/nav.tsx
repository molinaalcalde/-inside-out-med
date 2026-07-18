"use client"

import { useEffect, useRef, useState } from "react"

const links = [
  { label: "Cómo funciona", href: "#how" },
  { label: "Resultados", href: "#results" },
  { label: "Testimonios", href: "#testimonials" },
]

export function Nav() {
  const navRef = useRef<HTMLElement>(null)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60)
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  const handleClick = (href: string) => {
    const el = document.querySelector(href)
    if (!el) return
    const lenis = (window as typeof window & { lenis?: { scrollTo: (target: Element, opts: object) => void } }).lenis
    if (lenis) {
      lenis.scrollTo(el, { offset: -80, duration: 1.4 })
    } else {
      el.scrollIntoView({ behavior: "smooth" })
    }
  }

  return (
    <nav
      ref={navRef}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 200,
        padding: "0 24px",
        height: 72,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        transition: "background 0.4s, backdrop-filter 0.4s, border-color 0.4s",
        background: scrolled ? "rgba(14,12,18,0.90)" : "rgba(14,12,18,0.35)",
        backdropFilter: scrolled ? "blur(24px)" : "blur(8px)",
        WebkitBackdropFilter: scrolled ? "blur(24px)" : "blur(8px)",
        borderBottom: scrolled ? "1px solid rgba(245,237,232,0.08)" : "1px solid rgba(245,237,232,0.04)",
      }}
    >
      {/* Logo */}
      <a href="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
        <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
          <circle cx="14" cy="14" r="13" stroke="#e8a4b0" strokeWidth="1.5" />
          <circle cx="14" cy="14" r="7" stroke="#e8a4b0" strokeWidth="1" strokeDasharray="3 2" />
          <circle cx="14" cy="14" r="3" fill="#e8a4b0" />
        </svg>
        <span style={{ fontFamily: "var(--font-fraunces)", fontSize: 18, fontWeight: 500, color: "#f5ede8", letterSpacing: "-0.02em" }}>
          InsideOutMed
        </span>
      </a>

      {/* Links — desktop only */}
      <div style={{ display: "flex", gap: 32, alignItems: "center" }} className="hidden md:flex">
        {links.map((l) => (
          <button
            key={l.href}
            onClick={() => handleClick(l.href)}
            style={{
              background: "none",
              border: "none",
              color: "rgba(245,237,232,0.65)",
              fontSize: 14,
              fontWeight: 500,
              cursor: "pointer",
              transition: "color 0.2s",
              padding: "4px 0",
            }}
            onMouseEnter={(e) => ((e.target as HTMLElement).style.color = "#f5ede8")}
            onMouseLeave={(e) => ((e.target as HTMLElement).style.color = "rgba(245,237,232,0.65)")}
          >
            {l.label}
          </button>
        ))}
      </div>

      {/* CTA */}
      <a href="/analyze" className="btn-rose hidden md:inline-flex" style={{ padding: "10px 24px", fontSize: 14 }}>
        Analizar mi piel
      </a>

      {/* Mobile menu */}
      <button
        className="md:hidden"
        style={{
          background: "rgba(245,237,232,0.06)",
          border: "1px solid rgba(245,237,232,0.12)",
          borderRadius: 10,
          padding: "8px 12px",
          color: "#f5ede8",
          fontSize: 13,
          fontWeight: 600,
          cursor: "pointer",
        }}
        onClick={() => handleClick("#cta")}
      >
        Empezar
      </button>
    </nav>
  )
}
