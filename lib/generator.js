/**
 * Module pour générer des visuels publicitaires avec Sharp
 * Formats: 1080x1080 (carré) et 1080x1920 (story)
 */

const { createCanvas, loadImage, registerFont } = require('canvas');
const { uploadImage } = require('./cloudinary');
const path = require('path');
const fs = require('fs');
const https = require('https');

// Résolution robuste des assets (fonctionne sur Vercel)
function resolveAssetPath(...segments) {
  return path.resolve(process.cwd(), ...segments);
}

function safeReadAsset(filename) {
  console.log('🔍 safeReadAsset:', filename);
  
  // Forcer le chemin depuis la racine du projet
  const assetPath = path.resolve(process.cwd(), 'assets', filename);
  console.log('  - Chemin forcé:', assetPath);
  
  try {
    if (fs.existsSync(assetPath)) {
      const buffer = fs.readFileSync(assetPath);
      console.log('✅ Asset chargé:', filename, 'taille:', buffer.length);
      return buffer;
    }
  } catch (e) {
    console.error('❌ Erreur lecture asset:', filename, e.message);
  }
  
  console.log('❌ Asset introuvable:', filename);
  throw new Error(`Asset introuvable: ${filename} - Vérifiez que le dossier assets/ est bien déployé sur Vercel`);
}

// Supprimer la fonction createDefaultAsset qui n'est plus utilisée

// Enregistrer la police si disponible localement; fallback sinon
let montserratAvailable = false;
async function ensureMontserratFont() {
  console.log('🔍 ensureMontserratFont...');
  try {
    const localPath = path.resolve(process.cwd(), 'fonts', 'Montserrat-Bold.ttf');
    console.log('  - Test local font:', localPath);
    if (fs.existsSync(localPath)) {
      registerFont(localPath, { family: 'Montserrat', weight: 'bold' });
      montserratAvailable = true;
      console.log('✅ Police locale chargée depuis fonts/Montserrat-Bold.ttf');
      return;
    }
  } catch (e) {
    console.error('❌ Erreur lors du chargement de la police:', e.message);
  }

  // Pas de police Montserrat, on utilise sans-serif
  console.log('ℹ️ Police Montserrat non trouvée, utilisation de sans-serif');
  montserratAvailable = false;
}

function applyFont(ctx, { sizePx, weight = 'bold' }) {
  console.log('🔍 applyFont appelée avec:', { sizePx, weight });
  console.log('  - montserratAvailable:', montserratAvailable);
  
  if (montserratAvailable) {
    ctx.font = `${weight} ${sizePx}px Montserrat`;
    console.log('  - Police Montserrat appliquée:', ctx.font);
  } else {
    ctx.font = `${weight} ${sizePx}px sans-serif`;
    console.log('  - Police sans-serif appliquée:', ctx.font);
  }
  
  console.log('  - Police finale:', ctx.font);
}

async function generateAds(propertyData, options = {}) {
  console.log('🎨 Génération des visuels pour:', propertyData.title);

  const { title, featuredImage, price, location, type, surface } = propertyData;
  const { squareText, storyText, format } = options || {};
  
  // Timestamp pour les noms de fichiers uniques
  const timestamp = Date.now();
  const safeTitle = title.toLowerCase()
    .replace(/[^a-z0-9]/g, '-')
    .replace(/-+/g, '-')
    .substring(0, 30);

  const results = { square: null, story: null };

  try {
    const propertyImageBuffer = await downloadImage(featuredImage);
    
    // Générer seulement le format demandé
    if (format === 'square' || !format) {
      results.square = await generateSquareAd({ title, price, location, type, propertyImageBuffer, filename: `${safeTitle}-square-${timestamp}.png`, squareText });
      console.log('✅ Format carré généré');
    }
    
    if (format === 'story') {
      results.story = await generateStoryAd({ title, price, location, type, surface, propertyImageBuffer, filename: `${safeTitle}-story-${timestamp}.png`, storyText });
      console.log('✅ Format story généré');
    }
    
    console.log('✅ Visuels générés avec succès');
    return results;
  } catch (error) {
    console.error('❌ Erreur lors de la génération:', error);
    throw error;
  }
}

