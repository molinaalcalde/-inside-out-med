// ── Funnel event tracking ─────────────────────────────────────

let _sessionId: string | null = null

function getSessionId(): string {
  if (_sessionId) return _sessionId
  if (typeof window === "undefined") return "server"

  const stored = sessionStorage.getItem("iom_session_id")
  if (stored) {
    _sessionId = stored
    return stored
  }

  const id = crypto.randomUUID()
  sessionStorage.setItem("iom_session_id", id)
  _sessionId = id
  return id
}

export async function trackFunnelEvent(
  eventType: string,
  eventData: Record<string, unknown> = {},
  email?: string,
) {
  try {
    const sessionId = getSessionId()

    // Save locally first (always works)
    const events = JSON.parse(localStorage.getItem("iom_funnel") || "[]")
    events.push({ session_id: sessionId, event_type: eventType, event_data: eventData, email, created_at: new Date().toISOString() })
    localStorage.setItem("iom_funnel", JSON.stringify(events))

    // Try to save to Supabase (non-blocking)
    fetch("/api/funnel", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ session_id: sessionId, event_type: eventType, event_data: eventData, email }),
    }).catch(() => { /* silent fail — local storage has it */ })
  } catch {
    // Silent fail
  }
}

// Also save/update the lead record
export async function updateLead(data: {
  name?: string
  age?: number
  email?: string
  phone?: string
  profileData?: Record<string, unknown>
  scanData?: unknown
  planData?: unknown
  funnelStage?: string
}) {
  try {
    const sessionId = getSessionId()

    // Save locally
    const existing = JSON.parse(localStorage.getItem("iom_lead") || "{}")
    const merged = { ...existing, ...data, session_id: sessionId, updated_at: new Date().toISOString() }
    localStorage.setItem("iom_lead", JSON.stringify(merged))

    // Try Supabase (non-blocking)
    fetch("/api/lead", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ session_id: sessionId, ...data }),
    }).catch(() => {})
  } catch {
    // Silent fail
  }
}
