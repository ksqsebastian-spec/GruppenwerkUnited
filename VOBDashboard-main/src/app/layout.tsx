import type { Metadata } from "next"
import localFont from "next/font/local"
import "./globals.css"
import { AppShell } from "@/components/layout/AppShell"
import { getCompanies, getMatchCountsByCompany } from "@/lib/queries"

const geist = localFont({
  src: [
    {
      path: '../../node_modules/next/dist/next-devtools/server/font/geist-latin.woff2',
      style: 'normal',
    },
    {
      path: '../../node_modules/next/dist/next-devtools/server/font/geist-latin-ext.woff2',
      style: 'normal',
    },
  ],
  variable: '--font-inter',
  display: 'swap',
})

const geistMono = localFont({
  src: '../../node_modules/next/dist/next-devtools/server/font/geist-mono-latin.woff2',
  variable: '--font-mono',
  display: 'swap',
})

export const metadata: Metadata = {
  title: "VOB Monitor — Gruppenwerk",
  description: "VOB Ausschreibungen Dashboard für Gruppenwerk Unternehmen",
}

export const revalidate = 300

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const [companies, matchCounts] = await Promise.all([
    getCompanies(),
    getMatchCountsByCompany(),
  ])

  return (
    <html lang="de" className={`h-full antialiased ${geist.variable} ${geistMono.variable}`}>
      <body className="min-h-full font-sans">
        <AppShell companies={companies} matchCounts={matchCounts}>
          {children}
        </AppShell>
      </body>
    </html>
  )
}
