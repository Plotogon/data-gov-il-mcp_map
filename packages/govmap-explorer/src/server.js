import express from 'express';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const port = 3001;

app.use(express.static(path.join(__dirname, 'static')));
app.use(express.json());

// MCP Client setup
const transport = new StdioClientTransport({
    command: 'node',
    args: ['mcp-geospatial/src/server.js'],
    cwd: path.resolve(__dirname, '../../') // Run from packages/ root
});

const client = new Client(
    {
        name: "govmap-explorer-client",
        version: "1.0.0",
    },
    {
        capabilities: {},
    }
);

async function startMcpClient() {
    try {
        console.log('🔌 Connecting to MCP Geospatail Server...');
        await client.connect(transport);
        console.log('✅ Connected to MCP Server');

        // List tools to verify connection
        const tools = await client.listTools();
        console.log(`🛠️ Available tools: ${tools.tools.map(t => t.name).join(', ')}`);

    } catch (error) {
        console.error('❌ Failed to connect to MCP server:', error);
    }
}

// API Endpoints

app.get('/api/status', (req, res) => {
    res.json({ connected: true });
});

app.post('/api/geocode', async (req, res) => {
    try {
        const { address, city } = req.body;
        console.log(`📍 Geocoding request: ${address}`);

        const result = await client.callTool({
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

        const result = await client.callTool({
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

        const result = await client.callTool({
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

// Start server
app.listen(port, async () => {
    console.log(`🌍 GovMap Explorer running at http://localhost:${port}`);
    await startMcpClient();
});
