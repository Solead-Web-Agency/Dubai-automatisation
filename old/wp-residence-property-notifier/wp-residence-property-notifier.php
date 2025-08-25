<?php
/**
 * Plugin Name: WP Residence Property Notifier
 * Plugin URI: https://github.com/your-username/wp-residence-property-notifier
 * Description: Envoie automatiquement des notifications par email lors de la publication de nouvelles propriétés avec WP Residence
 * Version: 1.0.0
 * Author: Votre Nom
 * License: GPL v2 or later
 * Text Domain: wp-residence-property-notifier
 */

// Empêcher l'accès direct
if (!defined('ABSPATH')) {
    exit;
}

// Définir les constantes du plugin
define('WRPN_PLUGIN_URL', plugin_dir_url(__FILE__));
define('WRPN_PLUGIN_PATH', plugin_dir_path(__FILE__));
define('WRPN_VERSION', '1.0.0');

class WPResidencePropertyNotifier {
    
    private $option_name = 'wrpn_settings';
    
    public function __construct() {
        add_action('init', array($this, 'init'));
        add_action('save_post', array($this, 'detect_property_publication'), 10, 3);
        add_action('admin_menu', array($this, 'add_admin_menu'));
        add_action('admin_init', array($this, 'admin_init'));
        
        // Hook d'activation du plugin
        register_activation_hook(__FILE__, array($this, 'activate'));
    }
    
    public function init() {
        load_plugin_textdomain('wp-residence-property-notifier', false, dirname(plugin_basename(__FILE__)) . '/languages/');
    }
    
    /**
     * Détecte la publication d'une nouvelle propriété
     */
    public function detect_property_publication($post_id, $post, $update) {
        // Vérifier si c'est une nouvelle publication (pas une mise à jour)
        if ($update) {
            return;
        }
        
        // Vérifier si c'est un type de post "property" (WP Residence)
        if ($post->post_type !== 'estate_property') {
            return;
        }
        
        // Vérifier si le post est publié
        if ($post->post_status !== 'publish') {
            return;
        }
        
        // Récupérer le type de propriété
        $property_type = $this->get_property_type($post_id);
        
        // Envoyer la notification email
        $this->send_property_notification($post, $property_type);
        
        // Log pour debug
        error_log("Nouvelle propriété détectée: " . $post->post_title . " (Type: " . $property_type . ")");
    }
    
    /**
     * Récupère le type de propriété
     */
    private function get_property_type($post_id) {
        // WP Residence stocke généralement le type de propriété dans une taxonomie
        $property_types = wp_get_post_terms($post_id, 'property_category', array('fields' => 'names'));
        
        if (!empty($property_types)) {
            $type = $property_types[0];
            
            // Détecter le type spécifique selon vos critères
            if (strpos(strtolower($type), 'villa') !== false) {
                return 'Appartement, villa';
            } else if (strpos(strtolower($type), 'appartement') !== false) {
                return 'Appartement';
            }
            
            return $type;
        }
        
        return 'Type non défini';
    }
    
    /**
     * Envoie la notification email
     */
    private function send_property_notification($post, $property_type) {
        $settings = get_option($this->option_name);
        $recipients = isset($settings['email_recipients']) ? $settings['email_recipients'] : get_option('admin_email');
        
        // Sujet de l'email
        $subject = sprintf(
            '[%s] Nouvelle propriété publiée: %s',
            get_bloginfo('name'),
            $post->post_title
        );
        
        // Corps de l'email
        $message = $this->get_email_template($post, $property_type);
        
        // Headers pour l'email HTML
        $headers = array(
            'Content-Type: text/html; charset=UTF-8',
            'From: ' . get_bloginfo('name') . ' <' . get_option('admin_email') . '>'
        );
        
        // Envoyer l'email
        $sent = wp_mail($recipients, $subject, $message, $headers);
        
        if ($sent) {
            error_log("Email envoyé avec succès pour la propriété: " . $post->post_title);
        } else {
            error_log("Erreur lors de l'envoi de l'email pour la propriété: " . $post->post_title);
        }
    }
    
    /**
     * Template de l'email
     */
    private function get_email_template($post, $property_type) {
        $property_url = get_permalink($post->ID);
        $edit_url = get_edit_post_link($post->ID);
        
        // Récupérer quelques métadonnées de base de la propriété
        $price = get_post_meta($post->ID, 'property_price', true);
        $location = get_post_meta($post->ID, 'property_address', true);
        
        $template = '<html><body>';
        $template .= '<h2>Nouvelle propriété publiée</h2>';
        $template .= '<p><strong>Titre:</strong> ' . esc_html($post->post_title) . '</p>';
        $template .= '<p><strong>Type:</strong> ' . esc_html($property_type) . '</p>';
        
        if ($price) {
            $template .= '<p><strong>Prix:</strong> ' . esc_html($price) . '</p>';
        }
        
        if ($location) {
            $template .= '<p><strong>Localisation:</strong> ' . esc_html($location) . '</p>';
        }
        
        $template .= '<p><strong>Date de publication:</strong> ' . get_the_date('d/m/Y H:i', $post->ID) . '</p>';
        $template .= '<p><a href="' . esc_url($property_url) . '" target="_blank">Voir la propriété sur le site</a></p>';
        $template .= '<p><a href="' . esc_url($edit_url) . '" target="_blank">Modifier la propriété</a></p>';
        $template .= '</body></html>';
        
        return $template;
    }
    
