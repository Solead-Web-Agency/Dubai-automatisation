module.exports = async (req, res) => {
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  return res.end(`<!doctype html>
<html lang="fr">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Configurer texte – Format Carré</title>
    <style>
      body{font-family:system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;padding:24px;max-width:720px;margin:0 auto}
      h1{margin:0 0 16px}
      label{display:block;margin:12px 0 4px}
      input{width:100%;padding:10px;font-size:16px}
      button{margin-top:16px;padding:10px 16px;font-size:16px;background:#111;color:#fff;border:none;border-radius:6px;cursor:pointer}
      .hint{color:#666;font-size:14px;margin-top:12px}
      .code{background:#f5f5f5;border-radius:6px;padding:6px}
    </style>
  </head>
  <body>
    <h1>Texte – Format Carré</h1>
    <form method="POST" action="/api/text-square">
      <label for="line1">Ligne 1</label>
      <input id="line1" name="line1" placeholder="NOUVEAU PROJET" />
      <label for="line2">Ligne 2</label>
      <input id="line2" name="line2" placeholder="APPARTEMENT 70M2" />
      <label for="line3">Ligne 3</label>
      <input id="line3" name="line3" placeholder="À DUBAI DÈS 250.000€" />
      <button type="submit">Enregistrer et lancer la génération</button>
    </form>
    <p class="hint">
      Règles:
      <br/>- Le texte est automatiquement converti en UPPERCASE.
      <br/>- Pour mettre un ou plusieurs mots en rouge, utilisez <span class="code">red:MOT</span> (ou <span class="code">[[MOT]]</span>).
      <br/>- Si une ligne est vide, elle n’est pas affichée (aucun fallback).
    </p>
  </body>
</html>`);
};
