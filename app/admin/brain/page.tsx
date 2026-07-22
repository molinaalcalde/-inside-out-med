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

// Seed papers from legacy catalog
const SEED_PAPERS: Omit<Paper, "id">[] = [
  { title: "Daily SPF reduces photoaging by 24%", authors: "Hughes et al.", year: 2013, journal: "Ann Intern Med", doi: "", key_findings: "El uso diario de FPS redujo el fotoenvejecimiento un 24% en estudio controlado.", applicable_zones: ["piel", "frente", "mejillas"], applicable_treatments: ["Protector solar SPF 50"], tags: ["SPF", "fotoenvejecimiento"], full_citation: "Hughes et al., Ann Intern Med 2013" },
  { title: "Topical vitamin C increases collagen synthesis", authors: "Pinnell SR", year: 2001, journal: "Dermatol Surg", doi: "", key_findings: "La vitamina C tópica aumenta la síntesis de colágeno y protege del fotodaño.", applicable_zones: ["piel", "mejillas"], applicable_treatments: ["Vitamina C 15–20% (AM)"], tags: ["vitamina C", "colágeno", "antioxidante"], full_citation: "Pinnell, Dermatol Surg 2001" },
  { title: "Retinoids reduce wrinkles and increase collagen", authors: "Mukherjee S et al.", year: 2006, journal: "Clin Interv Aging", doi: "", key_findings: "Los retinoides reducen arrugas y aumentan colágeno de forma comprobada.", applicable_zones: ["piel", "frente", "periocular", "labios"], applicable_treatments: ["Retinol 0.3% → 1% (PM)"], tags: ["retinol", "anti-aging", "colágeno"], full_citation: "Mukherjee, Clin Interv Aging 2006" },
  { title: "Collagen peptides improve skin elasticity", authors: "Proksch E et al.", year: 2014, journal: "Skin Pharmacol Physiol", doi: "", key_findings: "Péptidos de colágeno mejoran elasticidad cutánea en estudio doble ciego.", applicable_zones: ["piel", "mandibula"], applicable_treatments: ["Colágeno hidrolizado tipo I y III"], tags: ["colágeno", "elasticidad", "suplemento"], full_citation: "Proksch, Skin Pharmacol Physiol 2014" },
  { title: "Niacinamide improves texture, pores and spots", authors: "Bissett DL", year: 2005, journal: "Dermatol Surg", doi: "", key_findings: "Niacinamida mejora textura, poros y manchas.", applicable_zones: ["piel", "mejillas"], applicable_treatments: ["Niacinamida 10%"], tags: ["niacinamida", "poros", "manchas"], full_citation: "Bissett, Dermatol Surg 2005" },
  { title: "Ceramides restore the skin barrier", authors: "Lynde CW", year: 2014, journal: "J Drugs Dermatol", doi: "", key_findings: "Las ceramidas restauran la barrera cutánea.", applicable_zones: ["piel"], applicable_treatments: ["Limpiador suave + hidratante con ceramidas"], tags: ["ceramidas", "barrera cutánea"], full_citation: "Lynde, J Drugs Dermatol 2014" },
  { title: "Caffeine reduces periorbital edema", authors: "Herman A et al.", year: 2013, journal: "Skin Pharmacol", doi: "", key_findings: "Cafeína vasoconstrictora reduce edema periorbital.", applicable_zones: ["periocular"], applicable_treatments: ["Contorno de ojos con cafeína + péptidos"], tags: ["cafeína", "ojeras", "hinchazón"], full_citation: "Herman, Skin Pharmacol 2013" },
  { title: "AHAs improve texture and firmness", authors: "Kornhauser A et al.", year: 2010, journal: "Clin Cosmet Investig Dermatol", doi: "", key_findings: "Los AHAs mejoran textura y firmeza de la piel.", applicable_zones: ["piel", "mejillas"], applicable_treatments: ["AHA/BHA exfoliación química"], tags: ["AHA", "exfoliación", "textura"], full_citation: "Kornhauser, Clin Cosmet Investig Dermatol 2010" },
  { title: "Matrixyl stimulates type I collagen", authors: "Robinson LR et al.", year: 2005, journal: "Int J Cosmet Sci", doi: "", key_findings: "Matrixyl estimula colágeno tipo I.", applicable_zones: ["mandibula", "mejillas"], applicable_treatments: ["Sérum de péptidos para firmeza"], tags: ["péptidos", "Matrixyl", "colágeno"], full_citation: "Robinson, Int J Cosmet Sci 2005" },
  { title: "Red light improves collagen density and wrinkles", authors: "Wunsch A et al.", year: 2014, journal: "Photomed Laser Surg", doi: "", key_findings: "La luz roja mejora densidad de colágeno y reduce arrugas.", applicable_zones: ["piel"], applicable_treatments: ["LED rojo terapéutico"], tags: ["LED", "fotobiomodulación", "colágeno"], full_citation: "Wunsch, Photomed Laser Surg 2014" },
  { title: "Botulinum toxin reduces dynamic lines reproducibly", authors: "Carruthers J et al.", year: 2004, journal: "Dermatol Surg", doi: "", key_findings: "La toxina botulínica reduce líneas dinámicas de forma reproducible.", applicable_zones: ["frente", "periocular"], applicable_treatments: ["Toxina botulínica (frente/glabela/patas de gallo)"], tags: ["botox", "líneas dinámicas", "preventivo"], full_citation: "Carruthers, Dermatol Surg 2004" },
  { title: "Astaxanthin improves wrinkles and elasticity", authors: "Tominaga K et al.", year: 2012, journal: "Acta Biochim Pol", doi: "", key_findings: "Astaxantina oral+tópica mejora arrugas y elasticidad.", applicable_zones: ["piel", "mejillas"], applicable_treatments: ["Astaxantina 4–12 mg"], tags: ["astaxantina", "antioxidante", "elasticidad"], full_citation: "Tominaga, Acta Biochim Pol 2012" },
  { title: "Omega-3 protects from photodamage and inflammation", authors: "Pilkington SM", year: 2011, journal: "Exp Dermatol", doi: "", key_findings: "Omega-3 protege de fotodaño e inflamación.", applicable_zones: ["piel"], applicable_treatments: ["Omega-3 EPA/DHA"], tags: ["omega-3", "antiinflamatorio", "fotodaño"], full_citation: "Pilkington, Exp Dermatol 2011" },
  { title: "PDRN topical: 47% less fine lines, 39% more elasticity", authors: "Review 2025", year: 2025, journal: "J Cosmet Dermatol", doi: "", key_findings: "PDRN tópico: ~47% menos líneas finas, ~39% más elasticidad y ~41% más hidratación a 8 semanas.", applicable_zones: ["piel", "periocular", "mejillas"], applicable_treatments: ["Sérum de polinucleótidos (PDRN) tópico"], tags: ["PDRN", "polinucleótidos", "regeneración"], full_citation: "Revisión sistemática 2025 (J Cosmet Dermatol)" },
  { title: "Bakuchiol comparable to retinol with less irritation", authors: "Dhaliwal S et al.", year: 2019, journal: "Br J Dermatol", doi: "", key_findings: "Bakuchiol comparable al retinol en arrugas y pigmentación, con menos descamación e irritación.", applicable_zones: ["piel", "frente"], applicable_treatments: ["Bakuchiol (alternativa al retinol)"], tags: ["bakuchiol", "retinol alternativo"], full_citation: "Dhaliwal, Br J Dermatol 2019" },
  { title: "Rosemary oil comparable to minoxidil 2% at 6 months", authors: "Panahi Y et al.", year: 2015, journal: "Skinmed", doi: "", key_findings: "Aceite de romero comparable a minoxidil 2% a 6 meses en alopecia androgenética, con menos picor.", applicable_zones: [], applicable_treatments: ["Aceite de romero (masaje en cuero cabelludo)"], tags: ["romero", "capilar", "minoxidil"], full_citation: "Panahi, Skinmed 2015 (RCT)" },
]

