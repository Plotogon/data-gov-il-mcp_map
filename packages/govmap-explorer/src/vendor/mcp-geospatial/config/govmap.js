/**
 * GovMap Configuration
 * Israeli geospatial data portal
 */

export const GOVMAP_CONFIG = {
    baseUrl: 'https://www.govmap.gov.il',

    // Real API endpoints discovered via browser investigation
    api: {
        // Search service - autocomplete and geocoding
        autocomplete: '/api/search-service/autocomplete',
        searchTypes: '/api/search-service/getTypes',

        // Cadastral/parcel endpoints
        parcelSearch: '/api/layers-catalog/apps/parcel-search/address',

        // Layers catalog
        baseLayers: '/api/layers-catalog/baseLayers',
        catalog: '/api/layers-catalog/catalog',

        // User management (requires authentication)
        userMe: '/api/users-management/me',
        userRefresh: '/api/users-management/refresh'
    },

    timeout: 15000,
    userAgent: 'MCP-Geospatial/1.0',

    // Default language for requests
    defaultLanguage: 'he'
};

/**
 * Coordinate systems used in Israel
 */
export const COORDINATE_SYSTEMS = {
    ITM: {
        code: 'EPSG:2039',
        name: 'Israel Transverse Mercator',
        description: 'Official Israeli coordinate system'
    },
    WGS84: {
        code: 'EPSG:4326',
        name: 'WGS 84',
        description: 'Global GPS coordinate system (lat/lon)'
    }
};

/**
 * Common map layers available on GovMap
 */
export const MAP_LAYERS = {
    cadastral: {
        name: 'Cadastral Parcels',
        nameHe: 'גושים וחלקות',
        type: 'vector'
    },
    planning: {
        name: 'Planning Schemes',
        nameHe: 'תכניות',
        type: 'vector'
    },
    ortho: {
        name: 'Orthophoto',
        nameHe: 'צילום אוויר',
        type: 'raster'
    },
    infrastructure: {
        name: 'Infrastructure',
        nameHe: 'תשתיות',
        type: 'vector'
    },
    administrative: {
        name: 'Administrative Boundaries',
        nameHe: 'גבולות מנהליים',
        type: 'vector'
    }
};

/**
 * Data source information
 */
export const DATA_SOURCES = {
    govmap: {
        name: 'GovMap',
        nameHe: 'מפות ישראל',
        url: 'https://www.govmap.gov.il',
        description: 'Official Israeli geospatial portal'
    },
    surveyOfIsrael: {
        name: 'Survey of Israel',
        nameHe: 'מרכז למיפוי ישראל',
        description: 'National mapping agency'
    },
    landRegistry: {
        name: 'Land Registry',
        nameHe: 'רשם המקרקעין',
        description: 'Cadastral and land ownership data'
    }
};
