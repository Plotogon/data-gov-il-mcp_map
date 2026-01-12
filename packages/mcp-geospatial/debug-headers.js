import axios from 'axios';

const GOVMAP_CONFIG = {
    baseUrl: 'https://www.govmap.gov.il',
    api: {
        autocomplete: '/api/search-service/autocomplete'
    },
    defaultLanguage: 'he',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
};

const query = "גוש 7422 חלקה 116";

async function testWithHeaders(name, headers) {
    console.log(`Testing with headers: ${name}`);
    const url = `${GOVMAP_CONFIG.baseUrl}${GOVMAP_CONFIG.api.autocomplete}`;

    try {
        const payload = {
            searchText: query,
            limit: 5
        };
        const response = await axios.post(url, payload, { headers });
        console.log(`✅ ${name}: Found ${response.data.results ? response.data.results.length : 0} items`);
    } catch (e) {
        console.log(`❌ ${name}: Error ${e.response?.status}`);
    }
}

async function run() {
    const minimalHeaders = {
        'Referer': 'https://www.govmap.gov.il/',
        'User-Agent': GOVMAP_CONFIG.userAgent
    };

    const fullHeaders = {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Accept-Language': GOVMAP_CONFIG.defaultLanguage,
        'Referer': 'https://www.govmap.gov.il/',
        'Origin': 'https://www.govmap.gov.il',
        'User-Agent': GOVMAP_CONFIG.userAgent
    };

    await testWithHeaders("Minimal (Debug)", minimalHeaders);
    await testWithHeaders("Full (Prod)", fullHeaders);

    // Test suspects
    await testWithHeaders("Minimal + Accept-Language", { ...minimalHeaders, 'Accept-Language': 'he' });
    await testWithHeaders("Minimal + Origin", { ...minimalHeaders, 'Origin': 'https://www.govmap.gov.il' });
    await testWithHeaders("Minimal + Content-Type", { ...minimalHeaders, 'Content-Type': 'application/json' });
}

run();
