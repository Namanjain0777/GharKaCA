/**
 * GHAR KA CA — BROADCAST MESSAGE TEMPLATES
 * Use via Admin Dashboard → Broadcast
 * Tax season calendar + engagement messages
 */

const BROADCAST_TEMPLATES = {

  // ── JANUARY — Investment Proof Deadline ──────────────────────────────────
  jan_investment_proof: {
    name: "January — Investment Proof Deadline",
    timing: "Send first week of January",
    target: "all",
    message: `🚨 *Investment Proof Deadline Alert!*

Bhai/Behen, January mein bohot saare companies apne employees se investment proofs maangti hain!

Agar aapne submit nahi kiya toh employer February-March mein DOUBLE TDS kaat lega!

Abhi check karo:
✅ 80C proofs ready? (LIC receipt, PPF statement, ELSS statement)
✅ Health insurance certificate?
✅ Rent receipts January tak?
✅ Home loan interest certificate?

Koi doubt ho toh reply karo — main help karunga! 💪

_Ghar Ka CA — Aapka tax dost_`
  },

  // ── FEBRUARY — Budget Update ──────────────────────────────────────────────
  feb_budget_update: {
    name: "February — Union Budget Update",
    timing: "Send day of / day after Budget",
    target: "all",
    message: `📣 *Union Budget 2026 — Tax Changes Update!*

Aaj Budget announce hua — main sab changes check kar raha hoon aur aapke liye explain karunga!

Jo bhi naya aaya hai tax mein, main yahan update kar dunga:
• New tax slabs (agar koi change hua)
• New deductions (agar announce hua)
• 80C / 80D changes

Koi bhi sawaal puchhein! Budget ke baad planning karna better hai 📊

_Ghar Ka CA_`
  },

  // ── MARCH — Year End Planning ──────────────────────────────────────────────
  march_yearend: {
    name: "March — Last Chance to Invest",
    timing: "Send 1st and 15th March",
    target: "free",
    message: `⏰ *31 March aane wala hai — Last chance for tax savings!*

FY 2025-26 khatam ho raha hai! Agar abhi tak 80C investments nahi ki, toh time kam hai!

Abhi bhi kar sakte ho:
• ELSS Mutual Fund — 3 saal lock-in, returns 12-15%
• PPF Contribution — 7.1% guaranteed
• NPS Tier-1 — extra ₹50,000 deduction u/s 80CCD(1B)
• Life Insurance premium

Ek baar report run karo — main bataunga *exact* kitna invest karna hai aur kitna bachega! 

Reply "hisaab" karein 👇

_Ghar Ka CA_`
  },

  // ── APRIL — New Year Planning ─────────────────────────────────────────────
  april_newyear: {
    name: "April — New Financial Year Planning",
    timing: "Send first week of April",
    target: "subscribed",
    message: `🎉 *Naya Financial Year Mubarak! FY 2026-27 shuru ho gaya!*

Sahi time hai planning shuru karne ka — saal ke shuru mein karein toh zyada faayda hoga!

April mein kya karein:
1️⃣ Form 12BB employer ko submit karein (investment declaration)
2️⃣ SIP shuru karein ELSS mein — monthly thoda thoda = bada 80C
3️⃣ Health insurance renew karein agar expire hua
4️⃣ NPS Tier-1 account open karein agar nahi hai

Is saal ka tax plan banana hai? Reply "plan" karein! 📊

_Ghar Ka CA Premium_`
  },

  // ── JUNE — ITR Filing Season ──────────────────────────────────────────────
  june_itr_season: {
    name: "June — ITR Filing Season Opens",
    timing: "Send mid-June",
    target: "all",
    message: `📄 *ITR Filing Season Open Ho Gayi — AY 2026-27!*

Form 16 aaya? ITR filing portal live hai!

*Due Date: 31 July 2026* — miss mat karna warna ₹5,000 penalty!

Main help kar sakta hoon:
✅ Kaunsa ITR form file karein (ITR-1 / ITR-2 / ITR-4)
✅ Form 16 kaise padein — Part A aur Part B explain
✅ Kaunsa regime choose karein
✅ Step by step filing guide

Abhi reply karein: "ITR help" 👇

_Ghar Ka CA_`
  },

  // ── JULY — Deadline Reminder ──────────────────────────────────────────────
  july_deadline: {
    name: "July — Final Deadline Warning",
    timing: "Send 24th July",
    target: "all",
    message: `🚨 *LAST 7 DAYS — ITR Filing Deadline 31 July!*

Agar abhi tak ITR file nahi ki hai — please aaj hi karein!

Miss kiya toh:
❌ ₹1,000 – ₹5,000 late fee under Section 234F
❌ Refund delayed by months
❌ Carry forward losses not allowed
❌ Some deductions may be disallowed

5 minute mein hota hai agar documents ready hain. 

Reply "help" — main step by step guide karunga! 📱

_Ghar Ka CA_`
  },

  // ── SEPTEMBER — Advance Tax Reminder ─────────────────────────────────────
  sep_advance_tax: {
    name: "September — Advance Tax Reminder",
    timing: "Send 12th September",
    target: "all",
    message: `💰 *Advance Tax Deadline: 15 September!*

Agar aapki annual tax liability ₹10,000 se zyada hai aur employer poora TDS nahi kaat raha (freelancers, rental income wale) — toh advance tax bharna zaroori hai!

Miss kiya toh 1% per month interest penalty!

Check karo:
• Freelancing income hai?
• Rent income hai?
• Capital gains hain?

Agar haan — reply karein, main calculation karke bataunga kitna bharna hai! 📊

_Ghar Ka CA_`
  },

  // ── UPSELL — Free to Premium ─────────────────────────────────────────────
  upsell_premium: {
    name: "Upsell — Free to Paid",
    timing: "Send after user completes free report",
    target: "free",
    message: `🌟 *Ghar Ka CA Premium — Sirf ₹199/year!*

Aapne free report use kiya — shukriya! 🙏

Lekin tax season mein sawaal aते रहते हैं:
• Employer ne galat TDS kaata?
• New job — kya karna hai?
• Rent bada hua — HRA recalculate?
• Budget mein kuch change hua?

*Premium mein milta hai:*
✅ Poore saal unlimited sawaal
✅ Budget changes ka instant update
✅ ITR filing guide
✅ 30-min CA call (₹499 plan)

Ek chai ki kimat mein poora saal ka tax advisor ☕

Subscribe: [PAYMENT_LINK]

_Ghar Ka CA_`
  }
};

