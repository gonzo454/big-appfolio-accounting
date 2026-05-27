# BIG AppFolio Accounting

Automated financial monitoring and executive dashboard for Blackdeer Investment Group via the AppFolio Reports API v2.

## Components

### 1. Email Monitor (`monitor.js`)

Pulls the Check Register Detail report from AppFolio, analyzes transactions, and emails a formatted HTML summary including:

- **Total disbursements** (month-to-date)
- **Top 10 properties** by spend with vendor drill-down
- **Top 10 vendors** by spend with GL account breakdown
- **Top 10 GL accounts** with individual transaction detail
- **Flagged items** — Baker Tilly fees, legal spend, large utilities, CC statement payments, capital expenditures, franchise fees

#### Setup

```bash
cp env.example .env
# Fill in your AppFolio API credentials and SMTP settings
npm install
node monitor.js
```

#### Cron (BlueSteel)

```bash
# Every weekday at 7am
0 7 * * 1-5 cd /home/mike/repos/big/appfolio-monitor && node monitor.js >> /home/mike/logs/big-monitor.log 2>&1
```

### 2. Executive Dashboard (`dashboard/`)

Next.js web app providing an interactive financial dashboard. Pulls live data from AppFolio APIs and displays:

- **Financial Overview** — total disbursed, transaction count, property/vendor/GL summaries
- **Property Drill-Down** — per-property P&L with vendor and GL breakdowns
- **Vendor Analytics** — vendor spend analysis with GL and property allocation
- **GL Account Explorer** — expense category drill-down to individual transactions
- **Period Toggle** — switch between Month-to-Date and Year-to-Date views

#### Setup

```bash
cd dashboard
cp .env.local.example .env.local
# Fill in your AppFolio API credentials
npm install
npm run dev
```

#### Deploy to Vercel

1. Connect the `dashboard/` directory to Vercel
2. Set environment variables: `APPFOLIO_CLIENT_ID`, `APPFOLIO_CLIENT_SECRET`, `APPFOLIO_DATABASE`
3. Set root directory to `dashboard` in Vercel project settings
4. Deploy

## Environment Variables

| Variable | Description |
|---|---|
| `APPFOLIO_CLIENT_ID` | Reports API Client ID (from AppFolio General Settings) |
| `APPFOLIO_CLIENT_SECRET` | Reports API Client Secret |
| `APPFOLIO_DATABASE` | AppFolio subdomain (e.g. `blackdeerig`) |
| `SMTP_HOST` | SMTP server — email monitor only (default: `smtp.gmail.com`) |
| `SMTP_PORT` | SMTP port — email monitor only (default: `587`) |
| `SMTP_USER` | Sender email address — email monitor only |
| `SMTP_PASS` | SMTP password or Gmail App Password — email monitor only |
| `REPORT_EMAIL` | Recipient email address — email monitor only |

## Confidential

This project contains financial integration code for BIG (Blackdeer Investment Group). Do not share outside Metify.
