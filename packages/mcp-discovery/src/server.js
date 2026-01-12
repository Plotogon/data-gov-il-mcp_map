/**
 * MCP-Discovery Server
 * API reconnaissance and schema generation for Israeli government data sources
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { registerAnalyzeWebsiteTool } from './tools/analyze-website.js';
import { registerParseApiSpecTool } from './tools/parse-api-spec.js';
import { registerGenerateSchemaTool } from './tools/generate-schema.js';
import { registerTestApiEndpointTool } from './tools/test-api-endpoint.js';

/**
 * Create and configure MCP-Discovery server
 */
function createDiscoveryServer() {
    const server = new McpServer({
        name: 'mcp-discovery',
        version: '1.0.0',
        description: 'API reconnaissance and schema generation for Israeli government data'
    });

    console.error('🔍 MCP-Discovery Server starting...');

    // Register discovery tools
    registerAnalyzeWebsiteTool(server);
    console.error('  ✅ analyze_website registered');

    registerParseApiSpecTool(server);
    console.error('  ✅ parse_api_spec registered');

    registerGenerateSchemaTool(server);
    console.error('  ✅ generate_mcp_schema registered');

    registerTestApiEndpointTool(server);
    console.error('  ✅ test_api_endpoint registered');

    console.error('🎯 Discovery server ready!');

    return server;
}

/**
 * Start the server
 */
async function main() {
    try {
        const server = createDiscoveryServer();
        const transport = new StdioServerTransport();
        await server.connect(transport);

        console.error('🚀 MCP-Discovery server running on stdio');
    } catch (error) {
        console.error('❌ Failed to start server:', error);
        process.exit(1);
    }
}

main();
