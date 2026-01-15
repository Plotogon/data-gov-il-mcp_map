/**
 * MCP-Geospatial Server
 * Israeli Geospatial Data Server
 * GovMap integration (placeholder implementation)
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { fileURLToPath } from 'url';

// GovMap tools
import { registerGeocodeTool } from './tools/govmap/geocode.js';
import { registerCadastralTool } from './tools/govmap/cadastral.js';
import { registerAutocompleteTool } from './tools/govmap/autocomplete.js';
import { registerConverterTool } from './tools/govmap/converter.js';

/**
 * Register all Geospatial tools to a server instance
 * @param {McpServer} server 
 */
export function registerGeospatialTools(server) {
    registerGeocodeTool(server);
    registerCadastralTool(server);
    registerConverterTool(server);
    registerAutocompleteTool(server);
}

/**
 * Create and configure MCP-Geospatial server
 */
function createGeospatialServer() {
    const server = new McpServer({
        name: 'mcp-geospatial',
        version: '1.0.0',
        description: 'Israeli Geospatial Data - GovMap, Geocoding, Cadastral, Planner'
    });

    console.error('🗺️ MCP-Geospatial Server starting...');
    console.error('');
    console.error('📍 Data Sources:');
    console.error('   • GovMap (govmap.gov.il) - Official Israeli mapping portal');
    console.error('   • Survey of Israel - National mapping agency');
    console.error('   • Land Registry - Cadastral data');
    console.error('');
    console.error('🔧 Geospatial Tools:');

    registerGeospatialTools(server);

    console.error('  ✅ geocode_address - Address → Coordinates');
    console.error('  ✅ search_cadastral - Gush/Helka parcel search');
    console.error('  ✅ convert_coordinates - ITM ↔ WGS84');
    console.error('  ✅ autocomplete - Raw suggestions (JSON)');

    console.error('');
    console.error('🎯 MCP-Geospatial server ready!');
    console.error(`   Total tools: 2`);

    return server;
}

/**
 * Start the server
 */
async function main() {
    try {
        const server = createGeospatialServer();
        const transport = new StdioServerTransport();
        await server.connect(transport);

        console.error('🚀 MCP-Geospatial server running on stdio');
    } catch (error) {
        console.error('❌ Failed to start server:', error);
        process.exit(1);
    }
}

// Only run if executed directly
if (process.argv[1] === fileURLToPath(import.meta.url)) {
    main();
}
