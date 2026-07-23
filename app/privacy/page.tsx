export default function PrivacyPage() {
  return (
    <div style={{ minHeight: "100vh", background: "#0e0c12", color: "#f5ede8", fontFamily: "var(--font-inter, sans-serif)", padding: "120px 24px 80px", maxWidth: 720, margin: "0 auto" }}>
      <h1 style={{ fontFamily: "var(--font-fraunces)", fontSize: 32, marginBottom: 32 }}>Política de Privacidad</h1>

      <div style={{ fontSize: 14, color: "rgba(245,237,232,0.65)", lineHeight: 1.8, display: "flex", flexDirection: "column", gap: 24 }}>
        <section>
          <h2 style={{ fontSize: 18, color: "#f5ede8", marginBottom: 8 }}>Datos que recopilamos</h2>
          <p>InsideOutMed recopila tu nombre, email, teléfono y foto facial exclusivamente para generar tu análisis personalizado. Tu foto se procesa en tu dispositivo y NO se almacena en nuestros servidores.</p>
        </section>

        <section>
          <h2 style={{ fontSize: 18, color: "#f5ede8", marginBottom: 8 }}>Procesamiento de imágenes</h2>
          <p>El análisis facial se ejecuta 100% en tu navegador usando MediaPipe. Las imágenes nunca salen de tu dispositivo ni se envían a servidores externos.</p>
        </section>

        <section>
          <h2 style={{ fontSize: 18, color: "#f5ede8", marginBottom: 8 }}>Uso de datos</h2>
          <p>Tus datos de contacto se utilizan únicamente para enviarte tu informe y recomendaciones personalizadas. No vendemos ni compartimos tus datos con terceros.</p>
        </section>

        <section>
          <h2 style={{ fontSize: 18, color: "#f5ede8", marginBottom: 8 }}>Naturaleza del servicio</h2>
          <p>InsideOutMed ofrece una estimación visual educativa basada en biomarcadores faciales. No constituye diagnóstico médico ni reemplaza la evaluación de un profesional de la salud.</p>
        </section>

        <section>
          <h2 style={{ fontSize: 18, color: "#f5ede8", marginBottom: 8 }}>Contacto</h2>
          <p>Para consultas sobre privacidad, escríbenos a privacy@insideoutmed.com</p>
        </section>
      </div>

      <p style={{ marginTop: 48, fontSize: 11, color: "rgba(245,237,232,0.25)" }}>Última actualización: julio 2026</p>
    </div>
  )
}
