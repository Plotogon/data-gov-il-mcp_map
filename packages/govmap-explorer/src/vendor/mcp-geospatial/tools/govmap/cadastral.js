/**
 * Cadastral Search Tool
 * Search Israeli land parcels (Gush/Helka)
 */

import { z } from 'zod';
import { searchCadastral } from '../../utils/govmap-api.js';

/**
 * Register the search_cadastral tool with MCP server
 */
export function registerCadastralTool(server) {
    server.tool(
        'search_cadastral',
        {
            gush: z.number().int().positive().describe('Gush (block) number - גוש'),
            helka: z.number().int().positive().optional().describe('Helka (parcel) number - חלקה (optional)')
        },
        async ({ gush, helka }) => {
            try {
                const result = await searchCadastral(gush, helka);

                const summary = [
                    `🏘️ **Cadastral Parcel Search**`,
                    ``,
                    `**Gush (Block):** ${result.gush}`,
                    helka ? `**Helka (Parcel):** ${result.helka}` : '',
                    ``
                ].filter(line => line !== '');

                if (result.status === 'error') {
                    summary.push(`❌ **Error:** ${result.error}`);
                } else if (result.status === 'not_found') {
                    summary.push(`⚠️ **Not Found:** ${result.message}`);
                    summary.push('');
                    summary.push('Please verify the Gush and Helka numbers are correct.');
                } else if (result.status === 'success') {
                    summary.push(`✅ **Parcel Found**`);
                    summary.push('');
                    summary.push(`## Parcel Information`);
                    summary.push('');
                    summary.push(`- **Name:** ${result.data.name}`);
                    if (result.data.coordinates.lat && result.data.coordinates.lon) {
                        summary.push(`- **Latitude:** ${result.data.coordinates.lat}`);
                        summary.push(`- **Longitude:** ${result.data.coordinates.lon}`);
                    }
                    if (result.data.coordinates.x && result.data.coordinates.y) {
                        summary.push(`- **X (ITM):** ${result.data.coordinates.x}`);
                        summary.push(`- **Y (ITM):** ${result.data.coordinates.y}`);
                    }
                    if (result.data.municipality) {
                        summary.push(`- **Municipality:** ${result.data.municipality}`);
                    }
                    if (result.data.district) {
                        summary.push(`- **District:** ${result.data.district}`);
                    }
                    summary.push('');
                }

                summary.push('---');
                summary.push('');
                summary.push('**Data Source:** GovMap / Land Registry');
                summary.push('**Note:** Cadastral data is official government records');

                return {
                    content: [{
                        type: 'text',
                        text: summary.join('\n')
                    }]
                };

            } catch (error) {
                return {
                    content: [{
                        type: 'text',
                        text: `❌ Error: ${error.message}`
                    }],
                    isError: true
                };
            }
        }
    );
}
