"use client"

import { useState, useEffect } from "react"

interface Paper {
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
}

interface Insight {
  title: string
  finding: string
  recommendation: string
  confidence: string
}

interface AnalyticsData {
  totalLeads: number
  totalScans: number
  avgScore: number
  avgApparentAge: number
  bioAvgs: Record<string, number>
  topWeaknesses: { key: string; displayValue: number }[]
  correlations: {
    stressInflammation: number | null
    sleepIssues: number
    sunExposure: number
  }
  funnelCounts: Record<string, number>
}

// Seed papers from legacy catalog
const SEED_PAPERS: Omit<Paper, "id">[] = [
  { title: "Daily SPF reduces photoaging by 24%", authors: "Hughes et al.", year: 2013, journal: "Ann Intern Med", doi: "", key_findings: "El uso diario de FPS redujo el fotoenvejecimiento un 24% en estudio controlado.", applicable_zones: ["piel", "frente", "mejillas"], applicable_treatments: ["Protector solar SPF 50"], tags: ["SPF", "fotoenvejecimiento"], full_citation: "Hughes et al., Ann Intern Med 2013" },
  { title: "Topical vitamin C increases collagen synthesis", authors: "Pinnell SR", year: 2001, journal: "Dermatol Surg", doi: "", key_findings: "La vitamina C topica aumenta la sintesis de colageno y protege del fotodano.", applicable_zones: ["piel", "mejillas"], applicable_treatments: ["Vitamina C 15-20% (AM)"], tags: ["vitamina C", "colageno", "antioxidante"], full_citation: "Pinnell, Dermatol Surg 2001" },
  { title: "Retinoids reduce wrinkles and increase collagen", authors: "Mukherjee S et al.", year: 2006, journal: "Clin Interv Aging", doi: "", key_findings: "Los retinoides reducen arrugas y aumentan colageno de forma comprobada.", applicable_zones: ["piel", "frente", "periocular", "labios"], applicable_treatments: ["Retinol 0.3% -> 1% (PM)"], tags: ["retinol", "anti-aging", "colageno"], full_citation: "Mukherjee, Clin Interv Aging 2006" },
  { title: "Collagen peptides improve skin elasticity", authors: "Proksch E et al.", year: 2014, journal: "Skin Pharmacol Physiol", doi: "", key_findings: "Peptidos de colageno mejoran elasticidad cutanea en estudio doble ciego.", applicable_zones: ["piel", "mandibula"], applicable_treatments: ["Colageno hidrolizado tipo I y III"], tags: ["colageno", "elasticidad", "suplemento"], full_citation: "Proksch, Skin Pharmacol Physiol 2014" },
  { title: "Niacinamide improves texture, pores and spots", authors: "Bissett DL", year: 2005, journal: "Dermatol Surg", doi: "", key_findings: "Niacinamida mejora textura, poros y manchas.", applicable_zones: ["piel", "mejillas"], applicable_treatments: ["Niacinamida 10%"], tags: ["niacinamida", "poros", "manchas"], full_citation: "Bissett, Dermatol Surg 2005" },
  { title: "Ceramides restore the skin barrier", authors: "Lynde CW", year: 2014, journal: "J Drugs Dermatol", doi: "", key_findings: "Las ceramidas restauran la barrera cutanea.", applicable_zones: ["piel"], applicable_treatments: ["Limpiador suave + hidratante con ceramidas"], tags: ["ceramidas", "barrera cutanea"], full_citation: "Lynde, J Drugs Dermatol 2014" },
  { title: "Caffeine reduces periorbital edema", authors: "Herman A et al.", year: 2013, journal: "Skin Pharmacol", doi: "", key_findings: "Cafeina vasoconstrictora reduce edema periorbital.", applicable_zones: ["periocular"], applicable_treatments: ["Contorno de ojos con cafeina + peptidos"], tags: ["cafeina", "ojeras", "hinchazon"], full_citation: "Herman, Skin Pharmacol 2013" },
  { title: "AHAs improve texture and firmness", authors: "Kornhauser A et al.", year: 2010, journal: "Clin Cosmet Investig Dermatol", doi: "", key_findings: "Los AHAs mejoran textura y firmeza de la piel.", applicable_zones: ["piel", "mejillas"], applicable_treatments: ["AHA/BHA exfoliacion quimica"], tags: ["AHA", "exfoliacion", "textura"], full_citation: "Kornhauser, Clin Cosmet Investig Dermatol 2010" },
  { title: "Matrixyl stimulates type I collagen", authors: "Robinson LR et al.", year: 2005, journal: "Int J Cosmet Sci", doi: "", key_findings: "Matrixyl estimula colageno tipo I.", applicable_zones: ["mandibula", "mejillas"], applicable_treatments: ["Serum de peptidos para firmeza"], tags: ["peptidos", "Matrixyl", "colageno"], full_citation: "Robinson, Int J Cosmet Sci 2005" },
  { title: "Red light improves collagen density and wrinkles", authors: "Wunsch A et al.", year: 2014, journal: "Photomed Laser Surg", doi: "", key_findings: "La luz roja mejora densidad de colageno y reduce arrugas.", applicable_zones: ["piel"], applicable_treatments: ["LED rojo terapeutico"], tags: ["LED", "fotobiomodulacion", "colageno"], full_citation: "Wunsch, Photomed Laser Surg 2014" },
  { title: "Botulinum toxin reduces dynamic lines reproducibly", authors: "Carruthers J et al.", year: 2004, journal: "Dermatol Surg", doi: "", key_findings: "La toxina botulinica reduce lineas dinamicas de forma reproducible.", applicable_zones: ["frente", "periocular"], applicable_treatments: ["Toxina botulinica (frente/glabela/patas de gallo)"], tags: ["botox", "lineas dinamicas", "preventivo"], full_citation: "Carruthers, Dermatol Surg 2004" },
  { title: "Astaxanthin improves wrinkles and elasticity", authors: "Tominaga K et al.", year: 2012, journal: "Acta Biochim Pol", doi: "", key_findings: "Astaxantina oral+topica mejora arrugas y elasticidad.", applicable_zones: ["piel", "mejillas"], applicable_treatments: ["Astaxantina 4-12 mg"], tags: ["astaxantina", "antioxidante", "elasticidad"], full_citation: "Tominaga, Acta Biochim Pol 2012" },
  { title: "Omega-3 protects from photodamage and inflammation", authors: "Pilkington SM", year: 2011, journal: "Exp Dermatol", doi: "", key_findings: "Omega-3 protege de fotodano e inflamacion.", applicable_zones: ["piel"], applicable_treatments: ["Omega-3 EPA/DHA"], tags: ["omega-3", "antiinflamatorio", "fotodano"], full_citation: "Pilkington, Exp Dermatol 2011" },
  { title: "PDRN topical: 47% less fine lines, 39% more elasticity", authors: "Review 2025", year: 2025, journal: "J Cosmet Dermatol", doi: "", key_findings: "PDRN topico: ~47% menos lineas finas, ~39% mas elasticidad y ~41% mas hidratacion a 8 semanas.", applicable_zones: ["piel", "periocular", "mejillas"], applicable_treatments: ["Serum de polinucleotidos (PDRN) topico"], tags: ["PDRN", "polinucleotidos", "regeneracion"], full_citation: "Revision sistematica 2025 (J Cosmet Dermatol)" },
  { title: "Bakuchiol comparable to retinol with less irritation", authors: "Dhaliwal S et al.", year: 2019, journal: "Br J Dermatol", doi: "", key_findings: "Bakuchiol comparable al retinol en arrugas y pigmentacion, con menos descamacion e irritacion.", applicable_zones: ["piel", "frente"], applicable_treatments: ["Bakuchiol (alternativa al retinol)"], tags: ["bakuchiol", "retinol alternativo"], full_citation: "Dhaliwal, Br J Dermatol 2019" },
  { title: "Rosemary oil comparable to minoxidil 2% at 6 months", authors: "Panahi Y et al.", year: 2015, journal: "Skinmed", doi: "", key_findings: "Aceite de romero comparable a minoxidil 2% a 6 meses en alopecia androgenetica, con menos picor.", applicable_zones: [], applicable_treatments: ["Aceite de romero (masaje en cuero cabelludo)"], tags: ["romero", "capilar", "minoxidil"], full_citation: "Panahi, Skinmed 2015 (RCT)" },
]

