/**
 * Transport Statistics Tool
 * Access national transport statistics from data.gov.il
 */

import { z } from 'zod';
import { ckanRequest } from '../../utils/api.js';

/**
 * Get transport statistics
 * @param {string} category - Category of statistics
 * @param {number} year - Year for statistics
 * @returns {Object} Statistics data
 */
export async function getTransportStatistics(category = 'all', year = null) {
    console.error(`📊 Fetching transport statistics: ${category}${year ? ` (${year})` : ''}`);

    try {
        // Search for transport-related datasets
        const searchQuery = {
            q: category === 'all' ? 'transport OR תחבורה' : `${category} transport`,
            rows: 20,
            sort: 'metadata_modified desc'
        };

        const response = await ckanRequest('package_search', searchQuery);

        const results = {
            category,
            year,
            totalFound: response.result.count,
            datasets: []
        };

        // Filter and format results
        if (response.result.results) {
            results.datasets = response.result.results.map(dataset => ({
                name: dataset.name,
                title: dataset.title,
                organization: dataset.organization?.title || 'Unknown',
                lastModified: dataset.metadata_modified,
                url: `https://data.gov.il/dataset/${dataset.name}`,
                resourceCount: dataset.num_resources || 0
            }));
        }

        console.error(`✅ Found ${results.datasets.length} transport datasets`);
        return results;

    } catch (error) {
        console.error(`❌ Error fetching transport statistics:`, error.message);
        throw error;
    }
}

/**
 * Register the transport_statistics tool with MCP server
 */
export function registerTransportStatisticsTool(server) {
    server.tool(
        'transport_statistics',
        {
            category: z.enum(['all', 'roads', 'public-transport', 'railways', 'ports', 'aviation'])
                .optional().describe('Category of statistics (default: all)'),
            year: z.number().min(2000).max(new Date().getFullYear()).optional()
                .describe('Year for statistics')
        },
        async ({ category, year }) => {
            try {
                const result = await getTransportStatistics(category || 'all', year);

                const summary = [
                    `📊 **Transport Statistics**`,
                    ``,
                    `**Category:** ${result.category}`,
                    result.year ? `**Year:** ${result.year}` : '',
                    `**Total Found:** ${result.totalFound} datasets`,
                    `**Showing:** ${result.datasets.length} most recent`,
                    ``,
                    `## Datasets`,
                    ``
                ].filter(line => line !== '');

                result.datasets.forEach((dataset, index) => {
                    summary.push(`### ${index + 1}. ${dataset.title}`);
                    summary.push(`- **Organization:** ${dataset.organization}`);
                    summary.push(`- **Resources:** ${dataset.resourceCount}`);
                    summary.push(`- **Last Modified:** ${dataset.lastModified.split('T')[0]}`);
                    summary.push(`- **URL:** ${dataset.url}`);
                    summary.push('');
                });

                if (result.datasets.length === 0) {
                    summary.push(`No datasets found for category "${result.category}"`);
                }

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
