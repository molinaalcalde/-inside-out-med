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

    // FAQ
    "faq.badge": "Preguntas frecuentes",
    "faq.h1": "Todo lo que",
    "faq.h2": "necesitas saber",
    "faq.cta.h": "¿Tienes más preguntas?",
    "faq.cta.sub": "Escríbenos y te respondemos en menos de 24 horas.",
    "faq.cta.btn": "Escribirnos",

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
  },

  en: {
    // Nav
    "nav.howItWorks": "How It Works",
    "nav.results": "Results",
    "nav.testimonials": "Testimonials",
    "nav.cta": "How Old Do I Look?",
    "nav.start": "Start",

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

    // Face scroll
    "scroll.s1.h": "How Old Do You Look?",
    "scroll.s1.s": "Your face says a number. It's not always what you think.",
    "scroll.s2.h": "She's 42.",
    "scroll.s2.s": "But her face tells a different story.",
    "scroll.s3.h": "We Analyze 9 Zones.",
    "scroll.s3.s": "Smoothness, inflammation, collagen — metric by metric.",
    "scroll.s4.h": "Result: She Looks 45.",
    "scroll.s4.s": "+3 years above her real age.",
    "scroll.s5.h": "She'll look 42 years old again.",
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
    "scroll.panel.recovery": "With her personalized plan she can get back to",
    "scroll.panel.orLess": "42 or less",
    "scroll.panel.weeks": "in 12 weeks.",
    "scroll.panel.cta": "What about you?",
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
    "test.h2": "— Those Who Already Tried It",
    "test.trust.1": "Private Data",
    "test.trust.2": "No Photo Storage",
    "test.trust.3": "Results in 60 Seconds",
    "test.trust.4": "Medically Reviewed Protocol",

    // FAQ
    "faq.badge": "FAQ",
    "faq.h1": "Everything You",
    "faq.h2": "Need to Know",
    "faq.cta.h": "Have More Questions?",
    "faq.cta.sub": "Write to us and we'll respond within 24 hours.",
    "faq.cta.btn": "Contact Us",

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
