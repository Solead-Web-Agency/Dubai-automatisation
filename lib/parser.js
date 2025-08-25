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
    type: ''
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
    
    // 6. Extraire la localisation
    propertyData.location = extractLocation(propertyData.title, html, text);
    
    // 7. Extraire le type de bien
    propertyData.type = extractPropertyType(propertyData.title, html, text);

    console.log('✅ Parsing terminé:', propertyData);
    
  } catch (error) {
    console.error('❌ Erreur lors du parsing:', error);
  }

  return propertyData;
}

function extractTitle(subject, html, text) {
  // Priorité 1: Subject de l'email
  if (subject) {
    // Nettoyer le subject (enlever "Nouveau post:", "[Dubai Immo]", etc.)
    let cleanTitle = subject
      .replace(/^\[.*?\]/, '')  // Enlever [Site Name]
      .replace(/^(nouveau post|new post|publication):/i, '')  // Enlever préfixes
      .replace(/^\s*[-:]\s*/, '')  // Enlever tirets/deux-points en début
      .trim();
    
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

  return 'Nouveau bien immobilier à Dubai';
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
    // Pattern simple : capturer tout après "Permalink:" jusqu'aux "..." ou fin
    let permalinkMatch = text.match(/Permalink:\s*(https?:\/\/[^\s\n]+)/i);
    if (permalinkMatch) {
      let url = permalinkMatch[1].trim();
      // Nettoyer les "..." s'il y en a
      url = url.replace(/\.\.\.$/, '');
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
  if (html) {
    // Chercher un paragraphe de description
    const pMatch = html.match(/<p[^>]*>(.*?)<\/p>/i);
    if (pMatch) {
      let excerpt = pMatch[1].replace(/<[^>]*>/g, '').trim();
      if (excerpt.length > 20 && excerpt.length < 500) {
        return excerpt;
      }
    }
  }

  if (text) {
    const lines = text.split('\n').filter(line => line.trim().length > 20);
    if (lines.length > 1) {
      return lines[1].trim().substring(0, 200) + '...';
    }
  }

  return 'Découvrez ce magnifique bien immobilier à Dubai';
}

function extractPrice(html, text) {
  const priceRegex = /([\d,]+)\s*(AED|EUR|USD|\$|€)/gi;
  
  // Chercher dans le HTML d'abord
  if (html) {
    const priceMatch = html.match(priceRegex);
    if (priceMatch) {
      return priceMatch[0];
    }
  }

  // Puis dans le texte
  if (text) {
    const priceMatch = text.match(priceRegex);
    if (priceMatch) {
      return priceMatch[0];
    }
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
