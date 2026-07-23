"use client"

import { useLanguage } from "@/components/providers/language-provider"

const ROW_1 = [
  {
    quote: "Mi edad facial salió 4 años menor que mi edad real. No me lo esperaba. Ahora sé qué hacer para mantenerla así.",
    name: "Renata G.",
    role: "Consultora, 43 años",
    score: "93",
    avatar: "RG",
    color: "#e8a4b0",
  },
  {
    quote: "El informe fue más claro que el de mi dermatóloga. Zonas específicas, causas probables, sin tecnicismos.",
    name: "Valentina M.",
    role: "Médica, 34 años",
    score: "91",
    avatar: "VM",
    color: "#d4af88",
  },
  {
    quote: "Seguí el plan 6 semanas. Mis manchas bajaron notablemente. Por primera vez entiendo mi rutina de skincare.",
    name: "Camila R.",
    role: "Nutricionista, 29 años",
    score: "88",
    avatar: "CR",
    color: "#7ecba1",
  },
  {
    quote: "En mi clínica lo usamos como pre-screening. Los pacientes llegan con información real y ahorramos tiempo.",
    name: "Dra. Andrea P.",
    role: "Dermatóloga",
    score: "94",
    avatar: "AP",
    color: "#e8a4b0",
  },
  {
    quote: "Gastaba una fortuna en productos que no hacían nada. Ahora sé exactamente qué necesita mi piel y qué no.",
    name: "Isabel F.",
    role: "Diseñadora, 37 años",
    score: "82",
    avatar: "IF",
    color: "#d4af88",
  },
]

const ROW_2 = [
  {
    quote: "Me daba miedo que fuera marketing vacío. Fue todo lo contrario: datos reales que no esperaba ver.",
    name: "Lucía V.",
    role: "Abogada, 32 años",
    score: "85",
    avatar: "LV",
    color: "#7ecba1",
  },
  {
    quote: "El protocolo personalizado cambió mi piel en 8 semanas. Nunca pensé que era tan sencillo si sabes el qué.",
    name: "Mariana T.",
    role: "Empresaria, 45 años",
    score: "79",
    avatar: "MT",
    color: "#e8a4b0",
  },
  {
    quote: "Le recomendé a mi hermana y a mis amigas. Todas quedamos con el análisis de inflamación — ni sospechábamos.",
    name: "Daniela A.",
    role: "Profesora, 38 años",
    score: "87",
    avatar: "DA",
    color: "#d4af88",
  },
  {
    quote: "Llevo años con acné hormonal sin entender por qué. El análisis me dio un mapa claro para empezar a tratarlo.",
    name: "Paula M.",
    role: "Farmacéutica, 26 años",
    score: "71",
    avatar: "PM",
    color: "#7ecba1",
  },
  {
    quote: "La precisión por zonas me sorprendió. Exactamente donde yo notaba los problemas, el análisis lo marcó.",
    name: "Sofía L.",
    role: "Arquitecta, 41 años",
    score: "76",
    avatar: "SL",
    color: "#e8a4b0",
  },
]

function TestimonialCard({
  t,
}: {
  t: (typeof ROW_1)[number]
}) {
  return (
    <div
      style={{
        flexShrink: 0,
        width: "clamp(260px, 85vw, 360px)",
        marginRight: 16,
        padding: "24px 24px 20px",
        background: "rgba(245,237,232,0.03)",
        border: "1px solid rgba(245,237,232,0.08)",
        borderRadius: 16,
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
      }}
    >
      {/* Stars */}
      <div style={{ display: "flex", gap: 3, marginBottom: 16 }}>
        {[...Array(5)].map((_, i) => (
          <svg key={i} width="11" height="11" viewBox="0 0 12 12" fill="#d4af88" opacity={0.85}>
            <path d="M6 1l1.5 3 3.2.5-2.3 2.2.5 3.3L6 8.5l-2.9 1.5.5-3.3L1.3 4.5l3.2-.5L6 1z" />
          </svg>
        ))}
      </div>

      {/* Quote */}
      <p
        style={{
          fontSize: 14,
          color: "rgba(245,237,232,0.72)",
          lineHeight: 1.7,
          fontStyle: "italic",
          marginBottom: 20,
        }}
      >
        &ldquo;{t.quote}&rdquo;
      </p>

      {/* Author */}
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: "50%",
            background: `${t.color}1e`,
            border: `1px solid ${t.color}35`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 10,
            fontWeight: 700,
            color: t.color,
            flexShrink: 0,
          }}
        >
          {t.avatar}
        </div>
        <div style={{ flex: 1 }}>
          <p style={{ fontWeight: 600, fontSize: 12.5, color: "#f5ede8", marginBottom: 1 }}>{t.name}</p>
          <p style={{ fontSize: 10.5, color: "rgba(245,237,232,0.35)" }}>{t.role}</p>
        </div>
        <div
          style={{
            padding: "3px 10px",
            borderRadius: 99,
            background: `${t.color}12`,
            border: `1px solid ${t.color}28`,
            fontSize: 10.5,
            fontWeight: 700,
            color: t.color,
            flexShrink: 0,
          }}
        >
          {t.score}/100
        </div>
      </div>
    </div>
  )
}