async function generateSquareAd({ title, price, location, type, propertyImageBuffer, filename, squareText }) {
  const width = 1080;
  const height = 1080;

  try {
    await ensureMontserratFont();
    // Créer le canvas principal
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');

    // Fond blanc en haut (partie supérieure)
    const whiteSectionHeight = 321.4; // Hauteur de la partie blanche (1080 - 758.6)
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, width, whiteSectionHeight);
    console.log('✅ Fond blanc créé: 1080x321.4px en haut');

    // Charger et dessiner l'image de la propriété (format carré 1080x758.6 fixée en bas)
    try {
      console.log('🔍 Chargement image propriété...');
      const propertyImage = await loadImage(propertyImageBuffer);
      console.log('✅ Image propriété chargée');
      // Format carré : image de 1080x758.6 fixée en bas
      const imageHeight = 758.6;
      const imageY = height - imageHeight; // Fixée en bas (1080 - 758.6 = 321.4px du haut)
      ctx.drawImage(propertyImage, 0, imageY, width, imageHeight);
      console.log('✅ Image propriété dessinée en bas: 1080x758.6 à Y=', imageY);
    } catch (error) {
      console.warn('Impossible de charger l\'image de la propriété:', error.message);
    }

    // Charger et positionner le QR code en bas à gauche (dimensions d'origine)
    try {
      console.log('🔍 Chargement QR code...');
      const qrBuffer = safeReadAsset('qrcode_dubaiimmo.png');
      console.log('✅ QR code lu, taille:', qrBuffer.length);
      const qrCode = await loadImage(qrBuffer);
      console.log('✅ QR code chargé dans Canvas');
      const qrX = 50; // Position X (gauche)
      const qrY = height - qrCode.height - 50; // Position Y (bas)
      ctx.drawImage(qrCode, qrX, qrY); // Garder les dimensions d'origine
      console.log('✅ QR code dessiné');
    } catch (error) {
      console.warn('Impossible de charger le QR code:', error.message);
    }

    // Dessiner le cartouche dynamique
    console.log('🔍 Création cartouche dynamique...');
    const cartoucheText = 'IMMOBILIER À DUBAI';
    const cartoucheWidth = Math.max(575, ctx.measureText(cartoucheText).width + 40);
    const cartoucheHeight = 90;
    const cartoucheX = 91.5;
    const cartoucheY = 280;
    
    // Fond du cartouche
    ctx.fillStyle = '#c89116';
    ctx.fillRect(cartoucheX, cartoucheY, cartoucheWidth, cartoucheHeight);
    
    // Texte du cartouche
    ctx.fillStyle = 'white';
    ctx.font = 'bold 24px Montserrat';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(cartoucheText, cartoucheX + cartoucheWidth / 2, cartoucheY + cartoucheHeight / 2);
    
    console.log(`✅ Cartouche dynamique dessiné: ${cartoucheWidth}x${cartoucheHeight}`);

    // Lignes rouges (#ff2525) aux positions spécifiques
    try {
      ctx.fillStyle = '#ff2525';
      // Première ligne
      ctx.fillRect(70.1, 21.9, 128.9, 4.7);
      // Deuxième ligne
      ctx.fillRect(70.1, 250.5, 128.9, 4.7);
      console.log('✅ Lignes rouges dessinées (square)');
    } catch (error) {
      console.warn('Impossible de dessiner les lignes rouges:', error.message);
    }

    // Lire config texte si présente
    let cfg = null;
    try {
      if (fs.existsSync('/tmp/text-square.json')) {
        cfg = JSON.parse(fs.readFileSync('/tmp/text-square.json', 'utf8'));
        console.log('🔍 Config texte (square) chargée:', cfg);
      }
    } catch (e) {
      console.warn('Impossible de lire la config texte square:', e.message);
    }

    // Dessiner le texte (style et wording identiques au format story), entre les 2 lignes rouges
    try {
      ctx.textAlign = 'left';
      const xText = 70.1;

      // Contraintes: entre Y=21.9 et Y=250.5 → hauteur dispo ~228.6px
      // Choix: taille 56px, interligne 62px → 3 lignes tiennent
      const fontSize = 56;
      const yOffset = 12; // décalage pour descendre légèrement le bloc de texte
      applyFont(ctx, { sizePx: fontSize, weight: 'bold' });

      // Déterminer les lignes (priorité: overrides > cfg > vide), et Uppercase
      const rawLine1 = (squareText && squareText.line1) ? String(squareText.line1) : (cfg && cfg.line1 ? String(cfg.line1) : '');
      const rawLine2 = (squareText && squareText.line2) ? String(squareText.line2) : (cfg && cfg.line2 ? String(cfg.line2) : '');
      const rawLine3 = (squareText && squareText.line3) ? String(squareText.line3) : (cfg && cfg.line3 ? String(cfg.line3) : '');

      const line1 = rawLine1.trim().toUpperCase();
      const line2 = rawLine2.trim().toUpperCase();
      const line3 = rawLine3.trim().toUpperCase();

      // Lignes 1-2: bleu par défaut, avec segments [[...]] en rouge si présents
      let currentY = 21.9 + yOffset + fontSize; // baseline première ligne

      if (line1) {
        drawStyledText(ctx, xText, currentY, line1, '#00247d');
      }

      if (line2) {
        currentY = (line1 ? currentY + 62 : currentY);
        drawStyledText(ctx, xText, currentY, line2, '#00247d');
      }

      if (line3) {
        currentY = ((line1 || line2) ? currentY + 62 : currentY);
        // Ligne 3: bleue par défaut (comme les autres), segments [[...]] en rouge
        drawStyledText(ctx, xText, currentY, line3, '#00247d');
      }

      console.log('✅ Texte (square) dessiné avec config/overrides (uppercase, no fallback):', { line1, line2, line3 });
    } catch (error) {
      console.warn('Impossible de dessiner le texte (square):', error.message);
    }

    // Upload sur Cloudinary
    const buffer = canvas.toBuffer('image/png');
    const uploadResult = await uploadImage(buffer, filename);

    if (uploadResult.success) {
      return {
        format: 'square',
        size: '1080x1080',
        filename,
        url: uploadResult.url,
        publicId: uploadResult.publicId,
        width: uploadResult.width,
        height: uploadResult.height
      };
    } else {
      throw new Error('Échec de l\'upload sur Cloudinary');
    }

  } catch (error) {
    console.error('❌ Erreur génération format carré:', error);
    throw error;
  }
}

