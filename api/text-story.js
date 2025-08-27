const fs = require('fs');

module.exports = async (req, res) => {
  const configPath = '/tmp/text-story.json';

  if (req.method === 'GET') {
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
    <title>Texte – Format Story</title>
    <style>
      body{font-family:system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;padding:24px;max-width:720px;margin:0 auto}
      label{display:block;margin:12px 0 4px}
      input{width:100%;padding:10px;font-size:16px}
      button{margin-top:16px;padding:10px 16px;font-size:16px;background:#111;color:#fff;border:none;border-radius:6px;cursor:pointer}
      .hint{color:#666;font-size:14px}
      .code{background:#f5f5f5;border-radius:6px;padding:6px}
    </style>
  </head>
  <body>
    <h1>Texte – Format Story</h1>
    <form method="POST">
      <label for="line1">Ligne 1</label>
      <input id="line1" name="line1" value="${existing.line1 || ''}" />
      <label for="line2">Ligne 2</label>
      <input id="line2" name="line2" value="${existing.line2 || ''}" />
      <label for="line3">Ligne 3</label>
      <input id="line3" name="line3" value="${existing.line3 || ''}" />
      <button type="submit">Enregistrer et lancer la génération</button>
    </form>
    <p class="hint">Uppercase automatique; rouge via <span class="code">red:MOT</span> ou <span class="code">[[MOT]]</span>; lignes vides non affichées.</p>
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

      const proto = req.headers['x-forwarded-proto'] || 'https';
      const host = req.headers.host;
      const baseUrl = `${proto}://${host}`;
      const qs = new URLSearchParams({ storyLine1: line1, storyLine2: line2, storyLine3: line3 }).toString();

      let generation;
      try {
        const resp = await fetch(`${baseUrl}/api/check-gmail?${qs}`, { method: 'POST' });
        generation = await resp.json();
      } catch (e) {
        generation = { success: false, error: e.message };
      }

      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      const items = Array.isArray(generation.results) ? generation.results : [];
      const list = items.map((r, i) => {
        const story = r.ads && r.ads.story ? `<li>Story: <a href="${r.ads.story.url}" target="_blank">${r.ads.story.url}</a></li>` : '';
        const square = r.ads && r.ads.square ? `<li>Carré: <a href="${r.ads.square.url}" target="_blank">${r.ads.square.url}</a></li>` : '';
        return `<li><strong>${i+1}. ${r.property && r.property.title ? r.property.title : 'Annonce'}</strong><ul>${square}${story}</ul></li>`;
      }).join('');

      return res.end(`<!doctype html>
<html lang="fr">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Configuration Story enregistrée – Dubai Immo</title>
    <style>
      :root{ --bg:#0b1220; --panel:#0f172a; --muted:#94a3b8; --text:#e2e8f0; --accent:#38bdf8; --success:#10b981 }
      *{box-sizing:border-box}
      body{margin:0;background:linear-gradient(180deg,#0b1220 0%,#0a0f1e 100%);color:var(--text);font-family: ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial}
      .wrap{min-height:100dvh;display:grid;place-items:center;padding:24px}
      .card{width:min(980px,100%);background:#0f172a;border:1px solid #1f2937;border-radius:16px;box-shadow:0 10px 30px rgba(0,0,0,.35);overflow:hidden}
      .header{display:flex;align-items:center;gap:16px;padding:18px 22px;border-bottom:1px solid #1f2937;background:rgba(255,255,255,.02)}
      .header img{height:40px;width:auto;display:block}
      .header h1{margin:0;font-size:18px;letter-spacing:.3px;color:var(--success)}
      .body{padding:22px}
      .success{background:#0f2e1d;border:1px solid #065f46;border-radius:12px;padding:16px;margin:16px 0}
      .success h2{margin:0 0 12px;color:#34d399;font-size:16px}
      .config{background:#0b1020;border:1px solid #1f2937;border-radius:10px;padding:16px;margin:16px 0;font-family:ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas}
      .config pre{margin:0;color:#e2e8f0;font-size:14px;line-height:1.5}
      .results{background:#0b1020;border:1px solid #1f2937;border-radius:10px;padding:16px;margin:16px 0}
      .results h3{margin:0 0 12px;color:#cbd5e1;font-size:15px}
      .results ol{margin:0;padding-left:20px}
      .results li{margin:8px 0;line-height:1.5}
      .results a{color:var(--accent);text-decoration:none}
      .results a:hover{text-decoration:underline}
      .actions{display:flex;gap:12px;margin-top:20px}
      .btn{appearance:none;border:0;border-radius:10px;padding:12px 16px;font-weight:600;cursor:pointer;text-decoration:none;display:inline-block;font-size:14px}
      .primary{background:var(--success);color:white}
      .ghost{background:transparent;border:1px solid #334155;color:var(--text)}
      .footer{padding:14px 22px;border-top:1px solid #1f2937;color:#9aa7b9;font-size:13px;text-align:center}
    </style>
  </head>
  <body>
    <div class="wrap">
      <div class="card">
        <div class="header">
          <img src="/api/logo" alt="Dubai Immo" />
          <h1>✅ Configuration Story enregistrée</h1>
        </div>
        <div class="body">
          <div class="success">
            <h2>Génération lancée avec succès</h2>
            <p>Vos textes ont été sauvegardés et la génération des visuels est en cours.</p>
          </div>
          
          <div class="config">
            <h3>Configuration sauvegardée</h3>
            <pre>${JSON.stringify(data, null, 2)}</pre>
          </div>
          
          <div class="results">
            <h3>Visuels générés</h3>
            <ol>${list || '<li>Aucun résultat pour le moment</li>'}</ol>
          </div>
          
          <div class="actions">
            <a href="/" class="btn primary">Retour à l'accueil</a>
            <a href="/api/text-square" class="btn ghost">Modifier le format carré</a>
            <a href="/api/text-story" class="btn ghost">Modifier le format story</a>
          </div>
        </div>
        <div class="footer">
          Dubai Immo – Générateur de visuels
        </div>
      </div>
    </div>
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
