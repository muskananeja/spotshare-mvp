import "leaflet/dist/leaflet.css"
import type { Metadata } from "next"
import "./globals.css"

export const metadata: Metadata = {
  title: "SpotShare MVP",
  description: "Best known parking options + last-mile confidence",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  )
}