async function generateStoryAd({ title, price, location, type, surface, propertyImageBuffer, filename, storyText }) {
  const width = 1080;
  const height = 1920; // Format Story

  try {
    await ensureMontserratFont();
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');

    // Bandeau blanc haut
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, width, 455);

    // Charger et dessiner l'image de la propriété (1080x1465, centrée et croppée)
    try {
      console.log('🔍 Chargement image propriété (story)...');
      const propertyImage = await loadImage(propertyImageBuffer);
      console.log('✅ Image propriété chargée');
      // Image de 1080x1465 collée en bas, centrée horizontalement
      const imageHeight = 1465;
      const imageY = 455; // Position Y pour coller en bas (1920 - 1465 = 455)
      
      // Calculer les dimensions pour centrer l'image
      const imageAspectRatio = propertyImage.width / propertyImage.height;
      const targetAspectRatio = width / imageHeight;
      
      let sourceX, sourceY, sourceWidth, sourceHeight;
      
      if (imageAspectRatio > targetAspectRatio) {
        // Image plus large que la cible, couper les côtés
        sourceHeight = propertyImage.height;
        sourceWidth = propertyImage.height * targetAspectRatio;
        sourceX = (propertyImage.width - sourceWidth) / 2;
        sourceY = 0;
      } else {
        // Image plus haute que la cible, couper le haut/bas
        sourceWidth = propertyImage.width;
        sourceHeight = propertyImage.width / targetAspectRatio;
        sourceX = 0;
        sourceY = (propertyImage.height - sourceHeight) / 2;
      }
      
      // Dessiner l'image centrée et croppée
      ctx.drawImage(propertyImage, sourceX, sourceY, sourceWidth, sourceHeight, 0, imageY, width, imageHeight);
      console.log('✅ Image propriété dessinée');
    } catch (error) {
      console.warn('Impossible de charger l\'image de la propriété:', error.message);
    }

    // Charger et positionner le QR code en bas à gauche (dimensions exactes 197x197px)
    try {
      console.log('🔍 Chargement QR code (story)...');
      const qrBuffer = safeReadAsset('qrcode_dubaiimmo.png');
      console.log('✅ QR code lu, taille:', qrBuffer.length);
      const qrCode = await loadImage(qrBuffer);
      console.log('✅ QR code chargé dans Canvas');
      const qrX = 50; // Position X (gauche)
      const qrY = height - 197 - 50; // Position Y (bas)
      ctx.drawImage(qrCode, qrX, qrY, 197, 197); // Dimensions exactes 197x197px
      console.log('✅ QR code dessiné');
    } catch (error) {
      console.warn('Impossible de charger le QR code:', error.message);
    }

    // Dessiner le cartouche dynamique
    console.log('🔍 Création cartouche dynamique...');
    const cartoucheText = 'IMMOBILIER À DUBAI';
    const cartoucheWidth = Math.max(575, ctx.measureText(cartoucheText).width + 40);
    const cartoucheHeight = 90;
    const cartoucheX = 70;
    const cartoucheY = 410;
    
    // Fond du cartouche
    ctx.fillStyle = '#c89116';
    ctx.fillRect(cartoucheX, cartoucheY, cartoucheWidth, cartoucheHeight);
    
    // Texte du cartouche
    ctx.fillStyle = 'white';
    ctx.font = 'bold 24px Montserrat';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(cartoucheText, cartoucheX + cartoucheWidth / 2, cartoucheY + cartoucheHeight / 2);
    
    console.log(`✅ Cartouche dynamique dessiné: ${cartoucheWidth}x${cartoucheHeight}`);

    // Ajouter le design selon le visuel attendu
    // Ligne bleue en haut selon spécifications exactes
    ctx.fillStyle = '#00247d';
    ctx.fillRect(70, 36, 188, 6.8);
    
    console.log('�� Début dessin texte story...');
    
    // Texte: overrides story si fournis, sinon pas de texte
    const xText = 70.1;
    applyFont(ctx, { sizePx: 80, weight: 'bold' });

    const s1 = storyText && storyText.line1 ? String(storyText.line1).trim().toUpperCase() : '';
    const s2 = storyText && storyText.line2 ? String(storyText.line2).trim().toUpperCase() : '';
    const s3 = storyText && storyText.line3 ? String(storyText.line3).trim().toUpperCase() : '';

    if (s1 || s2 || s3) {
      let y = 79 + 80;
      if (s1) { 
        drawStyledText(ctx, xText, y, s1, '#00247d'); 
        console.log('✅ Texte ligne 1 dessiné:', s1);
      }
      if (s2) { 
        y += 90; 
        drawStyledText(ctx, xText, y, s2, '#00247d'); 
        console.log('✅ Texte ligne 2 dessiné:', s2);
      }
      if (s3) { 
        y += 90; 
        drawStyledText(ctx, xText, y, s3, '#00247d'); 
        console.log('✅ Texte ligne 3 dessiné:', s3);
      }
    } else {
      console.log('ℹ️ Aucun texte story fourni, image sans texte');
    }

    console.log('🔍 Fin dessin texte story');

    // Upload sur Cloudinary
    const buffer = canvas.toBuffer('image/png');
    const uploadResult = await uploadImage(buffer, filename);

    if (uploadResult.success) {
      return {
        format: 'story',
        size: '1080x1920',
        filename,
        url: uploadResult.url,
        publicId: uploadResult.publicId,
        width: uploadResult.width,
        height: uploadResult.height
      };
    } else {
      throw new Error('Échec de l\'upload sur Cloudinary');
    }

  } catch (error) {
    console.error('❌ Erreur génération format story:', error);
    throw error;
  }
}

