/**
 * Police Statistics Tool
 * Get crime and traffic statistics from Israel Police via data.gov.il
 */

import { z } from 'zod';
import axios from 'axios';

const CKAN_BASE_URL = 'https://data.gov.il/api/3/action';
const USER_AGENT = 'MCP-Legal-Server/1.0';
const TIMEOUT = 15000;

// Known police datasets on data.gov.il
const POLICE_DATASETS = {
    crimes: {
        name: 'crime-statistics',
        description: 'סטטיסטיקת פשיעה - Criminal Statistics',
        searchTerms: ['משטרה', 'פשע', 'עבירות', 'police', 'crime']
    },
    traffic: {
        name: 'traffic-violations',
        description: 'עבירות תנועה - Traffic Violations',
        searchTerms: ['תעבורה', 'דוחות', 'traffic', 'violations']
    },
    accidents: {
        name: 'traffic-accidents',
        description: 'תאונות דרכים - Traffic Accidents',
        searchTerms: ['תאונות', 'דרכים', 'accidents']
    }
};

/**
 * Search for police datasets on data.gov.il
 */
async function searchPoliceDatasets(category) {
    const config = POLICE_DATASETS[category];
    if (!config) {
        throw new Error(`Unknown category: ${category}. Available: ${Object.keys(POLICE_DATASETS).join(', ')}`);
    }

    try {
        const searchQuery = config.searchTerms.join(' OR ');
        const response = await axios.get(`${CKAN_BASE_URL}/package_search`, {
            params: {
                q: searchQuery,
                rows: 10
            },
            timeout: TIMEOUT,
            headers: { 'User-Agent': USER_AGENT }
        });

        if (!response.data.success) {
            throw new Error('CKAN API returned error');
        }

        return response.data.result;
    } catch (error) {
        console.error(`Error searching police datasets:`, error.message);
        throw error;
    }
}

/**
 * Get police statistics from a specific resource
 */
async function getPoliceStatistics(resourceId, limit = 100, filters = {}) {
    try {
        const params = {
            resource_id: resourceId,
            limit
        };

        if (Object.keys(filters).length > 0) {
            params.filters = JSON.stringify(filters);
        }

        const response = await axios.get(`${CKAN_BASE_URL}/datastore_search`, {
            params,
            timeout: TIMEOUT,
            headers: { 'User-Agent': USER_AGENT }
        });

        if (!response.data.success) {
            throw new Error('CKAN datastore search failed');
        }

        return response.data.result;
    } catch (error) {
        console.error(`Error fetching police statistics:`, error.message);
        throw error;
    }
}

/**
 * Format police statistics response
 */
function formatPoliceStatistics(category, datasets, records = null) {
    const lines = [
        `🚔 **Israel Police Data - ${POLICE_DATASETS[category]?.description || category}**`,
        '',
        `## Available Datasets`,
        ''
    ];

    if (datasets && datasets.results) {
        datasets.results.forEach((ds, i) => {
            lines.push(`### ${i + 1}. ${ds.title}`);
            lines.push(`- **ID:** ${ds.name}`);
            lines.push(`- **Organization:** ${ds.organization?.title || 'Israel Police'}`);
            lines.push(`- **Last Updated:** ${ds.metadata_modified ? new Date(ds.metadata_modified).toLocaleDateString() : 'Unknown'}`);

            if (ds.resources && ds.resources.length > 0) {
                const activeResources = ds.resources.filter(r => r.datastore_active);
                if (activeResources.length > 0) {
                    lines.push(`- **Searchable Resources:** ${activeResources.length}`);
                    activeResources.slice(0, 3).forEach(r => {
                        lines.push(`  - \`${r.id}\` - ${r.name || r.format}`);
                    });
                }
            }
            lines.push('');
        });
    }

    if (records) {
        lines.push('## Sample Data');
        lines.push('');
        lines.push('```json');
        lines.push(JSON.stringify(records.records?.slice(0, 5), null, 2));
        lines.push('```');
        lines.push('');
        lines.push(`*Showing ${Math.min(5, records.records?.length || 0)} of ${records.total || 0} records*`);
    }

    lines.push('');
    lines.push('---');
    lines.push('');
    lines.push('💡 **Next Steps:**');
    lines.push('- Use `search_records` with resource_id to query specific data');
    lines.push('- Use `find_datasets` with "משטרה" or "police" for more datasets');
    lines.push('');
    lines.push('⚠️ **Note:** Individual case data is not publicly available');

    return lines.join('\n');
}

/**
 * Register the get_police_statistics tool with MCP server
 */
