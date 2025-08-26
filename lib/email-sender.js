const nodemailer = require('nodemailer');

// Configuration du transporteur email
function createTransporter() {
  // Option 1: Gmail SMTP
  if (process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD) {
    return nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD
      }
    });
  }
  
  // Option 2: SMTP personnalisé
  if (process.env.SMTP_HOST) {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT || 587,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });
  }
  
  throw new Error('Configuration email manquante');
}

async function sendAdsGeneratedEmail(propertyData, generatedAds, recipientEmail) {
  try {
    if (!process.env.GMAIL_USER && !process.env.SMTP_HOST) {
      console.warn('⚠️ Configuration email manquante, envoi d\'email désactivé');
      return { success: false, message: 'Configuration email manquante' };
    }

    const transporter = createTransporter();
    
    // Construire le contenu de l'email
    const emailContent = buildEmailContent(propertyData, generatedAds);
    
    // Gérer plusieurs emails de destination
    let emailDestinations = [];
    
    if (recipientEmail) {
      // Si un email spécifique est fourni, l'utiliser
      emailDestinations = [recipientEmail];
    } else if (process.env.NOTIFICATION_EMAIL) {
      // Sinon, parser la variable d'environnement (peut contenir plusieurs emails)
      emailDestinations = process.env.NOTIFICATION_EMAIL
        .split(',')
        .map(email => email.trim())
        .filter(email => email && email.includes('@'));
    }
    
    if (emailDestinations.length === 0) {
      throw new Error('Aucun email de destination configuré');
    }

    console.log(`📧 Envoi vers ${emailDestinations.length} destinataire(s):`, emailDestinations);

    // Envoyer l'email
    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM || process.env.GMAIL_USER || 'noreply@dubai-immo.com',
      to: emailDestinations.join(', '),
      subject: `Visuels publicitaires générés - ${propertyData.title}`,
      html: emailContent.html,
      text: emailContent.text
    });

    console.log('✅ Email envoyé:', info.messageId);
    
    return {
      success: true,
      messageId: info.messageId,
      message: 'Email envoyé avec succès'
    };

  } catch (error) {
    console.error('❌ Erreur envoi email:', error);
    throw error;
  }
}

function buildEmailContent(property, ads) {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .header { background: #1a365d; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; }
        .property-info { background: #f8f9fa; padding: 15px; border-radius: 8px; margin: 20px 0; }
        .ads-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin: 20px 0; }
        .ad-item { text-align: center; padding: 15px; border: 1px solid #ddd; border-radius: 8px; }
        .ad-image { max-width: 100%; height: auto; border-radius: 4px; }
        .cta-button { background: #FF6B35; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin: 10px 0; }
        .footer { background: #f8f9fa; padding: 15px; text-align: center; margin-top: 30px; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>Visuels Publicitaires Générés</h1>
        <p>Dubai Immo - Automatisation</p>
      </div>
      
      <div class="content">
        <h2>🏠 Nouveau bien détecté</h2>
        <div class="property-info">
          <h3>${property.title}</h3>
          <p><strong>Type:</strong> ${property.type}</p>
          <p><strong>Localisation:</strong> ${property.location}</p>
          ${property.price ? `<p><strong>Prix:</strong> ${property.price}</p>` : ''}
          ${property.excerpt ? `<p><strong>Description:</strong> ${property.excerpt}</p>` : ''}
          ${property.permalink ? `<p><strong>Lien:</strong> <a href="${property.permalink}">Voir le bien</a></p>` : ''}
        </div>
        
        <h2>📱 Visuels générés</h2>
        <div class="ads-grid">
          ${ads.square ? `
            <div class="ad-item">
              <h3>Format Carré (1080x1080)</h3>
              <img src="${ads.square.url}" alt="Visuel carré" class="ad-image">
              <br>
              <a href="${ads.square.url}" class="cta-button" target="_blank">Télécharger</a>
            </div>
          ` : ''}
          
          ${ads.story ? `
            <div class="ad-item">
              <h3>Format Story (1080x1920)</h3>
              <img src="${ads.story.url}" alt="Visuel story" class="ad-image">
              <br>
              <a href="${ads.story.url}" class="cta-button" target="_blank">Télécharger</a>
            </div>
          ` : ''}
        </div>
        
        <p><strong>💡 Utilisation:</strong> Ces visuels sont prêts à être utilisés sur Meta Ads, Facebook, Instagram et autres plateformes publicitaires.</p>
      </div>
      
      <div class="footer">
        <p>Généré automatiquement par Dubai Immo Ads Generator</p>
        <p>Date: ${new Date().toLocaleString('fr-FR')}</p>
      </div>
    </body>
    </html>
  `;

  const text = `
🎨 VISUELS PUBLICITAIRES GÉNÉRÉS - Dubai Immo

🏠 NOUVEAU BIEN DÉTECTÉ
${property.title}
Type: ${property.type}
Localisation: ${property.location}
${property.price ? `Prix: ${property.price}` : ''}
${property.excerpt ? `Description: ${property.excerpt}` : ''}
${property.permalink ? `Lien: ${property.permalink}` : ''}

📱 VISUELS GÉNÉRÉS
${ads.square ? `Format Carré (1080x1080): ${ads.square.url}` : ''}
${ads.story ? `Format Story (1080x1920): ${ads.story.url}` : ''}

💡 Ces visuels sont prêts à être utilisés sur Meta Ads, Facebook, Instagram et autres plateformes publicitaires.

Généré automatiquement le ${new Date().toLocaleString('fr-FR')}
  `;

  return { html, text };
}

module.exports = {
  sendAdsGeneratedEmail
};
