const express = require('express');
const router = express.Router();
const twilio = require('twilio');
const { handleIncomingMessage } = require('../bot/handler');
const { handlePaymentSuccess } = require('../utils/payment');
const { sendMessage } = require('../utils/whatsapp');

// ── WhatsApp Webhook (Twilio POST) ────────────────────────────────────────
router.post('/webhook/whatsapp', async (req, res) => {
  // Validate Twilio signature in production
  if (process.env.NODE_ENV === 'production') {
    const twilioSignature = req.headers['x-twilio-signature'];
    const url = `${process.env.APP_URL}/webhook/whatsapp`;
    const isValid = twilio.validateRequest(
      process.env.TWILIO_AUTH_TOKEN,
      twilioSignature,
      url,
      req.body
    );
    if (!isValid) {
      console.warn('[Webhook] Invalid Twilio signature');
      return res.status(403).send('Forbidden');
    }
  }

  // Acknowledge immediately (Twilio requires fast response)
  res.status(200).send('<Response></Response>');

  // Process asynchronously so Twilio doesn't timeout
  const from = req.body.From;
  const body = req.body.Body || '';

  if (!from || !body) return;

  // Handle message asynchronously
  handleIncomingMessage(from, body).catch(err => {
    console.error('[Webhook] Handler error:', err);
  });
});

// ── Payment Success Callback ───────────────────────────────────────────────
router.get('/payment/success', async (req, res) => {
  const { order_id, razorpay_payment_id } = req.query;

  if (!order_id) {
    return res.send(renderPage('Payment Error', '❌ Invalid payment link.', '#CC2200'));
  }

  try {
    const result = await handlePaymentSuccess(order_id, razorpay_payment_id || 'manual');

    if (result.success && result.phone) {
      await sendMessage(result.phone,
        `🎉 *Payment Successful! Welcome to Ghar Ka CA Premium!*\n\nAb poore saal aap koi bhi tax question puchh sakte ho!\n\nAgle saal tax filing season mein yaad rakhna — hum yahan hain 💪\n\nKoi bhi question puchhna ho toh direct WhatsApp karo!`
      );
    }

    res.send(renderPage(
      'Payment Successful! 🎉',
      'Shukriya! Aapka Ghar Ka CA Premium subscription activate ho gaya hai. WhatsApp pe wapas jaiye aur koi bhi tax question puchhein!',
      '#1B7A34'
    ));
  } catch (err) {
    console.error('[Payment] Callback error:', err);
    res.send(renderPage('Payment Error', 'Kuch issue hua. Please contact support.', '#CC2200'));
  }
});

// ── Health Check ───────────────────────────────────────────────────────────
router.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'Ghar Ka CA', time: new Date().toISOString() });
});

// ── Simple HTML response page ──────────────────────────────────────────────
function renderPage(title, message, color = '#FF6B00') {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} — Ghar Ka CA</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', sans-serif; background: #1A1A2E; min-height: 100vh; display: flex; align-items: center; justify-content: center; }
    .card { background: white; border-radius: 16px; padding: 48px; max-width: 480px; text-align: center; box-shadow: 0 20px 60px rgba(0,0,0,0.3); }
    .logo { font-size: 48px; margin-bottom: 16px; }
    h1 { font-size: 24px; color: ${color}; margin-bottom: 16px; }
    p { color: #555; font-size: 16px; line-height: 1.6; }
    .brand { margin-top: 32px; font-size: 12px; color: #aaa; }
  </style>
</head>
<body>
  <div class="card">
    <div class="logo">🏦</div>
    <h1>${title}</h1>
    <p>${message}</p>
    <p class="brand">Ghar Ka CA — AI Tax Advisor for India</p>
  </div>
</body>
</html>`;
}

module.exports = router;
