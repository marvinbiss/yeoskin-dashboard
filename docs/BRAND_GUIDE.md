# 🎨 Yeoskin Brand Guide

## Brand Identity

Yeoskin is a premium K-beauty brand that empowers creators to share their skincare passion. Our visual identity reflects **elegance**, **warmth**, and **trust**.

---

## Brand Values

| Value | Expression |
|-------|------------|
| **Premium** | Refined typography, generous whitespace, subtle shadows |
| **Warm** | Rose gold primary, soft gradients, friendly tone |
| **Trustworthy** | Clean layouts, consistent patterns, professional finish |
| **Modern** | Contemporary design, smooth animations, responsive |

---

## Color Palette

### Primary - Rose Gold

Our signature color. Use for CTAs, brand moments, and key interactions.

```
brand-500: #FF6B9D  ← Primary
brand-600: #F04D7F  ← Hover
brand-700: #D93A6A  ← Active
brand-100: #FFE8ED  ← Light background
brand-50:  #FFF5F7  ← Subtle background
```

### Secondary - Lavender

For secondary actions, accents, and premium touches.

```
lavender-500: #A855F7
lavender-200: #E9D5FF
lavender-50:  #FAF5FF
```

### Accent - Mint

For success states, positive actions, and fresh accents.

```
mint-500: #10B981
mint-200: #A7F3D0
mint-50:  #ECFDF5
```

### Neutrals

For text, borders, and backgrounds.

```
neutral-900: #171717  ← Primary text
neutral-600: #525252  ← Secondary text
neutral-400: #A3A3A3  ← Muted text
neutral-200: #E5E5E5  ← Borders
neutral-100: #F5F5F5  ← Light bg
neutral-50:  #FAFAFA  ← Page bg
```

### Semantic Colors

```
Success: mint-500 (#10B981)
Warning: #F59E0B
Error:   #EF4444
Info:    brand-500
```

---

## Typography

### Font Stack

```css
/* Primary - Body text */
font-family: 'Inter', system-ui, sans-serif;

/* Display - Headlines */
font-family: 'Plus Jakarta Sans', 'Inter', sans-serif;

/* Mono - Code */
font-family: 'JetBrains Mono', monospace;
```

### Type Scale

| Name | Size | Use |
|------|------|-----|
| display-2xl | 72px | Hero headlines |
| display-xl | 60px | Page titles |
| display-lg | 48px | Section titles |
| display-md | 36px | Card titles |
| display-sm | 30px | Subsections |
| text-xl | 20px | Lead paragraphs |
| text-base | 16px | Body text |
| text-sm | 14px | Secondary text |
| text-xs | 12px | Captions |

### Text Colors

```jsx
// Primary text
<p className="text-neutral-900">Main content</p>

// Secondary text
<p className="text-neutral-600">Supporting text</p>

// Muted text
<p className="text-neutral-400">Timestamps, metadata</p>

// Brand accent
<p className="text-brand-600">Links, highlights</p>
```

---

## Spacing System

Use Tailwind's spacing scale consistently:

| Token | Value | Use |
|-------|-------|-----|
| `space-1` | 4px | Tight gaps |
| `space-2` | 8px | Related elements |
| `space-3` | 12px | Form fields |
| `space-4` | 16px | Default padding |
| `space-6` | 24px | Section padding |
| `space-8` | 32px | Card padding |
| `space-12` | 48px | Section gaps |
| `space-16` | 64px | Page sections |
| `space-24` | 96px | Hero spacing |

---

## Shadows

### Elevation Levels

```jsx
// Level 0 - Flat
className="shadow-none"

// Level 1 - Subtle lift
className="shadow-soft-sm"

// Level 2 - Cards
className="shadow-card"

// Level 3 - Dropdowns
className="shadow-soft-lg"

// Level 4 - Modals
className="shadow-soft-xl"

// Brand glow
className="shadow-brand-glow"
```

---

## Border Radius

```
rounded-lg:  8px   ← Buttons, inputs
rounded-xl:  16px  ← Cards
rounded-2xl: 20px  ← Large cards
rounded-3xl: 24px  ← Hero sections
rounded-full: 50%  ← Avatars, pills
```

