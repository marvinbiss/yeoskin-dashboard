/**
 * Order Confirmation Email Template
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

interface OrderItem {
  name: string
  variant?: string
  quantity: number
  price: number
  imageUrl?: string
}

interface OrderConfirmationProps {
  customerName: string
  orderNumber: string
  orderDate: string
  items: OrderItem[]
  subtotal: number
  shipping: number
  tax: number
  total: number
  shippingAddress: {
    line1: string
    line2?: string
    city: string
    state: string
    postalCode: string
    country: string
  }
  trackingUrl?: string
}

export function OrderConfirmationEmail({
  customerName,
  orderNumber,
  orderDate,
  items,
  subtotal,
  shipping,
  tax,
  total,
  shippingAddress,
  trackingUrl,
}: OrderConfirmationProps) {
  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount)

  return (
    <EmailLayout preview={`Order confirmed - ${orderNumber}`}>
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
            <span style={{ fontSize: '28px' }}>✓</span>
          </div>
          <h1 style={{ marginBottom: '8px' }}>Order Confirmed</h1>
          <p style={{ margin: 0, textAlign: 'center' }}>
            Thank you, {customerName}! Your order has been received.
          </p>
        </div>

        <div className="highlight">
          <div className="stat-row">
            <span className="stat-label">Order Number</span>
            <span className="stat-value">{orderNumber}</span>
          </div>
          <div className="stat-row">
            <span className="stat-label">Order Date</span>
            <span className="stat-value">{orderDate}</span>
          </div>
        </div>

        <h2
          style={{
            fontSize: '16px',
            fontWeight: 600,
            color: '#1A1A1A',
            marginBottom: '16px',
          }}
        >
          Order Summary
        </h2>

        {items.map((item, index) => (
          <div
            key={index}
            style={{
              display: 'flex',
              alignItems: 'center',
              padding: '16px 0',
              borderBottom: index < items.length - 1 ? '1px solid #F3F4F6' : 'none',
            }}
          >
            {item.imageUrl && (
              <img
                src={item.imageUrl}
                alt={item.name}
                style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '8px',
                  objectFit: 'cover',
                  marginRight: '16px',
                }}
              />
            )}
            <div style={{ flex: 1 }}>
              <p
                style={{
                  fontWeight: 500,
                  color: '#1A1A1A',
                  marginBottom: '4px',
                }}
              >
                {item.name}
              </p>
              {item.variant && (
                <p
                  style={{
                    fontSize: '14px',
                    color: '#6B7280',
                    marginBottom: '4px',
                  }}
                >
                  {item.variant}
                </p>
              )}
              <p style={{ fontSize: '14px', color: '#6B7280', margin: 0 }}>
                Qty: {item.quantity}
              </p>
            </div>
            <p style={{ fontWeight: 600, color: '#1A1A1A', margin: 0 }}>
              {formatCurrency(item.price)}
            </p>
          </div>
        ))}

        <EmailDivider />

        <div style={{ marginBottom: '24px' }}>
          <div className="stat-row">
            <span className="stat-label">Subtotal</span>
            <span style={{ color: '#374151' }}>{formatCurrency(subtotal)}</span>
          </div>
          <div className="stat-row">
            <span className="stat-label">Shipping</span>
            <span style={{ color: '#374151' }}>
              {shipping === 0 ? 'Free' : formatCurrency(shipping)}
            </span>
          </div>
          <div className="stat-row">
            <span className="stat-label">Tax</span>
            <span style={{ color: '#374151' }}>{formatCurrency(tax)}</span>
          </div>
          <div className="stat-row" style={{ paddingTop: '16px' }}>
            <span style={{ fontWeight: 600, color: '#1A1A1A' }}>Total</span>
            <span style={{ fontWeight: 700, color: '#1A1A1A', fontSize: '18px' }}>
              {formatCurrency(total)}
            </span>
          </div>
        </div>

        <h2
          style={{
            fontSize: '16px',
            fontWeight: 600,
            color: '#1A1A1A',
            marginBottom: '12px',
          }}
        >
          Shipping Address
        </h2>
        <p style={{ fontSize: '15px', color: '#374151', lineHeight: 1.6 }}>
          {shippingAddress.line1}
          <br />
          {shippingAddress.line2 && (
            <>
              {shippingAddress.line2}
              <br />
            </>
          )}
          {shippingAddress.city}, {shippingAddress.state} {shippingAddress.postalCode}
          <br />
          {shippingAddress.country}
        </p>

        {trackingUrl && (
          <EmailButton href={trackingUrl}>Track Your Order</EmailButton>
        )}
      </EmailCard>

      <EmailFooter />
    </EmailLayout>
  )
}

export default OrderConfirmationEmail
