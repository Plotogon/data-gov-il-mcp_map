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


// API Endpoints

app.get('/api/status', (req, res) => {
    res.json({ connected: true });
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
