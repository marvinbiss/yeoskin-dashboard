# 🏦 Yeoskin Ops Dashboard

> Enterprise-grade admin dashboard for managing creator payouts.

![Version](https://img.shields.io/badge/version-1.0.0-blue)
![React](https://img.shields.io/badge/React-18.2-61dafb)
![Tailwind](https://img.shields.io/badge/Tailwind-3.4-38bdf8)

---

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Supabase account
- n8n workflows deployed

### Installation

```bash
# Clone the repository
git clone https://github.com/your-org/yeoskin-dashboard.git
cd yeoskin-dashboard

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Edit .env with your values
# - VITE_SUPABASE_URL
# - VITE_SUPABASE_ANON_KEY
# - VITE_N8N_BASE_URL
# - VITE_PAYOUT_SECRET

# Start development server
npm run dev
```

### Build for Production

```bash
npm run build
```

---

## 📁 Project Structure

```
yeoskin-dashboard/
├── src/
│   ├── components/
│   │   ├── Common/         # Shared UI components
│   │   ├── Layout/         # Sidebar, Header, Layout
│   │   ├── Dashboard/      # KPIs, Charts, Activity
│   │   ├── Batches/        # Batch management
│   │   └── Creators/       # Creator management
│   ├── hooks/
│   │   └── useSupabase.js  # Data fetching hooks
│   ├── lib/
│   │   ├── supabase.js     # Supabase client
│   │   └── api.js          # n8n API calls
│   ├── pages/
│   │   └── index.jsx       # All page components
│   ├── styles/
│   │   └── globals.css     # Tailwind styles
│   ├── App.jsx             # Routes
│   └── main.jsx            # Entry point
├── .env.example
├── package.json
├── tailwind.config.js
└── vite.config.js
```

---

## 🎨 Features

### Dashboard
- 📊 Real-time KPIs (Total Paid, Active Creators, Success Rate)
- 📈 Payout trend charts
- 🥧 Status distribution pie chart
- ⚡ Recent transfer activity (live updates)
- 🎯 Quick actions

### Payout Management
- 📋 Batch list with filtering
- ✅ Approve batches (draft → approved)
- 🚀 Execute batches (trigger payments)
- 👁️ Batch detail view
- 📊 Batch statistics

### Creator Management
- 👥 Creator list with search
- 💰 Earnings tracking (total, pending)
- 🏦 Bank account status
- 📧 Creator details modal

### Settings
- 🔧 API configuration
- 🔔 Notification preferences
- 🗄️ Database status

---

## 🔌 API Integration

### Supabase Tables

The dashboard connects to these Supabase tables:
- `creators` - Creator profiles
- `commissions` - Commission records
- `payout_batches` - Batch headers
- `payout_items` - Individual payouts
- `wise_transfers` - Wise transfer logs

### n8n Webhooks

The dashboard calls these n8n endpoints:

```
POST /webhook/payout/daily     # Trigger daily batch
POST /webhook/payout/execute   # Execute batch payments
```

---

## 🛠️ Configuration

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_SUPABASE_URL` | ✅ | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | ✅ | Supabase anonymous key |
| `VITE_N8N_BASE_URL` | ✅ | n8n instance URL |
| `VITE_PAYOUT_SECRET` | ✅ | Webhook authentication secret |

### Supabase Setup

1. Enable Row Level Security (RLS)
2. Create policies for authenticated users
3. Enable Realtime for `payout_batches` and `wise_transfers`

---

## 🚀 Deployment

### Vercel (Recommended)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Set environment variables in Vercel dashboard
```

### Docker

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "run", "preview"]
```

---

## 🎨 Customization

### Theme Colors

Edit `tailwind.config.js` to customize colors:

```javascript
theme: {
  extend: {
    colors: {
      primary: {
        500: '#0ea5e9', // Your brand color
      }
    }
  }
}
```

### Dark Mode

Dark mode is supported out of the box. Toggle via the header button or system preference.

---

## 📝 License

Proprietary - Yeoskin © 2026

---

## 🤝 Support

- Documentation: See `/docs` folder
- Issues: GitHub Issues
- Email: support@yeoskin.com
