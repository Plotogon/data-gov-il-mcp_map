import axios from 'axios';
import { XMLParser } from 'fast-xml-parser';

async function testBOI() {
    console.log(`\n🏦 Testing Bank of Israel API...`);
    const url = 'https://boi.org.il/PublicApi/GetExchangeRates?asXml=true';

    try {
        const response = await axios.get(url);
        const parser = new XMLParser();
        const jObj = parser.parse(response.data);

        console.log('FULL DUMP:', JSON.stringify(jObj, null, 2));

    } catch (error) {
        console.error('❌ BOI Failed:', error.message);
    }
}

testBOI();
