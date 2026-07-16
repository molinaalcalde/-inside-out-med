---
name: insideoutmed-stack
description: Stack técnico, design system y patrones de InsideOutMed v2. Leer siempre al crear componentes, animaciones o páginas.
type: project
---

# InsideOutMed v2 — Stack & Patrones

## Stack

| Capa | Librería | Versión |
|------|----------|---------|
| Framework | Next.js 15 (App Router) | latest |
| Lenguaje | TypeScript strict | 5.x |
| Estilos | Tailwind CSS v4 | latest |
| Componentes | shadcn/ui | latest |
| Animaciones React | motion (ex Framer Motion) | latest |
| Animaciones timeline | GSAP + @gsap/react | latest |
| Smooth scroll | Lenis + @lenis/react | latest |
| Backend/Auth | Supabase | latest |
| IA facial | MediaPipe FaceLandmarker | @mediapipe/tasks-vision |
| Deploy | Vercel (auto desde main) | — |

## Arquitectura (bulletproof-react)

```
src/
  app/                      # Next.js App Router
    page.tsx                # Landing page (Server Component)
    layout.tsx              # Root layout — Lenis + providers
    globals.css
    (app)/                  # Route group para la app
      onboarding/page.tsx
      scan/page.tsx
      results/page.tsx
      plan/page.tsx
      projection/page.tsx
  features/                 # Cada feature es autocontenida
    landing/components/     # Hero, Nav, StatsBar, HowItWorks, etc.
    onboarding/             # Steps, store, components
    scan/                   # MediaPipe, VideoFeed, QualityCheck
    results/                # Reveal, Report, ZoneAccordion
    plan/                   # PhaseTabs, RecCard
  components/
    ui/                     # shadcn/ui components (copy-paste)
    providers/              # LenisProvider, SupabaseProvider
  lib/
    supabase/               # client.ts, server.ts
    mediapipe/              # faceLandmarker.ts, analysis.ts
    analysis/               # biomarkers.ts, zones.ts, scoring.ts
    recommendations/        # engine.ts (plan generator)
  hooks/                    # useGSAP, useInView, useFaceDetection
```

## Design System

### Tokens CSS (globals.css)
```css
:root {
  --bg: #0e0c12;
  --bg2: #1a1620;
  --bg3: #231e2b;
  --card: #1a1620;
  --ink: #f5ede8;
  --ink2: rgba(245,237,232,0.65);
  --muted: rgba(245,237,232,0.5);
  --rose: #e8a4b0;
  --rose-d: #c97e8e;
  --rose-l: rgba(232,164,176,0.12);
  --gold: #d4af88;
  --gold-l: rgba(212,175,136,0.15);
  --green: #7ecba1;
  --amber: #e8b86d;
  --red: #e87e7e;
  --line: rgba(245,237,232,0.10);
  --glass: rgba(245,237,232,0.06);
  --glass-border: rgba(245,237,232,0.12);
  --shadow: 0 20px 60px rgba(0,0,0,0.5);
  --r: 20px;
}
```

### Tipografía
- **Serif**: Fraunces (headings, números editoriales, display)
- **Sans**: Inter (body, labels, UI)
- H1: Fraunces 500, -0.03em, line-height 1.06
- H2: Fraunces 500, -0.02em, line-height 1.15
- Body: Inter 400, line-height 1.65

### Paleta funcional
- Dark luxury: `--bg` como fondo base
- Cristal: `rgba(245,237,232,0.04–0.08)` con `backdrop-filter: blur(20px)`
- Bordes: `rgba(245,237,232,0.08–0.12)`
- CTAs principales: blanco `rgba(245,237,232,0.96)` sobre oscuro
- CTAs secundarios: `--rose` gradient
- Números editoriales: `--gold`, Fraunces italic, 11px, letter-spacing 0.2em

## Patrones de Animación

### Con Motion (Framer Motion)
```tsx
// Fade up al hacer scroll
<motion.div
  initial={{ opacity: 0, y: 32 }}
  whileInView={{ opacity: 1, y: 0 }}
  viewport={{ once: true, margin: '-60px' }}
  transition={{ duration: 0.7, ease: [0.22, 0.61, 0.36, 1] }}
>

// Stagger de hijos
const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } }
}
const item = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 0.61, 0.36, 1] } }
}
```

### Con GSAP (scroll cinematográfico)
```tsx
import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import ScrollTrigger from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

// Dentro de componente:
useGSAP(() => {
  gsap.from('.hero-title', {
    y: 60, opacity: 0, duration: 1.2,
    ease: 'power3.out',
    scrollTrigger: { trigger: '.hero', start: 'top 80%' }
  })
})
```

### Smooth scroll con Lenis
```tsx
// En LenisProvider.tsx
'use client'
import { ReactLenis } from '@lenis/react'
export function LenisProvider({ children }) {
  return (
    <ReactLenis root options={{ lerp: 0.1, duration: 1.2, smoothWheel: true }}>
      {children}
    </ReactLenis>
  )
}
```

## Reglas de Calidad

1. **Server por defecto**: todo componente es Server Component a menos que necesite estado/eventos (`'use client'`)
2. **Animaciones siempre declarativas**: usar `motion` o GSAP, nunca `setTimeout` para animar
3. **No hardcodear colores**: siempre CSS custom properties (`var(--rose)`, no `#e8a4b0`)
4. **shadcn/ui como base**: no crear componentes UI desde cero si hay uno en shadcn
5. **MediaPipe solo client-side**: todo lo de cámara y análisis en `'use client'` con `dynamic(() => import(...), { ssr: false })`
6. **Tipos estrictos**: no usar `any`. Los tipos van en `src/lib/types.ts`
7. **Responsive mobile-first**: Tailwind breakpoints `md:`, `lg:`, `xl:`
8. **`lp-reveal` pattern**: en landing, cada sección tiene `whileInView` de motion — no CSS classes manuales
