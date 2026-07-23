"use client"

import { useState, useEffect } from "react"

interface Lead {
  id: string
  session_id: string
  name: string | null
  age: number | null
  email: string | null
  phone: string | null
  profile_data: Record<string, unknown>
  scan_data: {
    overall?: number
    ageApparent?: number
    luminosity?: number
    hydration?: number
    uniformity?: number
    glycation?: number
    inflammation?: number
    sunDamage?: number
    vascularity?: number
    texture?: number
    wrinkleDepth?: number
    darkCircles?: number
    symmetry?: number
    zoneScores?: Record<string, number>
    [key: string]: unknown
  } | null
  plan_data: unknown
  funnel_stage: string
  created_at: string
  updated_at: string
}

const STAGE_ORDER = ["started", "quiz_complete", "scan_started", "scan_complete", "contact_complete", "results_viewed", "full_results_viewed", "plan_viewed", "plan_committed"]
const STAGE_LABELS: Record<string, string> = {
  started: "Inicio",
  quiz_complete: "Quiz",
  scan_started: "Escaneo",
  scan_complete: "Scan OK",
  contact_complete: "Contacto",
  results_viewed: "Resultados",
  full_results_viewed: "Full Results",
  plan_viewed: "Plan",
  plan_committed: "Comprometido",
}

const BIOMARKER_LABELS: Record<string, string> = {
  luminosity: "Luminosidad",
  hydration: "Hidratación",
  uniformity: "Uniformidad",
  glycation: "Glicación",
  inflammation: "Inflamación",
  sunDamage: "Daño solar",
  vascularity: "Vascularidad",
  texture: "Textura",
  wrinkleDepth: "Arrugas",
  darkCircles: "Ojeras",
  symmetry: "Simetría",
}

function getStageColor(stage: string) {
  const idx = STAGE_ORDER.indexOf(stage)
  if (idx >= 6) return "#22c55e"
  if (idx >= 4) return "#eab308"
  if (idx >= 2) return "#f97316"
  return "#ef4444"
}

