import type React from "react"
import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { ToastProvider } from "@/lib/toast-context"
import { ToastDisplay } from "@/components/toast-display"
import { ErrorBoundary } from "@/components/error-boundary"
import "./globals.css"

// <CHANGE> Added font configuration for Next.js 15
const _geist = Geist({ subsets: ["latin"] })
const _geistMono = Geist_Mono({ subsets: ["latin"] })

export const metadata: Metadata = {
  // <CHANGE> Updated metadata for PlateDetect app
  title: "PlateDetect - Car Plate Recognition",
  description: "Detect and record car plate numbers with AI-powered recognition",
  generator: "v0.app",
  icons: {
    icon: [
      {
        url: "/icon-light-32x32.png",
        media: "(prefers-color-scheme: light)",
      },
      {
        url: "/icon-dark-32x32.png",
        media: "(prefers-color-scheme: dark)",
      },
      {
        url: "/icon.svg",
        type: "image/svg+xml",
      },
    ],
    apple: "/apple-icon.png",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`font-sans antialiased`}>
        <ErrorBoundary>
          <ToastProvider>
            {children}
            <ToastDisplay />
          </ToastProvider>
        </ErrorBoundary>
        <Analytics />
      </body>
    </html>
  )
}

