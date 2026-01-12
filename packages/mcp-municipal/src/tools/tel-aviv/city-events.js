/**
 * City Events Tool
 * Get municipal events and activities
 */

import { z } from 'zod';
import { searchCityDatasets } from '../../utils/municipal-api.js';
import { getCityConfig } from '../../config/cities.js';

/**
 * Get city events
 * @param {string} city - City ID
 * @param {string} category - Event category
 * @returns {Object} Events data
 */
export async function getCityEvents(city, category = null) {
    console.error(`📅 Fetching events for ${city}${category ? ` (${category})` : ''}`);

    const cityConfig = getCityConfig(city);
    if (!cityConfig || cityConfig.api.type !== 'ckan') {
        return {
            city: cityConfig?.name || city,
            error: 'City does not have searchable event data',
            events: []
        };
    }

    try {
        // Search for event-related datasets
        const searchQuery = category
            ? `events ${category} אירועים`
            : 'events אירועים פעילות';

        const response = await searchCityDatasets(city, searchQuery, 5);
        const datasets = response.result.results || [];

        const result = {
            city: cityConfig.name,
            cityHe: cityConfig.nameHe,
            category,
            datasetsFound: datasets.length,
            datasets: datasets.map(ds => ({
                name: ds.name,
                title: ds.title,
                description: ds.notes ? ds.notes.substring(0, 200) : '',
                organization: ds.organization?.title || 'Unknown',
                resourceCount: ds.num_resources || 0,
                url: `${cityConfig.api.base.replace('/api/3/action/', '')}/dataset/${ds.name}`
            }))
        };

        console.error(`✅ Found ${result.datasetsFound} event datasets`);
        return result;

    } catch (error) {
        console.error(`❌ Error fetching events:`, error.message);
        throw error;
    }
}

/**
 * Register the get_city_events tool with MCP server
 */
export function registerGetCityEventsTool(server) {
    server.tool(
        'get_city_events',
        {
            city: z.enum(['tel-aviv', 'jerusalem', 'haifa'])
                .describe('City to query'),
            category: z.enum(['culture', 'sports', 'education', 'community'])
                .optional().describe('Event category filter')
        },
        async ({ city, category }) => {
            try {
                const result = await getCityEvents(city, category);

                if (result.error) {
                    return {
                        content: [{
                            type: 'text',
                            text: `❌ ${result.error}\n\nCity ${result.city} does not currently support event queries.`
                        }],
                        isError: true
                    };
                }

                const summary = [
                    `📅 **City Events: ${result.city} (${result.cityHe})**`,
                    ``,
                    result.category ? `**Category:** ${result.category}` : '',
                    `**Event Datasets Found:** ${result.datasetsFound}`,
                    ``,
                    result.datasetsFound > 0 ? `## Datasets` : 'No event datasets found.',
                    ``
                ].filter(line => line !== '');

                result.datasets.forEach((ds, i) => {
                    summary.push(`### ${i + 1}. ${ds.title}`);
                    summary.push(`- **Organization:** ${ds.organization}`);
                    summary.push(`- **Resources:** ${ds.resourceCount}`);
                    if (ds.description) {
                        summary.push(`- **Description:** ${ds.description}...`);
                    }
                    summary.push(`- **URL:** ${ds.url}`);
                    summary.push('');
                });

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
