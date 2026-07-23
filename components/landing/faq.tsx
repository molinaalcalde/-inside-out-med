"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "motion/react"
import { useLanguage } from "@/components/providers/language-provider"

const WHATSAPP_NUMBER = "5491112345678" // TODO: Replace with real number

const QUESTIONS = [
  {
    q: "¿Es realmente preciso o es solo marketing?",
    a: "El análisis evalúa 7 biomarcadores faciales en 9 zonas distintas de tu rostro. No es un cuestionario ni una estimación genérica: es una medición real de tu piel basada en tecnología avanzada de imagen. Los resultados varían según la calidad de iluminación, pero en condiciones estándar la lectura de cada zona es consistente y fiable.",
  },
  {
    q: "¿Mis fotos se guardan en algún servidor?",
    a: "No. Tu imagen se procesa de forma segura y no se almacena en ningún servidor externo. No la compartimos con terceros. Tu privacidad es no negociable para nosotros.",
  },
  {
    q: "¿Necesito tener conocimiento de skincare para entender mi informe?",
    a: "Para nada. El informe está diseñado en lenguaje directo: qué está pasando en tu piel, por qué ocurre y qué hacer al respecto. Si algo no queda claro, la consulta de asesoramiento existe exactamente para eso.",
  },
  {
    q: "¿Qué diferencia hay entre esto y un dermatólogo?",
    a: "Un dermatólogo puede diagnosticar enfermedades clínicas y recetar medicamentos. Nosotros hacemos algo diferente: análisis preventivo y optimización de tu rutina de skincare basado en el estado real de tu piel hoy. Son complementarios, no excluyentes. Si tienes sospecha de patología, visita a un profesional.",
  },
  {
    q: "¿Por qué debería confiar en los productos que me recomiendan?",
    a: "No te recomendamos una marca. Te recomendamos ingredientes activos concretos (niacinamida, retinol, ácido hialurónico, etc.) basados en lo que encontramos en tu análisis, y luego te mostramos opciones reales en Amazon ordenadas por valoración y precio. Tú eliges.",
  },
  {
    q: "¿Funciona para todo tipo de piel y tono?",
    a: "Sí. Nuestro análisis está diseñado para funcionar con todos los fototipos de piel (Fitzpatrick I–VI). Trabaja con análisis de textura, reflexión de luz y distribución zonal que son independientes del tono de piel. Si encuentras algún caso en que los resultados no sean representativos, queremos saberlo.",
  },
  {
    q: "¿Cuánto tiempo duran los resultados del análisis?",
    a: "Tu informe queda guardado en tu sesión durante 30 días. Puedes volver a analizarte cuando quieras — de hecho, recomendamos hacerlo cada 4–6 semanas para ver cómo responde tu piel a los cambios de rutina.",
  },
]

function FAQItem({
  q,
  a,
  index,
}: {
  q: string
  a: string
  index: number
}) {
  const [open, setOpen] = useState(false)

  return (
    <div
      style={{
        borderBottom: "1px solid rgba(245,237,232,0.07)",
      }}
    >
      <button
        onClick={() => setOpen(!open)}
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 20,
          padding: "clamp(18px, 2.5vw, 24px) 0",
          textAlign: "left",
          background: "none",
          border: "none",
          cursor: "pointer",
          color: "inherit",
        }}
        aria-expanded={open}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 20, flex: 1 }}>
          {/* Ordinal */}
          <span
            style={{
              fontFamily: "var(--font-fraunces)",
              fontSize: 11,
              fontStyle: "italic",
              color: "rgba(245,237,232,0.2)",
              letterSpacing: "0.15em",
              flexShrink: 0,
              minWidth: 28,
            }}
          >
            {String(index + 1).padStart(2, "0")}
          </span>

          {/* Question */}
          <span
            style={{
              fontSize: "clamp(14px, 1.6vw, 16px)",
              color: open ? "#f5ede8" : "rgba(245,237,232,0.8)",
              fontWeight: 400,
              lineHeight: 1.45,
              transition: "color 0.2s ease",
            }}
          >
            {q}
          </span>
        </div>

        {/* Toggle icon */}
        <motion.span
          animate={{ rotate: open ? 45 : 0 }}
          transition={{ duration: 0.22, ease: [0.22, 0.61, 0.36, 1] }}
          style={{
            fontSize: 20,
            color: open ? "rgba(232,164,176,0.8)" : "rgba(245,237,232,0.22)",
            flexShrink: 0,
            lineHeight: 1,
            fontWeight: 300,
            display: "block",
            userSelect: "none",
          }}
          aria-hidden
        >
          +
        </motion.span>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.32, ease: [0.22, 0.61, 0.36, 1] }}
            style={{ overflow: "hidden" }}
          >
            <p
              style={{
                paddingLeft: 48,
                paddingBottom: "clamp(20px, 2.5vw, 28px)",
                fontSize: "clamp(14px, 1.5vw, 15px)",
                color: "rgba(245,237,232,0.52)",
                lineHeight: 1.8,
                maxWidth: 680,
              }}
            >
              {a}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export function FAQ() {
  const { t } = useLanguage()

  return (
    <section id="faq" className="section">
      <div className="container" style={{ maxWidth: 860 }}>
        {/* Header */}
        <div style={{ marginBottom: 64 }}>
          <p className="pill" style={{ marginBottom: 20 }}>{t("faq.badge")}</p>
          <h2 className="display-lg">
            {t("faq.h1")}
            <br />
            <em style={{ color: "#e8a4b0", fontStyle: "italic" }}>{t("faq.h2")}</em>
          </h2>
        </div>

        {/* Accordion */}
        <div style={{ borderTop: "1px solid rgba(245,237,232,0.07)" }}>
          {QUESTIONS.map((item, i) => (
            <FAQItem key={i} q={item.q} a={item.a} index={i} />
          ))}
        </div>

        {/* Bottom CTA */}
        <div
          style={{
            marginTop: 56,
            padding: "32px 36px",
            background: "rgba(245,237,232,0.03)",
            border: "1px solid rgba(245,237,232,0.07)",
            borderRadius: 16,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 24,
            flexWrap: "wrap",
          }}
        >
          <div>
            <p
              style={{
                fontSize: 15,
                color: "rgba(245,237,232,0.8)",
                fontWeight: 500,
                marginBottom: 4,
              }}
            >
              {t("faq.cta.h")}
            </p>
            <p style={{ fontSize: 13, color: "rgba(245,237,232,0.38)" }}>
              {t("faq.cta.sub")}
            </p>
          </div>
          <a
            href={`https://wa.me/${WHATSAPP_NUMBER}?text=Hola,%20tengo%20una%20consulta%20sobre%20InsideOutMed`}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-ghost"
            style={{ flexShrink: 0, textDecoration: "none" }}
          >
            {t("faq.cta.btn")}
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M2 7h10M8 4l3 3-3 3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </a>
        </div>
      </div>
    </section>
  )
}
