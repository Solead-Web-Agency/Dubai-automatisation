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
  try {
    // 1) racine du projet
    const p1 = resolveAssetPath(filename);
    if (fs.existsSync(p1)) return fs.readFileSync(p1);
    // 2) sous-dossier /public
    const p2 = resolveAssetPath('public', filename);
    if (fs.existsSync(p2)) return fs.readFileSync(p2);
    // 3) dossier courant de ce module
    const p3 = path.resolve(__dirname, '..', filename);
    if (fs.existsSync(p3)) return fs.readFileSync(p3);
  } catch (e) {
    console.warn('safeReadAsset error', filename, e.message);
  }
  throw new Error(`Asset introuvable: ${filename}`);
}
// Enregistrer la police si disponible localement; fallback sinon
let montserratAvailable = false;
async function ensureMontserratFont() {
  try {
    const localPath = resolveAssetPath('fonts', 'Montserrat-Bold.ttf');
    if (fs.existsSync(localPath)) {
      registerFont(localPath, { family: 'Montserrat', weight: 'bold' });
      montserratAvailable = true;
      return;
    }
  } catch (_) {}

  // Fallback: télécharger en runtime dans /tmp si introuvable
  try {
    const tmpPath = path.join('/tmp', 'Montserrat-Bold.ttf');
    if (!fs.existsSync(tmpPath)) {
      await downloadFile(
        // URL statique Google Fonts (peut évoluer). Alternative: jsDelivr
        'https://github.com/google/fonts/raw/main/ofl/montserrat/Montserrat-Bold.ttf',
        tmpPath
      );
    }
    if (fs.existsSync(tmpPath)) {
      registerFont(tmpPath, { family: 'Montserrat', weight: 'bold' });
      montserratAvailable = true;
    }
  } catch (e) {
    console.warn('Police Montserrat indisponible, fallback sans-serif:', e.message);
  }
}

function downloadFile(url, destPath) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(destPath);
    https
      .get(url, response => {
        if (response.statusCode !== 200) {
          return reject(new Error(`HTTP ${response.statusCode}`));
        }
        response.pipe(file);
        file.on('finish', () => file.close(resolve));
      })
      .on('error', err => {
        try { fs.unlinkSync(destPath); } catch (_) {}
        reject(err);
      });
  });
}

function applyFont(ctx, { sizePx, weight = 'bold' }) {
  if (montserratAvailable) {
    ctx.font = `${weight} ${sizePx}px Montserrat`;
  } else {
    ctx.font = `${weight} ${sizePx}px sans-serif`;
  }
}

async function generateAds(propertyData) {
  console.log('🎨 Génération des visuels pour:', propertyData.title);

  const { title, featuredImage, price, location, type } = propertyData;
  
  // Timestamp pour les noms de fichiers uniques
  const timestamp = Date.now();
  const safeTitle = title.toLowerCase()
    .replace(/[^a-z0-9]/g, '-')
    .replace(/-+/g, '-')
    .substring(0, 30);

  const results = {
    square: null,
    story: null
  };

  try {
    // Télécharger l'image de la propriété
    const propertyImageBuffer = await downloadImage(featuredImage);
    
    // Générer le format carré (1080x1080)
    results.square = await generateSquareAd({
      title,
      price,
      location,
      type,
      propertyImageBuffer,
      filename: `${safeTitle}-square-${timestamp}.png`
    });

    // Générer le format story (1080x1920)
    results.story = await generateStoryAd({
      title,
      price,
      location,
      type,
      propertyImageBuffer,
      filename: `${safeTitle}-story-${timestamp}.png`
    });

    console.log('✅ Visuels générés avec succès');
    return results;

  } catch (error) {
    console.error('❌ Erreur lors de la génération:', error);
    throw error;
  }
}

