/**
 * Module pour générer des visuels publicitaires avec Sharp
 * Formats: 1080x1080 (carré) et 1080x1920 (story)
 */

const sharp = require('sharp');
const fs = require('fs').promises;
const path = require('path');
const { createTextSVG } = require('./text-renderer');

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
    // Créer le dossier generated s'il n'existe pas
    const generatedDir = path.join(process.cwd(), 'public', 'generated');
    await fs.mkdir(generatedDir, { recursive: true });

    // Télécharger l'image de la propriété
    const propertyImageBuffer = await downloadImage(featuredImage);
    
    // Générer le format carré (1080x1080)
    results.square = await generateSquareAd({
      title,
      price,
      location,
      type,
      propertyImageBuffer,
      filename: `${safeTitle}-square-${timestamp}.png`,
      outputDir: generatedDir
    });

    // Générer le format story (1080x1920)
    results.story = await generateStoryAd({
      title,
      price,
      location,
      type,
      propertyImageBuffer,
      filename: `${safeTitle}-story-${timestamp}.png`,
      outputDir: generatedDir
    });

    console.log('✅ Visuels générés avec succès');
    return results;

  } catch (error) {
    console.error('❌ Erreur lors de la génération:', error);
    throw error;
  }
}

async function generateSquareAd({ title, price, location, type, propertyImageBuffer, filename, outputDir }) {
  const width = 1080;
  const height = 1080;

  try {
    // Charger le template de base ou créer un fond
    const background = await createBackground(width, height, '#1a365d'); // Bleu foncé Dubai

    // Préparer l'image de la propriété
    const propertyImage = await sharp(propertyImageBuffer)
      .resize(800, 500, { fit: 'cover' })
      .png()
      .toBuffer();

    // Créer le texte overlay
    const textOverlay = await createTextOverlay({
      title: limitText(title, 40),
      price,
      location,
      type,
      width: 800,
      format: 'square'
    });

    // Composer l'image finale
    const finalImage = await sharp(background)
      .composite([
        // Image de la propriété
        { input: propertyImage, top: 140, left: 140 },
        // Overlay de texte
        { input: textOverlay, top: 680, left: 140 }
      ])
      .png()
      .toFile(path.join(outputDir, filename));

    const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
    return {
      format: 'square',
      size: '1080x1080',
      filename,
      url: `${baseUrl}/generated/${filename}`,
      path: path.join(outputDir, filename)
    };

  } catch (error) {
    console.error('❌ Erreur génération format carré:', error);
    throw error;
  }
}

async function generateStoryAd({ title, price, location, type, propertyImageBuffer, filename, outputDir }) {
  const width = 1080;
  const height = 1920;

  try {
    // Charger le template de base ou créer un fond
    const background = await createBackground(width, height, '#1a365d');

    // Préparer l'image de la propriété (plus grande pour le format story)
    const propertyImage = await sharp(propertyImageBuffer)
      .resize(950, 800, { fit: 'cover' })
      .png()
      .toBuffer();

    // Créer le texte overlay
    const textOverlay = await createTextOverlay({
      title: limitText(title, 50),
      price,
      location,
      type,
      width: 950,
      format: 'story'
    });

    // Composer l'image finale
    const finalImage = await sharp(background)
      .composite([
        // Image de la propriété
        { input: propertyImage, top: 200, left: 65 },
        // Overlay de texte
        { input: textOverlay, top: 1100, left: 65 }
      ])
      .png()
      .toFile(path.join(outputDir, filename));

    const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
    return {
      format: 'story',
      size: '1080x1920',
      filename,
      url: `${baseUrl}/generated/${filename}`,
      path: path.join(outputDir, filename)
    };

  } catch (error) {
    console.error('❌ Erreur génération format story:', error);
    throw error;
  }
}

async function createBackground(width, height, color) {
  // Créer un fond dégradé ou uni
  return sharp({
    create: {
      width,
      height,
      channels: 3,
      background: color
    }
  })
  .png()
  .toBuffer();
}

async function createTextOverlay({ title, price, location, type, width, format }) {
  const height = format === 'square' ? 300 : 400;
  
  // Créer le SVG avec le texte
  const svgText = createTextSVG({
    title,
    price,
    location,
    type,
    width,
    height,
    format
  });

  // Convertir le SVG en buffer PNG
  const textBuffer = await sharp(Buffer.from(svgText))
    .png()
    .toBuffer();

  return textBuffer;
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
  // Créer une image placeholder
  return sharp({
    create: {
      width: 800,
      height: 500,
      channels: 3,
      background: '#e2e8f0'
    }
  })
  .png()
  .toBuffer();
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
