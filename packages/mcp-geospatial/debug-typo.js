import axios from 'axios';

const GOVMAP_CONFIG = {
    baseUrl: 'https://www.govmap.gov.il',
    api: {
        autocomplete: '/api/search-service/autocomplete'
    },
    defaultLanguage: 'he',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
};


async function testQuery(q, params = {}) {
    console.log(`Testing query: "${q}" with params ${JSON.stringify(params)}`);
    const url = `${GOVMAP_CONFIG.baseUrl}${GOVMAP_CONFIG.api.autocomplete}`;

    try {
        const payload = {
            searchText: q,
            limit: 5,
            ...params
        };
        const response = await axios.post(url, payload, {
            headers: {
                'Referer': 'https://www.govmap.gov.il/',
                'User-Agent': GOVMAP_CONFIG.userAgent
            }
        });
        console.log(`✅ Result for "${q}": Found ${response.data.results ? response.data.results.length : 0} items`);
        if (response.data.results && response.data.results.length > 0) {
            console.log('Sample:', JSON.stringify(response.data.results[0]));
        }
    } catch (e) {
        console.log(`❌ Error for "${q}":`, e.response?.status);
    }
}

async function run() {
    // 1. Correct English, no type
    await testQuery("Rothschild");
    // 2. Correct Hebrew
    await testQuery("רוטשילד");
    // 3. Typo English
    await testQuery("Rotshield");
}

run();
