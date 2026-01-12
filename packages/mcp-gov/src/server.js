/**
 * MCP-Gov Server
 * National Israeli Government Data Server
 * Simplified version with core tools
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';

// Data.gov.il tools
import { registerFindDatasetsTool } from './tools/data-gov/find.js';

// Transport tools
import { registerTransportStatisticsTool } from './tools/transport/transport-stats.js';

// Emergency tools
import { registerEmergencyAlertsTool } from './tools/emergency/pikud-haoref.js';

/**
 * Create and configure MCP-Gov server
 */
function createGovServer() {
    const server = new McpServer({
        name: 'mcp-gov',
        version: '1.0.0',
        description: 'Israeli National Government Data - data.gov.il, transport, and emergency services'
    });

    console.error('🏛️ MCP-Gov Server starting...');
    console.error('');
    console.error('📚 Data.gov.il tools:');

    // Register data.gov.il tools
    registerFindDatasetsTool(server);
    console.error('  ✅ find_datasets');

    console.error('');
    console.error('🚌 Transport tools:');

    registerTransportStatisticsTool(server);
    console.error('  ✅ transport_statistics');

    console.error('');
    console.error('🚨 Emergency tools:');

    registerEmergencyAlertsTool(server);
    console.error('  ✅ emergency_alerts');

    console.error('');
    console.error('🎯 MCP-Gov server ready!');
    console.error(`   Total tools: 3`);
    console.error('');
    console.error('   Note: Additional data.gov.il tools available in legacy server');
    console.error('   This is a simplified version with most essential tools');

    return server;
}

/**
 * Start the server
 */
async function main() {
    try {
        const server = createGovServer();
        const transport = new StdioServerTransport();
        await server.connect(transport);

        console.error('🚀 MCP-Gov server running on stdio');
    } catch (error) {
        console.error('❌ Failed to start server:', error);
        process.exit(1);
    }
}

main();
