/**
 * MCP-Municipal Server
 * Israeli Municipal/City Data Server
 * Tel Aviv, Jerusalem, Haifa
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';

// Shared tools
import { registerSearchCityDataTool } from './tools/shared/municipal-search.js';
import { registerGetCityServicesTool } from './tools/shared/city-services.js';

// Tel Aviv tools
import { registerGetCityEventsTool } from './tools/tel-aviv/city-events.js';

/**
 * Create and configure MCP-Municipal server
 */
function createMunicipalServer() {
    const server = new McpServer({
        name: 'mcp-municipal',
        version: '1.0.0',
        description: 'Israeli Municipal Data - Tel Aviv, Jerusalem, Haifa'
    });

    console.error('🏙️ MCP-Municipal Server starting...');
    console.error('');
    console.error('📍 Supported Cities:');
    console.error('   • Tel Aviv-Yafo (תל אביב-יפו)');
    console.error('   • Jerusalem (ירושלים)');
    console.error('   • Haifa (חיפה)');
    console.error('');
    console.error('🔧 Municipal Tools:');

    // Register search tool
    registerSearchCityDataTool(server);
    console.error('  ✅ search_city_data');

    registerGetCityEventsTool(server);
    console.error('  ✅ get_city_events');

    registerGetCityServicesTool(server);
    console.error('  ✅ get_city_services');

    console.error('');
    console.error('🎯 MCP-Municipal server ready!');
    console.error(`   Total tools: 3`);
    console.error('');
    console.error('   Note: Tel Aviv has comprehensive CKAN-based open data');
    console.error('   Jerusalem and Haifa have limited API access');

    return server;
}

/**
 * Start the server
 */
async function main() {
    try {
        const server = createMunicipalServer();
        const transport = new StdioServerTransport();
        await server.connect(transport);

        console.error('🚀 MCP-Municipal server running on stdio');
    } catch (error) {
        console.error('❌ Failed to start server:', error);
        process.exit(1);
    }
}

main();
