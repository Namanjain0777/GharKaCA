require('dotenv').config();
const Anthropic = require('@anthropic-ai/sdk');

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// ── The 10 Questions ───────────────────────────────────────────────────────
const QUESTIONS = [
  {
    key: 'monthly_salary',
    ask: `Ek basic sawal se shuru karte hain 😊\n\nAapki monthly salary (take-home ya CTC) approximately kitni hai?\n\n_(Example: ₹45,000 ya 45k likho)_`,
  },
  {
    key: 'rent_situation',
    ask: `Kya aap rented house mein rehte ho ya apne ghar mein?\n\nAgar rent pe ho toh monthly rent kitna dete ho?\n\n_(Example: "rented, ₹12,000" ya "apna ghar")_`,
  },
  {
    key: 'hra_from_employer',
    ask: `Kya aapki salary slip mein HRA (House Rent Allowance) alag se mention hai?\n\nAgar pata ho toh monthly HRA amount bhi batao.\n\n_(Example: "haan, ₹8,000/month" ya "nahi pata")_`,
  },
  {
    key: 'investments_80c',
    ask: `Abhi tak is financial year mein 80C investments kiye hain? 🏦\n\nInmein count hota hai:\n• LIC premium\n• PPF\n• ELSS mutual funds\n• EPF (employer bhi daalta hai)\n• Home loan principal\n• Kids ki school fees\n\nTotal kitna hua approximately?`,
  },
  {
    key: 'health_insurance',
    ask: `Kya aapke ya family ke liye health insurance (mediclaim) liya hua hai? 🏥\n\nYearly premium kitna dete ho?\n\n_(Agar parents ka bhi hai toh woh bhi batao — alag deduction milta hai)_`,
  },
  {
    key: 'home_loan',
    ask: `Koi home loan chal raha hai? 🏠\n\nAgar hai toh is saal interest component approximately kitna tha?\n\n_(Bank ka statement dekh sakte ho — "interest paid" section)_`,
  },
  {
    key: 'other_deductions',
    ask: `Koi aur deductions hain?\n\n• NPS (National Pension System) — 80CCD(1B) — extra ₹50,000 deduction\n• Education loan interest — 80E\n• Donations — 80G\n\nAgar kuch nahi toh "nahi" likho — bilkul theek hai 👍`,
  },
  {
    key: 'other_income',
    ask: `Salary ke alawa koi aur income hai? 💰\n\n• Freelancing / side projects\n• Rent from property\n• FD interest / savings interest\n• Dividend income\n\n_(Agar nahi hai toh "nahi" likho)_`,
  },
  {
    key: 'employer_regime',
    ask: `Ek important sawal — kya aapke employer ne pehle se koi tax regime choose kiya hua hai?\n\nOld regime ya New regime — kya pata hai?\n\n_(Agar nahi pata toh "pata nahi" likho — hum recommend karenge)_`,
  },
  {
    key: 'city',
    ask: `Last question! 🎉\n\nAap kaunse city mein rehte ho?\n\n_(Delhi / Noida / Gurugram / Mumbai / Bangalore / other — HRA calculation ke liye zaroori hai)_`,
  },
];

// ── Master System Prompt ───────────────────────────────────────────────────
const SYSTEM_PROMPT = `You are "Ghar Ka CA" — a friendly, knowledgeable Indian tax advisor chatbot on WhatsApp.

## Your Personality
- Friendly and conversational, like a knowledgeable dost (friend) who happens to know Indian tax law
- Mix Hindi and English naturally (Hinglish) — not forced, just natural like how Delhi people talk
- Use emojis sparingly but warmly
- Keep responses SHORT (under 150 words per message) — this is WhatsApp, not email
- Never be condescending. The user is smart, they just don't know tax rules.

## Your Expertise (India FY 2025-26 / AY 2026-27)
- Income Tax slabs: Old Regime vs New Regime (post Budget 2024)
- NEW REGIME slabs: Up to ₹3L = 0%, ₹3-7L = 5%, ₹7-10L = 10%, ₹10-12L = 15%, ₹12-15L = 20%, Above ₹15L = 30%
- NEW REGIME: Standard Deduction ₹75,000. No other deductions except NPS employer contribution.
- NEW REGIME: Rebate u/s 87A — if income ≤ ₹7L, zero tax payable (effectively)
- OLD REGIME slabs: Up to ₹2.5L = 0%, ₹2.5-5L = 5%, ₹5-10L = 20%, Above ₹10L = 30%
- OLD REGIME: Standard Deduction ₹50,000. All deductions apply (80C, 80D, HRA, 24B etc.)
- Section 80C: Max ₹1,50,000 deduction (ELSS, PPF, EPF, LIC, home loan principal, school fees)
- Section 80D: Self+family ₹25,000, parents (non-senior) ₹25,000, parents (senior) ₹50,000
- HRA Exemption: Min of (actual HRA received, rent paid minus 10% salary, 50% salary for metro/40% for non-metro)
- Section 24B: Home loan interest up to ₹2,00,000 for self-occupied property
- Section 80CCD(1B): Additional NPS ₹50,000 over 80C limit
- Section 80E: Education loan interest (no limit, for 8 years)
- Health & Education Cess: 4% on total tax
- Surcharge: Applicable on income above ₹50L

## Important Rules
- Always calculate BOTH old and new regime and tell which saves more with EXACT RUPEE DIFFERENCE
- When recommending investments, recommend CATEGORIES not specific fund names (AMFI compliance)
- Always add: "Yeh educational information hai — final filing ke liye ek CA se zaroor milna"
- If user asks about something you're not sure about, say so honestly
- Never ask users for PAN, Aadhaar, or bank account numbers
- Tax laws can change — always mention the financial year you're calculating for

## Conversation Flow
You are currently in FREE REPORT mode. After collecting all tax data, you will:
1. Calculate exact tax in both regimes
2. Recommend which regime to choose with exact savings
3. Give 3-5 specific actionable steps to reduce tax further
4. Offer the ₹199/year subscription for unlimited follow-up questions

## Tone Examples
GOOD: "Bhai, Old Regime mein tumhara ₹18,400 bachega! HRA aur 80C milke ₹2.7L ka deduction ban raha hai tere liye 🎉"
BAD: "Based on your inputs, Old Tax Regime results in lower tax liability."

GOOD: "Ek chiz check karo — kya tere employer ne Form 16 mein HRA alag se show kiya hai?"
BAD: "Please verify whether your employer has disclosed HRA separately in Form 16."`;

