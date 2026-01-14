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
import axios from 'axios';

// Featured Dataset IDs (Hardcoded from exploration)
const FEATURED_DATASETS = {
    'trains_feature': {
        title: 'Israel Railways Quarterly',
        id: '712399a9-839c-4cb0-affc-687251785f7c',
        limit: 15
    },
    'flights_feature': {
        title: 'Ben Gurion Airport Flights',
        id: 'e83f76a5-5273-4437-9ca8-2e449bd3932e',
        limit: 15
    },
    'vehicles_feature': {
        title: 'Private Vehicles by Model',
        id: '053cea08-09bc-40ec-8f7a-156f06871add',
        limit: 15
    }
};

/**
 * Get transport statistics
 * @param {string} category - Category of statistics
 * @param {number} year - Year for statistics
 * @returns {Object} Statistics data
 */
export async function getTransportStatistics(category = 'all', year = null) {
    console.error(`📊 Fetching transport statistics: ${category}${year ? ` (${year})` : ''}`);

    // === FEATURED DEEP DIVE ===
    if (FEATURED_DATASETS[category]) {
        try {
            const config = FEATURED_DATASETS[category];
            const resourceUrl = `https://data.gov.il/api/3/action/datastore_search?resource_id=${config.id}&limit=${config.limit}`;

            console.error(`⬇️ Fetching deep dive data from: ${resourceUrl}`);
            const response = await axios.get(resourceUrl);

            if (!response.data.success) {
                throw new Error('CKAN Datastore API Failed');
            }

            const records = response.data.result.records;
            const fields = response.data.result.fields.map(f => f.id);

            return {
                isDeepDive: true,
                title: config.title,
                records: records,
                fields: fields,
                total: response.data.result.total
            };

        } catch (error) {
            console.error('❌ Data fetch failed:', error.message);
            // Fallback to normal search if deep dive fails
        }
    }

    // === NORMAL SEARCH ===
    try {
        // Search for transport-related datasets
        const searchQuery = {
            q: category === 'all' ? 'transport OR תחבורה' : `${category} transport`,
            rows: 100,
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
                resourceCount: dataset.num_resources || 0,
                resources: dataset.resources ? dataset.resources.map(r => ({
                    id: r.id,
                    format: r.format,
                    name: r.name || 'Resource'
                })) : []
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
            category: z.enum(['all', 'roads', 'public-transport', 'railways', 'ports', 'aviation', 'trains_feature', 'flights_feature', 'vehicles_feature'])
                .optional().describe('Category of statistics (default: all)'),
            year: z.number().min(2000).max(new Date().getFullYear()).optional()
                .describe('Year for statistics'),
            resource_id: z.string().optional().describe('Specific Resource ID to deep dive/preview'),
            limit: z.number().optional().describe('Limit rows for preview'),
            offset: z.number().optional().describe('Offset rows for preview')
        },
        async ({ category, year, resource_id, limit = 100, offset = 0 }) => {
            try {
                // === UNIVERSAL DEEP DIVE ===
                if (resource_id) {
                    try {
                        const resourceUrl = `https://data.gov.il/api/3/action/datastore_search?resource_id=${resource_id}&limit=${limit}&offset=${offset}`;

                        console.error(`⬇️ Fetching universal deep dive data from: ${resourceUrl}`);
                        const response = await axios.get(resourceUrl);

                        if (!response.data.success) {
                            throw new Error('CKAN Datastore API Failed');
                        }

                        const records = response.data.result.records;
                        const fields = response.data.result.fields.map(f => f.id);
                        const total = response.data.result.total;

                        const header = `| ${fields.join(' | ')} |`;
                        const separator = `| ${fields.map(() => '---').join(' | ')} |`;
                        const rows = records.map(row =>
                            `| ${fields.map(f => row[f]).join(' | ')} |`
                        ).join('\n');

                        const markdown = `
# 🔬 Universal Preview (Rows ${offset} - ${offset + records.length} of ${total})
**Resource ID:** \`${resource_id}\`

${header}
${separator}
${rows}

*Source: data.gov.il API*
`;
                        // Return structured data for frontend pagination
                        return {
                            content: [{ type: 'text', text: markdown }],
                            _meta: {
                                total: total,
                                limit: limit,
                                offset: offset,
                                count: records.length,
                                resource_id: resource_id
                            }
                        };

                    } catch (error) {
                        // If Datastore fails, it might be a binary file (ZIP, PDF)
                        // Try to construct a download link
                        const downloadUrl = `https://data.gov.il/resource/${resource_id}/download`;

                        return {
                            content: [{
                                type: 'text',
                                text: `
### 📁 File Preview Not Available
This resource appears to be a binary file (ZIP, PDF, etc.) or is not indexed in the DataStore.

[📥 Download File](${downloadUrl})

*Resource ID: ${resource_id}*
`
                            }],
                            isError: false // Not technically an error, just non-previewable
                        };
                    }
                }

                const result = await getTransportStatistics(category || 'all', year);

                // ... (rest of the function for normal listing) ...

                // ... Existing logic for Featured Deep Dive (Legacy) ...
                if (result.isDeepDive) {
                    const header = `| ${result.fields.join(' | ')} |`;
                    const separator = `| ${result.fields.map(() => '---').join(' | ')} |`;
                    const rows = result.records.map(row =>
                        `| ${result.fields.map(f => row[f]).join(' | ')} |`
                    ).join('\n');

                    const markdown = `
# 🔬 Deep Dive: ${result.title}
*Showing top ${result.records.length} records from ${result.total} total*

${header}
${separator}
${rows}

*Source: data.gov.il API*
`;
                    return { content: [{ type: 'text', text: markdown }] };
                }

                // === RENDER LIST ===
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
                    // Expose resource ID for the frontend to pick up if possible, 
                    // though usually frontend invokes tool directly.
                    if (dataset.resources && dataset.resources.length > 0) {
                        summary.push(`- **Resources:**`);
                        dataset.resources.forEach(r => {
                            summary.push(`  - [${r.format}] ${r.name} (ID: ${r.id})`);
                        });
                    }
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
