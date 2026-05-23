/**
 * INDIAN GOVERNMENT TAX FORMS — COMPLETE STRUCTURED DATA
 * FY 2025-26 / AY 2026-27
 * Source: CBDT / Income Tax Department India
 *
 * Covers:
 *  - ITR-1 (SAHAJ)   — Salaried individuals, income ≤ ₹50L
 *  - ITR-2           — Capital gains, foreign assets, multiple house properties
 *  - ITR-4 (SUGAM)   — Presumptive taxation (freelancers, small biz)
 *  - Form 16         — TDS Certificate from Employer (Part A + Part B)
 *  - Form 26AS       — Tax Credit Statement
 *  - Form 12BB       — Investment Declaration (to employer)
 *  - Form 15G/15H    — No TDS declaration
 */

// ─────────────────────────────────────────────────────────────────────────────
// TAX SLABS AY 2026-27
// ─────────────────────────────────────────────────────────────────────────────
const TAX_SLABS = {
  new_regime: {
    name: "New Tax Regime (Default)",
    ay: "2026-27",
    standard_deduction: 75000,
    rebate_87a_limit: 700000, // income ≤ ₹7L → zero tax
    rebate_87a_amount: 25000,
    slabs: [
      { from: 0,       to: 300000,  rate: 0,    label: "Up to ₹3,00,000" },
      { from: 300001,  to: 700000,  rate: 0.05, label: "₹3,00,001 – ₹7,00,000" },
      { from: 700001,  to: 1000000, rate: 0.10, label: "₹7,00,001 – ₹10,00,000" },
      { from: 1000001, to: 1200000, rate: 0.15, label: "₹10,00,001 – ₹12,00,000" },
      { from: 1200001, to: 1500000, rate: 0.20, label: "₹12,00,001 – ₹15,00,000" },
      { from: 1500001, to: Infinity, rate: 0.30, label: "Above ₹15,00,000" },
    ],
    allowed_deductions: ["standard_deduction", "employer_nps_80ccd2"],
    disallowed_deductions: ["80C", "80D", "HRA", "24B", "80E", "80G", "80TTA"],
    notes: "Default regime from FY 2023-24 onwards. No deductions except Standard Deduction & Employer NPS."
  },
  old_regime: {
    name: "Old Tax Regime",
    ay: "2026-27",
    standard_deduction: 50000,
    rebate_87a_limit: 500000,
    rebate_87a_amount: 12500,
    slabs: [
      { from: 0,       to: 250000,  rate: 0,    label: "Up to ₹2,50,000" },
      { from: 250001,  to: 500000,  rate: 0.05, label: "₹2,50,001 – ₹5,00,000" },
      { from: 500001,  to: 1000000, rate: 0.20, label: "₹5,00,001 – ₹10,00,000" },
      { from: 1000001, to: Infinity, rate: 0.30, label: "Above ₹10,00,000" },
    ],
    surcharge: [
      { above: 5000000,  rate: 0.10 },
      { above: 10000000, rate: 0.15 },
      { above: 20000000, rate: 0.25 },
      { above: 50000000, rate: 0.37 },
    ],
    cess: 0.04, // Health & Education Cess on all income tax
    notes: "All deductions available. Better for those with high 80C + HRA + home loan."
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// DEDUCTIONS REFERENCE
// ─────────────────────────────────────────────────────────────────────────────
const DEDUCTIONS = {
  "80C": {
    section: "80C",
    name: "Investments & Savings",
    max_limit: 150000,
    description: "Investments in LIC, PPF, ELSS, EPF, NSC, home loan principal, school fees, FD (5yr)",
    instruments: [
      { name: "ELSS Mutual Funds", recommended: true, returns: "12-15% historical", lock_in: "3 years" },
      { name: "PPF (Public Provident Fund)", recommended: true, returns: "7.1% p.a.", lock_in: "15 years" },
      { name: "NPS (National Pension System)", recommended: true, returns: "8-10% historical", lock_in: "Till 60" },
      { name: "EPF (Employee Provident Fund)", recommended: true, returns: "8.25% p.a.", lock_in: "Till retirement" },
      { name: "NSC (National Savings Certificate)", recommended: false, returns: "7.7% p.a.", lock_in: "5 years" },
      { name: "ULIP", recommended: false, returns: "Variable", lock_in: "5 years", caution: "High charges" },
      { name: "LIC Endowment Plans", recommended: false, returns: "4-6%", lock_in: "Premium term", caution: "Very low returns — avoid" },
      { name: "5-Year Tax Saving FD", recommended: false, returns: "6.5-7%", lock_in: "5 years" },
      { name: "Home Loan Principal", returns: "N/A", note: "EMI principal component counts" },
      { name: "Children School Fees", returns: "N/A", note: "Tuition fees only, not development fees" },
      { name: "Sukanya Samriddhi Yojana", recommended: true, returns: "8.2% p.a.", note: "For girl child only" },
    ]
  },
  "80CCD1B": {
    section: "80CCD(1B)",
    name: "Additional NPS Contribution",
    max_limit: 50000,
    description: "Additional ₹50,000 deduction over and above 80C limit for NPS Tier-1 contributions",
    note: "This is OVER and ABOVE the ₹1.5L 80C limit — effectively you can claim ₹2L total"
  },
  "80CCD2": {
    section: "80CCD(2)",
    name: "Employer NPS Contribution",
    max_limit: "10% of Basic Salary",
    description: "Employer's contribution to employee's NPS account — available even in New Regime",
    note: "Allowed in BOTH old and new regime"
  },
  "80D": {
    section: "80D",
    name: "Health Insurance Premium",
    limits: {
      self_family_below60: 25000,
      self_family_above60: 50000,
      parents_below60: 25000,
      parents_above60: 50000,
      preventive_health_checkup: 5000, // included within above limits
    },
    max_possible: 100000, // self (senior) + parents (senior)
    description: "Premium paid for health/medical insurance for self, spouse, children, dependent parents"
  },
  "HRA": {
    section: "10(13A)",
    name: "House Rent Allowance",
    description: "Exemption on HRA received from employer for rent paid",
    calculation: "Minimum of: (1) Actual HRA received, (2) Rent paid minus 10% of Basic Salary, (3) 50% of Basic for metro / 40% for non-metro",
    metro_cities: ["Delhi", "Mumbai", "Chennai", "Kolkata"],
    documents_needed: ["Rent receipts", "Rent agreement", "Landlord PAN if rent > ₹1L/year"],
    note: "Only if you pay rent AND receive HRA from employer"
  },
  "24B": {
    section: "24(b)",
    name: "Home Loan Interest",
    max_limit: 200000,
    description: "Interest paid on home loan for self-occupied property",
    note: "For let-out property, actual interest (no limit). For under-construction, deduction starts after possession.",
    additional: "Principal repayment goes under 80C"
  },
  "80E": {
    section: "80E",
    name: "Education Loan Interest",
    max_limit: "No limit",
    description: "Interest on loan taken for higher education (self, spouse, children)",
    duration: "8 years from year of first repayment",
    note: "Only INTEREST — not principal. Courses: any recognized full-time course after Class 12."
  },
  "80G": {
    section: "80G",
    name: "Donations to Charitable Institutions",
    description: "Deduction for donations to approved funds/institutions",
    types: [
      { name: "PM National Relief Fund, Army etc.", deduction: "100% without limit" },
      { name: "Most approved NGOs", deduction: "50% with 10% of adjusted gross income limit" },
    ]
  },
  "80TTA": {
    section: "80TTA",
    name: "Savings Account Interest",
    max_limit: 10000,
    description: "Interest income from savings bank accounts (not FD). For non-senior citizens.",
  },
  "80TTB": {
    section: "80TTB",
    name: "Interest Income (Senior Citizens)",
    max_limit: 50000,
    description: "Interest from deposits (savings + FD + RD) for senior citizens aged 60+",
    note: "Replaces 80TTA for senior citizens"
  },
  "standard_deduction": {
    name: "Standard Deduction",
    old_regime: 50000,
    new_regime: 75000,
    description: "Flat deduction from salary/pension. No proof required.",
    note: "Increased to ₹75,000 in New Regime from FY 2023-24 (Budget 2024)"
  },
  "professional_tax": {
    section: "16(iii)",
    name: "Professional Tax",
    description: "Professional tax deducted by employer (state-specific). Usually ₹200-2400/year.",
    note: "Shown in Form 16. Auto-deducted from salary."
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// ITR-1 (SAHAJ) — Complete Form Structure
// ─────────────────────────────────────────────────────────────────────────────
const ITR1_SAHAJ = {
  form_name: "ITR-1",
  popular_name: "SAHAJ",
  ay: "2026-27",
  fy: "2025-26",
  due_date: "31st July 2026",
  belated_due_date: "31st December 2026",
  filing_url: "https://www.incometax.gov.in/iec/foportal/",

  who_can_file: [
    "Resident individual (not NRI or RNOR)",
    "Total income up to ₹50 lakh",
    "Income from salary or pension",
    "Income from up to TWO house properties (new for AY 2026-27)",
    "Income from other sources (interest, dividends, family pension)",
    "Long-term capital gains u/s 112A up to ₹1.25 lakh (no brought-forward loss)",
    "Agricultural income up to ₹5,000",
  ],
  who_cannot_file: [
    "NRI / RNOR / Not Ordinarily Resident",
    "Director in a company",
    "Held unlisted equity shares at any time during the year",
    "Has foreign assets or foreign income",
    "Has income from business or profession",
    "Capital gains above ₹1.25L or has brought-forward capital losses",
    "More than two house properties",
    "Total income above ₹50 lakh",
    "Has signing authority in foreign account",
    "Claims foreign tax credit",
    "Has unexplained income/assets",
  ],

  parts: {
    PART_A: {
      name: "Part A — General Information",
      fields: [
        { id: "PAN", label: "Permanent Account Number (PAN)", type: "text", required: true, format: "AAAAA9999A" },
        { id: "first_name", label: "First Name", type: "text", required: true },
        { id: "middle_name", label: "Middle Name", type: "text" },
        { id: "last_name", label: "Last Name / Surname", type: "text", required: true },
        { id: "dob", label: "Date of Birth", type: "date", required: true, format: "DD/MM/YYYY" },
        { id: "aadhaar", label: "Aadhaar Number / Enrolment ID", type: "text", required: true },
        { id: "gender", label: "Gender", type: "select", options: ["M - Male", "F - Female", "T - Transgender"] },
        { id: "father_name", label: "Father's Name", type: "text", required: true },
        { id: "flat_door", label: "Flat/Door/Block No.", type: "text" },
        { id: "premises_name", label: "Name of Premises/Building", type: "text" },
        { id: "road_street", label: "Road/Street/Lane", type: "text" },
        { id: "area_locality", label: "Area/Locality", type: "text" },
        { id: "town_city", label: "Town/City/District", type: "text", required: true },
        { id: "state", label: "State/UT", type: "select", required: true },
        { id: "pin", label: "PIN Code", type: "text", required: true, format: "6 digits" },
        { id: "mobile", label: "Mobile Number", type: "tel", required: true },
        { id: "email", label: "Email Address", type: "email", required: true },
        { id: "filing_status", label: "Return Filing Status", type: "select", options: ["11 - Original Return", "17 - Revised Return", "14 - Defective Return", "12 - Return in response to notice u/s 142(1)"] },
        { id: "residential_status", label: "Residential Status", type: "select", options: ["RES - Resident", "NOR - Not Ordinarily Resident", "NRI - Non-Resident"] },
        { id: "tax_regime", label: "Tax Regime Opted", type: "select", options: ["New Regime (Default)", "Old Regime (Form 10-IEA required)"], required: true },
        { id: "employer_category", label: "Employer Category", type: "select", options: ["GOV - Government", "PSU - Public Sector Undertaking", "PE - Pensioners", "OTH - Others", "NA - Not Applicable"] },
      ]
    },

    SCHEDULE_S: {
      name: "Schedule S — Income from Salary",
      fields: [
        { id: "employer_name", label: "Name of Employer", type: "text", required: true, source: "Form 16" },
        { id: "employer_tan", label: "TAN of Employer", type: "text", required: true, format: "AAAA99999A", source: "Form 16" },
        { id: "employer_category", label: "Employer Category", type: "select" },
        { id: "salary_17_1", label: "Salary u/s 17(1) — Basic + DA + all allowances", type: "number", required: true, source: "Form 16 Part B — Annexure" },
        { id: "perquisites_17_2", label: "Perquisites u/s 17(2) — Non-cash benefits", type: "number", source: "Form 16 Part B" },
        { id: "profits_17_3", label: "Profits in lieu of salary u/s 17(3)", type: "number", source: "Form 16 Part B" },
        { id: "gross_salary", label: "Gross Salary [17(1)+17(2)+17(3)]", type: "number", calculated: true },
        { id: "exemptions_10", label: "Allowances exempt u/s 10", type: "number", note: "HRA, LTA, Children Education Allowance etc." },
        { id: "net_salary", label: "Net Salary [Gross – Exemptions]", type: "number", calculated: true },
        { id: "standard_deduction_16ia", label: "Standard Deduction u/s 16(ia) — ₹50,000 old / ₹75,000 new", type: "number", auto_fill: true },
        { id: "entertainment_allowance_16ii", label: "Entertainment Allowance u/s 16(ii)", type: "number", note: "Only for Government employees" },
        { id: "professional_tax_16iii", label: "Professional Tax u/s 16(iii)", type: "number", source: "Form 16" },
        { id: "income_from_salary", label: "Income from Salary [Net Salary – Deductions]", type: "number", calculated: true, bold: true },
      ]
    },

    SCHEDULE_HP: {
      name: "Schedule HP — Income from House Property",
      max_properties: 2,
      fields_per_property: [
        { id: "property_address", label: "Address of Property", type: "textarea" },
        { id: "property_type", label: "Type of Property", type: "select", options: ["SOP - Self Occupied", "LOP - Let Out", "DLOP - Deemed Let Out"] },
        { id: "co_owner", label: "Is property co-owned?", type: "boolean" },
        { id: "gross_rent_receivable", label: "Gross Annual Rent Receivable (if let-out)", type: "number" },
        { id: "property_tax_paid", label: "Municipal/Property Tax Paid", type: "number" },
        { id: "annual_value", label: "Annual Value [Rent – Property Tax]", type: "number", calculated: true },
        { id: "std_deduction_30pct", label: "30% Standard Deduction on Annual Value u/s 24(a)", type: "number", auto_fill: true },
        { id: "interest_on_loan", label: "Interest on Loan for Property u/s 24(b)", type: "number", max: 200000, note: "Max ₹2L for self-occupied. No limit for let-out." },
        { id: "income_from_hp", label: "Income from House Property [Annual Value – Deductions]", type: "number", calculated: true, bold: true },
      ]
    },

    SCHEDULE_OS: {
      name: "Schedule OS — Income from Other Sources",
      fields: [
        { id: "savings_interest", label: "Interest from Savings Bank Account", type: "number", source: "Bank Passbook / Form 26AS" },
        { id: "fd_interest", label: "Interest from Fixed Deposits / NSC", type: "number", source: "Bank Statement / Form 16A" },
        { id: "family_pension", label: "Family Pension Received", type: "number" },
        { id: "dividend_income", label: "Dividend Income from Shares/MF", type: "number", source: "DMAT Account / AIS" },
        { id: "other_income", label: "Any Other Income (specify)", type: "number" },
        { id: "gross_total_os", label: "Total Income from Other Sources", type: "number", calculated: true, bold: true },
        { id: "deductions_57", label: "Deductions u/s 57 (if any)", type: "number" },
        { id: "net_income_os", label: "Net Income from Other Sources", type: "number", calculated: true },
      ]
    },

    SCHEDULE_CYLA: {
      name: "Schedule CYLA — Set off of Current Year Losses",
      description: "Set off of losses against income heads in current year",
      fields: [
        { id: "salary_income", label: "Income from Salary", type: "number", source: "Schedule S" },
        { id: "hp_income", label: "Income from House Property (can be negative)", type: "number", source: "Schedule HP", note: "House property loss can be set off against salary up to ₹2L" },
        { id: "os_income", label: "Income from Other Sources", type: "number", source: "Schedule OS" },
        { id: "gross_total_income", label: "Gross Total Income", type: "number", calculated: true, bold: true },
      ]
    },

    SCHEDULE_VIA: {
      name: "Schedule VI-A — Deductions under Chapter VI-A",
      fields: [
        { id: "d_80c", label: "80C — Investments (LIC, PPF, ELSS, EPF, etc.)", type: "number", max: 150000 },
        { id: "d_80ccc", label: "80CCC — Pension Fund Contribution", type: "number", note: "Combined limit with 80C is ₹1.5L" },
        { id: "d_80ccd1", label: "80CCD(1) — Employee's NPS Contribution", type: "number" },
        { id: "d_80c_total", label: "Total 80C + 80CCC + 80CCD(1) [Max ₹1,50,000]", type: "number", max: 150000, calculated: true },
        { id: "d_80ccd1b", label: "80CCD(1B) — Additional NPS [Max ₹50,000]", type: "number", max: 50000 },
        { id: "d_80ccd2", label: "80CCD(2) — Employer's NPS Contribution", type: "number", note: "Max 10% of Basic Salary. Allowed in New Regime too." },
        { id: "d_80d_self", label: "80D — Health Insurance (Self & Family)", type: "number", max_under60: 25000, max_above60: 50000 },
        { id: "d_80d_parents", label: "80D — Health Insurance (Parents)", type: "number", max_under60: 25000, max_above60: 50000 },
        { id: "d_80dd", label: "80DD — Disabled Dependent", type: "number" },
        { id: "d_80ddb", label: "80DDB — Treatment of Specified Diseases", type: "number" },
        { id: "d_80e", label: "80E — Education Loan Interest (No limit)", type: "number" },
        { id: "d_80ee", label: "80EE — Additional Interest on Home Loan [Max ₹50,000]", type: "number", max: 50000, note: "Only if first home loan and property ≤ ₹50L" },
        { id: "d_80g", label: "80G — Donations to Charitable Institutions", type: "number" },
        { id: "d_80gg", label: "80GG — Rent paid (if no HRA from employer)", type: "number" },
        { id: "d_80tta", label: "80TTA — Savings Account Interest [Max ₹10,000]", type: "number", max: 10000, note: "Not for senior citizens — they use 80TTB" },
        { id: "d_80ttb", label: "80TTB — Interest for Senior Citizens [Max ₹50,000]", type: "number", max: 50000 },
        { id: "d_80u", label: "80U — Self Disability Deduction", type: "number" },
        { id: "total_deductions_via", label: "Total Deductions [Sum of all above]", type: "number", calculated: true, bold: true },
      ]
    },

    SCHEDULE_CG: {
      name: "Schedule CG — Capital Gains",
      note: "For ITR-1: Only LTCG u/s 112A up to ₹1.25L allowed. For higher gains, use ITR-2.",
      fields: [
        { id: "ltcg_112a", label: "LTCG from listed equity/equity MF u/s 112A", type: "number", max_for_itr1: 125000 },
        { id: "ltcg_112a_exempt", label: "Exempt LTCG (first ₹1.25L is exempt)", type: "number", auto_fill: 125000 },
        { id: "taxable_ltcg", label: "Taxable LTCG [Amount above ₹1.25L]", type: "number", calculated: true },
      ]
    },

    PART_B_TTI: {
      name: "Part B-TTI — Computation of Total Tax Liability",
      fields: [
        { id: "gross_total_income", label: "Gross Total Income [from CYLA]", type: "number", source: "Schedule CYLA" },
        { id: "deductions_via", label: "Less: Deductions Chapter VI-A", type: "number", source: "Schedule VI-A" },
        { id: "total_income", label: "Total Income [GTI – Deductions]", type: "number", calculated: true, bold: true },
        { id: "tax_on_total_income", label: "Tax on Total Income [As per Slab]", type: "number", calculated: true },
        { id: "rebate_87a", label: "Less: Rebate u/s 87A", type: "number", auto_fill: true, note: "₹12,500 (old) or ₹25,000 (new) if income ≤ limit" },
        { id: "tax_after_rebate", label: "Tax after Rebate", type: "number", calculated: true },
        { id: "surcharge", label: "Add: Surcharge (if income > ₹50L)", type: "number", calculated: true },
        { id: "health_edu_cess", label: "Add: Health & Education Cess @ 4%", type: "number", calculated: true },
        { id: "total_tax_liability", label: "Total Tax Liability", type: "number", calculated: true, bold: true },
        { id: "advance_tax_paid", label: "Less: Advance Tax Paid", type: "number", source: "Challan" },
        { id: "tds_salary", label: "Less: TDS on Salary u/s 192", type: "number", source: "Form 16 / Form 26AS" },
        { id: "tds_other", label: "Less: TDS on Other Income", type: "number", source: "Form 26AS / Form 16A" },
        { id: "self_assessment_tax", label: "Less: Self Assessment Tax Paid", type: "number" },
        { id: "tax_payable_refundable", label: "Balance Tax Payable / Refundable", type: "number", calculated: true, bold: true, note: "Negative = Refund due to you" },
      ]
    },

    SCHEDULE_IT: {
      name: "Schedule IT — Details of Advance Tax / Self Assessment Tax",
      fields: [
        { id: "bsr_code", label: "BSR Code of Bank", type: "text" },
        { id: "date_of_deposit", label: "Date of Deposit", type: "date" },
        { id: "challan_serial", label: "Challan Serial Number", type: "text" },
        { id: "amount", label: "Amount Paid (₹)", type: "number" },
      ]
    },

    SCHEDULE_TDS1: {
      name: "Schedule TDS1 — TDS on Salary",
      fields: [
        { id: "employer_tan", label: "Employer TAN", type: "text", source: "Form 16 Part A" },
        { id: "employer_name", label: "Employer Name", type: "text" },
        { id: "gross_salary_16", label: "Total Salary as per Form 16", type: "number", source: "Form 16 Part B" },
        { id: "tds_deducted", label: "TDS Deducted (₹)", type: "number", source: "Form 16 Part A" },
        { id: "tds_deposited", label: "TDS Deposited to Govt (should match Form 26AS)", type: "number" },
      ]
    },

    SCHEDULE_TDS2: {
      name: "Schedule TDS2 — TDS on Other Income",
      description: "Interest, rent, professional fees, etc.",
      fields: [
        { id: "deductor_tan", label: "TAN of Deductor", type: "text", source: "Form 16A / 26AS" },
        { id: "deductor_name", label: "Name of Deductor", type: "text" },
        { id: "gross_amount", label: "Gross Amount (₹)", type: "number" },
        { id: "tds_deducted", label: "TDS Deducted (₹)", type: "number", source: "Form 26AS" },
        { id: "year_of_tds", label: "Year in which TDS deducted", type: "select", options: ["2025-26", "2024-25"] },
      ]
    },

    PART_A_VERIFICATION: {
      name: "Verification",
      fields: [
        { id: "place", label: "Place of Filing", type: "text", required: true },
        { id: "date", label: "Date of Filing", type: "date", required: true },
        { id: "declaration", label: "I solemnly declare that the information given is correct and complete.", type: "checkbox", required: true },
      ]
    },

    BANK_DETAILS: {
      name: "Bank Account Details (for Refund)",
      fields: [
        { id: "account_number", label: "Bank Account Number", type: "text", required: true },
        { id: "ifsc", label: "IFSC Code", type: "text", required: true },
        { id: "account_type", label: "Account Type", type: "select", options: ["SB - Savings", "CA - Current", "CC - Cash Credit"] },
        { id: "bank_name", label: "Bank Name", type: "text" },
        { id: "is_primary", label: "Nominate for Refund", type: "boolean" },
      ]
    }
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// ITR-2 — Income with Capital Gains / Foreign Assets
// ─────────────────────────────────────────────────────────────────────────────
const ITR2 = {
  form_name: "ITR-2",
  ay: "2026-27",
  who_can_file: [
    "Individual or HUF",
    "Income from salary, house property, capital gains, other sources",
    "Income above ₹50 lakh",
    "Capital gains (STCG / LTCG above ₹1.25L)",
    "Foreign income / foreign assets",
    "Directorship in company",
    "Unlisted equity shares",
    "More than two house properties",
    "Agricultural income above ₹5,000",
  ],
  who_cannot_file: [
    "Business or professional income (use ITR-3 or ITR-4)",
    "Partner in a firm",
  ],
  additional_schedules: {
    SCHEDULE_CG_DETAIL: {
      name: "Schedule CG — Detailed Capital Gains",
      subsections: {
        stcg_111a: { label: "STCG on equity/equity MF u/s 111A @ 15%", rate: 0.15 },
        stcg_other: { label: "STCG on other assets (debt MF, gold, etc.)", rate: "slab" },
        ltcg_112a: { label: "LTCG on equity/equity MF u/s 112A @ 10% (above ₹1.25L exempt)", rate: 0.10, exempt_limit: 125000 },
        ltcg_112: { label: "LTCG on other assets (property, gold, debt MF) @ 20% with indexation", rate: 0.20, indexation: true },
      }
    },
    SCHEDULE_FA: {
      name: "Schedule FA — Foreign Assets",
      fields: [
        { id: "country", label: "Country Name & Code" },
        { id: "account_number", label: "Account Number / Code" },
        { id: "peak_balance", label: "Peak Balance during the year" },
        { id: "closing_balance", label: "Closing Balance" },
        { id: "interest_income", label: "Gross Interest/Income from Foreign Asset" },
      ]
    },
    SCHEDULE_AL: {
      name: "Schedule AL — Assets & Liabilities",
      note: "Mandatory if income > ₹50 lakh",
      assets: ["Immovable Property", "Financial Assets (Shares, Bonds, MF)", "Cash in Hand > ₹50,000", "Jewellery/Bullion", "Vehicles", "Other Assets"],
      liabilities: ["Secured Loans", "Unsecured Loans"]
    }
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// ITR-4 (SUGAM) — Presumptive Taxation for Freelancers & Small Business
// ─────────────────────────────────────────────────────────────────────────────
const ITR4_SUGAM = {
  form_name: "ITR-4",
  popular_name: "SUGAM",
  ay: "2026-27",
  who_can_file: [
    "Resident Individual / HUF / Firm (not LLP)",
    "Income from business under presumptive scheme 44AD (turnover ≤ ₹3 crore)",
    "Income from profession under 44ADA (receipts ≤ ₹75 lakh)",
    "Transport business under 44AE",
    "Total income ≤ ₹50 lakh",
  ],
  presumptive_rates: {
    "44AD": { label: "Business (non-cash)", assumed_profit_rate: 0.06, note: "8% for cash transactions" },
    "44ADA": { label: "Professional (doctors, lawyers, CA, engineers, architects etc.)", assumed_profit_rate: 0.50, note: "50% of gross receipts" },
    "44AE": { label: "Goods Transport Vehicle", per_vehicle_per_month: 7500 },
  },
  additional_schedule: {
    SCHEDULE_BP: {
      name: "Schedule BP — Business/Profession Presumptive Income",
      fields: [
        { id: "business_name", label: "Nature of Business/Profession", type: "text" },
        { id: "gross_turnover", label: "Gross Turnover / Gross Receipts", type: "number" },
        { id: "presumptive_income", label: "Presumptive Income [% of Turnover]", type: "number", calculated: true },
        { id: "higher_income_declared", label: "If declaring higher income than presumptive", type: "boolean" },
        { id: "actual_income", label: "Actual Income (if higher than presumptive)", type: "number" },
      ]
    }
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// FORM 16 — TDS Certificate from Employer
// ─────────────────────────────────────────────────────────────────────────────
const FORM_16 = {
  form_name: "Form 16",
  description: "TDS Certificate issued by Employer to Employee",
  issued_by: "Every employer who has deducted TDS from salary",
  issued_to: "Employee",
  due_date_to_employee: "15th June of Assessment Year",

  PART_A: {
    name: "Part A — TDS Summary (Quarter-wise)",
    description: "Shows quarter-wise TDS deducted and deposited to government",
    fields: [
      { id: "employer_tan", label: "TAN of Employer", note: "10-digit TAN" },
      { id: "employer_pan", label: "PAN of Employer" },
      { id: "employer_name", label: "Name & Address of Employer" },
      { id: "employee_pan", label: "PAN of Employee" },
      { id: "employee_name", label: "Name of Employee" },
      { id: "assessment_year", label: "Assessment Year" },
      { id: "period_of_employment", label: "Period of Employment (From – To)" },
      { id: "q1_tds", label: "Q1 TDS (April–June)", note: "Should match Form 26AS" },
      { id: "q2_tds", label: "Q2 TDS (July–September)" },
      { id: "q3_tds", label: "Q3 TDS (October–December)" },
      { id: "q4_tds", label: "Q4 TDS (January–March)" },
      { id: "total_tds", label: "Total TDS Deducted & Deposited", bold: true },
    ]
  },

  PART_B: {
    name: "Part B — Salary Breakup & Tax Computation",
    description: "Detailed salary computation, deductions, and tax calculation",
    sections: {
      salary_details: {
        label: "Salary Details",
        fields: [
          { id: "basic_salary", label: "Basic Salary" },
          { id: "da", label: "Dearness Allowance (DA)" },
          { id: "hra_received", label: "HRA Received" },
          { id: "lta_received", label: "LTA (Leave Travel Allowance)" },
          { id: "medical_allowance", label: "Medical Allowance" },
          { id: "special_allowance", label: "Special Allowance / Other Allowances" },
          { id: "bonus", label: "Bonus" },
          { id: "gross_salary_17_1", label: "Gross Salary u/s 17(1)", bold: true },
          { id: "perquisites_17_2", label: "Perquisites u/s 17(2)" },
          { id: "profits_17_3", label: "Profits in lieu of salary u/s 17(3)" },
          { id: "gross_total_salary", label: "Total Gross Salary", bold: true },
        ]
      },
      exemptions: {
        label: "Less: Exemptions u/s 10",
        fields: [
          { id: "hra_exempt_10_13a", label: "HRA Exemption u/s 10(13A)", note: "Min of: Actual HRA, Rent – 10% Salary, 50%/40% of Salary" },
          { id: "lta_exempt_10_5", label: "LTA Exemption u/s 10(5)" },
          { id: "other_exempt_10", label: "Other Exemptions u/s 10" },
          { id: "total_exempt", label: "Total Exemptions", bold: true },
        ]
      },
      net_salary: {
        label: "Net Salary",
        fields: [
          { id: "net_salary", label: "Net Salary [Gross – Exemptions]", bold: true },
          { id: "standard_deduction", label: "Less: Standard Deduction u/s 16(ia)" },
          { id: "professional_tax", label: "Less: Professional Tax u/s 16(iii)" },
          { id: "income_from_salary", label: "Income from Salary", bold: true },
        ]
      },
      other_income_declared: {
        label: "Other Income declared by Employee to Employer",
        fields: [
          { id: "hp_income_declared", label: "Income from House Property" },
          { id: "other_income_declared", label: "Income from Other Sources" },
        ]
      },
      deductions_declared: {
        label: "Deductions declared by Employee (Form 12BB)",
        fields: [
          { id: "d_80c", label: "80C — Investments declared" },
          { id: "d_80ccd1b", label: "80CCD(1B) — NPS Additional" },
          { id: "d_80d", label: "80D — Health Insurance Premium" },
          { id: "d_hra_declared", label: "HRA exemption claimed" },
          { id: "d_home_loan_interest", label: "Home Loan Interest u/s 24(b)" },
          { id: "d_other", label: "Other Deductions" },
          { id: "total_deductions", label: "Total Chapter VI-A Deductions", bold: true },
        ]
      },
      tax_computation: {
        label: "Tax Computation",
        fields: [
          { id: "total_taxable_income", label: "Total Taxable Income", bold: true },
          { id: "tax_as_per_slab", label: "Tax as per Slab Rates" },
          { id: "rebate_87a", label: "Less: Rebate u/s 87A" },
          { id: "surcharge", label: "Add: Surcharge (if applicable)" },
          { id: "cess", label: "Add: Health & Education Cess @ 4%" },
          { id: "tax_on_employment", label: "Less: Tax on Employment (Professional Tax)" },
          { id: "tax_payable", label: "Tax Payable", bold: true },
          { id: "relief_89", label: "Less: Relief u/s 89 (if any)" },
          { id: "net_tax_payable", label: "Net Tax Payable", bold: true },
          { id: "tds_deducted", label: "TDS Deducted by Employer (matches Part A)", bold: true },
        ]
      }
    }
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// FORM 26AS — Tax Credit Statement
// ─────────────────────────────────────────────────────────────────────────────
const FORM_26AS = {
  form_name: "Form 26AS / Annual Tax Statement",
  description: "Tax passbook — all TDS, TCS, advance tax, refunds against your PAN",
  access: "incometax.gov.in → Login → e-File → View Form 26AS",
  alternate_access: "TRACES portal — www.tdscpc.gov.in",

  parts: {
    PART_A: {
      name: "Part A — TDS on Salary",
      columns: ["Sr.", "TAN of Deductor", "Name of Deductor", "Section", "Transaction Date", "Amount Paid/Credited", "Tax Deducted", "TDS Deposited"],
      verify: "Match Total TDS with Form 16 Part A"
    },
    PART_A1: {
      name: "Part A1 — TDS on Non-Salary",
      description: "TDS on interest, rent, professional fees, commission etc.",
      columns: ["TAN", "Deductor Name", "Section", "Amount", "TDS Deducted", "TDS Deposited", "Form 16A Available"]
    },
    PART_A2: {
      name: "Part A2 — TDS on Sale of Property",
      description: "TDS deducted by buyer on property sale",
      columns: ["PAN of Buyer", "Name of Buyer", "Property Value", "TDS Rate", "TDS Deducted"]
    },
    PART_B: {
      name: "Part B — TCS (Tax Collected at Source)",
      description: "TCS on motor vehicle purchase, LRS transfers, luxury goods etc."
    },
    PART_C: {
      name: "Part C — Advance Tax / Self Assessment Tax Paid",
      columns: ["BSR Code", "Date of Payment", "Challan Serial No.", "Amount", "Type (Advance/Self Assessment)"]
    },
    PART_D: {
      name: "Part D — Refund History",
      columns: ["Assessment Year", "Mode", "Amount", "Date of Refund", "Remarks"]
    },
    PART_E: {
      name: "Part E — AIR (High Value Transactions)",
      description: "High-value transactions reported by third parties (banks, mutual funds, property registrar)",
      examples: ["FD/RD investments above threshold", "Mutual fund investments", "Property purchase", "Credit card spend above ₹2L", "LRS overseas remittance"]
    },
    PART_F: {
      name: "Part F — TDS on Sale of Immovable Property",
      description: "TDS deducted when you purchased a property from someone else"
    }
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// FORM 12BB — Investment Declaration to Employer
// ─────────────────────────────────────────────────────────────────────────────
const FORM_12BB = {
  form_name: "Form 12BB",
  description: "Investment declaration form submitted by employee to employer at start of FY",
  purpose: "Employer uses this to compute TDS throughout the year. If you don't submit, employer deducts maximum TDS.",
  due_date: "April–May of Financial Year (at start of year) and proof submission: December–January",

  sections: [
    {
      name: "House Rent Allowance (HRA)",
      fields: [
        { id: "rent_amount", label: "Monthly Rent Paid (₹)" },
        { id: "landlord_name", label: "Name of Landlord" },
        { id: "landlord_address", label: "Address of Landlord" },
        { id: "landlord_pan", label: "Landlord PAN (required if rent > ₹1,00,000/year)", note: "If landlord is NRI, TDS applies" },
        { id: "property_address", label: "Address of Rented Property" },
      ]
    },
    {
      name: "Leave Travel Concession (LTC/LTA)",
      fields: [
        { id: "lta_amount", label: "LTA Amount Claimed (₹)" },
        { id: "travel_details", label: "Travel Details (From, To, Mode, Cost)" },
        { id: "family_members", label: "Family members travelling (spouse, 2 children, parents)" },
        { note: "Block of 2 years. 2 journeys per block. Only within India." }
      ]
    },
    {
      name: "Chapter VI-A Deductions",
      subsections: [
        {
          name: "Section 80C — Investments",
          instruments: [
            { id: "lic", label: "LIC Premium Receipts" },
            { id: "ppf", label: "PPF Passbook / Statement" },
            { id: "elss", label: "ELSS Mutual Fund Statement" },
            { id: "nsc", label: "NSC Certificate" },
            { id: "epf_voluntary", label: "Voluntary PF Contribution" },
            { id: "home_loan_principal", label: "Home Loan Principal (from bank statement)" },
            { id: "school_fees", label: "School/College Tuition Fee Receipts" },
            { id: "sukanya", label: "Sukanya Samriddhi Account Statement" },
            { id: "5yr_fd", label: "5-Year Tax Saving FD Certificate" },
          ]
        },
        {
          name: "Section 80D — Health Insurance",
          fields: [
            { id: "premium_self_family", label: "Premium for Self & Family (₹)", max: 25000 },
            { id: "premium_parents", label: "Premium for Parents (₹)", max_under60: 25000, max_above60: 50000 },
            { id: "insurer_name", label: "Insurance Company Name" },
            { id: "policy_number", label: "Policy Number" },
          ]
        },
        {
          name: "Section 24(b) — Home Loan Interest",
          fields: [
            { id: "lender_name", label: "Name of Lender" },
            { id: "lender_address", label: "Address of Lender" },
            { id: "interest_certificate", label: "Annual Interest Certificate from Bank" },
            { id: "interest_amount", label: "Total Interest for Year (₹)" },
            { id: "loan_account_number", label: "Loan Account Number" },
          ]
        }
      ]
    }
  ]
};

// ─────────────────────────────────────────────────────────────────────────────
// FORM 15G / 15H — Declaration for No TDS
// ─────────────────────────────────────────────────────────────────────────────
const FORM_15G_15H = {
  "15G": {
    form_name: "Form 15G",
    for: "Individuals below 60 years, HUF, Trusts",
    purpose: "Declaration to bank/NBFC to not deduct TDS on interest income",
    conditions: [
      "You are a resident individual / HUF",
      "Age below 60 years",
      "Tax calculated on your total income is NIL",
      "Total interest income does not exceed basic exemption limit"
    ],
    submit_to: "Bank, NBFC, EPF office, Post Office"
  },
  "15H": {
    form_name: "Form 15H",
    for: "Senior citizens (60 years or above)",
    purpose: "Declaration to prevent TDS deduction on interest/other income",
    conditions: [
      "Age 60 years or above",
      "Tax liability on total income is NIL",
      "Resident individual only"
    ]
  },
  common_fields: [
    { id: "name", label: "Name of Declarant (as per PAN)" },
    { id: "pan", label: "PAN" },
    { id: "assessment_year", label: "Assessment Year" },
    { id: "residential_status", label: "Residential Status: Resident" },
    { id: "flat_door", label: "Address" },
    { id: "email", label: "Email" },
    { id: "mobile", label: "Mobile" },
    { id: "estimated_income", label: "Estimated Income for which declaration is made (₹)" },
    { id: "estimated_total_income", label: "Estimated Total Income including above (₹)" },
    { id: "no_of_forms_filed", label: "No. of Form 15G/H filed in current FY" },
    { id: "total_income_of_forms", label: "Aggregate amount of income for which 15G/H filed" },
  ]
};

// ─────────────────────────────────────────────────────────────────────────────
// AIS — Annual Information Statement (New, more detailed than 26AS)
// ─────────────────────────────────────────────────────────────────────────────
const AIS = {
  form_name: "AIS — Annual Information Statement",
  description: "Comprehensive financial data statement. More detailed than Form 26AS. Available on incometax.gov.in",
  access: "incometax.gov.in → Login → Services → Annual Information Statement (AIS)",

  information_categories: [
    { code: "TDS", description: "TDS/TCS details" },
    { code: "SAL", description: "Salary income reported by employer" },
    { code: "INT", description: "Interest income (savings, FD, RD, bonds)" },
    { code: "DIV", description: "Dividend income from shares/MF" },
    { code: "SEC_SALE", description: "Securities/Mutual Fund transactions" },
    { code: "MF_PURCHASE", description: "Mutual Fund Purchase transactions" },
    { code: "PROP", description: "Property purchase/sale (from registrar)" },
    { code: "LRS", description: "Foreign remittances (LRS)" },
    { code: "EPF", description: "EPF withdrawal" },
    { code: "GST", description: "GST turnover reported" },
    { code: "ADV_TAX", description: "Advance tax and self-assessment tax" },
  ],
  important_note: "If Form 26AS and AIS conflict, Form 26AS prevails. You can provide feedback on incorrect AIS data."
};

// ─────────────────────────────────────────────────────────────────────────────
// FORM SELECTOR LOGIC
// ─────────────────────────────────────────────────────────────────────────────
function selectITRForm(userProfile) {
  const {
    income, is_business, is_professional, has_capital_gains,
    ltcg_amount, has_foreign_assets, is_director, num_house_properties,
    is_nri, total_income
  } = userProfile;

  if (is_nri) return { form: "ITR-2", reason: "NRIs cannot use ITR-1" };
  if (is_director) return { form: "ITR-2", reason: "Directors in companies must use ITR-2" };
  if (has_foreign_assets) return { form: "ITR-2", reason: "Foreign assets require ITR-2" };
  if (is_business) return { form: "ITR-3", reason: "Business income requires ITR-3" };

  if (is_professional) {
    return {
      form: "ITR-4",
      reason: "Professional income under presumptive scheme (44ADA) — use ITR-4 SUGAM",
      note: "If you want to declare actual expenses, use ITR-3 instead"
    };
  }

  if (has_capital_gains) {
    if (ltcg_amount > 125000) {
      return { form: "ITR-2", reason: `LTCG of ₹${ltcg_amount.toLocaleString('en-IN')} exceeds ₹1.25L limit for ITR-1` };
    }
  }

  if (num_house_properties > 2) {
    return { form: "ITR-2", reason: "More than 2 house properties — use ITR-2" };
  }

  if (total_income > 5000000) {
    return { form: "ITR-2", reason: "Income above ₹50 lakh — use ITR-2" };
  }

  return {
    form: "ITR-1",
    reason: "You qualify for ITR-1 SAHAJ — simplest form for salaried individuals",
    due_date: "31st July 2026"
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// EXPORTS
// ─────────────────────────────────────────────────────────────────────────────
module.exports = {
  TAX_SLABS,
  DEDUCTIONS,
  ITR1_SAHAJ,
  ITR2,
  ITR4_SUGAM,
  FORM_16,
  FORM_26AS,
  FORM_12BB,
  FORM_15G_15H,
  AIS,
  selectITRForm,

  // Quick reference
  ALL_FORMS: {
    "ITR-1": ITR1_SAHAJ,
    "ITR-2": ITR2,
    "ITR-4": ITR4_SUGAM,
    "Form 16": FORM_16,
    "Form 26AS": FORM_26AS,
    "Form 12BB": FORM_12BB,
    "Form 15G": FORM_15G_15H["15G"],
    "Form 15H": FORM_15G_15H["15H"],
    "AIS": AIS,
  }
};
