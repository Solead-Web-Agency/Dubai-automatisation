# 🚀 Guide de déploiement Vercel

## Prérequis

1. Compte Vercel (gratuit)
2. CLI Vercel installé : `npm i -g vercel`
3. Projet Git pushé sur GitHub/GitLab/Bitbucket

## Étapes de déploiement

### 1. Configuration locale

```bash
# Se connecter à Vercel
vercel login

# Dans le dossier du projet
cd dubai-immo-ads
```

### 2. Premier déploiement

```bash
# Déploiement initial
vercel

# Suivre les prompts :
# - Set up and deploy? Y
# - Which scope? (votre compte)
# - Link to existing project? N
# - Project name: dubai-immo-ads
# - Directory: ./
```

### 3. Configuration des variables d'environnement

```bash
# Ajouter les variables via CLI
vercel env add WEBHOOK_SECRET
vercel env add BASE_URL

# Ou via l'interface web Vercel
```

Variables nécessaires :
- `WEBHOOK_SECRET` : Secret pour sécuriser le webhook
- `BASE_URL` : URL de production (ex: https://dubai-immo-ads.vercel.app)
- `META_ACCESS_TOKEN` : Token Meta Marketing API (optionnel)
- `META_AD_ACCOUNT_ID` : ID du compte publicitaire Meta (optionnel)

### 4. Déploiement en production

```bash
# Déploiement en production
vercel --prod
```

## URLs après déploiement

- **API principale** : `https://votre-app.vercel.app/`
- **Webhook** : `https://votre-app.vercel.app/api/webhook`
- **Test** : `https://votre-app.vercel.app/api/test`
- **Génération manuelle** : `https://votre-app.vercel.app/api/generate`

## Configuration du webhook email

### Option 1: Mailgun
```bash
curl -X POST https://api.mailgun.net/v3/your-domain/routes \
  -F priority=0 \
  -F description="Dubai Immo Webhook" \
  -F expression="match_recipient('property@your-domain.com')" \
  -F action="forward('https://votre-app.vercel.app/api/webhook')"
```

### Option 2: Zapier
1. Créer un Zap avec trigger "Email Parser"
2. Configurer l'action "Webhooks by Zapier"
3. URL : `https://votre-app.vercel.app/api/webhook`
4. Method : POST
5. Data : JSON avec les champs parsés

### Option 3: WordPress Plugin
Modifier votre plugin WordPress pour envoyer directement à l'API :

```php
wp_remote_post('https://votre-app.vercel.app/api/webhook', [
    'body' => json_encode([
        'subject' => $post_title,
        'html' => $post_content,
        'featuredImage' => $featured_image_url,
        'permalink' => get_permalink($post_id)
    ]),
    'headers' => ['Content-Type' => 'application/json']
]);
```

## Surveillance et logs

```bash
# Voir les logs en temps réel
vercel logs --follow

# Logs d'une fonction spécifique
vercel logs api/webhook.js
```

## Mise à jour

```bash
# Push sur Git et déploiement automatique
git add .
git commit -m "Update features"
git push origin main

# Ou déploiement manuel
vercel --prod
```

## Troubleshooting

### Erreur Sharp sur Vercel
Si Sharp ne fonctionne pas, ajouter dans `package.json` :
```json
{
  "engines": {
    "node": "18.x"
  }
}
```

### Timeout sur génération d'images
Augmenter le timeout dans `vercel.json` :
```json
{
  "functions": {
    "api/**/*.js": {
      "maxDuration": 30
    }
  }
}
```

### Variables d'environnement manquantes
Vérifier via l'interface Vercel ou :
```bash
vercel env ls
```