---

## Components

### Buttons

```jsx
// Primary CTA
<button className="
  bg-brand-500 hover:bg-brand-600 active:bg-brand-700
  text-white font-medium
  px-6 py-3 rounded-xl
  shadow-button hover:shadow-button-hover
  transition-all duration-200
">
  Get Started
</button>

// Secondary
<button className="
  bg-white hover:bg-neutral-50
  text-neutral-900 font-medium
  border border-neutral-200
  px-6 py-3 rounded-xl
  shadow-soft-sm hover:shadow-soft
  transition-all duration-200
">
  Learn More
</button>

// Ghost
<button className="
  text-brand-600 hover:text-brand-700
  hover:bg-brand-50
  font-medium px-4 py-2 rounded-lg
  transition-colors duration-200
">
  Cancel
</button>
```

### Cards

```jsx
<div className="
  bg-white rounded-2xl
  border border-neutral-100
  shadow-card hover:shadow-card-hover
  p-6 transition-shadow duration-300
">
  {/* Content */}
</div>
```

### Inputs

```jsx
<input className="
  w-full px-4 py-3 rounded-xl
  border border-neutral-200
  focus:border-brand-500 focus:ring-2 focus:ring-brand-100
  placeholder:text-neutral-400
  transition-all duration-200
" />
```

### Badges

```jsx
// Brand
<span className="px-3 py-1 rounded-full text-sm font-medium bg-brand-100 text-brand-700">
  New
</span>

// Success
<span className="px-3 py-1 rounded-full text-sm font-medium bg-mint-100 text-mint-700">
  Active
</span>

// Neutral
<span className="px-3 py-1 rounded-full text-sm font-medium bg-neutral-100 text-neutral-700">
  Draft
</span>
```

---

## Animations

### Entrance Animations

```jsx
// Fade in
className="animate-fade-in"

// Slide up (hero content)
className="animate-fade-in-up"

// Scale in (modals)
className="animate-scale-in"
```

### Hover Effects

```jsx
// Lift on hover
className="hover:-translate-y-1 transition-transform duration-200"

// Scale on hover
className="hover:scale-105 transition-transform duration-200"

// Glow on hover
className="hover:shadow-brand-glow transition-shadow duration-300"
```

### Loading States

```jsx
// Shimmer skeleton
<div className="animate-shimmer bg-gradient-to-r from-neutral-200 via-neutral-100 to-neutral-200 bg-[length:200%_100%]" />

// Pulse
<div className="animate-pulse-soft" />

// Spinner
<div className="animate-spin-slow" />
```

---

## Gradients

### Brand Gradient

```jsx
className="bg-gradient-brand"
// Result: #FF6B9D → #C084FC
```

### Subtle Background

```jsx
className="bg-gradient-brand-subtle"
// Result: #FFF5F7 → #FAF5FF
```

### Mesh Background

```jsx
className="bg-gradient-mesh"
// Multi-color ambient gradient
```

---

## Iconography

### Style Guidelines

- **Stroke width**: 1.5px (Lucide default)
- **Size**: 20px (default), 16px (small), 24px (large)
- **Color**: Match text color or use brand colors

### Icon Usage

```jsx
import { Heart, Sparkles, ArrowRight } from 'lucide-react'

// Default
<Heart className="w-5 h-5 text-neutral-600" />

// Brand colored
<Sparkles className="w-5 h-5 text-brand-500" />

// In button
<button className="flex items-center gap-2">
  Continue <ArrowRight className="w-4 h-4" />
</button>
```

---

## Photography

### Style

- **Light and airy** - Bright, natural lighting
- **Soft colors** - Pastels, rose tones, cream backgrounds
- **Clean compositions** - Minimal clutter, focus on product
- **Authentic** - Real textures, natural skin

### Overlays

For text on images:

```jsx
// Gradient overlay
<div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />

// Blur overlay
<div className="absolute inset-0 bg-white/80 backdrop-blur-sm" />
```

---

## Voice & Tone

### Brand Voice

| Do | Don't |
|-----|-------|
| Warm and friendly | Cold or corporate |
| Confident, not arrogant | Aggressive sales |
| Expert but approachable | Condescending |
| Encouraging | Pushy |