async function generateSquareAd({ title, price, location, type, propertyImageBuffer, filename }) {
  const width = 1080;
  const height = 1080;

  try {
    await ensureMontserratFont();
    // Créer le canvas principal
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');

    // Pas besoin de remplir le fond, l'image de la propriété va couvrir tout le canvas

    // Charger et dessiner l'image de la propriété (format carré 1080x650 selon tes spécifications)
    try {
      const propertyImage = await loadImage(propertyImageBuffer);
      // Format carré : image de 1080x650 centrée
      const imageHeight = 650;
      const imageY = (height - imageHeight) / 2; // Centrer verticalement
      ctx.drawImage(propertyImage, 0, imageY, width, imageHeight);
    } catch (error) {
      console.warn('Impossible de charger l\'image de la propriété:', error.message);
    }

    // Charger et positionner le QR code en bas à gauche (dimensions d'origine)
    try {
      const qrBuffer = safeReadAsset('qrcode_dubaiimmo.png');
      const qrCode = await loadImage(qrBuffer);
      const qrX = 50; // Position X (gauche)
      const qrY = height - qrCode.height - 50; // Position Y (bas)
      ctx.drawImage(qrCode, qrX, qrY); // Garder les dimensions d'origine
    } catch (error) {
      console.warn('Impossible de charger le QR code:', error.message);
    }

    // Charger et positionner le bloc texte selon tes spécifications (format carré)
    try {
      const blocBuffer = safeReadAsset('bloctexte_dubaiimmo.png');
      const blocTexte = await loadImage(blocBuffer);
      // Format carré : bloc texte de 1080x650 centré
      const blocWidth = 1080;
      const blocHeight = 650;
      const blocX = (width - blocWidth) / 2; // Centré horizontalement
      const blocY = (height - blocHeight) / 2; // Centré verticalement
      ctx.drawImage(blocTexte, blocX, blocY, blocWidth, blocHeight);
    } catch (error) {
      console.warn('Impossible de charger le bloc texte:', error.message);
    }

    // Dessiner le texte
    drawTextOverlay(ctx, {
      title: limitText(title, 40),
      price,
      location,
      type,
      width,
      height,
      format: 'square'
    });

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

async function generateStoryAd({ title, price, location, type, propertyImageBuffer, filename }) {
  const width = 1080;
  const height = 1920; // Format Story reste 1080x1920

  try {
    await ensureMontserratFont();
    // Créer le canvas principal
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');

    // Bandeau blanc en haut pour le texte (0 à 455px)
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, width, 455);

    // Charger et dessiner l'image de la propriété (1080x1465, centrée et croppée)
    try {
      const propertyImage = await loadImage(propertyImageBuffer);
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
    } catch (error) {
      console.warn('Impossible de charger l\'image de la propriété:', error.message);
    }

    // Charger et positionner le QR code en bas à gauche (dimensions exactes 197x197px)
    try {
      const qrBuffer = safeReadAsset('qrcode_dubaiimmo.png');
      const qrCode = await loadImage(qrBuffer);
      const qrX = 50; // Position X (gauche)
      const qrY = height - 197 - 50; // Position Y (bas)
      ctx.drawImage(qrCode, qrX, qrY, 197, 197); // Dimensions exactes 197x197px
    } catch (error) {
      console.warn('Impossible de charger le QR code:', error.message);
    }

    // Charger et positionner le bloc texte selon tes spécifications (format portrait)
    try {
      const blocBuffer = safeReadAsset('bloctexte_dubaiimmo.png');
      const blocTexte = await loadImage(blocBuffer);
      // Format portrait : bloc texte de 575x90px à cheval entre bandeau et image
      const blocWidth = 575;
      const blocHeight = 90;
      const blocX = 70; // Aligné avec le texte à 70px du bord gauche
      // Position Y pour être à cheval : centré sur la ligne de séparation (455px)
      const blocY = 455 - (blocHeight / 2); // À cheval entre bandeau (0-455) et image (455-1920)
      ctx.drawImage(blocTexte, blocX, blocY, blocWidth, blocHeight);
    } catch (error) {
      console.warn('Impossible de charger le bloc texte:', error.message);
    }

    // Ajouter le design selon le visuel attendu
    // Ligne bleue en haut selon spécifications exactes
    ctx.fillStyle = '#00247d';
    ctx.fillRect(70, 36, 188, 6.8);
    
          // "NOUVEAU PROJET" en bleu
      ctx.fillStyle = '#00247d';
      applyFont(ctx, { sizePx: 90, weight: 'bold' });
      ctx.textAlign = 'left';
      ctx.fillText('NOUVEAU PROJET', 70, 79 + 90); // 79px du haut + hauteur de la police
      
      // "APPARTEMENT 70M2" en bleu
      ctx.fillText('APPARTEMENT 70M2', 70, 79 + 90 + 100); // 79px + 90px + espacement modéré
      
      // "À DUBAI DÈS 250.000€" en rouge
      ctx.fillStyle = '#ff2525';
      ctx.fillText('À DUBAI DÈS 250.000€', 70, 79 + 90 + 200); // 79px + 90px + espacement modéré

    // Plus besoin d'afficher le titre, il est déjà dans le bandeau blanc

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

// Fonction pour créer un template plus avancé (à implémenter)
async function createAdvancedTemplate(templatePath, data) {
  // Cette fonction pourrait charger un template PNG/SVG existant
  // et y injecter le texte et les images dynamiquement
  // Pour l'instant, on utilise la génération programmatique ci-dessus
}

module.exports = {
  generateAds
};
