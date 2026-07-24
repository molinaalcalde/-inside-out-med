"use client"

import React, { useEffect, useRef, useState, useCallback } from "react"
import { CameraStage, type Scores } from "./camera-stage"
import { generateCrossRefInsights } from "../../lib/analysis/cross-reference"
import { generateBrainInsights } from "../../lib/analysis/brain-insights"
import { trackFunnelEvent, updateLead } from "../../lib/tracking/funnel"
import type { UserProfile } from "../../lib/types"
import { ScanFace, Bandage } from "lucide-react"

const WHATSAPP_NUMBER = "5491112345678" // TODO: Replace with real number

type Stage = "choose" | "upload-guide" | "pre-quiz" | "camera" | "scanning" | "contact" | "results-1" | "gate-quiz" | "results-2" | "error"

// ── MediaPipe landmark indices per zone (upload path — 9 zones) ──
const ZONES = {
  forehead:    [10, 338, 297, 332, 284, 251, 389, 356, 109, 67, 103, 54, 21, 162, 127, 234, 93, 132],
  periocularL: [33, 7, 163, 144, 145, 153, 154, 155, 133, 173, 157, 158, 159, 160, 161, 246],
  periocularR: [362, 382, 381, 380, 374, 373, 390, 249, 263, 466, 388, 387, 386, 385, 384, 398],
  nose:        [1, 2, 98, 327, 168, 6, 197, 195, 5, 4, 240, 97, 370],
  lips:        [61, 185, 40, 39, 37, 0, 267, 269, 270, 409, 291, 375, 321, 405, 314, 17, 84, 181, 91, 146],
  cheekL:      [116, 117, 118, 119, 120, 121, 128, 126, 142, 36, 205, 207, 216],
  cheekR:      [345, 346, 347, 348, 349, 350, 357, 425, 427, 437, 436, 432, 352],
  jaw:         [172, 136, 150, 149, 176, 148, 152, 377, 400, 378, 379, 365, 397, 288, 361, 323],
  neck:        [152, 377, 400, 378, 379, 365, 397, 288, 361],
}

// Zones for the scanning animation (9 zones)
const SCAN_ZONES_ANIM = [
  { label: "Frente",       yPct: 15, color: "#e8a4b0", icon: "◈" },
  { label: "Ojo izq.",     yPct: 28, color: "#d4af88", icon: "◉" },
  { label: "Ojo der.",     yPct: 28, color: "#d4af88", icon: "◉" },
  { label: "Nariz",        yPct: 42, color: "#7ecba1", icon: "◎" },
  { label: "Mejilla izq.", yPct: 48, color: "#e8a4b0", icon: "◈" },
  { label: "Mejilla der.", yPct: 48, color: "#e8a4b0", icon: "◈" },
  { label: "Labios",       yPct: 58, color: "#d4af88", icon: "◉" },
  { label: "Mandíbula",    yPct: 70, color: "#7ecba1", icon: "◎" },
  { label: "Cuello",       yPct: 82, color: "#d4af88", icon: "◉" },
]

// ── Fitzpatrick calibration (matching camera-stage.tsx) ──────────
const FITZ_CALIBRATION: Record<number, { lumBaseline: number; redThreshold: number; inflammationSensitivity: number }> = {
  1: { lumBaseline: 195, redThreshold: 14, inflammationSensitivity: 1.3 },
  2: { lumBaseline: 185, redThreshold: 15, inflammationSensitivity: 1.15 },
  3: { lumBaseline: 170, redThreshold: 16, inflammationSensitivity: 1.0 },
  4: { lumBaseline: 150, redThreshold: 18, inflammationSensitivity: 0.85 },
  5: { lumBaseline: 130, redThreshold: 22, inflammationSensitivity: 0.7 },
  6: { lumBaseline: 110, redThreshold: 28, inflammationSensitivity: 0.55 },
}

function getAgeBaseline(age: number): { glycationOffset: number; ageMid: number } {
  if (age <= 25) return { glycationOffset: -5, ageMid: age }
  if (age <= 35) return { glycationOffset: 0,  ageMid: age }
  if (age <= 45) return { glycationOffset: 5,  ageMid: age }
  return { glycationOffset: 10, ageMid: age }
}

// ── Fitzpatrick tile config ─────────────────────────────────────
const FITZ_TILES = [
  { value: "1", color: "#FDEBD0", label: "Muy clara" },
  { value: "2", color: "#F5CBA7", label: "Clara" },
  { value: "3", color: "#E0B07A", label: "Media" },
  { value: "4", color: "#C49A6C", label: "Morena" },
  { value: "5", color: "#8B6914", label: "Oscura" },
  { value: "6", color: "#5C4033", label: "Muy oscura" },
]

// ── Result zones with zoom+pan coordinates ─────────────────────
const RESULT_ZONES = [
  { key: "forehead",    label: "Frente",       dotX: 50, dotY: 28 },
  { key: "periocularL", label: "Ojo izq.",     dotX: 62, dotY: 38 },
  { key: "periocularR", label: "Ojo der.",     dotX: 38, dotY: 38 },
  { key: "nose",        label: "Nariz",        dotX: 50, dotY: 48 },
  { key: "cheekL",      label: "Mejilla izq.", dotX: 72, dotY: 52 },
  { key: "cheekR",      label: "Mejilla der.", dotX: 28, dotY: 52 },
  { key: "lips",        label: "Labios",       dotX: 50, dotY: 60 },
  { key: "jaw",         label: "Mandíbula",    dotX: 50, dotY: 70 },
  { key: "neck",        label: "Cuello",       dotX: 50, dotY: 82 },
]

// ── Accordion zone metadata for results-2 ─────────────────────
const ACCORDION_META: Record<string, { label: string; icon: string }> = {
  frente:     { label: "Frente",      icon: "F" },
  periocular: { label: "Periocular",  icon: "P" },
  nariz:      { label: "Nariz",       icon: "N" },
  labios:     { label: "Labios",      icon: "L" },
  mejillas:   { label: "Mejillas",    icon: "M" },
  mandibula:  { label: "Mandíbula",   icon: "J" },
  cuello:     { label: "Cuello",      icon: "C" },
  piel:       { label: "Piel global", icon: "G" },
}

// ── Zone label map ──────────────────────────────────────────────
const ZONE_LABELS: Record<string, string> = {
  forehead:    "Frente",
  periocularL: "Ojo izq.",
  periocularR: "Ojo der.",
  nose:        "Nariz",
  lips:        "Labios",
  cheekL:      "Mejilla izq.",
  cheekR:      "Mejilla der.",
  jaw:         "Mandíbula",
  neck:        "Cuello",
}

// ── Quiz SVG icons — dermatology-style, immediately recognizable ──
const QUIZ_ICONS: Record<string, React.ReactNode> = {
  // Conditions — skin patch with condition visible
  rosacea: (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
      <rect x="4" y="4" width="20" height="20" rx="6" stroke="currentColor" strokeWidth="1.2"/>
      <circle cx="10" cy="14" r="3.5" fill="currentColor" fillOpacity="0.15" stroke="currentColor" strokeWidth="0.8"/>
      <circle cx="18" cy="14" r="3.5" fill="currentColor" fillOpacity="0.15" stroke="currentColor" strokeWidth="0.8"/>
      <path d="M12 10.5c.3-.4.7-.5 1-.3M16 10.5c-.3-.4-.7-.5-1-.3" stroke="currentColor" strokeWidth="0.8" strokeLinecap="round"/>
    </svg>
  ),
  melasma: (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
      <rect x="4" y="4" width="20" height="20" rx="6" stroke="currentColor" strokeWidth="1.2"/>
      <ellipse cx="11" cy="12" rx="4" ry="3" fill="currentColor" fillOpacity="0.25"/>
      <ellipse cx="17" cy="16" rx="3" ry="2.5" fill="currentColor" fillOpacity="0.18"/>
      <ellipse cx="13" cy="18" rx="2" ry="1.5" fill="currentColor" fillOpacity="0.12"/>
    </svg>
  ),
  acne_c: (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
      <rect x="4" y="4" width="20" height="20" rx="6" stroke="currentColor" strokeWidth="1.2"/>
      <circle cx="10" cy="11" r="2" fill="currentColor" fillOpacity="0.3" stroke="currentColor" strokeWidth="0.8"/>
      <circle cx="17" cy="10" r="1.5" fill="currentColor" fillOpacity="0.25" stroke="currentColor" strokeWidth="0.8"/>
      <circle cx="14" cy="16" r="1.8" fill="currentColor" fillOpacity="0.3" stroke="currentColor" strokeWidth="0.8"/>
      <circle cx="19" cy="17" r="1.2" fill="currentColor" fillOpacity="0.2" stroke="currentColor" strokeWidth="0.8"/>
    </svg>
  ),
  dermatitis: (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
      <rect x="4" y="4" width="20" height="20" rx="6" stroke="currentColor" strokeWidth="1.2"/>
      <path d="M8 11c1.5 0 2.5-1 4-1s2.5 1 4 1 2.5-1 4-1" stroke="currentColor" strokeWidth="1" strokeLinecap="round"/>
      <path d="M8 15c1.5 0 2.5 1 4 1s2.5-1 4-1 2.5 1 4 1" stroke="currentColor" strokeWidth="1" strokeLinecap="round"/>
      <path d="M10 8v2M14 7v2.5M18 8v2" stroke="currentColor" strokeWidth="0.8" strokeLinecap="round"/>
    </svg>
  ),
  psoriasis: (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
      <rect x="4" y="4" width="20" height="20" rx="6" stroke="currentColor" strokeWidth="1.2"/>
      <path d="M9 10c0 1.5 1.5 2.5 3 2s2-2 1-3-2.5-1-3 0z" fill="currentColor" fillOpacity="0.2" stroke="currentColor" strokeWidth="0.8"/>
      <path d="M15 9c0 1.5 1.5 2 2.5 1.5s1.5-2 .5-2.5-2-.5-2.5.5z" fill="currentColor" fillOpacity="0.15" stroke="currentColor" strokeWidth="0.8"/>
      <path d="M10 16c0 1 1.5 2 2.5 1.5s1.5-1.5.5-2.5-2-.5-2.5.5z" fill="currentColor" fillOpacity="0.15" stroke="currentColor" strokeWidth="0.8"/>
      <path d="M17 15c0 1 1 1.5 2 1.2s1.2-1.5.5-2-1.8-.2-2 .5z" fill="currentColor" fillOpacity="0.2" stroke="currentColor" strokeWidth="0.8"/>
    </svg>
  ),
  ninguna: (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
      <circle cx="14" cy="14" r="10" stroke="currentColor" strokeWidth="1.2"/>
      <path d="M9 14.5l3 3 7-7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  // Concerns — clear symbols
  manchas: (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
      <circle cx="14" cy="14" r="10" stroke="currentColor" strokeWidth="1.2"/>
      <circle cx="10" cy="11" r="2" fill="currentColor" fillOpacity="0.35"/>
      <circle cx="17" cy="13" r="1.5" fill="currentColor" fillOpacity="0.25"/>
      <circle cx="12" cy="18" r="1.8" fill="currentColor" fillOpacity="0.3"/>
    </svg>
  ),
  arrugas: (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
      <circle cx="14" cy="14" r="10" stroke="currentColor" strokeWidth="1.2"/>
      <path d="M8 10c2 .8 4-.5 6 .3s3 .5 6-.3" stroke="currentColor" strokeWidth="1" strokeLinecap="round"/>
      <path d="M8 14.5c2 .8 4-.5 6 .3s3 .5 6-.3" stroke="currentColor" strokeWidth="1" strokeLinecap="round"/>
      <path d="M8 19c2 .8 4-.5 6 .3s3 .5 6-.3" stroke="currentColor" strokeWidth="1" strokeLinecap="round"/>
    </svg>
  ),
  poros: (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
      <circle cx="14" cy="14" r="10" stroke="currentColor" strokeWidth="1.2"/>
      <circle cx="10" cy="10" r="1" fill="currentColor" fillOpacity="0.3"/>
      <circle cx="14" cy="9" r="0.8" fill="currentColor" fillOpacity="0.25"/>
      <circle cx="18" cy="11" r="1" fill="currentColor" fillOpacity="0.3"/>
      <circle cx="11" cy="14" r="0.8" fill="currentColor" fillOpacity="0.25"/>
      <circle cx="16" cy="15" r="1" fill="currentColor" fillOpacity="0.3"/>
      <circle cx="13" cy="18" r="0.8" fill="currentColor" fillOpacity="0.25"/>
      <circle cx="18" cy="18" r="0.7" fill="currentColor" fillOpacity="0.2"/>
    </svg>
  ),
  acne: (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
      <circle cx="14" cy="14" r="10" stroke="currentColor" strokeWidth="1.2"/>
      <circle cx="10" cy="11" r="1.5" fill="currentColor" fillOpacity="0.3" stroke="currentColor" strokeWidth="0.6"/>
      <circle cx="16" cy="10" r="1" fill="currentColor" fillOpacity="0.25" stroke="currentColor" strokeWidth="0.6"/>
      <circle cx="18" cy="15" r="1.3" fill="currentColor" fillOpacity="0.3" stroke="currentColor" strokeWidth="0.6"/>
      <circle cx="12" cy="17" r="1.1" fill="currentColor" fillOpacity="0.25" stroke="currentColor" strokeWidth="0.6"/>
    </svg>
  ),
  hidratacion: (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
      <path d="M14 5c-4 5.5-7 8.5-7 12a7 7 0 0014 0c0-3.5-3-6.5-7-12z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M11 17c.8 1.5 2.5 2.2 4.5 1.5" stroke="currentColor" strokeWidth="1" strokeLinecap="round" opacity="0.5"/>
    </svg>
  ),
  luminosidad: (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
      <circle cx="14" cy="14" r="4" stroke="currentColor" strokeWidth="1.2"/>
      <path d="M14 4v4M14 20v4M4 14h4M20 14h4M7.5 7.5l2.8 2.8M17.7 17.7l2.8 2.8M7.5 20.5l2.8-2.8M17.7 10.3l2.8-2.8" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
    </svg>
  ),
  // Upload guide icons
  luz: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="5" />
      <line x1="12" y1="1" x2="12" y2="4" />
      <line x1="12" y1="20" x2="12" y2="23" />
      <line x1="4.22" y1="4.22" x2="6.34" y2="6.34" />
      <line x1="17.66" y1="17.66" x2="19.78" y2="19.78" />
      <line x1="1" y1="12" x2="4" y2="12" />
      <line x1="20" y1="12" x2="23" y2="12" />
      <line x1="4.22" y1="19.78" x2="6.34" y2="17.66" />
      <line x1="17.66" y1="6.34" x2="19.78" y2="4.22" />
    </svg>
  ),
  rostro: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <ellipse cx="12" cy="12" rx="8" ry="10" />
      <circle cx="9" cy="10" r="1" />
      <circle cx="15" cy="10" r="1" />
      <path d="M9 15c1.5 1.5 4.5 1.5 6 0" />
    </svg>
  ),
  sin: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" />
      <line x1="5.5" y1="5.5" x2="18.5" y2="18.5" />
    </svg>
  ),
  camara: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" />
      <circle cx="12" cy="13" r="4" />
    </svg>
  ),
  nitida: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M12 2v3" />
      <path d="M12 19v3" />
      <path d="M5 5l2 2" />
      <path d="M17 17l2 2" />
      <path d="M2 12h3" />
      <path d="M19 12h3" />
      <path d="M5 19l2-2" />
      <path d="M17 7l2-2" />
      <path d="M15 9l1.5-1.5" />
      <path d="M7.5 16.5L9 15" />
    </svg>
  ),
}

// ── Quiz step types ─────────────────────────────────────────────
interface QuizOption {
  value: string
  label: string
  sub?: string
  icon?: string
}

interface QuizStep {
  id: string
  headline: string
  sub: string
  type: "grid4" | "grid6" | "list3" | "fitz6" | "email" | "phone" | "agePicker" | "text" | "multiSelect" | "consent"
  options: QuizOption[]
}

// ── Pre-scan steps (13 questions before scan) ────────────────────
const PRE_SCAN_STEPS: QuizStep[] = [
  {
    id: "name",
    headline: "¿Cómo te llamas?",
    sub: "Para personalizar tu análisis y tu plan",
    type: "text",
    options: [],
  },
  {
    id: "age",
    headline: "¿Cuántos años tienes?",
    sub: "Calibramos todo según tu edad exacta",
    type: "agePicker",
    options: [],
  },
  {
    id: "email",
    headline: "¿A dónde enviamos tu informe?",
    sub: "Tu análisis completo + plan personalizado directo a tu correo",
    type: "email",
    options: [],
  },
  {
    id: "goals",
    headline: "¿Qué quieres mejorar?",
    sub: "Selecciona todo lo que aplique — priorizamos tu plan según esto",
    type: "multiSelect",
    options: [
      { value: "edad",       label: "Edad visible" },
      { value: "piel",       label: "Piel" },
      { value: "mandibula",  label: "Mandíbula" },
      { value: "ojos",       label: "Ojos" },
      { value: "cabello",    label: "Cabello" },
      { value: "labios",     label: "Labios" },
      { value: "longevidad", label: "Longevidad" },
      { value: "evento",     label: "Evento pronto" },
    ],
  },
  {
    id: "sensitivity",
    headline: "¿Qué tan sensible es tu piel?",
    sub: "Para ajustar la intensidad de los activos que te recomendamos",
    type: "list3",
    options: [
      { value: "baja",  label: "Baja",  sub: "Tolero casi todo sin problema" },
      { value: "media", label: "Media", sub: "Algunos productos me irritan" },
      { value: "alta",  label: "Alta",  sub: "Mi piel reacciona con facilidad" },
    ],
  },
  {
    id: "budget",
    headline: "¿Cuánto inviertes en skincare al mes?",
    sub: "Para recomendarte productos dentro de tu rango",
    type: "list3",
    options: [
      { value: "gratis",  label: "Lo mínimo ($0–30)",  sub: "Solo lo esencial" },
      { value: "medio",   label: "Intermedio ($30–100)", sub: "Dispuesto a invertir" },
      { value: "premium", label: "Premium ($100+)",     sub: "Lo mejor disponible" },
    ],
  },
  {
    id: "invasive",
    headline: "¿Qué tipo de tratamientos considerarías?",
    sub: "Para filtrar las recomendaciones según tu tolerancia",
    type: "list3",
    options: [
      { value: "casa",     label: "Solo en casa",     sub: "Cremas, serums, hábitos" },
      { value: "no-aguja", label: "Consultorio sin agujas", sub: "Peels, LED, láser" },
      { value: "todo",     label: "Todo, incluso agujas", sub: "Botox, rellenos, PRP" },
    ],
  },
  {
    id: "fitzpatrick",
    headline: "¿Cuál es tu tono de piel?",
    sub: "Calibramos el análisis según tu fototipo para resultados precisos",
    type: "fitz6",
    options: FITZ_TILES,
  },
  {
    id: "sleep",
    headline: "¿Cuántas horas duermes?",
    sub: "El sueño es el reparador #1 de tu piel",
    type: "grid4",
    options: [
      { value: "<5h",  label: "<5h",  sub: "Poco descanso" },
      { value: "5-6h", label: "5–6h", sub: "Por debajo" },
      { value: "7-8h", label: "7–8h", sub: "Recomendado" },
      { value: "9+h",  label: "9+h",  sub: "Buen descanso" },
    ],
  },
  {
    id: "stress",
    headline: "¿Cómo describes tu nivel de estrés?",
    sub: "El cortisol impacta directamente la salud de tu piel",
    type: "list3",
    options: [
      { value: "bajo",  label: "Bajo",  sub: "Relajado la mayor parte del tiempo" },
      { value: "medio", label: "Medio", sub: "Picos ocasionales de estrés" },
      { value: "alto",  label: "Alto",  sub: "Estrés constante o crónico" },
    ],
  },
  {
    id: "exercise",
    headline: "¿Con qué frecuencia haces ejercicio?",
    sub: "La circulación impacta la oxigenación y el brillo de tu piel",
    type: "list3",
    options: [
      { value: "nunca",  label: "Nunca / casi nunca", sub: "Sedentario" },
      { value: "2-3",    label: "2–3 días",           sub: "Actividad moderada" },
      { value: "4+",     label: "4+ días",            sub: "Muy activo" },
    ],
  },
  {
    id: "sun",
    headline: "¿Cuánta exposición solar tienes?",
    sub: "El sol es el factor #1 de envejecimiento prematuro",
    type: "list3",
    options: [
      { value: "baja",  label: "Baja",  sub: "Mayormente en interiores" },
      { value: "media", label: "Media", sub: "Algo de sol diario" },
      { value: "alta",  label: "Alta",  sub: "Exposición frecuente o prolongada" },
    ],
  },
  {
    id: "conditions",
    headline: "¿Tienes alguna condición de piel?",
    sub: "Para evitar recomendarte algo que pueda irritar o empeorar — selecciona todo lo que aplique",
    type: "multiSelect",
    options: [
      { value: "rosacea",    label: "Rosácea",         icon: "rosacea" },
      { value: "melasma",    label: "Melasma",         icon: "melasma" },
      { value: "acne",       label: "Acné activo",     icon: "acne_c" },
      { value: "dermatitis", label: "Dermatitis/eccema",icon: "dermatitis" },
      { value: "psoriasis",  label: "Psoriasis",       icon: "psoriasis" },
      { value: "ninguna",    label: "Ninguna",         icon: "ninguna" },
    ],
  },
]

