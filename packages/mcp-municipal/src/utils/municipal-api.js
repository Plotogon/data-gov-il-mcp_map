/**
 * Municipal API Utility
 * Handles requests to city CKAN APIs
 */

import axios from 'axios';
import { getCityConfig } from '../config/cities.js';

/**
 * Make request to city CKAN API
 * @param {string} cityId - City identifier
 * @param {string} action - CKAN action
 * @param {Object} params - Query parameters
 * @returns {Promise<Object>} API response
 */
export async function ckanCityRequest(cityId, action, params = {}) {
    const city = getCityConfig(cityId);

    if (!city) {
        throw new Error(`Unknown city: ${cityId}`);
    }

    if (!city.api || city.api.type !== 'ckan') {
        throw new Error(`City ${city.name} does not have CKAN API`);
    }

    console.error(`📡 ${city.name} API: ${action}`);

    try {
        const url = `${city.api.base}${action}`;

        const response = await axios.get(url, {
            params,
            timeout: 15000,
            headers: {
                'User-Agent': 'MCP-Municipal/1.0',
                'Accept': 'application/json'
            }
        });

        if (!response.data || !response.data.success) {
            throw new Error('API returned unsuccessful response');
        }

        console.error(`✅ ${city.name} API response received`);
        return response.data;

    } catch (error) {
        console.error(`❌ ${city.name} API error:`, error.message);
        throw new Error(`Failed to fetch data from ${city.name}: ${error.message}`);
    }
}

/**
 * Search datasets in city CKAN
 * @param {string} cityId - City identifier
 * @param {string} query - Search query
 * @param {number} rows - Number of results
 * @returns {Promise<Object>} Search results
 */
export async function searchCityDatasets(cityId, query, rows = 10) {
    return await ckanCityRequest(cityId, 'package_search', {
        q: query,
        rows
    });
}

/**
 * Get dataset details
 * @param {string} cityId - City identifier
 * @param {string} datasetId - Dataset ID
 * @returns {Promise<Object>} Dataset details
 */
export async function getCityDataset(cityId, datasetId) {
    return await ckanCityRequest(cityId, 'package_show', {
        id: datasetId
    });
}

/**
 * Search within dataset records
 * @param {string} cityId - City identifier
 * @param {string} resourceId - Resource ID
 * @param {Object} filters - Search filters
 * @returns {Promise<Object>} Search results
 */
export async function searchDatasetRecords(cityId, resourceId, filters = {}) {
    const params = {
        resource_id: resourceId,
        ...filters
    };

    return await ckanCityRequest(cityId, 'datastore_search', params);
}
