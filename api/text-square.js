const fs = require('fs');

module.exports = async (req, res) => {
  const configPath = '/tmp/text-square.json';

  if (req.method === 'GET') {
    // Afficher un mini formulaire HTML
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    let existing = { line1: '', line2: '', line3: '' };
    try {
      if (fs.existsSync(configPath)) {
        existing = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      }
    } catch (_) {}

    return res.end(`<!doctype html>
<html lang="fr">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Configurer texte format carré</title>
    <style>
      body{font-family:system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;padding:24px;max-width:720px;margin:0 auto}
      label{display:block;margin:12px 0 4px}
      input{width:100%;padding:10px;font-size:16px}
      button{margin-top:16px;padding:10px 16px;font-size:16px;background:#111;color:#fff;border:none;border-radius:6px;cursor:pointer}
      .hint{color:#666;font-size:14px}
      .code{background:#f5f5f5;border-radius:6px;padding:8px}
    </style>
  </head>
  <body>
    <h1>Texte – Format Carré</h1>
    <form method="POST">
      <label for="line1">Ligne 1 (bleu)</label>
      <input id="line1" name="line1" value="${existing.line1 || ''}" />
      <label for="line2">Ligne 2 (bleu)</label>
      <input id="line2" name="line2" value="${existing.line2 || ''}" />
      <label for="line3">Ligne 3 (rouge)</label>
      <input id="line3" name="line3" value="${existing.line3 || ''}" />
      <button type="submit">Enregistrer et lancer la génération</button>
    </form>
    <p class="hint">Astuce: après sauvegarde, la génération est lancée automatiquement.</p>
  </body>
</html>`);
  }

  if (req.method === 'POST') {
    try {
      const buffers = [];
      for await (const chunk of req) buffers.push(chunk);
      const raw = Buffer.concat(buffers).toString('utf8');
      const params = new URLSearchParams(raw);
      const line1 = params.get('line1') || '';
      const line2 = params.get('line2') || '';
      const line3 = params.get('line3') || '';
      const data = { line1, line2, line3, savedAt: new Date().toISOString() };
      fs.writeFileSync(configPath, JSON.stringify(data, null, 2));

      // Appeler /api/check-gmail pour lancer la génération
      const proto = req.headers['x-forwarded-proto'] || 'https';
      const host = req.headers.host;
      const baseUrl = `${proto}://${host}`;
      let generation;
      try {
        const resp = await fetch(`${baseUrl}/api/check-gmail`, { method: 'POST' });
        generation = await resp.json();
      } catch (e) {
        generation = { success: false, error: e.message };
      }

      // Réponse HTML avec un récap
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      const items = Array.isArray(generation.results) ? generation.results : [];
      const list = items.map((r, i) => {
        const story = r.ads && r.ads.story ? `<li>Story: <a href="${r.ads.story.url}" target="_blank">${r.ads.story.url}</a></li>` : '';
        const square = r.ads && r.ads.square ? `<li>Carré: <a href="${r.ads.square.url}" target="_blank">${r.ads.square.url}</a></li>` : '';
        return `<li><strong>${i+1}. ${r.property && r.property.title ? r.property.title : 'Annonce'}</strong><ul>${square}${story}</ul></li>`;
      }).join('');

      return res.end(`<!doctype html>
<html lang="fr">
  <head><meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1" /><title>Génération lancée</title></head>
  <body style="font-family:system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;padding:24px;max-width:900px;margin:0 auto">
    <h1>Configuration enregistrée ✅</h1>
    <p>La génération vient d'être lancée. Résultat:</p>
    <pre>${JSON.stringify(data, null, 2)}</pre>
    <h2>Visuels générés</h2>
    <ol>${list || '<li>Aucun résultat</li>'}</ol>
    <p><a href="${baseUrl}/api/text-square">Retour au formulaire</a></p>
  </body>
</html>`);
    } catch (e) {
      res.statusCode = 500;
      res.setHeader('Content-Type', 'application/json');
      return res.end(JSON.stringify({ success: false, error: e.message }));
    }
  }

  res.statusCode = 405;
  res.setHeader('Allow', 'GET, POST');
  res.end('Method Not Allowed');
};
