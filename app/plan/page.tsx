"use client"

import { useEffect, useState } from "react"

// ─── Amazon affiliate tag (replace with your real Associates tag) ───
const AFFILIATE_TAG = "insideoutmed-21"

function amazonUrl(query: string) {
  return `https://www.amazon.com/s?k=${encodeURIComponent(query)}&tag=${AFFILIATE_TAG}`
}

// ─── Product database by concern ───────────────────────────────────
type Product = {
  name: string
  brand: string
  why: string
  priority: "Urgente" | "Importante" | "Complementario"
  category: string
  priceRange: string
  searchQuery: string
}

function getProducts(scores: {
  hydration: number
  inflammation: number
  elasticity: number
  melanin: number
  oxidation: number
}): Product[] {
  const products: Product[] = []

  // SPF — always, no exceptions
  products.push({
    name: "UV Clear Broad-Spectrum SPF 46",
    brand: "EltaMD",
    why: "Protector solar es el anti-aging #1 demostrado. Sin SPF diario, ningún otro producto funciona al 100%. Este es el estándar dermatológico.",
    priority: "Urgente",
    category: "Protección solar",
    priceRange: "$30–40",
    searchQuery: "EltaMD UV Clear SPF 46",
  })

  // Niacinamide if inflammation elevated
  if (scores.inflammation > 15) {
    products.push({
      name: "10% Niacinamide Booster",
      brand: "Paula's Choice",
      why: `Tu inflamación (${scores.inflammation}%) activa el enrojecimiento y amplifica otros daños. La niacinamida al 10% la reduce en 4–6 semanas según estudios clínicos.`,
      priority: scores.inflammation > 30 ? "Urgente" : "Importante",
      category: "Sérum antiinflamatorio",
      priceRange: "$22–35",
      searchQuery: "Paulas Choice Niacinamide Booster 10%",
    })
  }

  // Vitamin C if oxidation elevated
  if (scores.oxidation > 25) {
    products.push({
      name: "Vitamin C Brightening Serum",
      brand: "TruSkin",
      why: `Tu índice de oxidación (${scores.oxidation}%) indica daño por radicales libres acumulado. La vitamina C es el antioxidante tópico con mayor evidencia clínica para revertirlo.`,
      priority: scores.oxidation > 45 ? "Urgente" : "Importante",
      category: "Sérum vitamina C",
      priceRange: "$18–28",
      searchQuery: "TruSkin Vitamin C Serum brightening",
    })
  }

  // Hyaluronic acid if hydration low
  if (scores.hydration < 80) {
    products.push({
      name: "Hyaluronic Acid + B5 Serum",
      brand: "The Ordinary",
      why: `Tu hidratación (${scores.hydration}%) está por debajo del óptimo. El ácido hialurónico de triple peso molecular hidrata todas las capas de la dermis simultáneamente.`,
      priority: scores.hydration < 60 ? "Urgente" : "Importante",
      category: "Sérum hidratante",
      priceRange: "$8–14",
      searchQuery: "The Ordinary Hyaluronic Acid B5 serum",
    })
  }

  // Retinol if elasticity low
  if (scores.elasticity < 80) {
    products.push({
      name: "Retinol Correxion Line Smoothing Serum",
      brand: "RoC",
      why: `Tu elasticidad (${scores.elasticity}%) indica que el colágeno necesita estimulación. El retinol microencapsulado de RoC activa los fibroblastos con mínima irritación.`,
      priority: scores.elasticity < 65 ? "Urgente" : "Importante",
      category: "Sérum antiedad",
      priceRange: "$18–30",
      searchQuery: "RoC Retinol Correxion serum",
    })
  }

  // Depigmenting if melanin high
  if (scores.melanin > 55) {
    products.push({
      name: "Alpha Arbutin 2% + HA",
      brand: "The Inkey List",
      why: `Tu índice de melanina (${scores.melanin}%) sugiere hiperpigmentación activa. El alfa-arbutina inhibe la tirosinasa — la enzima que produce manchas — sin irritar la piel.`,
      priority: scores.melanin > 70 ? "Urgente" : "Importante",
      category: "Sérum despigmentante",
      priceRange: "$10–16",
      searchQuery: "The Inkey List Alpha Arbutin serum",
    })
  }

  // Gentle cleanser always
  products.push({
    name: "Hydrating Facial Cleanser",
    brand: "CeraVe",
    why: "La base de cualquier rutina efectiva. Limpieza sin sulfatos agresivos que respeta las ceramidas naturales de tu piel.",
    priority: "Complementario",
    category: "Limpiador facial",
    priceRange: "$10–16",
    searchQuery: "CeraVe Hydrating Facial Cleanser",
  })

  return products
}