// ── Message builder with personalisation ─────────────────────────────────────
function buildBroadcast(templateKey, personalData = {}) {
  const template = BROADCAST_TEMPLATES[templateKey];
  if (!template) return null;

  let msg = template.message;
  // Replace placeholders
  Object.entries(personalData).forEach(([key, val]) => {
    msg = msg.replace(new RegExp(`\\[${key}\\]`, 'g'), val);
  });
  return msg;
}

// ── Tax season schedule ───────────────────────────────────────────────────────
const TAX_SEASON_CALENDAR = [
  { month: 'January',   event: 'Investment proof submission to employer',         urgency: 'HIGH',   template: 'jan_investment_proof' },
  { month: 'February',  event: 'Union Budget — tax changes announced',             urgency: 'HIGH',   template: 'feb_budget_update' },
  { month: 'March',     event: 'FY ends March 31 — last chance for 80C',          urgency: 'HIGH',   template: 'march_yearend' },
  { month: 'April',     event: 'New FY starts — plan for the year',               urgency: 'MEDIUM', template: 'april_newyear' },
  { month: 'May',       event: 'Form 16 issued by employers (by 15 June)',        urgency: 'LOW',    template: null },
  { month: 'June',      event: 'ITR filing season opens — Form 16 received',      urgency: 'HIGH',   template: 'june_itr_season' },
  { month: 'July 31',   event: '*** ITR FILING DEADLINE ***',                     urgency: 'CRITICAL', template: 'july_deadline' },
  { month: 'September', event: 'Advance tax 3rd installment (75% by 15 Sep)',    urgency: 'MEDIUM', template: 'sep_advance_tax' },
  { month: 'December',  event: 'Advance tax 3rd installment (75% by 15 Dec)',    urgency: 'MEDIUM', template: null },
  { month: 'March 15',  event: 'Advance tax final installment (100% by 15 Mar)', urgency: 'MEDIUM', template: null },
];

module.exports = { BROADCAST_TEMPLATES, buildBroadcast, TAX_SEASON_CALENDAR };
