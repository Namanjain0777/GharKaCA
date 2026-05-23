/**
 * GHAR KA CA — TAX CALCULATION ENGINE
 * FY 2025-26 / AY 2026-27
 * Pure functions — no side effects, fully testable
 */

// ─────────────────────────────────────────────────────────────────────────────
// SLABS
// ─────────────────────────────────────────────────────────────────────────────

function calcOldRegimeTax(taxableIncome) {
  if (taxableIncome <= 0) return 0;
  let tax = 0;
  // Slabs
  if (taxableIncome > 1000000) tax += (taxableIncome - 1000000) * 0.30;
  if (taxableIncome > 500000)  tax += (Math.min(taxableIncome, 1000000) - 500000) * 0.20;
  if (taxableIncome > 250000)  tax += (Math.min(taxableIncome, 500000) - 250000) * 0.05;
  // Rebate 87A (old): if income ≤ 5L, tax = 0
  if (taxableIncome <= 500000) tax = 0;
  // Cess 4%
  return Math.round(tax * 1.04);
}

function calcNewRegimeTax(taxableIncome) {
  if (taxableIncome <= 0) return 0;
  let tax = 0;
  // Slabs (Budget 2024 — effective FY 2024-25 onwards)
  if (taxableIncome > 1500000) tax += (taxableIncome - 1500000) * 0.30;
  if (taxableIncome > 1200000) tax += (Math.min(taxableIncome, 1500000) - 1200000) * 0.20;
  if (taxableIncome > 1000000) tax += (Math.min(taxableIncome, 1200000) - 1000000) * 0.15;
  if (taxableIncome > 700000)  tax += (Math.min(taxableIncome, 1000000) - 700000) * 0.10;
  if (taxableIncome > 300000)  tax += (Math.min(taxableIncome, 700000) - 300000) * 0.05;
  // Rebate 87A (new): if income ≤ 7L, tax = 0
  if (taxableIncome <= 700000) tax = 0;
  // Cess 4%
  return Math.round(tax * 1.04);
}

// ─────────────────────────────────────────────────────────────────────────────
// HRA EXEMPTION — u/s 10(13A)
// ─────────────────────────────────────────────────────────────────────────────
function calcHRAExemption({ basicSalaryAnnual, hraReceivedAnnual, rentPaidAnnual, isMetroCity }) {
  if (!rentPaidAnnual || rentPaidAnnual <= 0 || !hraReceivedAnnual) return 0;
  const a = hraReceivedAnnual;                                         // Actual HRA received
  const b = rentPaidAnnual - (basicSalaryAnnual * 0.10);              // Rent - 10% of basic
  const c = basicSalaryAnnual * (isMetroCity ? 0.50 : 0.40);          // 50% / 40% of basic
  return Math.max(0, Math.min(a, b, c));
}

