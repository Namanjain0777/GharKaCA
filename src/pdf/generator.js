const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

const SAFFRON = '#FF6B00';
const DARK    = '#1A1A2E';
const GRAY    = '#555555';
const GREEN   = '#1B7A34';
const RED     = '#CC2200';
const LIGHT   = '#FFF8F0';

function rupee(n) {
  if (!n && n !== 0) return '—';
  return '₹' + Number(n).toLocaleString('en-IN');
}

function generateReport(taxData, analysis, outputPath) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    const stream = fs.createWriteStream(outputPath);
    doc.pipe(stream);

    const pageW = doc.page.width - 100; // content width

    // ── HEADER ────────────────────────────────────────────────────────────
    doc.rect(0, 0, doc.page.width, 90).fill(DARK);
    doc.fontSize(28).fillColor('#FF6B00').font('Helvetica-Bold').text('Ghar Ka CA', 50, 20);
    doc.fontSize(11).fillColor('#AAAACC').font('Helvetica').text('Personalised Tax Report — FY 2025-26 / AY 2026-27', 50, 54);
    doc.fontSize(9).fillColor('#AAAACC').text(`Generated: ${new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}`, 50, 70);

    doc.moveDown(3);

    // ── DISCLAIMER ────────────────────────────────────────────────────────
    doc.rect(50, doc.y, pageW, 28).fill('#FFF0E0');
    doc.fontSize(8).fillColor(SAFFRON).font('Helvetica-Oblique')
      .text('⚠  Educational information only — not a substitute for advice from a qualified CA. Tax laws may change.', 58, doc.y + 8, { width: pageW - 16 });
    doc.moveDown(2.5);

    // ── INCOME SUMMARY ────────────────────────────────────────────────────
    sectionHeader(doc, '📊  Income Summary', pageW);
    twoColRow(doc, 'Gross Annual Income', rupee(analysis.gross_annual_income), pageW, true);
    twoColRow(doc, 'Monthly Salary (approx)', rupee(Math.round(analysis.gross_annual_income / 12)), pageW);
    doc.moveDown(1);

    // ── REGIME COMPARISON ────────────────────────────────────────────────
    sectionHeader(doc, '⚖️  Old Regime vs New Regime Comparison', pageW);

    // Table header
    const col1 = 50, col2 = 250, col3 = 400;
    doc.rect(col1, doc.y, pageW, 22).fill(DARK);
    doc.fontSize(10).fillColor('white').font('Helvetica-Bold')
      .text('Item', col1 + 8, doc.y + 5)
      .text('Old Regime', col2, doc.y - 17)
      .text('New Regime', col3, doc.y - 17);
    doc.moveDown(1.2);

    const rows = [
      ['Gross Income', rupee(analysis.gross_annual_income), rupee(analysis.gross_annual_income)],
      ['Total Deductions', rupee(analysis.old_regime.total_deductions), rupee(analysis.new_regime.total_deductions)],
      ['Taxable Income', rupee(analysis.old_regime.taxable_income), rupee(analysis.new_regime.taxable_income)],
      ['Tax (before cess)', rupee(analysis.old_regime.tax_before_cess), rupee(analysis.new_regime.tax_before_cess)],
      ['Health & Ed. Cess', rupee(analysis.old_regime.cess), rupee(analysis.new_regime.cess)],
      ['Total Annual Tax', rupee(analysis.old_regime.total_tax), rupee(analysis.new_regime.total_tax), true],
      ['Monthly TDS', rupee(analysis.old_regime.monthly_tds), rupee(analysis.new_regime.monthly_tds)],
    ];

    rows.forEach(([label, old, newVal, bold], i) => {
      const bg = i % 2 === 0 ? '#F9F9F9' : 'white';
      doc.rect(col1, doc.y, pageW, 20).fill(bg);
      const font = bold ? 'Helvetica-Bold' : 'Helvetica';
      const color = bold ? DARK : GRAY;
      doc.fontSize(10).fillColor(color).font(font)
        .text(label, col1 + 8, doc.y + 4)
        .text(old, col2, doc.y - 16)
        .text(newVal, col3, doc.y - 16);
      doc.moveDown(1.25);
    });

    doc.moveDown(0.5);

    // ── RECOMMENDATION BOX ────────────────────────────────────────────────
    const rec = analysis.recommended_regime === 'old' ? 'Old Regime' : 'New Regime';
    const saving = analysis.savings_by_recommended;
    doc.rect(50, doc.y, pageW, 44).fill('#E8F5E9');
    doc.rect(50, doc.y, 5, 44).fill(GREEN);
    doc.fontSize(13).fillColor(GREEN).font('Helvetica-Bold')
      .text(`✅  Recommended: ${rec} — You save ${rupee(saving)}/year`, 65, doc.y + 8, { width: pageW - 20 });
    doc.fontSize(9).fillColor(GRAY).font('Helvetica')
      .text(`That's ${rupee(Math.round(saving / 12))}/month back in your pocket.`, 65, doc.y - 4);
    doc.moveDown(3);

    // ── DEDUCTIONS BREAKDOWN (Old Regime) ────────────────────────────────
    if (analysis.old_regime.deductions_breakdown) {
      sectionHeader(doc, '🧮  Deductions Breakdown (Old Regime)', pageW);
      const d = analysis.old_regime.deductions_breakdown;
      const deductions = [
        ['Standard Deduction (u/s 16)', d.standard_deduction],
        ['Section 80C (investments)', d['80c']],
        ['Section 80D (health insurance)', d['80d']],
        ['HRA Exemption', d.hra],
        ['Home Loan Interest (Section 24B)', d.home_loan_interest],
        ['Other Deductions', d.other],
      ].filter(([, v]) => v && v > 0);

      deductions.forEach(([label, val], i) => {
        const bg = i % 2 === 0 ? '#F9F9F9' : 'white';
        doc.rect(50, doc.y, pageW, 20).fill(bg);
        doc.fontSize(10).fillColor(GRAY).font('Helvetica')
          .text(label, 58, doc.y + 4)
          .text(rupee(val), 400, doc.y - 16);
        doc.moveDown(1.25);
      });

      // Total row
      doc.rect(50, doc.y, pageW, 22).fill('#FFF0E0');
      doc.fontSize(10).fillColor(DARK).font('Helvetica-Bold')
        .text('Total Deductions', 58, doc.y + 5)
        .text(rupee(analysis.old_regime.total_deductions), 400, doc.y - 17);
      doc.moveDown(2);
    }

    // ── ACTION TIPS ───────────────────────────────────────────────────────
    if (analysis.top_tips && analysis.top_tips.length) {
      sectionHeader(doc, '💡  Action Items to Reduce Your Tax Further', pageW);
      analysis.top_tips.forEach((tip, i) => {
        doc.rect(50, doc.y, 24, 24).fill(SAFFRON);
        doc.fontSize(12).fillColor('white').font('Helvetica-Bold')
          .text(String(i + 1), 58, doc.y + 5);
        doc.fontSize(10).fillColor(DARK).font('Helvetica')
          .text(tip, 82, doc.y - 19, { width: pageW - 36 });
        doc.moveDown(1.6);
      });
      doc.moveDown(0.5);
    }

    // ── INVESTMENT SUGGESTIONS ────────────────────────────────────────────
    if (analysis.investment_suggestions && analysis.investment_suggestions.length) {
      sectionHeader(doc, '📈  Investment Suggestions (to maximise 80C)', pageW);
      analysis.investment_suggestions.forEach((s) => {
        doc.fontSize(10).fillColor(GRAY).font('Helvetica').text(`→  ${s}`, 58, doc.y, { width: pageW - 20 });
        doc.moveDown(0.8);
      });
      doc.moveDown(0.5);
    }

    // ── FORM 16 NOTES ─────────────────────────────────────────────────────
    if (analysis.form16_notes) {
      sectionHeader(doc, '📄  What to Check in Your Form 16', pageW);
      doc.fontSize(10).fillColor(GRAY).font('Helvetica')
        .text(analysis.form16_notes, 58, doc.y, { width: pageW - 20 });
      doc.moveDown(2);
    }

    // ── SUBSCRIPTION CTA ──────────────────────────────────────────────────
    doc.rect(50, doc.y, pageW, 70).fill(DARK);
    doc.fontSize(14).fillColor(SAFFRON).font('Helvetica-Bold')
      .text('Want unlimited tax questions all year? 🤝', 65, doc.y + 10, { width: pageW - 30 });
    doc.fontSize(10).fillColor('#AAAACC').font('Helvetica')
      .text('Subscribe to Ghar Ka CA Premium for just ₹199/year', 65, doc.y - 4)
      .text('Ask anything. Budget changes. New job. Home loan. We\'re here.', 65, doc.y + 8);
    doc.moveDown(4.5);

    // ── FOOTER ────────────────────────────────────────────────────────────
    doc.fontSize(8).fillColor('#AAAAAA').font('Helvetica')
      .text('Ghar Ka CA  •  AI-powered tax guidance for India\'s middle class  •  Not a registered CA firm', 50, doc.y, { align: 'center', width: pageW });

    doc.end();

    stream.on('finish', () => resolve(outputPath));
    stream.on('error', reject);
  });
}

// ── Helper functions ───────────────────────────────────────────────────────

function sectionHeader(doc, title, pageW) {
  doc.rect(50, doc.y, pageW, 26).fill('#FFF0E0');
  doc.rect(50, doc.y, 4, 26).fill(SAFFRON);
  doc.fontSize(11).fillColor(DARK).font('Helvetica-Bold')
    .text(title, 62, doc.y + 7);
  doc.moveDown(1.8);
}

function twoColRow(doc, label, value, pageW, bold = false) {
  const font = bold ? 'Helvetica-Bold' : 'Helvetica';
  doc.fontSize(10).fillColor(GRAY).font(font).text(label, 58, doc.y);
  doc.fontSize(10).fillColor(DARK).font('Helvetica-Bold').text(value, 400, doc.y - 12);
  doc.moveDown(0.9);
}

module.exports = { generateReport };
