/**
 * MCP-Legal Server (formerly MCP-Judicial)
 * Israeli Legal System Data - Courts + Police + Fines
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

// Police tools
import { registerGetPoliceStatisticsTool, registerGetFinesInfoTool } from './tools/police/police-stats.js';

/**
 * Create and configure MCP-Legal server
 */
function createLegalServer() {
    const server = new McpServer({
        name: 'mcp-legal',
        version: '2.0.0',
        description: 'Israeli Legal System Data - Courts, Police, and Fines (Public Information Only)'
    });

    console.error('⚖️ MCP-Legal Server starting...');
    console.error('');
    console.error('🏛️ Coverage:');
    console.error('   • Courts (בתי משפט) - Supreme, District, Magistrate, Religious');
    console.error('   • Police (משטרת ישראל) - Crime and traffic statistics');
    console.error('   • Fines (קנסות) - Payment and appeal information');
    console.error('');
    console.error('⚠️  PRIVACY NOTE:');
    console.error('   Individual case/fine details require authentication');
    console.error('   This server provides PUBLICLY AVAILABLE data only');
    console.error('');
    console.error('🔧 Legal Tools:');

    // Register court tools
    registerGetCourtInfoTool(server);
    console.error('  ✅ get_court_info');

    registerGetCourtStatisticsTool(server);
    console.error('  ✅ get_court_statistics');

    // Register police tools
    registerGetPoliceStatisticsTool(server);
    console.error('  ✅ get_police_statistics');

    registerGetFinesInfoTool(server);
    console.error('  ✅ get_fines_info');

    console.error('');
    console.error('🎯 MCP-Legal server ready!');
    console.error(`   Total tools: 4`);
    console.error('');
    console.error('   🔗 Net HaMishpat: https://www.court.gov.il');
    console.error('   🔗 Police: https://www.gov.il/he/departments/israel_police');

    return server;
}

/**
 * Start the server
 */
async function main() {
    try {
        const server = createLegalServer();
        const transport = new StdioServerTransport();
        await server.connect(transport);

        console.error('🚀 MCP-Legal server running on stdio');
    } catch (error) {
        console.error('❌ Failed to start server:', error);
        process.exit(1);
    }
}

main();
