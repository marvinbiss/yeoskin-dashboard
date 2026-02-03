/**
 * Password Reset Email Template
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

interface PasswordResetProps {
  userName: string
  resetLink: string
  expiresIn?: string
  ipAddress?: string
  userAgent?: string
}

export function PasswordResetEmail({
  userName,
  resetLink,
  expiresIn = '1 hour',
  ipAddress,
  userAgent,
}: PasswordResetProps) {
  return (
    <EmailLayout preview="Reset your Yeoskin password">
      <EmailCard>
        <EmailLogo />

        <h1>Reset Your Password</h1>

        <p style={{ textAlign: 'center' }}>
          Hi {userName}, we received a request to reset your password. Click the
          button below to choose a new password.
        </p>

        <EmailButton href={resetLink}>Reset Password</EmailButton>

        <p
          style={{
            textAlign: 'center',
            fontSize: '14px',
            color: '#9CA3AF',
          }}
        >
          This link expires in {expiresIn}
        </p>

        <EmailDivider />

        <p
          style={{
            fontSize: '14px',
            color: '#6B7280',
          }}
        >
          If you didn't request a password reset, you can safely ignore this
          email. Your password will remain unchanged.
        </p>

        {(ipAddress || userAgent) && (
          <div
            style={{
              marginTop: '24px',
              padding: '16px',
              background: '#F9FAFB',
              borderRadius: '8px',
              fontSize: '13px',
              color: '#6B7280',
            }}
          >
            <p style={{ fontWeight: 600, marginBottom: '8px', color: '#374151' }}>
              Request Details
            </p>
            {ipAddress && (
              <p style={{ margin: '4px 0' }}>IP Address: {ipAddress}</p>
            )}
            {userAgent && (
              <p style={{ margin: '4px 0' }}>Device: {userAgent}</p>
            )}
          </div>
        )}

        <p
          style={{
            marginTop: '24px',
            fontSize: '14px',
            color: '#6B7280',
          }}
        >
          For security, this request was received from a web browser. If you
          didn't make this request, please{' '}
          <a href="#" style={{ color: '#FF6B9D' }}>
            contact support
          </a>{' '}
          immediately.
        </p>
      </EmailCard>

      <EmailFooter />
    </EmailLayout>
  )
}

export default PasswordResetEmail
