// Funnel tracking — dual-write to localStorage + API

function getSessionId(): string {
  if (typeof window === "undefined") return ""
  let sid = sessionStorage.getItem("iom_session_id")
  if (!sid) {
    sid = `s_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
    sessionStorage.setItem("iom_session_id", sid)
  }
  ;(window as any).__iom_session = sid
  return sid
}

export function trackFunnelEvent(eventType: string, eventData?: Record<string, any>, email?: string) {
  const sessionId = getSessionId()
  // Save locally
  try {
    const events = JSON.parse(localStorage.getItem("iom_funnel") || "[]")
    events.push({ sessionId, eventType, eventData, timestamp: new Date().toISOString() })
    localStorage.setItem("iom_funnel", JSON.stringify(events))
  } catch {}
  // Save remotely (non-blocking)
  try {
    fetch("/api/funnel", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ session_id: sessionId, event_type: eventType, event_data: eventData, email }),
    }).catch(() => {})
  } catch {}
}

export function updateLead(data: Record<string, any>) {
  const sessionId = getSessionId()
  // Save locally
  try {
    const lead = JSON.parse(localStorage.getItem("iom_lead") || "{}")
    Object.assign(lead, data, { session_id: sessionId, updated_at: new Date().toISOString() })
    localStorage.setItem("iom_lead", JSON.stringify(lead))
  } catch {}
  // Save remotely (non-blocking)
  try {
    fetch("/api/lead", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ session_id: sessionId, ...data }),
    }).catch(() => {})
  } catch {}
}
