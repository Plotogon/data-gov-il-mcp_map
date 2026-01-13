import axios from 'axios';
import { XMLParser } from 'fast-xml-parser';

async function testBOI() {
    console.log(`\n🏦 Testing Bank of Israel API...`);
    const url = 'https://boi.org.il/PublicApi/GetExchangeRates?asXml=true';

    try {
        const response = await axios.get(url);
        console.log('✅ Response received');

        const parser = new XMLParser();
        const jObj = parser.parse(response.data);

        console.log('Structure:', Object.keys(jObj));

        // Navigate structure (usually ExchangeRates -> ExchangeRate)
        const root = jObj.ExchangeRatesResponseCollectioDTO;
        let rates = [];

        if (root) {
            console.log('Root keys:', Object.keys(root));
            if (root.ExchangeRates) {
                console.log('ExchangeRates keys:', Object.keys(root.ExchangeRates));
                console.log('ExchangeRates CONTENT:', JSON.stringify(root.ExchangeRates, null, 2).substring(0, 500));
            }

            // Check for double nesting
            if (root.ExchangeRatesResponseCollectioDTO) {
                console.log('Found nested DTO! Keys:', Object.keys(root.ExchangeRatesResponseCollectioDTO));
                const inner = root.ExchangeRatesResponseCollectioDTO;
                if (inner.ExchangeRates) {
                    rates = inner.ExchangeRates.ExchangeRate || [];
                }
            } else if (root.ExchangeRates) {
                rates = root.ExchangeRates.ExchangeRate || [];
            }
        }

        // Show USD (Key: US Dollar)
        const usd = rates.find(r => r.key === 'USD');
        if (usd) {
            console.log('🇺🇸 USD:', JSON.stringify(usd, null, 2));
        } else {
            console.log('Sample rate:', JSON.stringify(rates[0], null, 2));
        }

    } catch (error) {
        console.error('❌ BOI Failed:', error.message);
    }
}

testBOI();
