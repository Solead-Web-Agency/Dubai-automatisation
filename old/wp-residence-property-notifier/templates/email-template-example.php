<?php
/**
 * Template d'email personnalisé pour WP Residence Property Notifier
 * 
 * Ce fichier sert d'exemple pour créer vos propres templates d'email.
 * 
 * Variables disponibles :
 * - $post : L'objet post WordPress de la propriété
 * - $property_type : Le type de propriété détecté
 * - $property_url : URL publique de la propriété
 * - $edit_url : URL d'édition de la propriété
 * - $property_data : Array avec toutes les métadonnées de la propriété
 */

// Empêcher l'accès direct
if (!defined('ABSPATH')) {
    exit;
}

// Récupérer les données de la propriété
$price = isset($property_data['property_price']) ? $property_data['property_price'] : '';
$location = isset($property_data['property_address']) ? $property_data['property_address'] : '';
$bedrooms = isset($property_data['property_bedrooms']) ? $property_data['property_bedrooms'] : '';
$bathrooms = isset($property_data['property_bathrooms']) ? $property_data['property_bathrooms'] : '';
$size = isset($property_data['property_size']) ? $property_data['property_size'] : '';

// Récupérer l'image à la une
$thumbnail_id = get_post_thumbnail_id($post->ID);
$thumbnail_url = '';
if ($thumbnail_id) {
    $thumbnail_url = wp_get_attachment_image_url($thumbnail_id, 'medium');
}

// Récupérer les informations de l'agent (si disponible)
$agent_id = get_post_meta($post->ID, 'property_agent', true);
$agent_name = '';
$agent_email = '';
$agent_phone = '';
if ($agent_id) {
    $agent_name = get_post_meta($agent_id, 'agent_name', true);
    $agent_email = get_post_meta($agent_id, 'agent_email', true);
    $agent_phone = get_post_meta($agent_id, 'agent_phone', true);
}
?>

<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Nouvelle propriété - <?php echo esc_html($post->post_title); ?></title>
    <style>
        body {
            font-family: 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            background-color: #f4f4f4;
        }
        .container {
            background-color: #ffffff;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            margin: 20px;
        }
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px 20px;
            text-align: center;
            border-radius: 8px 8px 0 0;
            margin: -20px -20px 20px -20px;
        }
        .header h1 {
            margin: 0;
            font-size: 24px;
            font-weight: 300;
        }
        .property-image {
            width: 100%;
            height: 250px;
            object-fit: cover;
            border-radius: 8px;
            margin-bottom: 20px;
        }
        .property-title {
            font-size: 28px;
            font-weight: bold;
            color: #2c3e50;
            margin-bottom: 10px;
        }
        .property-type {
            background-color: #3498db;
            color: white;
            padding: 5px 15px;
            border-radius: 20px;
            font-size: 12px;
            text-transform: uppercase;
            font-weight: bold;
            display: inline-block;
            margin-bottom: 20px;
        }
        .property-details {
            background-color: #f8f9fa;
            padding: 20px;
            border-radius: 8px;
            margin: 20px 0;
        }
        .detail-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 10px 0;
            border-bottom: 1px solid #dee2e6;
        }
        .detail-row:last-child {
            border-bottom: none;
        }
        .detail-label {
            font-weight: bold;
            color: #495057;
        }
        .detail-value {
            color: #6c757d;
        }
        .price {
            font-size: 24px;
            font-weight: bold;
            color: #e74c3c;
            text-align: center;
            background-color: #fff5f5;
            padding: 15px;
            border-radius: 8px;
            margin: 20px 0;
        }
        .buttons {
            text-align: center;
            margin: 30px 0;
        }
        .btn {
            display: inline-block;
            padding: 12px 30px;
            margin: 0 10px;
            text-decoration: none;
            border-radius: 25px;
            font-weight: bold;
            transition: all 0.3s ease;
        }
        .btn-primary {
            background-color: #3498db;
            color: white;
        }
        .btn-secondary {
            background-color: #95a5a6;
            color: white;
        }
        .btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 5px 15px rgba(0,0,0,0.2);
        }
        .agent-info {
            background-color: #e8f4f8;
            padding: 20px;
            border-radius: 8px;
            margin: 20px 0;
        }
        .agent-title {
            font-weight: bold;
            color: #2c3e50;
            margin-bottom: 10px;
        }
        .footer {
            text-align: center;
            color: #7f8c8d;
            font-size: 12px;
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #ecf0f1;
        }
        @media (max-width: 600px) {
            .container {
                margin: 10px;
                padding: 15px;
            }
            .property-title {
                font-size: 22px;
            }
            .price {
                font-size: 20px;
            }
            .btn {
                display: block;
                margin: 10px 0;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🏠 Nouvelle Propriété Publiée</h1>
        </div>

        <?php if ($thumbnail_url): ?>
            <img src="<?php echo esc_url($thumbnail_url); ?>" alt="<?php echo esc_attr($post->post_title); ?>" class="property-image">
        <?php endif; ?>

        <div class="property-title"><?php echo esc_html($post->post_title); ?></div>
        
        <span class="property-type"><?php echo esc_html($property_type); ?></span>

        <?php if ($price): ?>
            <div class="price">💰 <?php echo esc_html($price); ?></div>
        <?php endif; ?>

        <div class="property-details">
            <?php if ($location): ?>
                <div class="detail-row">
                    <span class="detail-label">📍 Localisation</span>
                    <span class="detail-value"><?php echo esc_html($location); ?></span>
                </div>
            <?php endif; ?>

            <?php if ($bedrooms): ?>
                <div class="detail-row">
                    <span class="detail-label">🛏️ Chambres</span>
                    <span class="detail-value"><?php echo esc_html($bedrooms); ?></span>
                </div>
            <?php endif; ?>

            <?php if ($bathrooms): ?>
                <div class="detail-row">
                    <span class="detail-label">🚿 Salles de bain</span>
                    <span class="detail-value"><?php echo esc_html($bathrooms); ?></span>
                </div>
            <?php endif; ?>

            <?php if ($size): ?>
                <div class="detail-row">
                    <span class="detail-label">📐 Surface</span>
                    <span class="detail-value"><?php echo esc_html($size); ?> m²</span>
                </div>
            <?php endif; ?>

            <div class="detail-row">
                <span class="detail-label">📅 Date de publication</span>
                <span class="detail-value"><?php echo get_the_date('d/m/Y à H:i', $post->ID); ?></span>
            </div>
        </div>

        <?php if ($agent_name): ?>
            <div class="agent-info">
                <div class="agent-title">👤 Informations de l'agent</div>
                <strong><?php echo esc_html($agent_name); ?></strong><br>
                <?php if ($agent_email): ?>
                    📧 <a href="mailto:<?php echo esc_attr($agent_email); ?>"><?php echo esc_html($agent_email); ?></a><br>
                <?php endif; ?>
                <?php if ($agent_phone): ?>
                    📞 <?php echo esc_html($agent_phone); ?>
                <?php endif; ?>
            </div>
        <?php endif; ?>

        <div class="buttons">
            <a href="<?php echo esc_url($property_url); ?>" class="btn btn-primary" target="_blank">
                👁️ Voir la propriété
            </a>
            <a href="<?php echo esc_url($edit_url); ?>" class="btn btn-secondary" target="_blank">
                ✏️ Modifier
            </a>
        </div>

        <div class="footer">
            <p>📧 Cette notification a été envoyée automatiquement par <strong><?php echo get_bloginfo('name'); ?></strong></p>
            <p>🔧 Plugin: WP Residence Property Notifier</p>
        </div>
    </div>
</body>
</html>