export function registerGetPoliceStatisticsTool(server) {
    server.tool(
        'get_police_statistics',
        {
            category: z.enum(['crimes', 'traffic', 'accidents', 'all'])
                .default('all')
                .describe('Category of police data: crimes, traffic, accidents, or all'),
            resource_id: z.string().optional()
                .describe('Specific resource ID to fetch data from (optional)'),
            limit: z.number().default(20)
                .describe('Number of records to fetch if resource_id provided'),
            year: z.number().optional()
                .describe('Filter by year (if supported by dataset)')
        },
        async ({ category, resource_id, limit, year }) => {
            try {
                console.error(`🚔 Fetching police statistics: ${category}`);

                let result;

                if (resource_id) {
                    // Fetch specific resource data
                    const filters = year ? { year: year.toString() } : {};
                    const records = await getPoliceStatistics(resource_id, limit, filters);
                    result = formatPoliceStatistics(category, null, records);
                } else {
                    // Search for datasets in category
                    const categoriesToSearch = category === 'all'
                        ? Object.keys(POLICE_DATASETS)
                        : [category];

                    const allResults = { results: [] };

                    for (const cat of categoriesToSearch) {
                        try {
                            const datasets = await searchPoliceDatasets(cat);
                            allResults.results.push(...datasets.results);
                        } catch (e) {
                            console.error(`Error searching ${cat}:`, e.message);
                        }
                    }

                    // Remove duplicates
                    const seen = new Set();
                    allResults.results = allResults.results.filter(ds => {
                        if (seen.has(ds.name)) return false;
                        seen.add(ds.name);
                        return true;
                    });

                    result = formatPoliceStatistics(category, allResults);
                }

                console.error(`✅ Police statistics retrieved`);

                return {
                    content: [{
                        type: 'text',
                        text: result
                    }]
                };

            } catch (error) {
                console.error(`❌ Error in get_police_statistics:`, error.message);
                return {
                    content: [{
                        type: 'text',
                        text: [
                            `❌ **Error fetching police statistics**`,
                            '',
                            `Error: ${error.message}`,
                            '',
                            '💡 **Troubleshooting:**',
                            '- Check your internet connection',
                            '- Try searching with `find_datasets("משטרה")`',
                            '- Use category: crimes, traffic, or accidents'
                        ].join('\n')
                    }],
                    isError: true
                };
            }
        }
    );
}

/**
 * Register tool to get fine types and payment info
 */
export function registerGetFinesInfoTool(server) {
    server.tool(
        'get_fines_info',
        {
            fine_type: z.enum(['traffic', 'parking', 'court', 'all'])
                .default('all')
                .describe('Type of fine information'),
            info_type: z.enum(['payment', 'appeal', 'types', 'all'])
                .default('all')
                .describe('Type of information requested')
        },
        async ({ fine_type, info_type }) => {
            console.error(`💰 Getting fines info: ${fine_type} / ${info_type}`);

            const content = [
                `💰 **Israeli Fines Information - ${fine_type}**`,
                '',
                '## Payment Methods',
                '',
                '### 🚗 Traffic Fines (Police)',
                '- **Online:** [gov.il Traffic Fines](https://www.gov.il/he/service/paying_traffic_fines)',
                '- **Phone:** *5765 (Israel Police)',
                '- **Post Office:** Any branch with payment services',
                '',
                '### 🅿️ Parking Fines (Municipal)',
                '- **Tel Aviv:** [irparking.co.il](https://www.irparking.co.il)',
                '- **Jerusalem:** [jerusalem.muni.il](https://www.jerusalem.muni.il)',
                '- **Haifa:** [haifa.muni.il](https://www.haifa.muni.il)',
                '- Most cities have online payment portals',
                '',
                '### ⚖️ Court Fines',
                '- **Online:** [govextra.gov.il](https://govextra.gov.il)',
                '- **Court Office:** At the issuing court',
                '',
                '## Appeal Process',
                '',
                '### Traffic Fines',
                '1. Appeal within 30 days of receiving fine',
                '2. Submit via [gov.il](https://www.gov.il/he/service/appeal_traffic_report)',
                '3. Attach supporting documents',
                '',
                '### Parking Fines',
                '1. Appeal to municipal court within 30 days',
                '2. Submit online or in person',
                '',
                '## Fine Types Reference',
                '',
                '| Category | Examples | Authority |',
                '|----------|----------|-----------|',
                '| Traffic | Speeding, Red Light | Police |',
                '| Parking | Illegal Parking, Meter | Municipality |',
                '| Court | Contempt, Violations | Courts |',
                '',
                '---',
                '',
                '⚠️ **Note:** Specific fine amounts and personal fines cannot be queried via API.',
                'Use official government portals for personal fine information.'
            ];

            return {
                content: [{
                    type: 'text',
                    text: content.join('\n')
                }]
            };
        }
    );
}
