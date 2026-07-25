"use client"

import { useState, useEffect, useCallback } from "react"

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [authed, setAuthed] = useState(false)
  const [checking, setChecking] = useState(true)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [submitting, setSubmitting] = useState(false)

  const checkAuth = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/auth", { credentials: "same-origin" })
      if (res.ok) {
        const data = await res.json()
        if (data.authenticated) {
          setAuthed(true)
        }
      }
    } catch {
      // Not authenticated
    } finally {
      setChecking(false)
    }
  }, [])

  useEffect(() => {
    checkAuth()
  }, [checkAuth])

  const handleLogin = async () => {
    if (submitting) return
    setSubmitting(true)
    setError("")

    try {
      const res = await fetch("/api/admin/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password }),
        credentials: "same-origin",
      })

      const data = await res.json()

      if (res.ok && data.success) {
        setAuthed(true)
        setError("")
      } else {
        setError(data.error || "Credenciales incorrectas")
      }
    } catch {
      setError("Error de conexion")
    } finally {
      setSubmitting(false)
    }
  }

  const handleLogout = async () => {
    try {
      await fetch("/api/admin/auth", {
        method: "DELETE",
        credentials: "same-origin",
      })
    } catch {
      // Ignore logout errors
    }
    setAuthed(false)
    setEmail("")
    setPassword("")
  }

  // Loading state
  if (checking) {
    return (
      <div style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#0e0c12",
      }}>
        <div style={{
          width: 32,
          height: 32,
          border: "2.5px solid rgba(232,164,176,0.15)",
          borderTopColor: "#e8a4b0",
          borderRadius: "50%",
          animation: "spin 0.8s linear infinite",
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      </div>
    )
  }

  // Login page
  if (!authed) {
    return (
      <div style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#0e0c12",
        fontFamily: "system-ui, -apple-system, sans-serif",
        padding: 24,
      }}>
        <div style={{
          background: "rgba(245,237,232,0.03)",
          border: "1px solid rgba(245,237,232,0.06)",
          borderRadius: 24,
          padding: "48px 40px 40px",
          maxWidth: 400,
          width: "100%",
          textAlign: "center",
        }}>
          {/* Logo */}
          <div style={{ marginBottom: 32 }}>
            <svg width="40" height="40" viewBox="0 0 28 28" fill="none" style={{ margin: "0 auto 16px", display: "block" }}>
              <circle cx="14" cy="14" r="13" stroke="#e8a4b0" strokeWidth="1.5" />
              <circle cx="14" cy="14" r="7" stroke="#e8a4b0" strokeWidth="1" strokeDasharray="3 2" />
              <circle cx="14" cy="14" r="3" fill="#e8a4b0" />
            </svg>
            <h1 style={{
              fontFamily: "var(--font-fraunces, Georgia, serif)",
              fontSize: 22,
              fontWeight: 400,
              color: "rgba(245,237,232,0.9)",
              letterSpacing: "-0.02em",
              marginBottom: 6,
            }}>
              Acceso administrativo
            </h1>
            <p style={{
              fontSize: 13,
              color: "rgba(245,237,232,0.3)",
              letterSpacing: "0.02em",
            }}>
              InsideOutMed
            </p>
          </div>

          {/* Email */}
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter") handleLogin() }}
            placeholder="Email"
            autoFocus
            autoComplete="email"
            style={{
              width: "100%",
              padding: "14px 16px",
              borderRadius: 12,
              border: `1px solid ${error ? "rgba(239,68,68,0.4)" : "rgba(245,237,232,0.08)"}`,
              background: "rgba(245,237,232,0.04)",
              color: "rgba(245,237,232,0.9)",
              fontSize: 15,
              outline: "none",
              marginBottom: 12,
              transition: "border-color 0.2s",
              boxSizing: "border-box",
            }}
          />

          {/* Password */}
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter") handleLogin() }}
            placeholder="Password"
            autoComplete="current-password"
            style={{
              width: "100%",
              padding: "14px 16px",
              borderRadius: 12,
              border: `1px solid ${error ? "rgba(239,68,68,0.4)" : "rgba(245,237,232,0.08)"}`,
              background: "rgba(245,237,232,0.04)",
              color: "rgba(245,237,232,0.9)",
              fontSize: 15,
              outline: "none",
              marginBottom: 16,
              transition: "border-color 0.2s",
              boxSizing: "border-box",
            }}
          />

          {/* Error */}
          {error && (
            <p style={{
              fontSize: 13,
              color: "#ef4444",
              marginBottom: 12,
              padding: "8px 12px",
              background: "rgba(239,68,68,0.06)",
              borderRadius: 8,
            }}>
              {error}
            </p>
          )}

          {/* Login button */}
          <button
            onClick={handleLogin}
            disabled={submitting || !email.trim() || !password}
            style={{
              width: "100%",
              padding: "14px",
              background: (submitting || !email.trim() || !password)
                ? "rgba(232,164,176,0.2)"
                : "linear-gradient(135deg, #e8a4b0, #c97e8e)",
              border: "none",
              borderRadius: 12,
              color: (submitting || !email.trim() || !password) ? "rgba(255,255,255,0.4)" : "#fff",
              fontSize: 15,
              fontWeight: 600,
              cursor: (submitting || !email.trim() || !password) ? "not-allowed" : "pointer",
              transition: "opacity 0.2s",
              letterSpacing: "0.01em",
            }}
          >
            {submitting ? "Verificando..." : "Entrar"}
          </button>
        </div>
      </div>
    )
  }

  // Authenticated admin shell
  return (
    <div style={{ minHeight: "100vh", background: "#0e0c12", fontFamily: "system-ui, -apple-system, sans-serif", color: "#f5ede8" }}>
      {/* Admin Top Bar */}
      <nav style={{
        background: "rgba(14,12,18,0.92)",
        backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)",
        borderBottom: "1px solid rgba(245,237,232,0.06)",
        padding: "0 16px",
        position: "sticky", top: 0, zIndex: 50,
      }}>
        {/* Top row: logo + logout */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", height: 52 }}>
          <a href="/admin" style={{ display: "flex", alignItems: "center", gap: 8, textDecoration: "none" }}>
            <svg width="20" height="20" viewBox="0 0 28 28" fill="none">
              <circle cx="14" cy="14" r="13" stroke="#e8a4b0" strokeWidth="1.5"/>
              <circle cx="14" cy="14" r="3" fill="#e8a4b0"/>
            </svg>
            <span style={{ fontFamily: "var(--font-fraunces, Georgia, serif)", fontSize: 14, fontWeight: 500, color: "rgba(245,237,232,0.85)" }}>
              Admin
            </span>
          </a>
          <button onClick={handleLogout} style={{
            fontSize: 11, color: "rgba(245,237,232,0.3)", background: "none",
            border: "none", cursor: "pointer", padding: "6px 0",
          }}>
            Salir
          </button>
        </div>
        {/* Tab bar: Dashboard / Brain */}
        <div style={{ display: "flex", gap: 0, borderTop: "1px solid rgba(245,237,232,0.04)" }}>
          {[
            { label: "Dashboard", href: "/admin", icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg> },
            { label: "Brain", href: "/admin/brain", icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><path d="M12 2a7 7 0 017 7c0 2-1 3.5-2.5 5S14 17 14 20h-4c0-3-1-3.5-2.5-6S6 11 6 9a7 7 0 017-7z"/></svg> },
          ].map(tab => (
            <a key={tab.href} href={tab.href} style={{
              flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
              padding: "12px 0", textDecoration: "none",
              fontSize: 12, fontWeight: 600, letterSpacing: "0.02em",
              color: typeof window !== "undefined" && window.location.pathname === tab.href ? "#e8a4b0" : "rgba(245,237,232,0.4)",
              borderBottom: typeof window !== "undefined" && window.location.pathname === tab.href ? "2px solid #e8a4b0" : "2px solid transparent",
              transition: "all 0.2s",
            }}>
              {tab.icon}
              {tab.label}
            </a>
          ))}
        </div>
      </nav>

      {/* Content */}
      <main style={{ maxWidth: 1200, margin: "0 auto", padding: "16px" }}>
        {children}
      </main>
    </div>
  )
}
