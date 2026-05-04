import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'WorldNow — Live Global News Map',
  description: 'Real-time world news visualised on an interactive map',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
