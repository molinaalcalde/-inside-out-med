"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"

type Locale = "es" | "en"

interface LanguageContextValue {
  locale: Locale
  setLocale: (l: Locale) => void
  t: (key: string) => string
}

const LanguageContext = createContext<LanguageContextValue>({
  locale: "es",
  setLocale: () => {},
  t: (k) => k,
})

export function useLanguage() {
  return useContext(LanguageContext)
}

// ── Translations ─────────────────────────────────────────────────
const translations: Record<Locale, Record<string, string>> = {
  es: {
    // Nav
    "nav.howItWorks": "Cómo funciona",
    "nav.results": "Resultados",
    "nav.testimonials": "Testimonios",
    "nav.cta": "¿Qué edad aparento?",
    "nav.start": "Empezar",
    "nav.mobileCta": "Analizar mi rostro",

    // Hero
    "hero.badge": "Análisis facial en 60 segundos",
    "hero.h1.1": "¿Qué edad",
    "hero.h1.2": "aparentas?",
    "hero.h1.3": "Descúbrelo gratis.",
    "hero.sub.1": "Tu rostro dice una edad. A veces coincide con la tuya. A veces no.",
    "hero.sub.2": "Escaneamos tu cara y te decimos qué edad aparentas — y qué hacer para mantenerla o mejorarla.",
    "hero.sub.3": "60 segundos. Una selfie. Sin compromiso.",
    "hero.cta": "Descubrir qué edad aparento",
    "hero.secondary": "Ver cómo funciona",
    "hero.social.1": "+50.000 personas",
    "hero.social.2": "ya saben qué edad aparentan",
    "hero.trust": "Sin tarjeta · Resultado en 60 segundos · 100% privado",

    // Hero biomarkers
    "bio.luminosity": "Luminosidad",
    "bio.smoothness": "Suavidad",
    "bio.uniformity": "Uniformidad",
    "bio.collagen": "Salud del colágeno",
    "bio.inflammation": "Control de inflamación",
    "bio.sunProtection": "Protección solar",
    "bio.vascular": "Salud vascular",
    "bio.forehead": "Frente",
    "bio.eyeContour": "Contorno ocular",
    "bio.cheeks": "Mejillas",
    "bio.tZone": "Zona T",
    "bio.jawline": "Mandíbula",

    // Face scroll
    "scroll.s1.h": "¿Qué edad aparentas?",
    "scroll.s1.s": "Tu cara dice un número. No siempre es el que crees.",
    "scroll.s2.h": "Ella tiene 42.",
    "scroll.s2.s": "Pero su rostro dice otra cosa.",
    "scroll.s3.h": "Analizamos 9 zonas.",
    "scroll.s3.s": "Suavidad, inflamación, colágeno — dato por dato.",
    "scroll.s4.h": "Resultado: aparenta 45.",
    "scroll.s4.s": "+3 años por encima de su edad real.",
    "scroll.s5.h": "Volverá a verse como de 42 años.",
    "scroll.s5.s": "O incluso menos. En 12 semanas, con el plan correcto.",
    "scroll.label": "InsideOutMed",
    "scroll.panel.title": "Resultado del análisis",
    "scroll.panel.realAge": "Edad real",
    "scroll.panel.skinAge": "Tu piel",
    "scroll.panel.above": "+3 años por encima",
    "scroll.panel.detected": "Detectamos",
    "scroll.panel.solar": "Protección solar",
    "scroll.panel.hydration": "Suavidad",
    "scroll.panel.collagen": "Salud del colágeno",
    "scroll.panel.recovery": "Con su plan puede volver a verse como de",
    "scroll.panel.orLess": "42 años o menos",
    "scroll.panel.weeks": "en 12 semanas.",
    "scroll.panel.cta": "¿Y tu piel?",
    "scroll.panel.years": "años",
    "scroll.panel.looksLike": "Aparenta",
    "scroll.progress": "Scroll",

    // Stats
    "stats.label": "En números",
    "stats.1.value": "50.000+",
    "stats.1.label": "personas ya saben qué edad aparentan",
    "stats.1.note": "y contando",
    "stats.2.value": "7",
    "stats.2.label": "biomarcadores faciales analizados en tiempo real",
    "stats.2.note": "por análisis",
    "stats.3.value": "60s",
    "stats.3.label": "de tu selfie a saber qué edad aparentas",
    "stats.3.note": "sin citas",
    "stats.4.value": "9",
    "stats.4.label": "zonas faciales analizadas una por una",
    "stats.4.note": "mapa completo",

    // How it works
    "how.badge": "Proceso",
    "how.h1": "De tu selfie",
    "how.h2": "a saber qué edad aparentas",
    "how.h3": "en 60 segundos.",
    "how.sub": "Cuatro pasos. Sin complicaciones. Sin filtros.",
    "how.step": "Paso",
    "how.s1.title": "Una selfie. Sin filtros.",
    "how.s1.body": "Usa tu cámara frontal con luz natural. Sin maquillaje si puedes. Treinta segundos de tu tiempo.",
    "how.s2.title": "9 zonas. 7 biomarcadores.",
    "how.s2.body": "Suavidad, colágeno, inflamación, protección solar, uniformidad y más. Zona por zona, dato por dato.",
    "how.s3.title": "Descubre qué edad aparentas",
    "how.s3.body": "Te revelamos la edad que proyecta tu rostro y qué está sumando años. Visual, directo, sin rodeos.",
    "how.s4.title": "Tu plan, solo tuyo",
    "how.s4.body": "Ingredientes activos, rutinas y productos ordenados por urgencia. Adaptados a lo que encontramos en tu piel.",

    // Testimonials
    "test.badge": "Testimonios",
    "test.h1": "Lo que dicen",
    "test.h2": "las que ya lo probaron",
    "test.trust.1": "Datos privados",
    "test.trust.2": "Sin almacenamiento de fotos",
    "test.trust.3": "Resultados en 60 segundos",
    "test.trust.4": "Protocolo médico revisado",
    "test.r1.1.quote": "Mi edad facial salió 4 años menor que mi edad real. No me lo esperaba. Ahora sé qué hacer para mantenerla así.",
    "test.r1.1.name": "Renata G.",
    "test.r1.1.role": "Consultora, 43 años",
    "test.r1.2.quote": "El informe fue más claro que el de mi dermatóloga. Zonas específicas, causas probables, sin tecnicismos.",
    "test.r1.2.name": "Valentina M.",
    "test.r1.2.role": "Médica, 34 años",
    "test.r1.3.quote": "Seguí el plan 6 semanas. Mis manchas bajaron notablemente. Por primera vez entiendo mi rutina de skincare.",
    "test.r1.3.name": "Camila R.",
    "test.r1.3.role": "Nutricionista, 29 años",
    "test.r1.4.quote": "En mi clínica lo usamos como pre-screening. Los pacientes llegan con información real y ahorramos tiempo.",
    "test.r1.4.name": "Dra. Andrea P.",
    "test.r1.4.role": "Dermatóloga",
    "test.r1.5.quote": "Gastaba una fortuna en productos que no hacían nada. Ahora sé exactamente qué necesita mi piel y qué no.",
    "test.r1.5.name": "Isabel F.",
    "test.r1.5.role": "Diseñadora, 37 años",
    "test.r2.1.quote": "Me daba miedo que fuera marketing vacío. Fue todo lo contrario: datos reales que no esperaba ver.",
    "test.r2.1.name": "Lucía V.",
    "test.r2.1.role": "Abogada, 32 años",
    "test.r2.2.quote": "El protocolo personalizado cambió mi piel en 8 semanas. Nunca pensé que era tan sencillo si sabes el qué.",
    "test.r2.2.name": "Mariana T.",
    "test.r2.2.role": "Empresaria, 45 años",
    "test.r2.3.quote": "Le recomendé a mi hermana y a mis amigas. Todas quedamos con el análisis de inflamación — ni sospechábamos.",
    "test.r2.3.name": "Daniela A.",
    "test.r2.3.role": "Profesora, 38 años",
    "test.r2.4.quote": "Llevo años con acné hormonal sin entender por qué. El análisis me dio un mapa claro para empezar a tratarlo.",
    "test.r2.4.name": "Paula M.",
    "test.r2.4.role": "Farmacéutica, 26 años",
    "test.r2.5.quote": "La precisión por zonas me sorprendió. Exactamente donde yo notaba los problemas, el análisis lo marcó.",
    "test.r2.5.name": "Sofía L.",
    "test.r2.5.role": "Arquitecta, 41 años",

    // FAQ
    "faq.badge": "Preguntas frecuentes",
    "faq.h1": "Todo lo que",
    "faq.h2": "necesitas saber",
    "faq.cta.h": "¿Tienes más preguntas?",
    "faq.cta.sub": "Escríbenos y te respondemos en menos de 24 horas.",
    "faq.cta.btn": "Escribirnos",
    "faq.cta.waText": "Hola,%20tengo%20una%20consulta%20sobre%20InsideOutMed",
    "faq.1.q": "¿Es realmente preciso o es solo marketing?",
    "faq.1.a": "El análisis evalúa 7 biomarcadores faciales en 9 zonas distintas de tu rostro. No es un cuestionario ni una estimación genérica: es una medición real de tu piel basada en tecnología avanzada de imagen. Los resultados varían según la calidad de iluminación, pero en condiciones estándar la lectura de cada zona es consistente y fiable.",
    "faq.2.q": "¿Mis fotos se guardan en algún servidor?",
    "faq.2.a": "No. Tu imagen se procesa de forma segura y no se almacena en ningún servidor externo. No la compartimos con terceros. Tu privacidad es no negociable para nosotros.",
    "faq.3.q": "¿Necesito tener conocimiento de skincare para entender mi informe?",
    "faq.3.a": "Para nada. El informe está diseñado en lenguaje directo: qué está pasando en tu piel, por qué ocurre y qué hacer al respecto. Si algo no queda claro, la consulta de asesoramiento existe exactamente para eso.",
    "faq.4.q": "¿Qué diferencia hay entre esto y un dermatólogo?",
    "faq.4.a": "Un dermatólogo puede diagnosticar enfermedades clínicas y recetar medicamentos. Nosotros hacemos algo diferente: análisis preventivo y optimización de tu rutina de skincare basado en el estado real de tu piel hoy. Son complementarios, no excluyentes. Si tienes sospecha de patología, visita a un profesional.",
    "faq.5.q": "¿Por qué debería confiar en los productos que me recomiendan?",
    "faq.5.a": "No te recomendamos una marca. Te recomendamos ingredientes activos concretos (niacinamida, retinol, ácido hialurónico, etc.) basados en lo que encontramos en tu análisis, y luego te mostramos opciones reales en Amazon ordenadas por valoración y precio. Tú eliges.",
    "faq.6.q": "¿Funciona para todo tipo de piel y tono?",
    "faq.6.a": "Sí. Nuestro análisis está diseñado para funcionar con todos los fototipos de piel (Fitzpatrick I–VI). Trabaja con análisis de textura, reflexión de luz y distribución zonal que son independientes del tono de piel. Si encuentras algún caso en que los resultados no sean representativos, queremos saberlo.",
    "faq.7.q": "¿Cuánto tiempo duran los resultados del análisis?",
    "faq.7.a": "Tu informe queda guardado en tu sesión durante 30 días. Puedes volver a analizarte cuando quieras — de hecho, recomendamos hacerlo cada 4–6 semanas para ver cómo responde tu piel a los cambios de rutina.",

    // CTA
    "cta.badge": "Gratis · Sin tarjeta · 60 segundos",
    "cta.h1": "¿Qué edad",
    "cta.h2": "aparentas realmente?",
    "cta.sub": "Una selfie. Descubre qué edad aparentas. Y qué hacer para verte más joven.",
    "cta.btn": "Descubrir qué edad aparento",
    "cta.footer": "+50.000 personas ya saben qué edad aparentan · 100% privado",

    // Footer
    "footer.brand": "InsideOutMed",
    "footer.desc": "Análisis facial avanzado. Tu piel, entendida desde adentro.",
    "footer.rights": "Todos los derechos reservados.",
    "footer.disclaimer": "InsideOutMed es un servicio de análisis facial con fines informativos. No reemplaza el diagnóstico de un profesional de la salud. Los resultados son orientativos y deben interpretarse junto con un médico o dermatólogo.",
    "footer.privacy": "Privacidad",
    "footer.terms": "Términos",
    "footer.contact": "Contacto",
    "footer.blog": "Blog",
    "footer.doctors": "Médicos",
    "footer.enterprise": "Empresas",

    // Privacy page
    "privacy.title": "Política de Privacidad",
    "privacy.dataTitle": "Datos que recopilamos",
    "privacy.dataBody": "InsideOutMed recopila tu nombre, email, teléfono y foto facial exclusivamente para generar tu análisis personalizado. Tu foto se procesa en tu dispositivo y NO se almacena en nuestros servidores.",
    "privacy.imageTitle": "Procesamiento de imágenes",
    "privacy.imageBody": "El análisis facial se ejecuta 100% en tu navegador usando MediaPipe. Las imágenes nunca salen de tu dispositivo ni se envían a servidores externos.",
    "privacy.useTitle": "Uso de datos",
    "privacy.useBody": "Tus datos de contacto se utilizan únicamente para enviarte tu informe y recomendaciones personalizadas. No vendemos ni compartimos tus datos con terceros.",
    "privacy.natureTitle": "Naturaleza del servicio",
    "privacy.natureBody": "InsideOutMed ofrece una estimación visual educativa basada en biomarcadores faciales. No constituye diagnóstico médico ni reemplaza la evaluación de un profesional de la salud.",
    "privacy.contactTitle": "Contacto",
    "privacy.contactBody": "Para consultas sobre privacidad, escríbenos a privacy@insideoutmed.com",
    "privacy.updated": "Última actualización: julio 2026",
  },

  en: {
    // Nav
    "nav.howItWorks": "How It Works",
    "nav.results": "Results",
    "nav.testimonials": "Testimonials",
    "nav.cta": "How Old Do I Look?",
    "nav.start": "Start",
    "nav.mobileCta": "Analyze My Face",

    // Hero
    "hero.badge": "Facial Analysis in 60 Seconds",
    "hero.h1.1": "How Old",
    "hero.h1.2": "Do You Look?",
    "hero.h1.3": "Find Out Free.",
    "hero.sub.1": "Your face tells an age. Sometimes it matches yours. Sometimes it doesn't.",
    "hero.sub.2": "We scan your face and reveal how old you actually look — and what to do about it.",
    "hero.sub.3": "60 seconds. One selfie. No strings attached.",
    "hero.cta": "Discover How Old I Look",
    "hero.secondary": "See How It Works",
    "hero.social.1": "+50,000 people",
    "hero.social.2": "already know how old they look",
    "hero.trust": "No credit card · Results in 60 seconds · 100% private",

    // Hero biomarkers
    "bio.luminosity": "Luminosity",
    "bio.smoothness": "Smoothness",
    "bio.uniformity": "Uniformity",
    "bio.collagen": "Collagen Health",
    "bio.inflammation": "Inflammation Control",
    "bio.sunProtection": "Sun Protection",
    "bio.vascular": "Vascular Health",
    "bio.forehead": "Forehead",
    "bio.eyeContour": "Eye Contour",
    "bio.cheeks": "Cheeks",
    "bio.tZone": "T-Zone",
    "bio.jawline": "Jawline",

    // Face scroll
    "scroll.s1.h": "How Old Do You Look?",
    "scroll.s1.s": "Your face says a number. It's not always what you think.",
    "scroll.s2.h": "She's 42.",
    "scroll.s2.s": "But her face tells a different story.",
    "scroll.s3.h": "We Analyze 9 Zones.",
    "scroll.s3.s": "Smoothness, inflammation, collagen — metric by metric.",
    "scroll.s4.h": "Result: She Looks 45.",
    "scroll.s4.s": "+3 years above her real age.",
    "scroll.s5.h": "She'll look 42 again.",
    "scroll.s5.s": "Or even younger. In 12 weeks, with the right plan.",
    "scroll.label": "InsideOutMed",
    "scroll.panel.title": "Analysis Result",
    "scroll.panel.realAge": "Real Age",
    "scroll.panel.skinAge": "Your Skin",
    "scroll.panel.above": "+3 years above",
    "scroll.panel.detected": "We Detected",
    "scroll.panel.solar": "Sun Protection",
    "scroll.panel.hydration": "Smoothness",
    "scroll.panel.collagen": "Collagen Health",
    "scroll.panel.recovery": "With her personalized plan she can look",
    "scroll.panel.orLess": "42 or younger",
    "scroll.panel.weeks": "in 12 weeks.",
    "scroll.panel.cta": "What about your skin?",
    "scroll.panel.years": "yrs",
    "scroll.panel.looksLike": "Looks",
    "scroll.progress": "Scroll",

    // Stats
    "stats.label": "By the Numbers",
    "stats.1.value": "50,000+",
    "stats.1.label": "people already know how old they look",
    "stats.1.note": "and counting",
    "stats.2.value": "7",
    "stats.2.label": "facial biomarkers analyzed in real time",
    "stats.2.note": "per analysis",
    "stats.3.value": "60s",
    "stats.3.label": "from selfie to knowing how old you look",
    "stats.3.note": "no appointments",
    "stats.4.value": "9",
    "stats.4.label": "facial zones analyzed one by one",
    "stats.4.note": "complete map",

    // How it works
    "how.badge": "Process",
    "how.h1": "From Your Selfie",
    "how.h2": "to Knowing How Old You Look",
    "how.h3": "in 60 Seconds.",
    "how.sub": "Four steps. No hassle. No filters.",
    "how.step": "Step",
    "how.s1.title": "One Selfie. No Filters.",
    "how.s1.body": "Use your front camera with natural light. No makeup if possible. Thirty seconds of your time.",
    "how.s2.title": "9 Zones. 7 Biomarkers.",
    "how.s2.body": "Smoothness, collagen, inflammation, sun protection, uniformity and more. Zone by zone, metric by metric.",
    "how.s3.title": "Discover How Old You Look",
    "how.s3.body": "We reveal the age your face projects and what's adding years. Visual, direct, no sugarcoating.",
    "how.s4.title": "Your Plan. Yours Only.",
    "how.s4.body": "Active ingredients, routines and products ranked by urgency. Tailored to what we found in your skin.",

    // Testimonials
    "test.badge": "Testimonials",
    "test.h1": "What They Say",
    "test.h2": "Those Who Already Tried It",
    "test.trust.1": "Private Data",
    "test.trust.2": "No Photo Storage",
    "test.trust.3": "Results in 60 Seconds",
    "test.trust.4": "Medically Reviewed Protocol",
    "test.r1.1.quote": "My facial age came back 4 years younger than my real age. I didn't expect that. Now I know exactly what to do to keep it that way.",
    "test.r1.1.name": "Renata G.",
    "test.r1.1.role": "Consultant, 43",
    "test.r1.2.quote": "The report was clearer than my dermatologist's. Specific zones, probable causes, no jargon.",
    "test.r1.2.name": "Valentina M.",
    "test.r1.2.role": "Physician, 34",
    "test.r1.3.quote": "I followed the plan for 6 weeks. My dark spots faded noticeably. For the first time I actually understand my skincare routine.",
    "test.r1.3.name": "Camila R.",
    "test.r1.3.role": "Nutritionist, 29",
    "test.r1.4.quote": "We use it as a pre-screening tool at my clinic. Patients arrive with real data and we save time.",
    "test.r1.4.name": "Dr. Andrea P.",
    "test.r1.4.role": "Dermatologist",
    "test.r1.5.quote": "I used to spend a fortune on products that did nothing. Now I know exactly what my skin needs and what it doesn't.",
    "test.r1.5.name": "Isabel F.",
    "test.r1.5.role": "Designer, 37",
    "test.r2.1.quote": "I was afraid it would be empty marketing. It was the opposite: real data I wasn't expecting to see.",
    "test.r2.1.name": "Lucia V.",
    "test.r2.1.role": "Attorney, 32",
    "test.r2.2.quote": "The personalized protocol changed my skin in 8 weeks. I never thought it could be that simple once you know what to fix.",
    "test.r2.2.name": "Mariana T.",
    "test.r2.2.role": "Entrepreneur, 45",
    "test.r2.3.quote": "I recommended it to my sister and friends. We were all surprised by the inflammation analysis — none of us suspected it.",
    "test.r2.3.name": "Daniela A.",
    "test.r2.3.role": "Teacher, 38",
    "test.r2.4.quote": "I've had hormonal acne for years without understanding why. The analysis gave me a clear roadmap to start treating it.",
    "test.r2.4.name": "Paula M.",
    "test.r2.4.role": "Pharmacist, 26",
    "test.r2.5.quote": "The zone-by-zone precision surprised me. Exactly where I noticed problems, the analysis flagged them.",
    "test.r2.5.name": "Sofia L.",
    "test.r2.5.role": "Architect, 41",

    // FAQ
    "faq.badge": "FAQ",
    "faq.h1": "Everything You",
    "faq.h2": "Need to Know",
    "faq.cta.h": "Have More Questions?",
    "faq.cta.sub": "Write to us and we'll respond within 24 hours.",
    "faq.cta.btn": "Contact Us",
    "faq.cta.waText": "Hi,%20I%20have%20a%20question%20about%20InsideOutMed",
    "faq.1.q": "Is it really accurate, or just marketing?",
    "faq.1.a": "The analysis evaluates 7 facial biomarkers across 9 distinct zones on your face. It's not a quiz or a generic estimate — it's a real measurement of your skin based on advanced imaging technology. Results vary with lighting quality, but under standard conditions the readings for each zone are consistent and reliable.",
    "faq.2.q": "Are my photos stored on a server?",
    "faq.2.a": "No. Your image is processed securely and is not stored on any external server. We do not share it with third parties. Your privacy is non-negotiable for us.",
    "faq.3.q": "Do I need skincare knowledge to understand my report?",
    "faq.3.a": "Not at all. The report is written in plain language: what's happening with your skin, why it's happening, and what to do about it. If anything is unclear, that's exactly what the advisory consultation is for.",
    "faq.4.q": "How is this different from a dermatologist?",
    "faq.4.a": "A dermatologist can diagnose clinical conditions and prescribe medication. We do something different: preventive analysis and skincare routine optimization based on the actual state of your skin today. They're complementary, not mutually exclusive. If you suspect a pathology, visit a professional.",
    "faq.5.q": "Why should I trust the products you recommend?",
    "faq.5.a": "We don't recommend a brand. We recommend specific active ingredients (niacinamide, retinol, hyaluronic acid, etc.) based on what we found in your analysis, and then show you real options on Amazon sorted by rating and price. You choose.",
    "faq.6.q": "Does it work for all skin types and tones?",
    "faq.6.a": "Yes. Our analysis is designed to work across all skin phototypes (Fitzpatrick I-VI). It uses texture analysis, light reflection and zonal distribution that are independent of skin tone. If you find a case where results aren't representative, we want to know about it.",
    "faq.7.q": "How long do my analysis results last?",
    "faq.7.a": "Your report is saved in your session for 30 days. You can re-analyze anytime — in fact, we recommend doing so every 4-6 weeks to see how your skin responds to routine changes.",

    // CTA
    "cta.badge": "Free · No Credit Card · 60 Seconds",
    "cta.h1": "How Old",
    "cta.h2": "Do You Really Look?",
    "cta.sub": "One selfie. Find out how old you look. And what to do to look younger.",
    "cta.btn": "Discover How Old I Look",
    "cta.footer": "+50,000 people already know how old they look · 100% private",

    // Footer
    "footer.brand": "InsideOutMed",
    "footer.desc": "Advanced facial analysis. Your skin, understood from the inside out.",
    "footer.rights": "All rights reserved.",
    "footer.disclaimer": "InsideOutMed is a facial analysis service for informational purposes. It does not replace professional medical diagnosis. Results are indicative and should be interpreted alongside a physician or dermatologist.",
    "footer.privacy": "Privacy",
    "footer.terms": "Terms",
    "footer.contact": "Contact",
    "footer.blog": "Blog",
    "footer.doctors": "Doctors",
    "footer.enterprise": "Enterprise",

    // Privacy page
    "privacy.title": "Privacy Policy",
    "privacy.dataTitle": "Data We Collect",
    "privacy.dataBody": "InsideOutMed collects your name, email, phone number and facial photo exclusively to generate your personalized analysis. Your photo is processed on your device and is NOT stored on our servers.",
    "privacy.imageTitle": "Image Processing",
    "privacy.imageBody": "Facial analysis runs 100% in your browser using MediaPipe. Images never leave your device and are never sent to external servers.",
    "privacy.useTitle": "Data Usage",
    "privacy.useBody": "Your contact information is used solely to send you your report and personalized recommendations. We do not sell or share your data with third parties.",
    "privacy.natureTitle": "Nature of the Service",
    "privacy.natureBody": "InsideOutMed provides an educational visual estimate based on facial biomarkers. It does not constitute a medical diagnosis and does not replace evaluation by a healthcare professional.",
    "privacy.contactTitle": "Contact",
    "privacy.contactBody": "For privacy inquiries, write to us at privacy@insideoutmed.com",
    "privacy.updated": "Last updated: July 2026",
  },
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("es")

  useEffect(() => {
    const saved = localStorage.getItem("insideoutmed_lang") as Locale | null
    if (saved === "en" || saved === "es") setLocaleState(saved)
  }, [])

  const setLocale = (l: Locale) => {
    setLocaleState(l)
    localStorage.setItem("insideoutmed_lang", l)
    document.documentElement.lang = l
  }

  const t = (key: string): string => {
    return translations[locale][key] || translations.es[key] || key
  }

  return (
    <LanguageContext value={{ locale, setLocale, t }}>
      {children}
    </LanguageContext>
  )
}
