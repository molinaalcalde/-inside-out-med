"use client"

import { useState, useEffect } from "react"
import {
  type Product, type Category, type Tier, type ReferralPartner,
  PROBLEM_OPTIONS, CATEGORY_OPTIONS, DEFAULT_AFFILIATE_TAG,
  DEFAULT_CATALOG, amazonUrl,
  loadCatalog, saveCatalog, loadReferrals, saveReferrals,
} from "@/lib/catalog"

// ── Paper types (keep existing) ──────────────────────────────────
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

type Tab = "products" | "papers" | "referrals"

export default function BrainPage() {
  const [tab, setTab] = useState<Tab>("products")

  // ── Papers state ──
  const [papers, setPapers] = useState<Paper[]>([])
  const [showAddPaper, setShowAddPaper] = useState(false)
  const [editPaperId, setEditPaperId] = useState<string | null>(null)
  const [paperSearch, setPaperSearch] = useState("")
  const [paperForm, setPaperForm] = useState({
    title: "", authors: "", year: 2025, journal: "", doi: "",
    key_findings: "", applicable_zones: [] as string[],
    applicable_treatments: [] as string[], tags: [] as string[],
    full_citation: "", tagInput: "", treatmentInput: "",
  })

  // ── Products state ──
  const [products, setProducts] = useState<Product[]>([])
  const [editProduct, setEditProduct] = useState<Product | null>(null)
  const [productSearch, setProductSearch] = useState("")
  const [productFilter, setProductFilter] = useState<Category | "all">("all")

  // ── Referrals state ──
  const [referrals, setReferrals] = useState<ReferralPartner[]>([])
  const [editReferral, setEditReferral] = useState<ReferralPartner | null>(null)

  useEffect(() => {
    loadPapersData()
    setProducts(loadCatalog())
    setReferrals(loadReferrals())
  }, [])

  // ── Paper functions ──
  async function loadPapersData() {
    try {
      const res = await fetch("/api/admin/brain")
      if (res.ok) {
        const data = await res.json()
        setPapers(data.papers || [])
        return
      }
    } catch {}
    const stored = localStorage.getItem("iom_brain_papers")
    if (stored) {
      setPapers(JSON.parse(stored))
    } else {
      const seeded = SEED_PAPERS.map((p, i) => ({ ...p, id: `seed-${i}` }))
      setPapers(seeded)
      localStorage.setItem("iom_brain_papers", JSON.stringify(seeded))
    }
  }

  function savePaperAction() {
    const paper: Paper = {
      id: editPaperId || `paper-${Date.now()}`,
      title: paperForm.title, authors: paperForm.authors, year: paperForm.year,
      journal: paperForm.journal, doi: paperForm.doi,
      key_findings: paperForm.key_findings,
      applicable_zones: paperForm.applicable_zones,
      applicable_treatments: paperForm.applicable_treatments,
      tags: paperForm.tags, full_citation: paperForm.full_citation,
    }
    const updated = editPaperId
      ? papers.map(p => p.id === editPaperId ? paper : p)
      : [...papers, paper]
    setPapers(updated)
    localStorage.setItem("iom_brain_papers", JSON.stringify(updated))
    fetch("/api/admin/brain", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(paper),
    }).catch(() => {})
    resetPaperForm()
  }

  function deletePaper(id: string) {
    const updated = papers.filter(p => p.id !== id)
    setPapers(updated)
    localStorage.setItem("iom_brain_papers", JSON.stringify(updated))
  }

  function startEditPaper(paper: Paper) {
    setEditPaperId(paper.id)
    setPaperForm({
      title: paper.title, authors: paper.authors, year: paper.year,
      journal: paper.journal, doi: paper.doi, key_findings: paper.key_findings,
      applicable_zones: paper.applicable_zones,
      applicable_treatments: paper.applicable_treatments,
      tags: paper.tags, full_citation: paper.full_citation,
      tagInput: "", treatmentInput: "",
    })
    setShowAddPaper(true)
  }

  function resetPaperForm() {
    setShowAddPaper(false)
    setEditPaperId(null)
    setPaperForm({
      title: "", authors: "", year: 2025, journal: "", doi: "",
      key_findings: "", applicable_zones: [], applicable_treatments: [],
      tags: [], full_citation: "", tagInput: "", treatmentInput: "",
    })
  }

  // ── Product functions ──
  function saveProduct(p: Product) {
    const updated = products.some(x => x.id === p.id)
      ? products.map(x => x.id === p.id ? p : x)
      : [...products, p]
    setProducts(updated)
    saveCatalog(updated)
    setEditProduct(null)
  }

  function deleteProduct(id: string) {
    const updated = products.filter(p => p.id !== id)
    setProducts(updated)
    saveCatalog(updated)
  }

  function resetCatalog() {
    setProducts(DEFAULT_CATALOG)
    saveCatalog(DEFAULT_CATALOG)
  }

  // ── Referral functions ──
  function saveReferral(r: ReferralPartner) {
    const updated = referrals.some(x => x.id === r.id)
      ? referrals.map(x => x.id === r.id ? r : x)
      : [...referrals, r]
    setReferrals(updated)
    saveReferrals(updated)
    setEditReferral(null)
  }

  function deleteReferral(id: string) {
    const updated = referrals.filter(r => r.id !== id)
    setReferrals(updated)
    saveReferrals(updated)
  }

  // ── Filter products ──
  const filteredProducts = products.filter(p => {
    if (productFilter !== "all" && p.category !== productFilter) return false
    if (!productSearch) return true
    const q = productSearch.toLowerCase()
    return p.name.toLowerCase().includes(q) || p.what.toLowerCase().includes(q) ||
      (p.problems || []).some(pr => pr.toLowerCase().includes(q))
  })

  const filteredPapers = papers.filter(p => {
    if (!paperSearch) return true
    const q = paperSearch.toLowerCase()
    return p.title.toLowerCase().includes(q) || p.authors.toLowerCase().includes(q) ||
      p.key_findings.toLowerCase().includes(q) || p.tags.some(t => t.toLowerCase().includes(q))
  })

  // ── Styles ──
  const S = {
    card: {
      background: "#fff", borderRadius: 14, border: "1px solid #f0ede9",
      boxShadow: "0 1px 4px rgba(0,0,0,0.03)",
    } as const,
    input: {
      width: "100%", padding: "10px 14px", borderRadius: 10,
      border: "1.5px solid #e5e2df", fontSize: 14, outline: "none",
      fontFamily: "inherit", color: "#1a1520",
      background: "#fff", transition: "border-color 0.15s",
    } as const,
    select: {
      padding: "10px 14px", borderRadius: 10,
      border: "1.5px solid #e5e2df", fontSize: 13, outline: "none",
      fontFamily: "inherit", color: "#1a1520",
      background: "#fff", cursor: "pointer", appearance: "none" as const,
      backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath d='M3 5l3 3 3-3' stroke='%23888' fill='none' stroke-width='1.5' stroke-linecap='round'/%3E%3C/svg%3E")`,
      backgroundRepeat: "no-repeat", backgroundPosition: "right 12px center",
      paddingRight: 32,
    } as const,
    label: {
      fontSize: 11, fontWeight: 600, color: "#888",
      letterSpacing: "0.04em", textTransform: "uppercase" as const,
      marginBottom: 6, display: "block" as const,
    } as const,
    btnPrimary: {
      padding: "10px 24px", background: "#22c55e", border: "none", borderRadius: 10,
      color: "#fff", fontSize: 14, fontWeight: 600, cursor: "pointer",
    } as const,
    btnSecondary: {
      padding: "10px 24px", background: "#f0ede9", border: "none", borderRadius: 10,
      color: "#666", fontSize: 14, cursor: "pointer",
    } as const,
    btnDanger: {
      padding: "6px 14px", background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.15)",
      borderRadius: 8, color: "#ef4444", fontSize: 12, cursor: "pointer",
    } as const,
    chip: (active: boolean) => ({
      padding: "5px 14px", borderRadius: 99, fontSize: 12, cursor: "pointer",
      border: `1px solid ${active ? "#e8a4b0" : "#e5e2df"}`,
      background: active ? "#fdf2f4" : "#fff",
      color: active ? "#c97e8e" : "#666",
      fontWeight: active ? 600 : 400,
      transition: "all 0.15s",
    } as const),
    tag: {
      display: "inline-flex", alignItems: "center", gap: 4,
      padding: "3px 10px", borderRadius: 6, background: "#f0ede9",
      fontSize: 11, color: "#666",
    } as const,
  }

  // ── Tab nav ──
  const tabs: { key: Tab; label: string; count: number }[] = [
    { key: "products", label: "Productos", count: products.length },
    { key: "papers", label: "Papers", count: papers.length },
    { key: "referrals", label: "Referidos", count: referrals.length },
  ]

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, color: "#1a1520" }}>Cerebro</h1>
      </div>
      <p style={{ fontSize: 13, color: "#888", marginBottom: 24 }}>
        {products.length} productos · {papers.length} papers · {referrals.length} referidos
      </p>

      {/* Tab nav */}
      <div style={{ display: "flex", gap: 4, marginBottom: 24, borderBottom: "1px solid #f0ede9", paddingBottom: 0 }}>
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            style={{
              padding: "10px 20px", fontSize: 13, fontWeight: 600, cursor: "pointer",
              border: "none", background: "none",
              color: tab === t.key ? "#1a1520" : "#888",
              borderBottom: tab === t.key ? "2px solid #e8a4b0" : "2px solid transparent",
              transition: "all 0.15s", marginBottom: -1,
            }}
          >
            {t.label} <span style={{ fontSize: 11, fontWeight: 400, color: "#aaa" }}>({t.count})</span>
          </button>
        ))}
      </div>

      {/* ═══════════ PRODUCTS TAB ═══════════ */}
      {tab === "products" && (
        <div>
          {/* Actions bar */}
          <div style={{ display: "flex", gap: 10, marginBottom: 20, flexWrap: "wrap", alignItems: "center" }}>
            <input
              type="text" placeholder="Buscar productos..."
              value={productSearch} onChange={e => setProductSearch(e.target.value)}
              style={{ ...S.input, maxWidth: 280, marginBottom: 0 }}
            />
            <select
              value={productFilter}
              onChange={e => setProductFilter(e.target.value as Category | "all")}
              style={{ ...S.select, minWidth: 140 }}
            >
              <option value="all">Todas las categorías</option>
              {CATEGORY_OPTIONS.map(c => (
                <option key={c.key} value={c.key}>{c.label}</option>
              ))}
            </select>
            <div style={{ flex: 1 }} />
            <button
              onClick={() => setEditProduct({
                id: `prod-${Date.now()}`, name: "", category: "skincare", tier: "free",
                minAge: 18, phase: 1, what: "", cost: "", freq: "", results: "",
                risk: "", evidence: "", problems: [],
              })}
              style={{
                padding: "10px 20px",
                background: "linear-gradient(135deg, #e8a4b0, #c97e8e)",
                border: "none", borderRadius: 10, color: "#fff",
                fontSize: 13, fontWeight: 600, cursor: "pointer",
              }}
            >
              + Nuevo producto
            </button>
            <button onClick={resetCatalog} style={{ ...S.btnSecondary, fontSize: 12, padding: "10px 14px" }}>
              Reset catálogo
            </button>
          </div>

          {/* Product editor modal */}
          {editProduct && (
            <ProductEditor
              product={editProduct}
              onSave={saveProduct}
              onCancel={() => setEditProduct(null)}
              S={S}
            />
          )}

          {/* Product grid */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: 14 }}>
            {filteredProducts.map(p => (
              <div key={p.id} style={{ ...S.card, padding: "18px 20px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6, flexWrap: "wrap" }}>
                      <span style={{
                        padding: "2px 8px", borderRadius: 6, fontSize: 10, fontWeight: 700,
                        textTransform: "uppercase", letterSpacing: "0.06em",
                        background: p.tier === "free" ? "#f0fdf4" : p.tier === "mid" ? "#fefce8" : "#fdf2f8",
                        color: p.tier === "free" ? "#16a34a" : p.tier === "mid" ? "#ca8a04" : "#db2777",
                      }}>
                        {p.tier}
                      </span>
                      <span style={{
                        padding: "2px 8px", borderRadius: 6, fontSize: 10, fontWeight: 600,
                        background: "#f5f3f1", color: "#888",
                      }}>
                        {p.category}
                      </span>
                      {p.timing && (
                        <span style={{
                          padding: "2px 8px", borderRadius: 6, fontSize: 10, fontWeight: 700,
                          background: p.timing === "AM" ? "#fffbeb" : "#f0fdf4",
                          color: p.timing === "AM" ? "#d97706" : "#16a34a",
                        }}>
                          {p.timing}
                        </span>
                      )}
                      <span style={{ fontSize: 10, color: "#aaa" }}>Fase {p.phase}</span>
                      {p.isNew && (
                        <span style={{
                          padding: "2px 8px", borderRadius: 6, fontSize: 10, fontWeight: 700,
                          background: "#eff6ff", color: "#2563eb",
                        }}>
                          NUEVO
                        </span>
                      )}
                    </div>
                    <h3 style={{ fontSize: 14, fontWeight: 600, color: "#1a1520", marginBottom: 4 }}>{p.name}</h3>
                    <p style={{ fontSize: 12, color: "#888", lineHeight: 1.5, marginBottom: 6 }}>
                      {p.what.length > 120 ? p.what.slice(0, 120) + "..." : p.what}
                    </p>
                    <div style={{ display: "flex", gap: 8, fontSize: 11, color: "#aaa", marginBottom: 8 }}>
                      <span>{p.cost}</span>
                      <span>·</span>
                      <span>{p.freq}</span>
                      <span>·</span>
                      <span>{p.minAge}+ años</span>
                    </div>
                  </div>
                </div>

                {/* Problem tags */}
                {p.problems && p.problems.length > 0 && (
                  <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginBottom: 10 }}>
                    {p.problems.map(pr => (
                      <span key={pr} style={{
                        padding: "2px 8px", borderRadius: 6,
                        background: "#fdf2f4", color: "#c97e8e",
                        fontSize: 10, fontWeight: 600,
                      }}>
                        {pr}
                      </span>
                    ))}
                  </div>
                )}

                {/* Amazon link preview */}
                {p.amazonQuery && (
                  <div style={{ fontSize: 11, color: "#16a34a", marginBottom: 10 }}>
                    <a
                      href={amazonUrl(p.amazonQuery)}
                      target="_blank" rel="noopener noreferrer"
                      style={{ color: "#16a34a", textDecoration: "none" }}
                    >
                      Ver en Amazon →
                    </a>
                  </div>
                )}

                {/* Actions */}
                <div style={{ display: "flex", gap: 8, borderTop: "1px solid #f5f3f1", paddingTop: 10 }}>
                  <button
                    onClick={() => setEditProduct({ ...p })}
                    style={{ background: "none", border: "none", cursor: "pointer", fontSize: 12, color: "#e8a4b0", fontWeight: 600 }}
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => deleteProduct(p.id)}
                    style={{ background: "none", border: "none", cursor: "pointer", fontSize: 12, color: "#ef4444" }}
                  >
                    Eliminar
                  </button>
                </div>
              </div>
            ))}
          </div>

          {filteredProducts.length === 0 && (
            <div style={{ padding: 40, textAlign: "center", color: "#888" }}>
              No hay productos que coincidan.
            </div>
          )}
        </div>
      )}

      {/* ═══════════ PAPERS TAB ═══════════ */}
      {tab === "papers" && (
        <div>
          <div style={{ display: "flex", gap: 10, marginBottom: 20, flexWrap: "wrap" }}>
            <input
              type="text" placeholder="Buscar papers..."
              value={paperSearch} onChange={e => setPaperSearch(e.target.value)}
              style={{ ...S.input, maxWidth: 400, marginBottom: 0 }}
            />
            <div style={{ flex: 1 }} />
            <button
              onClick={() => { resetPaperForm(); setShowAddPaper(true) }}
              style={{
                padding: "10px 20px",
                background: "linear-gradient(135deg, #e8a4b0, #c97e8e)",
                border: "none", borderRadius: 10, color: "#fff",
                fontSize: 13, fontWeight: 600, cursor: "pointer",
              }}
            >
              + Agregar paper
            </button>
          </div>

          {/* Paper form */}
          {showAddPaper && (
            <div style={{ ...S.card, padding: 24, marginBottom: 20 }}>
              <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16, color: "#1a1520" }}>
                {editPaperId ? "Editar paper" : "Nuevo paper"}
              </h3>
              <input placeholder="Título del estudio" value={paperForm.title}
                onChange={e => setPaperForm(f => ({ ...f, title: e.target.value }))}
                style={{ ...S.input, marginBottom: 10 }} />
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 10 }}>
                <input placeholder="Autores" value={paperForm.authors}
                  onChange={e => setPaperForm(f => ({ ...f, authors: e.target.value }))} style={S.input} />
                <input placeholder="Año" type="number" value={paperForm.year}
                  onChange={e => setPaperForm(f => ({ ...f, year: parseInt(e.target.value) || 2025 }))} style={S.input} />
                <input placeholder="Journal" value={paperForm.journal}
                  onChange={e => setPaperForm(f => ({ ...f, journal: e.target.value }))} style={S.input} />
              </div>
              <input placeholder="DOI (opcional)" value={paperForm.doi}
                onChange={e => setPaperForm(f => ({ ...f, doi: e.target.value }))}
                style={{ ...S.input, marginBottom: 10 }} />
              <textarea placeholder="Hallazgos clave" value={paperForm.key_findings}
                onChange={e => setPaperForm(f => ({ ...f, key_findings: e.target.value }))}
                style={{ ...S.input, minHeight: 80, resize: "vertical" as const, marginBottom: 10 }} />
              <input placeholder="Cita completa" value={paperForm.full_citation}
                onChange={e => setPaperForm(f => ({ ...f, full_citation: e.target.value }))}
                style={{ ...S.input, marginBottom: 12 }} />

              {/* Zones */}
              <div style={{ marginBottom: 12 }}>
                <label style={S.label}>Zonas aplicables</label>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {ZONE_OPTIONS.map(z => (
                    <button key={z} onClick={() => setPaperForm(f => ({
                      ...f,
                      applicable_zones: f.applicable_zones.includes(z)
                        ? f.applicable_zones.filter(x => x !== z)
                        : [...f.applicable_zones, z]
                    }))} style={S.chip(paperForm.applicable_zones.includes(z))}>
                      {z}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tags */}
              <div style={{ marginBottom: 12 }}>
                <label style={S.label}>Tags</label>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 6 }}>
                  {paperForm.tags.map(t => (
                    <span key={t} style={S.tag}>
                      {t}
                      <button onClick={() => setPaperForm(f => ({ ...f, tags: f.tags.filter(x => x !== t) }))}
                        style={{ background: "none", border: "none", cursor: "pointer", fontSize: 14, color: "#888", padding: 0 }}>×</button>
                    </span>
                  ))}
                </div>
                <input placeholder="Agregar tag + Enter" value={paperForm.tagInput}
                  onChange={e => setPaperForm(f => ({ ...f, tagInput: e.target.value }))}
                  onKeyDown={e => {
                    if (e.key === "Enter" && paperForm.tagInput.trim()) {
                      setPaperForm(f => ({ ...f, tags: [...f.tags, f.tagInput.trim()], tagInput: "" }))
                    }
                  }}
                  style={{ ...S.input, maxWidth: 200, marginBottom: 0 }} />
              </div>

              {/* Treatments */}
              <div style={{ marginBottom: 16 }}>
                <label style={S.label}>Tratamientos aplicables</label>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 6 }}>
                  {paperForm.applicable_treatments.map(t => (
                    <span key={t} style={S.tag}>
                      {t}
                      <button onClick={() => setPaperForm(f => ({ ...f, applicable_treatments: f.applicable_treatments.filter(x => x !== t) }))}
                        style={{ background: "none", border: "none", cursor: "pointer", fontSize: 14, color: "#888", padding: 0 }}>×</button>
                    </span>
                  ))}
                </div>
                <input placeholder="Nombre del tratamiento + Enter" value={paperForm.treatmentInput}
                  onChange={e => setPaperForm(f => ({ ...f, treatmentInput: e.target.value }))}
                  onKeyDown={e => {
                    if (e.key === "Enter" && paperForm.treatmentInput.trim()) {
                      setPaperForm(f => ({ ...f, applicable_treatments: [...f.applicable_treatments, f.treatmentInput.trim()], treatmentInput: "" }))
                    }
                  }}
                  style={{ ...S.input, maxWidth: 300, marginBottom: 0 }} />
              </div>

              <div style={{ display: "flex", gap: 10 }}>
                <button onClick={savePaperAction} style={S.btnPrimary}>
                  {editPaperId ? "Guardar cambios" : "Agregar paper"}
                </button>
                <button onClick={resetPaperForm} style={S.btnSecondary}>Cancelar</button>
              </div>
            </div>
          )}

          {/* Papers list */}
          <div style={{ display: "grid", gap: 12 }}>
            {filteredPapers.map(paper => (
              <div key={paper.id} style={{ ...S.card, padding: "18px 20px" }}>
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
                    <button onClick={() => startEditPaper(paper)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 12, color: "#e8a4b0", fontWeight: 600 }}>Editar</button>
                    <button onClick={() => deletePaper(paper.id)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 12, color: "#ef4444" }}>Eliminar</button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {filteredPapers.length === 0 && (
            <div style={{ padding: 40, textAlign: "center", color: "#888" }}>
              {papers.length === 0 ? "No hay papers." : "Sin resultados."}
            </div>
          )}
        </div>
      )}

      {/* ═══════════ REFERRALS TAB ═══════════ */}
      {tab === "referrals" && (
        <div>
          <div style={{ display: "flex", gap: 10, marginBottom: 20, flexWrap: "wrap" }}>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 13, color: "#666", lineHeight: 1.6 }}>
                Cada referido tiene un código único. Cuando alguien llega con <code style={{ background: "#f5f3f1", padding: "2px 6px", borderRadius: 4, fontSize: 12 }}>?ref=CÓDIGO</code> en la URL,
                los links de Amazon usan el tag de afiliado del referido. Tag por defecto: <strong>{DEFAULT_AFFILIATE_TAG}</strong>
              </p>
            </div>
            <button
              onClick={() => setEditReferral({
                id: `ref-${Date.now()}`, name: "", code: "", amazonTag: "",
                active: true, createdAt: new Date().toISOString(),
              })}
              style={{
                padding: "10px 20px",
                background: "linear-gradient(135deg, #e8a4b0, #c97e8e)",
                border: "none", borderRadius: 10, color: "#fff",
                fontSize: 13, fontWeight: 600, cursor: "pointer", alignSelf: "flex-start",
              }}
            >
              + Nuevo referido
            </button>
          </div>

          {/* Referral editor */}
          {editReferral && (
            <ReferralEditor
              referral={editReferral}
              onSave={saveReferral}
              onCancel={() => setEditReferral(null)}
              S={S}
            />
          )}

          {/* Referrals list */}
          <div style={{ display: "grid", gap: 12 }}>
            {referrals.map(r => (
              <div key={r.id} style={{ ...S.card, padding: "18px 20px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                    <div style={{
                      width: 40, height: 40, borderRadius: 10,
                      background: r.active ? "#f0fdf4" : "#fef2f2",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 18, fontWeight: 700,
                      color: r.active ? "#16a34a" : "#ef4444",
                    }}>
                      {r.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h3 style={{ fontSize: 14, fontWeight: 600, color: "#1a1520", marginBottom: 2 }}>{r.name}</h3>
                      <div style={{ display: "flex", gap: 12, fontSize: 12, color: "#888" }}>
                        <span>Código: <strong style={{ color: "#1a1520" }}>{r.code}</strong></span>
                        <span>Tag: <strong style={{ color: "#16a34a" }}>{r.amazonTag}</strong></span>
                        <span style={{ color: r.active ? "#16a34a" : "#ef4444" }}>
                          {r.active ? "Activo" : "Inactivo"}
                        </span>
                      </div>
                      <div style={{ fontSize: 11, color: "#aaa", marginTop: 4 }}>
                        Link: <code style={{ background: "#f5f3f1", padding: "1px 4px", borderRadius: 3 }}>
                          {typeof window !== "undefined" ? window.location.origin : ""}/?ref={r.code}
                        </code>
                      </div>
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button onClick={() => setEditReferral({ ...r })}
                      style={{ background: "none", border: "none", cursor: "pointer", fontSize: 12, color: "#e8a4b0", fontWeight: 600 }}>
                      Editar
                    </button>
                    <button onClick={() => deleteReferral(r.id)}
                      style={{ background: "none", border: "none", cursor: "pointer", fontSize: 12, color: "#ef4444" }}>
                      Eliminar
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {referrals.length === 0 && !editReferral && (
            <div style={{ padding: 40, textAlign: "center", color: "#888" }}>
              No hay referidos. Crea uno para generar links de afiliado personalizados.
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ── Product Editor Component ─────────────────────────────────────
function ProductEditor({ product, onSave, onCancel, S }: {
  product: Product
  onSave: (p: Product) => void
  onCancel: () => void
  S: Record<string, unknown>
}) {
  const [p, setP] = useState<Product>(product)
  const s = S as { input: React.CSSProperties; select: React.CSSProperties; label: React.CSSProperties; chip: (a: boolean) => React.CSSProperties; btnPrimary: React.CSSProperties; btnSecondary: React.CSSProperties; card: React.CSSProperties }

  const generatedUrl = p.amazonQuery ? amazonUrl(p.amazonQuery) : null

  return (
    <div style={{ ...s.card, padding: 28, marginBottom: 24 }}>
      <h3 style={{ fontSize: 18, fontWeight: 700, color: "#1a1520", marginBottom: 20 }}>
        {product.name ? `Editar: ${product.name}` : "Nuevo producto"}
      </h3>

      {/* Row 1: Name */}
      <div style={{ marginBottom: 14 }}>
        <label style={s.label}>Nombre del producto</label>
        <input value={p.name} onChange={e => setP(x => ({ ...x, name: e.target.value }))}
          placeholder="ej. Protector solar SPF 50" style={s.input} />
      </div>

      {/* Row 2: Category, Tier, Timing, Phase */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 12, marginBottom: 14 }}>
        <div>
          <label style={s.label}>Categoría</label>
          <select value={p.category} onChange={e => setP(x => ({ ...x, category: e.target.value as Category }))}
            style={{ ...s.select, width: "100%" }}>
            {CATEGORY_OPTIONS.map(c => <option key={c.key} value={c.key}>{c.label}</option>)}
          </select>
        </div>
        <div>
          <label style={s.label}>Tier</label>
          <select value={p.tier} onChange={e => setP(x => ({ ...x, tier: e.target.value as Tier }))}
            style={{ ...s.select, width: "100%" }}>
            <option value="free">Free</option>
            <option value="mid">Mid</option>
            <option value="premium">Premium</option>
          </select>
        </div>
        <div>
          <label style={s.label}>Timing</label>
          <select value={p.timing || ""} onChange={e => setP(x => ({ ...x, timing: (e.target.value || undefined) as "AM" | "PM" | undefined }))}
            style={{ ...s.select, width: "100%" }}>
            <option value="">Sin timing</option>
            <option value="AM">AM</option>
            <option value="PM">PM</option>
          </select>
        </div>
        <div>
          <label style={s.label}>Fase</label>
          <select value={p.phase} onChange={e => setP(x => ({ ...x, phase: parseInt(e.target.value) }))}
            style={{ ...s.select, width: "100%" }}>
            <option value={1}>Fase 1</option>
            <option value={2}>Fase 2</option>
            <option value={3}>Fase 3</option>
            <option value={4}>Fase 4</option>
          </select>
        </div>
      </div>

      {/* Row 3: Age, Cost */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
        <div>
          <label style={s.label}>Edad mínima</label>
          <input type="number" value={p.minAge} onChange={e => setP(x => ({ ...x, minAge: parseInt(e.target.value) || 18 }))}
            style={s.input} />
        </div>
        <div>
          <label style={s.label}>Costo</label>
          <input value={p.cost} onChange={e => setP(x => ({ ...x, cost: e.target.value }))}
            placeholder="ej. $8-20/mes" style={s.input} />
        </div>
      </div>

      {/* Row 4: Description */}
      <div style={{ marginBottom: 14 }}>
        <label style={s.label}>Descripción</label>
        <textarea value={p.what} onChange={e => setP(x => ({ ...x, what: e.target.value }))}
          placeholder="Qué es y cómo funciona..."
          style={{ ...s.input, minHeight: 80, resize: "vertical" as const }} />
      </div>

      {/* Row 5: Freq, Results */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
        <div>
          <label style={s.label}>Frecuencia</label>
          <input value={p.freq} onChange={e => setP(x => ({ ...x, freq: e.target.value }))}
            placeholder="ej. Diario AM" style={s.input} />
        </div>
        <div>
          <label style={s.label}>Resultados esperados</label>
          <input value={p.results} onChange={e => setP(x => ({ ...x, results: e.target.value }))}
            placeholder="ej. Menos manchas en 3-6 meses" style={s.input} />
        </div>
      </div>

      {/* Row 6: Risk */}
      <div style={{ marginBottom: 14 }}>
        <label style={s.label}>Precaución / riesgo</label>
        <input value={p.risk} onChange={e => setP(x => ({ ...x, risk: e.target.value }))}
          placeholder="ej. Elegir libre de fragancia si piel sensible" style={s.input} />
      </div>

      {/* Row 7: Evidence */}
      <div style={{ marginBottom: 14 }}>
        <label style={s.label}>Evidencia científica</label>
        <textarea value={p.evidence} onChange={e => setP(x => ({ ...x, evidence: e.target.value }))}
          placeholder="Referencia al paper que lo respalda..."
          style={{ ...s.input, minHeight: 60, resize: "vertical" as const }} />
      </div>

      {/* Row 8: Amazon query + generated link */}
      <div style={{ marginBottom: 14 }}>
        <label style={s.label}>Término de búsqueda Amazon</label>
        <input value={p.amazonQuery || ""} onChange={e => setP(x => ({ ...x, amazonQuery: e.target.value || undefined }))}
          placeholder="ej. protector solar SPF 50 facial" style={s.input} />
        {generatedUrl && (
          <div style={{ marginTop: 8, padding: "8px 12px", background: "#f0fdf4", borderRadius: 8, border: "1px solid #bbf7d0" }}>
            <span style={{ fontSize: 11, color: "#888" }}>Link generado: </span>
            <a href={generatedUrl} target="_blank" rel="noopener noreferrer"
              style={{ fontSize: 11, color: "#16a34a", wordBreak: "break-all" }}>
              {generatedUrl}
            </a>
          </div>
        )}
      </div>

      {/* Row 9: Problems */}
      <div style={{ marginBottom: 14 }}>
        <label style={s.label}>Problemas que aborda</label>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {PROBLEM_OPTIONS.map(pr => (
            <button key={pr} onClick={() => setP(x => ({
              ...x,
              problems: (x.problems || []).includes(pr)
                ? (x.problems || []).filter(z => z !== pr)
                : [...(x.problems || []), pr]
            }))} style={s.chip((p.problems || []).includes(pr))}>
              {pr}
            </button>
          ))}
        </div>
      </div>

      {/* Row 10: Flags */}
      <div style={{ display: "flex", gap: 20, marginBottom: 20 }}>
        {[
          { key: "always30" as const, label: "always30 (incluir si edad ≥ 30)" },
          { key: "fitzCaution" as const, label: "fitzCaution (precaución fototipos altos)" },
          { key: "isNew" as const, label: "isNew (marcar como nuevo)" },
        ].map(flag => (
          <label key={flag.key} style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: 13, color: "#444" }}>
            <input
              type="checkbox"
              checked={!!p[flag.key]}
              onChange={e => setP(x => ({ ...x, [flag.key]: e.target.checked }))}
              style={{ width: 16, height: 16, accentColor: "#e8a4b0" }}
            />
            {flag.label}
          </label>
        ))}
      </div>

      {/* Actions */}
      <div style={{ display: "flex", gap: 10 }}>
        <button onClick={() => onSave(p)} style={s.btnPrimary}>Guardar producto</button>
        <button onClick={onCancel} style={s.btnSecondary}>Cancelar</button>
      </div>
    </div>
  )
}

// ── Referral Editor Component ────────────────────────────────────
function ReferralEditor({ referral, onSave, onCancel, S }: {
  referral: ReferralPartner
  onSave: (r: ReferralPartner) => void
  onCancel: () => void
  S: Record<string, unknown>
}) {
  const [r, setR] = useState<ReferralPartner>(referral)
  const s = S as { input: React.CSSProperties; label: React.CSSProperties; btnPrimary: React.CSSProperties; btnSecondary: React.CSSProperties; card: React.CSSProperties }

  return (
    <div style={{ ...s.card, padding: 24, marginBottom: 20 }}>
      <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16, color: "#1a1520" }}>
        {referral.name ? `Editar: ${referral.name}` : "Nuevo referido"}
      </h3>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
        <div>
          <label style={s.label}>Nombre</label>
          <input value={r.name} onChange={e => setR(x => ({ ...x, name: e.target.value }))}
            placeholder="ej. Dr. García" style={s.input} />
        </div>
        <div>
          <label style={s.label}>Código (para URL)</label>
          <input value={r.code} onChange={e => setR(x => ({ ...x, code: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "") }))}
            placeholder="ej. dr-garcia" style={s.input} />
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
        <div>
          <label style={s.label}>Amazon Affiliate Tag</label>
          <input value={r.amazonTag} onChange={e => setR(x => ({ ...x, amazonTag: e.target.value }))}
            placeholder="ej. drgarcia-20" style={s.input} />
        </div>
        <div>
          <label style={s.label}>Estado</label>
          <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: 13, color: "#444", paddingTop: 10 }}>
            <input type="checkbox" checked={r.active}
              onChange={e => setR(x => ({ ...x, active: e.target.checked }))}
              style={{ width: 16, height: 16, accentColor: "#22c55e" }} />
            Activo
          </label>
        </div>
      </div>

      {r.code && (
        <div style={{ padding: "10px 14px", background: "#f5f3f1", borderRadius: 8, marginBottom: 16 }}>
          <span style={{ fontSize: 12, color: "#666" }}>URL de referido: </span>
          <code style={{ fontSize: 12, color: "#1a1520" }}>
            {typeof window !== "undefined" ? window.location.origin : ""}/?ref={r.code}
          </code>
        </div>
      )}

      <div style={{ display: "flex", gap: 10 }}>
        <button onClick={() => onSave(r)} style={s.btnPrimary}>Guardar referido</button>
        <button onClick={onCancel} style={s.btnSecondary}>Cancelar</button>
      </div>
    </div>
  )
}
