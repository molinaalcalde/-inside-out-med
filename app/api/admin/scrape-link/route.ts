import { NextResponse } from "next/server"

export async function POST(req: Request) {
  try {
    const { url } = await req.json()
    if (!url || typeof url !== "string") {
      return NextResponse.json({ error: "URL required" }, { status: 400 })
    }

    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml",
        "Accept-Language": "es-ES,es;q=0.9,en;q=0.8",
      },
      redirect: "follow",
    })

    if (!res.ok) {
      return NextResponse.json({ error: `HTTP ${res.status}` })
    }

    const html = await res.text()

    // Extract meta tags
    const meta = (name: string): string => {
      // Try og: first, then regular meta
      const ogMatch = html.match(new RegExp(`<meta[^>]*property=["']og:${name}["'][^>]*content=["']([^"']+)["']`, "i"))
        || html.match(new RegExp(`<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:${name}["']`, "i"))
      if (ogMatch) return ogMatch[1]

      const metaMatch = html.match(new RegExp(`<meta[^>]*name=["']${name}["'][^>]*content=["']([^"']+)["']`, "i"))
        || html.match(new RegExp(`<meta[^>]*content=["']([^"']+)["'][^>]*name=["']${name}["']`, "i"))
      if (metaMatch) return metaMatch[1]

      return ""
    }

    // Title: og:title > <title> > ""
    let title = meta("title")
    if (!title) {
      const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i)
      title = titleMatch ? titleMatch[1].trim() : ""
    }
    // Clean Amazon titles (remove " : Amazon.com" suffix)
    title = title.replace(/\s*[:\-|]\s*(Amazon\.com|Amazon\.com\.mx|Amazon).*$/i, "").trim()

    const description = meta("description")
    const image = meta("image")

    // Amazon-specific: try to extract price
    let price = ""
    // Look for price patterns in the HTML
    const pricePatterns = [
      /<span[^>]*class="[^"]*a-price-whole[^"]*"[^>]*>([^<]+)</i,
      /<span[^>]*id="priceblock_ourprice"[^>]*>([^<]+)</i,
      /<span[^>]*class="[^"]*price[^"]*"[^>]*>\s*\$?\s*([\d,.]+)/i,
      /product:price:amount[^>]*content=["']([^"']+)/i,
    ]
    for (const pat of pricePatterns) {
      const m = html.match(pat)
      if (m) {
        price = m[1].trim().replace(/[^\d.,]/g, "")
        if (price) {
          price = `$${price}`
          break
        }
      }
    }

    // Try to detect category from URL or content
    let category = ""
    const urlLower = url.toLowerCase()
    if (urlLower.includes("supplement") || urlLower.includes("vitamin") || urlLower.includes("capsul") || urlLower.includes("collagen")) {
      category = "supplements"
    } else if (urlLower.includes("serum") || urlLower.includes("cream") || urlLower.includes("sunscreen") || urlLower.includes("spf") || urlLower.includes("moistur") || urlLower.includes("cleanser") || urlLower.includes("skincare") || urlLower.includes("retinol")) {
      category = "skincare"
    }

    return NextResponse.json({
      name: decodeHTMLEntities(title),
      description: decodeHTMLEntities(description),
      image,
      price,
      category,
    })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}

function decodeHTMLEntities(text: string): string {
  return text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(parseInt(n)))
}
