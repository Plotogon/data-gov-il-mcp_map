/**
 * MCP-Judicial Server
 * Israeli Court System Data (Public Information Only)
 * 
 * IMPORTANT: Individual case details require attorney authentication via Net HaMishpat.
 * This server provides only publicly available information.
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';

// Court tools
import { registerGetCourtInfoTool } from './tools/courts/court-info.js';

// Statistics tools
import { registerGetCourtStatisticsTool } from './tools/statistics/legal-stats.js';

/**
 * Create and configure MCP-Judicial server
 */
function createJudicialServer() {
    const server = new McpServer({
        name: 'mcp-judicial',
        version: '1.0.0',
        description: 'Israeli Court System Data (Public Information Only)'
    });

    console.error('⚖️ MCP-Judicial Server starting...');
    console.error('');
    console.error('🏛️ Israeli Court System:');
    console.error('   • Supreme Court (בית המשפט העליון)');
    console.error('   • 6 District Courts (בתי משפט מחוזיים)');
    console.error('   • Magistrate Courts (בתי משפט שלום)');
    console.error('   • Religious Courts (בתי דין דתיים)');
    console.error('   • Specialized Courts (בתי משפט מיוחדים)');
    console.error('');
    console.error('⚠️  PRIVACY NOTE:');
    console.error('   Individual case details require attorney authentication');
    console.error('   This server provides PUBLICLY AVAILABLE data only');
    console.error('');
    console.error('🔧 Judicial Tools:');

    // Register court info tool
    registerGetCourtInfoTool(server);
    console.error('  ✅ get_court_info');

    // Register statistics tool
    registerGetCourtStatisticsTool(server);
    console.error('  ✅ get_court_statistics');

    console.error('');
    console.error('🎯 MCP-Judicial server ready!');
    console.error(`   Total tools: 2`);
    console.error('');
    console.error('   Note: For case details, use Net HaMishpat (attorney access)');
    console.error('   Net HaMishpat: https://www.court.gov.il');

    return server;
}

/**
 * Start the server
 */
async function main() {
    try {
        const server = createJudicialServer();
        const transport = new StdioServerTransport();
        await server.connect(transport);

        console.error('🚀 MCP-Judicial server running on stdio');
    } catch (error) {
        console.error('❌ Failed to start server:', error);
        process.exit(1);
    }
}

main();
