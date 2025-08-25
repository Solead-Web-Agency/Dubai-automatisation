require('dotenv').config();

const express = require('express');
const cors = require('cors');
const { simpleParser } = require('mailparser');
const { generateAds } = require('../lib/generator');
const { parseEmailContent } = require('../lib/parser');
const { sendAdsGeneratedEmail } = require('../lib/email-sender');

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.raw({ type: 'text/plain', limit: '10mb' }));
app.use(express.static('public'));

// Route de test
app.get('/', (req, res) => {
  res.json({
    message: 'Dubai Immo Ads Generator API',
    version: '1.0.0',
    endpoints: [
      'POST /api/webhook - Recevoir les notifications d\'email',
      'POST /api/generate - Générer manuellement des visuels',
      'GET /api/test - Tester avec des données fictives',
      'POST /api/test-email - Tester l\'envoi d\'email'
    ]
  });
});

// Endpoint principal pour recevoir les webhooks email
app.post('/api/webhook', async (req, res) => {
  try {
    console.log('📧 Webhook reçu:', req.headers['content-type']);
    
    let emailData;
    
    // Gestion de différents formats d'input
    if (req.headers['content-type']?.includes('application/json')) {
      // Format JSON direct (ex: Zapier)
      emailData = req.body;
    } else {
      // Format email brut
      const parsed = await simpleParser(req.body);
      emailData = {
        subject: parsed.subject,
        html: parsed.html,
        text: parsed.text,
        from: parsed.from?.text
      };
    }

    console.log('📋 Email parsé:', {
      subject: emailData.subject,
      from: emailData.from
    });

    // Vérifier si c'est bien un email de notification Dubai Immo
    if (!isDubaiImmoNotification(emailData)) {
      return res.status(400).json({
        error: 'Email non reconnu comme notification Dubai Immo'
      });
    }

    // Parser le contenu pour extraire les données du bien
    const propertyData = parseEmailContent(emailData);
    
    if (!propertyData.title) {
      return res.status(400).json({
        error: 'Impossible d\'extraire les données du bien immobilier'
      });
    }

    console.log('🏠 Données extraites:', propertyData);

    // Générer les visuels
    const generatedAds = await generateAds(propertyData);

    console.log('🎨 Visuels générés:', generatedAds);

    res.json({
      success: true,
      property: propertyData,
      ads: generatedAds,
      message: 'Visuels générés avec succès'
    });

  } catch (error) {
    console.error('❌ Erreur webhook:', error);
    res.status(500).json({
      error: 'Erreur lors du traitement',
      details: error.message
    });
  }
});

// Endpoint pour tests manuels
app.post('/api/generate', async (req, res) => {
  try {
    const propertyData = req.body;
    
    // Validation des données requises
    if (!propertyData.title) {
      return res.status(400).json({
        error: 'Le titre du bien est requis'
      });
    }

    console.log('🎨 Génération manuelle pour:', propertyData.title);

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
});

// Endpoint de test avec données fictives
app.get('/api/test', async (req, res) => {
  try {
    const testData = {
      title: 'Villa luxueuse avec piscine - Dubai Marina',
      excerpt: 'Magnifique villa de 4 chambres avec vue sur mer, piscine privée et jardin paysager dans le prestigieux quartier de Dubai Marina.',
      featuredImage: 'https://images.unsplash.com/photo-1613977257363-707ba9348227?w=1080&h=720&fit=crop',
      permalink: 'https://dubaiimmo.com/villa-luxueuse-dubai-marina',
      price: '2,500,000 AED'
    };

    console.log('🧪 Test avec données fictives');

    const generatedAds = await generateAds(testData);

    res.json({
      success: true,
      message: 'Test réussi',
      property: testData,
      ads: generatedAds
    });

  } catch (error) {
    console.error('❌ Erreur test:', error);
    res.status(500).json({
      error: 'Erreur lors du test',
      details: error.message
    });
  }
});

// Endpoint de test email
app.post('/api/test-email', async (req, res) => {
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
});

// Fonction utilitaire pour vérifier si c'est un email Dubai Immo
function isDubaiImmoNotification(emailData) {
  const subject = emailData.subject?.toLowerCase() || '';
  const from = emailData.from?.toLowerCase() || '';
  
  return (
    subject.includes('nouveau bien') ||
    subject.includes('nouvelle propriété') ||
    subject.includes('dubai') ||
    from.includes('dubaiimmo') ||
    from.includes('wordpress')
  );
}

const PORT = process.env.PORT || 3000;

// Pour Vercel, on exporte l'app
if (process.env.NODE_ENV === 'production') {
  module.exports = app;
} else {
  // En développement local
  app.listen(PORT, () => {
    console.log(`🚀 Serveur Dubai Immo Ads démarré sur le port ${PORT}`);
    console.log(`📝 API disponible sur http://localhost:${PORT}`);
    console.log(`🧪 Test: http://localhost:${PORT}/api/test`);
  });
}
