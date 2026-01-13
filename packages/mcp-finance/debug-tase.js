import axios from 'axios';

const HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'application/json, text/plain, */*',
    'Accept-Language': 'he-IL,he;q=0.9,en-US;q=0.8,en;q=0.7',
    'Origin': 'https://www.tase.co.il',
    'Referer': 'https://www.tase.co.il/',
    'x-tase-client': 'website' // Sometimes needed
};

async function testSearch(query) {
    console.log(`\n🔎 Testing Search for "${query}"...`);
    // Use direct IP to bypass DNS issues
    const url = 'https://45.60.33.232/api/content/search/searchresult';
    HEADERS['Host'] = 'www.tase.co.il';


    try {
        const response = await axios.post(url, {
            searchType: "All",
            term: query,
            lang: "1" // 1 = Hebrew, 0 = English
        }, { headers: HEADERS });

        console.log('✅ Search Success!');
        console.log(`Results found: ${response.data.length || 'Unknown'}`);
        if (response.data.length > 0) {
            console.log('First result:', JSON.stringify(response.data[0], null, 2));
        } else {
            console.log('Raw data:', response.data);
        }
        return response.data;
    } catch (error) {
        console.error('❌ Search Failed:', error.message);
        if (error.response) console.error('Status:', error.response.status, error.response.data);
    }
}

async function testMaya() {
    console.log(`\n🏺 Testing Maya Legacy...`);
    // Legacy URL from Hasadna scraper
    const url = 'http://maya.tase.co.il/bursa/indeximptoday.htm';

    try {
        const response = await axios.get(url, { headers: HEADERS });
        console.log('✅ Maya Success!');
        console.log('Length:', response.data.length);
    } catch (error) {
        console.error('❌ Maya Failed:', error.message);
        if (error.response) console.error('Status:', error.response.status);
    }
}

async function testIndices() {
    console.log(`\n📊 Testing Indices...`);
    // Common endpoint for main indices
    const url = 'https://45.60.33.232/api/index/rec/Indices';
    HEADERS['Host'] = 'www.tase.co.il';

    try {
        const response = await axios.get(url, { headers: HEADERS });
        console.log('✅ Indices Success!');
        console.log('Data sample:', JSON.stringify(response.data.slice(0, 2), null, 2));
    } catch (error) {
        console.error('❌ Indices Failed:', error.message);
        // Try POST if GET fails
        try {
            console.log('   Retrying with POST...');
            const response = await axios.post(url, {}, { headers: HEADERS });
            console.log('✅ Indices (POST) Success!');
            console.log('Data sample:', JSON.stringify(response.data.slice(0, 2), null, 2));
        } catch (err2) {
            console.error('   ❌ Indices (POST) Failed:', err2.message);
        }
    }
}

async function run() {
    await testMaya();
}

run();
