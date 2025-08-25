# 🏢 Dubai Immo Ads Generator

Système d'automatisation pour générer des visuels publicitaires à partir des notifications de nouveaux biens immobiliers.

## 🎯 Fonctionnalités

- **Réception automatique** d'emails de notification WordPress
- **Parsing intelligent** du contenu (titre, image, prix, localisation)
- **Génération de visuels** en formats Meta Ads (1080x1080 et 1080x1920)
- **API REST** pour intégration et tests
- **Déploiement Vercel** serverless

## 🚀 Installation

```bash
# Cloner le projet
git clone <votre-repo>
cd dubai-immo-ads

# Installer les dépendances
npm install

# Démarrer en développement
npm run dev
```

## 📡 Endpoints API

### `GET /`
Informations sur l'API et liste des endpoints

### `POST /api/webhook`
Endpoint principal pour recevoir les notifications email
- Supporte les formats JSON et email brut
- Parse automatiquement le contenu
- Génère les visuels publicitaires

### `POST /api/generate`
Génération manuelle de visuels
```json
{
  "title": "Villa luxueuse - Dubai Marina",
  "featuredImage": "https://...",
  "price": "2,500,000 AED",
  "location": "Dubai Marina"
}
```

### `GET /api/test`
Test avec données fictives pour validation

## 🎨 Formats générés

- **Carré (1080x1080)** : Posts Facebook/Instagram
- **Story (1080x1920)** : Stories Instagram/Facebook

## 🔧 Configuration

Créer un fichier `.env` :
```env
NODE_ENV=development
WEBHOOK_SECRET=your_secret
BASE_URL=http://localhost:3000
```

## 📦 Déploiement Vercel

```bash
# Installer Vercel CLI
npm i -g vercel

# Déployer
vercel --prod
```

## 🛠️ Technologies

- **Node.js** + Express
- **Sharp** pour la génération d'images
- **Mailparser** pour le parsing d'emails
- **Vercel** pour l'hébergement serverless

## 📋 Todo

- [x] Structure du projet
- [x] API endpoints
- [x] Parsing email
- [x] Génération basique d'images
- [ ] Templates visuels avancés
- [ ] Intégration Meta Marketing API
- [ ] Tests unitaires
- [ ] Documentation API complète

## 🐛 Debug

Logs disponibles dans la console :
- 📧 Réception webhook
- 📋 Parsing des données
- 🏠 Extraction des propriétés
- 🎨 Génération des visuels

## 🔗 Intégrations possibles

- **Mailgun/Postmark** : Réception d'emails
- **Zapier** : Automatisation workflow
- **Meta Marketing API** : Upload automatique des visuels
- **S3/GCS** : Stockage persistant des images
