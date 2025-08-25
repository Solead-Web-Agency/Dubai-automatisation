# WP Residence Property Notifier

Plugin WordPress qui envoie automatiquement des notifications par email lors de la publication de nouvelles propriétés avec le thème WP Residence.

## Fonctionnalités

- ✅ Détection automatique des nouvelles propriétés publiées
- ✅ Identification des types de propriétés (Appartement, Appartement villa)
- ✅ Envoi d'emails avec le titre et les détails de la propriété
- ✅ Interface d'administration pour configurer les destinataires
- ✅ Fonction de test d'email
- ✅ Support des emails HTML avec informations détaillées

## Installation

1. **Télécharger le plugin** : Copiez le dossier `wp-residence-property-notifier` dans le répertoire `/wp-content/plugins/` de votre site WordPress.

2. **Activer le plugin** : Allez dans l'administration WordPress > Extensions et activez "WP Residence Property Notifier".

3. **Configuration** : Allez dans Réglages > Property Notifier pour configurer les emails destinataires.

## Configuration

### Paramètres Email

1. Connectez-vous à votre administration WordPress
2. Allez dans **Réglages > Property Notifier**
3. Configurez l'email destinataire (par défaut, c'est l'email administrateur)
4. Cliquez sur "Enregistrer les modifications"

### Test de fonctionnement

Sur la page de configuration, vous pouvez cliquer sur **"Tester la notification"** pour envoyer un email de test et vérifier que tout fonctionne correctement.

## Comment ça marche

Le plugin utilise les hooks WordPress pour détecter :

1. **Détection** : Quand une nouvelle propriété est publiée (pas mise à jour)
2. **Vérification** : Que c'est bien un post de type `estate_property` (WP Residence)
3. **Classification** : Le type de propriété basé sur la taxonomie `property_category`
4. **Notification** : Envoi d'un email avec :
   - Titre de la propriété
   - Type (Appartement ou Appartement, villa)
   - Prix (si disponible)
   - Localisation (si disponible)
   - Date de publication
   - Liens vers la propriété et l'édition

## Types de propriétés détectés

- **Appartement** : Propriétés contenant "appartement" dans leur catégorie
- **Appartement, villa** : Propriétés contenant "villa" dans leur catégorie
- **Autres** : Affichage du nom de catégorie tel quel

## Compatibilité

- WordPress 5.0+
- WP Residence (toutes versions récentes)
- PHP 7.4+

## Personnalisation

### Modifier le template d'email

Pour personnaliser le contenu de l'email, modifiez la méthode `get_email_template()` dans le fichier principal du plugin.

### Ajouter d'autres types de propriétés

Modifiez la méthode `get_property_type()` pour ajouter de nouveaux types de détection.

### Changer les critères de détection

Modifiez la méthode `detect_property_publication()` pour ajuster quand les notifications sont envoyées.

## Debug

Le plugin écrit des logs dans le fichier de debug WordPress. Pour activer les logs :

1. Ajoutez ces lignes dans votre `wp-config.php` :
   ```php
   define('WP_DEBUG', true);
   define('WP_DEBUG_LOG', true);
   ```

2. Les logs seront dans `/wp-content/debug.log`

## Support

Si vous rencontrez des problèmes :

1. Vérifiez que WP Residence est bien installé et actif
2. Testez l'envoi d'email avec le bouton de test
3. Consultez les logs de debug
4. Vérifiez la configuration SMTP de votre site

## Changelog

### v1.0.0
- Version initiale
- Détection des nouvelles propriétés
- Envoi d'emails de notification
- Interface d'administration
- Fonction de test