function drawTextOverlay(ctx, { title, price, location, type, width, height, format }) {
  const isSquare = format === 'square';
  const fontSize = isSquare ? 48 : 56;
  const titleFontSize = isSquare ? 56 : 68;
  
  // Titre (multi-lignes) en noir
  ctx.fillStyle = 'black';
  applyFont(ctx, { sizePx: titleFontSize, weight: 'bold' });
  const titleLines = wrapText(title, width - 80, titleFontSize);
  titleLines.forEach((line, index) => {
    ctx.fillText(line, 40, 80 + (index * (titleFontSize + 10)));
  });
  
  // Prix en noir (si présent)
  if (price) {
    ctx.fillStyle = 'black';
    applyFont(ctx, { sizePx: fontSize + 8, weight: 'bold' });
    ctx.fillText(price, 40, 80 + (titleLines.length * (titleFontSize + 10)) + 60);
  }
}

function wrapText(text, maxWidth, fontSize) {
  const words = text.split(' ');
  const lines = [];
  let currentLine = '';
  
  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    const testWidth = getTextWidth(testLine, fontSize);
    
    if (testWidth <= maxWidth) {
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
  
  return lines.slice(0, 3); // Limiter à 3 lignes max
}

function getTextWidth(text, fontSize) {
  // Estimation simple de la largeur du texte
  return text.length * (fontSize * 0.6);
}

async function downloadImage(imageUrl) {
  try {
    if (!imageUrl || !imageUrl.startsWith('http')) {
      // Utiliser une image par défaut
      return await createPlaceholderImage();
    }

    const response = await fetch(imageUrl);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);

  } catch (error) {
    console.warn('⚠️  Impossible de télécharger l\'image, utilisation du placeholder:', error.message);
    return await createPlaceholderImage();
  }
}