const PRIORITY_COLORS = {
  Urgente: { text: "#e8a4b0", bg: "rgba(232,164,176,0.1)", border: "rgba(232,164,176,0.25)" },
  Importante: { text: "#d4af88", bg: "rgba(212,175,136,0.1)", border: "rgba(212,175,136,0.25)" },
  Complementario: { text: "#7ecba1", bg: "rgba(126,203,161,0.08)", border: "rgba(126,203,161,0.2)" },
}

type Scores = {
  overall: number
  hydration: number
  inflammation: number
  elasticity: number
  melanin: number
  oxidation: number
}

function PlanContent({ scores }: { scores: Scores }) {
  const products = getProducts(scores)
  const urgentCount = products.filter((p) => p.priority === "Urgente").length

  const WHATSAPP_NUMBER = "TUTELEFONO" // ← reemplaza con tu número real
  const waMsg = encodeURIComponent(
    `Hola, acabo de hacer mi análisis en InsideOutMed. Mi score fue ${scores.overall}/100. Me interesa el asesoramiento gratuito.`
  )

  return (
    <div style={{ minHeight: "100vh", background: "#0e0c12", color: "#f5ede8", fontFamily: "var(--font-inter, sans-serif)" }}>

      {/* Nav */}
      <nav style={{
        padding: "0 24px",
        height: 72,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        borderBottom: "1px solid rgba(245,237,232,0.06)",
        position: "sticky", top: 0, zIndex: 100,
        background: "rgba(14,12,18,0.92)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
      }}>
        <a href="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
          <svg width="26" height="26" viewBox="0 0 28 28" fill="none">
            <circle cx="14" cy="14" r="13" stroke="#e8a4b0" strokeWidth="1.5" />
            <circle cx="14" cy="14" r="7" stroke="#e8a4b0" strokeWidth="1" strokeDasharray="3 2" />
            <circle cx="14" cy="14" r="3" fill="#e8a4b0" />
          </svg>
          <span style={{ fontFamily: "var(--font-fraunces)", fontSize: 17, fontWeight: 500, color: "#f5ede8", letterSpacing: "-0.02em" }}>
            InsideOutMed
          </span>
        </a>
        <a
          href={`https://wa.me/${WHATSAPP_NUMBER}?text=${waMsg}`}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            background: "rgba(232,164,176,0.1)", border: "1px solid rgba(232,164,176,0.3)",
            color: "#e8a4b0", borderRadius: 99, padding: "8px 20px",
            fontSize: 13, fontWeight: 600, textDecoration: "none",
            transition: "background 0.2s",
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
          </svg>
          Asesoramiento gratuito
        </a>
      </nav>

      <main style={{ maxWidth: 900, margin: "0 auto", padding: "60px 24px 80px" }}>

        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 56 }}>
          <span style={{ fontSize: 11, letterSpacing: "0.16em", color: "#e8a4b0", textTransform: "uppercase", fontWeight: 700 }}>
            Tu plan médico personalizado
          </span>
          <h1 style={{
            fontFamily: "var(--font-fraunces)",
            fontSize: "clamp(28px, 4vw, 44px)",
            fontWeight: 400,
            letterSpacing: "-0.03em",
            marginTop: 14,
            marginBottom: 16,
            lineHeight: 1.1,
          }}>
            Basado en tu análisis, identificamos
            <br />
            <em style={{ color: "#e8a4b0", fontStyle: "italic" }}>
              {urgentCount} necesidades urgentes
            </em>
          </h1>

          {/* Score summary */}
          <div style={{
            display: "inline-flex", gap: 24, flexWrap: "wrap", justifyContent: "center",
            marginTop: 24, padding: "16px 32px",
            background: "rgba(245,237,232,0.03)",
            border: "1px solid rgba(245,237,232,0.08)",
            borderRadius: 14,
          }}>
            {[
              { label: "Score global", value: `${scores.overall}/100`, color: "#e8a4b0" },
              { label: "Hidratación", value: `${scores.hydration}%`, color: "#7ecba1" },
              { label: "Inflamación", value: `${scores.inflammation}%`, color: "#d4af88" },
              { label: "Elasticidad", value: `${scores.elasticity}%`, color: "#7ecba1" },
            ].map((s) => (
              <div key={s.label} style={{ textAlign: "center" }}>
                <p style={{ fontSize: 10, letterSpacing: "0.1em", color: "rgba(245,237,232,0.35)", textTransform: "uppercase", marginBottom: 4 }}>
                  {s.label}
                </p>
                <p style={{ fontFamily: "var(--font-fraunces)", fontSize: 22, fontWeight: 300, color: s.color, lineHeight: 1 }}>
                  {s.value}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* ── Consultation CTA (hero of the page) ── */}
        <div style={{
          background: "linear-gradient(135deg, rgba(232,164,176,0.08) 0%, rgba(212,175,136,0.05) 100%)",
          border: "1px solid rgba(232,164,176,0.18)",
          borderRadius: 20,
          padding: "36px 40px",
          marginBottom: 56,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 32,
          flexWrap: "wrap",
        }}>
          <div style={{ maxWidth: 520 }}>
            <p style={{ fontSize: 11, letterSpacing: "0.14em", color: "#e8a4b0", textTransform: "uppercase", fontWeight: 700, marginBottom: 10 }}>
              Oferta exclusiva · Gratis
            </p>
            <h2 style={{
              fontFamily: "var(--font-fraunces)",
              fontSize: "clamp(20px, 2.5vw, 28px)",
              fontWeight: 400,
              letterSpacing: "-0.025em",
              marginBottom: 10,
              lineHeight: 1.2,
            }}>
              Analizamos tus resultados contigo en una videollamada de 20 minutos
            </h2>
            <p style={{ fontSize: 14, color: "rgba(245,237,232,0.5)", lineHeight: 1.65 }}>
              Un especialista de InsideOutMed revisa tu informe, te explica cada biomarcador
              y diseña tu protocolo de manera conjunta. Sin costo. Sin presión.
            </p>
          </div>
          <a
            href={`https://wa.me/${WHATSAPP_NUMBER}?text=${waMsg}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: "inline-flex", alignItems: "center", gap: 10,
              background: "linear-gradient(135deg, #e8a4b0 0%, #c97e8e 100%)",
              color: "#fff", borderRadius: 99,
              padding: "16px 36px", fontSize: 15, fontWeight: 700,
              textDecoration: "none", whiteSpace: "nowrap",
              boxShadow: "0 8px 32px rgba(232,164,176,0.35)",
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
            Agendar ahora — es gratis
          </a>
        </div>

        {/* ── Products header ── */}
        <div style={{ marginBottom: 32 }}>
          <h2 style={{
            fontFamily: "var(--font-fraunces)",
            fontSize: "clamp(22px, 3vw, 32px)",
            fontWeight: 400,
            letterSpacing: "-0.025em",
            marginBottom: 8,
          }}>
            Productos seleccionados para tu piel
          </h2>
          <p style={{ fontSize: 14, color: "rgba(245,237,232,0.45)", lineHeight: 1.6, maxWidth: 560 }}>
            Cada recomendación está basada en tus biomarcadores específicos.
            Sin patrocinios. Sin comisiones de marcas. Solo lo que necesitas.
          </p>
        </div>

        {/* ── Product cards ── */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16, marginBottom: 64 }}>
          {products.map((p, i) => {
            const colors = PRIORITY_COLORS[p.priority]
            return (
              <div
                key={i}
                style={{
                  background: "rgba(245,237,232,0.03)",
                  border: "1px solid rgba(245,237,232,0.08)",
                  borderRadius: 18,
                  padding: "28px 32px",
                  display: "grid",
                  gridTemplateColumns: "1fr auto",
                  gap: 24,
                  alignItems: "center",
                  transition: "border-color 0.2s",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.borderColor = "rgba(245,237,232,0.16)")}
                onMouseLeave={(e) => (e.currentTarget.style.borderColor = "rgba(245,237,232,0.08)")}
              >
                <div>
                  {/* Category + priority */}
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                    <span style={{
                      fontSize: 9, letterSpacing: "0.14em", fontWeight: 700,
                      color: colors.text, textTransform: "uppercase",
                      background: colors.bg, border: `1px solid ${colors.border}`,
                      padding: "3px 10px", borderRadius: 99,
                    }}>
                      {p.priority}
                    </span>
                    <span style={{ fontSize: 11, color: "rgba(245,237,232,0.3)", letterSpacing: "0.06em" }}>
                      {p.category}
                    </span>
                  </div>

                  {/* Product name */}
                  <div style={{ marginBottom: 10 }}>
                    <span style={{ fontSize: 11, color: "rgba(245,237,232,0.35)", marginRight: 8 }}>{p.brand}</span>
                    <h3 style={{
                      fontFamily: "var(--font-fraunces)",
                      fontSize: "clamp(16px, 2vw, 20px)",
                      fontWeight: 400,
                      letterSpacing: "-0.02em",
                      color: "#f5ede8",
                      lineHeight: 1.2,
                    }}>
                      {p.name}
                    </h3>
                  </div>

                  {/* Why */}
                  <p style={{ fontSize: 13, color: "rgba(245,237,232,0.5)", lineHeight: 1.7, maxWidth: 560 }}>
                    {p.why}
                  </p>

                  <p style={{ fontSize: 11, color: "rgba(245,237,232,0.25)", marginTop: 10 }}>
                    Precio estimado: {p.priceRange}
                  </p>
                </div>

                {/* CTA */}
                <div style={{ textAlign: "center", flexShrink: 0 }}>
                  <a
                    href={amazonUrl(p.searchQuery)}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 8,
                      background: "rgba(245,237,232,0.07)",
                      border: "1px solid rgba(245,237,232,0.14)",
                      color: "#f5ede8",
                      borderRadius: 12,
                      padding: "12px 22px",
                      fontSize: 13,
                      fontWeight: 600,
                      textDecoration: "none",
                      whiteSpace: "nowrap",
                      transition: "background 0.2s, border-color 0.2s",
                    }}
                    onMouseEnter={(e) => {
                      const el = e.currentTarget
                      el.style.background = "rgba(245,237,232,0.12)"
                      el.style.borderColor = "rgba(245,237,232,0.24)"
                    }}
                    onMouseLeave={(e) => {
                      const el = e.currentTarget
                      el.style.background = "rgba(245,237,232,0.07)"
                      el.style.borderColor = "rgba(245,237,232,0.14)"
                    }}
                  >
                    Ver en Amazon
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                      <path d="M2 7h10M8 3l4 4-4 4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </a>
                  <p style={{ fontSize: 10, color: "rgba(245,237,232,0.2)", marginTop: 6, letterSpacing: "0.04em" }}>
                    Amazon · Envío rápido
                  </p>
                </div>
              </div>
            )
          })}
        </div>

        {/* ── Bottom consultation CTA ── */}
        <div style={{
          textAlign: "center",
          padding: "48px 32px",
          background: "rgba(245,237,232,0.025)",
          border: "1px solid rgba(245,237,232,0.07)",
          borderRadius: 20,
          marginBottom: 40,
        }}>
          <p style={{ fontSize: 11, letterSpacing: "0.14em", color: "rgba(245,237,232,0.35)", textTransform: "uppercase", marginBottom: 16 }}>
            ¿Tienes dudas sobre tu plan?
          </p>
          <h3 style={{
            fontFamily: "var(--font-fraunces)",
            fontSize: "clamp(20px, 2.5vw, 30px)",
            fontWeight: 400,
            letterSpacing: "-0.025em",
            marginBottom: 14,
            lineHeight: 1.2,
          }}>
            Hablamos contigo, gratis.
            <br />
            <em style={{ color: "#e8a4b0", fontStyle: "italic" }}>Sin compromiso.</em>
          </h3>
          <p style={{ fontSize: 14, color: "rgba(245,237,232,0.4)", marginBottom: 28, maxWidth: 440, margin: "0 auto 28px", lineHeight: 1.65 }}>
            Un especialista revisa tu informe y responde todas tus dudas en 20 minutos por WhatsApp o videollamada.
          </p>
          <a
            href={`https://wa.me/${WHATSAPP_NUMBER}?text=${waMsg}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: "inline-flex", alignItems: "center", gap: 10,
              background: "linear-gradient(135deg, #e8a4b0 0%, #c97e8e 100%)",
              color: "#fff", borderRadius: 99,
              padding: "15px 40px", fontSize: 15, fontWeight: 700,
              textDecoration: "none",
              boxShadow: "0 8px 28px rgba(232,164,176,0.3)",
            }}
          >
            Agendar asesoramiento gratuito
          </a>
          <p style={{ fontSize: 11, color: "rgba(245,237,232,0.2)", marginTop: 14, letterSpacing: "0.06em" }}>
            Sin tarjeta · Sin obligación · Cancela cuando quieras
          </p>
        </div>

        {/* Disclaimer */}
        <p style={{ fontSize: 10.5, color: "rgba(245,237,232,0.18)", lineHeight: 1.6, textAlign: "center", maxWidth: 600, margin: "0 auto" }}>
          Las recomendaciones de InsideOutMed tienen fines informativos. No reemplazan el diagnóstico de un dermatólogo.
          Algunos enlaces a Amazon pueden generar comisiones de afiliado que financian este servicio gratuito.
        </p>
      </main>
    </div>
  )
}

export default function PlanPage() {
  const [scores, setScores] = useState<Scores | null>(null)

  useEffect(() => {
    // Try to read from localStorage (set by /analyze after scan)
    try {
      const saved = localStorage.getItem("insideoutmed_scores")
      if (saved) {
        setScores(JSON.parse(saved))
        return
      }
    } catch {}

    // Fallback: default demo scores
    setScores({
      overall: 84,
      hydration: 87,
      inflammation: 22,
      elasticity: 79,
      melanin: 61,
      oxidation: 34,
    })
  }, [])

  if (!scores) {
    return (
      <div style={{ minHeight: "100vh", background: "#0e0c12", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ width: 32, height: 32, borderRadius: "50%", border: "2px solid rgba(232,164,176,0.3)", borderTopColor: "#e8a4b0", animation: "spin 0.8s linear infinite" }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    )
  }

  return <PlanContent scores={scores} />
}
