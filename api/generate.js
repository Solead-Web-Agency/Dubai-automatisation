// Ce fichier est une alternative pour un endpoint séparé si nécessaire
// Pour l'instant, la logique est intégrée dans webhook.js

const { generateAds } = require('../lib/generator');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Méthode non autorisée' });
  }

  try {
    const propertyData = req.body;
    
    if (!propertyData.title) {
      return res.status(400).json({
        error: 'Le titre du bien est requis'
      });
    }

    console.log('🎨 Génération via endpoint dédié pour:', propertyData.title);

    const generatedAds = await generateAds(propertyData);

    res.json({
      success: true,
      property: propertyData,
      ads: generatedAds
    });

  } catch (error) {
    console.error('❌ Erreur génération:', error);
    res.status(500).json({
      error: 'Erreur lors de la génération',
      details: error.message
    });
  }
};