// ── Conversation Logic ─────────────────────────────────────────────────────

/**
 * Get AI response for a user message
 * @param {Array} messages - Full conversation history [{role, content}]
 * @param {string} userMessage - Latest user message
 * @param {Object} taxData - Collected tax answers so far
 * @param {number} step - Current question step (0-9, or 10 = analysis)
 */
async function getAIResponse(messages, userMessage, taxData, step) {
  // Build context for Claude
  const contextNote = step < 10
    ? `\n\n[SYSTEM NOTE: User is on question ${step + 1}/10. Questions answered so far: ${JSON.stringify(taxData)}. The next question to ask after processing this answer is question ${step + 1} (0-indexed). Extract the answer from user's message, acknowledge it warmly in 1-2 sentences, then ask the next question naturally.]`
    : `\n\n[SYSTEM NOTE: All 10 questions answered. Tax data collected: ${JSON.stringify(taxData)}. Now generate the FULL TAX ANALYSIS REPORT in WhatsApp format. Calculate both regimes, show exact numbers, give recommendation, and end with subscription pitch for ₹199/year for unlimited questions.]`;

  const systemWithContext = SYSTEM_PROMPT + contextNote;

  // Add current user message to history
  const fullMessages = [...messages, { role: 'user', content: userMessage }];

  const response = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1000,
    system: systemWithContext,
    messages: fullMessages,
  });

  return response.content[0].text;
}

/**
 * Extract tax data from user's answer to a specific question
 */
async function extractTaxDataFromAnswer(questionKey, userAnswer) {
  const extraction = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 200,
    system: `You extract structured data from user answers about Indian taxes. Return ONLY valid JSON, no explanation. If value is unclear, use null. For amounts, always return as numbers (in rupees, monthly). For yes/no, return boolean. For text fields, return string.`,
    messages: [{
      role: 'user',
      content: `Question key: "${questionKey}"\nUser's answer: "${userAnswer}"\n\nExtract the value and return JSON like: {"${questionKey}": <extracted_value>}`
    }]
  });

  try {
    const text = extraction.content[0].text.trim();
    const clean = text.replace(/```json|```/g, '').trim();
    return JSON.parse(clean);
  } catch {
    return { [questionKey]: userAnswer }; // fallback to raw text
  }
}

/**
 * Generate the final tax analysis as a structured object (for PDF)
 */
async function generateTaxAnalysis(taxData) {
  const response = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 2000,
    system: `You are an Indian tax calculation engine. Calculate taxes accurately for FY 2025-26. Return ONLY valid JSON, no explanation or markdown.`,
    messages: [{
      role: 'user',
      content: `Tax data: ${JSON.stringify(taxData)}

Calculate and return JSON with this exact structure:
{
  "gross_annual_income": number,
  "old_regime": {
    "total_deductions": number,
    "deductions_breakdown": { "standard_deduction": number, "80c": number, "80d": number, "hra": number, "home_loan_interest": number, "other": number },
    "taxable_income": number,
    "tax_before_cess": number,
    "cess": number,
    "total_tax": number,
    "monthly_tds": number
  },
  "new_regime": {
    "total_deductions": number,
    "taxable_income": number,
    "tax_before_cess": number,
    "cess": number,
    "total_tax": number,
    "monthly_tds": number
  },
  "recommended_regime": "old" or "new",
  "savings_by_recommended": number,
  "top_tips": ["tip1", "tip2", "tip3"],
  "form16_notes": "brief note about what to check in Form 16",
  "investment_suggestions": ["suggestion1", "suggestion2"]
}`
    }]
  });

  try {
    const text = response.content[0].text.trim();
    const clean = text.replace(/```json|```/g, '').trim();
    return JSON.parse(clean);
  } catch (e) {
    throw new Error('Tax analysis generation failed: ' + e.message);
  }
}

module.exports = {
  QUESTIONS,
  getAIResponse,
  extractTaxDataFromAnswer,
  generateTaxAnalysis,
};
