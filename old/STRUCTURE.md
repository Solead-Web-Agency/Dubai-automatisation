# Structure du Projet : WP Residence Property Notifier

Ce projet contient un plugin WordPress complet pour automatiser les notifications par email lors de la publication de nouvelles propriétés avec le thème WP Residence.

## 📁 Structure des fichiers

```
Dubai-automatisation/
├── wp-residence-property-notifier/          # Dossier principal du plugin
│   ├── wp-residence-property-notifier.php   # Fichier principal du plugin
│   ├── config.php                          # Configuration avancée
│   ├── install.sh                          # Script d'installation automatique
│   ├── README.md                           # Documentation complète
│   └── templates/                          # Templates d'email
│       └── email-template-example.php      # Exemple de template personnalisé
└── STRUCTURE.md                            # Ce fichier
```

## 🎯 Fonctionnalités implémentées

### ✅ Détection automatique
- Détecte les nouvelles propriétés publiées (type `estate_property`)
- Différencie les types : "Appartement" et "Appartement, villa"
- Utilise les hooks WordPress pour un déclenchement en temps réel

### ✅ Système d'email
- Envoi automatique d'emails avec le titre et les détails
- Template HTML responsive et moderne
- Configuration des destinataires via l'admin WordPress
- Fonction de test intégrée

### ✅ Configuration flexible
- Interface d'administration dans WordPress
- Système de configuration avancée (`config.php`)
- Options de personnalisation étendues
- Support des templates d'email personnalisés

### ✅ Installation facilitée
- Script d'installation automatique (`install.sh`)
- Vérification des prérequis (WP Residence)
- Activation automatique du plugin
- Documentation complète

## 🚀 Installation et utilisation

### Installation rapide
1. Copiez le dossier `wp-residence-property-notifier` dans `/wp-content/plugins/`
2. Activez le plugin dans l'admin WordPress
3. Configurez l'email destinataire dans Réglages > Property Notifier

### Installation avec script
```bash
cd wp-residence-property-notifier
chmod +x install.sh
./install.sh
```

## 📧 Comment ça fonctionne

1. **Détection** : Le plugin surveille les publications de type `estate_property`
2. **Classification** : Identifie le type de propriété via les taxonomies
3. **Notification** : Envoie un email avec :
   - Titre de la propriété
   - Type (Appartement/Appartement, villa)
   - Prix, localisation, caractéristiques
   - Liens vers la propriété et l'édition
   - Image à la une (si disponible)

## 🔧 Personnalisation

### Types de propriétés
Modifiez `$wrpn_property_types_config` dans `config.php` pour ajouter de nouveaux types.

### Template d'email
1. Copiez `templates/email-template-example.php`
2. Personnalisez selon vos besoins
3. Configurez le chemin dans `config.php`

### Filtres avancés
Le fichier `config.php` permet de configurer :
- Heures d'envoi
- Jours d'envoi
- Filtres de prix
- Webhooks
- Limitation de fréquence

## 🎨 Template d'email

Le template par défaut inclut :
- Design responsive
- Image de la propriété
- Informations détaillées
- Informations de l'agent
- Boutons d'action
- Style moderne avec CSS

## 🔍 Debug et logs

- Logs automatiques dans `/wp-content/debug.log`
- Fonction de test d'email intégrée
- Configuration debug dans `config.php`

## 📋 Prérequis

- WordPress 5.0+
- WP Residence (thème)
- PHP 7.4+
- Fonction `wp_mail` active

## 🆘 Support

Consultez le `README.md` pour :
- Résolution des problèmes courants
- Configuration SMTP
- Personnalisations avancées
- Informations de debug

---

**✨ Le plugin est maintenant prêt à détecter et notifier les nouvelles propriétés automatiquement !**