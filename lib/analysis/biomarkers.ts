// ── Biomarker display helpers ─────────────────────────────────

export function getStatusColor(score: number): string {
  if (score >= 75) return "#7ecba1"
  if (score >= 55) return "#d4af88"
  return "#e8a4b0"
}

export function getStatusLabel(score: number): { label: string; emoji: string } {
  if (score >= 80) return { label: "Excelente", emoji: "✓" }
  if (score >= 65) return { label: "Bien", emoji: "~" }
  if (score >= 45) return { label: "Mejorable", emoji: "!" }
  return { label: "Prioridad", emoji: "!!" }
}

// Biomarker insight — humanized explanation per level
export function getBiomarkerInsight(label: string, value: number): string {
  const insights: Record<string, [number, string][]> = {
    "Luminosidad": [
      [75, "Tu piel tiene un glow natural visible. Está bien nutrida y oxigenada."],
      [55, "Tu piel tiene algo de brillo pero puede mejorar. Más hidratación y antioxidantes."],
      [0, "Tu piel se ve apagada. Es señal de que necesita renovación celular urgente."],
    ],
    "Hidratación": [
      [75, "Bien hidratada. Tu barrera cutánea está funcionando correctamente."],
      [55, "Hidratación moderada. Tu piel puede estar perdiendo agua más rápido de lo ideal."],
      [0, "Piel deshidratada. Esto acentúa líneas finas y opaca el tono."],
    ],
    "Uniformidad": [
      [75, "Tono muy parejo. Sin manchas ni rojeces notables."],
      [55, "Algunas irregularidades de tono visibles. Daño solar o inflamación leve."],
      [0, "Manchas, rojeces o zonas oscuras visibles. Requiere atención activa."],
    ],
    "Glicación": [
      [20, "Sin signos de glicación. El colágeno no muestra daño por azúcar."],
      [35, "Glicación leve detectada. Reducir azúcar refinada puede frenar este proceso."],
      [0, "Glicación elevada — el azúcar está dañando las fibras de colágeno, acelerando el envejecimiento."],
    ],
    "Inflamación": [
      [15, "Piel calmada, sin signos de estrés visible. Buen punto de partida."],
      [30, "Inflamación silenciosa activa. Puede ser estrés, dieta o productos irritantes."],
      [0, "Inflamación elevada — es el factor que amplifica el envejecimiento y daña la barrera cutánea."],
    ],
    "Daño solar": [
      [15, "Mínimo daño solar acumulado. Tu protección UV está funcionando."],
      [30, "Daño solar moderado. El SPF diario y antioxidantes pueden revertir parte."],
      [0, "Daño solar significativo. Sin protección activa, las manchas seguirán avanzando."],
    ],
    "Vascularidad": [
      [12, "Red vascular estable. Sin signos de cuperosis ni rojez persistente."],
      [25, "Algo de actividad vascular visible. Puede manifestarse como rojez en mejillas y nariz."],
      [0, "Vascularidad elevada — tendencia a rojez, cuperosis o rosácea."],
    ],
  }

  const levels = insights[label]
  if (!levels) return ""
  for (const [threshold, text] of levels) {
    if (value >= threshold) return text
  }
  return levels[levels.length - 1][1]
}

// Zone-specific insight based on score
export function getZoneInsight(key: string, score: number): string {
  const insights: Record<string, { high: string; mid: string; low: string }> = {
    frente:     { high: "Piel uniforme y bien hidratada", mid: "Algo de textura irregular — exfoliación suave ayudaría", low: "Textura marcada o deshidratación visible" },
    periocular: { high: "Sin signos de fatiga o líneas finas", mid: "Leve deshidratación periocular", low: "Líneas de expresión u ojeras visibles" },
    nariz:      { high: "Poros controlados, tono uniforme", mid: "Algo de brillo o poros visibles", low: "Poros dilatados o rojez en la zona T" },
    labios:     { high: "Bien hidratados, sin resequedad", mid: "Algo de resequedad en el contorno", low: "Labios secos o pigmentación irregular" },
    mejillas:   { high: "Tono uniforme, sin rojez", mid: "Leve irregularidad de tono", low: "Rojez o textura irregular notable" },
    mandibula:  { high: "Firmeza y tono uniformes", mid: "Algo de laxitud o textura", low: "Pérdida de firmeza o acné hormonal" },
    cuello:     { high: "Sin líneas ni manchas visibles", mid: "Algo de deshidratación", low: "Líneas horizontales o fotodaño" },
    piel:       { high: "Calidad general buena", mid: "Margen de mejora en textura y tono", low: "La piel necesita atención integral" },
  }
  const zone = insights[key] || { high: "Zona en buen estado", mid: "Zona con margen de mejora", low: "Zona que necesita atención" }
  return score >= 70 ? zone.high : score >= 50 ? zone.mid : zone.low
}

// Condition warnings for treatment compatibility
export const CONDITION_WARNINGS: Record<string, { keywords: string[]; warning: string }> = {
  rosacea:     { keywords: ["retinol", "aha", "bha", "ipl", "microneedling", "peel"], warning: "⚠️ Con rosácea, evitar ácidos fuertes, retinol y tratamientos que generen calor. Consultar dermatólogo." },
  melasma:     { keywords: ["ipl", "laser", "peel"], warning: "⚠️ Con melasma, IPL y peels pueden empeorar las manchas. Priorizar despigmentantes tópicos + SPF estricto." },
  acne:        { keywords: ["retinol"], warning: "El retinol puede irritar al inicio en acné activo. Empezar con concentración baja." },
  dermatitis:  { keywords: ["aha", "bha", "retinol", "vitamina c"], warning: "⚠️ Con dermatitis/eccema, usar activos con precaución. Priorizar la barrera cutánea." },
}

export function getConditionWarnings(conditions: string[], treatmentName: string): string[] {
  const nameLower = treatmentName.toLowerCase()
  const warnings: string[] = []
  for (const condition of conditions) {
    const condLower = condition.toLowerCase()
    for (const [key, { keywords, warning }] of Object.entries(CONDITION_WARNINGS)) {
      if (condLower.includes(key) && keywords.some(kw => nameLower.includes(kw))) {
        warnings.push(warning)
      }
    }
  }
  return warnings
}
