/**
 * Module pour générer des visuels publicitaires avec Sharp
 * Formats: 1080x1080 (carré) et 1080x1920 (story)
 */

const { createCanvas, loadImage, registerFont } = require('canvas');
const { uploadImage } = require('./cloudinary');

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
    // Créer le canvas principal
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');

    // Pas besoin de remplir le fond, l'image de la propriété va couvrir tout le canvas

    // Charger et dessiner l'image de la propriété (redimensionnée pour le format carré)
    try {
      const propertyImage = await loadImage(propertyImageBuffer);
      // Redimensionner l'image pour s'adapter au format carré 1080x1080
      ctx.drawImage(propertyImage, 0, 0, width, height);
    } catch (error) {
      console.warn('Impossible de charger l\'image de la propriété:', error.message);
    }

    // Charger et positionner le QR code en bas à gauche (dimensions d'origine)
    try {
      const qrCode = await loadImage('./qrcode_dubaiimmo.png');
      const qrX = 50; // Position X (gauche)
      const qrY = height - qrCode.height - 50; // Position Y (bas)
      ctx.drawImage(qrCode, qrX, qrY); // Garder les dimensions d'origine
    } catch (error) {
      console.warn('Impossible de charger le QR code:', error.message);
    }

    // Charger et positionner le bloc texte (dimensions d'origine)
    try {
      const blocTexte = await loadImage('./bloctexte_dubaiimmo.png');
      const blocX = (width - blocTexte.width) / 2; // Centré horizontalement
      const blocY = (height - blocTexte.height) / 2; // Centré verticalement
      ctx.drawImage(blocTexte, blocX, blocY); // Garder les dimensions d'origine
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
  const height = 1465; // Nouvelle hauteur selon spécifications

  try {
    // Créer le canvas principal
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');

    // Pas besoin de remplir le fond, l'image de la propriété va couvrir tout le canvas

    // Charger et dessiner l'image de la propriété (redimensionnée pour le format portrait)
    try {
      const propertyImage = await loadImage(propertyImageBuffer);
      // Redimensionner l'image pour s'adapter au format portrait 1080x1465
      ctx.drawImage(propertyImage, 0, 0, width, height);
    } catch (error) {
      console.warn('Impossible de charger l\'image de la propriété:', error.message);
    }

    // Charger et positionner le QR code en bas à gauche (dimensions d'origine)
    try {
      const qrCode = await loadImage('./qrcode_dubaiimmo.png');
      const qrX = 50; // Position X (gauche)
      const qrY = height - qrCode.height - 50; // Position Y (bas)
      ctx.drawImage(qrCode, qrX, qrY); // Garder les dimensions d'origine
    } catch (error) {
      console.warn('Impossible de charger le QR code:', error.message);
    }

    // Charger et positionner le bloc texte (dimensions d'origine)
    try {
      const blocTexte = await loadImage('./bloctexte_dubaiimmo.png');
      const blocX = 200; // Décalé de 200px vers la droite
      const blocY = (height - blocTexte.height) / 2; // Centré verticalement
      ctx.drawImage(blocTexte, blocX, blocY); // Garder les dimensions d'origine
    } catch (error) {
      console.warn('Impossible de charger le bloc texte:', error.message);
    }

    // Dessiner le texte
    drawTextOverlay(ctx, {
      title: limitText(title, 50),
      price,
      location,
      type,
      width,
      height,
      format: 'story'
    });

    // Upload sur Cloudinary
    const buffer = canvas.toBuffer('image/png');
    const uploadResult = await uploadImage(buffer, filename);

    if (uploadResult.success) {
      return {
        format: 'story',
        size: '1080x1465',
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
  
  // Dessiner le fond semi-transparent pour le texte
  ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
  ctx.fillRect(0, 0, width, height);
  
  // Type de bien
  ctx.fillStyle = '#4FC3F7';
  ctx.font = `${fontSize - 12}px monospace`;
  ctx.fillText(type.toUpperCase(), 40, 40);
  
  // Titre (multi-lignes)
  ctx.fillStyle = 'white';
  ctx.font = `${titleFontSize}px monospace`;
  const titleLines = wrapText(title, width - 80, titleFontSize);
  titleLines.forEach((line, index) => {
    ctx.fillText(line, 40, 80 + (index * (titleFontSize + 10)));
  });
  
  // Localisation
  ctx.fillStyle = '#E0E0E0';
  ctx.font = `${fontSize - 8}px monospace`;
  ctx.fillText(`📍 ${location}`, 40, 80 + (titleLines.length * (titleFontSize + 10)) + 20);
  
  // Prix
  if (price) {
    ctx.fillStyle = '#FFD700';
    ctx.font = `${fontSize + 8}px monospace`;
    ctx.fillText(price, 40, 80 + (titleLines.length * (titleFontSize + 10)) + 60);
  }
  
  // CTA Button
  ctx.fillStyle = '#FF6B35';
  ctx.fillRect(width - 250, height - 80, 200, 50);
  ctx.fillStyle = 'white';
  ctx.font = `${fontSize - 4}px monospace`;
  ctx.textAlign = 'center';
  ctx.fillText('DÉCOUVRIR', width - 150, height - 50);
  ctx.textAlign = 'left';
  
  // Logo placeholder
  ctx.fillStyle = '#1976D2';
  ctx.fillRect(width - 120, 20, 100, 40);
  ctx.fillStyle = 'white';
  ctx.font = '16px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('DUBAI IMMO', width - 70, 45);
  ctx.textAlign = 'left';
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
