/**
 * GovMap API Utility
 * Client for Israeli geospatial services
 */

import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
import { GOVMAP_CONFIG } from '../config/govmap.js';

const MAX_RETRIES = 3;
const RETRY_DELAY = 1000;

async function withRetry(operation, name) {
    let lastError;
    for (let i = 0; i < MAX_RETRIES; i++) {
        try {
            return await operation();
        } catch (error) {
            lastError = error;
            console.error(`⚠️ ${name} failed (attempt ${i + 1}/${MAX_RETRIES}): ${error.message}`);
            if (i < MAX_RETRIES - 1) {
                await new Promise(resolve => setTimeout(resolve, RETRY_DELAY * (i + 1)));
            }
        }
    }
    throw lastError;
}

/**
 * Make GET request to GovMap API
 * @param {string} endpoint - API endpoint
 * @param {Object} params - Query parameters
 * @returns {Promise<Object>} API response
 */
export async function govmapRequest(endpoint, params = {}) {
    console.error(`🗺️ GovMap GET: ${endpoint}`);

    try {
        const url = `${GOVMAP_CONFIG.baseUrl}${endpoint}`;

        const response = await withRetry(() => axios.get(url, {
            params,
            timeout: GOVMAP_CONFIG.timeout,
            headers: {
                'Accept': 'application/json',
                'Accept-Language': GOVMAP_CONFIG.defaultLanguage
            }
        }), `GET ${endpoint}`);

        console.error(`✅ GovMap response received`);
        return response.data;

    } catch (error) {
        console.error(`❌ GovMap API error:`, error.message);
        throw error;
    }
}

/**
 * Make POST request to GovMap API
 * @param {string} endpoint - API endpoint
 * @param {Object} data - Request body data
 * @returns {Promise<Object>} API response
 */
export async function govmapPostRequest(endpoint, data = {}) {
    console.error(`🗺️ GovMap POST: ${endpoint}`);

    try {
        const url = `${GOVMAP_CONFIG.baseUrl}${endpoint}`;

        const response = await withRetry(() => axios.post(url, data, {
            timeout: GOVMAP_CONFIG.timeout,
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'Accept-Language': GOVMAP_CONFIG.defaultLanguage,
                'Referer': 'https://www.govmap.gov.il/',
                'Origin': 'https://www.govmap.gov.il',
                'User-Agent': GOVMAP_CONFIG.userAgent
            }
        }), `POST ${endpoint}`);

        // Write debug log to file for inspection
        try {
            const logPath = path.resolve(__dirname, '../../../debug_response.json');
            fs.writeFileSync(logPath, JSON.stringify(response.data, null, 2));
            console.error(`📝 Wrote response to ${logPath}`);
        } catch (err) {
            console.error('❌ Failed to write debug log:', err);
        }

        // Debug logging
        console.error(`DEBUG RESPONSE for ${endpoint}:`, JSON.stringify(response.data)?.substring(0, 100));

        console.error(`✅ GovMap response received`);
        return response.data;

    } catch (error) {
        console.error(`❌ GovMap API error:`, error.message);
        throw error;
    }
}

function parseWKT(wkt) {
    if (!wkt) return null;
    const match = wkt.match(/POINT\s*\(([\d.]+)\s+([\d.]+)\)/);
    if (match) {
        const x = parseFloat(match[1]);
        const y = parseFloat(match[2]);
        // Convert Web Mercator (EPSG:3857) to WGS84
        const rMajor = 6378137;
        const shift = Math.PI * rMajor;
        const lon = x / shift * 180.0;
        let lat = y / shift * 180.0;
        lat = 180.0 / Math.PI * (2.0 * Math.atan(Math.exp(lat * Math.PI / 180.0)) - Math.PI / 2.0);
        return { x, y, lat, lon, system: 'WGS84' };
    }
    return null;
}

