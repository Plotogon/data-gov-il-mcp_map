/**
 * Geocoding Tool
 * Convert addresses to coordinates (Israeli geospatial data)
 */

import { z } from 'zod';
import { geocodeAddress } from '../../utils/govmap-api.js';

/**
 * Register the geocode_address tool with MCP server
 */
export function registerGeocodeTool(server) {
    server.tool(
        'geocode_address',
        {
            address: z.string().describe('Address to geocode (Hebrew or English). Example: "רוטשילד 1 תל אביב"'),
            city: z.string().optional().describe('City name for better accuracy (optional)')
        },
        async ({ address, city }) => {
            try {
                const fullAddress = city ? `${address}, ${city}` : address;
                const result = await geocodeAddress(fullAddress);

                const summary = [
                    `📍 **Geocoding Result**`,
                    ``,
                    `**Query:** ${result.query}`,
                    ``
                ];

                if (result.status === 'error') {
                    summary.push(`❌ **Error:** ${result.error}`);
                } else if (result.status === 'no_results') {
                    summary.push(`⚠️ **No Results Found**`);
                    summary.push(`\nTry a different search term or check spelling.`);
                } else if (result.results && result.results.length > 0) {
                    summary.push(`✅ **Found ${result.results.length} result(s)**`);
                    summary.push('');
                    summary.push(`## Results`);
                    summary.push('');

                    result.results.forEach((res, i) => {
                        summary.push(`### Result ${i + 1}`);
                        summary.push(`- **Address:** ${res.address}`);
                        if (res.coordinates.lat && res.coordinates.lon) {
                            summary.push(`- **Latitude:** ${res.coordinates.lat}`);
                            summary.push(`- **Longitude:** ${res.coordinates.lon}`);
                        }
                        if (res.coordinates.x && res.coordinates.y) {
                            summary.push(`- **X (ITM):** ${res.coordinates.x}`);
                            summary.push(`- **Y (ITM):** ${res.coordinates.y}`);
                        }
                        summary.push(`- **Coordinate System:** ${res.coordinates.system}`);
                        if (res.confidence) {
                            summary.push(`- **Confidence:** ${(res.confidence * 100).toFixed(0)}%`);
                        }
                        summary.push('');
                    });
                }

                summary.push('---');
                summary.push('');
                summary.push('**Data Source:** GovMap (govmap.gov.il)');

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
