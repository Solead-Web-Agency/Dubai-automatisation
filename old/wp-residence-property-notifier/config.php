<?php
/**
 * Configuration avancée pour WP Residence Property Notifier
 * 
 * Ce fichier permet de personnaliser le comportement du plugin sans modifier le code principal.
 * Copiez ce fichier et renommez-le en 'config-custom.php' pour vos personnalisations.
 */

// Empêcher l'accès direct
if (!defined('ABSPATH')) {
    exit;
}

/**
 * Configuration des types de propriétés
 * Définit comment détecter et classer les différents types de propriétés
 */
$wrpn_property_types_config = array(
    'appartement' => array(
        'keywords' => array('appartement', 'apartment', 'studio', 'loft'),
        'label' => 'Appartement',
        'priority' => 1
    ),
    'appartement_villa' => array(
        'keywords' => array('villa', 'maison', 'house', 'villa appartement'),
        'label' => 'Appartement, villa',
        'priority' => 2
    ),
    'bureau' => array(
        'keywords' => array('bureau', 'office', 'commercial'),
        'label' => 'Bureau',
        'priority' => 3
    ),
    'terrain' => array(
        'keywords' => array('terrain', 'land', 'plot'),
        'label' => 'Terrain',
        'priority' => 4
    )
);

/**
 * Configuration des emails
 */
$wrpn_email_config = array(
    // Template HTML personnalisé
    'use_custom_template' => false,
    'custom_template_path' => '', // Chemin vers un fichier template personnalisé
    
    // Paramètres SMTP (optionnel, utilise wp_mail par défaut)
    'use_smtp' => false,
    'smtp_host' => '',
    'smtp_port' => 587,
    'smtp_username' => '',
    'smtp_password' => '',
    'smtp_encryption' => 'tls', // 'tls' ou 'ssl'
    
    // Options d'envoi
    'send_immediately' => true, // false pour utiliser wp_cron
    'max_retries' => 3,
    'retry_delay' => 300, // 5 minutes
    
    // Personnalisation du contenu
    'include_property_images' => true,
    'include_property_details' => true,
    'include_agent_info' => true,
    'email_format' => 'html', // 'html' ou 'text'
);

/**
 * Configuration des notifications
 */
$wrpn_notification_config = array(
    // Quand envoyer les notifications
    'notify_on_publish' => true,
    'notify_on_update' => false,
    'notify_on_draft_to_publish' => true,
    
    // Filtres
    'min_price' => 0, // Prix minimum pour envoyer une notification
    'max_price' => 0, // Prix maximum (0 = pas de limite)
    'exclude_property_ids' => array(), // IDs de propriétés à exclure
    'include_only_featured' => false, // Seulement les propriétés à la une
    
    // Limitation de fréquence
    'max_notifications_per_hour' => 10,
    'max_notifications_per_day' => 50,
    
    // Heures d'envoi (24h format)
    'notification_hours' => array(
        'start' => 8,  // 8h00
        'end' => 20    // 20h00
    ),
    
    // Jours d'envoi (0 = dimanche, 1 = lundi, etc.)
    'notification_days' => array(1, 2, 3, 4, 5), // Lundi à vendredi
);

/**
 * Configuration des métadonnées à inclure
 */
$wrpn_metadata_config = array(
    'property_price' => array(
        'include' => true,
        'label' => 'Prix',
        'format' => 'currency'
    ),
    'property_address' => array(
        'include' => true,
        'label' => 'Adresse',
        'format' => 'text'
    ),
    'property_bedrooms' => array(
        'include' => true,
        'label' => 'Chambres',
        'format' => 'number'
    ),
    'property_bathrooms' => array(
        'include' => true,
        'label' => 'Salles de bain',
        'format' => 'number'
    ),
    'property_size' => array(
        'include' => true,
        'label' => 'Surface',
        'format' => 'area'
    ),
    'property_year' => array(
        'include' => false,
        'label' => 'Année de construction',
        'format' => 'year'
    )
);

/**
 * Configuration des webhooks (optionnel)
 * Permet d'envoyer les données vers des services externes
 */
$wrpn_webhook_config = array(
    'enabled' => false,
    'endpoints' => array(
        // Exemple pour Zapier
        /*
        'zapier' => array(
            'url' => 'https://hooks.zapier.com/hooks/catch/xxxxx/xxxxx/',
            'method' => 'POST',
            'headers' => array(
                'Content-Type' => 'application/json'
            )
        ),
        */
        // Exemple pour une API personnalisée
        /*
        'custom_api' => array(
            'url' => 'https://votre-api.com/webhook/properties',
            'method' => 'POST',
            'headers' => array(
                'Authorization' => 'Bearer YOUR_API_TOKEN',
                'Content-Type' => 'application/json'
            )
        )
        */
    )
);

/**
 * Configuration du debug et logging
 */
$wrpn_debug_config = array(
    'enable_logging' => true,
    'log_level' => 'info', // 'error', 'warning', 'info', 'debug'
    'log_file' => WP_CONTENT_DIR . '/uploads/wrpn-debug.log',
    'max_log_size' => 10 * 1024 * 1024, // 10 MB
    'log_retention_days' => 30,
    
    // Notifications de debug
    'send_debug_emails' => false,
    'debug_email_recipient' => get_option('admin_email'),
);

/**
 * Fonctions utilitaires pour la configuration
 */

/**
 * Obtient la configuration fusionnée (défaut + personnalisée)
 */
function wrpn_get_config($section = null) {
    global $wrpn_property_types_config, $wrpn_email_config, $wrpn_notification_config, 
           $wrpn_metadata_config, $wrpn_webhook_config, $wrpn_debug_config;
    
    // Charger la configuration personnalisée si elle existe
    $custom_config_file = WRPN_PLUGIN_PATH . 'config-custom.php';
    if (file_exists($custom_config_file)) {
        include_once $custom_config_file;
    }
    
    $config = array(
        'property_types' => $wrpn_property_types_config,
        'email' => $wrpn_email_config,
        'notification' => $wrpn_notification_config,
        'metadata' => $wrpn_metadata_config,
        'webhook' => $wrpn_webhook_config,
        'debug' => $wrpn_debug_config
    );
    
    if ($section && isset($config[$section])) {
        return $config[$section];
    }
    
    return $config;
}

/**
 * Valide si une propriété doit déclencher une notification
 */
function wrpn_should_notify($post_id, $property_type, $price = 0) {
    $notification_config = wrpn_get_config('notification');
    
    // Vérifier les filtres de prix
    if ($notification_config['min_price'] > 0 && $price < $notification_config['min_price']) {
        return false;
    }
    
    if ($notification_config['max_price'] > 0 && $price > $notification_config['max_price']) {
        return false;
    }
    
    // Vérifier les exclusions
    if (in_array($post_id, $notification_config['exclude_property_ids'])) {
        return false;
    }
    
    // Vérifier si c'est une propriété à la une (si requis)
    if ($notification_config['include_only_featured']) {
        $is_featured = get_post_meta($post_id, 'featured_property', true);
        if (!$is_featured) {
            return false;
        }
    }
    
    // Vérifier les heures d'envoi
    $current_hour = (int) date('H');
    if ($current_hour < $notification_config['notification_hours']['start'] || 
        $current_hour > $notification_config['notification_hours']['end']) {
        return false;
    }
    
    // Vérifier les jours d'envoi
    $current_day = (int) date('w');
    if (!in_array($current_day, $notification_config['notification_days'])) {
        return false;
    }
    
    return true;
}
?>