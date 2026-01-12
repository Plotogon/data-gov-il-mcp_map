/**
 * Legal Statistics Tool
 * Aggregated, anonymized judicial statistics
 */

import { z } from 'zod';
import { DISCLAIMERS } from '../../config/courts.js';

/**
 * Get court statistics
 * Note: This is a placeholder - real implementation would fetch from data.gov.il
 * @param {string} category - Statistics category
 * @param {number} year - Year for statistics
 * @returns {Object} Statistics data
 */
export async function getCourtStatistics(category, year = null) {
    console.error(`📊 Fetching court statistics: ${category}${year ? ` (${year})` : ''}`);

    // This would normally fetch from data.gov.il judicial datasets
    // For now, returning structure with sample/placeholder data

    const currentYear = new Date().getFullYear();
    const statsYear = year || currentYear - 1; // Default to previous year

    const result = {
        category,
        year: statsYear,
        source: 'Ministry of Justice / data.gov.il',
        note: 'Aggregated and anonymized data',
        statistics: {}
    };

    switch (category) {
        case 'cases-filed':
            result.statistics = {
                description: 'New cases filed in Israeli courts',
                totalCases: 'Data available on data.gov.il',
                byCourtType: {
                    district: 'See government statistics',
                    magistrate: 'See government statistics',
                    specialized: 'See government statistics'
                },
                note: 'Search data.gov.il for "court statistics" or "משפט סטטיסטיקה"'
            };
            break;

        case 'cases-resolved':
            result.statistics = {
                description: 'Cases resolved/closed',
                totalResolved: 'Data available on data.gov.il',
                resolutionRate: 'See judicial reports',
                note: 'Annual reports published by Courts Administration'
            };
            break;

        case 'duration':
            result.statistics = {
                description: 'Average case duration',
                averageDays: 'Data available in annual reports',
                byCourtType: 'Varies by court level and case type',
                note: 'Statistics published annually by Ministry of Justice'
            };
            break;

        case 'appeals':
            result.statistics = {
                description: 'Appeal statistics',
                totalAppeals: 'Data available on data.gov.il',
                successRate: 'See Supreme Court reports',
                note: 'Supreme Court publishes annual statistics'
            };
            break;

        default:
            result.statistics = {
                message: 'Category not found'
            };
    }

    console.error(`✅ Statistics retrieved for ${category}`);
    return result;
}

/**
 * Register the get_court_statistics tool with MCP server
 */
export function registerGetCourtStatisticsTool(server) {
    server.tool(
        'get_court_statistics',
        {
            category: z.enum(['cases-filed', 'cases-resolved', 'duration', 'appeals'])
                .describe('Type of statistics to retrieve'),
            year: z.number().min(2000).max(new Date().getFullYear()).optional()
                .describe('Year for statistics (default: previous year)')
        },
        async ({ category, year }) => {
            try {
                const result = await getCourtStatistics(category, year);

                const summary = [
                    `📊 **Israeli Court Statistics**`,
                    ``,
                    `**Category:** ${result.category}`,
                    `**Year:** ${result.year}`,
                    `**Source:** ${result.source}`,
                    result.note ? `**Note:** ${result.note}` : '',
                    ``,
                    `## Statistics`,
                    ``
                ];

                if (result.statistics.description) {
                    summary.push(`**Description:** ${result.statistics.description}`);
                    summary.push('');
                }

                // Format statistics
                for (const [key, value] of Object.entries(result.statistics)) {
                    if (key === 'description') continue;

                    if (typeof value === 'object') {
                        summary.push(`**${key}:**`);
                        for (const [subKey, subValue] of Object.entries(value)) {
                            summary.push(`  - ${subKey}: ${subValue}`);
                        }
                    } else {
                        summary.push(`**${key}:** ${value}`);
                    }
                    summary.push('');
                }

                // Add data source info
                summary.push('---');
                summary.push('');
                summary.push('**Where to find detailed statistics:**');
                summary.push('- Search data.gov.il for "court statistics" or "סטטיסטיקה משפטית"');
                summary.push('- Ministry of Justice annual reports');
                summary.push('- Courts Administration publications');
                summary.push('- Supreme Court annual statistics');
                summary.push('');
                summary.push(DISCLAIMERS.accuracy);

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
