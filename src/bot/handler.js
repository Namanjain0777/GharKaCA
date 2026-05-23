require('dotenv').config();
const path = require('path');
const fs = require('fs');

const { QUESTIONS, getAIResponse, extractTaxDataFromAnswer, generateTaxAnalysis } = require('./ai');
const { generateReport } = require('../pdf/generator');
const { sendMessage, sendDocument, simulateTyping } = require('../utils/whatsapp');
const { createPaymentLink } = require('../utils/payment');
const {
  getOrCreateUser,
  getConversation,
  createConversation,
  updateConversation,
  appendMessage,
  resetConversation,
  isUserSubscribed,
} = require('../utils/db');

// Ensure reports directory exists
const REPORTS_DIR = path.join(__dirname, '../../public/reports');
if (!fs.existsSync(REPORTS_DIR)) fs.mkdirSync(REPORTS_DIR, { recursive: true });

// ── GREETING ──────────────────────────────────────────────────────────────
const GREETING = `Namaste! 🙏 Main hoon *Ghar Ka CA* — aapka personal tax advisor on WhatsApp!

Main aapko bataunga:
• Old Regime vs New Regime — kaunsa better hai *aapke liye*
• Exactly kitna tax bacha sakte ho
• 80C, HRA, 80D kaise maximize karein
• Form 16 kaise padhein

Sab kuch *FREE* — ek personalized PDF report milegi!

*Shuru karein?* Bas ek "haan" ya "yes" bhejo! 😊

_(Agar pehle se use kar chuke ho aur naya report chahiye, "reset" bhejo)_`;

const SUBSCRIPTION_PITCH = `\n\n---\n🌟 *Ghar Ka CA Premium — ₹199/year*\nSal bhar unlimited tax questions poocho!\nBudget changes, new job, home loan — kuch bhi.\n\nPayment karo aur access lo ✅`;

// ── MAIN HANDLER ──────────────────────────────────────────────────────────

