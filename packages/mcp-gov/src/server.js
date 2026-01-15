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
 * Register all Gov tools to a server instance
 * @param {McpServer} server 
 */
export function registerGovTools(server) {
    // Register ALL data.gov.il tools
    registerFindDatasetsTool(server);
    registerGetDatasetInfoTool(server);
    registerSearchRecordsTool(server);
    registerTagsTool(server);
    registerSearchTagsTool(server);
    registerOrganizationTools(server);

    // Transport tools
    registerTransportStatisticsTool(server);

    // Emergency tools
    registerEmergencyAlertsTool(server);
}

/**
 * Create and configure MCP-Gov server
 */
function createGovServer() {
    const server = new McpServer({
        name: 'mcp-gov',
        version: '1.0.0',
        description: 'Israeli National Government Data - data.gov.il, transport, and emergency services'
    });

    registerGovTools(server);
    return server;
}

/**
 * Start the server
 */
async function main() {
    try {
        console.error('🏛️ MCP-Gov Server starting...');
        const server = createGovServer();
        const transport = new StdioServerTransport();
        await server.connect(transport);

        console.error('🚀 MCP-Gov server running on stdio');
    } catch (error) {
        console.error('❌ Failed to start server:', error);
        process.exit(1);
    }
}

// Only run if executed directly
import { fileURLToPath } from 'url';
if (process.argv[1] === fileURLToPath(import.meta.url)) {
    main();
}

