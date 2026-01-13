/**
 * MCP-Gov Server
 * National Israeli Government Data Server
 * Simplified version with core tools
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';

// Data.gov.il tools
import { registerFindDatasetsTool } from './tools/data-gov/find.js';
import { registerGetDatasetInfoTool } from './tools/data-gov/dataset_info.js';
import { registerSearchRecordsTool } from './tools/data-gov/search.js';
import { registerTagsTool, registerSearchTagsTool } from './tools/data-gov/tags.js';
import { registerOrganizationTools } from './tools/data-gov/organizations.js';

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

    // Register ALL data.gov.il tools
    registerFindDatasetsTool(server);
    console.error('  ✅ find_datasets');

    registerGetDatasetInfoTool(server);
    console.error('  ✅ get_dataset_info');

    registerSearchRecordsTool(server);
    console.error('  ✅ search_records');

    registerTagsTool(server);
    console.error('  ✅ list_available_tags');

    registerSearchTagsTool(server);
    console.error('  ✅ search_tags');

    registerOrganizationTools(server);
    console.error('  ✅ list_organizations & get_organization_info');

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
    console.error(`   Total tools: 9`);
    console.error('');
    console.error('   All core data.gov.il tools are now active');

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
