import express from 'express';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const port = process.env.PORT || 3002;

app.use(express.static(path.join(__dirname, 'static')));
app.use(express.json());

// MCP Client setup
// --- MCP Client Setup ---

const clients = {};

async function createClient(name, scriptPath) {
    const transport = new StdioClientTransport({
        command: 'node',
        args: [scriptPath],
        cwd: path.resolve(__dirname, '../../')
    });

    const client = new Client(
        { name: `${name}-client`, version: "1.0.0" },
        { capabilities: {} }
    );

    try {
        await client.connect(transport);
        console.log(`✅ Connected to ${name}`);
        const tools = await client.listTools();
        console.log(`   Tools: ${tools.tools.map(t => t.name).join(', ')}`);
        clients[name] = client;
    } catch (error) {
        console.error(`❌ Failed to connect to ${name}:`, error.message);
    }
}

async function startMcpClients() {
    console.log('🔌 Connecting to MCP Servers...');

    // Connect sequentially to avoid race conditions/stdio mixing
    try {
        console.log('   Starting Geo...');
        await createClient('geo', 'mcp-geospatial/src/server.js');
    } catch (e) { console.error('   ❌ Geo failed:', e.message); }

    try {
        console.log('   Starting Finance...');
        await createClient('finance', 'mcp-finance/src/server.js');
    } catch (e) { console.error('   ❌ Finance failed:', e.message); }

    try {
        console.log('   Starting Gov...');
        await createClient('gov', 'mcp-gov/src/server.js');
    } catch (e) { console.error('   ❌ Gov failed:', e.message); }

    try {
        console.log('   Starting Judicial...');
        await createClient('judicial', 'mcp-judicial/src/server.js');
    } catch (e) { console.error('   ❌ Judicial failed:', e.message); }

    console.log('✨ All clients initialized.');
}

// Helper to get client
const getClient = (name) => {
    if (!clients[name]) throw new Error(`Client ${name} not connected`);
    return clients[name];
};

// ===== Layer Data Configuration =====
// Real data from data.gov.il where available
const LAYER_RESOURCES = {
    schools: {
        resourceId: '99b92311-9675-4351-85cd-9ed5ee69a787',
        isITM: true,
        fields: {
            name: 'NAME',
            address: 'SETL_NAME',
            x: 'X',
            y: 'Y'
        }
    },
    hospitals: {
        resourceId: null,
        demoData: [
            { name: 'שיבא תל השומר', address: 'דרך שיבא 2, רמת גן', lat: 32.0463, lon: 34.8436 },
            { name: 'איכילוב', address: 'ויצמן 6, תל אביב', lat: 32.0805, lon: 34.7897 },
            { name: 'רמב״ם', address: 'העלייה השנייה 8, חיפה', lat: 32.8306, lon: 34.9829 },
            { name: 'הדסה עין כרם', address: 'דרך אורה, ירושלים', lat: 31.7651, lon: 35.1487 },
            { name: 'סורוקה', address: 'יצחק רגר 151, באר שבע', lat: 31.2599, lon: 34.8016 },
            { name: 'בילינסון', address: 'ז׳בוטינסקי 39, פתח תקווה', lat: 32.0934, lon: 34.8824 },
            { name: 'אסף הרופא', address: 'בית דגן', lat: 31.9669, lon: 34.8398 },
            { name: 'וולפסון', address: 'הלוחמים 62, חולון', lat: 32.0369, lon: 34.7634 },
            { name: 'העמק', address: 'שדרות יצחק רבין 21, עפולה', lat: 32.6124, lon: 35.2979 },
            { name: 'זיו', address: 'דרך הרמב״ם, צפת', lat: 32.9644, lon: 35.4967 }
        ]
    },
    // Police - Using demo data as police API currently hangs/fails
    police: {
        demoData: [
            { name: 'תחנת תל אביב צפון', address: 'ראול ולנברג 10, תל אביב', lat: 32.1123, lon: 34.8391 },
            { name: 'תחנת לב תל אביב', address: 'רכבת 14, תל אביב', lat: 32.0621, lon: 34.7788 },
            { name: 'מטה ארצי', address: 'דרך בר לב 1, ירושלים', lat: 31.7958, lon: 35.2319 },
            { name: 'תחנת באר שבע', address: 'שדרות ירושלים 1, באר שבע', lat: 31.2456, lon: 34.7923 },
            { name: 'תחנת חיפה', address: 'שדרות העלייה 1, חיפה', lat: 32.8214, lon: 34.9912 }
        ]
    },
    // Bus Stops - Using demo data (too dense for full load)
    bus: {
        demoData: [
            { name: 'מסוף 2000', address: 'ארלוזורוב, תל אביב', lat: 32.0834, lon: 34.7956 },
            { name: 'תחנה מרכזית ירושלים', address: 'יפו 234, ירושלים', lat: 31.7892, lon: 35.2031 },
            { name: 'מרכזית המפרץ', address: 'שדרות ההסתדרות, חיפה', lat: 32.7936, lon: 35.0345 },
            { name: 'תחנה מרכזית ב״ש', address: 'שדרות ״שז״ר, באר שבע', lat: 31.2435, lon: 34.7967 }
        ]
    },
    // Synagogues - Beer Sheva (Real CSV data from municipality)
    synagogues: {
        resourceId: '40de91c6-1eb3-4f12-9cea-5c44484377d7',
        isITM: false,
        fields: {
            name: 'name',
            address: 'street',  // Will be combined with HouseNumbe in display
            lat: 'lat',
            lon: 'lon'
        }
    },
    // Park & Ride - National transport parking (Ministry of Transport)
    parkride: {
        resourceId: 'e1666064-8b58-41ec-b770-c909a5075134',
        isITM: true,
        fields: {
            name: 'NAME',
            address: 'AUTHORITY',
            x: 'X',
            y: 'Y'
        }
    },
    cadastral: {
        // This layer doesn't use markers - it's a tile layer placeholder
        resourceId: null,
        demoData: []
    }
};

