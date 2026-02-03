/**
 * Creator Invitation Email Template
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

interface CreatorInvitationProps {
  creatorName: string
  inviterName: string
  brandName?: string
  inviteLink: string
  expiresIn?: string
}

export function CreatorInvitationEmail({
  creatorName,
  inviterName,
  brandName = 'Yeoskin',
  inviteLink,
  expiresIn = '7 days',
}: CreatorInvitationProps) {
  return (
    <EmailLayout preview={`${inviterName} invited you to join ${brandName}`}>
      <EmailCard>
        <EmailLogo />

        <h1>You're Invited</h1>

        <p style={{ textAlign: 'center' }}>
          Hi {creatorName}, <strong>{inviterName}</strong> has invited you to
          join {brandName}'s creator program. Accept this invitation to start
          your journey with us.
        </p>

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
            What you'll get
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
              Personalized creator dashboard
            </li>
            <li style={{ padding: '8px 0', display: 'flex', alignItems: 'center' }}>
              <span style={{ color: '#FF6B9D', marginRight: '12px' }}>✓</span>
              Exclusive product access
            </li>
            <li style={{ padding: '8px 0', display: 'flex', alignItems: 'center' }}>
              <span style={{ color: '#FF6B9D', marginRight: '12px' }}>✓</span>
              Performance analytics & insights
            </li>
            <li style={{ padding: '8px 0', display: 'flex', alignItems: 'center' }}>
              <span style={{ color: '#FF6B9D', marginRight: '12px' }}>✓</span>
              Commission on sales
            </li>
          </ul>
        </div>

        <EmailButton href={inviteLink}>Accept Invitation</EmailButton>

        <p
          style={{
            textAlign: 'center',
            fontSize: '14px',
            color: '#9CA3AF',
          }}
        >
          This invitation expires in {expiresIn}
        </p>

        <EmailDivider />

        <p
          style={{
            textAlign: 'center',
            fontSize: '14px',
            color: '#6B7280',
            marginBottom: 0,
          }}
        >
          If you didn't expect this invitation, you can safely ignore this email.
        </p>
      </EmailCard>

      <EmailFooter />
    </EmailLayout>
  )
}

export default CreatorInvitationEmail