export function Testimonials() {
  const { t } = useLanguage()
  const doubled1 = [...ROW_1, ...ROW_1]
  const doubled2 = [...ROW_2, ...ROW_2]

  return (
    <section id="testimonials" className="section" style={{ overflow: "hidden" }}>
      {/* Header */}
      <div className="container" style={{ marginBottom: 64 }}>
        <div style={{ textAlign: "center" }}>
          <p className="pill" style={{ marginBottom: 20 }}>{t("test.badge")}</p>
          <h2 className="display-lg">
            {t("test.h1")}
            <br />
            <em style={{ color: "#e8a4b0", fontStyle: "italic" }}>{t("test.h2")}</em>
          </h2>
        </div>
      </div>

      {/* Marquee rows */}
      <div
        className="testimonials-container"
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 14,
          WebkitMaskImage:
            "linear-gradient(to right, transparent, black 8%, black 92%, transparent)",
          maskImage:
            "linear-gradient(to right, transparent, black 8%, black 92%, transparent)",
        }}
      >
        {/* Row 1 — left */}
        <div className="marquee-track marquee-left marquee-row" style={{ display: "flex" }}>
          {doubled1.map((card, i) => (
            <TestimonialCard key={i} t={card} />
          ))}
        </div>

        {/* Row 2 — right */}
        <div className="marquee-track marquee-right marquee-row" style={{ display: "flex" }}>
          {doubled2.map((card, i) => (
            <TestimonialCard key={i} t={card} />
          ))}
        </div>
      </div>

      {/* Trust strip */}
      <div
        className="container"
        style={{
          marginTop: 72,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "clamp(32px, 5vw, 72px)",
          flexWrap: "wrap",
        }}
      >
        {[
          { icon: "⬡", text: t("test.trust.1") },
          { icon: "◈", text: t("test.trust.2") },
          { icon: "◇", text: t("test.trust.3") },
          { icon: "△", text: t("test.trust.4") },
        ].map((item, i) => (
          <div
            key={i}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              opacity: 0.32,
            }}
          >
            <span style={{ fontSize: 12, color: "rgba(245,237,232,0.6)" }}>{item.icon}</span>
            <span
              style={{
                fontSize: 11,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                color: "rgba(245,237,232,0.6)",
                fontWeight: 600,
              }}
            >
              {item.text}
            </span>
          </div>
        ))}
      </div>

      <style>{`
        @keyframes marquee-left {
          from { transform: translateX(0); }
          to   { transform: translateX(-50%); }
        }
        @keyframes marquee-right {
          from { transform: translateX(-50%); }
          to   { transform: translateX(0); }
        }
        .marquee-left  { animation: marquee-left  34s linear infinite; }
        .marquee-right { animation: marquee-right 40s linear infinite; }
        .marquee-track { will-change: transform; }
        @media (prefers-reduced-motion: reduce) {
          .marquee-left, .marquee-right { animation: none; }
        }
        @media (max-width: 640px) {
          .testimonials-container {
            display: flex !important;
            flex-direction: column !important;
            gap: 0 !important;
          }
          .marquee-row {
            animation: none !important;
            display: flex !important;
            overflow-x: auto !important;
            scroll-snap-type: x mandatory !important;
            -webkit-overflow-scrolling: touch !important;
            padding: 0 16px !important;
            gap: 12px !important;
          }
          .marquee-row > * {
            scroll-snap-align: center !important;
            flex-shrink: 0 !important;
            width: 85vw !important;
            max-width: 340px !important;
          }
          .marquee-row:nth-child(2) {
            display: none !important;
          }
        }
      `}</style>
    </section>
  )
}
