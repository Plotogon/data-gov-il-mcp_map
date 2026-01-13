import YahooFinance from 'yahoo-finance2';

const yahooFinance = new YahooFinance();

console.log('Type of default export:', typeof yahooFinance);
// If it's a class/function, try new
// If it's an object, maybe it has .YahooFinance?

async function testTicker(ticker) {
    console.log(`\n🔎 Testing ${ticker}...`);
    try {
        const quote = await yahooFinance.quote(ticker);
        console.log(`✅ Success: ${quote.shortName || quote.longName} (${quote.symbol})`);
        console.log(`   Price: ${quote.regularMarketPrice} ${quote.currency}`);
        console.log(`   Change: ${quote.regularMarketChangePercent?.toFixed(2)}%`);
    } catch (error) {
        console.error(`❌ Failed: ${error.message}`);
    }
}

async function run() {
    // Test Hebrew Stock (Leumi)
    await testTicker('LUMI.TA');
    // Test Index (TA-35)
    await testTicker('^TA35.TA');
    // Test US/IL dual (Teva)
    await testTicker('TEVA.TA');
}

run();
