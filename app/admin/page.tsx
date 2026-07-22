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
    zoneScores?: Record<string, number>
  } | null
  plan_data: unknown
  funnel_stage: string
  created_at: string
  updated_at: string
}

const STAGE_ORDER = ["started", "quiz_complete", "scan_started", "scan_complete", "contact_complete", "results_viewed", "plan_viewed", "plan_committed"]
const STAGE_LABELS: Record<string, string> = {
  started: "Inicio",
  quiz_complete: "Quiz",
  scan_started: "Escaneo",
  scan_complete: "Scan OK",
  contact_complete: "Contacto",
  results_viewed: "Resultados",
  plan_viewed: "Plan",
  plan_committed: "Comprometido",
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

      {/* Search */}
      <div style={{ marginBottom: 16 }}>
        <input
          type="text"
          placeholder="Buscar por nombre, email o teléfono..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          style={{
            width: "100%", maxWidth: 400, padding: "12px 16px", borderRadius: 12,
            border: "1.5px solid #e5e2df", fontSize: 14, outline: "none",
          }}
        />
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

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16, marginBottom: 20 }}>
            <div>
              <div style={{ fontSize: 10, color: "#888", letterSpacing: "0.05em", textTransform: "uppercase", marginBottom: 4 }}>Email</div>
              <div style={{ fontSize: 14, color: "#1a1520" }}>{selectedLead.email || "—"}</div>
            </div>
            <div>
              <div style={{ fontSize: 10, color: "#888", letterSpacing: "0.05em", textTransform: "uppercase", marginBottom: 4 }}>Teléfono</div>
              <div style={{ fontSize: 14, color: "#1a1520" }}>{selectedLead.phone || "—"}</div>
            </div>
            <div>
              <div style={{ fontSize: 10, color: "#888", letterSpacing: "0.05em", textTransform: "uppercase", marginBottom: 4 }}>Edad</div>
              <div style={{ fontSize: 14, color: "#1a1520" }}>{selectedLead.age || "—"}</div>
            </div>
          </div>

          {/* Profile data */}
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
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
                <div style={{ padding: "12px", background: "#faf7f5", borderRadius: 10, textAlign: "center" }}>
                  <div style={{ fontSize: 24, fontWeight: 700, color: "#1a1520" }}>{selectedLead.scan_data.overall || "—"}</div>
                  <div style={{ fontSize: 10, color: "#888" }}>Score global</div>
                </div>
                <div style={{ padding: "12px", background: "#faf7f5", borderRadius: 10, textAlign: "center" }}>
                  <div style={{ fontSize: 24, fontWeight: 700, color: "#e8a4b0" }}>{selectedLead.scan_data.ageApparent || "—"}</div>
                  <div style={{ fontSize: 10, color: "#888" }}>Edad visible</div>
                </div>
                {selectedLead.scan_data.zoneScores && (
                  <div style={{ padding: "12px", background: "#faf7f5", borderRadius: 10, textAlign: "center" }}>
                    <div style={{ fontSize: 24, fontWeight: 700, color: "#1a1520" }}>
                      {Object.keys(selectedLead.scan_data.zoneScores).length}
                    </div>
                    <div style={{ fontSize: 10, color: "#888" }}>Zonas</div>
                  </div>
                )}
              </div>

              {/* Zone scores */}
              {selectedLead.scan_data.zoneScores && (
                <div style={{ marginTop: 12 }}>
                  {Object.entries(selectedLead.scan_data.zoneScores).map(([zone, score]) => {
                    const barColor = (score as number) >= 75 ? "#22c55e" : (score as number) >= 55 ? "#eab308" : "#ef4444"
                    return (
                      <div key={zone} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                        <span style={{ fontSize: 11, color: "#888", width: 80, flexShrink: 0 }}>{zone}</span>
                        <div style={{ flex: 1, height: 6, borderRadius: 3, background: "#f0ede9" }}>
                          <div style={{ height: "100%", borderRadius: 3, background: barColor, width: `${score}%` }} />
                        </div>
                        <span style={{ fontSize: 12, fontWeight: 600, color: barColor, width: 30, textAlign: "right" }}>{score as number}</span>
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
