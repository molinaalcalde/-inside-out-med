"use client"

import { useLanguage } from "@/components/providers/language-provider"

export default function PrivacyPage() {
  const { locale } = useLanguage()
  const L = (es: string, en: string) => locale === "en" ? en : es

  return (
    <div style={{ minHeight: "100vh", background: "#0e0c12", color: "#f5ede8", fontFamily: "var(--font-inter, sans-serif)", padding: "120px 24px 80px", maxWidth: 720, margin: "0 auto" }}>
      <h1 style={{ fontFamily: "var(--font-fraunces)", fontSize: 32, marginBottom: 32 }}>{L("Política de Privacidad", "Privacy Policy")}</h1>

      <div style={{ fontSize: 14, color: "rgba(245,237,232,0.65)", lineHeight: 1.8, display: "flex", flexDirection: "column", gap: 24 }}>
        <section>
          <h2 style={{ fontSize: 18, color: "#f5ede8", marginBottom: 8 }}>{L("Datos que recopilamos", "Data we collect")}</h2>
          <p>{L(
            "InsideOutMed recopila tu nombre, email, teléfono y foto facial exclusivamente para generar tu análisis personalizado. Tu foto se procesa en tu dispositivo y NO se almacena en nuestros servidores.",
            "InsideOutMed collects your name, email, phone number, and facial photo exclusively to generate your personalized analysis. Your photo is processed on your device and is NOT stored on our servers."
          )}</p>
        </section>

        <section>
          <h2 style={{ fontSize: 18, color: "#f5ede8", marginBottom: 8 }}>{L("Procesamiento de imágenes", "Image processing")}</h2>
          <p>{L(
            "El análisis facial se ejecuta 100% en tu navegador usando MediaPipe. Las imágenes nunca salen de tu dispositivo ni se envían a servidores externos.",
            "Facial analysis runs 100% in your browser using MediaPipe. Images never leave your device and are never sent to external servers."
          )}</p>
        </section>

        <section>
          <h2 style={{ fontSize: 18, color: "#f5ede8", marginBottom: 8 }}>{L("Uso de datos", "Data usage")}</h2>
          <p>{L(
            "Tus datos de contacto se utilizan únicamente para enviarte tu informe y recomendaciones personalizadas. No vendemos ni compartimos tus datos con terceros.",
            "Your contact information is used solely to send you your report and personalized recommendations. We do not sell or share your data with third parties."
          )}</p>
        </section>

        <section>
          <h2 style={{ fontSize: 18, color: "#f5ede8", marginBottom: 8 }}>{L("Naturaleza del servicio", "Nature of the service")}</h2>
          <p>{L(
            "InsideOutMed ofrece una estimación visual educativa basada en biomarcadores faciales. No constituye diagnóstico médico ni reemplaza la evaluación de un profesional de la salud.",
            "InsideOutMed provides an educational visual estimate based on facial biomarkers. It does not constitute a medical diagnosis and does not replace evaluation by a healthcare professional."
          )}</p>
        </section>

        <section>
          <h2 style={{ fontSize: 18, color: "#f5ede8", marginBottom: 8 }}>{L("Contacto", "Contact")}</h2>
          <p>{L(
            "Para consultas sobre privacidad, escríbenos a privacy@insideoutmed.com",
            "For privacy inquiries, contact us at privacy@insideoutmed.com"
          )}</p>
        </section>
      </div>

      <p style={{ marginTop: 48, fontSize: 11, color: "rgba(245,237,232,0.25)" }}>{L("Última actualización: julio 2026", "Last updated: July 2026")}</p>
    </div>
  )
}
