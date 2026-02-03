import '@/styles/globals.css'
import { LiveRegionProvider } from '@/components/A11y/LiveRegion'
import { SkipLink } from '@/components/A11y/SkipLink'

export const metadata = {
  title: 'Yeoskin Dashboard',
  description: 'Yeoskin Ops Admin Dashboard - Enterprise Grade',
  // Enhanced metadata for accessibility
  robots: 'index, follow',
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 5,
  },
  themeColor: '#FF6B9D',
}

export default function RootLayout({ children }) {
  return (
    <html lang="fr" className="scroll-smooth">
      <head>
        {/* Preconnect for performance */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
        {/* PWA manifest */}
        <link rel="manifest" href="/manifest.json" />
        {/* Apple touch icon */}
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
        {/* Theme color for mobile browsers */}
        <meta name="theme-color" content="#FF6B9D" />
      </head>
      <body className="font-sans antialiased bg-neutral-50 text-neutral-900">
        {/* Skip link for keyboard navigation - a11y */}
        <SkipLink targetId="main-content" />

        {/* Live regions for screen reader announcements - a11y */}
        <LiveRegionProvider>
          {children}
        </LiveRegionProvider>

        {/* Screen reader polite live region */}
        <div
          aria-live="polite"
          aria-atomic="true"
          className="sr-only"
          id="sr-polite"
        />

        {/* Screen reader assertive live region */}
        <div
          aria-live="assertive"
          aria-atomic="true"
          className="sr-only"
          id="sr-alert"
        />
      </body>
    </html>
  )
}