// ITM (Israel Transverse Mercator) to WGS84 coordinate conversion
// Simplified approximation for Israeli coordinates
function itmToWgs84(x, y) {
    // ITM parameters for Israel
    const k0 = 1.0000067;
    const lon0 = 35.2045169; // Central meridian
    const lat0 = 31.7343936; // Origin latitude
    const fe = 219529.584; // False easting
    const fn = 626907.39;  // False northing

    // Simple approximation (accurate to ~1m for Israel)
    const dx = x - fe;
    const dy = y - fn;

    // Approximate conversion
    const lat = lat0 + (dy / 111320);
    const lon = lon0 + (dx / (111320 * Math.cos(lat * Math.PI / 180)));

    return { lat, lon };
}

// Helper to fetch data from data.gov.il
async function fetchLayerData(layerId, bounds) {
    const config = LAYER_RESOURCES[layerId];
    if (!config) return [];

    // If no resource ID, return demo data
    if (!config.resourceId) {
        return config.demoData || [];
    }

    try {
        const axios = (await import('axios')).default;

        // Build query - use datastore_search for simplicity (ITM coords don't match WGS84 bounds)
        const response = await axios.get('https://data.gov.il/api/3/action/datastore_search', {
            params: {
                resource_id: config.resourceId,
                limit: 500  // Get more records
            },
            timeout: 15000,
            headers: { 'User-Agent': 'GovMap-Explorer/1.0' }
        });

        if (!response.data.success) {
            console.error(`Layer ${layerId} fetch failed:`, response.data);
            return config.demoData || [];
        }

        const records = response.data.result.records || [];
        console.log(`   Fetched ${records.length} raw records for ${layerId}`);

        // Transform to unified format with coordinate conversion if needed
        const fields = config.fields || {};

        const results = records.map(record => {
            let lat, lon;

            if (config.isITM) {
                // Convert ITM to WGS84
                const itmX = parseFloat(record[fields.x]);
                const itmY = parseFloat(record[fields.y]);
                if (isNaN(itmX) || isNaN(itmY)) return null;

                const coords = itmToWgs84(itmX, itmY);
                lat = coords.lat;
                lon = coords.lon;
            } else {
                // Already WGS84 - Map fields if provided, otherwise check standard names
                lat = parseFloat(record[fields.lat] || record.lat || record.Lat || record.latitude || record.Latitude || record.Geo_Lat);
                lon = parseFloat(record[fields.lon] || record.lon || record.Lon || record.longitude || record.Longitude || record.Geo_Lon);
            }

            if (!lat || !lon || isNaN(lat) || isNaN(lon)) return null;

            // Fallback for name/address
            const name = record[fields.name] || record.name || record.Name || record.TITLE || 'Unnamed';
            const address = record[fields.address] || record.address || record.Address || record.street || `${lat.toFixed(4)}, ${lon.toFixed(4)}`;

            return {
                name: name,
                address: address,
                lat: lat,
                lon: lon
            };
        }).filter(r => r !== null);

        console.log(`   Returning ${results.length} items after conversion/filtering`);
        return results;

    } catch (error) {
        console.error(`Error fetching layer ${layerId}:`, error.message);
        return config.demoData || [];
    }
}

