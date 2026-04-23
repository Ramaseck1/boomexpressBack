// Script pour corriger tous les PDFs existants
const axios = require('axios');

const API_URL = 'http://localhost:3000';
const TOKEN = process.env.TOKEN || '';

async function fixAllPdfs() {
  console.log('==================================================');
  console.log('🔧 Correction de tous les PDFs');
  console.log('==================================================\n');

  try {
    // 1. Récupérer tous les livres
    console.log('📚 Récupération de tous les livres...\n');

    const response = await axios.get(
      `${API_URL}/livres`,
      {
        headers: {
          'Authorization': `Bearer ${TOKEN}`
        },
        timeout: 30000
      }
    );

    const livres = response.data;
    console.log(`✅ ${livres.length} livres trouvés\n`);

    // 2. Corriger chaque livre
    let successCount = 0;
    let errorCount = 0;
    const errors = [];

    for (let i = 0; i < livres.length; i++) {
      const livre = livres[i];
      console.log(`\n[${i + 1}/${livres.length}] 📖 ${livre.nom}`);
      console.log(`   ID: ${livre.id}`);

      try {
        console.log(`   🔧 Tentative de correction...`);

        const fixResponse = await axios.post(
          `${API_URL}/admin/fix-pdf-conversion/${livre.id}`,
          {},
          {
            headers: {
              'Authorization': `Bearer ${TOKEN}`
            },
            timeout: 60000 // 60 secondes par livre
          }
        );

        console.log(`   ✅ Succès`);
        console.log(`   📋 Resource type: ${fixResponse.data.resource_type}`);
        console.log(`   🔗 Nouvelle URL: ${fixResponse.data.livre.fileUrl.substring(0, 60)}...`);

        successCount++;

      } catch (error) {
        errorCount++;
        const errorMsg = error.response?.data?.details || error.message;
        console.log(`   ❌ Erreur: ${errorMsg}`);
        errors.push({
          livre: livre.nom,
          id: livre.id,
          error: errorMsg
        });
      }
    }

    // 3. Résumé
    console.log('\n==================================================');
    console.log('📊 RÉSUMÉ');
    console.log('==================================================');
    console.log(`✅ Succès: ${successCount}/${livres.length}`);
    console.log(`❌ Erreurs: ${errorCount}/${livres.length}`);

    if (errors.length > 0) {
      console.log('\n❌ Livres avec erreurs:');
      errors.forEach(err => {
        console.log(`   - ${err.livre} (${err.id}): ${err.error}`);
      });
    }

    console.log('\n==================================================\n');

  } catch (error) {
    console.error('❌ Erreur générale:', error.message);
  }
}

fixAllPdfs();
