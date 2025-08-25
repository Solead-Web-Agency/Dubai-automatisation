const { google } = require('googleapis');

function getOAuth2Client() {
	const clientId = process.env.GOOGLE_CLIENT_ID;
	const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
	const refreshToken = process.env.GOOGLE_REFRESH_TOKEN;

	if (!clientId || !clientSecret || !refreshToken) {
		throw new Error('Config Gmail manquante: définissez GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REFRESH_TOKEN');
	}

	const oauth2Client = new google.auth.OAuth2(clientId, clientSecret);
	oauth2Client.setCredentials({ refresh_token: refreshToken });
	return oauth2Client;
}

async function listRecentNotificationEmails({ q, maxResults = 5 }) {
	const auth = getOAuth2Client();
	const gmail = google.gmail({ version: 'v1', auth });

	const query = q || 'from:notifications@dubai-immo.com subject:"Alerte nouvelle page propriété" newer_than:2d';
	const { data } = await gmail.users.messages.list({ userId: 'me', q: query, maxResults });
	return data.messages || [];
}

async function getEmailFull(messageId) {
	const auth = getOAuth2Client();
	const gmail = google.gmail({ version: 'v1', auth });
	const { data } = await gmail.users.messages.get({ userId: 'me', id: messageId, format: 'full' });
	return data;
}

function decodeBase64url(input) {
	return Buffer.from((input || '').replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8');
}

function extractPlainTextFromMessage(message) {
	if (!message || !message.payload) return '';
	const payload = message.payload;

	// multipart
	if (payload.parts && Array.isArray(payload.parts)) {
		for (const part of payload.parts) {
			if (part.mimeType === 'text/plain' && part.body && part.body.data) {
				return decodeBase64url(part.body.data);
			}
			if (part.mimeType === 'text/html' && part.body && part.body.data) {
				const html = decodeBase64url(part.body.data);
				return htmlToText(html);
			}
			// nested parts
			if (part.parts && Array.isArray(part.parts)) {
				for (const sub of part.parts) {
					if (sub.mimeType === 'text/plain' && sub.body && sub.body.data) {
						return decodeBase64url(sub.body.data);
					}
					if (sub.mimeType === 'text/html' && sub.body && sub.body.data) {
						return htmlToText(decodeBase64url(sub.body.data));
					}
				}
			}
		}
	}

	// single body
	if (payload.mimeType === 'text/plain' && payload.body && payload.body.data) {
		return decodeBase64url(payload.body.data);
	}
	if (payload.mimeType === 'text/html' && payload.body && payload.body.data) {
		return htmlToText(decodeBase64url(payload.body.data));
	}

	return '';
}

function htmlToText(html) {
	return (html || '')
		.replace(/<br\s*\/?>(\r?\n)?/gi, '\n')
		.replace(/\n{3,}/g, '\n\n')
		.replace(/<[^>]+>/g, '')
		.replace(/\s+$/gm, '')
		.trim();
}

module.exports = {
	listRecentNotificationEmails,
	getEmailFull,
	extractPlainTextFromMessage
};


