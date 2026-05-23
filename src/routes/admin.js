require('dotenv').config();
const express = require('express');
const router = express.Router();
const { getAdminStats, getAllPhones } = require('../utils/db');
const { sendMessage } = require('../utils/whatsapp');

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'gharkaCA2026';

function requireAuth(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth) {
    res.setHeader('WWW-Authenticate', 'Basic realm="Ghar Ka CA Admin"');
    return res.status(401).send('Auth required');
  }
  const [, encoded] = auth.split(' ');
  const [, pass] = Buffer.from(encoded, 'base64').toString().split(':');
  if (pass === ADMIN_PASSWORD) return next();
  res.status(403).send('Wrong password');
}

// ── Dashboard ──────────────────────────────────────────────────────────────
router.get('/', requireAuth, async (req, res) => {
  try {
    const stats = await getAdminStats();
    res.send(dashboardHTML(stats));
  } catch (err) {
    res.status(500).send(`Error: ${err.message}`);
  }
});

// ── Broadcast ──────────────────────────────────────────────────────────────
router.post('/broadcast', requireAuth, async (req, res) => {
  const { message, target } = req.body;
  if (!message) return res.status(400).json({ error: 'Message required' });
  try {
    const phones = await getAllPhones(target || 'all');
    let sent = 0, failed = 0;
    for (const phone of phones) {
      try { await sendMessage(phone, message); sent++; await new Promise(r => setTimeout(r, 500)); }
      catch { failed++; }
    }
    res.json({ success: true, sent, failed, total: phones.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Stats API ──────────────────────────────────────────────────────────────
router.get('/api/stats', requireAuth, async (req, res) => {
  try {
    const stats = await getAdminStats();
    res.json(stats);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

function dashboardHTML({ totalUsers, subscribedUsers, totalRevenue, completedConversations, newThisWeek, recentUsers, recentPayments }) {
  const cr = totalUsers > 0 ? ((subscribedUsers / totalUsers) * 100).toFixed(1) : 0;
  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Admin — Ghar Ka CA</title>
<style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:system-ui,sans-serif;background:#0e0e18;color:#e8e8f0;min-height:100vh}.nav{background:#1a1a2e;padding:14px 24px;border-bottom:1px solid #222;display:flex;align-items:center;gap:12px}.nav h1{font-size:18px;color:#ff6b00}.container{max-width:1200px;margin:0 auto;padding:24px}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:16px;margin-bottom:32px}.card{background:#1e1e35;border:1px solid #222;border-radius:12px;padding:20px}.val{font-size:30px;font-weight:700;color:#ff6b00}.lbl{font-size:12px;color:#666;margin-top:4px}.sub{font-size:11px;color:#22c55e;margin-top:4px}h2{font-size:14px;color:#aaa;margin-bottom:14px}.section{background:#1e1e35;border:1px solid #222;border-radius:12px;padding:20px;margin-bottom:20px}table{width:100%;border-collapse:collapse}th{font-size:10px;color:#555;text-align:left;padding:8px;text-transform:uppercase;border-bottom:1px solid #222}td{padding:8px;font-size:12px;border-bottom:1px solid rgba(255,255,255,.03)}.badge{padding:2px 8px;border-radius:6px;font-size:10px;font-weight:600}.paid{background:rgba(34,197,94,.12);color:#22c55e}.free{background:rgba(255,255,255,.06);color:#555}textarea{width:100%;background:#0e0e18;border:1px solid #333;border-radius:8px;padding:12px;color:#e8e8f0;font-size:13px;resize:vertical;min-height:80px;font-family:inherit}select{background:#0e0e18;border:1px solid #333;border-radius:8px;padding:8px 12px;color:#e8e8f0;font-size:13px}button{background:#ff6b00;border:none;border-radius:8px;padding:10px 20px;color:white;font-size:13px;font-weight:600;cursor:pointer}button:hover{background:#cc5500}.row{display:flex;gap:12px;align-items:flex-end;margin-top:10px}.res{margin-top:10px;font-size:13px;color:#22c55e}</style></head>
<body>
<div class="nav"><h1>🏦 Ghar Ka CA</h1><span style="color:#444">/</span><span style="color:#666">Admin</span><span style="margin-left:auto;color:#444;font-size:12px">MongoDB Atlas</span></div>
<div class="container">
<div class="grid">
  <div class="card"><div class="val">${totalUsers}</div><div class="lbl">Total Users</div><div class="sub">+${newThisWeek} this week</div></div>
  <div class="card"><div class="val">${subscribedUsers}</div><div class="lbl">Paid Subscribers</div><div class="sub">${cr}% conversion</div></div>
  <div class="card"><div class="val">₹${Number(totalRevenue).toLocaleString('en-IN')}</div><div class="lbl">Total Revenue</div><div class="sub">₹${Math.round(totalRevenue/12).toLocaleString('en-IN')}/mo avg</div></div>
  <div class="card"><div class="val">${completedConversations}</div><div class="lbl">Reports Generated</div></div>
  <div class="card"><div class="val">₹${(totalUsers-subscribedUsers)*199}</div><div class="lbl">Upsell Opportunity</div><div class="sub">${totalUsers-subscribedUsers} free users × ₹199</div></div>
</div>
<div class="section">
  <h2>📢 Broadcast Message</h2>
  <textarea id="msg" placeholder="Namaste! ITR deadline 31 July hai — ready ho? Reply karein!"></textarea>
  <div class="row">
    <select id="tgt"><option value="all">All (${totalUsers})</option><option value="subscribed">Paid (${subscribedUsers})</option><option value="free">Free (${totalUsers-subscribedUsers})</option></select>
    <button onclick="broadcast()">Send →</button>
  </div>
  <div id="res" class="res"></div>
</div>
<div class="section">
  <h2>👥 Recent Users</h2>
  <table><thead><tr><th>Phone</th><th>Joined</th><th>Status</th><th>Reports</th></tr></thead><tbody>
  ${recentUsers.map(u=>`<tr><td>${u.phone.replace('whatsapp:+91','+91 ')}</td><td>${new Date(u.createdAt).toLocaleDateString('en-IN')}</td><td><span class="badge ${u.is_subscribed?'paid':'free'}">${u.is_subscribed?'✓ PAID':'FREE'}</span></td><td>${u.reports_generated||0}</td></tr>`).join('')}
  </tbody></table>
</div>
<div class="section">
  <h2>💰 Recent Payments</h2>
  <table><thead><tr><th>Phone</th><th>Amount</th><th>Date</th><th>Order ID</th></tr></thead><tbody>
  ${recentPayments.map(p=>`<tr><td>${p.phone.replace('whatsapp:','')}</td><td>₹${(p.amount/100).toLocaleString('en-IN')}</td><td>${new Date(p.createdAt).toLocaleDateString('en-IN')}</td><td style="font-size:10px;color:#444;font-family:monospace">${p.razorpay_order_id||'—'}</td></tr>`).join('')}
  </tbody></table>
</div>
</div>
<script>
async function broadcast(){
  const msg=document.getElementById('msg').value.trim();
  const tgt=document.getElementById('tgt').value;
  if(!msg)return alert('Write a message!');
  if(!confirm('Send to '+tgt+'?'))return;
  const r=await fetch('/admin/broadcast',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({message:msg,target:tgt})});
  const d=await r.json();
  document.getElementById('res').textContent=d.success?'✅ Sent: '+d.sent+', Failed: '+d.failed:'❌ '+d.error;
}
</script>
</body></html>`;
}

module.exports = router;