async function createPlaceholderImage() {
  // Créer une image placeholder avec Canvas
  const canvas = createCanvas(800, 500);
  const ctx = canvas.getContext('2d');
  
  ctx.fillStyle = '#e2e8f0';
  ctx.fillRect(0, 0, 800, 500);
  
  // Ajouter un texte "Image non disponible"
  ctx.fillStyle = '#666';
  ctx.font = '24px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('Image non disponible', 400, 250);
  ctx.textAlign = 'left';
  
  return canvas.toBuffer('image/png');
}

function limitText(text, maxLength) {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + '...';
}

// Helper: dessiner du texte avec segments rouges via syntaxe [[...]]
function splitStyledSegments(raw, defaultColor, highlightColor = '#ff2525') {
  // Supporter également la syntaxe red:WORD → convertie en [[WORD]]
  // Note: on uppercasera en amont; ici on remplace red:XYZ par [[XYZ]] (un mot)
  const normalized = raw.replace(/\bred:([^\s]+)/gi, '[[ $1 ]]').replace(/\[\[\s+/g, '[[').replace(/\s+\]\]/g, ']]');

  // Exemple: "NOUVEAU [[PROJET]]" → [{text:'NOUVEAU ',color:blue},{text:'PROJET',color:red}]
  if (!normalized) return [];
  const segments = [];
  let rest = normalized;
  while (rest.length) {
    const start = rest.indexOf('[[');
    if (start === -1) {
      segments.push({ text: rest, color: defaultColor });
      break;
    }
    if (start > 0) {
      segments.push({ text: rest.slice(0, start), color: defaultColor });
    }
    const end = rest.indexOf(']]', start + 2);
    if (end === -1) {
      // Pas de fermeture, considérer tout le reste en couleur par défaut
      segments.push({ text: rest.slice(start), color: defaultColor });
      break;
    }
    const highlighted = rest.slice(start + 2, end);
    if (highlighted) segments.push({ text: highlighted, color: highlightColor });
    rest = rest.slice(end + 2);
  }
  return segments;
}

function drawStyledText(ctx, x, y, rawUppercase, defaultColor) {
  if (!rawUppercase) return;
  const parts = splitStyledSegments(rawUppercase, defaultColor);
  let cursorX = x;
  for (const part of parts) {
    ctx.fillStyle = part.color;
    ctx.fillText(part.text, cursorX, y);
    const w = ctx.measureText(part.text).width;
    cursorX += w;
  }
}

// Fonction pour créer un template plus avancé (à implémenter)
async function createAdvancedTemplate(templatePath, data) {
  // Cette fonction pourrait charger un template PNG/SVG existant
  // et y injecter le texte et les images dynamiquement
  // Pour l'instant, on utilise la génération programmatique ci-dessus
}

module.exports = {
  generateAds
};
