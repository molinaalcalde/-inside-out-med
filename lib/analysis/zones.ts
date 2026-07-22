// ── Zone definitions with MediaPipe landmark indices ──────────

// Zones for pixel sampling (9 facial zones)
export const ZONES: Record<string, number[]> = {
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

// Pixel sampling points (from legacy PTS array)
export const SAMPLE_POINTS: [string, number, number?][] = [
  ['p151', 151], ['p67', 67], ['p297', 297],       // Forehead
  ['p8', 8], ['p168', 168],                         // Glabella
  ['cfL', 33, 0.32], ['cfR', 263, 0.32],           // Crow's feet
  ['p119', 119], ['p348', 348],                     // Under eyes
  ['p50', 50], ['p280', 280],                       // Cheeks
  ['p205', 205], ['p425', 425],                     // Nasolabial
  ['p164', 164], ['p57', 57], ['p287', 287],       // Perioral
  ['p172', 172], ['p397', 397],                     // Jaw/jowl
  ['p13', 13], ['p14', 14], ['p152', 152],         // Lip + chin
  ['p159', 159], ['p386', 386],                     // Lash area
]

// Symmetry landmark pairs (L/R)
export const SYMMETRY_PAIRS: [number, number][] = [
  [33, 263], [133, 362], [61, 291], [50, 280],
  [172, 397], [58, 288], [70, 300], [105, 334],
]

// Zone display metadata
export const ZONE_META: Record<string, { label: string; emoji: string; dotX: number; dotY: number }> = {
  forehead:    { label: "Frente",       emoji: "🟤", dotX: 50, dotY: 28 },
  periocularL: { label: "Ojo izq.",     emoji: "👁️", dotX: 62, dotY: 38 },
  periocularR: { label: "Ojo der.",     emoji: "👁️", dotX: 38, dotY: 38 },
  nose:        { label: "Nariz",        emoji: "👃", dotX: 50, dotY: 48 },
  cheekL:      { label: "Mejilla izq.", emoji: "😊", dotX: 72, dotY: 52 },
  cheekR:      { label: "Mejilla der.", emoji: "😊", dotX: 28, dotY: 52 },
  lips:        { label: "Labios",       emoji: "💋", dotX: 50, dotY: 60 },
  jaw:         { label: "Mandíbula",    emoji: "🦴", dotX: 50, dotY: 70 },
  neck:        { label: "Cuello",       emoji: "🧣", dotX: 50, dotY: 82 },
}

// Aggregated zone labels for the accordion results view
export const ACCORDION_ZONES: Record<string, { label: string; emoji: string; keys: string[] }> = {
  frente:     { label: "Frente",      emoji: "🟤", keys: ["forehead"] },
  periocular: { label: "Periocular",  emoji: "👁️", keys: ["periocularL", "periocularR"] },
  nariz:      { label: "Nariz",       emoji: "👃", keys: ["nose"] },
  labios:     { label: "Labios",      emoji: "💋", keys: ["lips"] },
  mejillas:   { label: "Mejillas",    emoji: "😊", keys: ["cheekL", "cheekR"] },
  mandibula:  { label: "Mandíbula",   emoji: "🦴", keys: ["jaw"] },
  cuello:     { label: "Cuello",      emoji: "🧣", keys: ["neck"] },
  piel:       { label: "Piel global", emoji: "✨", keys: [] },
}
