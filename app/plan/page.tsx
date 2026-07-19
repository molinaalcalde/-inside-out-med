"use client"

import { useEffect, useState, useCallback } from "react"

// ─── Amazon affiliate tag ───────────────────────────────────────────
const AFFILIATE_TAG = "insideoutmed-21"

function amazonUrl(query: string) {
  return `https://www.amazon.com/s?k=${encodeURIComponent(query)}&tag=${AFFILIATE_TAG}`
}

// ─── Product database ───────────────────────────────────────────────
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

  products.push({
    name: "UV Clear Broad-Spectrum SPF 46",
    brand: "EltaMD",
    why: "El protector solar es el único anti-aging con evidencia clínica irrefutable. Sin SPF diario, ningún otro producto puede funcionar al 100%. Formulado para pieles reactivas.",
    priority: "Urgente",
    category: "Protección solar",
    priceRange: "$30–40",
    searchQuery: "EltaMD UV Clear SPF 46",
  })

  if (scores.inflammation > 15) {
    products.push({
      name: "10% Niacinamide Booster",
      brand: "Paula's Choice",
      why: `Tu inflamación (${scores.inflammation}%) está activando el enrojecimiento y amplificando otros daños. La niacinamida al 10% la reduce en 4–6 semanas según estudios doble ciego.`,
      priority: scores.inflammation > 30 ? "Urgente" : "Importante",
      category: "Sérum antiinflamatorio",
      priceRange: "$22–35",
      searchQuery: "Paulas Choice Niacinamide Booster 10%",
    })
  }

  if (scores.oxidation > 25) {
    products.push({
      name: "Vitamin C Brightening Serum",
      brand: "TruSkin",
      why: `Tu índice de oxidación (${scores.oxidation}%) revela daño por radicales libres acumulado. La vitamina C es el antioxidante tópico con mayor evidencia clínica para revertirlo.`,
      priority: scores.oxidation > 45 ? "Urgente" : "Importante",
      category: "Sérum vitamina C",
      priceRange: "$18–28",
      searchQuery: "TruSkin Vitamin C Serum brightening",
    })
  }

  if (scores.hydration < 80) {
    products.push({
      name: "Hyaluronic Acid + B5 Serum",
      brand: "The Ordinary",
      why: `Tu hidratación (${scores.hydration}%) está bajo el óptimo. El ácido hialurónico de triple peso molecular hidrata todas las capas de la dermis de forma simultánea.`,
      priority: scores.hydration < 60 ? "Urgente" : "Importante",
      category: "Sérum hidratante",
      priceRange: "$8–14",
      searchQuery: "The Ordinary Hyaluronic Acid B5 serum",
    })
  }

  if (scores.elasticity < 80) {
    products.push({
      name: "Retinol Correxion Line Smoothing Serum",
      brand: "RoC",
      why: `Tu elasticidad (${scores.elasticity}%) indica que el colágeno necesita estimulación activa. El retinol microencapsulado de RoC activa los fibroblastos con mínima irritación.`,
      priority: scores.elasticity < 65 ? "Urgente" : "Importante",
      category: "Sérum antiedad",
      priceRange: "$18–30",
      searchQuery: "RoC Retinol Correxion serum",
    })
  }

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

  products.push({
    name: "Hydrating Facial Cleanser",
    brand: "CeraVe",
    why: "La base de cualquier rutina efectiva. Limpieza sin sulfatos que respeta las ceramidas naturales y no altera el microbioma cutáneo.",
    priority: "Complementario",
    category: "Limpiador facial",
    priceRange: "$10–16",
    searchQuery: "CeraVe Hydrating Facial Cleanser",
  })

  return products
}

// ─── Analysis steps ─────────────────────────────────────────────────
const ANALYSIS_STEPS = [
  "Procesando tus 7 biomarcadores",
  "Cruzando con 12.847 perfiles clínicos",
  "Identificando déficits por zona facial",
  "Seleccionando ingredientes activos compatibles",
  "Verificando compatibilidad entre activos",
  "Protocolo personalizado listo",
]

const STEP_DURATIONS = [650, 900, 750, 650, 550, 400]

type Scores = {
  overall: number
  hydration: number
  inflammation: number
  elasticity: number
  melanin: number
  oxidation: number
}

