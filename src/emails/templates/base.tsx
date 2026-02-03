/**
 * Premium Email Base Template
 * Stripe/Nike level email design
 */

import React from 'react'

interface EmailLayoutProps {
  children: React.ReactNode
  preview?: string
}

export function EmailLayout({ children, preview }: EmailLayoutProps) {
  return (
    <html>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="color-scheme" content="light" />
        <meta name="supported-color-schemes" content="light" />
        {preview && (
          <title>{preview}</title>
        )}
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }

          body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            -webkit-font-smoothing: antialiased;
            background-color: #FAFAFA;
          }

          .email-container {
            max-width: 560px;
            margin: 0 auto;
            padding: 40px 20px;
          }

          .email-card {
            background: white;
            border-radius: 16px;
            padding: 48px;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
          }

          .logo {
            text-align: center;
            margin-bottom: 32px;
          }

          .logo-text {
            font-size: 24px;
            font-weight: 700;
            color: #FF6B9D;
            letter-spacing: -0.5px;
          }

          h1 {
            font-size: 24px;
            font-weight: 600;
            color: #1A1A1A;
            margin-bottom: 16px;
            text-align: center;
          }

          p {
            font-size: 16px;
            line-height: 1.6;
            color: #6B7280;
            margin-bottom: 24px;
          }

          .button {
            display: inline-block;
            padding: 14px 32px;
            background: linear-gradient(135deg, #FF6B9D 0%, #FF8EB3 100%);
            color: white;
            font-size: 16px;
            font-weight: 600;
            text-decoration: none;
            border-radius: 12px;
            text-align: center;
            transition: all 0.2s;
          }

          .button:hover {
            transform: translateY(-1px);
            box-shadow: 0 8px 24px rgba(255, 107, 157, 0.35);
          }

          .button-secondary {
            background: #F3F4F6;
            color: #374151;
          }

          .button-container {
            text-align: center;
            margin: 32px 0;
          }

          .divider {
            height: 1px;
            background: #F3F4F6;
            margin: 32px 0;
          }

          .footer {
            text-align: center;
            font-size: 14px;
            color: #9CA3AF;
            margin-top: 32px;
          }

          .footer a {
            color: #6B7280;
            text-decoration: none;
          }

          .footer a:hover {
            text-decoration: underline;
          }

          .highlight {
            background: linear-gradient(135deg, #FFF0F5 0%, #F5F0FF 100%);
            border-radius: 12px;
            padding: 24px;
            margin: 24px 0;
          }

          .stat-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 12px 0;
            border-bottom: 1px solid #F3F4F6;
          }

          .stat-row:last-child {
            border-bottom: none;
          }

          .stat-label {
            color: #6B7280;
            font-size: 14px;
          }

          .stat-value {
            color: #1A1A1A;
            font-weight: 600;
          }

          .code {
            font-family: 'SF Mono', Monaco, monospace;
            font-size: 32px;
            font-weight: 700;
            letter-spacing: 8px;
            color: #FF6B9D;
            text-align: center;
            padding: 24px;
            background: #FFF5F8;
            border-radius: 12px;
            margin: 24px 0;
          }

          .social-links {
            text-align: center;
            margin-top: 24px;
          }

          .social-links a {
            display: inline-block;
            margin: 0 8px;
          }
        `}</style>
      </head>
      <body>
        {preview && (
          <div style={{ display: 'none', maxHeight: 0, overflow: 'hidden' }}>
            {preview}
          </div>
        )}
        <div className="email-container">
          {children}
        </div>
      </body>
    </html>
  )
}

export function EmailCard({ children }: { children: React.ReactNode }) {
  return <div className="email-card">{children}</div>
}

export function EmailLogo() {
  return (
    <div className="logo">
      <span className="logo-text">Yeoskin</span>
    </div>
  )
}

export function EmailButton({
  href,
  children,
  variant = 'primary',
}: {
  href: string
  children: React.ReactNode
  variant?: 'primary' | 'secondary'
}) {
  return (
    <div className="button-container">
      <a
        href={href}
        className={`button ${variant === 'secondary' ? 'button-secondary' : ''}`}
      >
        {children}
      </a>
    </div>
  )
}

export function EmailDivider() {
  return <div className="divider" />
}

export function EmailFooter() {
  return (
    <div className="footer">
      <p style={{ marginBottom: '8px' }}>
        Yeoskin - Premium Creator Skincare
      </p>
      <p style={{ marginBottom: '16px', fontSize: '12px' }}>
        <a href="#">Unsubscribe</a> &middot;{' '}
        <a href="#">Privacy Policy</a> &middot;{' '}
        <a href="#">Terms of Service</a>
      </p>
      <p style={{ fontSize: '12px', color: '#D1D5DB' }}>
        &copy; {new Date().getFullYear()} Yeoskin. All rights reserved.
      </p>
    </div>
  )
}

export default EmailLayout
