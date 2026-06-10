import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'World Cup 2026 Predictions',
  description: 'Predict World Cup 2026 match scores with friends and family',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="antialiased text-gray-800">{children}</body>
    </html>
  )
}