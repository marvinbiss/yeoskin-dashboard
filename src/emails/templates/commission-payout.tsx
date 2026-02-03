/**
 * Commission Payout Email Template
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

interface PayoutDetails {
  orderId: string
  productName: string
  orderAmount: number
  commissionRate: number
  commissionAmount: number
}

interface CommissionPayoutProps {
  creatorName: string
  totalAmount: number
  paymentMethod: string
  payoutDate: string
  payouts: PayoutDetails[]
  dashboardUrl: string
}

export function CommissionPayoutEmail({
  creatorName,
  totalAmount,
  paymentMethod,
  payoutDate,
  payouts,
  dashboardUrl,
}: CommissionPayoutProps) {
  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount)

  return (
    <EmailLayout preview={`You've earned ${formatCurrency(totalAmount)}!`}>
      <EmailCard>
        <EmailLogo />

        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div
            style={{
              width: '64px',
              height: '64px',
              background: 'linear-gradient(135deg, #D1FAE5 0%, #A7F3D0 100%)',
              borderRadius: '50%',
              margin: '0 auto 16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <span style={{ fontSize: '28px' }}>$</span>
          </div>
          <h1 style={{ marginBottom: '8px' }}>You've Been Paid!</h1>
          <p style={{ margin: 0, textAlign: 'center' }}>
            Great news, {creatorName}! Your commission payout is on its way.
          </p>
        </div>

        <div
          style={{
            textAlign: 'center',
            padding: '32px',
            background: 'linear-gradient(135deg, #FFF0F5 0%, #F5F0FF 100%)',
            borderRadius: '16px',
            marginBottom: '32px',
          }}
        >
          <p
            style={{
              fontSize: '14px',
              color: '#6B7280',
              textTransform: 'uppercase',
              letterSpacing: '1px',
              marginBottom: '8px',
            }}
          >
            Total Payout
          </p>
          <p
            style={{
              fontSize: '48px',
              fontWeight: 700,
              color: '#FF6B9D',
              margin: 0,
              lineHeight: 1,
            }}
          >
            {formatCurrency(totalAmount)}
          </p>
        </div>

        <div className="highlight" style={{ background: '#F9FAFB' }}>
          <div className="stat-row">
            <span className="stat-label">Payment Method</span>
            <span className="stat-value">{paymentMethod}</span>
          </div>
          <div className="stat-row">
            <span className="stat-label">Payout Date</span>
            <span className="stat-value">{payoutDate}</span>
          </div>
        </div>

        <h2
          style={{
            fontSize: '16px',
            fontWeight: 600,
            color: '#1A1A1A',
            marginBottom: '16px',
            marginTop: '32px',
          }}
        >
          Commission Breakdown
        </h2>

        <div
          style={{
            border: '1px solid #F3F4F6',
            borderRadius: '12px',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 80px 100px',
              padding: '12px 16px',
              background: '#F9FAFB',
              fontSize: '12px',
              fontWeight: 600,
              color: '#6B7280',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
            }}
          >
            <span>Product</span>
            <span style={{ textAlign: 'center' }}>Rate</span>
            <span style={{ textAlign: 'right' }}>Earned</span>
          </div>
          {payouts.map((payout, index) => (
            <div
              key={index}
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 80px 100px',
                padding: '16px',
                borderTop: '1px solid #F3F4F6',
                alignItems: 'center',
              }}
            >
              <div>
                <p style={{ fontWeight: 500, color: '#1A1A1A', marginBottom: '4px' }}>
                  {payout.productName}
                </p>
                <p style={{ fontSize: '13px', color: '#6B7280', margin: 0 }}>
                  Order: {payout.orderId}
                </p>
              </div>
              <span style={{ textAlign: 'center', color: '#6B7280' }}>
                {payout.commissionRate}%
              </span>
              <span
                style={{ textAlign: 'right', fontWeight: 600, color: '#059669' }}
              >
                +{formatCurrency(payout.commissionAmount)}
              </span>
            </div>
          ))}
        </div>

        <EmailButton href={dashboardUrl}>View Dashboard</EmailButton>

        <EmailDivider />

        <p
          style={{
            textAlign: 'center',
            fontSize: '14px',
            color: '#6B7280',
            marginBottom: 0,
          }}
        >
          Keep up the great work! The more you share, the more you earn.
        </p>
      </EmailCard>

      <EmailFooter />
    </EmailLayout>
  )
}

export default CommissionPayoutEmail
