/**
 * Module pour créer des overlays de texte plus avancés
 * Utilise SVG pour un rendu de texte de qualité
 */

function createTextSVG({ title, price, location, type, width, height, format }) {
  const isSquare = format === 'square';
  const fontSize = isSquare ? 48 : 56;
  const titleFontSize = isSquare ? 56 : 68;
  
  // Calculer les dimensions et positions
  const padding = 40;
  const maxTitleWidth = width - (padding * 2);
  
  // Wrapper le titre sur plusieurs lignes si nécessaire
  const titleLines = wrapText(title, maxTitleWidth, titleFontSize);
  const titleHeight = titleLines.length * (titleFontSize + 10);
  
  const svg = `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <style>
          .title-text { 
            font-family: 'Arial Black', Arial, sans-serif; 
            font-weight: 900; 
            font-size: ${titleFontSize}px; 
            fill: white; 
            text-anchor: start;
          }
          .price-text { 
            font-family: Arial, sans-serif; 
            font-weight: bold; 
            font-size: ${fontSize + 8}px; 
            fill: #FFD700; 
            text-anchor: start;
          }
          .location-text { 
            font-family: Arial, sans-serif; 
            font-weight: normal; 
            font-size: ${fontSize - 8}px; 
            fill: #E0E0E0; 
            text-anchor: start;
          }
          .type-text { 
            font-family: Arial, sans-serif; 
            font-weight: bold; 
            font-size: ${fontSize - 12}px; 
            fill: #4FC3F7; 
            text-anchor: start;
          }
          .cta-text { 
            font-family: Arial, sans-serif; 
            font-weight: bold; 
            font-size: ${fontSize - 4}px; 
            fill: white; 
            text-anchor: middle;
          }
        </style>
      </defs>
      
      <!-- Background semi-transparent -->
      <rect x="0" y="0" width="${width}" height="${height}" fill="rgba(0,0,0,0.75)" rx="20"/>
      
      <!-- Type de bien -->
      <text x="${padding}" y="40" class="type-text">${type.toUpperCase()}</text>
      
      <!-- Titre (multi-lignes) -->
      ${titleLines.map((line, index) => 
        `<text x="${padding}" y="${80 + (index * (titleFontSize + 10))}" class="title-text">${escapeXml(line)}</text>`
      ).join('')}
      
      <!-- Localisation -->
      <text x="${padding}" y="${80 + titleHeight + 20}" class="location-text">📍 ${escapeXml(location)}</text>
      
      <!-- Prix -->
      ${price ? `<text x="${padding}" y="${80 + titleHeight + 60}" class="price-text">${escapeXml(price)}</text>` : ''}
      
      <!-- CTA Button -->
      <rect x="${width - 250}" y="${height - 80}" width="200" height="50" fill="#FF6B35" rx="25"/>
      <text x="${width - 150}" y="${height - 50}" class="cta-text">DÉCOUVRIR</text>
      
      <!-- Logo placeholder -->
      <rect x="${width - 120}" y="20" width="100" height="40" fill="#1976D2" rx="8"/>
      <text x="${width - 70}" y="45" style="font-family: Arial; font-weight: bold; font-size: 16px; fill: white; text-anchor: middle;">DUBAI IMMO</text>
    </svg>
  `;
  
  return svg;
}

function wrapText(text, maxWidth, fontSize) {
  // Estimation simple: ~0.6 * fontSize par caractère
  const charWidth = fontSize * 0.6;
  const maxCharsPerLine = Math.floor(maxWidth / charWidth);
  
  const words = text.split(' ');
  const lines = [];
  let currentLine = '';
  
  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    
    if (testLine.length <= maxCharsPerLine) {
      currentLine = testLine;
    } else {
      if (currentLine) {
        lines.push(currentLine);
      }
      currentLine = word;
    }
  }
  
  if (currentLine) {
    lines.push(currentLine);
  }
  
  // Limiter à 3 lignes max
  return lines.slice(0, 3);
}

function escapeXml(unsafe) {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

module.exports = {
  createTextSVG
};
