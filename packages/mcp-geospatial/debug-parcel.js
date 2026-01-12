import axios from 'axios';

const GOVMAP_CONFIG = {
    baseUrl: 'https://www.govmap.gov.il',
    api: {
        autocomplete: '/api/search-service/autocomplete'
    },
    defaultLanguage: 'he',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
};

async function testParcel(gush, helka, type) {
    const query = `גוש ${gush} חלקה ${helka}`;
    console.log(`Testing Parcel: "${query}" with type ${type}`);
    const url = `${GOVMAP_CONFIG.baseUrl}${GOVMAP_CONFIG.api.autocomplete}`;

    try {
        const payload = {
            searchText: query,
            limit: 5,
        };
        // Add type only if defined (to test default behavior too)
        if (type !== undefined) payload.type = type;

        const response = await axios.post(url, payload, {
            headers: {
                'Referer': 'https://www.govmap.gov.il/',
                'User-Agent': GOVMAP_CONFIG.userAgent
            }
        });

        console.log(`✅ Result (Type ${type}): Found ${response.data.results ? response.data.results.length : 0} items`);
        if (response.data.results && response.data.results.length > 0) {
            const item = response.data.results[0];
            console.log('Sample:', JSON.stringify({ name: item.name || item.text, type: item.type, x: item.x, y: item.y }));
        }
    } catch (e) {
        console.log(`❌ Error (Type ${type}):`, e.response?.status);
    }
}

async function run() {
    // Test Gush 7422 Helka 116 (Dizengoff Center)
    await testParcel(7422, 116, 0); // Address type (Current bug)
    await testParcel(7422, 116, 2); // Parcel/Lot type (Suspected fix)
    await testParcel(7422, 116, 1); // Street type (?)
    await testParcel(7422, 116, undefined); // No type
}

run();