    /**
     * Ajouter le menu d'administration
     */
    public function add_admin_menu() {
        add_options_page(
            'WP Residence Property Notifier',
            'Property Notifier',
            'manage_options',
            'wp-residence-property-notifier',
            array($this, 'admin_page')
        );
    }
    
    /**
     * Initialiser les paramètres d'administration
     */
    public function admin_init() {
        register_setting('wrpn_settings_group', $this->option_name);
        
        add_settings_section(
            'wrpn_email_section',
            'Paramètres Email',
            array($this, 'email_section_callback'),
            'wp-residence-property-notifier'
        );
        
        add_settings_field(
            'email_recipients',
            'Destinataires des emails',
            array($this, 'email_recipients_callback'),
            'wp-residence-property-notifier',
            'wrpn_email_section'
        );
    }
    
    public function email_section_callback() {
        echo '<p>Configurez les paramètres de notification par email.</p>';
    }
    
    public function email_recipients_callback() {
        $settings = get_option($this->option_name);
        $value = isset($settings['email_recipients']) ? $settings['email_recipients'] : get_option('admin_email');
        
        echo '<input type="email" name="' . $this->option_name . '[email_recipients]" value="' . esc_attr($value) . '" class="regular-text" />';
        echo '<p class="description">Email où envoyer les notifications. Séparez plusieurs emails par des virgules.</p>';
    }
    
    /**
     * Page d'administration
     */
    public function admin_page() {
        ?>
        <div class="wrap">
            <h1>WP Residence Property Notifier</h1>
            <form method="post" action="options.php">
                <?php
                settings_fields('wrpn_settings_group');
                do_settings_sections('wp-residence-property-notifier');
                submit_button();
                ?>
            </form>
            
            <h3>Test de notification</h3>
            <p>Cliquez sur le bouton ci-dessous pour tester l'envoi d'email de notification :</p>
            <button type="button" class="button" onclick="testNotification()">Tester la notification</button>
            
            <script>
            function testNotification() {
                if (confirm('Voulez-vous envoyer un email de test ?')) {
                    fetch('<?php echo admin_url('admin-ajax.php'); ?>', {
                        method: 'POST',
                        body: new URLSearchParams({
                            action: 'wrpn_test_notification',
                            nonce: '<?php echo wp_create_nonce('wrpn_test_nonce'); ?>'
                        })
                    })
                    .then(response => response.json())
                    .then(data => {
                        if (data.success) {
                            alert('Email de test envoyé avec succès !');
                        } else {
                            alert('Erreur lors de l\'envoi : ' + data.data);
                        }
                    });
                }
            }
            </script>
        </div>
        <?php
    }
    
    /**
     * Activation du plugin
     */
    public function activate() {
        // Paramètres par défaut
        $default_settings = array(
            'email_recipients' => get_option('admin_email')
        );
        
        add_option($this->option_name, $default_settings);
    }
}

// Initialiser le plugin
new WPResidencePropertyNotifier();

// AJAX pour le test de notification
add_action('wp_ajax_wrpn_test_notification', 'wrpn_handle_test_notification');

function wrpn_handle_test_notification() {
    if (!wp_verify_nonce($_POST['nonce'], 'wrpn_test_nonce')) {
        wp_die('Nonce invalide');
    }
    
    if (!current_user_can('manage_options')) {
        wp_die('Permissions insuffisantes');
    }
    
    // Créer un post de test
    $test_post = (object) array(
        'ID' => 0,
        'post_title' => 'Propriété de test - ' . date('d/m/Y H:i'),
        'post_content' => 'Ceci est un test de notification',
        'post_status' => 'publish',
        'post_type' => 'estate_property'
    );
    
    $notifier = new WPResidencePropertyNotifier();
    $reflection = new ReflectionClass($notifier);
    $method = $reflection->getMethod('send_property_notification');
    $method->setAccessible(true);
    
    try {
        $method->invoke($notifier, $test_post, 'Test - Appartement');
        wp_send_json_success('Email de test envoyé');
    } catch (Exception $e) {
        wp_send_json_error('Erreur: ' . $e->getMessage());
    }
}
?>