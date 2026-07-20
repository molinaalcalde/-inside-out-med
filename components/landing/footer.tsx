"use client"

export function Footer() {
  return (
    <footer
      style={{
        borderTop: "1px solid rgba(245,237,232,0.06)",
        padding: "56px 24px 40px",
      }}
    >
      <div
        className="container"
        style={{
          display: "grid",
          gridTemplateColumns: "1fr auto",
          gap: 40,
          alignItems: "start",
        }}
      >
        {/* Brand */}
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
            <svg width="24" height="24" viewBox="0 0 28 28" fill="none">
              <circle cx="14" cy="14" r="13" stroke="#e8a4b0" strokeWidth="1.5" />
              <circle cx="14" cy="14" r="7" stroke="#e8a4b0" strokeWidth="1" strokeDasharray="3 2" />
              <circle cx="14" cy="14" r="3" fill="#e8a4b0" />
            </svg>
            <span
              style={{
                fontFamily: "var(--font-fraunces)",
                fontSize: 16,
                fontWeight: 500,
                color: "#f5ede8",
                letterSpacing: "-0.02em",
              }}
            >
              InsideOutMed
            </span>
          </div>
          <p style={{ fontSize: 13, color: "rgba(245,237,232,0.3)", maxWidth: 280, lineHeight: 1.7 }}>
            Análisis facial avanzado. Tu piel, entendida desde adentro.
          </p>
          <p style={{ fontSize: 11, color: "rgba(245,237,232,0.18)", marginTop: 24, letterSpacing: "0.04em" }}>
            © {new Date().getFullYear()} InsideOutMed. Todos los derechos reservados.
          </p>
        </div>

        {/* Links */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "8px 40px",
          }}
        >
          {[
            "Privacidad", "Términos", "Contacto", "Blog",
            "Médicos", "Empresas",
          ].map((l) => (
            <a
              key={l}
              href="#"
              style={{
                fontSize: 13,
                color: "rgba(245,237,232,0.35)",
                transition: "color 0.2s",
                padding: "4px 0",
              }}
              onMouseEnter={(e) => ((e.target as HTMLElement).style.color = "rgba(245,237,232,0.8)")}
              onMouseLeave={(e) => ((e.target as HTMLElement).style.color = "rgba(245,237,232,0.35)")}
            >
              {l}
            </a>
          ))}
        </div>
      </div>

      {/* Disclaimer */}
      <div className="container" style={{ marginTop: 32, paddingTop: 24, borderTop: "1px solid rgba(245,237,232,0.04)" }}>
        <p style={{ fontSize: 10.5, color: "rgba(245,237,232,0.18)", lineHeight: 1.6, maxWidth: 700 }}>
          InsideOutMed es un servicio de análisis facial con fines informativos. No reemplaza el diagnóstico de un profesional de la salud. Los resultados son orientativos y deben interpretarse junto con un médico o dermatólogo.
        </p>
      </div>
    </footer>
  )
}