/**
 * Geocode an address
 * @param {string} address - Address to geocode
 * @returns {Promise<Object>} Coordinates and metadata
 */
export async function geocodeAddress(address) {
    console.error(`📍 Geocoding: ${address}`);

    try {
        // Call GovMap autocomplete API
        const response = await govmapPostRequest(GOVMAP_CONFIG.api.autocomplete, {
            searchText: address, // CHANGED: query -> searchText
            limit: 10
            // Removed type: 0 to allow finding Cities, Streets, etc.
        });

        const data = response || {};
        const items = Array.isArray(data) ? data : (data.results || []);

        if (items.length === 0) {
            return {
                status: 'no_results',
                query: address,
                results: [],
                message: 'No results found for this address'
            };
        }

        // Parse results and extract coordinates
        const results = items
            // Accept any result that has coordinates, irrespective of type (address, street, poi, etc.)
            .filter(item => item.shape || (item.x && item.y))
            .map(item => {
                const coords = parseWKT(item.shape) || (item.x && item.y ? { x: item.x, y: item.y, lat: item.lat, lon: item.lon, system: item.lat ? 'WGS84' : 'ITM' } : null);
                return {
                    address: item.name || item.text,
                    coordinates: coords || { system: 'unknown' },
                    confidence: item.score ? item.score / 1000 : 1.0, // Normalize score roughly
                    source: 'GovMap',
                    type: item.type,
                    id: item.id
                };
            });

        return {
            status: 'success',
            query: address,
            results: results
        };

    } catch (error) {
        console.error(`❌ Geocoding error:`, error.message);
        return {
            status: 'error',
            query: address,
            error: error.message,
            results: []
        };
    }
}

/**
 * Reverse geocode coordinates
 * @param {number} lat - Latitude
 * @param {number} lon - Longitude
 * @returns {Promise<Object>} Address and metadata
 */
export async function reverseGeocode(lat, lon) {
    console.error(`📍 Reverse geocoding: ${lat}, ${lon}`);

    // Placeholder implementation
    return {
        status: 'placeholder',
        coordinates: { lat, lon },
        address: 'Address lookup requires GovMap API integration',
        note: 'This is placeholder data'
    };
}

/**
 * Search cadastral parcels (Gush/Helka)
 * @param {number} gush - Block number
 * @param {number} helka - Parcel number (optional)
 * @returns {Promise<Object>} Parcel information
 */
export async function searchCadastral(gush, helka = null) {
    console.error(`🏘️ Cadastral search: Gush ${gush}${helka ? `, Helka ${helka}` : ''}`);

    try {
        // Search for parcel using "גוש X חלקה Y" format
        const searchQuery = helka
            ? `גוש ${gush} חלקה ${helka}`
            : `גוש ${gush}`;

        const response = await govmapPostRequest(GOVMAP_CONFIG.api.autocomplete, {
            searchText: searchQuery,
            limit: 5
            // Removed specific type restriction to ensure parcels are found
        });

        const data = response || {};
        const items = Array.isArray(data) ? data : (data.results || []);

        if (items.length === 0) {
            return {
                status: 'not_found',
                gush,
                helka,
                message: 'Cadastral parcel not found'
            };
        }

        // Find the parcel result
        const parcelResult = items.find(item =>
            item.type === 'parcel' || item.type === 'PARCEL' ||
            (item.name && (item.name.includes('גוש') || item.name.includes('חלקה')))
        ) || items[0];

        const coords = parseWKT(parcelResult.shape);

        return {
            status: 'success',
            gush,
            helka,
            data: {
                name: parcelResult.name || parcelResult.text,
                coordinates: coords || {},
                type: parcelResult.type,
                id: parcelResult.id,
                municipality: parcelResult.municipality,
                district: parcelResult.district
            }
        };

    } catch (error) {
        console.error(`❌ Cadastral search error:`, error.message);
        return {
            status: 'error',
            gush,
            helka,
            error: error.message
        };
    }
}
