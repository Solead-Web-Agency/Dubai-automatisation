import { readFileSync } from 'fs';
import { join } from 'path';

export default function handler(req, res) {
  try {
    const htmlPath = join(process.cwd(), 'index.html');
    const html = readFileSync(htmlPath, 'utf8');
    
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.status(200).send(html);
  } catch (error) {
    console.error('Erreur lecture index.html:', error);
    res.status(500).send('Erreur serveur');
  }
}
