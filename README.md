# 🏦 Ghar Ka CA — Complete Setup Guide

## Stack
| Layer | Tech | Why |
|---|---|---|
| Server | Node.js + Express on **Railway** | Persistent server, async WhatsApp, PDF generation |
| Database | **MongoDB Atlas** | Free 512MB, perfect for JSON conversations |
| AI | **Claude API** (claude-sonnet-4) | Best reasoning for tax logic |
| WhatsApp | **Twilio** sandbox (free) | Official WhatsApp Business API |
| Payments | **Razorpay** | Free setup, 2% fee, India-first |
| PDF | **pdfkit** | Zero headless browser, works on Railway |

> ❌ Not Vercel — serverless timeouts kill async WhatsApp + PDF generation
> ✅ Railway — persistent Node server, free tier, 1-command deploy

---

## Step 1 — MongoDB Atlas (Free, 2 min)

1. Go to https://cloud.mongodb.com → Sign up free
2. Create a **free M0 cluster** (512MB, plenty for 10,000 users)
3. Database Access → Add User → username + password
4. Network Access → Add IP → `0.0.0.0/0` (allow all — needed for Railway)
5. Connect → Drivers → Node.js → copy the connection string

Connection string looks like:
```
mongodb+srv://myuser:mypassword@cluster0.abc123.mongodb.net/?retryWrites=true&w=majority
```

**No schema setup needed** — Mongoose creates collections automatically on first use.

---

## Step 2 — Anthropic API Key

1. https://console.anthropic.com → API Keys → Create key
2. Copy `sk-ant-...`

---

## Step 3 — Twilio WhatsApp Sandbox (Free)

1. https://twilio.com → Sign up
2. Messaging → Try it out → Send a WhatsApp message
3. Follow sandbox join instructions (send "join <word>" from your phone)
4. Copy Account SID + Auth Token from Console
5. Sandbox number: `whatsapp:+14155238886`

---

## Step 4 — Razorpay (Free)

1. https://razorpay.com → Sign up
2. Settings → API Keys → Generate Test Keys
3. Copy Key ID + Secret

---

## Step 5 — Configure .env

```bash
cp .env.example .env
# Edit .env and fill all values
```

---

## Step 6 — Run Locally

```bash
npm install
npm run dev
# Server: http://localhost:3000
# Web App: http://localhost:3000/app
# Admin:   http://localhost:3000/admin
```

---

## Step 7 — Expose for Twilio Webhook

```bash
# Option A — localtunnel (instant)
npm run tunnel
# Gets you: https://gharkaca.loca.lt

# Option B — ngrok
npx ngrok http 3000
```

Go to Twilio → WhatsApp Sandbox → "When a message comes in":
```
https://YOUR_TUNNEL_URL/webhook/whatsapp   [POST]
```

---

## Step 8 — Deploy to Railway (Production)

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login + init
railway login
railway init

# Set all env variables (one time)
railway variables set MONGODB_URI="mongodb+srv://..."
railway variables set ANTHROPIC_API_KEY="sk-ant-..."
railway variables set TWILIO_ACCOUNT_SID="AC..."
railway variables set TWILIO_AUTH_TOKEN="..."
railway variables set TWILIO_WHATSAPP_NUMBER="whatsapp:+14155238886"
railway variables set RAZORPAY_KEY_ID="rzp_test_..."
railway variables set RAZORPAY_KEY_SECRET="..."
railway variables set APP_URL="https://YOUR-APP.up.railway.app"
railway variables set SUBSCRIPTION_AMOUNT="19900"
railway variables set ADMIN_PASSWORD="yourSecretPassword"

# Deploy
railway up
```

Railway gives you a URL like `https://gharkaCA.up.railway.app`

Update in Twilio: webhook → `https://gharkaCA.up.railway.app/webhook/whatsapp`
Update `APP_URL` in Railway env to your Railway URL.

---

## URLs After Deployment

| URL | What |
|---|---|
| `/` | Landing page |
| `/app` | Full web app (AI chat + all forms + calculator) |
| `/admin` | Admin dashboard (password protected) |
| `/webhook/whatsapp` | Twilio webhook (POST) |
| `/payment/success` | Razorpay callback |
| `/health` | Health check |

---

## MongoDB Collections (auto-created)

| Collection | What's stored |
|---|---|
| `users` | phone, subscription status, reports count |
| `conversations` | full chat history, tax_data, step, status |
| `payments` | Razorpay order ID, amount, status |
| `reports` | generated PDF paths + full analysis |

View your data: MongoDB Atlas → Browse Collections

---

## Project Structure

```
gharkaCA/
├── index.js                    ← Express server entry
├── .env.example                ← Copy → .env
├── package.json
├── n8n_workflow.json           ← Optional: import into n8n
├── public/
│   └── app.html                ← Full web app
└── src/
    ├── bot/
    │   ├── ai.js               ← Claude API + Hinglish system prompt
    │   └── handler.js          ← 10-question conversation state machine
    ├── forms/
    │   └── taxForms.js         ← All govt forms as structured data
    ├── pdf/
    │   └── generator.js        ← PDF report generator
    ├── routes/
    │   ├── index.js            ← Twilio webhook + payment routes
    │   └── admin.js            ← Admin dashboard + broadcast
    └── utils/
        ├── db.js               ← MongoDB/Mongoose helpers
        ├── taxEngine.js        ← Pure tax calculation functions
        ├── payment.js          ← Razorpay integration
        ├── whatsapp.js         ← Twilio sender
        └── broadcasts.js       ← 8 seasonal message templates
```
