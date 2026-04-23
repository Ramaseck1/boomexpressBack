// Script de diagnostic pour tester la conversion PDF
const axios = require('axios');

// Configuration
const API_URL = 'http://localhost:3000';
// Remplacez ceci par un vrai token admin ou user
const TOKEN = process.env.TOKEN || '';

async function testPdfConversion(bookId) {
  console.log('==================================================');
  console.log('🧪 Test de conversion PDF');
  console.log('==================================================\n');

  try {
    // 1. Appel à l'endpoint getPdfAsImages
    console.log(`📥 Demande des pages pour le livre: ${bookId}`);
    console.log(`🔗 URL: ${API_URL}/pdf-images/${bookId}\n`);

    const response = await axios.get(
      `${API_URL}/pdf-images/${bookId}`,
      {
        headers: {
          'Authorization': `Bearer ${TOKEN}`,
          'Content-Type': 'application/json'
        },
        timeout: 30000
      }
    );

    console.log('✅ Réponse reçue');
    console.log('==================================================');
    console.log('📊 Nombre total de pages:', response.data.totalPages);
    console.log('📄 Pages générées:', response.data.pages.length);
    console.log('==================================================\n');

    // 2. Vérifier les URLs des pages
    if (response.data.pages && response.data.pages.length > 0) {
      console.log('🔍 Analyse des URLs générées:\n');

      for (let i = 0; i < response.data.pages.length; i++) {
        const page = response.data.pages[i];
        console.log(`Page ${page.page}: ${page.url}`);
      }

      console.log('\n==================================================');
      console.log('🧪 Test de chargement de chaque page:\n');

      // 3. Tester si chaque page est accessible
      const results = [];
      for (let i = 0; i < response.data.pages.length; i++) {
        const page = response.data.pages[i];

        try {
          console.log(`📄 Test page ${page.page}...`);

          const pageResponse = await axios.head(page.url, {
            timeout: 5000,
            maxRedirects: 5
          });

          const contentType = pageResponse.headers['content-type'];
          const status = pageResponse.status;

          console.log(`   ✅ Status: ${status}`);
          console.log(`   📋 Content-Type: ${contentType}`);
          console.log(`   🔗 URL: ${page.url.substring(0, 80)}...\n`);

          results.push({
            page: page.page,
            success: true,
            status,
            contentType
          });

        } catch (error) {
          console.log(`   ❌ Erreur: ${error.message}`);
          console.log(`   🔗 URL: ${page.url}\n`);

          results.push({
            page: page.page,
            success: false,
            error: error.message
          });
        }
      }

      // 4. Résumé
      console.log('==================================================');
      console.log('📊 RÉSUMÉ DU TEST');
      console.log('==================================================');

      const successful = results.filter(r => r.success).length;
      const failed = results.filter(r => !r.success).length;

      console.log(`✅ Pages accessibles: ${successful}/${response.data.totalPages}`);
      console.log(`❌ Pages en erreur: ${failed}/${response.data.totalPages}`);

      if (failed > 0) {
        console.log('\n⚠️ Pages avec erreur:');
        results.filter(r => !r.success).forEach(r => {
          console.log(`   - Page ${r.page}: ${r.error}`);
        });
      }

    } else {
      console.log('❌ Aucune page générée');
    }

    console.log('\n==================================================\n');

  } catch (error) {
    console.error('❌ Erreur lors du test:', error.message);

    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Données:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

// Récupérer l'ID du livre depuis les arguments
const bookId = process.argv[2];

if (!bookId) {
  console.log('Usage: node test-pdf-pages.js <BOOK_ID>');
  console.log('Example: node test-pdf-pages.js cm1234567890abc');
  console.log('\n💡 Vous pouvez récupérer un token avec:');
  console.log('   TOKEN="votre_token" node test-pdf-pages.js <BOOK_ID>');
  process.exit(1);
}

testPdfConversion(bookId);
