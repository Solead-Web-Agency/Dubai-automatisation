const { listRecentNotificationEmails, getEmailFull, extractPlainTextFromMessage } = require('../lib/gmail');
const { parseEmailContent } = require('../lib/parser');
const { generateAds } = require('../lib/generator');
const { sendAdsGeneratedEmail } = require('../lib/email-sender');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Méthode non autorisée' });
  }

  try {
    console.log('🚀 Déclenchement manuel de la vérification des emails...');
    
    // Paramètres optionnels
    const { query, recipientEmail } = req.body;
    
    // Vérifier les emails récents
    const messages = await listRecentNotificationEmails({ 
      q: query || 'from:notifications@dubai-immo.com subject:"Alerte nouvelle page propriété" newer_than:7d',
      maxResults: 10
    });

    if (!messages || messages.length === 0) {
      return res.json({
        success: true,
        message: 'Aucun nouvel email de notification trouvé',
        count: 0
      });
    }

    console.log(`📧 ${messages.length} emails trouvés, traitement en cours...`);
    
    const results = [];
    
    for (const message of messages) {
      try {
        // Récupérer le contenu complet de l'email
        const emailData = await getEmailFull(message.id);
        const emailText = extractPlainTextFromMessage(emailData);
        
        // Parser le contenu de l'email
        const property = parseEmailContent({
          subject: emailData.payload?.headers?.find(h => h.name === 'Subject')?.value || '',
          text: emailText,
          html: emailText
        });

        if (!property.title || !property.featuredImage) {
          console.warn('⚠️ Email ignoré - données incomplètes:', message.id);
          continue;
        }

        // Générer les visuels publicitaires
        const ads = await generateAds(property);
        
        // Envoyer l'email avec les visuels générés
        try {
          await sendAdsGeneratedEmail(property, ads, recipientEmail);
          console.log('✅ Email envoyé pour:', property.title);
        } catch (emailError) {
          console.warn('⚠️ Erreur envoi email:', emailError.message);
        }

        results.push({ property, ads });
        
      } catch (error) {
        console.error('❌ Erreur traitement email:', message.id, error.message);
      }
    }

    console.log(`🎉 Traitement terminé: ${results.length} visuels générés`);
    
    res.json({
      success: true,
      message: `Traitement terminé: ${results.length} visuels générés`,
      count: results.length,
      results: results.map(r => ({
        title: r.property.title,
        square: r.ads.square?.url,
        story: r.ads.story?.url
      }))
    });

  } catch (error) {
    console.error('❌ Erreur déclenchement manuel:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};