### Example Copy

```
✓ "Discover your perfect routine"
✗ "Buy now before it's too late"

✓ "Join 10,000+ creators"
✗ "Don't miss out on this opportunity"

✓ "Questions? We're here to help"
✗ "Contact support"
```

---

## Accessibility

### Color Contrast

All text meets WCAG 2.1 AA standards:
- Normal text: 4.5:1 minimum
- Large text: 3:1 minimum

### Focus States

```jsx
className="focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2"
```

### Motion

Respect user preferences:

```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## File Naming

```
icons/
├── logo.svg
├── logo-white.svg
├── logo-icon.svg
└── favicon.ico

images/
├── hero-desktop.webp
├── hero-mobile.webp
└── og-image.png (1200x630)

fonts/
├── Inter-Variable.woff2
└── PlusJakartaSans-Variable.woff2
```

---

## Component Library

### Available Components

All components are exported from `@/components/Brand`:

```tsx
import {
  // Core
  Button, Card, Input, Badge, Dropdown,

  // Navigation
  Tabs, TabList, Tab, TabPanel,

  // Data Display
  Table, Avatar, AvatarGroup, StatCard, StatsGrid,

  // Loading
  Skeleton, SkeletonCard, SkeletonTable,

  // Progress
  ProgressBar, CircularProgress, StepsProgress,

  // Feedback
  ToastContainer, useToast, Modal, ConfirmModal, Tooltip,
  EmptyState, NoResults, NoData, ErrorState,

  // Form Controls
  Switch, SwitchGroup,
} from '@/components/Brand'
```

### Component Preview

Visit `/brand` to see all components with live examples.

---

## Usage Examples

### Button with Loading State

```tsx
<Button
  loading={isSubmitting}
  leftIcon={<Save className="w-4 h-4" />}
>
  Save Changes
</Button>
```

### Toast Notifications

```tsx
const { toast } = useToast()

// Success
toast.success('Saved!', 'Your changes have been saved.')

// Error
toast.error('Error', 'Something went wrong.')

// Warning
toast.warning('Warning', 'This action cannot be undone.')
```

### Modal with Actions

```tsx
<ConfirmModal
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  onConfirm={handleDelete}
  title="Delete Creator?"
  message="This will remove the creator and all their data."
  variant="danger"
  confirmLabel="Delete"
/>
```

### Stats Grid

```tsx
<StatsGrid columns={4}>
  <StatCard
    label="Revenue"
    value="$24,500"
    icon={<DollarSign />}
    change={{ value: 12.5, type: 'increase' }}
    variant="brand"
  />
</StatsGrid>
```

### Data Table

```tsx
<Table>
  <TableHead>
    <TableRow>
      <TableHeaderCell sortable sorted="asc">Name</TableHeaderCell>
      <TableHeaderCell>Status</TableHeaderCell>
    </TableRow>
  </TableHead>
  <TableBody>
    <TableRow onClick={() => navigate(id)}>
      <TableCell>Sarah Johnson</TableCell>
      <TableCell><Badge variant="success">Active</Badge></TableCell>
    </TableRow>
  </TableBody>
</Table>
```

---

## Quick Reference

```jsx
// Premium card
<div className="bg-white rounded-2xl shadow-card hover:shadow-card-hover p-8 transition-shadow">

// Brand button
<button className="bg-brand-500 hover:bg-brand-600 text-white font-medium px-6 py-3 rounded-xl shadow-button hover:shadow-button-hover transition-all">

// Section container
<section className="max-w-7xl mx-auto px-6 py-24">

// Gradient text
<h1 className="text-display-xl bg-gradient-brand bg-clip-text text-transparent">
```

---

## Email Templates

Premium email templates are available in `src/emails/templates/`:

- `welcome.tsx` - Welcome email for new users/creators
- `creator-invitation.tsx` - Creator program invitations
- `order-confirmation.tsx` - Order receipts
- `password-reset.tsx` - Password reset flow
- `commission-payout.tsx` - Creator payout notifications

All templates follow brand guidelines with consistent typography, colors, and layout.