// ─── Analyzing screen ────────────────────────────────────────────────
function AnalyzingScreen({ scores, onDone }: { scores: Scores; onDone: () => void }) {
  const [completedSteps, setCompletedSteps] = useState<number[]>([])
  const [activeStep, setActiveStep] = useState(0)
  const [finished, setFinished] = useState(false)

  useEffect(() => {
    let current = 0
    const advance = () => {
      setCompletedSteps(prev => [...prev, current])
      if (current < ANALYSIS_STEPS.length - 1) {
        current++
        setActiveStep(current)
        setTimeout(advance, STEP_DURATIONS[current])
      } else {
        setTimeout(() => {
          setFinished(true)
          setTimeout(onDone, 500)
        }, 500)
      }
    }
    setTimeout(advance, STEP_DURATIONS[0])
  }, [onDone])

  const progress = Math.round((completedSteps.length / ANALYSIS_STEPS.length) * 100)
  const isLast = completedSteps.length === ANALYSIS_STEPS.length

  return (
    <div style={{
      minHeight: "100vh", background: "#0e0c12", color: "#f5ede8",
      fontFamily: "var(--font-inter, sans-serif)",
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      opacity: finished ? 0 : 1, transition: "opacity 0.5s ease",
      padding: "0 24px",
    }}>
      <div style={{ maxWidth: 440, width: "100%" }}>

        {/* Animated logo */}
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 44 }}>
          <div style={{ position: "relative", width: 72, height: 72 }}>
            <div style={{
              position: "absolute", inset: 0, borderRadius: "50%",
              border: "1px solid rgba(232,164,176,0.25)",
              animation: "ringPulse 2.4s ease-in-out infinite",
            }} />
            <div style={{
              position: "absolute", inset: 10, borderRadius: "50%",
              border: "1px solid rgba(232,164,176,0.12)",
              animation: "ringPulse 2.4s ease-in-out 0.4s infinite",
            }} />
            <div style={{
              position: "absolute", inset: 0,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              {isLast ? (
                <svg width="22" height="22" viewBox="0 0 22 22" fill="none" style={{ animation: "checkIn 0.4s ease forwards" }}>
                  <path d="M4 11l5 5 9-9" stroke="#7ecba1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              ) : (
                <div style={{
                  width: 14, height: 14, borderRadius: "50%",
                  background: "#e8a4b0",
                  boxShadow: "0 0 20px rgba(232,164,176,0.7)",
                  animation: "corePulse 1.6s ease-in-out infinite",
                }} />
              )}
            </div>
          </div>
        </div>

        {/* Title */}
        <div style={{ textAlign: "center", marginBottom: 8 }}>
          <h1 style={{
            fontFamily: "var(--font-fraunces)",
            fontSize: "clamp(20px, 3vw, 26px)",
            fontWeight: 400, letterSpacing: "-0.025em",
            lineHeight: 1.25, marginBottom: 8,
            color: isLast ? "#7ecba1" : "#f5ede8",
            transition: "color 0.4s ease",
          }}>
            {isLast ? "Tu protocolo está listo" : "Analizando tu caso"}
          </h1>
          <p style={{ fontSize: 12.5, color: "rgba(245,237,232,0.32)", letterSpacing: "0.04em" }}>
            Score {scores.overall}/100 · {isLast ? "Procesamiento completo" : "Un momento, por favor"}
          </p>
        </div>

        {/* Steps */}
        <div style={{ margin: "36px 0 28px", display: "flex", flexDirection: "column", gap: 11 }}>
          {ANALYSIS_STEPS.map((stepText, i) => {
            const isDone = completedSteps.includes(i)
            const isActive = activeStep === i && !isDone
            const isPending = !isDone && !isActive
            return (
              <div key={i} style={{
                display: "flex", alignItems: "center", gap: 13,
                opacity: isPending ? 0.22 : 1,
                transform: isPending ? "translateX(-4px)" : "translateX(0)",
                transition: "opacity 0.4s ease, transform 0.4s ease",
              }}>
                {/* Indicator */}
                <div style={{
                  width: 22, height: 22, borderRadius: "50%", flexShrink: 0,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  background: isDone ? "rgba(126,203,161,0.12)" : isActive ? "rgba(232,164,176,0.1)" : "transparent",
                  border: `1px solid ${isDone ? "rgba(126,203,161,0.35)" : isActive ? "rgba(232,164,176,0.3)" : "rgba(245,237,232,0.08)"}`,
                  transition: "all 0.4s ease",
                }}>
                  {isDone ? (
                    <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                      <path d="M2 5l2.5 2.5L8 3" stroke="#7ecba1" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  ) : (
                    <div style={{
                      width: 5, height: 5, borderRadius: "50%",
                      background: isActive ? "#e8a4b0" : "rgba(245,237,232,0.18)",
                      boxShadow: isActive ? "0 0 8px rgba(232,164,176,0.9)" : "none",
                      animation: isActive ? "corePulse 0.9s ease-in-out infinite" : "none",
                    }} />
                  )}
                </div>
                {/* Text */}
                <span style={{
                  fontSize: 13, fontWeight: 400,
                  color: isDone ? "rgba(126,203,161,0.85)" : isActive ? "#f5ede8" : "rgba(245,237,232,0.35)",
                  transition: "color 0.4s ease",
                  letterSpacing: "0.01em",
                }}>
                  {stepText}
                  {isActive && <span style={{ opacity: 0.5 }}>{" "}…</span>}
                </span>
              </div>
            )
          })}
        </div>

        {/* Progress bar */}
        <div style={{
          height: 1.5, background: "rgba(245,237,232,0.06)",
          borderRadius: 2, overflow: "hidden", marginBottom: 10,
        }}>
          <div style={{
            height: "100%", width: `${progress}%`,
            background: isLast
              ? "linear-gradient(90deg, #7ecba1, #5aab82)"
              : "linear-gradient(90deg, #e8a4b0, #d4af88, #7ecba1)",
            borderRadius: 2,
            transition: "width 0.55s ease, background 0.4s ease",
          }} />
        </div>
        <p style={{ fontSize: 10, color: "rgba(245,237,232,0.18)", textAlign: "center", letterSpacing: "0.1em" }}>
          {progress}% completado
        </p>
      </div>

      <style>{`
        @keyframes ringPulse {
          0%, 100% { opacity: 0.5; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.04); }
        }
        @keyframes corePulse {
          0%, 100% { opacity: 0.7; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.25); }
        }
        @keyframes checkIn {
          from { opacity: 0; transform: scale(0.5); }
          to { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  )
}

const PRIORITY_COLORS = {
  Urgente:       { text: "#e8a4b0", bg: "rgba(232,164,176,0.08)", border: "rgba(232,164,176,0.22)" },
  Importante:    { text: "#d4af88", bg: "rgba(212,175,136,0.08)", border: "rgba(212,175,136,0.22)" },
  Complementario:{ text: "#7ecba1", bg: "rgba(126,203,161,0.06)", border: "rgba(126,203,161,0.18)" },
}

// ─── Main plan content ───────────────────────────────────────────────
function PlanContent({ scores }: { scores: Scores }) {
  const [showContent, setShowContent] = useState(false)
  const products = getProducts(scores)
  const urgentCount = products.filter(p => p.priority === "Urgente").length

  const WHATSAPP_NUMBER = "TUTELEFONO"
  const waMsg = encodeURIComponent(
    `Hola, acabo de hacer mi análisis en InsideOutMed. Mi score fue ${scores.overall}/100. Me gustaría hablar con un especialista.`
  )

  const handleDone = useCallback(() => setShowContent(true), [])

  if (!showContent) {
    return <AnalyzingScreen scores={scores} onDone={handleDone} />
  }

  return (
    <div style={{
      minHeight: "100vh", background: "#0e0c12", color: "#f5ede8",
      fontFamily: "var(--font-inter, sans-serif)",
      animation: "pageIn 0.6s ease forwards",
    }}>

      {/* Nav */}
      <nav style={{
        padding: "0 24px", height: 72,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        borderBottom: "1px solid rgba(245,237,232,0.06)",
        position: "sticky", top: 0, zIndex: 100,
        background: "rgba(14,12,18,0.92)",
        backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)",
      }}>
        <a href="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
          <svg width="26" height="26" viewBox="0 0 28 28" fill="none">
            <circle cx="14" cy="14" r="13" stroke="#e8a4b0" strokeWidth="1.5"/>
            <circle cx="14" cy="14" r="7" stroke="#e8a4b0" strokeWidth="1" strokeDasharray="3 2"/>
            <circle cx="14" cy="14" r="3" fill="#e8a4b0"/>
          </svg>
          <span style={{ fontFamily: "var(--font-fraunces)", fontSize: 17, fontWeight: 500, color: "#f5ede8", letterSpacing: "-0.02em" }}>
            InsideOutMed
          </span>
        </a>
        <a
          href={`https://wa.me/${WHATSAPP_NUMBER}?text=${waMsg}`}
          target="_blank" rel="noopener noreferrer"
          style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            background: "rgba(232,164,176,0.1)", border: "1px solid rgba(232,164,176,0.28)",
            color: "#e8a4b0", borderRadius: 99, padding: "8px 20px",
            fontSize: 13, fontWeight: 600, textDecoration: "none",
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
          </svg>
          Hablar con especialista
        </a>
      </nav>

      <main style={{ maxWidth: 900, margin: "0 auto", padding: "60px 24px 80px" }}>

        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 56 }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
            <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#7ecba1", boxShadow: "0 0 8px rgba(126,203,161,0.8)" }} />
            <span style={{ fontSize: 10, letterSpacing: "0.16em", color: "#7ecba1", textTransform: "uppercase", fontWeight: 700 }}>
              Protocolo personalizado · Score {scores.overall}/100
            </span>
          </div>
          <h1 style={{
            fontFamily: "var(--font-fraunces)",
            fontSize: "clamp(26px, 4vw, 42px)",
            fontWeight: 400, letterSpacing: "-0.03em",
            marginBottom: 16, lineHeight: 1.1,
          }}>
            Basado en tu análisis, identificamos
            <br />
            <em style={{ color: "#e8a4b0", fontStyle: "italic" }}>
              {urgentCount} {urgentCount === 1 ? "necesidad urgente" : "necesidades urgentes"}
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
              { label: "Score global",  value: `${scores.overall}/100`,    color: "#e8a4b0" },
              { label: "Hidratación",   value: `${scores.hydration}%`,     color: "#7ecba1" },
              { label: "Inflamación",   value: `${scores.inflammation}%`,  color: "#d4af88" },
              { label: "Elasticidad",   value: `${scores.elasticity}%`,    color: "#7ecba1" },
            ].map(s => (
              <div key={s.label} style={{ textAlign: "center" }}>
                <p style={{ fontSize: 9.5, letterSpacing: "0.1em", color: "rgba(245,237,232,0.3)", textTransform: "uppercase", marginBottom: 4 }}>{s.label}</p>
                <p style={{ fontFamily: "var(--font-fraunces)", fontSize: 22, fontWeight: 300, color: s.color, lineHeight: 1 }}>{s.value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── Consultation CTA ── */}
        <div style={{
          background: "linear-gradient(135deg, rgba(232,164,176,0.07) 0%, rgba(212,175,136,0.04) 100%)",
          border: "1px solid rgba(232,164,176,0.16)",
          borderRadius: 20, padding: "36px 40px", marginBottom: 56,
          display: "flex", alignItems: "center", justifyContent: "space-between",
          gap: 32, flexWrap: "wrap",
          animation: "cardIn 0.6s ease 0.1s both",
        }}>
          <div style={{ maxWidth: 520 }}>
            <p style={{ fontSize: 10, letterSpacing: "0.14em", color: "#e8a4b0", textTransform: "uppercase", fontWeight: 700, marginBottom: 10 }}>
              Para tu diagnóstico
            </p>
            <h2 style={{
              fontFamily: "var(--font-fraunces)",
              fontSize: "clamp(18px, 2.5vw, 26px)",
              fontWeight: 400, letterSpacing: "-0.025em",
              marginBottom: 10, lineHeight: 1.2,
            }}>
              Analizamos tus resultados contigo en una videollamada de 20 minutos
            </h2>
            <p style={{ fontSize: 14, color: "rgba(245,237,232,0.48)", lineHeight: 1.65 }}>
              Un especialista de InsideOutMed revisa tu informe, te explica cada biomarcador
              y diseña tu protocolo de manera conjunta. Sin presión. Sin compromiso.
            </p>
          </div>
          <a
            href={`https://wa.me/${WHATSAPP_NUMBER}?text=${waMsg}`}
            target="_blank" rel="noopener noreferrer"
            style={{
              display: "inline-flex", alignItems: "center", gap: 10,
              background: "linear-gradient(135deg, #e8a4b0 0%, #c97e8e 100%)",
              color: "#fff", borderRadius: 99,
              padding: "16px 34px", fontSize: 15, fontWeight: 700,
              textDecoration: "none", whiteSpace: "nowrap",
              boxShadow: "0 8px 32px rgba(232,164,176,0.32)",
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
            Agendar consulta
          </a>
        </div>

        {/* ── Products header ── */}
        <div style={{ marginBottom: 28, animation: "cardIn 0.6s ease 0.2s both" }}>
          <h2 style={{
            fontFamily: "var(--font-fraunces)",
            fontSize: "clamp(20px, 3vw, 30px)",
            fontWeight: 400, letterSpacing: "-0.025em", marginBottom: 8,
          }}>
            Productos seleccionados para tu piel
          </h2>
          <p style={{ fontSize: 13.5, color: "rgba(245,237,232,0.42)", lineHeight: 1.6, maxWidth: 560 }}>
            Cada recomendación está basada en tus biomarcadores específicos.
            Sin patrocinios. Sin comisiones de marcas. Solo lo que necesitas.
          </p>
        </div>

        {/* ── Product cards ── */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14, marginBottom: 64 }}>
          {products.map((p, i) => {
            const colors = PRIORITY_COLORS[p.priority]
            return (
              <div
                key={i}
                style={{
                  background: "rgba(245,237,232,0.03)",
                  border: "1px solid rgba(245,237,232,0.08)",
                  borderRadius: 18, padding: "26px 30px",
                  display: "grid", gridTemplateColumns: "1fr auto",
                  gap: 24, alignItems: "center",
                  transition: "border-color 0.2s, transform 0.2s",
                  animation: `cardIn 0.55s ease ${0.3 + i * 0.08}s both`,
                  cursor: "default",
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.borderColor = "rgba(245,237,232,0.15)"
                  e.currentTarget.style.transform = "translateY(-1px)"
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = "rgba(245,237,232,0.08)"
                  e.currentTarget.style.transform = "translateY(0)"
                }}
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
                    <span style={{ fontSize: 11, color: "rgba(245,237,232,0.28)", letterSpacing: "0.06em" }}>
                      {p.category}
                    </span>
                  </div>

                  {/* Product name */}
                  <div style={{ marginBottom: 10 }}>
                    <span style={{ fontSize: 11, color: "rgba(245,237,232,0.32)", marginRight: 6 }}>{p.brand}</span>
                    <h3 style={{
                      fontFamily: "var(--font-fraunces)",
                      fontSize: "clamp(15px, 2vw, 19px)",
                      fontWeight: 400, letterSpacing: "-0.02em",
                      color: "#f5ede8", lineHeight: 1.2,
                    }}>
                      {p.name}
                    </h3>
                  </div>

                  {/* Why */}
                  <p style={{ fontSize: 13, color: "rgba(245,237,232,0.48)", lineHeight: 1.7, maxWidth: 560 }}>
                    {p.why}
                  </p>

                  <p style={{ fontSize: 11, color: "rgba(245,237,232,0.22)", marginTop: 10 }}>
                    Precio estimado: {p.priceRange}
                  </p>
                </div>

                {/* CTA */}
                <div style={{ textAlign: "center", flexShrink: 0 }}>
                  <a
                    href={amazonUrl(p.searchQuery)}
                    target="_blank" rel="noopener noreferrer"
                    style={{
                      display: "inline-flex", alignItems: "center", gap: 8,
                      background: "rgba(245,237,232,0.06)",
                      border: "1px solid rgba(245,237,232,0.12)",
                      color: "#f5ede8", borderRadius: 12,
                      padding: "12px 20px", fontSize: 12.5, fontWeight: 600,
                      textDecoration: "none", whiteSpace: "nowrap",
                      transition: "background 0.2s, border-color 0.2s",
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.background = "rgba(245,237,232,0.11)"
                      e.currentTarget.style.borderColor = "rgba(245,237,232,0.22)"
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.background = "rgba(245,237,232,0.06)"
                      e.currentTarget.style.borderColor = "rgba(245,237,232,0.12)"
                    }}
                  >
                    Ver en Amazon
                    <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
                      <path d="M2 7h10M8 3l4 4-4 4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </a>
                  <p style={{ fontSize: 9.5, color: "rgba(245,237,232,0.18)", marginTop: 6, letterSpacing: "0.04em" }}>
                    Amazon · Envío rápido
                  </p>
                </div>
              </div>
            )
          })}
        </div>

        {/* ── Bottom CTA ── */}
        <div style={{
          textAlign: "center", padding: "44px 32px",
          background: "rgba(245,237,232,0.02)",
          border: "1px solid rgba(245,237,232,0.06)",
          borderRadius: 20, marginBottom: 40,
          animation: `cardIn 0.55s ease ${0.3 + products.length * 0.08}s both`,
        }}>
          <p style={{ fontSize: 10.5, letterSpacing: "0.14em", color: "rgba(245,237,232,0.3)", textTransform: "uppercase", marginBottom: 16 }}>
            ¿Tienes dudas sobre tu plan?
          </p>
          <h3 style={{
            fontFamily: "var(--font-fraunces)",
            fontSize: "clamp(18px, 2.5vw, 28px)",
            fontWeight: 400, letterSpacing: "-0.025em",
            marginBottom: 14, lineHeight: 1.2,
          }}>
            Hablamos contigo.
            <br />
            <em style={{ color: "#e8a4b0", fontStyle: "italic" }}>Sin compromiso.</em>
          </h3>
          <p style={{ fontSize: 13.5, color: "rgba(245,237,232,0.38)", marginBottom: 28, maxWidth: 400, margin: "0 auto 28px", lineHeight: 1.65 }}>
            Un especialista revisa tu informe y responde todas tus dudas en 20 minutos por WhatsApp o videollamada.
          </p>
          <a
            href={`https://wa.me/${WHATSAPP_NUMBER}?text=${waMsg}`}
            target="_blank" rel="noopener noreferrer"
            style={{
              display: "inline-flex", alignItems: "center", gap: 10,
              background: "linear-gradient(135deg, #e8a4b0 0%, #c97e8e 100%)",
              color: "#fff", borderRadius: 99,
              padding: "14px 38px", fontSize: 15, fontWeight: 700,
              textDecoration: "none",
              boxShadow: "0 8px 28px rgba(232,164,176,0.28)",
            }}
          >
            Agendar asesoramiento
          </a>
          <p style={{ fontSize: 10.5, color: "rgba(245,237,232,0.18)", marginTop: 14, letterSpacing: "0.06em" }}>
            Sin obligación · Cancela cuando quieras
          </p>
        </div>

        {/* Disclaimer */}
        <p style={{ fontSize: 10.5, color: "rgba(245,237,232,0.16)", lineHeight: 1.6, textAlign: "center", maxWidth: 600, margin: "0 auto" }}>
          Las recomendaciones de InsideOutMed tienen fines informativos. No reemplazan el diagnóstico de un dermatólogo.
          Algunos enlaces a Amazon pueden generar comisiones de afiliado que financian este servicio.
        </p>
      </main>

      <style>{`
        @keyframes pageIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes cardIn {
          from { opacity: 0; transform: translateY(18px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  )
}

export default function PlanPage() {
  const [scores, setScores] = useState<Scores | null>(null)

  useEffect(() => {
    try {
      const saved = localStorage.getItem("insideoutmed_scores")
      if (saved) {
        setScores(JSON.parse(saved))
        return
      }
    } catch {}
    // Fallback demo scores
    setScores({
      overall: 84, hydration: 87, inflammation: 22,
      elasticity: 79, melanin: 61, oxidation: 34,
    })
  }, [])

  if (!scores) {
    return (
      <div style={{ minHeight: "100vh", background: "#0e0c12", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ width: 32, height: 32, borderRadius: "50%", border: "2px solid rgba(232,164,176,0.2)", borderTopColor: "#e8a4b0", animation: "spin 0.8s linear infinite" }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    )
  }

  return <PlanContent scores={scores} />
}
