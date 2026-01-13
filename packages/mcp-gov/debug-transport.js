
import axios from 'axios';

const CKAN_API = 'https://data.gov.il/api/3/action';

async function search(query) {
    console.log(`\n🔍 Searching for: ${query}`);
    try {
        const url = `${CKAN_API}/package_search?q=${encodeURIComponent(query)}&rows=3`;
        const res = await axios.get(url);

        if (!res.data.success) {
            console.error('API failed');
            return;
        }

        const results = res.data.result.results;
        results.forEach(ds => {
            console.log(`\n📦 Dataset: ${ds.title} (Org: ${ds.organization?.title})`);
            console.log(`   Name: ${ds.name}`);
            console.log(`   Resources:`);
            ds.resources.forEach(r => {
                console.log(`   - [${r.format}] ${r.name}`);
                console.log(`     ID: ${r.id}`);
                console.log(`     URL: ${r.url}`);
            });
        });

    } catch (e) {
        console.error('Error:', e.message);
    }
}

async function run() {
    await search('רכבת ישראל'); // Israel Railways
    await search('נתב"ג'); // Ben Gurion Airport / Flights
    await search('רישוי רכב'); // Vehicle Licensing
}

run();
