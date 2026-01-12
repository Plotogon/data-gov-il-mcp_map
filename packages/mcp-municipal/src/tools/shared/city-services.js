/**
 * City Services Tool
 * Municipal services information
 */

import { z } from 'zod';
import { searchCityDatasets } from '../../utils/municipal-api.js';
import { getCityConfig } from '../../config/cities.js';

/**
 * Get city services info
 * @param {string} city - City ID
 * @param {string} serviceType - Service type
 * @returns {Object} Services data
 */
export async function getCityServices(city, serviceType = null) {
    console.error(`🏢 Fetching services for ${city}${serviceType ? ` (${serviceType})` : ''}`);

    const cityConfig = getCityConfig(city);
    if (!cityConfig) {
        throw new Error(`Unknown city: ${city}`);
    }

    // For cities without CKAN API, return basic info
    if (cityConfig.api.type !== 'ckan') {
        return {
            city: cityConfig.name,
            cityHe: cityConfig.nameHe,
            serviceType,
            message: 'Basic service information available',
            services: [
                {
                    type: 'general',
                    name: 'Municipal Website',
                    info: `Visit ${cityConfig.name} municipality website for service information`
                }
            ]
        };
    }

    try {
        // Search for service-related datasets
        const serviceQueries = {
            waste: 'waste garbage אשפה פסולת',
            water: 'water מים',
            education: 'education חינוך',
            health: 'health בריאות',
            all: 'services שירותים'
        };

        const searchQuery = serviceQueries[serviceType] || serviceQueries.all;
        const response = await searchCityDatasets(city, searchQuery, 5);
        const datasets = response.result.results || [];

        const result = {
            city: cityConfig.name,
            cityHe: cityConfig.nameHe,
            serviceType,
            datasetsFound: datasets.length,
            datasets: datasets.map(ds => ({
                name: ds.name,
                title: ds.title,
                description: ds.notes ? ds.notes.substring(0, 200) : '',
                organization: ds.organization?.title || 'Unknown',
                resourceCount: ds.num_resources || 0
            }))
        };

        console.error(`✅ Found ${result.datasetsFound} service datasets`);
        return result;

    } catch (error) {
        console.error(`❌ Error fetching services:`, error.message);
        throw error;
    }
}

/**
 * Register the get_city_services tool with MCP server
 */
export function registerGetCityServicesTool(server) {
    server.tool(
        'get_city_services',
        {
            city: z.enum(['tel-aviv', 'jerusalem', 'haifa'])
                .describe('City to query'),
            service_type: z.enum(['waste', 'water', 'education', 'health', 'all'])
                .optional().describe('Service type filter')
        },
        async ({ city, service_type }) => {
            try {
                const result = await getCityServices(city, service_type || 'all');

                const summary = [
                    `🏢 **City Services: ${result.city} (${result.cityHe})**`,
                    ``,
                    result.serviceType ? `**Service Type:** ${result.serviceType}` : '',
                    result.message ? `**Note:** ${result.message}` : '',
                    result.datasetsFound !== undefined ? `**Service Datasets Found:** ${result.datasetsFound}` : '',
                    ``,
                    result.datasetsFound > 0 ? `## Available Data` : ''
                ].filter(line => line !== '');

                if (result.services && result.services.length > 0) {
                    result.services.forEach(svc => {
                        summary.push(`**${svc.name}**`);
                        summary.push(svc.info);
                        summary.push('');
                    });
                }

                if (result.datasets && result.datasets.length > 0) {
                    result.datasets.forEach((ds, i) => {
                        summary.push(`### ${i + 1}. ${ds.title}`);
                        summary.push(`- **Organization:** ${ds.organization}`);
                        summary.push(`- **Resources:** ${ds.resourceCount}`);
                        if (ds.description) {
                            summary.push(`- **Description:** ${ds.description}...`);
                        }
                        summary.push('');
                    });
                }

                if (!result.services && result.datasetsFound === 0) {
                    summary.push('No service data found for this query.');
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
