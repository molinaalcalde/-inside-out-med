import { NextResponse } from "next/server"

export async function POST(req: Request) {
  try {
    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: "API key not configured" }, { status: 500 })
    }

    const { imageBase64, profile } = await req.json()
    if (!imageBase64) {
      return NextResponse.json({ error: "No image provided" }, { status: 400 })
    }

    // Extract base64 data (remove data:image/jpeg;base64, prefix if present)
    const base64Data = imageBase64.includes(",") ? imageBase64.split(",")[1] : imageBase64
    const mediaType = imageBase64.includes("png") ? "image/png" : "image/jpeg"

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 600,
        messages: [{
          role: "user",
          content: [
            {
              type: "image",
              source: {
                type: "base64",
                media_type: mediaType,
                data: base64Data,
              },
            },
            {
              type: "text",
              text: `Eres un dermatólogo analizando una foto facial de un paciente de ${profile?.age || "desconocida"} años, fototipo Fitzpatrick ${profile?.fitzpatrick || "III"}.

Analiza SOLO lo que puedes observar en la imagen. Sé preciso y conservador.

Detecta y evalúa:
1. ACNÉ: lesiones activas visibles (pápulas, pústulas, comedones abiertos/cerrados). Cuenta las que veas claramente.
2. MANCHAS: zonas de hiperpigmentación, manchas solares, melasma u otras discromías. Cuenta las distinguibles.
3. ROJEZ: zonas con eritema visible, posible rosácea o irritación. Evalúa intensidad.

Responde SOLO con un JSON válido, sin markdown ni explicaciones:
{"acne":{"count":0,"severity":"none","locations":[]},"spots":{"count":0,"severity":"none","locations":[]},"redness":{"intensity":"none","zones":[]},"summary":"","concerns":[]}`
            }
          ]
        }],
      }),
    })

    if (!response.ok) {
      const err = await response.text()
      console.error("Vision API error:", response.status, err)
      return NextResponse.json({ error: "Vision analysis failed" }, { status: 500 })
    }

    const data = await response.json()
    const text = data.content?.[0]?.text || "{}"

    // Parse JSON — handle potential markdown wrapping
    let results
    try {
      results = JSON.parse(text)
    } catch {
      const match = text.match(/\{[\s\S]*\}/)
      results = match ? JSON.parse(match[0]) : null
    }

    if (!results) {
      return NextResponse.json({ error: "Could not parse vision results" }, { status: 500 })
    }

    return NextResponse.json({ results })
  } catch (err) {
    console.error("Vision route error:", err)
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}
