"use client"

import { useState, useEffect } from "react"

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [authed, setAuthed] = useState(false)
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")

  useEffect(() => {
    const stored = sessionStorage.getItem("iom_admin_auth")
    if (stored === "true") setAuthed(true)
  }, [])

  const handleLogin = () => {
    // Simple password gate — matches ADMIN_PASSWORD in .env.local
    if (password === "iom-admin-2026") {
      setAuthed(true)
      sessionStorage.setItem("iom_admin_auth", "true")
      setError("")
    } else {
      setError("Password incorrecto")
    }
  }

  if (!authed) {
    return (
      <div style={{
        minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
        background: "#faf7f5", fontFamily: "system-ui, sans-serif",
      }}>
        <div style={{
          background: "#fff", borderRadius: 20, padding: 40, maxWidth: 400, width: "100%",
          boxShadow: "0 8px 40px rgba(0,0,0,0.08)", textAlign: "center",
        }}>
          <h1 style={{ fontSize: 24, fontWeight: 600, marginBottom: 8, color: "#1a1520" }}>
            InsideOutMed Admin
          </h1>
          <p style={{ fontSize: 13, color: "#888", marginBottom: 28 }}>Ingresa el password de administrador</p>

          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter") handleLogin() }}
            placeholder="Password"
            autoFocus
            style={{
              width: "100%", padding: "14px 16px", borderRadius: 12,
              border: `1.5px solid ${error ? "#ef4444" : "#e5e2df"}`,
              fontSize: 15, outline: "none", marginBottom: 14,
              transition: "border-color 0.2s",
            }}
          />

          {error && <p style={{ fontSize: 12, color: "#ef4444", marginBottom: 10 }}>{error}</p>}

          <button
            onClick={handleLogin}
            style={{
              width: "100%", padding: "14px",
              background: "linear-gradient(135deg, #e8a4b0, #c97e8e)",
              border: "none", borderRadius: 12, color: "#fff",
              fontSize: 15, fontWeight: 600, cursor: "pointer",
            }}
          >
            Entrar
          </button>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: "100vh", background: "#faf7f5", fontFamily: "system-ui, sans-serif" }}>
      {/* Admin Navbar */}
      <nav style={{
        background: "#fff", borderBottom: "1px solid #eee", padding: "14px 24px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        position: "sticky", top: 0, zIndex: 50,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <a href="/admin" style={{ fontWeight: 700, fontSize: 16, color: "#1a1520", textDecoration: "none" }}>
            InsideOutMed Admin
          </a>
          <a href="/admin" style={{ fontSize: 13, color: "#888", textDecoration: "none" }}>Dashboard</a>
          <a href="/admin/brain" style={{ fontSize: 13, color: "#888", textDecoration: "none" }}>Cerebro</a>
        </div>
        <button
          onClick={() => { sessionStorage.removeItem("iom_admin_auth"); setAuthed(false) }}
          style={{ fontSize: 12, color: "#888", background: "none", border: "none", cursor: "pointer" }}
        >
          Cerrar sesión
        </button>
      </nav>

      {/* Content */}
      <main style={{ maxWidth: 1200, margin: "0 auto", padding: "24px" }}>
        {children}
      </main>
    </div>
  )
}
