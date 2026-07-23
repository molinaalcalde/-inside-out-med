// ── Shared Types for InsideOutMed ──────────────────────────────

export interface SubMetric {
  label: string
  score: number
}

export interface Scores {
  overall: number
  luminosity: number
  hydration: number
  uniformity: number
  glycation: number
  inflammation: number
  sunDamage: number
  vascularity: number
  ageApparent: number
  symmetry: number
  quality: number
  zoneScores: Record<string, number>
  subMetrics: Record<string, SubMetric[]>
  zDepthAvgs?: Record<string, number>
}

export interface UserProfile {
  name: string
  age: number
  email: string
  phone: string
  goals: string[]
  sensitivity: string
  budget: string
  invasive: string
  fitzpatrick: number
  sleep: string
  stress: string
  exercise: string
  sun: string
  diet: string
  concern: string
  routine: string
  conditions: string[]
  consent: boolean
}

export interface RegionData {
  lum: number
  std: number
  red: number
  yellow: number
  r: number
  g: number
  b: number
}

export interface Paper {
  id: string
  title: string
  authors: string
  year: number
  journal: string
  doi: string
  key_findings: string
  applicable_zones: string[]
  applicable_treatments: string[]
  tags: string[]
  full_citation: string
  created_at: string
  updated_at: string
}

export interface FunnelEvent {
  id: string
  session_id: string
  user_id: string | null
  event_type: string
  event_data: Record<string, unknown>
  created_at: string
}

export interface Rec {
  c: string
  n: string
  inv: number
  tier: string
  age: number
  ph: number
  z: string[]
  g: string[]
  rt?: string
  cost: string
  time?: string
  freq: string
  res: string
  dur?: string
  risk: string
  evi: string
  what: string
  why?: string
  nuevo?: boolean
  always30?: boolean
  md?: boolean
  fitzCaution?: boolean
}

export type CrossRefInsight = {
  icon: string
  title: string
  text: string
  severity: "info" | "warning" | "critical"
}
