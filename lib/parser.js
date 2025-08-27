/**
 * Module pour parser le contenu des emails de notification WordPress
 * et extraire les données des biens immobiliers
 */

function parseEmailContent(emailData) {
  console.log('🔍 Parsing email content...');
  
  const { subject, html, text } = emailData;
  
  // Données par défaut
  let propertyData = {
    title: '',
    excerpt: '',
    featuredImage: '',
    permalink: '',
    price: '',
    location: '',
    type: '',
    surface: ''
  };

  try {
    // 1. Extraire le titre depuis le subject ou le contenu
    propertyData.title = extractTitle(subject, html, text);
    
    // 2. Extraire l'image mise en avant
    propertyData.featuredImage = extractFeaturedImage(html, text);
    
    // 3. Extraire le lien vers la propriété
    propertyData.permalink = extractPermalink(html, text);
    
    // 4. Extraire l'extrait/description
    propertyData.excerpt = extractExcerpt(html, text);
    
    // 5. Extraire le prix si disponible
    propertyData.price = extractPrice(html, text);
    
    // 6. Extraire la surface
    propertyData.surface = extractSurface(html, text);
    
    // 7. Extraire la localisation
    propertyData.location = extractLocation(propertyData.title, html, text);
    
    // 8. Extraire le type de bien
    propertyData.type = extractPropertyType(propertyData.title, html, text);

    console.log('✅ Parsing terminé:', propertyData);
    
  } catch (error) {
    console.error('❌ Erreur lors du parsing:', error);
  }

  return propertyData;
}

// Helper: extraire une valeur "Clé: Valeur" depuis le texte
function getKeyValue(text, key) {
  if (!text) return '';
  // Gérer espaces classiques et insécables (\u00A0), tolérer espaces multiples
  const pattern = new RegExp(
    '^' + key.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&') + '[\u00A0\s]*:\\s*(.+)$',
    'mi'
  );
  const match = text.match(pattern);
  if (match && match[1]) {
    return match[1].trim();
  }
  return '';
}

function extractTitle(subject, html, text) {
  // Priorité 0: Ligne "Post Title:" dans le corps texte (gère NBSP)
  if (text) {
    const kvTitle = getKeyValue(text, 'Post Title');
    if (kvTitle) return kvTitle;
  }

  // Priorité 1: Subject de l'email
  if (subject) {
    // Nettoyer le subject (enlever "Nouveau post:", "[Dubai Immo]", etc.)
    let cleanTitle = subject
      .replace(/^\[.*?\]/, '')  // Enlever [Site Name]
      .replace(/^(nouveau post|new post|publication):/i, '')  // Enlever préfixes
      .replace(/^\s*[-:]\s*/, '')  // Enlever tirets/deux-points en début
      .trim();
    
    // Si c'est un email de notification Dubai Immo, utiliser un titre par défaut
    if (cleanTitle.includes('Alerte nouvelle page propriété') || cleanTitle.includes('nouvelle page propriété')) {
      // On utilisera la surface extraite plus tard, pour l'instant garder un titre générique
      return 'Appartement - Dubai';
    }
    
    if (cleanTitle.length > 10) {
      return cleanTitle;
    }
  }

  // Priorité 2: Titre dans le HTML
  if (html) {
    const titleMatch = html.match(/<h[1-3][^>]*>(.*?)<\/h[1-3]>/i);
    if (titleMatch) {
      return titleMatch[1].replace(/<[^>]*>/g, '').trim();
    }
  }

  // Priorité 3: Première ligne du texte
  if (text) {
    const lines = text.split('\n').filter(line => line.trim().length > 10);
    if (lines.length > 0) {
      return lines[0].trim();
    }
  }

  return 'Appartement 70M2 - Dubai';
}

