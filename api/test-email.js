const { sendAdsGeneratedEmail } = require('../lib/email-sender');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Méthode non autorisée' });
  }

  try {
    console.log('🧪 Test de l\'envoi d\'email...');
    
    // Vérifier la configuration
    console.log('🔧 Configuration email:', {
      GMAIL_USER: process.env.GMAIL_USER ? '✅ Configuré' : '❌ Manquant',
      GMAIL_APP_PASSWORD: process.env.GMAIL_APP_PASSWORD ? '✅ Configuré' : '❌ Manquant',
      NOTIFICATION_EMAIL: process.env.NOTIFICATION_EMAIL ? '✅ Configuré' : '❌ Manquant',
      SMTP_HOST: process.env.SMTP_HOST ? '✅ Configuré' : '❌ Manquant'
    });

    // Données de test
    const testProperty = {
      title: 'Villa de test - Dubai Marina',
      type: 'Villa',
      location: 'Dubai Marina',
      price: '2,500,000 AED',
      excerpt: 'Magnifique villa de test pour vérifier l\'envoi d\'email',
      permalink: 'https://dubai-immo.com/test'
    };

    const testAds = {
      square: {
        url: 'https://res.cloudinary.com/df2oumhnr/image/upload/v1/dubai-immo-ads/test-square.png',
        format: 'square',
        size: '1080x1080'
      },
      story: {
        url: 'https://res.cloudinary.com/df2oumhnr/image/upload/v1/dubai-immo-ads/test-story.png',
        format: 'story',
        size: '1080x1920'
      }
    };

    // Récupérer l'email de destination depuis la requête ou utiliser la variable d'environnement
    const recipientEmail = req.body.recipientEmail || process.env.NOTIFICATION_EMAIL;
    
    if (!recipientEmail) {
      return res.status(400).json({
        success: false,
        error: 'Email de destination manquant. Ajoutez recipientEmail dans le body ou configurez NOTIFICATION_EMAIL'
      });
    }

    console.log('📧 Envoi vers:', recipientEmail);

    // Tenter l'envoi
    const result = await sendAdsGeneratedEmail(testProperty, testAds, recipientEmail);

    if (result.success) {
      res.json({
        success: true,
        message: 'Email de test envoyé avec succès !',
        messageId: result.messageId,
        recipient: recipientEmail
      });
    } else {
      res.json({
        success: false,
        message: 'Échec de l\'envoi',
        error: result.message
      });
    }

  } catch (error) {
    console.error('❌ Erreur test email:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};
