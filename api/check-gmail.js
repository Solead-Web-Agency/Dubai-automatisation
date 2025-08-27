const { listRecentNotificationEmails, getEmailFull, extractPlainTextFromMessage } = require('../lib/gmail');
const { parseEmailContent } = require('../lib/parser');
const { generateAds } = require('../lib/generator');
const { sendAdsGeneratedEmail } = require('../lib/email-sender');

module.exports = async (req, res) => {
	if (req.method !== 'GET' && req.method !== 'POST') {
		return res.status(405).json({ error: 'Méthode non autorisée' });
	}

	try {
		// Protection: si pas de config, on skip proprement
		if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET || !process.env.GOOGLE_REFRESH_TOKEN) {
			return res.status(200).json({
				success: false,
				message: 'Config Gmail absente, endpoint inactif',
			});
		}

		const q = (req.query && req.query.q) || undefined;
		// Overrides texte (pour format carré pour l'instant)
		const squareOverrides = {
			line1: req.query && req.query.line1 ? String(req.query.line1) : undefined,
			line2: req.query && req.query.line2 ? String(req.query.line2) : undefined,
			line3: req.query && req.query.line3 ? String(req.query.line3) : undefined,
		};

		const messages = await listRecentNotificationEmails({ q, maxResults: 5 });
		if (!messages.length) {
			return res.json({ success: true, processed: 0, results: [] });
		}

		const results = [];
		for (const m of messages) {
			const full = await getEmailFull(m.id);
			const text = extractPlainTextFromMessage(full);
			const headers = (full.payload.headers || []).reduce((acc, h) => { acc[h.name.toLowerCase()] = h.value; return acc; }, {});

			const emailData = {
				subject: headers['subject'] || '',
				text,
				html: '',
				from: headers['from'] || ''
			};

			const property = parseEmailContent(emailData);
			const ads = await generateAds(property, { squareText: squareOverrides });
			
			// Envoyer l'email avec les visuels générés
			try {
				await sendAdsGeneratedEmail(property, ads);
				console.log('✅ Email envoyé pour:', property.title);
			} catch (emailError) {
				console.warn('⚠️ Erreur envoi email:', emailError.message);
			}
			
			results.push({ property, ads });
		}

		return res.json({ success: true, processed: results.length, results });
	} catch (error) {
		console.error('check-gmail error:', error);
		return res.status(500).json({ success: false, error: error.message });
	}
};


