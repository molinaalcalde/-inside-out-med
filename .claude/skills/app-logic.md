---
name: insideoutmed-app-logic
description: Lógica de negocio de InsideOutMed — análisis facial, zonas, biomarcadores, plan de 12 meses. Leer al trabajar en scan, results o plan.
type: project
---

# InsideOutMed — Lógica de la App

## Flujo completo

```
Landing → Onboarding (13 pasos) → Scan (MediaPipe) → Processing → Reveal → Report → Plan → Projection
```

## MediaPipe FaceLandmarker

- **Model**: `face_landmarker.task` (cargado desde CDN de MediaPipe)
- **Landmarks**: 478 puntos 3D por frame
- **Output**: `FaceLandmarkerResult` con `faceLandmarks`, `faceBlendshapes`, `facialTransformationMatrixes`
- **Modo**: `VIDEO` (cámara en tiempo real) o `IMAGE` (foto fija)
- **Siempre client-side** (`'use client'` + `dynamic` con `ssr: false`)

```ts
// src/lib/mediapipe/faceLandmarker.ts
import { FaceLandmarker, FilesetResolver } from '@mediapipe/tasks-vision'

export async function createFaceLandmarker() {
  const filesetResolver = await FilesetResolver.forVisionTasks(
    'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
  )
  return FaceLandmarker.createFromOptions(filesetResolver, {
    baseOptions: {
      modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task',
      delegate: 'GPU',
    },
    runningMode: 'VIDEO',
    numFaces: 1,
    minFaceDetectionConfidence: 0.5,
    minFacePresenceConfidence: 0.5,
    minTrackingConfidence: 0.5,
    outputFaceBlendshapes: true,
    outputFacialTransformationMatrixes: true,
  })
}
```

## Zonas del rostro (9 zonas)

```ts
// src/lib/analysis/zones.ts
export const ZONES = {
  forehead:   { label: 'Frente',      landmarks: [10,338,297,332,284,251,389,356,454,323,361,288,397,365,379,378,400,377,152,148,176,149,150,136,172,58,132,93,234,127,162,21,54,103,67,109] },
  periocularL:{ label: 'Ojo izq.',    landmarks: [33,7,163,144,145,153,154,155,133,173,157,158,159,160,161,246] },
  periocularR:{ label: 'Ojo der.',    landmarks: [362,382,381,380,374,373,390,249,263,466,388,387,386,385,384,398] },
  nose:       { label: 'Nariz',       landmarks: [1,2,98,327,168,6,197,195,5,4,240,97,240,370] },
  lips:       { label: 'Labios',      landmarks: [61,185,40,39,37,0,267,269,270,409,291,375,321,405,314,17,84,181,91,146] },
  cheekL:     { label: 'Mejilla izq.',landmarks: [116,117,118,119,120,121,128,126,142,36,205,207,216] },
  cheekR:     { label: 'Mejilla der.',landmarks: [345,346,347,348,349,350,357,425,427,437,436,432,352] },
  jaw:        { label: 'Mandíbula',   landmarks: [172,136,150,149,176,148,152,377,400,378,379,365,397,288,361,323] },
  neck:       { label: 'Cuello',      landmarks: [152,377,400,378,379,365,397,288,361] },
}
```

## Biomarcadores (7)

```ts
export type Biomarker = {
  id: string
  title: string
  score: number      // 0–100
  status: 'optimal' | 'good' | 'attention' | 'concern'
  description: string
  tip: string
}

export const BIOMARKER_IDS = [
  'luminosity',    // Luminosidad / glow
  'hydration',     // Hidratación
  'uniformity',    // Uniformidad de tono
  'glycation',     // Glicación (amarillamiento)
  'inflammation',  // Inflamación / rojez
  'sun_damage',    // Daño solar / manchas
  'vascularity',   // Vascularidad / capilares
] as const
```

## Score de análisis

```ts
// src/lib/analysis/scoring.ts
export type ScanResult = {
  overall: number        // 0–100
  visibleAge: number     // edad aparente calculada
  chronoAge: number      // edad real del usuario
  ageDelta: number       // visibleAge - chronoAge (negativo = mejor)
  percentile: number     // 0–100 vs mujeres de su edad
  symmetry: number       // 0–100
  harmony: number        // 0–100
  zones: Record<string, ZoneScore>
  biomarkers: Biomarker[]
}

export type ZoneScore = {
  id: string
  label: string
  score: number
  age: number
  status: 'optimal' | 'good' | 'attention' | 'concern'
  details: string[]
}
```

## Plan de 12 meses

```ts
// src/lib/recommendations/engine.ts
export type Phase = {
  id: string
  name: string       // 'Fundación', 'Activación', 'Intensificación', 'Mantenimiento'
  months: string     // '1–3', '4–6', '7–9', '10–12'
  focus: string
  recs: Recommendation[]
}

export type Recommendation = {
  id: string
  title: string
  category: 'skincare' | 'lifestyle' | 'supplement' | 'treatment'
  invasiveness: 0 | 1 | 2 | 3  // 0=casa, 1=consultorio, 2=medico, 3=cirugia
  timing: 'AM' | 'PM' | 'AM/PM' | 'weekly' | 'monthly'
  impact: number     // 1–10
  why: string        // razón personalizada
  products?: Product[]
}
```

## Onboarding (13 pasos)

```ts
export type OnboardingData = {
  name: string
  age: number
  email: string
  phone: string
  goals: string[]          // ['anti-aging', 'luminosity', 'hydration', ...]
  sensitivity: 'baja' | 'media' | 'alta'
  budget: 'bajo' | 'medio' | 'alto' | 'premium'
  fitz: 1 | 2 | 3 | 4 | 5 | 6    // Fitzpatrick scale
  sleep: number            // horas/noche
  stress: 'bajo' | 'medio' | 'alto'
  diet: 'omnivora' | 'vegetariana' | 'vegana' | 'keto' | 'otra'
  exercise: number         // días/semana
  sun: 'baja' | 'media' | 'alta'
  routine: string[]        // productos actuales
  prior: string[]          // tratamientos previos
  conditions: string[]     // condiciones de piel
  invasive: 'nada' | 'consultorio' | 'medico' | 'todo'
  commitment: 'solo-casa' | 'basico' | 'full-home' | 'pro'
}
```

## Supabase

```ts
// src/lib/supabase/client.ts
import { createBrowserClient } from '@supabase/ssr'

export const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// Tablas: profiles, scans, engagements
// Auth: Email OTP (magic link)
// RLS activado — usuarios solo ven sus datos
```

## Variables de entorno (.env.local)

```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

## Reglas importantes

- MediaPipe NUNCA en SSR — siempre `dynamic(() => ..., { ssr: false })`
- El análisis facial es ESTIMACIÓN EDUCATIVA — no diagnóstico médico
- Edad aparente = `chronoAge + ageDelta` donde ageDelta puede ser negativo (mejor) o positivo (peor)
- `percentile` = percentil vs mujeres de la misma edad (100 = la que mejor aparenta)
- Privacy: imágenes NUNCA salen del dispositivo — procesamiento 100% local
