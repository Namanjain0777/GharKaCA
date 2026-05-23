require('dotenv').config();
const twilio = require('twilio');
const path = require('path');
const fs = require('fs');

const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
const FROM = process.env.TWILIO_WHATSAPP_NUMBER;

/**
 * Send a text message via WhatsApp
 */
async function sendMessage(to, body) {
  try {
    const msg = await client.messages.create({ from: FROM, to, body });
    console.log(`[WhatsApp] Sent to ${to}: ${msg.sid}`);
    return msg;
  } catch (err) {
    console.error(`[WhatsApp] Failed to send to ${to}:`, err.message);
    throw err;
  }
}

/**
 * Send a PDF document via WhatsApp
 */
async function sendDocument(to, filePath, caption = 'Your personalised tax report is ready! 🎉') {
  try {
    const publicUrl = `${process.env.APP_URL}/reports/${path.basename(filePath)}`;

    const msg = await client.messages.create({
      from: FROM,
      to,
      body: caption,
      mediaUrl: [publicUrl],
    });

    console.log(`[WhatsApp] PDF sent to ${to}: ${msg.sid}`);
    return msg;
  } catch (err) {
    console.error(`[WhatsApp] Failed to send PDF to ${to}:`, err.message);
    throw err;
  }
}

/**
 * Send typing indicator (best effort — Twilio doesn't support this natively)
 * We simulate it by just adding a small delay
 */
function simulateTyping(ms = 1000) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

module.exports = { sendMessage, sendDocument, simulateTyping };