// ── Contact steps (after scan — just phone/WhatsApp) ────────────
const CONTACT_STEPS: QuizStep[] = [
  {
    id: "phone",
    headline: "Tu WhatsApp para recomendaciones",
    sub: "Te avisamos cuando encontremos productos para tu perfil exacto",
    type: "phone",
    options: [],
  },
]

// ── Gate steps (lifestyle deep-dive to unlock full report) ──────
const GATE_STEPS: QuizStep[] = [
  {
    id: "diet",
    headline: "¿Cómo es tu alimentación?",
    sub: "Lo que comes se refleja en tu piel — el azúcar acelera el envejecimiento",
    type: "list3",
    options: [
      { value: "omnivora",    label: "Omnívora",             sub: "Dieta variada" },
      { value: "vegetariana", label: "Vegetariana / vegana",  sub: "Sin carne o productos animales" },
      { value: "keto",        label: "Keto / otra",          sub: "Dieta específica o restrictiva" },
    ],
  },
  {
    id: "concern",
    headline: "¿Qué te preocupa más de tu cara?",
    sub: "Elige tu prioridad #1 — esto define el orden de tu plan",
    type: "grid6",
    options: [
      { value: "manchas",     label: "Manchas",     icon: "manchas" },
      { value: "arrugas",     label: "Arrugas",     icon: "arrugas" },
      { value: "poros",       label: "Poros",       icon: "poros" },
      { value: "acne",        label: "Acné",        icon: "acne" },
      { value: "suavidad", label: "Suavidad", icon: "hidratacion" },
      { value: "luminosidad", label: "Luminosidad", icon: "luminosidad" },
    ],
  },
  {
    id: "routine",
    headline: "¿Qué usas en tu cara ahora mismo?",
    sub: "Sin juicios — cada punto de partida es válido",
    type: "list3",
    options: [
      { value: "ninguna",  label: "Nada todavía",          sub: "Empezamos desde cero" },
      { value: "basica",   label: "Limpiador + hidratante", sub: "Base sólida" },
      { value: "completa", label: "Rutina completa",        sub: "Serum, SPF y más" },
    ],
  },
]

// ── Load MediaPipe IMAGE mode from LOCAL files ──────────────────
let _landmarkerPromise: Promise<unknown> | null = null

async function getMediaPipeLandmarker() {
  if (_landmarkerPromise) return _landmarkerPromise

  _landmarkerPromise = (async () => {
    const vision = await import(
      /* webpackIgnore: true */
      "/mediapipe/vision_bundle.mjs" as string
    ) as {
      FilesetResolver: { forVisionTasks: (path: string) => Promise<unknown> }
      FaceLandmarker: {
        createFromOptions: (resolver: unknown, opts: unknown) => Promise<{
          detect: (img: HTMLImageElement | HTMLCanvasElement) => {
            faceLandmarks: Array<Array<{ x: number; y: number; z: number }>>
          }
        }>
      }
    }

    const filesetResolver = await vision.FilesetResolver.forVisionTasks(
      "/mediapipe/wasm"
    )

    return await vision.FaceLandmarker.createFromOptions(filesetResolver, {
      baseOptions: {
        modelAssetPath: "/mediapipe/face_landmarker.task",
        delegate: "CPU",
      },
      runningMode: "IMAGE",
      numFaces: 1,
    })
  })()

  return _landmarkerPromise
}

// ── Pixel analysis on a region (for upload path) ─────────────────
function analyzeRegion(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
  if (w < 4 || h < 4) return null
  const { data } = ctx.getImageData(x, y, w, h)
  const total = w * h
  let sumLum = 0, sumR = 0, sumG = 0, sumB = 0, redPixels = 0
  const lums: number[] = []
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i], g = data[i + 1], b = data[i + 2]
    const lum = 0.299 * r + 0.587 * g + 0.114 * b
    sumLum += lum; sumR += r; sumG += g; sumB += b; lums.push(lum)
    if (r > g + 16 && r > b + 16 && r > 70) redPixels++
  }
  const avgLum = sumLum / total
  let localContrast = 0
  for (let row = 1; row < h - 1; row++) {
    for (let col = 1; col < w - 1; col++) {
      const idx = row * w + col
      const nb = (lums[(row - 1) * w + col] + lums[(row + 1) * w + col] + lums[row * w + col - 1] + lums[row * w + col + 1]) / 4
      localContrast += Math.abs(lums[idx] - nb)
    }
  }
  localContrast /= total
  let variance = 0
  for (const v of lums) variance += (v - avgLum) ** 2
  return { avgLum, avgR: sumR / total, avgG: sumG / total, avgB: sumB / total, redPixels, total, localContrast, stdDev: Math.sqrt(variance / total) }
}

function zoneBBox(landmarks: Array<{ x: number; y: number }>, indices: number[], imgW: number, imgH: number) {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
  for (const idx of indices) {
    const lm = landmarks[idx]
    if (!lm) continue
    if (lm.x * imgW < minX) minX = lm.x * imgW
    if (lm.y * imgH < minY) minY = lm.y * imgH
    if (lm.x * imgW > maxX) maxX = lm.x * imgW
    if (lm.y * imgH > maxY) maxY = lm.y * imgH
  }
  const pad = 8
  return { x: Math.max(0, Math.floor(minX - pad)), y: Math.max(0, Math.floor(minY - pad)), w: Math.min(imgW, Math.ceil(maxX - minX + pad * 2)), h: Math.min(imgH, Math.ceil(maxY - minY + pad * 2)) }
}

function clamp(v: number, lo: number, hi: number) { return Math.max(lo, Math.min(hi, v)) }

// ── Upload analysis — IMAGE mode MediaPipe (9 zones, calibrated) ─
async function runUploadAnalysis(dataUrl: string, fitzpatrick: number, age: number): Promise<Scores | null> {
  const img = await new Promise<HTMLImageElement>((res, rej) => {
    const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = dataUrl
  })

  const scale = Math.min(1, 640 / Math.max(img.width, img.height))
  const W = Math.round(img.width * scale)
  const H = Math.round(img.height * scale)
  const canvas = document.createElement("canvas")
  canvas.width = W; canvas.height = H
  const ctx = canvas.getContext("2d")!
  ctx.drawImage(img, 0, 0, W, H)

  // Brightness gate
  const fullData = ctx.getImageData(0, 0, W, H).data
  let sumLum = 0
  for (let i = 0; i < fullData.length; i += 4)
    sumLum += 0.299 * fullData[i] + 0.587 * fullData[i + 1] + 0.114 * fullData[i + 2]
  if (sumLum / (W * H) < 28) return null

  let landmarks: Array<{ x: number; y: number; z: number }>

  try {
    const landmarker = await getMediaPipeLandmarker() as {
      detect: (el: HTMLCanvasElement) => { faceLandmarks: Array<Array<{ x: number; y: number; z: number }>> }
    }
    const result = landmarker.detect(canvas)
    if (!result.faceLandmarks?.length) return null
    landmarks = result.faceLandmarks[0]
  } catch {
    return null
  }

  // Pixel analysis per zone (9 zones)
  const zoneData: Record<string, ReturnType<typeof analyzeRegion>> = {}
  for (const [zone, indices] of Object.entries(ZONES)) {
    const bbox = zoneBBox(landmarks, indices, W, H)
    zoneData[zone] = analyzeRegion(ctx, bbox.x, bbox.y, bbox.w, bbox.h)
  }

  // Collect z-depth metrics from landmarks (single frame for upload)
  const lm = landmarks
  const zDepthAvgs: Record<string, number> = {}
  // Forehead convexity: glabella vs temples
  zDepthAvgs.foreheadConvexity = (lm[8].z - (lm[112].z + lm[341].z) / 2)
  // Eye bag depth: tear trough vs upper cheek
  zDepthAvgs.eyeBagL = (lm[111].z - lm[116].z)
  zDepthAvgs.eyeBagR = (lm[340].z - lm[345].z)
  // Cheek projection: cheekbone vs nose bridge
  zDepthAvgs.cheekProjL = (lm[50].z - lm[6].z)
  zDepthAvgs.cheekProjR = (lm[280].z - lm[6].z)
  // Jaw definition: chin vs gonial angle depth differential
  zDepthAvgs.jawDef = ((lm[172].z + lm[397].z) / 2 - lm[152].z)
  // Lip projection
  zDepthAvgs.lipProj = ((lm[13].z + lm[14].z) / 2 - lm[1].z)

  const z = zoneData
  // Require minimum 4 zones
  if (!z.forehead || !z.cheekL || !z.cheekR || !z.nose) return null

  const fitz = FITZ_CALIBRATION[fitzpatrick] || FITZ_CALIBRATION[3]
  const ageCfg = getAgeBaseline(age)

  // Collect zone averages
  const ZONE_NAMES = Object.keys(ZONES)
  const zoneLums: number[] = []
  const zoneAvgs: Record<string, { lum: number; r: number; g: number; b: number; contrast: number; stdDev: number; redRatio: number }> = {}
  for (const zn of ZONE_NAMES) {
    const d = z[zn]
    if (!d) continue
    zoneLums.push(d.avgLum)
    zoneAvgs[zn] = {
      lum: d.avgLum, r: d.avgR, g: d.avgG, b: d.avgB,
      contrast: d.localContrast, stdDev: d.stdDev,
      redRatio: d.total > 0 ? d.redPixels / d.total : 0,
    }
  }

  const activeZones = Object.keys(zoneAvgs)
  if (activeZones.length < 4) return null

  // Global averages
  const avgLumSkin = zoneLums.reduce((s, v) => s + v, 0) / zoneLums.length
  const avgR = activeZones.reduce((s, zn) => s + zoneAvgs[zn].r, 0) / activeZones.length
  const avgG = activeZones.reduce((s, zn) => s + zoneAvgs[zn].g, 0) / activeZones.length
  const avgB = activeZones.reduce((s, zn) => s + zoneAvgs[zn].b, 0) / activeZones.length
  const avgContrast = activeZones.reduce((s, zn) => s + zoneAvgs[zn].contrast, 0) / activeZones.length
  const avgStdDev = activeZones.reduce((s, zn) => s + zoneAvgs[zn].stdDev, 0) / activeZones.length
  const totalRedPix = activeZones.reduce((s, zn) => s + (z[zn]?.redPixels ?? 0), 0)
  const totalPix = activeZones.reduce((s, zn) => s + (z[zn]?.total ?? 0), 0)
  const redRatio = totalPix > 0 ? totalRedPix / totalPix : 0

  // Cross-zone luminance std dev (uniformity)
  const lumMean = zoneLums.reduce((s, v) => s + v, 0) / zoneLums.length
  const crossZoneStdDev = Math.sqrt(zoneLums.reduce((s, v) => s + (v - lumMean) ** 2, 0) / zoneLums.length)

  // Cheek + nose red ratio (vascularity)
  let vascRedPix = 0, vascTotalPix = 0
  for (const zn of ["cheekL", "cheekR", "nose"]) {
    if (z[zn]) { vascRedPix += z[zn]!.redPixels; vascTotalPix += z[zn]!.total }
  }
  const cheekNoseRedRatio = vascTotalPix > 0 ? vascRedPix / vascTotalPix : 0

  // 7 Biomarkers (deterministic, calibrated)
  const luminosity   = clamp(Math.round((avgLumSkin / fitz.lumBaseline) * 100), 25, 98)
  const hydration    = clamp(Math.round((avgLumSkin / fitz.lumBaseline) * 90 - avgStdDev * 0.15), 30, 98)
  const uniformity   = clamp(Math.round(100 - crossZoneStdDev * 2.5 - avgContrast * 1.2), 25, 96)
  const glycation    = clamp(Math.round(((avgR - avgB) / (avgB + 1)) * 45 + ageCfg.glycationOffset + 15), 5, 75)
  const inflammation = clamp(Math.round((redRatio * 300 + (avgR - avgG) * 0.12) * fitz.inflammationSensitivity), 3, 65)
  const sunDamage    = clamp(Math.round(avgContrast * 1.8 + avgStdDev * 0.2), 5, 70)
  const vascularity  = clamp(Math.round(cheekNoseRedRatio * 250 - 10), 3, 60)

  // ── Z-depth adjustments ─────────────────────────────────────────
  let depthBonus = 0
  if (Object.keys(zDepthAvgs).length > 0) {
    const cheekProj = ((zDepthAvgs.cheekProjL || 0) + (zDepthAvgs.cheekProjR || 0)) / 2
    const cheekScore = clamp(Math.round(50 + cheekProj * 500), 20, 95)
    const eyeBags = ((zDepthAvgs.eyeBagL || 0) + (zDepthAvgs.eyeBagR || 0)) / 2
    const eyeBagScore = clamp(Math.round(80 + eyeBags * 400), 20, 95)
    const jawDef = zDepthAvgs.jawDef || 0
    const jawScore = clamp(Math.round(50 + jawDef * 300), 25, 95)
    depthBonus = Math.round((cheekScore + eyeBagScore + jawScore) / 3) - 60
  }
  const depthAdj = clamp(depthBonus, -5, 5)

  // Texture metrics (simplified for upload — uses existing avgContrast)
  const texture = clamp(Math.round(100 - avgContrast * 3.5), 15, 98)
  const wrinkleDepth = clamp(Math.round(100 - avgContrast * 2.0), 15, 95)

  // Dark circles: compare periocular luminosity vs cheek luminosity
  const periLum = ((zoneAvgs.periocularL?.lum || 0) + (zoneAvgs.periocularR?.lum || 0)) / 2
  const cheekLum = ((zoneAvgs.cheekL?.lum || 0) + (zoneAvgs.cheekR?.lum || 0)) / 2
  const darkCircleRatio = cheekLum > 0 ? periLum / cheekLum : 1
  const darkCircles = clamp(Math.round(darkCircleRatio * 100), 30, 98)

  // Symmetry from single image
  const symCenterX = (landmarks[1].x + landmarks[152].x) / 2
  const symPairs: [number, number][] = [[33, 263], [133, 362], [46, 276], [50, 280], [61, 291], [116, 345]]
  let symDiff = 0
  for (const [l, r] of symPairs) {
    if (landmarks[l] && landmarks[r]) {
      symDiff += Math.abs(Math.abs(landmarks[l].x - symCenterX) - Math.abs(landmarks[r].x - symCenterX))
    }
  }
  const symmetry = clamp(Math.round(100 - (symDiff / symPairs.length) * 800), 40, 99)

  // Overall (higher = better)
  const overall = clamp(Math.round(
    luminosity * 0.14 + hydration * 0.16 + uniformity * 0.14 +
    (100 - glycation) * 0.11 + (100 - inflammation) * 0.16 +
    (100 - sunDamage) * 0.11 + (100 - vascularity) * 0.07 +
    texture * 0.06 + wrinkleDepth * 0.05
  ) + depthAdj, 30, 96)

  // Per-zone score
  const zoneScore = (zn: string): number => {
    const za = zoneAvgs[zn]
    if (!za) return 50
    const lumScore = clamp(Math.round((za.lum / fitz.lumBaseline) * 100), 20, 100)
    const redScore = clamp(Math.round(100 - za.redRatio * 400), 30, 100)
    const texScore = clamp(Math.round(100 - za.contrast * 2.0), 30, 100)
    return Math.round(lumScore * 0.35 + redScore * 0.35 + texScore * 0.30)
  }

  // Apparent age — INDEPENDENT of declared age (legacy formula)
  // Uses 7 aging-relevant markers from actual pixel analysis
  const agingMarkers = [
    clamp(Math.round(100 - avgContrast * 2.4), 10, 99),          // skin smoothness (texture)
    uniformity,                                                     // tone evenness (spots)
    clamp(Math.round(100 - sunDamage), 10, 95),                   // sun damage (inverted)
    luminosity,                                                     // skin luminosity
    darkCircles,                                                    // dark circles under eyes
    zoneScore("periocularL"),                                      // left eye area
    zoneScore("periocularR"),                                      // right eye area
    zoneScore("cheekL"),                                           // left cheek (nasolabial)
    zoneScore("cheekR"),                                           // right cheek
    zoneScore("jaw"),                                              // jaw definition/sagging
    zoneScore("lips"),                                             // perioral lines
    zoneScore("forehead"),                                         // forehead lines
  ]
  const agingScore = agingMarkers.reduce((a, b) => a + b, 0) / agingMarkers.length
  // Map agingScore (30-95 range) to visible age (22-64 range) — INDEPENDENT of declared age
  const ageApparent = Math.round(
    clamp(22 + (95 - agingScore) / (95 - 35) * 42, 19, 68)
  )

  return {
    overall, luminosity, hydration, uniformity, glycation, inflammation, sunDamage, vascularity,
    texture, wrinkleDepth, darkCircles, symmetry, ageApparent,
    zoneScores: {
      forehead:    zoneScore("forehead"),
      periocularL: zoneScore("periocularL"),
      periocularR: zoneScore("periocularR"),
      nose:        zoneScore("nose"),
      lips:        zoneScore("lips"),
      cheekL:      zoneScore("cheekL"),
      cheekR:      zoneScore("cheekR"),
      jaw:         zoneScore("jaw"),
      neck:        zoneScore("neck"),
    },
    zDepthAvgs,
  }
}

