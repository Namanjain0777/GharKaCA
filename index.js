require('dotenv').config();
const express = require('express');
const path = require('path');

const routes = require('./src/routes/index');
const adminRoutes = require('./src/routes/admin');

const app = express();
const PORT = process.env.PORT || 3000;

// ── Middleware ─────────────────────────────────────────────────────────────
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use('/reports', express.static(path.join(__dirname, 'public/reports')));
app.use(express.static(path.join(__dirname, 'public')));

// ── Routes ─────────────────────────────────────────────────────────────────
app.use('/', routes);
app.use('/admin', adminRoutes);

// ── Web App ─────────────────────────────────────────────────────────────────
app.get('/app', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/app.html'));
});

// ── Landing page ─────────────────────────────────────────────────────────────
app.get('/', (req, res) => {
  res.send(landingPageHTML());
});

// ── Error handler ─────────────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('[Server] Error:', err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

// ── Start ─────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`
╔══════════════════════════════════════════════╗
║         GHAR KA CA — Server Running!         ║
╠══════════════════════════════════════════════╣
║  Port         : ${PORT}                            ║
║  Web App      : /app                         ║
║  WhatsApp     : /webhook/whatsapp            ║
║  Admin        : /admin                       ║
║  Health       : /health                      ║
╚══════════════════════════════════════════════╝
`);
});

function landingPageHTML() {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Ghar Ka CA — AI Tax Advisor for India</title>
  <link href="https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:wght@300;400;500;600&display=swap" rel="stylesheet">
  <style>
    *{margin:0;padding:0;box-sizing:border-box}
    body{font-family:'DM Sans',sans-serif;background:#0e0e18;color:#e8e8f0;min-height:100vh}
    .hero{min-height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:40px 20px;text-align:center;background:radial-gradient(ellipse at 50% 0%,#1e1e3f 0%,#0e0e18 60%)}
    .badge{background:rgba(255,107,0,.12);border:1px solid rgba(255,107,0,.3);color:#ff6b00;padding:6px 16px;border-radius:20px;font-size:12px;font-weight:600;letter-spacing:1px;text-transform:uppercase;margin-bottom:24px;display:inline-block}
    h1{font-family:'DM Serif Display',serif;font-size:clamp(48px,8vw,80px);color:#ff6b00;margin-bottom:8px;line-height:1}
    .tagline{font-size:clamp(15px,2.5vw,20px);color:#7777aa;max-width:560px;line-height:1.6;margin-bottom:48px}
    .features{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:16px;max-width:880px;margin-bottom:48px}
    .feat{background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.07);border-radius:12px;padding:20px;text-align:left}
    .feat .icon{font-size:24px;margin-bottom:10px}
    .feat h3{font-size:14px;font-weight:600;margin-bottom:4px}
    .feat p{font-size:12px;color:#666;line-height:1.5}
    .btns{display:flex;gap:12px;flex-wrap:wrap;justify-content:center;margin-bottom:16px}
    .btn-primary{background:#ff6b00;color:white;padding:16px 32px;border-radius:50px;font-size:16px;font-weight:600;text-decoration:none;transition:all .2s;box-shadow:0 8px 30px rgba(255,107,0,.35)}
    .btn-primary:hover{background:#cc5500;transform:translateY(-2px)}
    .btn-secondary{background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.12);color:#e8e8f0;padding:16px 32px;border-radius:50px;font-size:16px;font-weight:600;text-decoration:none;transition:all .2s}
    .btn-secondary:hover{background:rgba(255,255,255,.1)}
    .price{font-size:13px;color:#444;margin-top:4px}
    footer{margin-top:60px;font-size:11px;color:#333;text-align:center}
  </style>
</head>
<body>
<div class="hero">
  <div class="badge">🏦 AI-Powered Tax Advisor</div>
  <h1>Ghar Ka CA</h1>
  <p class="tagline">India's middle class ka personal tax advisor. Old vs New regime, 80C, HRA, Form 16 — sab kuch plain Hindi mein.</p>
  <div class="features">
    <div class="feat"><div class="icon">⚖️</div><h3>Old vs New Regime</h3><p>Exact ₹ comparison for YOUR salary</p></div>
    <div class="feat"><div class="icon">💰</div><h3>Tax Saving Plan</h3><p>80C, 80D, HRA, NPS — maximize every rupee</p></div>
    <div class="feat"><div class="icon">📄</div><h3>Form 16 Explainer</h3><p>Every row explained in plain language</p></div>
    <div class="feat"><div class="icon">📊</div><h3>Free PDF Report</h3><p>Personalised analysis you can keep</p></div>
    <div class="feat"><div class="icon">📋</div><h3>All Tax Forms</h3><p>ITR-1, Form 16, 26AS, 12BB — complete guide</p></div>
    <div class="feat"><div class="icon">💬</div><h3>WhatsApp + Web</h3><p>Chat on WhatsApp or use the web app</p></div>
  </div>
  <div class="btns">
    <a href="/app" class="btn-primary">Open Web App 🚀</a>
    <a href="https://wa.me/?text=Haan" class="btn-secondary">WhatsApp Bot 💬</a>
  </div>
  <p class="price">Free report • ₹199/year premium • No ads</p>
  <footer>Ghar Ka CA is an educational AI tool. Not a registered CA firm. Consult a CA for complex cases.<br>© 2026 Ghar Ka CA</footer>
</div>
</body>
</html>`;
}

module.exports = app;
