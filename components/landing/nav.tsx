"use client"

import { useEffect, useRef, useState } from "react"
import { useLanguage } from "@/components/providers/language-provider"

export function Nav() {
  const navRef = useRef<HTMLElement>(null)
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const { locale, setLocale, t } = useLanguage()

  const links = [
    { label: t("nav.howItWorks"), href: "#how" },
    { label: t("nav.results"), href: "#results" },
    { label: t("nav.testimonials"), href: "#testimonials" },
  ]

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
        background: scrolled ? "rgba(14,12,18,0.92)" : "rgba(14,12,18,0.72)",
        backdropFilter: scrolled ? "blur(24px)" : "blur(20px)",
        WebkitBackdropFilter: scrolled ? "blur(24px)" : "blur(20px)",
        borderBottom: scrolled ? "1px solid rgba(245,237,232,0.08)" : "1px solid rgba(245,237,232,0.05)",
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
      <div style={{ display: "flex", gap: 32, alignItems: "center" }} className="nav-links">
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
        {t("nav.cta")}
      </a>

      {/* Language toggle */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          background: "rgba(245,237,232,0.06)",
          border: "1px solid rgba(245,237,232,0.1)",
          borderRadius: 99,
          padding: "4px 6px",
          gap: 2,
        }}
      >
        <button
          onClick={() => setLocale("es")}
          style={{
            background: locale === "es" ? "rgba(245,237,232,0.12)" : "transparent",
            border: "none",
            borderRadius: 99,
            padding: "4px 10px",
            fontSize: 11,
            fontWeight: locale === "es" ? 700 : 500,
            color: locale === "es" ? "#f5ede8" : "rgba(245,237,232,0.4)",
            cursor: "pointer",
            transition: "all 0.2s",
          }}
        >
          ES
        </button>
        <span style={{ color: "rgba(245,237,232,0.15)", fontSize: 11, userSelect: "none" }}>|</span>
        <button
          onClick={() => setLocale("en")}
          style={{
            background: locale === "en" ? "rgba(245,237,232,0.12)" : "transparent",
            border: "none",
            borderRadius: 99,
            padding: "4px 10px",
            fontSize: 11,
            fontWeight: locale === "en" ? 700 : 500,
            color: locale === "en" ? "#f5ede8" : "rgba(245,237,232,0.4)",
            cursor: "pointer",
            transition: "all 0.2s",
          }}
        >
          EN
        </button>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .nav-links { display: none !important; }
        }
        .mobile-menu-btn { display: none !important; }
        @media (max-width: 768px) {
          .mobile-menu-btn { display: flex !important; }
        }
      `}</style>

      {/* Hamburger button — mobile only */}
      <button
        className="mobile-menu-btn"
        onClick={() => setMenuOpen(true)}
        style={{
          alignItems: "center",
          justifyContent: "center",
          background: "none",
          border: "none",
          cursor: "pointer",
          padding: 8,
        }}
        aria-label="Open menu"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#f5ede8" strokeWidth="2" strokeLinecap="round">
          <line x1="3" y1="6" x2="21" y2="6" />
          <line x1="3" y1="12" x2="21" y2="12" />
          <line x1="3" y1="18" x2="21" y2="18" />
        </svg>
      </button>

      {/* Fullscreen mobile overlay */}
      {menuOpen && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 100,
            background: "rgba(14,12,18,0.96)",
            backdropFilter: "blur(24px)",
            WebkitBackdropFilter: "blur(24px)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            opacity: menuOpen ? 1 : 0,
            transform: menuOpen ? "translateY(0)" : "translateY(-20px)",
            transition: "opacity 0.3s ease, transform 0.3s ease",
          }}
        >
          {/* Close button */}
          <button
            onClick={() => setMenuOpen(false)}
            aria-label="Close menu"
            style={{
              position: "absolute",
              top: 16,
              right: 16,
              width: 44,
              height: 44,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "none",
              border: "none",
              cursor: "pointer",
            }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#f5ede8" strokeWidth="2" strokeLinecap="round">
              <line x1="6" y1="6" x2="18" y2="18" />
              <line x1="18" y1="6" x2="6" y2="18" />
            </svg>
          </button>

          {/* Nav links */}
          <nav style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
            {links.map((l) => (
              <button
                key={l.href}
                onClick={() => {
                  setMenuOpen(false)
                  handleClick(l.href)
                }}
                style={{
                  background: "none",
                  border: "none",
                  fontFamily: "var(--font-fraunces)",
                  fontSize: 32,
                  color: "#f5ede8",
                  marginBottom: 32,
                  cursor: "pointer",
                }}
              >
                {l.label}
              </button>
            ))}
          </nav>

          {/* CTA */}
          <a
            href="/analyze"
            onClick={() => setMenuOpen(false)}
            style={{
              marginTop: 24,
              padding: "16px 40px",
              fontSize: 18,
              fontWeight: 600,
              color: "#fff",
              background: "linear-gradient(135deg, #e8a4b0, #d4788a)",
              borderRadius: 12,
              textDecoration: "none",
              fontFamily: "var(--font-fraunces)",
            }}
          >
            {t("nav.cta")}
          </a>
        </div>
      )}
    </nav>
  )
}