// ── Biomarker insights (7 new biomarkers) ────────────────────────
function getBiomarkerInsight(label: string, value: number): string {
  switch (label) {
    case "Luminosidad":
      if (value >= 70) return "Tu piel refleja bien la luz — se ve descansada y con vida. Esto te quita años de encima."
      if (value >= 50) return "Tu cara se ve apagada, como cansada aunque hayas dormido. Eso te envejece visualmente porque la piel no refleja luz. Una vitamina C en la mañana puede cambiar esto en 4 semanas."
      return "Tu piel perdió brillo por completo — se ve gris, sin vida. Esto es lo primero que la gente nota. Te puede sumar 2-3 años visibles. Necesita renovación celular urgente."
    case "Suavidad":
      if (value >= 75) return "Tu piel tiene una superficie lisa y uniforme — esto indica buena renovación celular y barrera cutánea funcional."
      if (value >= 55) return "Tu piel muestra algo de textura irregular — áreas con aspereza o microescamas. Esto puede ser por falta de exfoliación o exposición sin protección."
      return "La superficie de tu piel es notablemente irregular — rugosidad, textura áspera y posible descamación. Indica que la barrera cutánea necesita reparación urgente."
    case "Uniformidad":
      if (value >= 75) return "Tu tono es parejo — sin manchas ni zonas rojas visibles. Eso da una apariencia limpia y joven."
      if (value >= 55) return "Se ven zonas más oscuras o rojas en tu cara, probablemente en mejillas y frente. El ojo lo percibe como 'piel cansada'. Con niacinamida y SPF diario se emparejan en 6-8 semanas."
      return "Tu cara tiene manchas, rojeces o zonas oscuras muy visibles. El cerebro humano asocia tono desparejo con edad avanzada — esto te puede sumar 3-4 años de golpe. Es tratable con despigmentantes + protección solar."
    case "Glicación":
      if (value <= 15) return "Tu colágeno está sano — flexible y firme. Mantén bajo el consumo de azúcar para preservarlo."
      if (value <= 30) return "El azúcar que comes está endureciendo tu colágeno lentamente. El resultado: la piel pierde elasticidad, se vuelve opaca y amarillenta. Reducir azúcares refinados frena este proceso."
      return "Detectamos señales claras de glicación — tu colágeno se está endureciendo por exceso de azúcar en sangre. Esto hace que la piel pierda firmeza, se ponga amarillenta y las arrugas se fijen más rápido. Te puede sumar 2-3 años. Dieta anti-glicación + péptidos ayudan."
    case "Inflamación":
      if (value <= 15) return "Tu piel está calmada — no hay rojez ni sensibilidad visible. Buen punto de partida."
      if (value <= 30) return "Hay rojez activa en tu cara que probablemente no notas en el espejo pero la cámara sí detecta. Es inflamación silenciosa — puede venir del estrés, la dieta o productos irritantes. Acelera el envejecimiento de fondo."
      return "Detectamos inflamación visible en tu rostro — rojez en mejillas, nariz o frente. Esto es el acelerador #1 del envejecimiento: degrada colágeno, dilata poros y genera manchas. Te está sumando años ahora mismo. Necesita atención urgente con ingredientes calmantes."
    case "Daño solar":
      if (value <= 15) return "Tu protección solar funciona — no hay manchas ni textura por fotodaño. Sigue así."
      if (value <= 30) return "Hay señales de sol acumulado en tu piel — textura irregular, manchas incipientes. El sol explica el 80% del envejecimiento visible. Un SPF 50 diario + antioxidantes empiezan a revertirlo en semanas."
      return "Tu piel tiene daño solar significativo — manchas, textura irregular, pérdida de firmeza. El sol es el enemigo #1 de tu cara y ya dejó huella. Sin protección activa, seguirá avanzando. Te suma fácilmente 3-5 años visibles."
    case "Vascularidad":
      if (value <= 12) return "No hay rojez persistente — tu circulación facial está estable."
      if (value <= 25) return "Detectamos rojez en mejillas y nariz que indica actividad vascular elevada. Puede ser rosácea temprana, sensibilidad o reacción a temperaturas extremas. Ingredientes calmantes como centella asiática ayudan."
      return "Hay rojez marcada en tu cara — vasos dilatados visibles, especialmente en mejillas y nariz. Esto da una apariencia de piel irritada y sensible que envejece tu aspecto. Evita agua caliente en la cara, alcohol y picante. Necesita tratamiento calmante específico."
    case "Ojeras":
      if (value >= 80) return "Sin signos de fatiga bajo los ojos — tu contorno ocular se ve descansado y uniforme en tono."
      if (value >= 55) return "Se nota oscurecimiento bajo los ojos. Puede ser por falta de sueño, genética o retención de líquidos. Un contorno de ojos con vitamina K y cafeína puede ayudar en 4-6 semanas."
      return "Ojeras marcadas — el contraste entre tu contorno ocular y mejillas es notable. Esto te suma años visualmente. Necesitas un enfoque combinado: sueño, contorno de ojos con retinol y posiblemente ácido hialurónico inyectable."
    case "Simetría":
      if (value >= 90) return "Tu rostro tiene simetría muy alta — los rasgos izquierdo y derecho están bien alineados. Esto se percibe como armonía y atractivo."
      if (value >= 75) return "Simetría normal — hay pequeñas diferencias entre ambos lados de tu cara que son naturales. La mayoría de las personas tienen asimetría leve."
      return "Se detecta asimetría notable entre ambos lados de tu cara. Puede ser postural, genética o por hábitos (dormir de un lado). No es un problema de salud pero afecta la percepción de armonía."
    default:
      return ""
  }
}

// ── Zone status helper ──────────────────────────────────────────
function getZoneStatus(score: number): { label: string; color: string; emoji: string } {
  if (score >= 80) return { label: "Excelente", color: "#7ecba1", emoji: "✓" }
  if (score >= 65) return { label: "Bien", color: "#d4af88", emoji: "~" }
  if (score >= 45) return { label: "Mejorable", color: "#e8a4b0", emoji: "!" }
  return { label: "Prioridad", color: "#e8a4b0", emoji: "!!" }
}

function getZoneInsight(key: string, score: number): string {
  const insights: Record<string, Record<string, string>> = {
    forehead:    { high: "Piel uniforme y bien hidratada", mid: "Algo de textura irregular — exfoliación suave ayudaría", low: "Textura marcada o deshidratación visible" },
    periocularL: { high: "Sin signos de fatiga o líneas finas", mid: "Leve deshidratación periocular", low: "Líneas de expresión o ojeras visibles" },
    periocularR: { high: "Sin signos de fatiga o líneas finas", mid: "Leve deshidratación periocular", low: "Líneas de expresión o ojeras visibles" },
    nose:        { high: "Poros controlados, tono uniforme", mid: "Algo de brillo o poros visibles", low: "Poros dilatados o rojez en la zona T" },
    lips:        { high: "Bien hidratados, sin resequedad", mid: "Algo de resequedad en el contorno", low: "Labios secos o pigmentación irregular" },
    cheekL:      { high: "Tono uniforme, sin rojez", mid: "Leve irregularidad de tono", low: "Rojez o textura irregular notable" },
    cheekR:      { high: "Tono uniforme, sin rojez", mid: "Leve irregularidad de tono", low: "Rojez o textura irregular notable" },
    jaw:         { high: "Firmeza y tono uniformes", mid: "Algo de laxitud o textura", low: "Pérdida de firmeza o acné hormonal" },
    neck:        { high: "Sin líneas ni manchas visibles", mid: "Algo de deshidratación", low: "Líneas horizontales o fotodaño" },
  }
  const zone = insights[key] || { high: "Zona en buen estado", mid: "Zona con margen de mejora", low: "Zona que necesita atención" }
  return score >= 70 ? zone.high : score >= 50 ? zone.mid : zone.low
}

// ── Zone description for face map hotspots ─────────────────────
function getZoneDescription(key: string, score: number): string {
  const descs: Record<string, string[]> = {
    forehead:    ["Tono uniforme, sin líneas", "Líneas finas horizontales", "Arrugas visibles, textura irregular", "Arrugas marcadas, piel apagada"],
    periocularL: ["Sin signos de fatiga", "Patas de gallo incipientes", "Ojeras y líneas finas", "Líneas profundas, bolsas visibles"],
    periocularR: ["Sin signos de fatiga", "Patas de gallo incipientes", "Ojeras y líneas finas", "Líneas profundas, bolsas visibles"],
    nose:        ["Poros controlados", "Poros algo visibles, zona T activa", "Poros dilatados, posible rojez", "Poros abiertos, rojez marcada"],
    lips:        ["Bien hidratados, contorno definido", "Leve resequedad en contorno", "Resequedad visible, pérdida de volumen", "Labios secos, líneas verticales"],
    cheekL:      ["Tono uniforme, sin rojez", "Leve irregularidad de tono", "Rojez o textura irregular", "Rojez marcada, posible rosácea"],
    cheekR:      ["Tono uniforme, sin rojez", "Leve irregularidad de tono", "Rojez o textura irregular", "Rojez marcada, posible rosácea"],
    jaw:         ["Óvalo definido, firmeza óptima", "Algo de laxitud", "Pérdida de definición del óvalo", "Flacidez visible, mandíbula desdibujada"],
    neck:        ["Sin líneas, tono parejo", "Leve deshidratación", "Líneas horizontales visibles", "Líneas marcadas, fotodaño"],
  }
  const d = descs[key] || ["Bien", "Aceptable", "Mejorable", "Necesita atención"]
  if (score >= 80) return d[0]
  if (score >= 65) return d[1]
  if (score >= 45) return d[2]
  return d[3]
}

