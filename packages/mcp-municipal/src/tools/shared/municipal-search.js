/**
 * City Data Search Tool
 * Search municipal datasets across Israeli cities
 */

import { z } from 'zod';
import { searchCityDatasets } from '../../utils/municipal-api.js';
import { getEnabledCities, getCityConfig } from '../../config/cities.js';

/**
 * Search city datasets
 * @param {string} city - City ID or 'all'
 * @param {string} query - Search query
 * @param {string} category - Optional category filter
 * @returns {Object} Search results
 */
export async function searchCityData(city, query, category = null) {
    console.error(`🔍 Searching ${city === 'all' ? 'all cities' : city} for: "${query}"`);

    const results = {
        query,
        category,
        cities: {},
        totalFound: 0
    };

    const citiesToSearch = city === 'all'
        ? getEnabledCities().filter(c => c.api.type === 'ckan')
        : [getCityConfig(city)].filter(c => c && c.api.type === 'ckan');

    if (citiesToSearch.length === 0) {
        throw new Error(`No cities with searchable data available`);
    }

    for (const cityConfig of citiesToSearch) {
        try {
            const response = await searchCityDatasets(cityConfig.id, query, 10);
            const datasets = response.result.results || [];

            results.cities[cityConfig.id] = {
                name: cityConfig.name,
                nameHe: cityConfig.nameHe,
                count: response.result.count || 0,
                datasets: datasets.map(ds => ({
                    name: ds.name,
                    title: ds.title,
                    organization: ds.organization?.title || 'Unknown',
                    resourceCount: ds.num_resources || 0,
                    lastModified: ds.metadata_modified
                }))
            };

            results.totalFound += results.cities[cityConfig.id].count;

        } catch (error) {
            console.error(`Failed to search ${cityConfig.name}:`, error.message);
            results.cities[cityConfig.id] = {
                name: cityConfig.name,
                nameHe: cityConfig.nameHe,
                error: error.message,
                count: 0,
                datasets: []
            };
        }
    }

    console.error(`✅ Search complete: ${results.totalFound} total datasets found`);
    return results;
}

/**
 * Register the search_city_data tool with MCP server
 */
export function registerSearchCityDataTool(server) {
    server.tool(
        'search_city_data',
        {
            city: z.enum(['tel-aviv', 'jerusalem', 'haifa', 'all'])
                .describe('City to search (tel-aviv, jerusalem, haifa, or all)'),
            query: z.string().describe('Search query (Hebrew or English)'),
            category: z.enum(['transport', 'environment', 'culture', 'services', 'planning', 'education', 'health'])
                .optional().describe('Optional category filter')
        },
        async ({ city, query, category }) => {
            try {
                const result = await searchCityData(city, query, category);

                const summary = [
                    `🏙️ **Municipal Data Search**`,
                    ``,
                    `**Query:** "${result.query}"`,
                    `**Cities:** ${city}`,
                    result.category ? `**Category:** ${result.category}` : '',
                    `**Total Found:** ${result.totalFound} datasets`,
                    ``,
                    `## Results by City`,
                    ``
                ].filter(line => line !== '');

                for (const [cityId, cityData] of Object.entries(result.cities)) {
                    summary.push(`### ${cityData.name} (${cityData.nameHe})`);

                    if (cityData.error) {
                        summary.push(`❌ Error: ${cityData.error}`);
                        summary.push('');
                        continue;
                    }

                    summary.push(`**Datasets Found:** ${cityData.count}`);
                    summary.push('');

                    if (cityData.datasets.length > 0) {
                        cityData.datasets.forEach((ds, i) => {
                            summary.push(`#### ${i + 1}. ${ds.title}`);
                            summary.push(`- **ID:** ${ds.name}`);
                            summary.push(`- **Organization:** ${ds.organization}`);
                            summary.push(`- **Resources:** ${ds.resourceCount}`);
                            summary.push(`- **Last Modified:** ${ds.lastModified.split('T')[0]}`);
                            summary.push('');
                        });
                    }
                }

                if (result.totalFound === 0) {
                    summary.push('No datasets found. Try different search terms or categories.');
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
