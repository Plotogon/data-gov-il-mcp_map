
// Debug script to check what data.gov.il returns
const resourceId = '712399a9-839c-4cb0-affc-687251785f7c'; // Trains
const targetUrl = `https://data.gov.il/resource/${resourceId}/download`;

console.log(`Fetching: ${targetUrl}`);

async function run() {
    try {
        const response = await fetch(targetUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            }
        });

        console.log(`Status: ${response.status} ${response.statusText}`);
        console.log('Headers:', Object.fromEntries(response.headers.entries()));

        const text = await response.text();
        console.log('--- Body Preview (First 1000 chars) ---');
        console.log(text.substring(0, 1000));
        console.log('--- Body Length ---');
        console.log(text.length);

    } catch (error) {
        console.error('Error:', error);
    }
}

run();