// ── ProfileQuiz — multi-mode gamified questionnaire ─────────────
function ProfileQuiz({ mode, onComplete, scores }: {
  mode: "pre-scan" | "contact" | "gate"
  onComplete: (data: Record<string, string>) => void
  scores?: Scores | null
}) {
  const steps = mode === "pre-scan" ? PRE_SCAN_STEPS : mode === "contact" ? CONTACT_STEPS : GATE_STEPS
  const [step, setStep] = useState(0)
  const [data, setData] = useState<Record<string, string>>({})
  const [inputVal, setInputVal] = useState("")
  const [animating, setAnimating] = useState(false)
  const [pickerAge, setPickerAge] = useState(30)
  const pickerInitRef = useRef(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  const current = steps[step]

  const ITEM_H = 56
  const lastVibrateAge = useRef(pickerAge)

  const handleAgeScroll = useCallback(() => {
    const el = scrollRef.current
    if (!el) return
    const newAge = Math.round(el.scrollTop / ITEM_H) + 18
    const clamped = Math.max(18, Math.min(80, newAge))
    if (clamped !== lastVibrateAge.current) {
      lastVibrateAge.current = clamped
      setPickerAge(clamped)
      // Haptic — short pulse like iOS picker
      try { navigator?.vibrate?.(6) } catch {}
    }
  }, [])

  // Quick-jump scrolls to position
  const scrollToAge = useCallback((age: number) => {
    if (!scrollRef.current) return
    scrollRef.current.scrollTo({ top: (age - 18) * ITEM_H, behavior: "smooth" })
  }, [])

  // Init scroll position once
  useEffect(() => {
    if (!pickerInitRef.current && current?.type === "agePicker" && scrollRef.current) {
      pickerInitRef.current = true
      requestAnimationFrame(() => {
        if (scrollRef.current) scrollRef.current.scrollTop = (pickerAge - 18) * ITEM_H
      })
    }
  }, [current?.type, pickerAge])

  const advance = (update: Record<string, string>) => {
    const next = { ...data, ...update }
    setData(next)
    if (step < steps.length - 1) {
      setAnimating(true)
      setTimeout(() => { setStep(s => s + 1); setInputVal(""); setAnimating(false) }, 220)
    } else {
      onComplete(next)
    }
  }

  const headerText = mode === "pre-scan"
    ? "Antes de escanear"
    : mode === "contact"
    ? "Tu análisis está listo"
    : "Desbloquea tu informe completo"

  const headerSub = mode === "pre-scan"
    ? `${steps.length} preguntas para calibrar tu análisis`
    : mode === "contact"
    ? (scores ? `Score: ${scores.overall}/100 — necesitamos tus datos para enviártelo` : "Necesitamos tus datos para enviarte el informe")
    : `${steps.length} preguntas más para personalizar tu plan`

  return (
    <div style={{ maxWidth: 480, width: "100%", margin: "0 auto" }}>
      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: 32 }}>
        <p style={{ fontSize: 10, letterSpacing: "0.18em", color: mode === "contact" ? "#7ecba1" : "#e8a4b0", textTransform: "uppercase", fontWeight: 700, marginBottom: 8 }}>
          {headerText}
        </p>
        <p style={{ fontSize: 13, color: "rgba(245,237,232,0.35)", letterSpacing: "0.04em" }}>
          {headerSub}
        </p>
      </div>

      {/* Progress dots */}
      <div style={{ display: "flex", justifyContent: "center", gap: 8, marginBottom: 40 }}>
        {steps.map((_, i) => (
          <div key={i} style={{
            width: i === step ? 24 : 7, height: 7,
            borderRadius: 4,
            background: i < step ? "#7ecba1" : i === step ? "#e8a4b0" : "rgba(245,237,232,0.12)",
            transition: "all 0.3s ease",
          }} />
        ))}
      </div>

      {/* Question card */}
      <div style={{
        opacity: animating ? 0 : 1,
        transform: animating ? "translateY(8px)" : "translateY(0)",
        transition: "opacity 0.2s, transform 0.2s",
      }}>
        <h2 style={{
          fontFamily: "var(--font-fraunces)",
          fontSize: "clamp(22px, 4vw, 32px)",
          fontWeight: 400,
          letterSpacing: "-0.03em",
          lineHeight: 1.15,
          marginBottom: 10,
          textAlign: "center",
        }}>
          {current.headline}
        </h2>
        <p style={{ fontSize: 13, color: "rgba(245,237,232,0.4)", textAlign: "center", marginBottom: 32, lineHeight: 1.6 }}>
          {current.sub}
        </p>

        {/* grid4: 4 big tiles */}
        {current.type === "grid4" && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 10 }}>
            {current.options.map(opt => (
              <button key={opt.value} onClick={() => advance({ [current.id]: opt.value })}
                style={{
                  padding: "24px 16px",
                  background: "rgba(245,237,232,0.03)",
                  border: "1.5px solid rgba(245,237,232,0.10)",
                  borderRadius: 16,
                  cursor: "pointer",
                  color: "#f5ede8",
                  textAlign: "center",
                  transition: "all 0.18s",
                  display: "flex", flexDirection: "column", alignItems: "center", gap: 6,
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(232,164,176,0.5)"; e.currentTarget.style.background = "rgba(232,164,176,0.06)" }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(245,237,232,0.10)"; e.currentTarget.style.background = "rgba(245,237,232,0.03)" }}
              >
                <span style={{ fontFamily: "var(--font-fraunces)", fontSize: 28, fontWeight: 300, color: "#e8a4b0", lineHeight: 1 }}>{opt.label}</span>
                {opt.sub && <span style={{ fontSize: 10, color: "rgba(245,237,232,0.35)", letterSpacing: "0.08em" }}>{opt.sub}</span>}
              </button>
            ))}
          </div>
        )}

        {/* agePicker: iOS-style scroll wheel */}
        {current.type === "agePicker" && (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 28 }}>
            {/* Scroll wheel container */}
            <div style={{ position: "relative", height: 280, width: 160, overflow: "hidden" }}>
              {/* Fade overlays — longer gradients for depth */}
              <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 110, background: "linear-gradient(to bottom, #0e0c12 20%, transparent)", zIndex: 3, pointerEvents: "none" }} />
              <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 110, background: "linear-gradient(to top, #0e0c12 20%, transparent)", zIndex: 3, pointerEvents: "none" }} />

              {/* Center selection indicator — subtle lines */}
              <div style={{ position: "absolute", top: "50%", left: 0, right: 0, transform: "translateY(-50%)", height: ITEM_H, zIndex: 2, pointerEvents: "none", borderTop: "1px solid rgba(232,164,176,0.2)", borderBottom: "1px solid rgba(232,164,176,0.2)" }} />

              {/* Scrollable drum */}
              <div
                ref={scrollRef}
                className="age-scroll"
                onScroll={handleAgeScroll}
                style={{
                  height: 280,
                  overflowY: "scroll",
                  scrollSnapType: "y mandatory",
                  WebkitOverflowScrolling: "touch",
                  scrollbarWidth: "none",
                  overscrollBehavior: "contain",
                  paddingTop: 112,
                  paddingBottom: 112,
                }}
              >
                {Array.from({ length: 63 }, (_, i) => i + 18).map(age => {
                  const dist = Math.abs(age - pickerAge)
                  const isCenter = dist === 0
                  const opacity = isCenter ? 1 : Math.max(0.06, 0.5 - dist * 0.12)
                  const scale = isCenter ? 1 : Math.max(0.55, 1 - dist * 0.12)
                  const fontSize = isCenter ? 52 : Math.max(18, 40 - dist * 6)
                  return (
                    <div
                      key={age}
                      style={{
                        height: ITEM_H,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        scrollSnapAlign: "center",
                        fontFamily: "var(--font-fraunces)",
                        fontSize,
                        fontWeight: isCenter ? 400 : 300,
                        color: isCenter ? "#e8a4b0" : `rgba(245,237,232,${opacity})`,
                        transform: `scale(${scale})`,
                        willChange: "transform",
                        userSelect: "none",
                        WebkitUserSelect: "none",
                      }}
                    >
                      {age}
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Quick jump — pill buttons */}
            <div style={{ display: "flex", gap: 6, justifyContent: "center" }}>
              {[20, 25, 30, 35, 40, 45, 50].map(age => (
                <button key={age} onClick={() => scrollToAge(age)}
                  style={{
                    padding: "6px 12px", borderRadius: 99,
                    background: pickerAge === age ? "rgba(232,164,176,0.15)" : "transparent",
                    border: `1px solid ${pickerAge === age ? "rgba(232,164,176,0.35)" : "rgba(245,237,232,0.08)"}`,
                    color: pickerAge === age ? "#e8a4b0" : "rgba(245,237,232,0.3)",
                    fontSize: 11, fontWeight: 600, cursor: "pointer",
                    transition: "all 0.2s",
                  }}
                >
                  {age}
                </button>
              ))}
            </div>

            {/* Confirm */}
            <button
              onClick={() => advance({ age: String(pickerAge) })}
              style={{
                padding: "16px 52px",
                background: "linear-gradient(135deg, #e8a4b0, #c97e8e)",
                border: "none", borderRadius: 14, color: "#fff",
                fontSize: 16, fontWeight: 700, cursor: "pointer",
                boxShadow: "0 8px 24px rgba(232,164,176,0.3)",
              }}
            >
              Continuar →
            </button>
          </div>
        )}

        {/* grid6: 6 icon tiles */}
        {current.type === "grid6" && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 10 }}>
            {current.options.map(opt => (
              <button key={opt.value} onClick={() => advance({ [current.id]: opt.value })}
                style={{
                  padding: "20px 10px",
                  background: "rgba(245,237,232,0.03)",
                  border: "1.5px solid rgba(245,237,232,0.10)",
                  borderRadius: 14,
                  cursor: "pointer", color: "#f5ede8",
                  textAlign: "center", transition: "all 0.18s",
                  display: "flex", flexDirection: "column", alignItems: "center", gap: 8,
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(212,175,136,0.5)"; e.currentTarget.style.background = "rgba(212,175,136,0.06)" }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(245,237,232,0.10)"; e.currentTarget.style.background = "rgba(245,237,232,0.03)" }}
              >
                {opt.icon && <span style={{ color: "rgba(232,164,176,0.7)" }}>{QUIZ_ICONS[opt.icon] || opt.icon}</span>}
                <span style={{ fontSize: 11, fontWeight: 600, color: "rgba(245,237,232,0.75)" }}>{opt.label}</span>
              </button>
            ))}
          </div>
        )}

        {/* fitz6: Fitzpatrick 3x2 grid of circular skin tone tiles */}
        {current.type === "fitz6" && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 14 }}>
            {FITZ_TILES.map(tile => {
              const isSelected = data[current.id] === tile.value
              return (
                <button key={tile.value} onClick={() => advance({ [current.id]: tile.value })}
                  style={{
                    padding: "18px 10px",
                    background: "rgba(245,237,232,0.03)",
                    border: `1.5px solid ${isSelected ? "rgba(232,164,176,0.6)" : "rgba(245,237,232,0.10)"}`,
                    borderRadius: 16,
                    cursor: "pointer",
                    color: "#f5ede8",
                    textAlign: "center",
                    transition: "all 0.18s",
                    display: "flex", flexDirection: "column", alignItems: "center", gap: 10,
                  }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(232,164,176,0.5)"; e.currentTarget.style.background = "rgba(232,164,176,0.06)" }}
                  onMouseLeave={e => { if (!isSelected) { e.currentTarget.style.borderColor = "rgba(245,237,232,0.10)"; e.currentTarget.style.background = "rgba(245,237,232,0.03)" } }}
                >
                  <div style={{ position: "relative", width: 52, height: 52, borderRadius: "50%", background: tile.color, border: "2px solid rgba(255,255,255,0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    {isSelected && (
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                        <path d="M5 13l4 4L19 7" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 600, color: "rgba(245,237,232,0.65)" }}>{tile.label}</span>
                </button>
              )
            })}
          </div>
        )}

        {/* list3: 3 vertical options */}
        {current.type === "list3" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {current.options.map(opt => (
              <button key={opt.value} onClick={() => advance({ [current.id]: opt.value })}
                style={{
                  padding: "18px 20px",
                  background: "rgba(245,237,232,0.03)",
                  border: "1.5px solid rgba(245,237,232,0.10)",
                  borderRadius: 14,
                  cursor: "pointer", color: "#f5ede8",
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  transition: "all 0.18s",
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(126,203,161,0.5)"; e.currentTarget.style.background = "rgba(126,203,161,0.06)" }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(245,237,232,0.10)"; e.currentTarget.style.background = "rgba(245,237,232,0.03)" }}
              >
                <div style={{ textAlign: "left" }}>
                  <p style={{ fontSize: 14, fontWeight: 600, marginBottom: 2 }}>{opt.label}</p>
                  {opt.sub && <p style={{ fontSize: 11, color: "rgba(245,237,232,0.35)" }}>{opt.sub}</p>}
                </div>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0, opacity: 0.4 }}>
                  <path d="M6 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            ))}
          </div>
        )}

        {/* email input — required, validated */}
        {current.type === "email" && (() => {
          const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(inputVal)
          return (
          <div>
            <div style={{ position: "relative", marginBottom: 12 }}>
              <input
                type="email"
                placeholder="tu@email.com"
                value={inputVal}
                onChange={e => setInputVal(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter" && emailValid) advance({ [current.id]: inputVal }) }}
                autoFocus
                style={{
                  width: "100%", padding: "18px 20px",
                  background: "rgba(245,237,232,0.04)",
                  border: `1.5px solid ${inputVal && !emailValid ? "rgba(232,164,176,0.5)" : "rgba(245,237,232,0.15)"}`,
                  borderRadius: 14, color: "#f5ede8",
                  fontSize: 16, outline: "none",
                  transition: "border-color 0.2s",
                  fontFamily: "inherit",
                }}
                onFocus={e => { e.target.style.borderColor = emailValid ? "rgba(232,164,176,0.5)" : "rgba(245,237,232,0.15)" }}
                onBlur={e => { e.target.style.borderColor = inputVal && !emailValid ? "rgba(232,164,176,0.5)" : "rgba(245,237,232,0.15)" }}
              />
              {inputVal && !emailValid && (
                <p style={{ fontSize: 11, color: "#e8a4b0", marginTop: 6, textAlign: "left" }}>
                  Ingresa un email válido
                </p>
              )}
            </div>
            <button
              onClick={() => { if (emailValid) advance({ [current.id]: inputVal }) }}
              disabled={!emailValid}
              style={{
                width: "100%", padding: "15px",
                background: emailValid ? "linear-gradient(135deg,#e8a4b0,#c97e8e)" : "rgba(245,237,232,0.06)",
                border: "none", borderRadius: 12, color: emailValid ? "#fff" : "rgba(245,237,232,0.3)",
                fontSize: 14, fontWeight: 700, cursor: emailValid ? "pointer" : "not-allowed",
                transition: "all 0.3s", marginBottom: 12,
              }}
            >
              Enviar mi informe →
            </button>
            <p style={{ fontSize: 10, color: "rgba(245,237,232,0.22)", textAlign: "center" }}>
              Necesitamos tu email para enviarte el informe completo
            </p>
          </div>
          )
        })()}

        {/* text input — name, etc */}
        {current.type === "text" && (() => {
          const val = inputVal.trim()
          const isValid = val.length >= 2
          return (
          <div>
            <div style={{ position: "relative", marginBottom: 16 }}>
              <input
                type="text"
                placeholder={current.id === "name" ? "Tu nombre" : "Escribe aquí..."}
                value={inputVal}
                onChange={e => setInputVal(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter" && isValid) advance({ [current.id]: val }) }}
                autoFocus
                style={{
                  width: "100%", padding: "20px 22px",
                  background: "rgba(245,237,232,0.04)",
                  border: "1.5px solid rgba(245,237,232,0.15)",
                  borderRadius: 14, color: "#f5ede8",
                  fontSize: 24, fontFamily: "var(--font-fraunces)", fontWeight: 400,
                  textAlign: "center",
                  outline: "none", transition: "border-color 0.2s",
                }}
                onFocus={e => { e.target.style.borderColor = "rgba(232,164,176,0.5)" }}
                onBlur={e => { e.target.style.borderColor = "rgba(245,237,232,0.15)" }}
              />
            </div>
            <button
              onClick={() => { if (isValid) advance({ [current.id]: val }) }}
              disabled={!isValid}
              style={{
                width: "100%", padding: "15px",
                background: isValid ? "linear-gradient(135deg,#e8a4b0,#c97e8e)" : "rgba(245,237,232,0.06)",
                border: "none", borderRadius: 12, color: isValid ? "#fff" : "rgba(245,237,232,0.3)",
                fontSize: 14, fontWeight: 700, cursor: isValid ? "pointer" : "not-allowed",
                transition: "all 0.3s",
              }}
            >
              Continuar →
            </button>
          </div>
          )
        })()}

        {/* multiSelect — toggle multiple options */}
        {current.type === "multiSelect" && (() => {
          const selected = (data[current.id] || "").split(",").filter(Boolean)
          const toggle = (val: string) => {
            // "ninguna" clears others; selecting others clears "ninguna"
            if (val === "ninguna") {
              setData(d => ({ ...d, [current.id]: "ninguna" }))
              return
            }
            const without = selected.filter(s => s !== "ninguna")
            const next = without.includes(val)
              ? without.filter(s => s !== val)
              : [...without, val]
            setData(d => ({ ...d, [current.id]: next.join(",") }))
          }
          const hasSelection = selected.length > 0 && selected[0] !== ""
          return (
          <div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 10, marginBottom: 20 }}>
              {current.options.map(opt => {
                const isOn = selected.includes(opt.value)
                return (
                  <button key={opt.value} onClick={() => toggle(opt.value)}
                    style={{
                      padding: "16px 10px",
                      background: isOn ? "rgba(232,164,176,0.10)" : "rgba(245,237,232,0.03)",
                      border: `1.5px solid ${isOn ? "rgba(232,164,176,0.5)" : "rgba(245,237,232,0.10)"}`,
                      borderRadius: 14, cursor: "pointer", color: isOn ? "#e8a4b0" : "#f5ede8",
                      textAlign: "center", transition: "all 0.18s",
                      display: "flex", flexDirection: "column", alignItems: "center", gap: 6,
                    }}
                  >
                    {opt.icon && <span style={{ color: isOn ? "#e8a4b0" : "rgba(245,237,232,0.5)" }}>{QUIZ_ICONS[opt.icon] || opt.icon}</span>}
                    <span style={{ fontSize: 11, fontWeight: 600, color: isOn ? "#e8a4b0" : "rgba(245,237,232,0.65)" }}>{opt.label}</span>
                  </button>
                )
              })}
            </div>
            <button
              onClick={() => { if (hasSelection) advance({ [current.id]: data[current.id] || selected.join(",") }) }}
              disabled={!hasSelection}
              style={{
                width: "100%", padding: "15px",
                background: hasSelection ? "linear-gradient(135deg,#e8a4b0,#c97e8e)" : "rgba(245,237,232,0.06)",
                border: "none", borderRadius: 12, color: hasSelection ? "#fff" : "rgba(245,237,232,0.3)",
                fontSize: 14, fontWeight: 700, cursor: hasSelection ? "pointer" : "not-allowed",
                transition: "all 0.3s",
              }}
            >
              Continuar →
            </button>
          </div>
          )
        })()}

        {/* phone input — numbers only, required, min 8 digits */}
        {current.type === "phone" && (() => {
          const digitsOnly = inputVal.replace(/\D/g, "")
          const isValid = digitsOnly.length >= 8
          return (
          <div>
            <div style={{ position: "relative", marginBottom: 12 }}>
              <input
                type="tel"
                inputMode="numeric"
                placeholder="+52 55 1234 5678"
                value={inputVal}
                onChange={e => {
                  const filtered = e.target.value.replace(/[^\d\s+\-()]/g, "")
                  setInputVal(filtered)
                }}
                onKeyDown={e => { if (e.key === "Enter" && isValid) advance({ [current.id]: inputVal }) }}
                autoFocus
                style={{
                  width: "100%", padding: "18px 20px",
                  background: "rgba(245,237,232,0.04)",
                  border: `1.5px solid ${inputVal && !isValid ? "rgba(232,164,176,0.5)" : "rgba(245,237,232,0.15)"}`,
                  borderRadius: 14, color: "#f5ede8",
                  fontSize: 16, outline: "none", fontFamily: "inherit",
                  transition: "border-color 0.2s",
                }}
                onFocus={e => { e.target.style.borderColor = isValid ? "rgba(126,203,161,0.5)" : "rgba(232,164,176,0.5)" }}
                onBlur={e => { e.target.style.borderColor = inputVal && !isValid ? "rgba(232,164,176,0.5)" : "rgba(245,237,232,0.15)" }}
              />
              {inputVal && !isValid && (
                <p style={{ fontSize: 11, color: "#e8a4b0", marginTop: 6, textAlign: "left" }}>
                  Ingresa un número válido (mínimo 8 dígitos)
                </p>
              )}
            </div>
            <button
              onClick={() => { if (isValid) advance({ [current.id]: inputVal }) }}
              disabled={!isValid}
              style={{
                width: "100%", padding: "15px",
                background: isValid ? "linear-gradient(135deg,#7ecba1,#5aab82)" : "rgba(245,237,232,0.06)",
                border: "none", borderRadius: 12, color: isValid ? "#fff" : "rgba(245,237,232,0.3)",
                fontSize: 14, fontWeight: 700,
                cursor: isValid ? "pointer" : "not-allowed",
                marginBottom: 12,
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                transition: "all 0.3s",
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
              Activar WhatsApp
            </button>
            <p style={{ fontSize: 10, color: "rgba(245,237,232,0.22)", textAlign: "center" }}>
              Necesitamos tu número para enviarte recomendaciones
            </p>
          </div>
          )
        })()}
      </div>
    </div>
  )
}

// ── Main page component ───────────────────────────────────────────
export default function AnalyzePage() {
  const [stage, setStage] = useState<Stage>("choose")
  const [captureMode, setCaptureMode] = useState<"camera" | "upload">("camera")
  const [capturedUrl, setCapturedUrl] = useState<string | null>(null)
  const [scanProgress, setScanProgress] = useState(0)
  const [activeZoneIdx, setActiveZoneIdx] = useState(-1)
  const [completedZones, setCompletedZones] = useState<number[]>([])
  const [qualityError, setQualityError] = useState<string | null>(null)
  const [scores, setScores] = useState<Scores | null>(null)
  const [preQuizData, setPreQuizData] = useState<Record<string, string>>({})
  const [contactData, setContactData] = useState<Record<string, string>>({})
  const [gateData, setGateData] = useState<Record<string, string>>({})
  const [activeZone, setActiveZone] = useState<string | null>(null)
  const [showBiomarkers, setShowBiomarkers] = useState(false)
  const [activeResultZone, setActiveResultZone] = useState(0)
  const [autoPlay, setAutoPlay] = useState(true)
  const [revealPhase, setRevealPhase] = useState(0)
  const [revealedZones, setRevealedZones] = useState<number[]>([])
  const [counterAge, setCounterAge] = useState(0)
  const [revealedFindings, setRevealedFindings] = useState(0)

  const fileRef = useRef<HTMLInputElement>(null)
  const scanIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // ── Camera path: scores arrive pre-computed ────────────────────
  const beginScanWithScores = useCallback((dataUrl: string, preScores: Scores) => {
    trackFunnelEvent("scan_started")
    setStage("scanning")
    setScanProgress(0)
    setActiveZoneIdx(-1)
    setCompletedZones([])
    let progress = 0

    scanIntervalRef.current = setInterval(() => {
      progress += 1.0 + (progress / 100) * 0.6
      if (progress >= 100) {
        progress = 100
        clearInterval(scanIntervalRef.current!)
        setTimeout(() => {
          setScores(preScores)
          setStage("contact")
        }, 500)
      }
      setScanProgress(Math.min(progress, 100))

      const zoneIdx = Math.min(Math.floor((Math.min(progress, 100) / 100) * SCAN_ZONES_ANIM.length), SCAN_ZONES_ANIM.length - 1)
      setActiveZoneIdx(prev => {
        if (zoneIdx > prev) {
          setCompletedZones(c => prev >= 0 ? [...c, prev] : c)
          return zoneIdx
        }
        return prev
      })
    }, 80)
  }, [])

  // ── Upload path: run analysis after capture ────────────────────
  const beginScanWithUpload = useCallback((dataUrl: string) => {
    const fitzpatrick = parseInt(preQuizData.fitzpatrick || "3", 10)
    const age = parseInt(preQuizData.age || "30", 10)

    trackFunnelEvent("scan_started")
    setStage("scanning")
    setScanProgress(0)
    setActiveZoneIdx(-1)
    setCompletedZones([])
    let progress = 0
    let analysisResult: Scores | null | undefined = undefined

    runUploadAnalysis(dataUrl, fitzpatrick, age).then(r => { analysisResult = r }).catch(() => { analysisResult = null })

    scanIntervalRef.current = setInterval(() => {
      progress += 1.0 + (progress / 100) * 0.6
      if (progress >= 100) {
        progress = 100
        clearInterval(scanIntervalRef.current!)
        const finish = () => {
          if (analysisResult === undefined) { setTimeout(finish, 200); return }
          if (analysisResult === null) {
            setQualityError("No detectamos un rostro con claridad. Necesitamos buena luz frontal y que el rostro esté centrado y visible.")
            setStage("error")
          } else {
            setScores(analysisResult)
            setStage("contact")
          }
        }
        setTimeout(finish, 500)
      }
      setScanProgress(Math.min(progress, 100))

      const zoneIdx = Math.min(Math.floor((Math.min(progress, 100) / 100) * SCAN_ZONES_ANIM.length), SCAN_ZONES_ANIM.length - 1)
      setActiveZoneIdx(prev => {
        if (zoneIdx > prev) {
          setCompletedZones(c => prev >= 0 ? [...c, prev] : c)
          return zoneIdx
        }
        return prev
      })
    }, 80)
  }, [preQuizData])

  const handleCameraCapture = useCallback((dataUrl: string, preScores: Scores) => {
    setCapturedUrl(dataUrl)
    beginScanWithScores(dataUrl, preScores)
  }, [beginScanWithScores])

  const handleScanError = useCallback((reason: string) => {
    setQualityError(reason)
    setStage("error")
  }, [])

  const handleFile = useCallback((file: File) => {
    if (!file.type.startsWith("image/")) return
    const reader = new FileReader()
    reader.onload = e => {
      const url = e.target?.result as string
      setCapturedUrl(url)
      beginScanWithUpload(url)
    }
    reader.readAsDataURL(file)
  }, [beginScanWithUpload])

  useEffect(() => {
    return () => { if (scanIntervalRef.current) clearInterval(scanIntervalRef.current) }
  }, [])

  useEffect(() => {
    trackFunnelEvent("started")
  }, [])

  // Auto-advance zones in results-2
  useEffect(() => {
    if (stage !== "results-2" || !autoPlay) return
    const timer = setInterval(() => {
      setActiveResultZone(prev => (prev + 1) % RESULT_ZONES.length)
    }, 3500)
    return () => clearInterval(timer)
  }, [stage, autoPlay])

  // ── Cinematic reveal sequence for results-1 ─────────────────────
  useEffect(() => {
    if (stage !== "results-1") { setRevealPhase(0); return }
    setRevealPhase(0); setRevealedZones([]); setCounterAge(0); setRevealedFindings(0)
    const t1 = setTimeout(() => setRevealPhase(1), 500)
    const zoneTimers = RESULT_ZONES.map((_, i) =>
      setTimeout(() => setRevealedZones(prev => [...prev, i]), 700 + i * 220)
    )
    const t2 = setTimeout(() => setRevealPhase(2), 2900)
    const t3 = setTimeout(() => setRevealPhase(3), 4200)
    const f1 = setTimeout(() => setRevealedFindings(1), 4400)
    const f2 = setTimeout(() => setRevealedFindings(2), 4750)
    const f3 = setTimeout(() => setRevealedFindings(3), 5100)
    const t4 = setTimeout(() => setRevealPhase(4), 5400)
    return () => { [t1, t2, t3, t4, f1, f2, f3, ...zoneTimers].forEach(clearTimeout) }
  }, [stage])

  // Age counter animation
  useEffect(() => {
    if (revealPhase < 2 || !scores) return
    const target = Math.round(scores.ageApparent || parseInt(preQuizData.age || "30") + 3)
    const start = Math.max(18, target - 12)
    const duration = 1200
    let startTime: number | undefined
    let raf: number
    function animate(ts: number) {
      if (startTime === undefined) startTime = ts
      const progress = Math.min((ts - startTime) / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setCounterAge(Math.round(start + (target - start) * eased))
      if (progress < 1) raf = requestAnimationFrame(animate)
    }
    raf = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(raf)
  }, [revealPhase, scores, preQuizData.age])

  const reset = () => {
    setCapturedUrl(null)
    setScanProgress(0)
    setActiveZoneIdx(-1)
    setCompletedZones([])
    setQualityError(null)
    setScores(null)
    setPreQuizData({})
    setContactData({})
    setGateData({})
    setRevealPhase(0)
    setRevealedZones([])
    setCounterAge(0)
    setRevealedFindings(0)
    setStage("choose")
  }

  // ── Pre-quiz complete → go to camera or upload ─────────────────
  const handlePreQuizComplete = (data: Record<string, string>) => {
    setPreQuizData(data)
    trackFunnelEvent("quiz_complete", data)
    updateLead({ name: data.name, age: parseInt(data.age), email: data.email, profileData: data, funnelStage: "quiz_complete" })
    if (captureMode === "camera") {
      setStage("camera")
    } else {
      setStage("upload-guide")
    }
  }

  // ── Contact complete → results-1 ──────────────────────────────
  const handleContactComplete = (data: Record<string, string>) => {
    setContactData(data)
    trackFunnelEvent("contact_complete", { email: data.email, phone: data.phone })
    updateLead({ phone: data.phone, funnelStage: "contact_complete" })
    // Save to localStorage
    try {
      localStorage.setItem("insideoutmed_profile", JSON.stringify({ ...preQuizData, ...data }))
      if (scores) {
        localStorage.setItem("insideoutmed_scores", JSON.stringify({
          overall: scores.overall,
          luminosity: scores.luminosity,
          hydration: scores.hydration,
          uniformity: scores.uniformity,
          glycation: scores.glycation,
          inflammation: scores.inflammation,
          sunDamage: scores.sunDamage,
          vascularity: scores.vascularity,
          texture: scores.texture,
          wrinkleDepth: scores.wrinkleDepth,
          darkCircles: scores.darkCircles,
          symmetry: scores.symmetry,
          ageApparent: scores.ageApparent,
          zoneScores: scores.zoneScores,
          ...preQuizData, ...data,
        }))
      }
    } catch {}
    // Save to Supabase (non-blocking)
    try {
      fetch("/api/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: typeof window !== "undefined" ? (window as any).__iom_session : undefined,
          email: preQuizData.email || data.email || "",
          scores: { overall: scores?.overall, luminosity: scores?.luminosity, hydration: scores?.hydration, uniformity: scores?.uniformity, glycation: scores?.glycation, inflammation: scores?.inflammation, sunDamage: scores?.sunDamage, vascularity: scores?.vascularity, texture: scores?.texture, wrinkleDepth: scores?.wrinkleDepth, darkCircles: scores?.darkCircles, symmetry: scores?.symmetry, ageApparent: scores?.ageApparent, zoneScores: scores?.zoneScores },
          profile: preQuizData,
        }),
      }).catch(() => {}) // Silent fail — don't block UI
    } catch {}
    trackFunnelEvent("results_viewed", { overall: scores?.overall, ageApparent: scores?.ageApparent })
    updateLead({ scanData: scores, funnelStage: "results_viewed" })
    setStage("results-1")
  }

  // ── Gate quiz complete → results-2 ─────────────────────────────
  const handleGateComplete = (data: Record<string, string>) => {
    setGateData(data)
    trackFunnelEvent("full_results_viewed", data)
    updateLead({ funnelStage: "full_results_viewed" })
    setActiveResultZone(0)
    setAutoPlay(true)
    setShowBiomarkers(false)
    // Save all data to localStorage
    try {
      localStorage.setItem("insideoutmed_profile", JSON.stringify({ ...preQuizData, ...contactData, ...data }))
      if (scores) {
        localStorage.setItem("insideoutmed_scores", JSON.stringify({
          overall: scores.overall,
          luminosity: scores.luminosity,
          hydration: scores.hydration,
          uniformity: scores.uniformity,
          glycation: scores.glycation,
          inflammation: scores.inflammation,
          sunDamage: scores.sunDamage,
          vascularity: scores.vascularity,
          texture: scores.texture,
          wrinkleDepth: scores.wrinkleDepth,
          darkCircles: scores.darkCircles,
          symmetry: scores.symmetry,
          ageApparent: scores.ageApparent,
          zoneScores: scores.zoneScores,
          ...preQuizData, ...contactData, ...data,
        }))
      }
    } catch {}
    setStage("results-2")
  }

  // ── Build biomarker list ──────────────────────────────────────
  // For "lower is better" metrics, we show a HEALTH score (100 - raw)
  // so all bars read left-to-right = better, more intuitive for the user
  const biomarkers = scores ? [
    { label: "Luminosidad",      rawValue: scores.luminosity,    higherBetter: true,  friendlyLabel: "Brillo de tu piel" },
    { label: "Suavidad",          rawValue: scores.hydration,     higherBetter: true,  friendlyLabel: "Suavidad de tu piel" },
    { label: "Uniformidad",      rawValue: scores.uniformity,    higherBetter: true,  friendlyLabel: "Tono parejo" },
    { label: "Glicación",        rawValue: scores.glycation,     higherBetter: false, friendlyLabel: "Daño por azúcar" },
    { label: "Inflamación",      rawValue: scores.inflammation,  higherBetter: false, friendlyLabel: "Rojez e inflamación" },
    { label: "Daño solar",       rawValue: scores.sunDamage,     higherBetter: false, friendlyLabel: "Daño por sol" },
    { label: "Vascularidad",     rawValue: scores.vascularity,   higherBetter: false, friendlyLabel: "Rojez vascular" },
    { label: "Ojeras",            rawValue: scores.darkCircles,   higherBetter: true,  friendlyLabel: "Contorno de ojos" },
    { label: "Simetría",          rawValue: scores.symmetry ?? 85, higherBetter: true,  friendlyLabel: "Simetría facial" },
  ].map(b => {
    // Display value: always "higher = better" for intuitive reading
    const displayValue = b.higherBetter ? b.rawValue : (100 - b.rawValue)
    const severity = 100 - displayValue // higher severity = worse
    const color = displayValue >= 75 ? "#7ecba1" : displayValue >= 55 ? "#d4af88" : "#e8a4b0"
    const note = displayValue >= 75 ? "Excelente" : displayValue >= 55 ? "Aceptable" : displayValue >= 35 ? "Mejorable" : "Atención"
    const alert = displayValue < 55
    return { ...b, value: displayValue, severity, color, note, alert, insight: getBiomarkerInsight(b.label, b.rawValue) }
  }) : []

  // Top 3 critical findings (sorted by severity)
  const criticalFindings = [...biomarkers].sort((a, b) => b.severity - a.severity).slice(0, 3)

  const percentile = scores ? Math.round(100 - scores.overall * 0.82) : 18

  return (
    <div style={{ minHeight: "100vh", background: "#0e0c12", color: "#f5ede8", fontFamily: "var(--font-inter, sans-serif)", display: "flex", flexDirection: "column" }}>

      {/* Nav */}
      <nav style={{ padding: "0 24px", height: 68, display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid rgba(245,237,232,0.06)", flexShrink: 0 }}>
        <a href="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
          <svg width="26" height="26" viewBox="0 0 28 28" fill="none"><circle cx="14" cy="14" r="13" stroke="#e8a4b0" strokeWidth="1.5"/><circle cx="14" cy="14" r="7" stroke="#e8a4b0" strokeWidth="1" strokeDasharray="3 2"/><circle cx="14" cy="14" r="3" fill="#e8a4b0"/></svg>
          <span style={{ fontFamily: "var(--font-fraunces)", fontSize: 17, fontWeight: 500, color: "#f5ede8" }}>InsideOutMed</span>
        </a>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 10, color: "rgba(245,237,232,0.28)", letterSpacing: "0.14em", textTransform: "uppercase" }}>Análisis Facial</span>
        </div>
      </nav>

      <main style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "24px 16px" }}>

        {/* ── CHOOSE ── */}
        {stage === "choose" && (
          <div style={{ maxWidth: 520, width: "100%", textAlign: "center" }}>
            <p style={{ fontSize: 10, letterSpacing: "0.16em", color: "#e8a4b0", textTransform: "uppercase", fontWeight: 700, marginBottom: 14 }}>Paso 1</p>
            <h1 style={{ fontFamily: "var(--font-fraunces)", fontSize: "clamp(26px, 5vw, 42px)", fontWeight: 400, lineHeight: 1.1, marginBottom: 12, letterSpacing: "-0.03em" }}>
              ¿Cómo quieres analizarte?
            </h1>
            <p style={{ fontSize: 14, color: "rgba(245,237,232,0.42)", marginBottom: 36, lineHeight: 1.65 }}>
              Detectamos 478 puntos faciales y analizamos cada zona de tu piel.<br/>
              Necesitas <strong style={{ color: "rgba(245,237,232,0.7)", fontWeight: 500 }}>buena luz natural</strong> y el rostro visible.
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 14, marginBottom: 28 }}>
              <button onClick={() => { setCaptureMode("camera"); setStage("pre-quiz") }}
                style={{ background: "rgba(245,237,232,0.03)", border: "1.5px solid rgba(245,237,232,0.1)", borderRadius: 18, padding: "28px 18px", cursor: "pointer", color: "#f5ede8", textAlign: "center", transition: "all 0.2s", display: "flex", flexDirection: "column", alignItems: "center", gap: 14 }}
                onMouseEnter={e=>{e.currentTarget.style.borderColor="rgba(232,164,176,0.45)";e.currentTarget.style.background="rgba(232,164,176,0.05)"}}
                onMouseLeave={e=>{e.currentTarget.style.borderColor="rgba(245,237,232,0.1)";e.currentTarget.style.background="rgba(245,237,232,0.03)"}}>
                <div style={{ width: 52, height: 52, borderRadius: "50%", background: "rgba(232,164,176,0.1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <svg width="24" height="24" viewBox="0 0 28 28" fill="none"><rect x="2" y="7" width="24" height="18" rx="3" stroke="#e8a4b0" strokeWidth="1.5"/><circle cx="14" cy="16" r="5" stroke="#e8a4b0" strokeWidth="1.5"/><path d="M10 7V5a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2" stroke="#e8a4b0" strokeWidth="1.5"/></svg>
                </div>
                <div><p style={{ fontSize: 15, fontWeight: 600, marginBottom: 4 }}>Escaneo en vivo</p><p style={{ fontSize: 12, color: "rgba(245,237,232,0.4)", lineHeight: 1.5 }}>Cámara frontal</p></div>
                <span style={{ fontSize: 9, color: "#e8a4b0", letterSpacing: "0.12em", fontWeight: 700, border: "1px solid rgba(232,164,176,0.3)", padding: "2px 10px", borderRadius: 99 }}>RECOMENDADO</span>
              </button>
              <button onClick={() => { setCaptureMode("upload"); setStage("pre-quiz") }}
                style={{ background: "rgba(245,237,232,0.03)", border: "1.5px solid rgba(245,237,232,0.1)", borderRadius: 18, padding: "28px 18px", cursor: "pointer", color: "#f5ede8", textAlign: "center", transition: "all 0.2s", display: "flex", flexDirection: "column", alignItems: "center", gap: 14 }}
                onMouseEnter={e=>{e.currentTarget.style.borderColor="rgba(245,237,232,0.22)";e.currentTarget.style.background="rgba(245,237,232,0.05)"}}
                onMouseLeave={e=>{e.currentTarget.style.borderColor="rgba(245,237,232,0.1)";e.currentTarget.style.background="rgba(245,237,232,0.03)"}}>
                <div style={{ width: 52, height: 52, borderRadius: "50%", background: "rgba(245,237,232,0.06)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <svg width="24" height="24" viewBox="0 0 28 28" fill="none"><rect x="3" y="3" width="22" height="22" rx="4" stroke="rgba(245,237,232,0.55)" strokeWidth="1.5"/><circle cx="10" cy="10" r="2.5" stroke="rgba(245,237,232,0.55)" strokeWidth="1.5"/><path d="M3 18l6-6 4 4 4-5 8 7" stroke="rgba(245,237,232,0.55)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </div>
                <div><p style={{ fontSize: 15, fontWeight: 600, marginBottom: 4 }}>Subir selfie</p><p style={{ fontSize: 12, color: "rgba(245,237,232,0.4)", lineHeight: 1.5 }}>Desde galería</p></div>
                <span style={{ fontSize: 9, color: "rgba(245,237,232,0.3)", letterSpacing: "0.12em", fontWeight: 600 }}>JPG / PNG</span>
              </button>
            </div>
            <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f) }}/>
            <div style={{ background: "rgba(245,237,232,0.025)", border: "1px solid rgba(245,237,232,0.07)", borderRadius: 12, padding: "14px 18px", marginBottom: 20, textAlign: "left", display: "flex", flexDirection: "column", gap: 6 }}>
              {["Luz natural o lámpara frontal. Sin contraluz.","Rostro descubierto, sin gafas ni maquillaje.","Cámara a la altura de los ojos."].map((tip,i)=>(
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ fontSize: 9, color: "#7ecba1", fontWeight: 700 }}>0{i+1}</span>
                  <span style={{ fontSize: 12, color: "rgba(245,237,232,0.45)" }}>{tip}</span>
                </div>
              ))}
            </div>
            <p style={{ fontSize: 10, color: "rgba(245,237,232,0.18)", letterSpacing: "0.07em" }}>478 PUNTOS FACIALES · PROCESAMIENTO LOCAL · 100% PRIVADO</p>
          </div>
        )}

        {/* ── PRE-QUIZ ── */}
        {stage === "pre-quiz" && (
          <ProfileQuiz mode="pre-scan" onComplete={handlePreQuizComplete} />
        )}

        {/* ── UPLOAD GUIDE ── */}
        {stage === "upload-guide" && (
          <div style={{ maxWidth: 480, width: "100%", textAlign: "center" }}>
            <p style={{ fontSize: 10, letterSpacing: "0.16em", color: "#d4af88", textTransform: "uppercase", fontWeight: 700, marginBottom: 14 }}>Antes de subir tu foto</p>
            <h2 style={{ fontFamily: "var(--font-fraunces)", fontSize: "clamp(22px, 4vw, 32px)", fontWeight: 400, marginBottom: 10, letterSpacing: "-0.03em", lineHeight: 1.15 }}>
              La foto correcta marca<br/><em style={{ color: "#e8a4b0", fontStyle: "italic" }}>la diferencia en los resultados</em>
            </h2>
            <p style={{ fontSize: 13, color: "rgba(245,237,232,0.4)", marginBottom: 28, lineHeight: 1.65 }}>Usamos 478 puntos para mapear tu cara y analizar cada zona.</p>
            <div style={{ textAlign: "left", marginBottom: 14 }}>
              <p style={{ fontSize: 9, letterSpacing: "0.16em", textTransform: "uppercase", color: "#7ecba1", fontWeight: 700, marginBottom: 10 }}>Asi funciona</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                {[
                  { icon: "luz", text: "Luz natural frontal — ventana o lámpara apuntando a tu cara, sin contraluz" },
                  { icon: "rostro", text: "Rostro centrado y completo — frente, mejillas, nariz y mentón visibles" },
                  { icon: "sin", text: "Sin maquillaje, filtros, gafas ni cabello tapando la cara" },
                  { icon: "camara", text: "Cámara al nivel de los ojos, a 30–50 cm de distancia" },
                  { icon: "nitida", text: "Imagen nítida y bien expuesta" },
                ].map((item,i)=>(
                  <div key={i} style={{ display: "flex", gap: 12, padding: "11px 14px", background: "rgba(126,203,161,0.04)", border: "1px solid rgba(126,203,161,0.1)", borderRadius: 11 }}>
                    <span style={{ flexShrink: 0, color: "rgba(232,164,176,0.6)" }}>{QUIZ_ICONS[item.icon] || item.icon}</span>
                    <span style={{ fontSize: 13, color: "rgba(245,237,232,0.6)", lineHeight: 1.55 }}>{item.text}</span>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => setStage("pre-quiz")} style={{ flex: 1, padding: "13px", background: "rgba(245,237,232,0.05)", border: "1px solid rgba(245,237,232,0.1)", borderRadius: 12, color: "rgba(245,237,232,0.5)", fontSize: 13, cursor: "pointer" }}>Volver</button>
              <button onClick={() => fileRef.current?.click()} style={{ flex: 2, padding: "13px", background: "linear-gradient(135deg,#d4af88,#b8936a)", border: "none", borderRadius: 12, color: "#0e0c12", fontSize: 14, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><rect x="3" y="3" width="18" height="18" rx="3" stroke="currentColor" strokeWidth="2"/><circle cx="8.5" cy="8.5" r="1.5" fill="currentColor"/><path d="M3 15l5-5 4 4 3-3 6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                Elegir foto
              </button>
            </div>
          </div>
        )}

        {/* ── CAMERA — uses CameraStage with guided experience ── */}
        {stage === "camera" && (
          <CameraStage
            onCapture={handleCameraCapture}
            onCancel={reset}
            onScanError={handleScanError}
            fitzpatrick={parseInt(preQuizData.fitzpatrick || "3", 10)}
            age={parseInt(preQuizData.age || "30", 10)}
          />
        )}

        {/* ── SCANNING — cinematic 9-zone reveal ── */}
        {stage === "scanning" && capturedUrl && (
          <div style={{ maxWidth: 400, width: "100%", textAlign: "center" }}>
            <p style={{ fontSize: 10, letterSpacing: "0.16em", color: "#e8a4b0", textTransform: "uppercase", fontWeight: 700, marginBottom: 20 }}>
              Analizando 9 zonas faciales
            </p>

            {/* Face image with cinematic scan overlay */}
            <div style={{ position: "relative", width: "100%", paddingBottom: "125%", borderRadius: 22, overflow: "hidden", marginBottom: 20, border: "1px solid rgba(232,164,176,0.15)" }}>
              <img src={capturedUrl} alt="análisis" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />

              {/* Dark cinematic overlay */}
              <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg,rgba(14,12,18,0.4) 0%,rgba(14,12,18,0.15) 30%,rgba(14,12,18,0.15) 60%,rgba(14,12,18,0.5) 100%)", pointerEvents: "none" }} />

              {/* Grid lines overlay — subtle medical/tech feel */}
              <div style={{ position: "absolute", inset: 0, pointerEvents: "none", opacity: 0.12 }}>
                {[20,40,60,80].map(p => (
                  <div key={`h${p}`} style={{ position: "absolute", left: 0, right: 0, top: `${p}%`, height: 1, background: "rgba(232,164,176,0.6)" }} />
                ))}
                {[25,50,75].map(p => (
                  <div key={`v${p}`} style={{ position: "absolute", top: 0, bottom: 0, left: `${p}%`, width: 1, background: "rgba(232,164,176,0.6)" }} />
                ))}
              </div>

              {/* Main scan beam — horizontal sweep */}
              {scanProgress < 99 && (
                <div style={{
                  position: "absolute", left: 0, right: 0, height: 2,
                  background: "linear-gradient(90deg, transparent 0%, rgba(232,164,176,0.9) 30%, #fff 50%, rgba(126,203,161,0.9) 70%, transparent 100%)",
                  boxShadow: "0 0 30px rgba(232,164,176,0.6), 0 -8px 20px rgba(232,164,176,0.15), 0 8px 20px rgba(232,164,176,0.15)",
                  top: `${Math.min(scanProgress, 95)}%`,
                  transition: "top 0.15s linear",
                }} />
              )}

              {/* Scanning zone highlight — transparent rectangle on active zone */}
              {activeZoneIdx >= 0 && activeZoneIdx < SCAN_ZONES_ANIM.length && scanProgress < 99 && (
                <div style={{
                  position: "absolute",
                  left: "10%", right: "10%",
                  top: `${Math.max(0, SCAN_ZONES_ANIM[activeZoneIdx].yPct - 6)}%`,
                  height: "14%",
                  border: "1px solid rgba(232,164,176,0.3)",
                  borderRadius: 8,
                  background: "rgba(232,164,176,0.06)",
                  transition: "top 0.5s ease, opacity 0.3s",
                  pointerEvents: "none",
                }} />
              )}

              {/* Corner brackets — tech frame */}
              <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none" }} viewBox="0 0 100 100" preserveAspectRatio="none">
                <path d="M5,2 L2,2 L2,5" fill="none" stroke="rgba(232,164,176,0.4)" strokeWidth="0.3" />
                <path d="M95,2 L98,2 L98,5" fill="none" stroke="rgba(232,164,176,0.4)" strokeWidth="0.3" />
                <path d="M5,98 L2,98 L2,95" fill="none" stroke="rgba(232,164,176,0.4)" strokeWidth="0.3" />
                <path d="M95,98 L98,98 L98,95" fill="none" stroke="rgba(232,164,176,0.4)" strokeWidth="0.3" />
              </svg>

              {/* Live metrics — appear as scan progresses */}
              <div style={{ position: "absolute", top: 12, left: 14, pointerEvents: "none" }}>
                <div style={{ fontSize: 8, fontFamily: "monospace", color: "rgba(126,203,161,0.7)", letterSpacing: "0.05em", lineHeight: 1.8 }}>
                  {scanProgress > 5 && <div style={{ animation: "fadeIn 0.3s ease" }}>SCAN {Math.min(scanProgress, 100)}%</div>}
                  {scanProgress > 20 && <div style={{ animation: "fadeIn 0.3s ease" }}>LANDMARKS 478</div>}
                  {scanProgress > 40 && <div style={{ animation: "fadeIn 0.3s ease" }}>ZONAS {Math.min(completedZones.length + 1, 9)}/9</div>}
                  {scanProgress > 60 && <div style={{ animation: "fadeIn 0.3s ease" }}>MUESTRAS {Math.round(scanProgress * 0.8)}</div>}
                  {scanProgress > 80 && <div style={{ animation: "fadeIn 0.3s ease" }}>BIOMARCADORES OK</div>}
                </div>
              </div>

              {/* Zone name — bottom right, current zone being scanned */}
              {activeZoneIdx >= 0 && scanProgress < 99 && (
                <div style={{
                  position: "absolute", bottom: 14, right: 14,
                  fontSize: 10, fontFamily: "monospace", fontWeight: 600,
                  color: "rgba(232,164,176,0.8)", letterSpacing: "0.12em", textTransform: "uppercase",
                  textShadow: "0 0 12px rgba(232,164,176,0.4)",
                }}>
                  {SCAN_ZONES_ANIM[activeZoneIdx]?.label ?? ""}
                </div>
              )}

              {/* Scan complete — green flash + checkmark */}
              {scanProgress >= 99 && (
                <div style={{
                  position: "absolute", inset: 0,
                  background: "rgba(126,203,161,0.1)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  animation: "scanFlash 0.5s ease forwards",
                  pointerEvents: "none",
                }}>
                  <div style={{
                    width: 56, height: 56, borderRadius: "50%",
                    background: "rgba(126,203,161,0.15)", border: "2px solid rgba(126,203,161,0.5)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    animation: "scanZonePop 0.4s ease",
                  }}>
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                      <path d="M5 13l4 4L19 7" stroke="#7ecba1" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                </div>
              )}
            </div>

            {/* Progress bar */}
            <div style={{ height: 3, background: "rgba(245,237,232,0.06)", borderRadius: 2, overflow: "hidden", marginBottom: 14 }}>
              <div style={{ height: "100%", width: `${scanProgress}%`, background: `linear-gradient(90deg,#e8a4b0,#d4af88,#7ecba1)`, transition: "width 0.1s linear", borderRadius: 2 }} />
            </div>

            {/* Status text */}
            <p style={{ fontSize: 11, color: "rgba(245,237,232,0.4)", letterSpacing: "0.06em", textAlign: "center" }}>
              {scanProgress < 10 ? "Detectando estructura facial…" :
               scanProgress < 25 ? "Mapeando 478 puntos de referencia…" :
               scanProgress < 45 ? "Analizando textura y pigmentación…" :
               scanProgress < 65 ? "Evaluando biomarcadores cutáneos…" :
               scanProgress < 80 ? "Midiendo luminosidad e hidratación…" :
               scanProgress < 95 ? "Consolidando resultados…" : "Análisis completado"}
            </p>
          </div>
        )}

        {/* ── CONTACT — email + phone quiz ── */}
        {stage === "contact" && scores && (
          <ProfileQuiz mode="contact" onComplete={handleContactComplete} scores={scores} />
        )}

        {/* ── ERROR ── */}
        {stage === "error" && (
          <div style={{ maxWidth: 460, width: "100%", textAlign: "center" }}>
            <div style={{ width: 64, height: 64, borderRadius: "50%", background: "rgba(232,164,176,0.1)", border: "1px solid rgba(232,164,176,0.25)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 24px" }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none"><path d="M12 9v4M12 17h.01M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" stroke="#e8a4b0" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </div>
            <h2 style={{ fontFamily: "var(--font-fraunces)", fontSize: 24, fontWeight: 400, marginBottom: 12, letterSpacing: "-0.02em" }}>No pudimos leer tu piel</h2>
            <p style={{ fontSize: 14, color: "rgba(245,237,232,0.5)", lineHeight: 1.7, marginBottom: 28, maxWidth: 360, margin: "0 auto 28px" }}>{qualityError}</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 7, maxWidth: 320, margin: "0 auto 28px" }}>
              {["Enciende una luz frontal (lámpara, ventana)","Centra bien tu rostro — debe verse completo","Sin gafas ni cabello cubriendo la cara"].map((tip,i)=>(
                <div key={i} style={{ display: "flex", gap: 10, padding: "10px 14px", background: "rgba(245,237,232,0.03)", border: "1px solid rgba(245,237,232,0.07)", borderRadius: 10, textAlign: "left" }}>
                  <span style={{ fontSize: 10, color: "#7ecba1", fontWeight: 700, flexShrink: 0, paddingTop: 2 }}>0{i+1}</span>
                  <span style={{ fontSize: 13, color: "rgba(245,237,232,0.55)", lineHeight: 1.5 }}>{tip}</span>
                </div>
              ))}
            </div>
            <button onClick={reset} style={{ padding: "13px 36px", background: "linear-gradient(135deg,#e8a4b0,#c97e8e)", border: "none", borderRadius: 12, color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>Intentar de nuevo</button>
          </div>
        )}

        {/* ── RESULTS LAYER 1 — top 3 critical findings ── */}
        {stage === "results-1" && scores && (() => {
          const userName = preQuizData.name || ""
          const userAge = parseInt(preQuizData.age || "30", 10)
          const skinAge = Math.round(scores.ageApparent || userAge + 3)
          const ageDiff = Math.round(skinAge - userAge)
          const isOlder = ageDiff > 0
          const isSame = ageDiff === 0

          // Distribute ageDiff proportionally across top 3 findings based on severity
          const top3 = criticalFindings.slice(0, 3)
          const totalSeverity = top3.reduce((s, b) => s + b.severity, 0) || 1
          const humanFindings = top3.map((b, idx) => {
            // Each finding's year impact is proportional to its severity relative to the total
            const proportion = b.severity / totalSeverity
            const yearContribution = Math.abs(ageDiff) * proportion
            const roundedYears = Math.round(yearContribution * 2) / 2 // round to nearest 0.5
            const yearsStr = roundedYears <= 0.5 ? "~0.5 años" : roundedYears === 1 ? "~1 año" : `~${roundedYears} años`
            const descMap: Record<string, string> = {
              "Daño solar": "Fotodaño acumulado — textura irregular y manchas",
              "Inflamación": "Rojez activa en mejillas — irritación crónica",
              "Glicación": "Colágeno debilitado por azúcar — pérdida de firmeza",
              "Vascularidad": "Vasos dilatados visibles en mejillas y nariz",
              "Luminosidad": "Piel apagada — sin brillo ni reflejo natural",
              "Suavidad": "Textura irregular — superficie áspera y microescamas",
              "Uniformidad": "Tono desigual — manchas y rojez visible",
            }
            return { desc: descMap[b.label] || b.friendlyLabel, years: yearsStr, color: b.color }
          })

          return (
          <div style={{ maxWidth: 480, width: "100%" }}>

            {/* ── PHOTO — protagonist, full-width with zone reveals ── */}
            {capturedUrl && (
              <div style={{
                position: "relative", width: "100%", aspectRatio: "3/4", borderRadius: 24,
                overflow: "hidden", marginBottom: 32,
                opacity: revealPhase >= 0 ? 1 : 0,
                transform: revealPhase >= 0 ? "scale(1)" : "scale(0.96)",
                transition: "opacity 0.8s ease, transform 0.8s ease",
              }}>
                <img src={capturedUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />

                {/* Vignette */}
                <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at center, transparent 45%, rgba(14,12,18,0.5) 100%)", pointerEvents: "none" }} />

                {/* Zone glow dots */}
                {RESULT_ZONES.map((z, i) => {
                  const isRevealed = revealedZones.includes(i)
                  const dotScore = (scores.zoneScores as Record<string, number>)[z.key] ?? 50
                  const glowColor = dotScore >= 75 ? "126,203,161" : dotScore >= 55 ? "212,175,136" : "232,164,176"
                  const labelSide = z.dotX > 55 ? "left" : "right"

                  return (
                    <div key={z.key} style={{
                      position: "absolute", left: `${z.dotX}%`, top: `${z.dotY}%`,
                      transform: "translate(-50%, -50%)", zIndex: 5,
                      opacity: isRevealed ? 1 : 0, transition: "opacity 0.4s ease",
                    }}>
                      <div style={{
                        width: 28, height: 28, borderRadius: "50%",
                        border: `1.5px solid rgba(${glowColor}, 0.7)`,
                        background: `rgba(${glowColor}, 0.12)`,
                        boxShadow: `0 0 16px rgba(${glowColor}, 0.5), 0 0 32px rgba(${glowColor}, 0.15)`,
                        animation: isRevealed ? "revealPulse 2.5s ease-in-out infinite" : "none",
                        display: "flex", alignItems: "center", justifyContent: "center",
                      }}>
                        <div style={{ width: 6, height: 6, borderRadius: "50%", background: `rgb(${glowColor})` }} />
                      </div>
                      <span style={{
                        position: "absolute", top: "50%",
                        ...(labelSide === "left"
                          ? { right: "calc(100% + 8px)", left: "auto" }
                          : { left: "calc(100% + 8px)", right: "auto" }),
                        transform: "translateY(-50%)", whiteSpace: "nowrap",
                        fontSize: 9, fontWeight: 700, letterSpacing: "0.05em",
                        color: `rgba(${glowColor}, 0.9)`,
                        textShadow: "0 1px 6px rgba(0,0,0,0.9), 0 0 12px rgba(0,0,0,0.6)",
                        opacity: isRevealed ? 1 : 0, transition: "opacity 0.3s ease 0.15s",
                      }}>
                        {z.label}
                      </span>
                    </div>
                  )
                })}

                {/* Scanning beam during zone reveal */}
                {revealPhase === 1 && revealedZones.length < RESULT_ZONES.length && (
                  <div style={{
                    position: "absolute", left: 0, right: 0, height: 2,
                    top: `${RESULT_ZONES[Math.min(revealedZones.length, RESULT_ZONES.length - 1)]?.dotY ?? 30}%`,
                    background: "linear-gradient(90deg, transparent 5%, rgba(126,203,161,0.5) 30%, rgba(126,203,161,0.8) 50%, rgba(126,203,161,0.5) 70%, transparent 95%)",
                    boxShadow: "0 0 18px rgba(126,203,161,0.25)",
                    transition: "top 0.22s ease", pointerEvents: "none", zIndex: 4,
                  }} />
                )}

                {/* "9 zonas analizadas" badge */}
                {revealPhase >= 2 && (
                  <div style={{
                    position: "absolute", bottom: 16, left: "50%",
                    transform: "translateX(-50%)",
                    background: "rgba(14,12,18,0.65)", backdropFilter: "blur(12px)",
                    borderRadius: 99, padding: "6px 16px",
                    border: "1px solid rgba(126,203,161,0.25)",
                    display: "flex", alignItems: "center", gap: 6,
                    animation: "fadeSlideUp 0.5s ease",
                  }}>
                    <div style={{ width: 5, height: 5, borderRadius: "50%", background: "#7ecba1", boxShadow: "0 0 6px #7ecba1" }} />
                    <span style={{ fontSize: 9, color: "#7ecba1", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase" }}>9 zonas analizadas</span>
                  </div>
                )}
              </div>
            )}

            {/* ── AGE REVEAL — counter animation ── */}
            <div style={{
              textAlign: "center", marginBottom: 28,
              opacity: revealPhase >= 2 ? 1 : 0,
              transform: revealPhase >= 2 ? "translateY(0)" : "translateY(20px)",
              transition: "all 0.6s ease",
            }}>
              <p style={{ fontSize: 10, letterSpacing: "0.18em", color: "rgba(245,237,232,0.3)", textTransform: "uppercase", marginBottom: 6, fontWeight: 600 }}>
                Tu rostro aparenta
              </p>
              <p style={{
                fontFamily: "var(--font-fraunces)", fontSize: "clamp(64px, 14vw, 96px)",
                fontWeight: 300, lineHeight: 1, marginBottom: 10,
                color: isOlder ? "#e8a4b0" : isSame ? "#f5ede8" : "#7ecba1",
                textShadow: isOlder ? "0 0 40px rgba(232,164,176,0.25)" : "0 0 40px rgba(126,203,161,0.25)",
              }}>
                {counterAge || skinAge}
              </p>
              {/* Hidden until counter finishes — preserves surprise */}
              <div style={{
                opacity: counterAge >= skinAge ? 1 : 0,
                transform: counterAge >= skinAge ? "translateY(0)" : "translateY(8px)",
                transition: "all 0.5s ease",
              }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12, marginBottom: 10 }}>
                  <span style={{ fontSize: 13, color: "rgba(245,237,232,0.4)" }}>Tienes <strong style={{ color: "rgba(245,237,232,0.7)" }}>{userAge}</strong></span>
                  <span style={{ color: "rgba(245,237,232,0.12)", fontSize: 14 }}>→</span>
                  <span style={{ fontSize: 13, color: "rgba(245,237,232,0.4)" }}>Tu cara dice <strong style={{ color: isOlder ? "#e8a4b0" : "#7ecba1" }}>{skinAge}</strong></span>
                </div>
                <span style={{
                  display: "inline-block", padding: "5px 18px", borderRadius: 99,
                  fontSize: 11, fontWeight: 700, letterSpacing: "0.04em",
                  color: isOlder ? "#e8a4b0" : "#7ecba1",
                  background: isOlder ? "rgba(232,164,176,0.1)" : "rgba(126,203,161,0.1)",
                  border: `1px solid ${isOlder ? "rgba(232,164,176,0.2)" : "rgba(126,203,161,0.2)"}`,
                }}>
                  {isOlder ? `+${ageDiff} años por encima` : isSame ? "Coincide con tu edad" : `${Math.abs(ageDiff)} años por debajo`}
                </span>
              </div>
              <h2 style={{
                fontFamily: "var(--font-fraunces)", fontSize: "clamp(18px, 3.5vw, 26px)",
                fontWeight: 400, marginTop: 18, letterSpacing: "-0.02em", lineHeight: 1.2,
                color: "rgba(245,237,232,0.85)",
              }}>
                {userName ? `${userName}, ` : ""}{isOlder ? "se puede revertir." : isSame ? "buen punto de partida." : "vas por buen camino."}
              </h2>
            </div>

            {/* ── FINDINGS — human language, no bars ── */}
            <div style={{
              marginBottom: 24,
              opacity: revealPhase >= 3 ? 1 : 0,
              transform: revealPhase >= 3 ? "translateY(0)" : "translateY(12px)",
              transition: "all 0.4s ease",
            }}>
              <div style={{ background: "rgba(245,237,232,0.03)", border: "1px solid rgba(245,237,232,0.08)", borderRadius: 20, padding: "24px 20px" }}>
                <p style={{ fontSize: 9, letterSpacing: "0.16em", color: "rgba(245,237,232,0.3)", textTransform: "uppercase", marginBottom: 18, fontWeight: 700 }}>
                  {isOlder ? "Lo que está sumando años" : "Áreas de oportunidad"}
                </p>
                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  {humanFindings.map((f, idx) => (
                    <div key={idx} style={{
                      opacity: revealedFindings > idx ? 1 : 0,
                      transform: revealedFindings > idx ? "translateX(0)" : "translateX(-10px)",
                      transition: "all 0.35s ease",
                      display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12,
                      paddingBottom: idx < humanFindings.length - 1 ? 14 : 0,
                      borderBottom: idx < humanFindings.length - 1 ? "1px solid rgba(245,237,232,0.05)" : "none",
                    }}>
                      <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                        <div style={{ width: 6, height: 6, borderRadius: "50%", background: f.color, marginTop: 6, flexShrink: 0, boxShadow: `0 0 8px ${f.color}` }} />
                        <span style={{ fontSize: 14, color: "rgba(245,237,232,0.7)", lineHeight: 1.45 }}>{f.desc}</span>
                      </div>
                      <span style={{
                        fontSize: 10, fontWeight: 700, color: "#e8a4b0", whiteSpace: "nowrap", flexShrink: 0,
                        background: "rgba(232,164,176,0.08)", border: "1px solid rgba(232,164,176,0.15)",
                        borderRadius: 99, padding: "3px 10px", marginTop: 2,
                      }}>
                        +{f.years}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* ── CTAs ── */}
            <div style={{
              opacity: revealPhase >= 4 ? 1 : 0,
              transform: revealPhase >= 4 ? "translateY(0)" : "translateY(14px)",
              transition: "all 0.5s ease",
            }}>
              <button
                onClick={() => setStage("gate-quiz")}
                style={{
                  width: "100%", padding: "17px 28px", marginBottom: 12,
                  background: "linear-gradient(135deg,#e8a4b0,#c97e8e)",
                  border: "none", borderRadius: 14, color: "#fff",
                  fontSize: 15, fontWeight: 700, cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                  boxShadow: "0 6px 24px rgba(232,164,176,0.3)",
                }}
              >
                Ver mi plan gratuito →
              </button>

              <a
                href={`https://wa.me/${WHATSAPP_NUMBER}?text=Hola%2C%20quiero%20una%20asesor%C3%ADa%20personalizada.%20Mi%20score%20fue%20`}
                target="_blank" rel="noopener noreferrer"
                style={{
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
                  width: "100%", padding: "18px 28px",
                  background: "linear-gradient(135deg, rgba(212,175,136,0.12) 0%, rgba(232,164,176,0.08) 100%)",
                  border: "1.5px solid rgba(212,175,136,0.3)",
                  borderRadius: 14, color: "#d4af88",
                  fontSize: 14, fontWeight: 700, textDecoration: "none",
                  boxShadow: "0 4px 20px rgba(212,175,136,0.15)",
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"/>
                </svg>
                Asesoría personalizada con especialista
              </a>

              <div style={{ borderTop: "1px solid rgba(245,237,232,0.1)", marginTop: 24, paddingTop: 16, display: "flex", alignItems: "flex-start", gap: 8, justifyContent: "center" }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0, marginTop: 1 }}>
                  <circle cx="12" cy="12" r="10" stroke="rgba(245,237,232,0.4)" strokeWidth="1.5"/>
                  <line x1="12" y1="8" x2="12" y2="13" stroke="rgba(245,237,232,0.4)" strokeWidth="1.5" strokeLinecap="round"/>
                  <circle cx="12" cy="16.5" r="0.8" fill="rgba(245,237,232,0.4)"/>
                </svg>
                <p style={{ fontSize: 12, color: "rgba(245,237,232,0.4)", textAlign: "center", lineHeight: 1.6 }}>
                  Estimación visual educativa basada en biomarcadores faciales. No constituye diagnóstico médico ni reemplaza la evaluación de un profesional de la salud.
                </p>
              </div>
            </div>
          </div>
          )
        })()}

        {/* ── GATE QUIZ — 3 questions to unlock full report ── */}
        {stage === "gate-quiz" && (
          <ProfileQuiz mode="gate" onComplete={handleGateComplete} scores={scores} />
        )}

        {/* ── RESULTS LAYER 2 — cinematic face analysis ── */}
        {stage === "results-2" && scores && (() => {
          const userName = preQuizData.name || ""
          const userAge = parseInt(preQuizData.age || "30", 10)
          const skinAge = Math.round(scores.ageApparent || userAge + 3)
          const ageDiff = Math.round(skinAge - userAge)
          const isOlder = ageDiff > 0

          const zone = RESULT_ZONES[activeResultZone]
          const zoneScore = (scores.zoneScores as Record<string, number>)[zone.key] ?? 50
          const { color: zoneColor, label: statusLabel } = getZoneStatus(zoneScore)
          const description = getZoneDescription(zone.key, zoneScore)

          // ── Derive sub-metrics from zone scores ──
          const s = scores.zoneScores as Record<string, number>
          const derivedSubMetrics: Record<string, {label: string, score: number}[]> = {
            frente: [
              { label: "Líneas horizontales", score: Math.round(clamp(s.forehead * 0.85, 15, 95)) },
              { label: "Glabela / entrecejo", score: Math.round(clamp(s.forehead * 0.80 + 5, 15, 95)) },
              { label: "Simetría de cejas", score: Math.round(clamp(s.forehead * 0.6 + 35, 40, 99)) },
              { label: "Posición de cejas", score: Math.round(clamp(s.forehead * 0.5 + 40, 40, 100)) },
            ],
            periocular: [
              { label: "Apertura ocular", score: Math.round(clamp((s.periocularL + s.periocularR) / 2 * 0.9 + 5, 20, 95)) },
              { label: "Simetría L/R", score: Math.round(clamp(100 - Math.abs(s.periocularL - s.periocularR) * 3, 50, 99)) },
              { label: "Ojeras / pigmento", score: Math.round(clamp((s.periocularL + s.periocularR) / 2 * 0.75, 15, 95)) },
              { label: "Ojeras / oscurecimiento", score: Math.round(clamp(scores.darkCircles ?? 70, 15, 95)) },
              { label: "Bolsas / hinchazón", score: Math.round(clamp((s.periocularL + s.periocularR) / 2 * 0.80 - 5, 15, 90)) },
              { label: "Patas de gallo", score: Math.round(clamp((s.periocularL + s.periocularR) / 2 * 0.85, 15, 90)) },
              { label: "Densidad de pestañas", score: Math.round(clamp((s.periocularL + s.periocularR) / 2 * 0.5 + 40, 40, 99)) },
            ],
            nariz: [
              { label: "Proporción", score: Math.round(clamp(s.nose * 0.9 + 5, 30, 98)) },
              { label: "Simetría de narinas", score: Math.round(clamp(s.nose * 0.7 + 25, 40, 99)) },
            ],
            labios: [
              { label: "Volumen", score: Math.round(clamp(s.lips * 0.85 + 5, 20, 95)) },
              { label: "Ratio superior/inferior", score: Math.round(clamp(s.lips * 0.6 + 30, 40, 99)) },
              { label: "Arco de Cupido", score: Math.round(clamp(s.lips * 0.7 + 20, 30, 98)) },
              { label: "Suavidad", score: Math.round(clamp(s.lips * 0.9, 20, 98)) },
              { label: "Líneas peribucales", score: Math.round(clamp(s.lips * 0.75 - 5, 15, 90)) },
              { label: "Color / saturación", score: Math.round(clamp(s.lips * 0.65 + 15, 20, 95)) },
            ],
            mejillas: [
              { label: "Proyección de pómulos", score: Math.round(clamp((s.cheekL + s.cheekR) / 2 * 0.85, 20, 90)) },
              { label: "Volumen", score: Math.round(clamp((s.cheekL + s.cheekR) / 2 * 0.80 + 5, 20, 90)) },
              { label: "Textura", score: Math.round(clamp((s.cheekL + s.cheekR) / 2 * 0.75, 15, 90)) },
              { label: "Surco nasogeniano", score: Math.round(clamp((s.cheekL + s.cheekR) / 2 * 0.85 + 5, 20, 95)) },
              { label: "Drenaje / rojez", score: Math.round(clamp((s.cheekL + s.cheekR) / 2 * 0.7 + 20, 30, 98)) },
            ],
            mandibula: [
              { label: "Definición mandibular", score: Math.round(clamp(s.jaw * 0.9, 20, 95)) },
              { label: "Ángulo gonial", score: Math.round(clamp(s.jaw * 0.85 + 5, 20, 95)) },
              { label: "Flacidez (jowl)", score: Math.round(clamp(s.jaw * 0.80, 20, 90)) },
              { label: "Simetría L/R", score: Math.round(clamp(s.jaw * 0.6 + 35, 40, 99)) },
            ],
            cuello: [
              { label: "Definición submentoniana", score: Math.round(clamp(s.neck * 0.85, 20, 90)) },
              { label: "Líneas horizontales", score: Math.round(clamp(s.neck * 0.80 - 5, 15, 90)) },
              { label: "Postura", score: 70 },
            ],
            piel: [
              { label: "Suavidad", score: Math.round(clamp(scores.overall * 0.85, 15, 95)) },
              { label: "Poros / textura", score: Math.round(clamp(scores.uniformity * 0.80, 15, 90)) },
              { label: "Glicación", score: Math.round(clamp(100 - scores.glycation, 10, 95)) },
              { label: "Manchas / uniformidad", score: Math.round(scores.uniformity) },
              { label: "Luminosidad", score: Math.round(scores.luminosity) },
              { label: "Daño solar", score: Math.round(clamp(100 - scores.sunDamage, 10, 95)) },
              { label: "Simetría facial", score: Math.round(scores.symmetry ?? 85) },
            ],
          }

          // ── Build UserProfile for cross-reference insights ──
          const userProfile: UserProfile = {
            name: preQuizData.name || "",
            age: userAge,
            email: preQuizData.email || "",
            phone: contactData.phone || "",
            goals: (preQuizData.goals || "").split(",").filter(Boolean),
            sensitivity: preQuizData.sensitivity || "",
            budget: preQuizData.budget || "",
            invasive: preQuizData.invasive || "",
            fitzpatrick: parseInt(preQuizData.fitzpatrick || "3", 10),
            sleep: preQuizData.sleep || "",
            stress: preQuizData.stress || "",
            exercise: preQuizData.exercise || "",
            sun: preQuizData.sun || "",
            diet: gateData.diet || "",
            concern: gateData.concern || "",
            routine: gateData.routine || "",
            conditions: (preQuizData.conditions || "").split(",").filter(Boolean),
            consent: true,
          }

          // Build scores with subMetrics for cross-reference engine
          const scoresWithSubs = { ...scores, subMetrics: derivedSubMetrics }
          const crossRefInsights = generateCrossRefInsights(scoresWithSubs as any, userProfile)

          // ── Brain insights: evidence-based analysis ──
          const brainPapers = [
            { key_findings: "El uso diario de FPS redujo el fotoenvejecimiento un 24%.", applicable_zones: ["piel", "frente", "mejillas"], applicable_treatments: ["Protector solar SPF 50"], authors: "Hughes MCB et al.", year: 2013, title: "Sunscreen and prevention of skin aging", tags: ["SPF", "fotoenvejecimiento", "photoaging", "sunscreen"] },
            { key_findings: "La vitamina C topica aumenta la sintesis de colageno y protege del fotodano.", applicable_zones: ["piel", "mejillas"], applicable_treatments: ["Vitamina C 15-20% (AM)"], authors: "Pinnell SR", year: 2001, title: "Topical vitamin C increases collagen synthesis", tags: ["vitamina C", "colageno", "antioxidante"] },
            { key_findings: "Los retinoides reducen arrugas y aumentan colageno de forma comprobada.", applicable_zones: ["piel", "frente", "periocular", "labios"], applicable_treatments: ["Retinol 0.3% -> 1% (PM)"], authors: "Mukherjee S et al.", year: 2006, title: "Retinoids in the treatment of skin aging", tags: ["retinol", "retinoid", "anti-aging", "colageno", "arrugas"] },
            { key_findings: "Peptidos de colageno orales mejoraron elasticidad cutanea en 8 semanas.", applicable_zones: ["piel", "mandibula"], applicable_treatments: ["Colageno hidrolizado tipo I y III"], authors: "Proksch E et al.", year: 2014, title: "Oral collagen peptides improve skin elasticity", tags: ["colageno", "elasticidad", "suplemento", "peptidos"] },
            { key_findings: "Niacinamida topica mejoro arrugas, manchas, rojez y elasticidad.", applicable_zones: ["piel", "mejillas", "frente"], applicable_treatments: ["Niacinamida 5-10%"], authors: "Bissett DL et al.", year: 2005, title: "Niacinamide improves aging facial skin", tags: ["niacinamida", "niacinamide", "poros", "manchas", "barrera"] },
            { key_findings: "Cafeina topica reduce edema periorbital.", applicable_zones: ["periocular"], applicable_treatments: ["Contorno de ojos con cafeina + peptidos"], authors: "Herman A, Herman AP", year: 2013, title: "Caffeine reduces periorbital edema", tags: ["cafeina", "ojeras", "hinchazon", "periocular"] },
            { key_findings: "La luz roja mejora densidad de colageno y reduce arrugas.", applicable_zones: ["piel", "frente", "mejillas"], applicable_treatments: ["LED rojo terapeutico"], authors: "Wunsch A, Matuschka K", year: 2014, title: "Red light and skin rejuvenation", tags: ["LED", "fotobiomodulacion", "colageno", "luz roja"] },
            { key_findings: "El envejecimiento cutaneo resulta de UV (80%), genetica, hormonas, contaminacion y tabaco.", applicable_zones: ["piel", "frente", "periocular", "mejillas", "mandibula", "cuello"], applicable_treatments: ["Protector solar SPF 50", "Retinol 0.3% -> 1% (PM)"], authors: "Farage MA et al.", year: 2008, title: "Intrinsic and extrinsic factors in skin ageing", tags: ["aging", "skin aging", "envejecimiento", "UV"] },
            { key_findings: "El estres oxidativo es un mecanismo central del envejecimiento cutaneo.", applicable_zones: ["piel", "frente", "mejillas"], applicable_treatments: ["Vitamina C 15-20% (AM)", "Antioxidantes topicos"], authors: "Kammeyer A, Luiten RM", year: 2015, title: "Oxidation events and skin aging", tags: ["oxidacion", "antioxidante", "aging", "radicales libres"] },
            { key_findings: "Fotoproteccion + antioxidantes + retinoides = abordaje multimodal necesario.", applicable_zones: ["piel", "frente", "mejillas", "cuello"], applicable_treatments: ["Protector solar SPF 50", "Retinol 0.3% -> 1% (PM)"], authors: "Krutmann J et al.", year: 2017, title: "The skin aging exposome", tags: ["exposome", "aging", "UV", "prevencion"] },
            { key_findings: "La exposicion solar cronica genera manchas, arrugas y perdida de elasticidad acumulativa.", applicable_zones: ["piel", "frente", "mejillas", "periocular", "cuello"], applicable_treatments: ["Protector solar SPF 50"], authors: "Flament F et al.", year: 2013, title: "Effect of sun on visible clinical signs of aging", tags: ["sun", "photoaging", "arrugas", "manchas", "exposicion solar"] },
            { key_findings: "Retinol al 0.4% mejoro arrugas finas en piel envejecida en 24 semanas.", applicable_zones: ["piel", "frente", "periocular", "mejillas"], applicable_treatments: ["Retinol 0.3% -> 1% (PM)"], authors: "Kafi R et al.", year: 2007, title: "Improvement of naturally aged skin with retinol", tags: ["retinol", "retinoid", "arrugas", "colageno", "anti-aging"] },
            { key_findings: "Vitamina C topica al 10-20% maximiza absorcion, estimula colageno e inhibe melanogenesis.", applicable_zones: ["piel", "mejillas", "frente", "periocular"], applicable_treatments: ["Vitamina C 15-20% (AM)"], authors: "Pullar JM et al.", year: 2017, title: "The roles of vitamin C in skin health", tags: ["vitamina C", "vitamin C", "antioxidante", "colageno", "fotoproteccion"] },
            { key_findings: "Mala calidad de sueno acelera signos de envejecimiento y retrasa recuperacion de barrera.", applicable_zones: ["piel", "periocular", "frente"], applicable_treatments: ["Mejora de calidad de sueno"], authors: "Oyetakin-White P et al.", year: 2015, title: "Poor sleep quality affects skin ageing", tags: ["sueno", "sleep", "aging", "barrera cutanea"] },
            { key_findings: "Estres cronico degrada colageno y amplifica rosacea, dermatitis e inflamacion.", applicable_zones: ["piel", "mejillas"], applicable_treatments: ["Manejo de estres"], authors: "Kahan V et al.", year: 2009, title: "Stress and skin collagen integrity", tags: ["estres", "stress", "cortisol", "inflamacion", "barrera cutanea"] },
            { key_findings: "La barrera cutanea esta comprometida en rosacea; ceramidas y niacinamida son clave.", applicable_zones: ["mejillas", "nariz"], applicable_treatments: ["Niacinamida 5-10%", "Limpiador suave + hidratante con ceramidas"], authors: "Addor FAS", year: 2017, title: "Skin barrier in rosacea", tags: ["rosacea", "barrera cutanea", "inflamacion", "ceramidas"] },
            { key_findings: "La rosacea se clasifica por fenotipos. El tratamiento debe personalizarse.", applicable_zones: ["mejillas", "nariz", "frente"], applicable_treatments: ["Niacinamida 5-10%", "Azelaic acid 15%"], authors: "Gallo RL et al.", year: 2018, title: "Standard classification of rosacea", tags: ["rosacea", "inflamacion", "rojez", "eritema"] },
            { key_findings: "El acido hialuronico disminuye con la edad. HA topico de bajo peso molecular mejora hidratacion.", applicable_zones: ["piel", "mejillas", "labios", "periocular"], applicable_treatments: ["Acido hialuronico topico"], authors: "Papakonstantinou E et al.", year: 2012, title: "Hyaluronic acid: key molecule in skin aging", tags: ["acido hialuronico", "hyaluronic", "hidratacion", "volumen", "aging"] },
            { key_findings: "Colageno oral (2.5g/dia x 12 semanas) mejora hidratacion +28%, elasticidad +19%.", applicable_zones: ["piel", "mejillas", "mandibula", "cuello"], applicable_treatments: ["Colageno hidrolizado tipo I y III"], authors: "Bolke L et al.", year: 2019, title: "Collagen supplement improves skin hydration and elasticity", tags: ["colageno", "suplemento", "hidratacion", "elasticidad"] },
            { key_findings: "Acido ferulico + vitamina C + E duplica la fotoproteccion cutanea.", applicable_zones: ["piel", "frente", "mejillas"], applicable_treatments: ["Vitamina C 15-20% (AM)", "Antioxidantes topicos"], authors: "Lin FH et al.", year: 2005, title: "Ferulic acid doubles photoprotection of vitamins C and E", tags: ["acido ferulico", "vitamina C", "antioxidante", "fotoproteccion"] },
            { key_findings: "Proteccion solar + retinoides + antioxidantes son las estrategias anti-aging con mayor evidencia.", applicable_zones: ["piel", "frente", "mejillas", "periocular", "mandibula", "cuello"], applicable_treatments: ["Protector solar SPF 50", "Retinol 0.3% -> 1% (PM)", "Vitamina C 15-20% (AM)"], authors: "Ganceviciene R et al.", year: 2012, title: "Skin anti-aging strategies", tags: ["anti-aging", "estrategias", "multimodal", "evidencia"] },
          ]
          const brainInsights = generateBrainInsights(scores, userProfile, brainPapers)

          // Human-readable findings with year impact
          // Calculate year impact proportionally based on actual ageDiff
          const r2Top3 = [...criticalFindings].sort((a, b) => b.severity - a.severity).slice(0, 3)
          const r2TotalSev = r2Top3.reduce((s, b) => s + b.severity, 0) || 1
          const yearImpact: Record<string, string> = {}
          for (const b of r2Top3) {
            const proportion = b.severity / r2TotalSev
            const yrs = Math.round(Math.abs(ageDiff) * proportion * 2) / 2
            yearImpact[b.label] = yrs <= 0.5 ? "hasta +0.5 años" : yrs === 1 ? "hasta +1 año" : `hasta +${yrs} años`
          }

          const findingDescriptions: Record<string, { title: string; desc: string }> = {
            "Protección solar": { title: "Protección solar insuficiente", desc: "Tu piel muestra fotodaño acumulado que acelera la pérdida de elasticidad y genera manchas." },
            "Control de inflamación": { title: "Inflamación activa", desc: "Rojez e irritación crónica que amplifica el envejecimiento y debilita la barrera cutánea." },
            "Salud del colágeno": { title: "Colágeno debilitado", desc: "Las fibras de colágeno se degradan más rápido de lo esperado, afectando firmeza y elasticidad." },
            "Luminosidad": { title: "Piel apagada", desc: "Falta de brillo natural que refleja deshidratación profunda y acumulación de células muertas." },
            "Suavidad": { title: "Textura irregular", desc: "La superficie de la piel muestra rugosidad y aspereza, indicando barrera cutánea comprometida." },
            "Uniformidad de tono": { title: "Tono desigual", desc: "Manchas e irregularidades de pigmento que dan un aspecto envejecido y cansado." },
            "Salud vascular": { title: "Fragilidad vascular", desc: "Vasos sanguíneos visibles o rojez persistente que indican sensibilidad e inflamación subyacente." },
          }

          return (
          <div style={{ maxWidth: 560, width: "100%" }}>
            {/* Header */}
            <div style={{ textAlign: "center", marginBottom: 24 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginBottom: 14 }}>
                <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#7ecba1", boxShadow: "0 0 8px rgba(126,203,161,0.8)" }} />
                <span style={{ fontSize: 10, letterSpacing: "0.18em", color: "#7ecba1", textTransform: "uppercase", fontWeight: 700 }}>Informe completo · 9 zonas · 7 biomarcadores</span>
              </div>
              <h1 style={{ fontFamily: "var(--font-fraunces)", fontSize: "clamp(24px, 4vw, 34px)", fontWeight: 400, marginBottom: 8, letterSpacing: "-0.03em", lineHeight: 1.1 }}>
                {userName ? `${userName}, tu` : "Tu"} rostro aparenta{" "}
                <em style={{ color: isOlder ? "#e8a4b0" : "#7ecba1", fontStyle: "italic" }}>
                  {skinAge} años
                </em>
              </h1>
              <p style={{ fontSize: 13, color: "rgba(245,237,232,0.4)", lineHeight: 1.6 }}>
                {isOlder ? "Pero se puede revertir. Te mostramos cómo." : ageDiff === 0 ? "Buen punto de partida. Te ayudamos a mejorarlo." : "Vas por buen camino. Te ayudamos a mantenerlo."}
              </p>
            </div>

            {/* ── FACE VIEWER — full photo with all dots ── */}
            {capturedUrl && (
              <div style={{
                position: "relative", width: "100%", maxWidth: 420, margin: "0 auto",
                aspectRatio: "3/4", borderRadius: 20, overflow: "hidden",
                background: "#060409",
              }}>
                {/* Photo — full view, no zoom */}
                <img
                  src={capturedUrl}
                  alt="Tu análisis facial"
                  style={{
                    position: "absolute", inset: 0, width: "100%", height: "100%",
                    objectFit: "cover",
                    transition: "filter 0.4s ease",
                    filter: "none",
                  }}
                />

                {/* Subtle vignette */}
                <div style={{
                  position: "absolute", inset: 0,
                  background: "linear-gradient(180deg, rgba(14,12,18,0.15) 0%, transparent 20%, transparent 75%, rgba(14,12,18,0.5) 100%)",
                  pointerEvents: "none",
                }} />

                {/* Zone dots — subtle pulsing indicators */}
                {RESULT_ZONES.map((z, i) => {
                  const dotScore = (scores.zoneScores as Record<string, number>)[z.key] ?? 50
                  const glowColor = dotScore >= 75 ? "126,203,161" : dotScore >= 55 ? "212,175,136" : "232,164,176"
                  const isActive = activeResultZone === i

                  return (
                    <button
                      key={z.key}
                      onClick={() => {
                        setActiveResultZone(i)
                        setAutoPlay(false)
                        const accKey = z.key === "periocularL" || z.key === "periocularR" ? "periocular"
                                     : z.key === "cheekL" || z.key === "cheekR" ? "mejillas"
                                     : z.key === "forehead" ? "frente"
                                     : z.key === "nose" ? "nariz"
                                     : z.key === "lips" ? "labios"
                                     : z.key === "jaw" ? "mandibula"
                                     : z.key === "neck" ? "cuello" : null
                        if (accKey) setActiveZone(accKey)
                      }}
                      style={{
                        position: "absolute",
                        left: `${z.dotX}%`, top: `${z.dotY}%`,
                        transform: "translate(-50%, -50%)",
                        width: isActive ? 28 : 24, height: isActive ? 28 : 24,
                        borderRadius: "50%",
                        border: `1.5px solid rgba(${glowColor}, ${isActive ? 0.8 : 0.5})`,
                        background: `rgba(${glowColor}, ${isActive ? 0.15 : 0.08})`,
                        boxShadow: isActive
                          ? `0 0 16px rgba(${glowColor}, 0.6), 0 0 32px rgba(${glowColor}, 0.2)`
                          : `0 0 10px rgba(${glowColor}, 0.35), 0 0 20px rgba(${glowColor}, 0.1)`,
                        cursor: "pointer",
                        transition: "all 0.3s ease",
                        zIndex: isActive ? 5 : 3,
                        padding: 0,
                        animation: "zoneDotPulse 2.8s ease-in-out infinite",
                        display: "flex", alignItems: "center", justifyContent: "center",
                      }}
                    >
                      <div style={{
                        width: isActive ? 7 : 5, height: isActive ? 7 : 5,
                        borderRadius: "50%",
                        background: `rgb(${glowColor})`,
                        transition: "all 0.3s ease",
                      }} />
                      {/* Label on hover / active */}
                      {isActive && (
                        <span style={{
                          position: "absolute",
                          top: "calc(100% + 6px)", left: "50%",
                          transform: "translateX(-50%)",
                          whiteSpace: "nowrap",
                          fontSize: 9, fontWeight: 700, letterSpacing: "0.05em",
                          color: `rgba(${glowColor}, 0.95)`,
                          textShadow: "0 1px 6px rgba(0,0,0,0.9), 0 0 12px rgba(0,0,0,0.6)",
                          animation: "labelSlide 0.25s ease forwards",
                          pointerEvents: "none",
                        }}>
                          {z.label}
                        </span>
                      )}
                    </button>
                  )
                })}

                {/* Active zone label on photo */}
                <div style={{
                  position: "absolute", top: 14, left: 14,
                  background: "rgba(14,12,18,0.7)", backdropFilter: "blur(12px)",
                  borderRadius: 10, padding: "7px 14px",
                  transition: "all 0.3s ease",
                  border: `1px solid ${zoneColor}33`,
                }}>
                  <span style={{ fontSize: 12, color: "#f5ede8", fontWeight: 600 }}>{zone.label}</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: zoneColor, marginLeft: 8 }}>{zoneScore}</span>
                </div>

              </div>
            )}

            {/* ── CROSS-REFERENCE INSIGHTS — lifestyle x analysis ── */}
            {crossRefInsights.length > 0 && (
              <div style={{ marginTop: 20, marginBottom: 8 }}>
                <p style={{ fontSize: 9, letterSpacing: "0.16em", color: "rgba(245,237,232,0.3)", textTransform: "uppercase", marginBottom: 14, fontWeight: 700 }}>
                  Tu estilo de vida en tu cara
                </p>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {crossRefInsights.map((insight, idx) => {
                    const severityColor = insight.severity === "critical" ? "#e8a4b0" : insight.severity === "warning" ? "#d4af88" : "#7ecba1"
                    const severityBg = insight.severity === "critical" ? "rgba(232,164,176,0.08)" : insight.severity === "warning" ? "rgba(212,175,136,0.06)" : "rgba(126,203,161,0.06)"
                    const severityBorder = insight.severity === "critical" ? "rgba(232,164,176,0.2)" : insight.severity === "warning" ? "rgba(212,175,136,0.15)" : "rgba(126,203,161,0.15)"
                    return (
                      <div key={idx} style={{
                        background: severityBg, border: `1px solid ${severityBorder}`,
                        borderRadius: 14, padding: "16px 18px",
                      }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                          <span style={{ fontSize: 18 }}>{insight.icon}</span>
                          <span style={{ fontSize: 13, fontWeight: 700, color: severityColor }}>{insight.title}</span>
                        </div>
                        <p style={{ fontSize: 12, color: "rgba(245,237,232,0.55)", lineHeight: 1.65, margin: 0 }}>
                          {insight.text}
                        </p>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* ── BRAIN INSIGHTS — lo que dice la ciencia ── */}
            {brainInsights.length > 0 && (
              <div style={{ marginTop: 20, marginBottom: 8 }}>
                <p style={{ fontSize: 9, letterSpacing: "0.16em", color: "rgba(245,237,232,0.3)", textTransform: "uppercase", marginBottom: 14, fontWeight: 700 }}>
                  Lo que dice la ciencia
                </p>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {brainInsights.map((insight, idx) => {
                    const borderColor = insight.severity === "critical" ? "#e8a4b0" : insight.severity === "warning" ? "#d4af88" : "#7ecba1"
                    const cardBg = insight.severity === "critical" ? "rgba(232,164,176,0.06)" : insight.severity === "warning" ? "rgba(212,175,136,0.04)" : "rgba(126,203,161,0.04)"
                    const borderSide = insight.severity === "critical" ? "rgba(232,164,176,0.35)" : insight.severity === "warning" ? "rgba(212,175,136,0.25)" : "rgba(126,203,161,0.25)"
                    return (
                      <div key={idx} style={{
                        background: cardBg,
                        border: "1px solid rgba(245,237,232,0.06)",
                        borderLeft: `3px solid ${borderSide}`,
                        borderRadius: "4px 14px 14px 4px",
                        padding: "16px 18px",
                      }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                          <div style={{
                            width: 6, height: 6, borderRadius: "50%",
                            background: borderColor,
                            boxShadow: `0 0 6px ${borderColor}66`,
                            flexShrink: 0,
                          }} />
                          <span style={{ fontSize: 13, fontWeight: 700, color: borderColor }}>{insight.title}</span>
                        </div>
                        <p style={{ fontSize: 12, color: "rgba(245,237,232,0.55)", lineHeight: 1.65, margin: "0 0 10px" }}>
                          {insight.text}
                        </p>
                        <p style={{ fontSize: 10, color: "rgba(245,237,232,0.28)", lineHeight: 1.4, margin: 0, fontStyle: "italic" }}>
                          {insight.evidence}
                        </p>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* ── ZONE ACCORDION — sub-metrics per zone ── */}
            <div style={{ marginTop: 24 }}>
              <h2 style={{ fontFamily: "var(--font-fraunces)", fontSize: 22, fontWeight: 400, marginBottom: 16 }}>
                Analisis por zona
              </h2>
              {Object.entries(ACCORDION_META).map(([key, meta]) => {
                const subs = derivedSubMetrics[key]
                const accScore = subs ? Math.round(subs.reduce((a, sm) => a + sm.score, 0) / subs.length) : 50
                const isOpen = activeZone === key
                const statusColor = accScore >= 75 ? "#7ecba1" : accScore >= 55 ? "#d4af88" : "#e8a4b0"
                return (
                  <div key={key} style={{
                    background: "rgba(245,237,232,0.03)", border: `1px solid ${isOpen ? "rgba(232,164,176,0.2)" : "rgba(245,237,232,0.06)"}`,
                    borderRadius: 16, marginBottom: 10, overflow: "hidden", transition: "all 0.3s",
                  }}>
                    <button onClick={() => setActiveZone(isOpen ? null : key)} style={{
                      width: "100%", padding: "16px 20px", background: "none", border: "none", cursor: "pointer", color: "#f5ede8",
                      display: "flex", alignItems: "center", justifyContent: "space-between",
                    }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div style={{
                          width: 28, height: 28, borderRadius: "50%",
                          background: `${statusColor}15`, border: `1.5px solid ${statusColor}40`,
                          display: "flex", alignItems: "center", justifyContent: "center",
                          fontSize: 11, fontWeight: 700, color: statusColor,
                        }}>
                          {meta.icon}
                        </div>
                        <span style={{ fontSize: 14, fontWeight: 600 }}>{meta.label}</span>
                        {key === "cuello" && <span style={{ fontSize: 10, color: "rgba(245,237,232,0.3)", fontStyle: "italic" }}>estimado</span>}
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <span style={{ fontFamily: "var(--font-fraunces)", fontSize: 20, fontWeight: 400, color: statusColor }}>{accScore}</span>
                        <span style={{ fontSize: 12, color: "rgba(245,237,232,0.3)", transform: isOpen ? "rotate(180deg)" : "none", transition: "transform 0.2s", display: "inline-block" }}>&#x25BE;</span>
                      </div>
                    </button>
                    {isOpen && subs && (
                      <div style={{ padding: "0 20px 20px" }}>
                        {subs.map((sub, i) => {
                          const barColor = sub.score >= 75 ? "#7ecba1" : sub.score >= 55 ? "#d4af88" : "#e8a4b0"
                          return (
                            <div key={i} style={{ marginBottom: 14 }}>
                              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                                <span style={{ fontSize: 13, color: "rgba(245,237,232,0.65)" }}>{sub.label}</span>
                                <span style={{ fontSize: 13, fontWeight: 600, color: barColor }}>{sub.score}</span>
                              </div>
                              <div style={{ height: 4, borderRadius: 2, background: "rgba(245,237,232,0.06)" }}>
                                <div style={{ height: "100%", borderRadius: 2, background: barColor, width: `${sub.score}%`, transition: "width 0.5s ease" }} />
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>

            {/* ── AGE COMPARISON (compact) ── */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 14, marginTop: 24, marginBottom: 8 }}>
              <span style={{ fontSize: 13, color: "rgba(245,237,232,0.4)" }}>Tu edad: <strong style={{ color: "#f5ede8" }}>{userAge} años</strong></span>
              <span style={{ color: "rgba(245,237,232,0.15)" }}>→</span>
              <span style={{ fontSize: 13, color: "rgba(245,237,232,0.4)" }}>Aparentas: <strong style={{ color: isOlder ? "#e8a4b0" : "#7ecba1" }}>{skinAge} años</strong></span>
            </div>
            <div style={{ textAlign: "center", marginBottom: 24 }}>
              <span style={{
                display: "inline-block", padding: "4px 14px", borderRadius: 99,
                fontSize: 11, fontWeight: 700,
                color: isOlder ? "#e8a4b0" : "#7ecba1",
                background: isOlder ? "rgba(232,164,176,0.1)" : "rgba(126,203,161,0.1)",
                border: `1px solid ${isOlder ? "rgba(232,164,176,0.2)" : "rgba(126,203,161,0.2)"}`,
              }}>
                {isOlder ? `+${ageDiff} años por encima` : ageDiff === 0 ? "Coincide con tu edad" : `${Math.abs(ageDiff)} años por debajo`}
              </span>
            </div>

            {/* ── TOP 3 FINDINGS ── */}
            <div style={{
              background: "rgba(245,237,232,0.03)",
              border: "1px solid rgba(245,237,232,0.08)",
              borderRadius: 16, padding: "24px 20px", marginBottom: 20,
            }}>
              <p style={{ fontSize: 9, letterSpacing: "0.16em", color: "rgba(245,237,232,0.3)", textTransform: "uppercase", marginBottom: 18, fontWeight: 700 }}>
                {isOlder ? "Lo que está sumando años" : "Áreas de oportunidad"}
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                {criticalFindings.map((b, idx) => {
                  const fd = findingDescriptions[b.friendlyLabel] || { title: b.friendlyLabel, desc: b.insight }
                  const years = yearImpact[b.label] || "hasta +1 año"
                  return (
                    <div key={b.label} style={{ paddingBottom: idx < criticalFindings.length - 1 ? 20 : 0, borderBottom: idx < criticalFindings.length - 1 ? "1px solid rgba(245,237,232,0.05)" : "none" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
                        <span style={{ fontSize: 14, color: "rgba(245,237,232,0.8)", fontWeight: 600, fontFamily: "var(--font-fraunces)" }}>{fd.title}</span>
                        <span style={{
                          fontSize: 10, fontWeight: 700, color: "#e8a4b0",
                          background: "rgba(232,164,176,0.1)", border: "1px solid rgba(232,164,176,0.2)",
                          borderRadius: 99, padding: "2px 10px", whiteSpace: "nowrap", flexShrink: 0, marginLeft: 8,
                        }}>{years}</span>
                      </div>
                      <p style={{ fontSize: 12, color: "rgba(245,237,232,0.4)", lineHeight: 1.6, margin: "0 0 4px" }}>{fd.desc}</p>
                      <p style={{ fontSize: 11, color: "rgba(245,237,232,0.3)", lineHeight: 1.5, margin: 0, fontStyle: "italic" }}>{b.insight}</p>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* ── BIOMARKERS (collapsible) ── */}
            <div style={{ marginBottom: 24 }}>
              <button
                onClick={() => setShowBiomarkers(prev => !prev)}
                style={{
                  width: "100%", padding: "14px 20px",
                  background: "rgba(245,237,232,0.03)", border: "1px solid rgba(245,237,232,0.08)",
                  borderRadius: showBiomarkers ? "14px 14px 0 0" : 14,
                  color: "rgba(245,237,232,0.6)", fontSize: 13, fontWeight: 600,
                  cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "space-between",
                  transition: "all 0.2s",
                }}
              >
                <span>Ver biomarcadores detallados</span>
                <span style={{ fontSize: 14, transition: "transform 0.2s", transform: showBiomarkers ? "rotate(180deg)" : "rotate(0)" }}>▾</span>
              </button>
              {showBiomarkers && (
                <div style={{
                  background: "rgba(245,237,232,0.03)",
                  border: "1px solid rgba(245,237,232,0.08)", borderTop: "none",
                  borderRadius: "0 0 14px 14px", padding: "20px",
                }}>
                  <p style={{ fontSize: 10.5, color: "rgba(245,237,232,0.22)", marginBottom: 20, lineHeight: 1.5 }}>Todas las barras miden salud: más llena = mejor estado</p>
                  <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                    {biomarkers.map(b => (
                      <div key={b.label}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <span style={{ fontSize: 13, color: "rgba(245,237,232,0.75)", fontWeight: 600 }}>{b.friendlyLabel}</span>
                            {b.alert && <span style={{ fontSize: 8, color: "#d4af88", background: "rgba(212,175,136,0.1)", border: "1px solid rgba(212,175,136,0.22)", padding: "1px 7px", borderRadius: 99, fontWeight: 700, letterSpacing: "0.08em" }}>MEJORABLE</span>}
                          </div>
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <span style={{ fontSize: 9, color: "rgba(245,237,232,0.28)", letterSpacing: "0.06em", textTransform: "uppercase" }}>{b.note}</span>
                            <span style={{ fontSize: 14, fontWeight: 700, color: b.color, minWidth: 36, textAlign: "right" }}>{b.value}%</span>
                          </div>
                        </div>
                        <div style={{ height: 4, background: "rgba(245,237,232,0.06)", borderRadius: 2, overflow: "hidden", marginBottom: 7 }}>
                          <div style={{ height: "100%", width: `${b.value}%`, background: `linear-gradient(90deg, ${b.color}88, ${b.color})`, borderRadius: 2, transition: "width 0.8s ease" }} />
                        </div>
                        <p style={{ fontSize: 11.5, color: "rgba(245,237,232,0.38)", lineHeight: 1.55 }}>{b.insight}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* ── CTAs ── */}
            {/* Free plan CTA */}
            <button
              onClick={() => {
                try {
                  if (scores) {
                    localStorage.setItem("insideoutmed_scores", JSON.stringify({
                      overall: scores.overall,
                      luminosity: scores.luminosity,
                      hydration: scores.hydration,
                      uniformity: scores.uniformity,
                      glycation: scores.glycation,
                      inflammation: scores.inflammation,
                      sunDamage: scores.sunDamage,
                      vascularity: scores.vascularity,
                      texture: scores.texture,
                      wrinkleDepth: scores.wrinkleDepth,
                      darkCircles: scores.darkCircles,
                      symmetry: scores.symmetry,
                      ageApparent: scores.ageApparent,
                      zoneScores: scores.zoneScores,
                      ...preQuizData, ...contactData, ...gateData,
                    }))
                  }
                } catch {}
                window.location.href = "/plan"
              }}
              style={{
                width: "100%", padding: "17px 28px", marginBottom: 12,
                background: "linear-gradient(135deg,#e8a4b0,#c97e8e)",
                border: "none", borderRadius: 14, color: "#fff",
                fontSize: 15, fontWeight: 700, cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                boxShadow: "0 6px 24px rgba(232,164,176,0.3)",
              }}
            >
              Ver mi plan gratuito →
            </button>

            {/* Gold CTA — consultation */}
            <a
              href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(`Hola, acabo de hacer mi análisis en InsideOutMed. Mi score fue ${scores.overall}/100.`)}`}
              target="_blank" rel="noopener noreferrer"
              style={{
                display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
                width: "100%", padding: "18px 28px",
                background: "linear-gradient(135deg, rgba(212,175,136,0.12) 0%, rgba(232,164,176,0.08) 100%)",
                border: "1.5px solid rgba(212,175,136,0.3)",
                borderRadius: 14, color: "#d4af88",
                fontSize: 14, fontWeight: 700, textDecoration: "none",
                boxShadow: "0 4px 20px rgba(212,175,136,0.15)",
                transition: "all 0.2s", marginBottom: 12,
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"/>
              </svg>
              Asesoría personalizada con especialista
            </a>

            {/* Reset */}
            <div style={{ textAlign: "center", marginTop: 10 }}>
              <button onClick={reset} style={{ background: "none", border: "none", color: "rgba(245,237,232,0.28)", fontSize: 12, cursor: "pointer", padding: "8px 16px" }}>Hacer nuevo análisis</button>
            </div>

            {/* ── DISCLAIMER ── */}
            <div style={{ borderTop: "1px solid rgba(245,237,232,0.1)", marginTop: 32, paddingTop: 16, display: "flex", alignItems: "flex-start", gap: 8, justifyContent: "center", paddingBottom: 40 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0, marginTop: 1 }}>
                <circle cx="12" cy="12" r="10" stroke="rgba(245,237,232,0.4)" strokeWidth="1.5"/>
                <line x1="12" y1="8" x2="12" y2="13" stroke="rgba(245,237,232,0.4)" strokeWidth="1.5" strokeLinecap="round"/>
                <circle cx="12" cy="16.5" r="0.8" fill="rgba(245,237,232,0.4)"/>
              </svg>
              <p style={{ fontSize: 12, color: "rgba(245,237,232,0.4)", textAlign: "center", lineHeight: 1.6 }}>
                Estimación visual educativa basada en biomarcadores faciales. No constituye diagnóstico médico ni reemplaza la evaluación de un profesional de la salud.
              </p>
            </div>
          </div>
          )
        })()}
      </main>

      <style>{`
        @keyframes scanZonePop { from { opacity: 0; transform: translateX(-6px); } to { opacity: 1; transform: translateX(0); } }
        @keyframes pulseDot { 0%,100% { opacity: 0.5; transform: scale(1); } 50% { opacity: 1; transform: scale(1.4); } }
        @keyframes scanFlash { 0% { opacity: 1; } 100% { opacity: 0; } }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes hotspotAppear { 0% { transform: translate(-50%,-50%) scale(0); opacity: 0; } 60% { transform: translate(-50%,-50%) scale(1.5); opacity: 0.8; } 100% { transform: translate(-50%,-50%) scale(1); opacity: 1; } }
        @keyframes hotspotPulse { 0%,100% { box-shadow: 0 0 10px currentColor, 0 0 20px rgba(255,255,255,0.1); transform: translate(-50%,-50%) scale(1); } 50% { box-shadow: 0 0 16px currentColor, 0 0 30px rgba(255,255,255,0.2); transform: translate(-50%,-50%) scale(1.25); } }
        @keyframes hotspotPulseResult { 0%,100% { box-shadow: 0 0 8px currentColor, 0 0 16px currentColor; transform: translate(-50%,-50%) scale(1); } 50% { box-shadow: 0 0 16px currentColor, 0 0 32px currentColor; transform: translate(-50%,-50%) scale(1.3); } }
        @keyframes labelSlide { from { opacity: 0; transform: translateX(-50%) translateY(4px); } to { opacity: 1; transform: translateX(-50%) translateY(0); } }
        @keyframes zoneDotPulse { 0%,100% { transform: translate(-50%,-50%) scale(1); opacity: 0.85; } 50% { transform: translate(-50%,-50%) scale(1.12); opacity: 1; } }
        @keyframes scanReveal { from { opacity: 0; } to { opacity: 1; } }
        @keyframes revealPulse { 0%,100% { transform: scale(1); opacity: 0.8; } 50% { transform: scale(1.15); opacity: 1; } }
        @keyframes fadeSlideUp { from { opacity: 0; transform: translateX(-50%) translateY(8px); } to { opacity: 1; transform: translateX(-50%) translateY(0); } }
        .age-scroll::-webkit-scrollbar { display: none; }
      `}</style>
    </div>
  )
}
