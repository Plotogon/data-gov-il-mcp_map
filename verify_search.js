
import { ckanRequest } from './src/utils/api.js';

async function testSearch() {
    console.log('🧪 Testing Search Functionality...');

    try {
        // Test 1: Package Search (find_datasets)
        console.log('\n🔍 Test 1: Testing package_search (find_datasets equivalent)...');
        const searchParams = {
            q: 'תחבורה', // "Transportation" in Hebrew
            rows: 5
        };

        const searchResult = await ckanRequest('package_search', searchParams);

        if (searchResult.success && searchResult.result.results) {
            console.log(`✅ Search successful! Found ${searchResult.result.count} datasets.`);
            console.log('First 3 results:');
            searchResult.result.results.slice(0, 3).forEach(ds => {
                console.log(`- ${ds.title} (${ds.name})`);
            });
        } else {
            console.error('❌ Search failed or returned no structure:', searchResult);
        }

        // Test 2: Resource specific (if we had a resource ID, but let's stick to package_search first as "search" usually implies this)

    } catch (error) {
        console.error('❌ Test crashed:', error.message);
        if (error.response) {
            console.error('API Response status:', error.response.status);
        }
    }
}

testSearch();