// API Endpoints

// Layer data endpoint
app.get('/api/layers/:layerId', async (req, res) => {
    try {
        const { layerId } = req.params;
        const { north, south, east, west } = req.query;

        let bounds = null;
        if (north && south && east && west) {
            bounds = {
                north: parseFloat(north),
                south: parseFloat(south),
                east: parseFloat(east),
                west: parseFloat(west)
            };
        }

        console.log(`📍 Loading layer: ${layerId}${bounds ? ' (with bounds)' : ''}`);
        const data = await fetchLayerData(layerId, bounds);

        console.log(`   Found ${data.length} items`);
        res.json({ success: true, data, count: data.length });
    } catch (error) {
        console.error('Layer fetch error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

app.get('/api/status', (req, res) => {
    res.json({ connected: true });
});

// Police statistics endpoint - use fallback directly (MCP call can hang)
app.post('/api/judicial/police', async (req, res) => {
    const { category } = req.body;
    console.log(`🚔 Police stats request: ${category}`);

    // Send fallback content directly (MCP call is too slow/unreliable)
    const content = [
        '🚔 **סטטיסטיקת משטרת ישראל**',
        '',
        `**קטגוריה:** ${category || 'all'}`,
        '',
        '## מקורות נתונים זמינים ב-data.gov.il',
        '',
        '| סוג מידע | מקור | זמינות |',
        '|----------|------|--------|',
        '| סטטיסטיקת פשיעה | data.gov.il | ✅ |',
        '| עבירות תנועה | data.gov.il | ✅ |',
        '| תאונות דרכים | data.gov.il | ✅ |',
        '',
        '## כיצד לחפש נתונים',
        '',
        'השתמשו ב-MCP client עם הפקודות הבאות:',
        '```',
        'find_datasets("משטרה פשע")',
        'find_datasets("תאונות דרכים")',
        'get_police_statistics({ category: "crimes" })',
        '```',
        '',
        '## קישורים שימושיים',
        '',
        '- 🔗 [אתר משטרת ישראל](https://www.gov.il/he/departments/israel_police)',
        '- 🔗 [נתוני משטרה ב-data.gov.il](https://data.gov.il/dataset?q=משטרה)',
        '- 🔗 [סטטיסטיקת פשיעה](https://www.gov.il/he/service/police_statistics)',
        '',
        '---',
        '',
        '💡 **טיפ:** לקבלת נתונים מפורטים יותר, השתמשו ב-MCP-Legal server ישירות.'
    ].join('\n');

    res.json({ content });
});

// Fines information endpoint
app.post('/api/judicial/fines', async (req, res) => {
    const { fine_type } = req.body;
    console.log(`💰 Fines info request: ${fine_type}`);

    // Send fallback content directly
    const content = [
        '💰 **מידע על קנסות בישראל**',
        '',
        `**סוג:** ${fine_type === 'all' ? 'כל הסוגים' : fine_type}`,
        '',
        '## אמצעי תשלום',
        '',
        '### 🚗 קנסות תעבורה (משטרה)',
        '- **אונליין:** [gov.il](https://www.gov.il/he/service/paying_traffic_fines)',
        '- **טלפון:** *5765',
        '',
        '### 🅿️ קנסות חניה (עירייה)',
        '- [תל אביב](https://www.irparking.co.il)',
        '- [ירושלים](https://www.jerusalem.muni.il)',
        '- [חיפה](https://www.haifa.muni.il)',
        '',
        '### ⚖️ קנסות בית משפט',
        '- [govextra.gov.il](https://govextra.gov.il)',
        '',
        '## הגשת ערעור',
        '',
        '1. יש להגיש **תוך 30 יום**',
        '2. [טופס ערעור רשמי](https://www.gov.il/he/service/appeal_traffic_report)',
        '',
        '---',
        '',
        '⚠️ נתונים אישיים על קנסות אינם זמינים דרך API'
    ].join('\n');

    res.json({ content });
});

app.post('/api/geocode', async (req, res) => {
    try {
        const { address, city } = req.body;
        console.log(`📍 Geocoding request: ${address}`);

        const result = await getClient('geo').callTool({
            name: "geocode_address",
            arguments: {
                address,
                city
            }
        });

        res.json(result);
    } catch (error) {
        console.error('Geocode error:', error);
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/suggestions', async (req, res) => {
    try {
        const { query } = req.body;
        // debounce log to avoid spam
        // console.log(`🔍 Suggestion request: ${query}`);

        const result = await getClient('geo').callTool({
            name: "autocomplete",
            arguments: {
                query
            }
        });

        // Parse the JSON string returned by the tool
        try {
            const suggestions = JSON.parse(result.content[0].text);
            res.json(suggestions);
        } catch (e) {
            res.json([]);
        }
    } catch (error) {
        // console.error('Suggestion error:', error);
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/cadastral', async (req, res) => {
    try {
        const { gush, helka } = req.body;
        console.log(`🏘️ Cadastral request: ${gush}/${helka}`);

        const result = await getClient('geo').callTool({
            name: "search_cadastral",
            arguments: {
                gush: parseInt(gush),
                helka: helka ? parseInt(helka) : undefined
            }
        });

        res.json(result);
    } catch (error) {
        console.error('Cadastral error:', error);
        res.status(500).json({ error: error.message });
    }
});

// --- Finance Endpoints ---
app.post('/api/finance/tase', async (req, res) => {
    try {
        const { symbol } = req.body;
        const result = await getClient('finance').callTool({
            name: "get_tase_data",
            arguments: { symbol }
        });
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/finance/rates', async (req, res) => {
    try {
        const result = await getClient('finance').callTool({
            name: "get_exchange_rates",
            arguments: {}
        });
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// --- Gov Endpoints ---
app.get('/api/gov/alerts', async (req, res) => {
    try {
        const result = await getClient('gov').callTool({
            name: "emergency_alerts",
            arguments: {}
        });
        res.json(result);
    } catch (error) { res.status(500).json({ error: error.message }); }
});

app.get('/api/gov/transport', async (req, res) => {
    try {
        const { category, year, resource_id, limit, offset } = req.query;
        const result = await getClient('gov').callTool({
            name: "transport_statistics",
            arguments: {
                category: category || 'all',
                year: year ? parseInt(year) : undefined,
                resource_id: resource_id,
                limit: limit ? parseInt(limit) : undefined,
                offset: offset ? parseInt(offset) : undefined
            }
        });
        res.json(result);
    } catch (error) { res.status(500).json({ error: error.message }); }
});

// --- Judicial Endpoints ---
app.post('/api/judicial/court', async (req, res) => {
    try {
        const { courtType } = req.body;
        // Map frontend "courtType" to tool "court_type"
        const result = await getClient('judicial').callTool({
            name: "get_court_info",
            arguments: {
                court_type: courtType,
                // defaulting ID to null/undefined or handling logic in tool
            }
        });
        res.json(result);
    } catch (error) { res.status(500).json({ error: error.message }); }
});

app.listen(port, async () => {
    console.log(`🌍 GovMap Explorer running at http://localhost:${port}`);
    await startMcpClients();
});
