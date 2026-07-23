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
    <div style={{ minHeight: "100vh", background: "#0e0c12", fontFamily: "system-ui, -apple-system, sans-serif" }}>
      {/* Admin Navbar */}
      <nav style={{
        background: "rgba(14,12,18,0.85)",
        backdropFilter: "blur(12px)",
        borderBottom: "1px solid rgba(245,237,232,0.06)",
        padding: "0 24px",
        height: 56,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        position: "sticky",
        top: 0,
        zIndex: 50,
      }}>
        {/* Left: Logo */}
        <a href="/admin" style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          textDecoration: "none",
        }}>
          <svg width="22" height="22" viewBox="0 0 28 28" fill="none">
            <circle cx="14" cy="14" r="13" stroke="#e8a4b0" strokeWidth="1.5" />
            <circle cx="14" cy="14" r="7" stroke="#e8a4b0" strokeWidth="1" strokeDasharray="3 2" />
            <circle cx="14" cy="14" r="3" fill="#e8a4b0" />
          </svg>
          <span style={{
            fontFamily: "var(--font-fraunces, Georgia, serif)",
            fontSize: 15,
            fontWeight: 500,
            color: "rgba(245,237,232,0.85)",
            letterSpacing: "-0.02em",
          }}>
            InsideOutMed
          </span>
        </a>

        {/* Center: Nav links */}
        <div style={{ display: "flex", gap: 4, position: "absolute", left: "50%", transform: "translateX(-50%)" }}>
          <a href="/admin" style={{
            fontSize: 13,
            color: "rgba(245,237,232,0.5)",
            textDecoration: "none",
            padding: "6px 16px",
            borderRadius: 8,
            transition: "color 0.2s, background 0.2s",
          }}
            onMouseEnter={e => { e.currentTarget.style.color = "rgba(245,237,232,0.85)"; e.currentTarget.style.background = "rgba(245,237,232,0.04)" }}
            onMouseLeave={e => { e.currentTarget.style.color = "rgba(245,237,232,0.5)"; e.currentTarget.style.background = "transparent" }}
          >
            Dashboard
          </a>
          <a href="/admin/brain" style={{
            fontSize: 13,
            color: "rgba(245,237,232,0.5)",
            textDecoration: "none",
            padding: "6px 16px",
            borderRadius: 8,
            transition: "color 0.2s, background 0.2s",
          }}
            onMouseEnter={e => { e.currentTarget.style.color = "rgba(245,237,232,0.85)"; e.currentTarget.style.background = "rgba(245,237,232,0.04)" }}
            onMouseLeave={e => { e.currentTarget.style.color = "rgba(245,237,232,0.5)"; e.currentTarget.style.background = "transparent" }}
          >
            Brain
          </a>
        </div>

        {/* Right: Logout */}
        <button
          onClick={handleLogout}
          style={{
            fontSize: 12,
            color: "rgba(245,237,232,0.35)",
            background: "none",
            border: "1px solid rgba(245,237,232,0.08)",
            borderRadius: 8,
            padding: "6px 14px",
            cursor: "pointer",
            transition: "color 0.2s, border-color 0.2s",
          }}
          onMouseEnter={e => { e.currentTarget.style.color = "rgba(245,237,232,0.7)"; e.currentTarget.style.borderColor = "rgba(245,237,232,0.15)" }}
          onMouseLeave={e => { e.currentTarget.style.color = "rgba(245,237,232,0.35)"; e.currentTarget.style.borderColor = "rgba(245,237,232,0.08)" }}
        >
          Cerrar sesion
        </button>
      </nav>

      {/* Content */}
      <main style={{ maxWidth: 1200, margin: "0 auto", padding: "24px" }}>
        {children}
      </main>
    </div>
  )
}