async function handleIncomingMessage(from, body) {
  const userMsg = body.trim();
  console.log(`[Bot] Message from ${from}: ${userMsg}`);

  try {
    // Ensure user exists
    await getOrCreateUser(from);

    // Handle reset command
    if (userMsg.toLowerCase() === 'reset' || userMsg.toLowerCase() === 'restart') {
      await resetConversation(from);
      await sendMessage(from, `Theek hai, fresh start karte hain! 🔄\n\n${GREETING}`);
      return;
    }

    // Handle help command
    if (userMsg.toLowerCase() === 'help' || userMsg.toLowerCase() === 'help me') {
      await sendMessage(from, `Kya help chahiye? 😊\n\n*Commands:*\n• "reset" — nayi conversation shuru karo\n• "status" — subscription status dekho\n• "report" — apna last report download karo\n\nYa koi bhi tax question poocho!`);
      return;
    }

    // Get or create conversation
    let conv = await getConversation(from);

    // No conversation or very first message — send greeting
    if (!conv) {
      conv = await createConversation(from);
      await sendMessage(from, GREETING);
      return;
    }

    // ── STATE MACHINE ──────────────────────────────────────────────────
    const step = conv.step || 0;
    const status = conv.status || 'collecting';
    const taxData = conv.tax_data || {};
    const messages = conv.messages || [];

    // ── STATUS: complete (report generated) ───────────────────────────
    if (status === 'complete' || status === 'paid') {
      const subscribed = await isUserSubscribed(from);

      if (subscribed) {
        // Premium user — answer their question
        await simulateTyping(1200);
        const aiReply = await getAIResponse(messages, userMsg, taxData, 10);
        const updatedMessages = await appendMessage(from, 'user', userMsg);
        await appendMessage(from, 'assistant', aiReply);
        await sendMessage(from, aiReply);
      } else {
        // Free user — nudge to subscribe or reset
        await sendMessage(from,
          `Aapka report already generate ho chuka hai! 📄\n\nAur questions ke liye *₹199/year* subscription lo ya naya report ke liye *"reset"* bhejo.\n\nSubscription ke baare mein baat karein? Reply karo "subscribe" 👇`
        );
      }
      return;
    }

    // ── STATUS: collecting ─────────────────────────────────────────────
    if (status === 'collecting') {

      // First response (yes/haan to start)
      if (step === 0 && messages.length === 0) {
        const isConfirmation = /haan|yes|ha|yeah|sure|ok|okay|start|chalo|haan bhai/i.test(userMsg);
        if (!isConfirmation) {
          // They said something else — still greet but ask to confirm
          await sendMessage(from, `Samajh gaya! 😊 Chalein shuru karein? Bas ek "yes" bhejo aur hum shuru karte hain!`);
          return;
        }

        // Save their first message and ask Q1
        await appendMessage(from, 'user', userMsg);
        await appendMessage(from, 'assistant', QUESTIONS[0].ask);
        await updateConversation(from, { step: 1 });
        await sendMessage(from, QUESTIONS[0].ask);
        return;
      }

      // We're mid-conversation (step 1-10)
      if (step >= 1 && step <= 10) {
        // Save user's answer
        await appendMessage(from, 'user', userMsg);

        // Extract structured data from this answer
        const questionKey = QUESTIONS[step - 1].key;
        const extracted = await extractTaxDataFromAnswer(questionKey, userMsg);
        const updatedTaxData = { ...taxData, ...extracted };

        if (step < 10) {
          // More questions to ask
          const nextQuestion = QUESTIONS[step];

          // Get AI to acknowledge answer and ask next question naturally
          const allMessages = [...messages, { role: 'user', content: userMsg }];
          await simulateTyping(800);
          const aiReply = await getAIResponse(allMessages, userMsg, updatedTaxData, step - 1);

          await appendMessage(from, 'assistant', aiReply);
          await updateConversation(from, {
            step: step + 1,
            tax_data: updatedTaxData,
            messages: [...messages,
              { role: 'user', content: userMsg },
              { role: 'assistant', content: aiReply }
            ]
          });

          await sendMessage(from, aiReply);
        } else {
          // All 10 questions answered — generate analysis!
          await updateConversation(from, { tax_data: updatedTaxData });

          await sendMessage(from, `Shukriya! ✅ Saare answers mil gaye. Ab main aapka personalized tax analysis calculate kar raha hoon...\n\n_Ek minute lagega — chai pi lo_ ☕`);

          try {
            // Generate tax analysis
            const analysis = await generateTaxAnalysis(updatedTaxData);

            // Generate PDF
            const fileName = `report_${from.replace(/\D/g, '')}_${Date.now()}.pdf`;
            const filePath = path.join(REPORTS_DIR, fileName);
            await generateReport(updatedTaxData, analysis, filePath);

            // Build WhatsApp summary message
            const rec = analysis.recommended_regime === 'old' ? 'Old Regime' : 'New Regime';
            const saving = analysis.savings_by_recommended;
            const summaryMsg = buildSummaryMessage(analysis, rec, saving);

            // Send summary + payment pitch
            await sendMessage(from, summaryMsg + SUBSCRIPTION_PITCH);

            // Send PDF
            await simulateTyping(1500);
            await sendDocument(from, filePath,
              `Yeh raha aapka detailed tax report 📄\n\nSave kar lo — sab calculations inside hain!`
            );

            // Create payment link
            const { paymentUrl } = await createPaymentLink(from);
            await simulateTyping(1000);
            await sendMessage(from,
              `Premium subscription ke liye yahan click karo:\n\n${paymentUrl}\n\n*₹199/year — Ek chai ki kimat mein saal bhar tax help* ☕`
            );

            // Mark conversation complete
            await updateConversation(from, {
              status: 'complete',
              step: 10,
              tax_data: updatedTaxData,
            });

          } catch (analysisErr) {
            console.error('[Bot] Analysis error:', analysisErr);
            await sendMessage(from,
              `Ek technical issue aa gaya yaar 😅 Thoda wait karo, main manually check karke bhejta hoon.\n\nDobara try karne ke liye "reset" bhejo.`
            );
          }
        }

        return;
      }
    }

    // Fallback — shouldn't reach here
    await sendMessage(from, `Kuch samajh nahi aaya 😅 "reset" bhejo aur fresh start karte hain!`);

  } catch (err) {
    console.error('[Bot] Unhandled error:', err);
    try {
      await sendMessage(from, `Ek error aa gayi yaar. Thodi der mein dobara try karo ya "reset" bhejo.`);
    } catch {}
  }
}

// ── Build WhatsApp summary ────────────────────────────────────────────────
function buildSummaryMessage(analysis, rec, saving) {
  const lines = [
    `🎉 *Aapka Tax Analysis Ready Hai!*\n`,
    `💰 *Annual Income:* ${rupee(analysis.gross_annual_income)}`,
    ``,
    `📊 *Tax Comparison:*`,
    `• Old Regime Tax: ${rupee(analysis.old_regime.total_tax)}/year`,
    `• New Regime Tax: ${rupee(analysis.new_regime.total_tax)}/year`,
    ``,
    `✅ *Recommendation: ${rec}*`,
    `💵 *Aap bachoge: ${rupee(saving)}/year* (${rupee(Math.round(saving/12))}/month)`,
  ];

  if (analysis.top_tips && analysis.top_tips.length) {
    lines.push('');
    lines.push(`💡 *Quick Tips:*`);
    analysis.top_tips.slice(0, 3).forEach((tip, i) => {
      lines.push(`${i+1}. ${tip}`);
    });
  }

  return lines.join('\n');
}

function rupee(n) {
  if (!n && n !== 0) return '—';
  return '₹' + Number(n).toLocaleString('en-IN');
}

module.exports = { handleIncomingMessage };