// ─────────────────────────────────────────────────────────────────────────────
// FULL COMPARISON — returns complete breakdown for both regimes
// ─────────────────────────────────────────────────────────────────────────────
function fullTaxComparison(inputs) {
  const {
    grossAnnualSalary = 0,
    hraReceivedMonthly = 0,
    rentPaidMonthly = 0,
    isMetroCity = false,
    basicSalaryMonthly = null,        // if null, estimate as 40% of gross
    investedIn80C = 0,                // actual invested (capped at 1.5L)
    npsExtra80CCD1B = 0,              // extra NPS over 80C (capped at 50K)
    employerNPS80CCD2 = 0,            // employer NPS (allowed in new regime too)
    healthInsuranceSelfFamily = 0,    // 80D self
    healthInsuranceParents = 0,       // 80D parents
    parentsAreSenior = false,
    selfIsSenior = false,
    homeLoanInterest = 0,             // 24(b) capped at 2L
    educationLoanInterest = 0,        // 80E
    donations80G = 0,
    savingsInterest80TTA = 0,         // max 10K (or 50K for senior = 80TTB)
    otherIncome = 0,
    professionalTax = 0,              // usually shown in Form 16
  } = inputs;

  const basic = basicSalaryMonthly
    ? basicSalaryMonthly * 12
    : grossAnnualSalary * 0.40;      // estimate

  const hraAnnual   = hraReceivedMonthly * 12;
  const rentAnnual  = rentPaidMonthly * 12;
  const grossIncome = grossAnnualSalary + otherIncome;

  // ── HRA Exemption ──
  const hraExempt = calcHRAExemption({
    basicSalaryAnnual: basic,
    hraReceivedAnnual: hraAnnual,
    rentPaidAnnual: rentAnnual,
    isMetroCity,
  });

  // ── OLD REGIME ────────────────────────────────────────────────────────────
  const old_std_deduction = 50000;

  const old_80c = Math.min(investedIn80C, 150000);
  const old_80ccd1b = Math.min(npsExtra80CCD1B, 50000);
  const old_80d_self = Math.min(healthInsuranceSelfFamily, selfIsSenior ? 50000 : 25000);
  const old_80d_parents = Math.min(healthInsuranceParents, parentsAreSenior ? 50000 : 25000);
  const old_24b = Math.min(homeLoanInterest, 200000);
  const old_80e = educationLoanInterest; // no limit
  const old_80tta = Math.min(selfIsSenior ? 0 : savingsInterest80TTA, 10000);
  const old_80ttb = selfIsSenior ? Math.min(savingsInterest80TTA, 50000) : 0;
  const old_80g = donations80G * 0.50; // assuming 50% deduction (conservative)
  const old_pt = Math.min(professionalTax, 2500);
  const old_employer_nps = employerNPS80CCD2; // allowed in old too

  const old_total_deductions =
    old_std_deduction + hraExempt + old_80c + old_80ccd1b +
    old_80d_self + old_80d_parents + old_24b + old_80e +
    old_80tta + old_80ttb + old_80g + old_pt + old_employer_nps;

  const old_taxable = Math.max(0, grossIncome - old_total_deductions);
  const old_tax = calcOldRegimeTax(old_taxable);

  // ── NEW REGIME ────────────────────────────────────────────────────────────
  const new_std_deduction = 75000;
  const new_employer_nps = employerNPS80CCD2; // only this allowed

  const new_total_deductions = new_std_deduction + new_employer_nps;
  const new_taxable = Math.max(0, grossIncome - new_total_deductions);
  const new_tax = calcNewRegimeTax(new_taxable);

  // ── RECOMMENDATION ────────────────────────────────────────────────────────
  const recommended = old_tax <= new_tax ? 'old' : 'new';
  const saving = Math.abs(old_tax - new_tax);

  // ── TIPS based on analysis ────────────────────────────────────────────────
  const tips = [];

  if (old_80c < 150000) {
    const gap = 150000 - old_80c;
    tips.push(`Invest ₹${gap.toLocaleString('en-IN')} more in 80C (ELSS recommended) to maximize deduction`);
  }
  if (old_80ccd1b < 50000) {
    tips.push(`Invest ₹${(50000 - old_80ccd1b).toLocaleString('en-IN')} more in NPS Tier-1 for extra ₹50,000 80CCD(1B) deduction`);
  }
  if (hraExempt === 0 && rentAnnual > 0) {
    tips.push(`You pay rent but no HRA from employer — claim 80GG deduction (up to ₹5,000/month)`);
  }
  if (old_80d_self < 25000) {
    tips.push(`Get health insurance to claim full ₹25,000 80D deduction — also protects your family`);
  }
  if (homeLoanInterest === 0 && recommended === 'old') {
    tips.push(`Consider home loan — interest up to ₹2,00,000 is deductible under Section 24(b)`);
  }
  if (recommended === 'new') {
    tips.push(`New regime is better for you — your deductions (₹${old_total_deductions.toLocaleString('en-IN')}) don't overcome the ₹75K standard deduction advantage`);
  }
  if (old_taxable <= 500000 && recommended === 'old') {
    tips.push(`Great news! With old regime your taxable income is ≤ ₹5L — zero tax via 87A rebate!`);
  }

  return {
    inputs: {
      gross_income: grossIncome,
      hra_exemption: hraExempt,
    },
    old_regime: {
      deductions: {
        standard_deduction: old_std_deduction,
        hra_exempt: hraExempt,
        section_80c: old_80c,
        section_80ccd1b: old_80ccd1b,
        employer_nps_80ccd2: old_employer_nps,
        section_80d_self: old_80d_self,
        section_80d_parents: old_80d_parents,
        section_24b_home_loan: old_24b,
        section_80e_edu_loan: old_80e,
        section_80tta_ttb: old_80tta + old_80ttb,
        section_80g_donations: old_80g,
        professional_tax: old_pt,
        total: old_total_deductions,
      },
      taxable_income: old_taxable,
      annual_tax: old_tax,
      monthly_tds: Math.round(old_tax / 12),
    },
    new_regime: {
      deductions: {
        standard_deduction: new_std_deduction,
        employer_nps_80ccd2: new_employer_nps,
        total: new_total_deductions,
      },
      taxable_income: new_taxable,
      annual_tax: new_tax,
      monthly_tds: Math.round(new_tax / 12),
    },
    recommendation: {
      regime: recommended,
      saving_vs_other: saving,
      monthly_saving: Math.round(saving / 12),
      tips,
    }
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// ADVANCE TAX SCHEDULE — who needs to pay and when
// ─────────────────────────────────────────────────────────────────────────────
function advanceTaxSchedule(estimatedAnnualTax) {
  if (estimatedAnnualTax < 10000) {
    return { required: false, reason: 'Advance tax not required — annual tax liability < ₹10,000' };
  }
  return {
    required: true,
    installments: [
      { due: '15 June 2025',     pct: 15, amount: Math.round(estimatedAnnualTax * 0.15) },
      { due: '15 September 2025', pct: 45, amount: Math.round(estimatedAnnualTax * 0.45) },
      { due: '15 December 2025',  pct: 75, amount: Math.round(estimatedAnnualTax * 0.75) },
      { due: '15 March 2026',     pct: 100, amount: estimatedAnnualTax },
    ],
    note: 'Each installment is cumulative. Miss deadline → 1% simple interest per month u/s 234B/234C'
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// SALARY STRUCTURE OPTIMIZER — suggest salary restructuring to reduce TDS
// ─────────────────────────────────────────────────────────────────────────────
function optimizeSalaryStructure(ctcAnnual) {
  const monthly = ctcAnnual / 12;
  // Ideal split to maximize tax-free components
  const basic = ctcAnnual * 0.40;
  const hra   = basic * 0.50;         // 50% of basic (metro) for max HRA
  const lta   = 20000;                // ₹20,000/year (block of 2)
  const nps_employer = basic * 0.10;  // 10% of basic — employer NPS, tax free
  const special = ctcAnnual - basic - hra - lta - nps_employer;

  return {
    recommended_structure: {
      basic_da:         { annual: Math.round(basic),          note: '40% of CTC — basis for PF, HRA, Gratuity' },
      hra:              { annual: Math.round(hra),             note: '50% of Basic (metro) — partially tax-free if renting' },
      lta:              { annual: lta,                          note: 'Claim 2x in 2-yr block. Submit travel bills.' },
      employer_nps:     { annual: Math.round(nps_employer),   note: '10% of Basic — tax free even in New Regime u/s 80CCD(2)' },
      special_allowance:{ annual: Math.round(special),        note: 'Fully taxable but needed to make up CTC' },
    },
    tip: 'Ask HR to restructure if your CTC allows flexibility. NPS employer contribution saves the most tax.'
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// FORM-WISE TAX DATA MAPPER — given user answers, map to ITR-1 field values
// ─────────────────────────────────────────────────────────────────────────────
function mapToITR1Fields(taxData, analysis) {
  const old = analysis.old_regime;
  const rec = analysis.recommendation.regime === 'old' ? old : analysis.new_regime;

  return {
    // Schedule S
    salary_17_1: taxData.gross_annual_salary || 0,
    exemptions_u10: old.deductions.hra_exempt,
    standard_deduction: rec === old ? 50000 : 75000,
    income_from_salary: (taxData.gross_annual_salary || 0) - (old.deductions.hra_exempt) - (rec === old ? 50000 : 75000),

    // Schedule VI-A (old regime)
    d_80c: old.deductions.section_80c,
    d_80ccd1b: old.deductions.section_80ccd1b,
    d_80d_self: old.deductions.section_80d_self,
    d_80d_parents: old.deductions.section_80d_parents,
    d_24b: old.deductions.section_24b_home_loan,
    d_80e: old.deductions.section_80e_edu_loan,
    d_80tta: old.deductions.section_80tta_ttb,
    total_deductions: old.deductions.total,

    // Part B-TTI
    gross_total_income: analysis.inputs.gross_income,
    total_income_old: old.taxable_income,
    total_income_new: analysis.new_regime.taxable_income,
    tax_payable_old: old.annual_tax,
    tax_payable_new: analysis.new_regime.annual_tax,
    recommended_regime: analysis.recommendation.regime,
    saving: analysis.recommendation.saving_vs_other,
  };
}

module.exports = {
  calcOldRegimeTax,
  calcNewRegimeTax,
  calcHRAExemption,
  fullTaxComparison,
  advanceTaxSchedule,
  optimizeSalaryStructure,
  mapToITR1Fields,
};
