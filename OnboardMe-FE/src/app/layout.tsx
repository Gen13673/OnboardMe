import type React from "react"
import type { Metadata } from "next"
import "./globals.css"
import ClientLayout from "./clientLayout"

export const metadata: Metadata = {
  title: "OnboardMe",
  description: "Onboarding application",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  )
}
