#!/bin/bash

# Script d'installation pour WP Residence Property Notifier
# Ce script copie le plugin dans le répertoire WordPress et l'active

echo "🏠 Installation de WP Residence Property Notifier"
echo "================================================="

# Vérifier si wp-cli est installé
if ! command -v wp &> /dev/null; then
    echo "❌ WP-CLI n'est pas installé. Veuillez l'installer d'abord."
    echo "Visitez: https://wp-cli.org/"
    exit 1
fi

# Demander le chemin WordPress
read -p "Entrez le chemin vers votre installation WordPress [/var/www/html]: " wp_path
wp_path=${wp_path:-/var/www/html}

# Vérifier que le répertoire WordPress existe
if [ ! -d "$wp_path" ]; then
    echo "❌ Le répertoire WordPress '$wp_path' n'existe pas."
    exit 1
fi

# Vérifier que c'est bien une installation WordPress
if [ ! -f "$wp_path/wp-config.php" ]; then
    echo "❌ '$wp_path' ne semble pas être une installation WordPress valide (wp-config.php introuvable)."
    exit 1
fi

plugins_dir="$wp_path/wp-content/plugins"
plugin_name="wp-residence-property-notifier"
plugin_path="$plugins_dir/$plugin_name"

echo "📁 Répertoire WordPress détecté: $wp_path"
echo "📁 Répertoire des plugins: $plugins_dir"

# Créer le répertoire du plugin s'il n'existe pas
if [ ! -d "$plugin_path" ]; then
    echo "📁 Création du répertoire du plugin..."
    mkdir -p "$plugin_path"
fi

# Copier les fichiers du plugin
echo "📋 Copie des fichiers du plugin..."
cp -r * "$plugin_path/" 2>/dev/null || {
    echo "⚠️  Certains fichiers n'ont pas pu être copiés (normal pour ce script)"
}

# Exclure le script d'installation du répertoire de destination
rm -f "$plugin_path/install.sh" 2>/dev/null

# Changer vers le répertoire WordPress
cd "$wp_path"

# Vérifier si WP Residence est installé
echo "🔍 Vérification de WP Residence..."
if wp plugin is-installed wp-residence --quiet; then
    echo "✅ WP Residence est installé"
    if wp plugin is-active wp-residence --quiet; then
        echo "✅ WP Residence est actif"
    else
        echo "⚠️  WP Residence est installé mais pas actif"
        read -p "Voulez-vous l'activer ? (y/n): " activate_residence
        if [ "$activate_residence" = "y" ]; then
            wp plugin activate wp-residence
        fi
    fi
else
    echo "❌ WP Residence n'est pas installé"
    echo "   Ce plugin nécessite WP Residence pour fonctionner"
    read -p "Voulez-vous continuer quand même ? (y/n): " continue_anyway
    if [ "$continue_anyway" != "y" ]; then
        exit 1
    fi
fi

# Activer le plugin
echo "🔌 Activation du plugin..."
if wp plugin activate $plugin_name; then
    echo "✅ Plugin activé avec succès !"
else
    echo "❌ Erreur lors de l'activation du plugin"
    exit 1
fi

# Afficher les informations de configuration
echo ""
echo "🎉 Installation terminée !"
echo "=========================="
echo ""
echo "📧 Configuration des emails :"
echo "   - Allez dans Réglages > Property Notifier"
echo "   - Configurez l'email destinataire"
echo "   - Testez l'envoi avec le bouton de test"
echo ""
echo "🏠 Le plugin détectera automatiquement :"
echo "   - Les nouvelles propriétés de type 'estate_property'"
echo "   - Les types : Appartement et Appartement, villa"
echo "   - Enverra un email avec le titre et les détails"
echo ""
echo "🔧 Debug :"
echo "   - Les logs sont disponibles dans /wp-content/debug.log"
echo "   - Activez WP_DEBUG dans wp-config.php si nécessaire"
echo ""
echo "✨ Le plugin est maintenant prêt à fonctionner !"