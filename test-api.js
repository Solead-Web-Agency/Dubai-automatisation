/**
 * Script de test pour l'API Dubai Immo Ads Generator
 */

const testData = {
  title: 'Villa de luxe avec vue sur mer - Dubai Marina',
  excerpt: 'Magnifique villa de 5 chambres avec piscine privée, jardin paysager et vue imprenable sur le golfe Persique.',
  featuredImage: 'https://images.unsplash.com/photo-1613977257363-707ba9348227?w=1080&h=720&fit=crop',
  permalink: 'https://dubaiimmo.com/villa-luxe-dubai-marina',
  price: '3,200,000 AED',
  location: 'Dubai Marina',
  type: 'Villa'
};

async function testAPI() {
  const baseUrl = 'http://localhost:3000';
  
  console.log('🧪 Test de l\'API Dubai Immo Ads Generator\n');

  try {
    // Test 1: Endpoint racine
    console.log('1️⃣ Test endpoint racine...');
    const rootResponse = await fetch(`${baseUrl}/`);
    const rootData = await rootResponse.json();
    console.log('✅ Réponse:', rootData.message);
    console.log('📋 Endpoints disponibles:', rootData.endpoints.length);

    // Test 2: Endpoint de test avec données fictives
    console.log('\n2️⃣ Test endpoint /api/test...');
    const testResponse = await fetch(`${baseUrl}/api/test`);
    const testResult = await testResponse.json();
    
    if (testResult.success) {
      console.log('✅ Test réussi');
      console.log('🏠 Propriété:', testResult.property.title);
      console.log('🎨 Visuels générés:');
      if (testResult.ads.square) {
        console.log(`   - Carré: ${testResult.ads.square.url}`);
      }
      if (testResult.ads.story) {
        console.log(`   - Story: ${testResult.ads.story.url}`);
      }
    }

    // Test 3: Endpoint de génération manuelle
    console.log('\n3️⃣ Test endpoint /api/generate...');
    const generateResponse = await fetch(`${baseUrl}/api/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testData)
    });

    const generateResult = await generateResponse.json();
    
    if (generateResult.success) {
      console.log('✅ Génération manuelle réussie');
      console.log('🏠 Propriété:', generateResult.property.title);
      console.log('🎨 Visuels générés:');
      if (generateResult.ads.square) {
        console.log(`   - Carré: ${generateResult.ads.square.url}`);
      }
      if (generateResult.ads.story) {
        console.log(`   - Story: ${generateResult.ads.story.url}`);
      }
    }

    console.log('\n🎉 Tous les tests sont terminés !');
    console.log('💡 Vous pouvez maintenant :');
    console.log('   - Configurer un webhook email');
    console.log('   - Déployer sur Vercel');
    console.log('   - Intégrer avec Meta Marketing API');

  } catch (error) {
    console.error('❌ Erreur lors des tests:', error.message);
    console.log('💡 Assurez-vous que le serveur est démarré avec: npm run dev');
  }
}

// Exécuter les tests
if (require.main === module) {
  testAPI();
}

module.exports = { testAPI };
