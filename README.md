# BIG AppFolio Accounting

Automated financial monitoring for Blackdeer Investment Group via the AppFolio Reports API v2.

## What it does

Pulls the Check Register Detail report from AppFolio, analyzes transactions, and emails a formatted HTML summary including:

- **Total disbursements** (month-to-date)
- **Top 10 properties** by spend
- **Top 10 vendors** by spend
- **Flagged items** — Baker Tilly fees, legal spend, large utilities, CC statement payments, capital expenditures, franchise fees

## Setup

```bash
cp env.example .env
# Fill in your AppFolio API credentials and SMTP settings
npm install
node monitor.js
```

### Environment Variables

| Variable | Description |
|---|---|
| `APPFOLIO_CLIENT_ID` | Reports API Client ID (from AppFolio General Settings) |
| `APPFOLIO_CLIENT_SECRET` | Reports API Client Secret |
| `APPFOLIO_DATABASE` | AppFolio subdomain (e.g. `blackdeerig`) |
| `SMTP_HOST` | SMTP server (default: `smtp.gmail.com`) |
| `SMTP_PORT` | SMTP port (default: `587`) |
| `SMTP_USER` | Sender email address |
| `SMTP_PASS` | SMTP password or Gmail App Password |
| `REPORT_EMAIL` | Recipient email address |

### Cron (BlueSteel)

```bash
# Every weekday at 7am
0 7 * * 1-5 cd /home/mike/repos/big/appfolio-monitor && node monitor.js >> /home/mike/logs/big-monitor.log 2>&1
```

## Confidential

This project contains financial integration code for BIG (Blackdeer Investment Group). Do not share outside Metify.
