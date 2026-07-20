import type { Metadata } from "next"
import { Inter, Fraunces } from "next/font/google"
import "./globals.css"
import { SmoothScrollProvider } from "@/components/providers/smooth-scroll"
import { CursorGlow } from "@/components/providers/cursor-glow"
import { LanguageProvider } from "@/components/providers/language-provider"

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
})

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  display: "swap",
})

export const metadata: Metadata = {
  title: "InsideOutMed — ¿Qué edad aparentas? Descúbrelo gratis",
  description:
    "Descubre qué edad aparentas con un análisis facial de 7 biomarcadores y 9 zonas. Gratis, en 60 segundos, 100% privado.",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es" className={`${inter.variable} ${fraunces.variable}`}>
      <body>
        <LanguageProvider>
          <SmoothScrollProvider>
            <CursorGlow />
            {children}
          </SmoothScrollProvider>
        </LanguageProvider>
      </body>
    </html>
  )
}
