/**
 * Welcome Email Template
 * Stripe/Nike level design
 */

import React from 'react'
import {
  EmailLayout,
  EmailCard,
  EmailLogo,
  EmailButton,
  EmailDivider,
  EmailFooter,
} from './base'

interface WelcomeEmailProps {
  userName: string
  dashboardUrl: string
  isCreator?: boolean
}

export function WelcomeEmail({
  userName,
  dashboardUrl,
  isCreator = false,
}: WelcomeEmailProps) {
  return (
    <EmailLayout preview={`Welcome to Yeoskin, ${userName}!`}>
      <EmailCard>
        <EmailLogo />

        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <h1 style={{ marginBottom: '16px' }}>
            Welcome to Yeoskin{isCreator ? ' Creator Program' : ''}
          </h1>
          <p style={{ margin: 0, textAlign: 'center' }}>
            Hi {userName}, we're thrilled to have you on board. Your account is
            ready to go!
          </p>
        </div>

        {isCreator ? (
          <>
            <div className="highlight">
              <h3
                style={{
                  fontSize: '14px',
                  fontWeight: 600,
                  color: '#6B7280',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  marginBottom: '16px',
                }}
              >
                Getting Started
              </h3>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  marginBottom: '16px',
                }}
              >
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    background: '#FF6B9D',
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 600,
                    fontSize: '14px',
                    marginRight: '16px',
                    flexShrink: 0,
                  }}
                >
                  1
                </div>
                <div>
                  <p style={{ fontWeight: 600, color: '#1A1A1A', marginBottom: '4px' }}>
                    Complete Your Profile
                  </p>
                  <p style={{ fontSize: '14px', color: '#6B7280', margin: 0 }}>
                    Add your photo, bio, and social links to personalize your page.
                  </p>
                </div>
              </div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  marginBottom: '16px',
                }}
              >
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    background: '#E8D4F0',
                    color: '#9333EA',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 600,
                    fontSize: '14px',
                    marginRight: '16px',
                    flexShrink: 0,
                  }}
                >
                  2
                </div>
                <div>
                  <p style={{ fontWeight: 600, color: '#1A1A1A', marginBottom: '4px' }}>
                    Explore Your Dashboard
                  </p>
                  <p style={{ fontSize: '14px', color: '#6B7280', margin: 0 }}>
                    Track your performance, earnings, and access exclusive content.
                  </p>
                </div>
              </div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                }}
              >
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    background: '#D1FAE5',
                    color: '#059669',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 600,
                    fontSize: '14px',
                    marginRight: '16px',
                    flexShrink: 0,
                  }}
                >
                  3
                </div>
                <div>
                  <p style={{ fontWeight: 600, color: '#1A1A1A', marginBottom: '4px' }}>
                    Start Sharing
                  </p>
                  <p style={{ fontSize: '14px', color: '#6B7280', margin: 0 }}>
                    Share your unique link and start earning commissions.
                  </p>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="highlight">
            <h3
              style={{
                fontSize: '14px',
                fontWeight: 600,
                color: '#6B7280',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                marginBottom: '16px',
              }}
            >
              What's Next?
            </h3>
            <ul
              style={{
                listStyle: 'none',
                fontSize: '15px',
                color: '#374151',
              }}
            >
              <li style={{ padding: '8px 0', display: 'flex', alignItems: 'center' }}>
                <span style={{ color: '#FF6B9D', marginRight: '12px' }}>✓</span>
                Browse our premium skincare collection
              </li>
              <li style={{ padding: '8px 0', display: 'flex', alignItems: 'center' }}>
                <span style={{ color: '#FF6B9D', marginRight: '12px' }}>✓</span>
                Get personalized recommendations
              </li>
              <li style={{ padding: '8px 0', display: 'flex', alignItems: 'center' }}>
                <span style={{ color: '#FF6B9D', marginRight: '12px' }}>✓</span>
                Enjoy exclusive member benefits
              </li>
            </ul>
          </div>
        )}

        <EmailButton href={dashboardUrl}>
          {isCreator ? 'Open Dashboard' : 'Start Exploring'}
        </EmailButton>

        <EmailDivider />

        <p
          style={{
            textAlign: 'center',
            fontSize: '14px',
            color: '#6B7280',
            marginBottom: 0,
          }}
        >
          Questions? Reply to this email or visit our{' '}
          <a href="#" style={{ color: '#FF6B9D' }}>
            Help Center
          </a>
          .
        </p>
      </EmailCard>

      <EmailFooter />
    </EmailLayout>
  )
}

export default WelcomeEmail
