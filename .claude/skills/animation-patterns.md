---
name: animation-patterns
description: Patrones de animación de nivel pro para InsideOutMed. Usar al crear cualquier animación, transición o efecto visual.
type: project
---

# Patrones de Animación Pro — InsideOutMed

## Jerarquía de herramientas

| Uso | Herramienta |
|-----|-------------|
| Entradas de componentes (fade, slide) | `motion` (Framer Motion) |
| Scroll-triggered cinematográfico | GSAP + ScrollTrigger |
| Smooth scroll | Lenis |
| SVG / canvas paths | GSAP |
| Hover micro-interacciones | motion `whileHover` o Tailwind transition |

---

## 1. Hero entrance — stagger cinematográfico

```tsx
const heroVariants = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.12, delayChildren: 0.1 }
  }
}
const heroItem = {
  hidden: { opacity: 0, y: 28, filter: 'blur(4px)' },
  show: {
    opacity: 1, y: 0, filter: 'blur(0px)',
    transition: { duration: 0.85, ease: [0.16, 1, 0.3, 1] }
  }
}

<motion.div variants={heroVariants} initial="hidden" animate="show">
  <motion.span variants={heroItem} className="pill">...</motion.span>
  <motion.h1 variants={heroItem}>...</motion.h1>
  <motion.p variants={heroItem}>...</motion.p>
  <motion.div variants={heroItem}>...</motion.div>
</motion.div>
```

## 2. Scroll reveal — sección completa

```tsx
// Para secciones individuales:
<motion.section
  initial={{ opacity: 0, y: 48 }}
  whileInView={{ opacity: 1, y: 0 }}
  viewport={{ once: true, margin: '-80px' }}
  transition={{ duration: 0.75, ease: [0.22, 0.61, 0.36, 1] }}
>

// Para grids de cards (stagger):
<motion.div
  variants={{ show: { transition: { staggerChildren: 0.07 } } }}
  initial="hidden"
  whileInView="show"
  viewport={{ once: true, margin: '-60px' }}
>
  {items.map(item => (
    <motion.div
      key={item.id}
      variants={{
        hidden: { opacity: 0, y: 24, scale: 0.97 },
        show: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.6, ease: [0.22, 0.61, 0.36, 1] } }
      }}
    />
  ))}
</motion.div>
```

## 3. Card hover — glassmorphism lift

```tsx
<motion.div
  className="card"
  whileHover={{ y: -4, borderColor: 'rgba(212,175,136,0.3)' }}
  transition={{ duration: 0.2, ease: 'easeOut' }}
  style={{ transformOrigin: 'center bottom' }}
>
```

## 4. GSAP — parallax hero

```tsx
'use client'
import { useRef } from 'react'
import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import ScrollTrigger from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

export function HeroParallax() {
  const containerRef = useRef<HTMLDivElement>(null)

  useGSAP(() => {
    const ctx = gsap.context(() => {
      // Texto sube más lento que el scroll
      gsap.to('.hero-text', {
        yPercent: -25,
        ease: 'none',
        scrollTrigger: {
          trigger: '.hero',
          start: 'top top',
          end: 'bottom top',
          scrub: true,
        }
      })
      // Imagen sube aún más lento
      gsap.to('.hero-visual', {
        yPercent: -12,
        ease: 'none',
        scrollTrigger: {
          trigger: '.hero',
          start: 'top top',
          end: 'bottom top',
          scrub: true,
        }
      })
    }, containerRef)
    return () => ctx.revert()
  }, { scope: containerRef })

  return (
    <div ref={containerRef} className="hero">
      <div className="hero-text">...</div>
      <div className="hero-visual">...</div>
    </div>
  )
}
```

## 5. Número contando (counter animation)

```tsx
import { useEffect, useRef } from 'react'
import { useInView } from 'motion/react'

function Counter({ target, suffix = '' }: { target: number, suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null)
  const isInView = useInView(ref, { once: true, margin: '-60px' })

  useEffect(() => {
    if (!isInView || !ref.current) return
    const el = ref.current
    const start = performance.now()
    const duration = 1800

    function step(now: number) {
      const p = Math.min((now - start) / duration, 1)
      const ease = 1 - Math.pow(1 - p, 3)
      const val = Math.floor(target * ease)
      el.textContent = (target >= 1000 ? val.toLocaleString() : val) + suffix
      if (p < 1) requestAnimationFrame(step)
    }
    requestAnimationFrame(step)
  }, [isInView, target, suffix])

  return <span ref={ref}>0{suffix}</span>
}
```

## 6. Scanline SVG animado (face card)

```tsx
// CSS animation — más performante que JS para loops
const styles = `
  @keyframes scan {
    0%, 100% { transform: translateY(0); opacity: 0.6; }
    50% { transform: translateY(140px); opacity: 0.2; }
  }
  @keyframes dot-pulse {
    0%, 100% { opacity: 0.65; }
    50% { opacity: 1; }
  }
  .scanline { animation: scan 3.5s ease-in-out infinite; }
  .landmark-dot { animation: dot-pulse 4s ease-in-out infinite; }
  .landmark-dot:nth-child(3n+1) { animation-delay: 0.4s; }
  .landmark-dot:nth-child(3n+2) { animation-delay: 0.8s; }
`
```

## 7. Page transitions (Next.js App Router)

```tsx
// src/components/providers/PageTransition.tsx
'use client'
import { motion, AnimatePresence } from 'motion/react'
import { usePathname } from 'next/navigation'

export function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={pathname}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.38, ease: [0.22, 0.61, 0.36, 1] }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  )
}
```

## 8. Orbes ambientales animados (hero background)

```tsx
// Usar motion para floating orbs
<motion.div
  className="orb orb-gold"
  animate={{
    x: [0, 30, -20, 0],
    y: [0, -20, 15, 0],
    scale: [1, 1.08, 0.96, 1],
  }}
  transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
  style={{
    position: 'absolute',
    width: 400, height: 400,
    borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(212,175,136,0.22), transparent 70%)',
    filter: 'blur(60px)',
    top: -120, right: -60,
    pointerEvents: 'none',
  }}
/>
```

## Easings de referencia

| Nombre | Valor | Uso |
|--------|-------|-----|
| iOS spring | `[0.16, 1, 0.3, 1]` | Entradas hero, modales |
| Suave | `[0.22, 0.61, 0.36, 1]` | Scroll reveals, cards |
| Sharp out | `[0.4, 0, 0.2, 1]` | Elementos que salen |
| Linear | `'none'` | Parallax scrub |

## Reglas de oro

- **Siempre `viewport={{ once: true }}`** en scroll reveals — nunca re-animar al subir
- **`will-change: transform`** solo en elementos que realmente animan — no en todos
- **Reducir movimiento**: respetar `prefers-reduced-motion` con `useReducedMotion()` de motion
- **No combinar** motion variants con GSAP en el mismo elemento — elegir uno
- **GSAP cleanup**: siempre retornar `ctx.revert()` en `useGSAP`