const ZONE_OPTIONS = ["piel", "frente", "periocular", "nariz", "labios", "mejillas", "mandibula", "cuello"]

export default function BrainPage() {
  const [papers, setPapers] = useState<Paper[]>([])
  const [showAdd, setShowAdd] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [search, setSearch] = useState("")

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
        <button
          onClick={() => { resetForm(); setShowAdd(true) }}
          style={{
            padding: "10px 20px", background: "linear-gradient(135deg, #e8a4b0, #c97e8e)",
            border: "none", borderRadius: 10, color: "#fff", fontSize: 14, fontWeight: 600, cursor: "pointer",
          }}
        >
          + Agregar paper
        </button>
      </div>

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

          <input placeholder="Título del estudio" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} style={inputStyle} />

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
            <input placeholder="Autores" value={form.authors} onChange={e => setForm(f => ({ ...f, authors: e.target.value }))} style={inputStyle} />
            <input placeholder="Año" type="number" value={form.year} onChange={e => setForm(f => ({ ...f, year: parseInt(e.target.value) || 2025 }))} style={inputStyle} />
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
                  <button onClick={() => setForm(f => ({ ...f, tags: f.tags.filter(x => x !== t) }))} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 14, color: "#888", padding: 0 }}>×</button>
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
                  <button onClick={() => setForm(f => ({ ...f, applicable_treatments: f.applicable_treatments.filter(x => x !== t) }))} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 14, color: "#888", padding: 0 }}>×</button>
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
                  {paper.authors} · {paper.year} · {paper.journal}
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
          {papers.length === 0 ? "No hay papers. Los papers del seed se cargarán automáticamente." : "Sin resultados para esa búsqueda."}
        </div>
      )}
    </div>
  )
}
