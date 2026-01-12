/**
 * Court Information Tool
 * Get information about Israeli courts
 */

import { z } from 'zod';
import { getCourtById, getCourtsByType, DISCLAIMERS } from '../../config/courts.js';

/**
 * Get court information
 * @param {string} courtType - Type of court
 * @param {string} courtId - Specific court ID (optional)
 * @returns {Object} Court information
 */
export async function getCourtInfo(courtType, courtId = null) {
    console.error(`⚖️ Fetching court info: ${courtType}${courtId ? ` (${courtId})` : ''}`);

    let courts = [];

    if (courtId) {
        const court = getCourtById(courtId);
        if (court) {
            courts = [court];
        }
    } else {
        courts = getCourtsByType(courtType);
    }

    if (courts.length === 0) {
        throw new Error(`No courts found for type: ${courtType}`);
    }

    const result = {
        courtType,
        count: courts.length,
        courts: courts.map(court => ({
            id: court.id,
            name: court.name,
            nameHe: court.nameHe,
            location: court.location,
            address: court.address || 'Contact court for address',
            website: court.website || 'https://www.court.gov.il',
            hasPublicData: court.hasPublicData || false,
            jurisdiction: court.jurisdiction || null,
            note: court.note || null
        }))
    };

    console.error(`✅ Found ${result.count} court(s)`);
    return result;
}

/**
 * Register the get_court_info tool with MCP server
 */
export function registerGetCourtInfoTool(server) {
    server.tool(
        'get_court_info',
        {
            court_type: z.enum(['supreme', 'district', 'magistrate', 'religious', 'specialized'])
                .describe('Type of court to query'),
            court_id: z.string().optional()
                .describe('Specific court ID (e.g., "tel-aviv-district")')
        },
        async ({ court_type, court_id }) => {
            try {
                const result = await getCourtInfo(court_type, court_id);

                const summary = [
                    `⚖️ **Israeli Court Information**`,
                    ``,
                    `**Court Type:** ${result.courtType}`,
                    `**Courts Found:** ${result.count}`,
                    ``,
                    `## Courts`,
                    ``
                ];

                result.courts.forEach((court, i) => {
                    summary.push(`### ${i + 1}. ${court.name} (${court.nameHe})`);
                    if (court.location) {
                        summary.push(`- **Location:** ${court.location}`);
                    }
                    if (court.address) {
                        summary.push(`- **Address:** ${court.address}`);
                    }
                    if (court.website) {
                        summary.push(`- **Website:** ${court.website}`);
                    }
                    if (court.jurisdiction) {
                        summary.push(`- **Jurisdiction:** ${court.jurisdiction}`);
                    }
                    if (court.note) {
                        summary.push(`- **Note:** ${court.note}`);
                    }
                    summary.push(`- **Public Data Available:** ${court.hasPublicData ? '✅ Yes' : '❌ No (restricted)'}`);
                    summary.push('');
                });

                // Add disclaimers
                summary.push('---');
                summary.push('');
                summary.push(DISCLAIMERS.general);
                summary.push('');
                summary.push(DISCLAIMERS.privacy);

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
