import { z } from 'zod';
import { geocodeAddress } from '../../utils/govmap-api.js';

/**
 * Register the autocomplete tool with MCP server
 */
export function registerAutocompleteTool(server) {
    server.tool(
        'autocomplete',
        {
            query: z.string().describe('Partial address or term to search'),
        },
        async ({ query }) => {
            try {
                const result = await geocodeAddress(query);

                // Return raw results as JSON string for easy parsing by UI/Clients
                // This is specifically designed for the Explorer App or structured data needs
                return {
                    content: [{
                        type: 'text',
                        text: JSON.stringify(result.results || [])
                    }]
                };

            } catch (error) {
                return {
                    content: [{
                        type: 'text',
                        text: JSON.stringify([])
                    }],
                    isError: true
                };
            }
        }
    );
}