function extractFeaturedImage(html, text) {
  // Priorité 1: Chercher "Featured Image:" dans le texte
  if (text) {
    const featuredImageMatch = text.match(/Featured Image:\s*(https?:\/\/[^\s\n]+)/i);
    if (featuredImageMatch) {
      return featuredImageMatch[1].trim();
    }
  }

  // Priorité 2: Chercher "Featured Image:" dans le HTML
  if (html) {
    const featuredImageMatch = html.match(/Featured Image:\s*(https?:\/\/[^\s\n<]+)/i);
    if (featuredImageMatch) {
      return featuredImageMatch[1].trim();
    }
  }

  // Priorité 3: Chercher les images dans le HTML
  if (html) {
    const imgMatches = html.match(/<img[^>]+src=["']([^"']+)["'][^>]*>/gi);
    
    if (imgMatches) {
      for (const imgTag of imgMatches) {
        const srcMatch = imgTag.match(/src=["']([^"']+)["']/i);
        if (srcMatch) {
          const imgUrl = srcMatch[1];
          
          // Filtrer les images système (pas les featured images)
          if (!imgUrl.includes('spacer') && 
              !imgUrl.includes('icon') && 
              !imgUrl.includes('logo') &&
              !imgUrl.includes('button') &&
              (imgUrl.includes('.jpg') || imgUrl.includes('.png') || imgUrl.includes('.jpeg'))) {
            return imgUrl;
          }
        }
      }
    }
  }

  // Fallback: image placeholder
  return 'https://images.unsplash.com/photo-1613977257363-707ba9348227?w=1080&h=720&fit=crop';
}

function extractPermalink(html, text) {
  // Priorité 1: Chercher "Permalink:" dans le texte
  if (text) {
    console.log('🔍 Texte à parser pour permalink:', text.substring(0, 200));
    // Pattern plus précis : capturer l'URL complète sans les "..."
    let permalinkMatch = text.match(/Permalink:\s*(https?:\/\/[^\s\n]+?)(?:\.\.\.)?$/im);
    if (permalinkMatch) {
      let url = permalinkMatch[1].trim();
      console.log('🔍 URL nettoyée:', url);
      return url;
    }
  }

  // Priorité 2: Chercher "Permalink:" dans le HTML
  if (html) {
    const permalinkMatch = html.match(/Permalink:\s*(https?:\/\/[^\s\n<]+)/i);
    if (permalinkMatch) {
      return permalinkMatch[1].trim();
    }
  }

  // Priorité 3: Chercher les liens vers le post dans le HTML
  if (html) {
    const linkMatches = html.match(/<a[^>]+href=["']([^"']+)["'][^>]*>/gi);
    
    if (linkMatches) {
      for (const linkTag of linkMatches) {
        const hrefMatch = linkTag.match(/href=["']([^"']+)["']/i);
        if (hrefMatch) {
          const url = hrefMatch[1];
          
          // Filtrer pour garder les liens vers les posts
          if (url.includes('/property/') || 
              url.includes('/bien/') || 
              url.includes('dubaiimmo') ||
              (url.startsWith('http') && !url.includes('unsubscribe') && !url.includes('admin'))) {
            return url;
          }
        }
      }
    }
  }

  return '';
}

function extractExcerpt(html, text) {
  // Priorité 0: Ligne "Post Excerpt:" dans le corps texte (gère NBSP)
  if (text) {
    let ex = getKeyValue(text, 'Post Excerpt');
    if (ex) {
      ex = ex.replace(/\.{3,}$/, '');
      if (ex.length > 0) return ex;
    }
  }

  if (html) {
    // Chercher un paragraphe de description
    const pMatch = html.match(/<p[^>]*>(.*?)<\/p>/i);
    if (pMatch) {
      let excerpt = pMatch[1].replace(/<[^>]*>/g, '').trim();
      // Enlever des ellipses éventuelles ajoutées par la source
      excerpt = excerpt.replace(/\.{3,}$/,'');
      if (excerpt.length > 20 && excerpt.length < 500) {
        return excerpt;
      }
    }
  }

  if (text) {
    // Prendre la première ligne descriptive en ignorant les lignes techniques et URLs
    const lines = text
      .split('\n')
      .map(l => l.trim())
      .filter(l =>
        l.length > 20 &&
        !/^Permalink:/i.test(l) &&
        !/^Post /i.test(l) &&
        !/^Featured Image:/i.test(l) &&
        !/^GUID:/i.test(l) &&
        !/^Link /i.test(l) &&
        !/^https?:\/\//i.test(l)
      );

    if (lines.length > 0) {
      let excerpt = lines[0].substring(0, 240);
      // Ne jamais ajouter "..." et supprimer celles éventuelles en fin
      excerpt = excerpt.replace(/\.{3,}$/,'');
      return excerpt;
    }
  }

  return 'Découvrez ce magnifique bien immobilier à Dubai';
}

