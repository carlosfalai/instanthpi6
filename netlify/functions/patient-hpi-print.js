exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  try {
    const {
      patient_id,
      language = 'fr',
      demographics = {},
      hpi_summary,
      hpi_confirmed,
      hpi_corrections,
      follow_up_answers = {}
    } = JSON.parse(event.body || '{}');

    // Build final S (Subjective) text
    const parts = [];
    if (hpi_summary) parts.push(hpi_summary.trim());
    if (hpi_confirmed === false && hpi_corrections) {
      parts.push((language === 'fr'
        ? "Corrections du patient: "
        : "Patient corrections: ") + hpi_corrections.trim());
    }

    const answersKeys = Object.keys(follow_up_answers || {});
    if (answersKeys.length > 0) {
      parts.push(language === 'fr' ? 'Réponses aux questions:' : 'Answers to follow-up questions:');
      answersKeys.sort((a, b) => Number(a) - Number(b)).slice(0, 10).forEach((k, i) => {
        const val = (follow_up_answers[k] || '').toString().trim();
        if (val) parts.push(`${i + 1}. ${val}`);
      });
    }

    const S_text = parts.join('\n\n');

    const nameAgeSex = (() => {
      const age = demographics.age ? `${demographics.age} ${language === 'fr' ? 'ans' : 'yrs'}` : '';
      const sex = demographics.gender || demographics.sex || '';
      const sep = age && sex ? ' · ' : '';
      return `${age}${sep}${sex}`.trim();
    })();

    const today = new Date();
    const dateStr = today.toISOString().slice(0, 10);

    const title = language === 'fr' ? 'Résumé HPI - Pour la Consultation' : 'HPI Summary - For Consultation';
    const printHtml = `<!DOCTYPE html>
<html><head><meta charset="UTF-8"><title>${title}</title>
<style>
  body{font-family:Arial,sans-serif;line-height:1.6;color:#111;max-width:860px;margin:0 auto;padding:24px;background:#fff}
  .hdr{background:#0d0d0d;color:#e6e6e6;padding:16px 20px;border-radius:10px;margin-bottom:24px}
  .hdr h2{margin:0 0 6px 0;font-size:20px}
  .badge{display:inline-block;background:#1a1a1a;color:#e6e6e6;border:1px solid #2a2a2a;border-radius:999px;padding:4px 10px;font-size:12px;margin-left:8px}
  .box{border:1px solid #e5e7eb;border-radius:8px;padding:16px;margin:12px 0}
  .sec{font-size:14px;color:#374151;border-bottom:2px solid #e5e7eb;padding-bottom:6px;margin-top:18px;margin-bottom:8px}
  pre{white-space:pre-wrap;font-family:inherit}
  .print{margin-top:16px}
  @media print{.print{display:none}}
</style></head>
<body>
  <div class="hdr">
    <h2>${language === 'fr' ? 'Document pour le Médecin (Sujet uniquement)' : 'Document for Physician (Subjective Only)'}
      <span class="badge">${patient_id || ''}</span>
    </h2>
    <div>${nameAgeSex ? nameAgeSex + ' · ' : ''}${dateStr}</div>
  </div>
  <div class="sec">${language === 'fr' ? 'Sujet (HPI confirmé par le patient)' : 'Subjective (Patient-confirmed HPI)'}</div>
  <div class="box"><pre>${S_text || ''}</pre></div>
  <div class="print"><button onclick="window.print()">${language === 'fr' ? 'Imprimer' : 'Print'}</button></div>
</body></html>`;

    return { statusCode: 200, headers, body: JSON.stringify({ success: true, print_html: printHtml }) };
  } catch (error) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: error.message || 'Failed to generate document' }) };
  }
};