const ZONE_OPTIONS = ["piel", "frente", "periocular", "nariz", "labios", "mejillas", "mandibula", "cuello"]

const BIO_LABELS: Record<string, string> = {
  luminosity: "Luminosidad",
  hydration: "Hidratacion",
  uniformity: "Uniformidad",
  glycation: "Glicacion",
  inflammation: "Inflamacion",
  sunDamage: "Dano solar",
  vascularity: "Vascularidad",
}

const FUNNEL_LABELS: Record<string, string> = {
  started: "Iniciaron",
  quiz_complete: "Quiz completo",
  scan_started: "Scan iniciado",
  scan_complete: "Scan completo",
  contact_complete: "Contacto completo",
  results_viewed: "Resultados vistos",
  full_results_viewed: "Resultados full",
  plan_viewed: "Plan visto",
}

export default function BrainPage() {
  const [papers, setPapers] = useState<Paper[]>([])
  const [showAdd, setShowAdd] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [search, setSearch] = useState("")
  const [activeTab, setActiveTab] = useState<"papers" | "insights" | "patterns">("papers")
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [analyticsLoading, setAnalyticsLoading] = useState(false)
  const [aiInsights, setAiInsights] = useState<Insight[]>([])
  const [loadingInsights, setLoadingInsights] = useState(false)

  // Form state
  const [form, setForm] = useState({
    title: "", authors: "", year: 2025, journal: "", doi: "",
    key_findings: "", applicable_zones: [] as string[],
    applicable_treatments: [] as string[], tags: [] as string[],
    full_citation: "", tagInput: "",
    treatmentInput: "",
  })

  useEffect(() => {
    loadPapers()
  }, [])

  // Load analytics when switching to insights or patterns tab
  useEffect(() => {
    if ((activeTab === "insights" || activeTab === "patterns") && !analytics && !analyticsLoading) {
      loadAnalytics()
    }
  }, [activeTab])

  async function loadAnalytics() {
    setAnalyticsLoading(true)
    try {
      const res = await fetch("/api/admin/analytics")
      if (res.ok) {
        const data = await res.json()
        if (data.totalLeads > 0) {
          setAnalytics(data)
        }
      }
    } catch (err) {
      console.error("Failed to load analytics:", err)
    } finally {
      setAnalyticsLoading(false)
    }
  }

  async function generateInsights() {
    if (!analytics) return
    setLoadingInsights(true)
    try {
      const res = await fetch("/api/admin/ai-insights", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ analyticsData: analytics }),
      })
      if (res.ok) {
        const data = await res.json()
        setAiInsights(data.insights || [])
      }
    } catch (err) {
      console.error("Failed to generate insights:", err)
    } finally {
      setLoadingInsights(false)
    }
  }

  async function loadPapers() {
    try {
      const res = await fetch("/api/admin/brain")
      if (res.ok) {
        const data = await res.json()
        setPapers(data.papers || [])
        return
      }
    } catch {}
    // Fallback: use seed papers
    const stored = localStorage.getItem("iom_brain_papers")
    if (stored) {
      setPapers(JSON.parse(stored))
    } else {
      const seeded = SEED_PAPERS.map((p, i) => ({ ...p, id: `seed-${i}` }))
      setPapers(seeded)
      localStorage.setItem("iom_brain_papers", JSON.stringify(seeded))
    }
  }

  function savePaper() {
    const paper: Paper = {
      id: editId || `paper-${Date.now()}`,
      title: form.title,
      authors: form.authors,
      year: form.year,
      journal: form.journal,
      doi: form.doi,
      key_findings: form.key_findings,
      applicable_zones: form.applicable_zones,
      applicable_treatments: form.applicable_treatments,
      tags: form.tags,
      full_citation: form.full_citation,
    }

    const updated = editId
      ? papers.map(p => p.id === editId ? paper : p)
      : [...papers, paper]

    setPapers(updated)
    localStorage.setItem("iom_brain_papers", JSON.stringify(updated))

    // Try Supabase
    fetch("/api/admin/brain", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(paper),
    }).catch(() => {})

    resetForm()
  }

  function deletePaper(id: string) {
    const updated = papers.filter(p => p.id !== id)
    setPapers(updated)
    localStorage.setItem("iom_brain_papers", JSON.stringify(updated))
  }

  function editPaper(paper: Paper) {
    setEditId(paper.id)
    setForm({
      title: paper.title, authors: paper.authors, year: paper.year,
      journal: paper.journal, doi: paper.doi, key_findings: paper.key_findings,
      applicable_zones: paper.applicable_zones,
      applicable_treatments: paper.applicable_treatments,
      tags: paper.tags, full_citation: paper.full_citation,
      tagInput: "", treatmentInput: "",
    })
    setShowAdd(true)
  }

  function resetForm() {
    setShowAdd(false)
    setEditId(null)
    setForm({
      title: "", authors: "", year: 2025, journal: "", doi: "",
      key_findings: "", applicable_zones: [], applicable_treatments: [],
      tags: [], full_citation: "", tagInput: "", treatmentInput: "",
    })
  }

  const filtered = papers.filter(p => {
    if (!search) return true
    const q = search.toLowerCase()
    return p.title.toLowerCase().includes(q) || p.authors.toLowerCase().includes(q) ||
      p.key_findings.toLowerCase().includes(q) || p.tags.some(t => t.toLowerCase().includes(q))
  })

  const inputStyle = {
    width: "100%", padding: "10px 14px", borderRadius: 10,
    border: "1.5px solid #e5e2df", fontSize: 14, outline: "none",
    marginBottom: 10, fontFamily: "inherit",
  } as const

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 700, color: "#1a1520", marginBottom: 4 }}>Cerebro</h1>
          <p style={{ fontSize: 13, color: "#888" }}>{papers.length} papers en la base de conocimiento</p>
        </div>
        {activeTab === "papers" && (
          <button
            onClick={() => { resetForm(); setShowAdd(true) }}
            style={{
              padding: "10px 20px", background: "linear-gradient(135deg, #e8a4b0, #c97e8e)",
              border: "none", borderRadius: 10, color: "#fff", fontSize: 14, fontWeight: 600, cursor: "pointer",
            }}
          >
            + Agregar paper
          </button>
        )}
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 8, marginBottom: 24 }}>
        {(["papers", "insights", "patterns"] as const).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)} style={{
            padding: "8px 18px", borderRadius: 99, fontSize: 13, fontWeight: 600, cursor: "pointer",
            background: activeTab === tab ? "rgba(232,164,176,0.12)" : "rgba(245,237,232,0.04)",
            border: `1px solid ${activeTab === tab ? "rgba(232,164,176,0.3)" : "rgba(245,237,232,0.08)"}`,
            color: activeTab === tab ? "#e8a4b0" : "rgba(245,237,232,0.4)",
          }}>
            {tab === "papers" ? "Papers" : tab === "insights" ? "AI Insights" : "Patrones"}
          </button>
        ))}
      </div>

      {/* ===== PAPERS TAB ===== */}
      {activeTab === "papers" && (
        <>
          {/* Search */}
          <input
            type="text" placeholder="Buscar papers..." value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ ...inputStyle, maxWidth: 400, marginBottom: 20 }}
          />

          {/* Add/Edit form */}
          {showAdd && (
            <div style={{
              background: "#fff", borderRadius: 16, padding: 24, marginBottom: 20,
              boxShadow: "0 2px 12px rgba(0,0,0,0.04)", border: "1px solid #f0ede9",
            }}>
              <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16, color: "#1a1520" }}>
                {editId ? "Editar paper" : "Nuevo paper"}
              </h3>

              <input placeholder="Titulo del estudio" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} style={inputStyle} />

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
                <input placeholder="Autores" value={form.authors} onChange={e => setForm(f => ({ ...f, authors: e.target.value }))} style={inputStyle} />
                <input placeholder="Ano" type="number" value={form.year} onChange={e => setForm(f => ({ ...f, year: parseInt(e.target.value) || 2025 }))} style={inputStyle} />
                <input placeholder="Journal" value={form.journal} onChange={e => setForm(f => ({ ...f, journal: e.target.value }))} style={inputStyle} />
              </div>

              <input placeholder="DOI (opcional)" value={form.doi} onChange={e => setForm(f => ({ ...f, doi: e.target.value }))} style={inputStyle} />

              <textarea
                placeholder="Hallazgos clave (lo que se muestra al usuario)"
                value={form.key_findings}
                onChange={e => setForm(f => ({ ...f, key_findings: e.target.value }))}
                style={{ ...inputStyle, minHeight: 80, resize: "vertical" }}
              />

              <input placeholder="Cita completa" value={form.full_citation} onChange={e => setForm(f => ({ ...f, full_citation: e.target.value }))} style={inputStyle} />

              {/* Zones */}
              <div style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: "#888", marginBottom: 6 }}>Zonas aplicables</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {ZONE_OPTIONS.map(z => (
                    <button
                      key={z}
                      onClick={() => setForm(f => ({
                        ...f,
                        applicable_zones: f.applicable_zones.includes(z)
                          ? f.applicable_zones.filter(x => x !== z)
                          : [...f.applicable_zones, z]
                      }))}
                      style={{
                        padding: "5px 12px", borderRadius: 8, fontSize: 12,
                        border: `1px solid ${form.applicable_zones.includes(z) ? "#e8a4b0" : "#e5e2df"}`,
                        background: form.applicable_zones.includes(z) ? "#fdf2f4" : "#fff",
                        color: form.applicable_zones.includes(z) ? "#c97e8e" : "#666",
                        cursor: "pointer",
                      }}
                    >
                      {z}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tags */}
              <div style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: "#888", marginBottom: 6 }}>Tags</div>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 6 }}>
                  {form.tags.map(t => (
                    <span key={t} style={{ padding: "3px 10px", borderRadius: 6, background: "#f0ede9", fontSize: 11, display: "flex", alignItems: "center", gap: 4 }}>
                      {t}
                      <button onClick={() => setForm(f => ({ ...f, tags: f.tags.filter(x => x !== t) }))} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 14, color: "#888", padding: 0 }}>x</button>
                    </span>
                  ))}
                </div>
                <input
                  placeholder="Agregar tag + Enter"
                  value={form.tagInput}
                  onChange={e => setForm(f => ({ ...f, tagInput: e.target.value }))}
                  onKeyDown={e => {
                    if (e.key === "Enter" && form.tagInput.trim()) {
                      setForm(f => ({ ...f, tags: [...f.tags, f.tagInput.trim()], tagInput: "" }))
                    }
                  }}
                  style={{ ...inputStyle, maxWidth: 200 }}
                />
              </div>

              {/* Treatments */}
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: "#888", marginBottom: 6 }}>Tratamientos aplicables</div>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 6 }}>
                  {form.applicable_treatments.map(t => (
                    <span key={t} style={{ padding: "3px 10px", borderRadius: 6, background: "#f0ede9", fontSize: 11, display: "flex", alignItems: "center", gap: 4 }}>
                      {t}
                      <button onClick={() => setForm(f => ({ ...f, applicable_treatments: f.applicable_treatments.filter(x => x !== t) }))} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 14, color: "#888", padding: 0 }}>x</button>
                    </span>
                  ))}
                </div>
                <input
                  placeholder="Nombre del tratamiento + Enter"
                  value={form.treatmentInput}
                  onChange={e => setForm(f => ({ ...f, treatmentInput: e.target.value }))}
                  onKeyDown={e => {
                    if (e.key === "Enter" && form.treatmentInput.trim()) {
                      setForm(f => ({ ...f, applicable_treatments: [...f.applicable_treatments, f.treatmentInput.trim()], treatmentInput: "" }))
                    }
                  }}
                  style={{ ...inputStyle, maxWidth: 300 }}
                />
              </div>

              <div style={{ display: "flex", gap: 10 }}>
                <button onClick={savePaper} style={{
                  padding: "10px 24px", background: "#22c55e", border: "none", borderRadius: 10,
                  color: "#fff", fontSize: 14, fontWeight: 600, cursor: "pointer",
                }}>
                  {editId ? "Guardar cambios" : "Agregar paper"}
                </button>
                <button onClick={resetForm} style={{
                  padding: "10px 24px", background: "#f0ede9", border: "none", borderRadius: 10,
                  color: "#666", fontSize: 14, cursor: "pointer",
                }}>
                  Cancelar
                </button>
              </div>
            </div>
          )}

          {/* Papers list */}
          <div style={{ display: "grid", gap: 12 }}>
            {filtered.map(paper => (
              <div key={paper.id} style={{
                background: "#fff", borderRadius: 14, padding: "18px 20px",
                boxShadow: "0 1px 6px rgba(0,0,0,0.03)", border: "1px solid #f0ede9",
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div style={{ flex: 1 }}>
                    <h3 style={{ fontSize: 14, fontWeight: 600, color: "#1a1520", marginBottom: 4 }}>{paper.title}</h3>
                    <p style={{ fontSize: 12, color: "#888", marginBottom: 6 }}>
                      {paper.authors} -- {paper.year} -- {paper.journal}
                    </p>
                    <p style={{ fontSize: 13, color: "#444", lineHeight: 1.5, marginBottom: 8 }}>{paper.key_findings}</p>
                    <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                      {paper.applicable_zones.map(z => (
                        <span key={z} style={{ padding: "2px 8px", borderRadius: 6, background: "#fdf2f4", color: "#c97e8e", fontSize: 10, fontWeight: 600 }}>{z}</span>
                      ))}
                      {paper.tags.map(t => (
                        <span key={t} style={{ padding: "2px 8px", borderRadius: 6, background: "#f0ede9", color: "#888", fontSize: 10 }}>{t}</span>
                      ))}
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 6, flexShrink: 0, marginLeft: 12 }}>
                    <button onClick={() => editPaper(paper)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 12, color: "#888" }}>Editar</button>
                    <button onClick={() => deletePaper(paper.id)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 12, color: "#ef4444" }}>Eliminar</button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {filtered.length === 0 && (
            <div style={{ padding: 40, textAlign: "center", color: "#888" }}>
              {papers.length === 0 ? "No hay papers. Los papers del seed se cargaran automaticamente." : "Sin resultados para esa busqueda."}
            </div>
          )}
        </>
      )}

      {/* ===== AI INSIGHTS TAB ===== */}
      {activeTab === "insights" && (
        <div>
          {analyticsLoading && (
            <div style={{ padding: 40, textAlign: "center", color: "#888" }}>
              Cargando datos de analytics...
            </div>
          )}

          {!analyticsLoading && !analytics && (
            <div style={{
              background: "#fff", borderRadius: 16, padding: 32, textAlign: "center",
              border: "1px solid #f0ede9",
            }}>
              <div style={{ fontSize: 40, marginBottom: 12, opacity: 0.3 }}>||</div>
              <h3 style={{ fontSize: 16, fontWeight: 600, color: "#1a1520", marginBottom: 8 }}>Sin datos de analytics</h3>
              <p style={{ fontSize: 13, color: "#888", marginBottom: 16 }}>
                No se encontraron leads con datos de scan. Los insights se generan a partir de datos reales de usuarios.
              </p>
              <button
                onClick={loadAnalytics}
                style={{
                  padding: "8px 20px", background: "#f0ede9", border: "none", borderRadius: 10,
                  color: "#666", fontSize: 13, cursor: "pointer",
                }}
              >
                Reintentar
              </button>
            </div>
          )}

          {!analyticsLoading && analytics && (
            <>
              {/* Summary strip */}
              <div style={{
                display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 24,
              }}>
                {[
                  { label: "Total leads", value: analytics.totalLeads },
                  { label: "Con scan", value: analytics.totalScans },
                  { label: "Score promedio", value: `${analytics.avgScore}/100` },
                  { label: "Edad aparente prom.", value: `${analytics.avgApparentAge} a.` },
                ].map(stat => (
                  <div key={stat.label} style={{
                    background: "#fff", borderRadius: 12, padding: "14px 16px",
                    border: "1px solid #f0ede9", textAlign: "center",
                  }}>
                    <div style={{ fontSize: 22, fontWeight: 700, color: "#1a1520" }}>{stat.value}</div>
                    <div style={{ fontSize: 11, color: "#888", marginTop: 4 }}>{stat.label}</div>
                  </div>
                ))}
              </div>

              {/* Generate button */}
              <button
                onClick={generateInsights}
                disabled={loadingInsights}
                style={{
                  padding: "12px 28px",
                  background: loadingInsights
                    ? "rgba(232,164,176,0.3)"
                    : "linear-gradient(135deg, #e8a4b0, #c97e8e)",
                  border: "none", borderRadius: 12, color: "#fff", fontSize: 14,
                  fontWeight: 600, cursor: loadingInsights ? "wait" : "pointer",
                  marginBottom: 24, width: "100%",
                }}
              >
                {loadingInsights ? "Generando insights con IA..." : "Generar insights con IA"}
              </button>

              {/* Insights cards */}
              {aiInsights.length > 0 && (
                <div style={{ display: "grid", gap: 12 }}>
                  {aiInsights.map((insight, i) => (
                    <div key={i} style={{
                      background: "#fff", borderRadius: 14, padding: "18px 20px",
                      boxShadow: "0 1px 6px rgba(0,0,0,0.03)", border: "1px solid #f0ede9",
                    }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                        <h3 style={{ fontSize: 14, fontWeight: 600, color: "#1a1520" }}>{insight.title}</h3>
                        <span style={{
                          padding: "2px 10px", borderRadius: 99, fontSize: 10, fontWeight: 600,
                          background: insight.confidence === "alta" ? "#dcfce7" : insight.confidence === "media" ? "#fef9c3" : "#f0ede9",
                          color: insight.confidence === "alta" ? "#16a34a" : insight.confidence === "media" ? "#ca8a04" : "#888",
                        }}>
                          {insight.confidence}
                        </span>
                      </div>
                      <p style={{ fontSize: 13, color: "#444", lineHeight: 1.5, marginBottom: 8 }}>
                        {insight.finding}
                      </p>
                      <div style={{
                        background: "rgba(232,164,176,0.06)", borderRadius: 8, padding: "8px 12px",
                        borderLeft: "3px solid #e8a4b0",
                      }}>
                        <p style={{ fontSize: 12, color: "#666", lineHeight: 1.4 }}>
                          <span style={{ fontWeight: 600 }}>Recomendacion:</span> {insight.recommendation}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* ===== PATTERNS TAB ===== */}
      {activeTab === "patterns" && (
        <div>
          {analyticsLoading && (
            <div style={{ padding: 40, textAlign: "center", color: "#888" }}>
              Cargando datos...
            </div>
          )}

          {!analyticsLoading && !analytics && (
            <div style={{
              background: "#fff", borderRadius: 16, padding: 32, textAlign: "center",
              border: "1px solid #f0ede9",
            }}>
              <div style={{ fontSize: 40, marginBottom: 12, opacity: 0.3 }}>||</div>
              <h3 style={{ fontSize: 16, fontWeight: 600, color: "#1a1520", marginBottom: 8 }}>Sin datos de patrones</h3>
              <p style={{ fontSize: 13, color: "#888", marginBottom: 16 }}>
                Los patrones se calculan a partir de datos reales de leads con scan completado.
              </p>
              <button
                onClick={loadAnalytics}
                style={{
                  padding: "8px 20px", background: "#f0ede9", border: "none", borderRadius: 10,
                  color: "#666", fontSize: 13, cursor: "pointer",
                }}
              >
                Reintentar
              </button>
            </div>
          )}

          {!analyticsLoading && analytics && (
            <>
              {/* Average Score */}
              <div style={{
                background: "#fff", borderRadius: 14, padding: "18px 20px", marginBottom: 16,
                border: "1px solid #f0ede9",
              }}>
                <h3 style={{ fontSize: 14, fontWeight: 600, color: "#1a1520", marginBottom: 12 }}>Score promedio de salud facial</h3>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{
                    flex: 1, height: 24, borderRadius: 12, background: "#f0ede9", overflow: "hidden",
                  }}>
                    <div style={{
                      width: `${analytics.avgScore}%`, height: "100%", borderRadius: 12,
                      background: analytics.avgScore >= 70 ? "linear-gradient(90deg, #22c55e, #16a34a)" :
                        analytics.avgScore >= 40 ? "linear-gradient(90deg, #eab308, #ca8a04)" :
                        "linear-gradient(90deg, #ef4444, #dc2626)",
                      transition: "width 0.5s ease",
                    }} />
                  </div>
                  <span style={{ fontSize: 18, fontWeight: 700, color: "#1a1520", minWidth: 50 }}>
                    {analytics.avgScore}/100
                  </span>
                </div>
              </div>

              {/* Biomarker Averages */}
              <div style={{
                background: "#fff", borderRadius: 14, padding: "18px 20px", marginBottom: 16,
                border: "1px solid #f0ede9",
              }}>
                <h3 style={{ fontSize: 14, fontWeight: 600, color: "#1a1520", marginBottom: 16 }}>Biomarcadores promedio</h3>
                <div style={{ display: "grid", gap: 10 }}>
                  {Object.entries(analytics.bioAvgs).map(([key, value]) => {
                    const isInverse = ["glycation", "inflammation", "sunDamage", "vascularity"].includes(key)
                    const displayVal = isInverse ? 100 - value : value
                    return (
                      <div key={key}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                          <span style={{ fontSize: 12, color: "#666" }}>{BIO_LABELS[key] || key}</span>
                          <span style={{ fontSize: 12, fontWeight: 600, color: "#1a1520" }}>
                            {displayVal}/100 {isInverse ? "(invertido)" : ""}
                          </span>
                        </div>
                        <div style={{ height: 8, borderRadius: 4, background: "#f0ede9", overflow: "hidden" }}>
                          <div style={{
                            width: `${displayVal}%`, height: "100%", borderRadius: 4,
                            background: displayVal >= 70 ? "#22c55e" : displayVal >= 40 ? "#eab308" : "#ef4444",
                            transition: "width 0.5s ease",
                          }} />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Top 3 Weaknesses */}
              {analytics.topWeaknesses.length > 0 && (
                <div style={{
                  background: "#fff", borderRadius: 14, padding: "18px 20px", marginBottom: 16,
                  border: "1px solid #f0ede9",
                }}>
                  <h3 style={{ fontSize: 14, fontWeight: 600, color: "#1a1520", marginBottom: 12 }}>Top 3 areas mas debiles</h3>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
                    {analytics.topWeaknesses.map((w, i) => (
                      <div key={w.key} style={{
                        background: i === 0 ? "rgba(239,68,68,0.06)" : i === 1 ? "rgba(234,179,8,0.06)" : "rgba(245,237,232,0.5)",
                        borderRadius: 10, padding: "12px 14px", textAlign: "center",
                        border: `1px solid ${i === 0 ? "rgba(239,68,68,0.15)" : i === 1 ? "rgba(234,179,8,0.15)" : "#f0ede9"}`,
                      }}>
                        <div style={{ fontSize: 10, color: "#888", marginBottom: 4 }}>#{i + 1}</div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: "#1a1520" }}>{BIO_LABELS[w.key] || w.key}</div>
                        <div style={{ fontSize: 18, fontWeight: 700, color: i === 0 ? "#ef4444" : i === 1 ? "#ca8a04" : "#888", marginTop: 4 }}>
                          {w.displayValue}/100
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Lifestyle Correlations */}
              <div style={{
                background: "#fff", borderRadius: 14, padding: "18px 20px", marginBottom: 16,
                border: "1px solid #f0ede9",
              }}>
                <h3 style={{ fontSize: 14, fontWeight: 600, color: "#1a1520", marginBottom: 12 }}>Correlaciones de estilo de vida</h3>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
                  <div style={{
                    background: "rgba(232,164,176,0.06)", borderRadius: 10, padding: "14px",
                    border: "1px solid rgba(232,164,176,0.15)",
                  }}>
                    <div style={{ fontSize: 11, color: "#888", marginBottom: 6 }}>Estres alto con inflamacion</div>
                    <div style={{ fontSize: 20, fontWeight: 700, color: "#c97e8e" }}>
                      {analytics.correlations.stressInflammation !== null ? `${analytics.correlations.stressInflammation}%` : "N/A"}
                    </div>
                  </div>
                  <div style={{
                    background: "rgba(99,102,241,0.06)", borderRadius: 10, padding: "14px",
                    border: "1px solid rgba(99,102,241,0.15)",
                  }}>
                    <div style={{ fontSize: 11, color: "#888", marginBottom: 6 }}>Poco sueno reportado</div>
                    <div style={{ fontSize: 20, fontWeight: 700, color: "#6366f1" }}>
                      {analytics.correlations.sleepIssues}
                    </div>
                  </div>
                  <div style={{
                    background: "rgba(234,179,8,0.06)", borderRadius: 10, padding: "14px",
                    border: "1px solid rgba(234,179,8,0.15)",
                  }}>
                    <div style={{ fontSize: 11, color: "#888", marginBottom: 6 }}>Alta exposicion solar</div>
                    <div style={{ fontSize: 20, fontWeight: 700, color: "#ca8a04" }}>
                      {analytics.correlations.sunExposure}
                    </div>
                  </div>
                </div>
              </div>

              {/* Funnel Conversion */}
              <div style={{
                background: "#fff", borderRadius: 14, padding: "18px 20px",
                border: "1px solid #f0ede9",
              }}>
                <h3 style={{ fontSize: 14, fontWeight: 600, color: "#1a1520", marginBottom: 16 }}>Funnel de conversion</h3>
                <div style={{ display: "grid", gap: 8 }}>
                  {Object.entries(analytics.funnelCounts).map(([stage, count], i, arr) => {
                    const maxCount = arr[0]?.[1] as number || 1
                    const pct = Math.round((count / maxCount) * 100)
                    return (
                      <div key={stage}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                          <span style={{ fontSize: 12, color: "#666" }}>{FUNNEL_LABELS[stage] || stage}</span>
                          <span style={{ fontSize: 12, fontWeight: 600, color: "#1a1520" }}>{count} ({pct}%)</span>
                        </div>
                        <div style={{ height: 6, borderRadius: 3, background: "#f0ede9", overflow: "hidden" }}>
                          <div style={{
                            width: `${pct}%`, height: "100%", borderRadius: 3,
                            background: "linear-gradient(90deg, #e8a4b0, #c97e8e)",
                            transition: "width 0.5s ease",
                          }} />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}