export default function AdminDashboard() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null)

  useEffect(() => {
    loadLeads()
  }, [])

  async function loadLeads() {
    setLoading(true)
    try {
      // Try loading from Supabase API
      const res = await fetch("/api/admin/users")
      if (res.ok) {
        const data = await res.json()
        setLeads(data.leads || [])
      } else {
        // Fallback: load from localStorage (dev mode)
        loadFromLocal()
      }
    } catch {
      loadFromLocal()
    }
    setLoading(false)
  }

  function loadFromLocal() {
    // Read all localStorage entries that look like lead data
    const lead = localStorage.getItem("iom_lead")
    const funnel = localStorage.getItem("iom_funnel")
    const profile = localStorage.getItem("insideoutmed_profile")
    const scores = localStorage.getItem("insideoutmed_scores")

    const entries: Lead[] = []

    if (lead) {
      try {
        const d = JSON.parse(lead)
        entries.push({
          id: d.session_id || "local-1",
          session_id: d.session_id || "local-1",
          name: d.name || null,
          age: d.age || null,
          email: d.email || null,
          phone: d.phone || null,
          profile_data: d.profileData || {},
          scan_data: d.scanData || null,
          plan_data: d.planData || null,
          funnel_stage: d.funnelStage || "started",
          created_at: d.updated_at || new Date().toISOString(),
          updated_at: d.updated_at || new Date().toISOString(),
        })
      } catch {}
    }

    if (profile && !entries.length) {
      try {
        const p = JSON.parse(profile)
        const s = scores ? JSON.parse(scores) : null
        entries.push({
          id: "local-profile",
          session_id: "local-profile",
          name: p.name || null,
          age: parseInt(p.age) || null,
          email: p.email || null,
          phone: p.phone || null,
          profile_data: p,
          scan_data: s ? { overall: s.overall, ageApparent: s.ageApparent } : null,
          plan_data: null,
          funnel_stage: s ? "results_viewed" : "quiz_complete",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
      } catch {}
    }

    setLeads(entries)
  }

  const filtered = leads.filter(l => {
    if (!searchQuery) return true
    const q = searchQuery.toLowerCase()
    return (
      (l.name?.toLowerCase().includes(q)) ||
      (l.email?.toLowerCase().includes(q)) ||
      (l.phone?.includes(q))
    )
  })

  // Funnel stats
  const funnelStats = STAGE_ORDER.map(stage => {
    const count = leads.filter(l => STAGE_ORDER.indexOf(l.funnel_stage) >= STAGE_ORDER.indexOf(stage)).length
    return { stage, label: STAGE_LABELS[stage], count }
  })

  return (
    <div>
      <h1 style={{ fontSize: 28, fontWeight: 700, color: "#1a1520", marginBottom: 8 }}>Dashboard</h1>
      <p style={{ fontSize: 14, color: "#888", marginBottom: 32 }}>{leads.length} usuarios totales</p>

      {/* KPI Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 14, marginBottom: 32 }}>
        {[
          { label: "Total Leads", value: leads.length, color: "#e8a4b0" },
          { label: "Con escaneo", value: leads.filter(l => l.scan_data?.overall).length, color: "#7ecba1" },
          { label: "Conversión", value: leads.length > 0 ? Math.round(leads.filter(l => l.funnel_stage === "results_viewed" || l.funnel_stage === "plan_viewed" || l.funnel_stage === "plan_committed" || l.funnel_stage === "full_results_viewed").length / leads.length * 100) + "%" : "0%", color: "#d4af88" },
          { label: "Score promedio", value: (() => { const scored = leads.filter(l => l.scan_data?.overall); return scored.length > 0 ? Math.round(scored.reduce((s, l) => s + l.scan_data!.overall!, 0) / scored.length) : "—" })(), color: "#e8a4b0" },
        ].map((kpi, i) => (
          <div key={i} style={{ background: "rgba(245,237,232,0.04)", border: "1px solid rgba(245,237,232,0.08)", borderRadius: 14, padding: "20px 16px", textAlign: "center" }}>
            <p style={{ fontSize: 10, letterSpacing: "0.1em", color: "rgba(245,237,232,0.35)", textTransform: "uppercase", marginBottom: 8 }}>{kpi.label}</p>
            <p style={{ fontFamily: "var(--font-fraunces, serif)", fontSize: 28, fontWeight: 300, color: kpi.color }}>{kpi.value}</p>
          </div>
        ))}
      </div>

      {/* Funnel overview */}
      <div style={{
        background: "#fff", borderRadius: 16, padding: 24, marginBottom: 24,
        boxShadow: "0 2px 12px rgba(0,0,0,0.04)",
      }}>
        <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16, color: "#1a1520" }}>Funnel de conversión</h2>
        <div style={{ display: "flex", gap: 4, alignItems: "flex-end", height: 120 }}>
          {funnelStats.map(({ stage, label, count }, i) => {
            const maxCount = Math.max(1, leads.length)
            const height = Math.max(20, (count / maxCount) * 100)
            return (
              <div key={stage} style={{ flex: 1, textAlign: "center" }}>
                <div style={{ fontSize: 18, fontWeight: 700, color: "#1a1520", marginBottom: 4 }}>{count}</div>
                <div style={{
                  height: `${height}%`, minHeight: 8,
                  background: `linear-gradient(180deg, ${getStageColor(stage)}, ${getStageColor(stage)}88)`,
                  borderRadius: "6px 6px 0 0", transition: "height 0.5s",
                }} />
                <div style={{ fontSize: 9, color: "#888", marginTop: 6, letterSpacing: "0.02em" }}>{label}</div>
                {i < funnelStats.length - 1 && funnelStats[i].count > 0 && (
                  <div style={{ fontSize: 8, color: "#ccc", marginTop: 2 }}>
                    {Math.round((funnelStats[i + 1]?.count || 0) / funnelStats[i].count * 100)}%
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Search + Export */}
      <div style={{ marginBottom: 16, display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
        <input
          type="text"
          placeholder="Buscar por nombre, email o teléfono..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          style={{
            flex: 1, minWidth: 240, maxWidth: 400, padding: "12px 16px", borderRadius: 12,
            border: "1.5px solid #e5e2df", fontSize: 14, outline: "none",
          }}
        />
        <button
          onClick={() => {
            const headers = ["Nombre","Email","Teléfono","Edad","Score","Edad Aparente","Etapa","Fecha"]
            const rows = leads.map(l => [
              l.name || "", l.email || "", l.phone || "", l.age || "",
              l.scan_data?.overall || "", l.scan_data?.ageApparent || "",
              l.funnel_stage || "", l.created_at ? new Date(l.created_at).toLocaleDateString() : ""
            ])
            const csv = [headers, ...rows].map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n")
            const blob = new Blob([csv], { type: "text/csv" })
            const url = URL.createObjectURL(blob)
            const a = document.createElement("a"); a.href = url; a.download = `insideoutmed-leads-${new Date().toISOString().slice(0,10)}.csv`; a.click()
            URL.revokeObjectURL(url)
          }}
          style={{
            padding: "8px 16px", borderRadius: 10,
            background: "rgba(126,203,161,0.1)", border: "1px solid rgba(126,203,161,0.25)",
            color: "#7ecba1", fontSize: 12, fontWeight: 600, cursor: "pointer",
          }}
        >
          Exportar CSV
        </button>
      </div>

      {/* Users table */}
      <div style={{
        background: "#fff", borderRadius: 16, overflow: "hidden",
        boxShadow: "0 2px 12px rgba(0,0,0,0.04)",
      }}>
        {loading ? (
          <div style={{ padding: 40, textAlign: "center", color: "#888" }}>Cargando...</div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: 40, textAlign: "center", color: "#888" }}>
            {leads.length === 0 ? "Aún no hay usuarios. Cuando alguien complete el análisis, aparecerá aquí." : "Sin resultados"}
          </div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: "1px solid #f0ede9" }}>
                {["Nombre", "Email", "Edad", "Etapa", "Score", "Fecha"].map(h => (
                  <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontWeight: 600, color: "#888", fontSize: 11, letterSpacing: "0.05em", textTransform: "uppercase" }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(lead => (
                <tr
                  key={lead.id}
                  onClick={() => setSelectedLead(selectedLead?.id === lead.id ? null : lead)}
                  style={{
                    borderBottom: "1px solid #f8f5f2", cursor: "pointer",
                    background: selectedLead?.id === lead.id ? "#fdf8f5" : "transparent",
                    transition: "background 0.15s",
                  }}
                  onMouseEnter={e => { if (selectedLead?.id !== lead.id) e.currentTarget.style.background = "#fdfcfb" }}
                  onMouseLeave={e => { if (selectedLead?.id !== lead.id) e.currentTarget.style.background = "transparent" }}
                >
                  <td style={{ padding: "14px 16px", fontWeight: 500, color: "#1a1520" }}>{lead.name || "—"}</td>
                  <td style={{ padding: "14px 16px", color: "#666" }}>{lead.email || "—"}</td>
                  <td style={{ padding: "14px 16px", color: "#666" }}>{lead.age || "—"}</td>
                  <td style={{ padding: "14px 16px" }}>
                    <span style={{
                      display: "inline-block", padding: "3px 10px", borderRadius: 8,
                      fontSize: 11, fontWeight: 600,
                      background: `${getStageColor(lead.funnel_stage)}15`,
                      color: getStageColor(lead.funnel_stage),
                    }}>
                      {STAGE_LABELS[lead.funnel_stage] || lead.funnel_stage}
                    </span>
                  </td>
                  <td style={{ padding: "14px 16px", fontWeight: 600, color: "#1a1520" }}>
                    {lead.scan_data?.overall || "—"}
                  </td>
                  <td style={{ padding: "14px 16px", color: "#999", fontSize: 12 }}>
                    {new Date(lead.created_at).toLocaleDateString("es", { day: "numeric", month: "short" })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Selected lead detail panel */}
      {selectedLead && (
        <div style={{
          background: "#fff", borderRadius: 16, padding: 24, marginTop: 16,
          boxShadow: "0 2px 12px rgba(0,0,0,0.04)",
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
            <h2 style={{ fontSize: 18, fontWeight: 600, color: "#1a1520" }}>
              {selectedLead.name || "Usuario sin nombre"}
            </h2>
            <button onClick={() => setSelectedLead(null)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 20, color: "#ccc" }}>×</button>
          </div>

          {/* Profile info */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 16, marginBottom: 20 }}>
            {[
              { label: "Email", value: selectedLead.email },
              { label: "Teléfono", value: selectedLead.phone },
              { label: "Edad", value: selectedLead.age },
              { label: "Fitzpatrick", value: selectedLead.profile_data?.fitzpatrick != null ? `Tipo ${selectedLead.profile_data.fitzpatrick}` : null },
            ].map(({ label, value }) => (
              <div key={label}>
                <div style={{ fontSize: 10, color: "#888", letterSpacing: "0.05em", textTransform: "uppercase", marginBottom: 4 }}>{label}</div>
                <div style={{ fontSize: 14, color: "#1a1520" }}>{value != null ? String(value) : "—"}</div>
              </div>
            ))}
          </div>

          {/* Funnel stage with timestamp */}
          <div style={{ marginBottom: 20, padding: "12px 16px", background: "#faf7f5", borderRadius: 10, display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{
              display: "inline-block", padding: "4px 12px", borderRadius: 8,
              fontSize: 12, fontWeight: 600,
              background: `${getStageColor(selectedLead.funnel_stage)}15`,
              color: getStageColor(selectedLead.funnel_stage),
            }}>
              {STAGE_LABELS[selectedLead.funnel_stage] || selectedLead.funnel_stage}
            </span>
            <span style={{ fontSize: 12, color: "#999" }}>
              {new Date(selectedLead.updated_at).toLocaleString("es", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
            </span>
          </div>

          {/* Profile data (quiz) */}
          {selectedLead.profile_data && Object.keys(selectedLead.profile_data).length > 0 && (
            <div style={{ marginBottom: 20 }}>
              <h3 style={{ fontSize: 13, fontWeight: 600, color: "#888", marginBottom: 10, letterSpacing: "0.04em", textTransform: "uppercase" }}>Datos del quiz</h3>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                {Object.entries(selectedLead.profile_data).map(([key, val]) => (
                  <div key={key} style={{ padding: "8px 12px", background: "#faf7f5", borderRadius: 8 }}>
                    <span style={{ fontSize: 11, color: "#888" }}>{key}: </span>
                    <span style={{ fontSize: 12, fontWeight: 500, color: "#1a1520" }}>{String(val)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Scan results */}
          {selectedLead.scan_data && (
            <div>
              <h3 style={{ fontSize: 13, fontWeight: 600, color: "#888", marginBottom: 10, letterSpacing: "0.04em", textTransform: "uppercase" }}>Resultados del scan</h3>

              {/* Score + Age headline cards */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
                <div style={{ padding: "16px", background: "#faf7f5", borderRadius: 12, textAlign: "center" }}>
                  <div style={{ fontSize: 32, fontWeight: 700, color: "#1a1520" }}>{selectedLead.scan_data.overall ?? "—"}</div>
                  <div style={{ fontSize: 11, color: "#888", marginTop: 2 }}>Score global</div>
                </div>
                <div style={{ padding: "16px", background: "#faf7f5", borderRadius: 12, textAlign: "center" }}>
                  <div style={{ fontSize: 32, fontWeight: 700, color: "#e8a4b0" }}>{selectedLead.scan_data.ageApparent ?? "—"}</div>
                  <div style={{ fontSize: 11, color: "#888", marginTop: 2 }}>Edad aparente</div>
                </div>
              </div>

              {/* Biomarker bars */}
              {(() => {
                const biomarkerKeys = Object.keys(BIOMARKER_LABELS) as (keyof typeof BIOMARKER_LABELS)[]
                const activeBiomarkers = biomarkerKeys.filter(k => selectedLead.scan_data?.[k] != null)
                if (activeBiomarkers.length === 0) return null
                return (
                  <div style={{ marginBottom: 16 }}>
                    <h4 style={{ fontSize: 11, fontWeight: 600, color: "#aaa", marginBottom: 10, letterSpacing: "0.06em", textTransform: "uppercase" }}>Biomarcadores</h4>
                    {activeBiomarkers.map(key => {
                      const score = Number(selectedLead.scan_data![key])
                      const barColor = score >= 75 ? "#22c55e" : score >= 55 ? "#eab308" : "#ef4444"
                      return (
                        <div key={key} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                          <span style={{ fontSize: 12, color: "#666", width: 100, flexShrink: 0 }}>{BIOMARKER_LABELS[key]}</span>
                          <div style={{ flex: 1, height: 8, borderRadius: 4, background: "#f0ede9" }}>
                            <div style={{ height: "100%", borderRadius: 4, background: barColor, width: `${Math.min(score, 100)}%`, transition: "width 0.4s" }} />
                          </div>
                          <span style={{ fontSize: 13, fontWeight: 600, color: barColor, width: 32, textAlign: "right" }}>{score}</span>
                        </div>
                      )
                    })}
                  </div>
                )
              })()}

              {/* Zone scores */}
              {selectedLead.scan_data.zoneScores && Object.keys(selectedLead.scan_data.zoneScores).length > 0 && (
                <div>
                  <h4 style={{ fontSize: 11, fontWeight: 600, color: "#aaa", marginBottom: 10, letterSpacing: "0.06em", textTransform: "uppercase" }}>Zonas faciales</h4>
                  {Object.entries(selectedLead.scan_data.zoneScores).map(([zone, score]) => {
                    const s = score as number
                    const barColor = s >= 75 ? "#22c55e" : s >= 55 ? "#eab308" : "#ef4444"
                    return (
                      <div key={zone} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                        <span style={{ fontSize: 12, color: "#666", width: 100, flexShrink: 0 }}>{zone}</span>
                        <div style={{ flex: 1, height: 8, borderRadius: 4, background: "#f0ede9" }}>
                          <div style={{ height: "100%", borderRadius: 4, background: barColor, width: `${Math.min(s, 100)}%`, transition: "width 0.4s" }} />
                        </div>
                        <span style={{ fontSize: 13, fontWeight: 600, color: barColor, width: 32, textAlign: "right" }}>{s}</span>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