function extractPrice(html, text) {
  // Regex pour capturer le prix et la devise
  const priceRegex = /([\d,]+)\s*(AED|EUR|USD|\$|€)/gi;
  
  let price = '';
  let currency = '';
  let eurPrice = '';
  
  // Priorité 1: Chercher spécifiquement le prix en EUR d'abord
  if (text) {
    const eurMatch = text.match(/([\d,]+)\s*€/i);
    if (eurMatch) {
      eurPrice = eurMatch[0];
      console.log('🔍 Prix EUR trouvé directement:', eurPrice);
    }
  }
  
  if (html) {
    const eurMatch = html.match(/([\d,]+)\s*€/i);
    if (eurMatch && !eurPrice) {
      eurPrice = eurMatch[0];
      console.log('🔍 Prix EUR trouvé dans HTML:', eurPrice);
    }
  }
  
  // Si on a un prix en EUR, le retourner directement
  if (eurPrice) {
    return eurPrice;
  }
  
  // Sinon, chercher d'autres devises
  if (html) {
    const priceMatch = html.match(priceRegex);
    if (priceMatch) {
      price = priceMatch[0];
      // Extraire la devise
      const currencyMatch = priceMatch[0].match(/(AED|EUR|USD|\$|€)/i);
      if (currencyMatch) {
        currency = currencyMatch[1];
      }
    }
  }

  // Puis dans le texte
  if (!price && text) {
    const priceMatch = text.match(priceRegex);
    if (priceMatch) {
      price = priceMatch[0];
      // Extraire la devise
      const currencyMatch = priceMatch[0].match(/(AED|EUR|USD|\$|€)/i);
      if (currencyMatch) {
        currency = currencyMatch[1];
      }
    }
  }

  // Si on a un prix en AED, le convertir en EUR (taux approximatif: 1 AED = 0.25 EUR)
  if (price && currency && currency.toUpperCase() === 'AED') {
    const aedAmount = parseInt(price.replace(/,/g, ''));
    const eurAmount = Math.round(aedAmount * 0.25);
    console.log('🔍 Conversion AED → EUR:', aedAmount, 'AED →', eurAmount, 'EUR');
    return `${eurAmount.toLocaleString('fr-FR')}€`;
  }

  return price;
}

function extractSurface(html, text) {
  // Regex pour capturer toutes les surfaces (ex: "65 m²", "65m²", "65 m2")
  const surfaceRegex = /(\d+)\s*(?:m²|m2|m\^2)/gi;
  const surfaces = [];
  
  // Chercher dans le HTML
  if (html) {
    let match;
    while ((match = surfaceRegex.exec(html)) !== null) {
      surfaces.push(parseInt(match[1]));
    }
  }

  // Chercher dans le texte
  if (text) {
    // Reset regex pour le texte
    surfaceRegex.lastIndex = 0;
    let match;
    while ((match = surfaceRegex.exec(text)) !== null) {
      surfaces.push(parseInt(match[1]));
    }
  }

  // Retourner la plus petite surface (prix de départ) ou une chaîne vide
  if (surfaces.length > 0) {
    const minSurface = Math.min(...surfaces);
    console.log('🔍 Surfaces trouvées:', surfaces, '- Plus petite:', minSurface);
    return minSurface.toString();
  }

  return '';
}

function extractLocation(title, html, text) {
  const dubaiAreas = [
    'Dubai Marina', 'Downtown Dubai', 'Palm Jumeirah', 'JBR', 'DIFC',
    'Business Bay', 'Jumeirah', 'Bur Dubai', 'Deira', 'JLT', 'SZR',
    'Al Barsha', 'Arabian Ranches', 'The Springs', 'The Meadows',
    'Emirates Hills', 'Mirdif', 'Nad Al Sheba'
  ];

  const content = `${title} ${html} ${text}`.toLowerCase();

  for (const area of dubaiAreas) {
    if (content.includes(area.toLowerCase())) {
      return area;
    }
  }

  return 'Dubai';
}

function extractPropertyType(title, html, text) {
  const content = `${title} ${html} ${text}`.toLowerCase();
  
  if (content.includes('villa')) return 'Villa';
  if (content.includes('apartment') || content.includes('appartement')) return 'Appartement';
  if (content.includes('penthouse')) return 'Penthouse';
  if (content.includes('townhouse')) return 'Townhouse';
  if (content.includes('studio')) return 'Studio';
  if (content.includes('duplex')) return 'Duplex';
  
  return 'Propriété';
}

module.exports = {
  parseEmailContent
};
