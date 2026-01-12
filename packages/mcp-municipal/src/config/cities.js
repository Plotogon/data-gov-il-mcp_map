/**
 * Israeli Cities Configuration
 * Metadata and API endpoints for municipal data
 */

export const CITIES = {
    'tel-aviv': {
        id: 'tel-aviv',
        name: 'Tel Aviv-Yafo',
        nameHe: 'תל אביב-יפו',
        api: {
            base: 'https://opendata.tel-aviv.gov.il/api/3/action/',
            type: 'ckan'
        },
        features: ['search', 'parking', 'decisions', 'events', 'planning'],
        population: 460000,
        enabled: true
    },

    'jerusalem': {
        id: 'jerusalem',
        name: 'Jerusalem',
        nameHe: 'ירושלים',
        api: {
            base: null, // No CKAN API available
            type: 'manual'
        },
        features: ['decisions', 'planning', 'services'],
        population: 936000,
        enabled: true
    },

    'haifa': {
        id: 'haifa',
        name: 'Haifa',
        nameHe: 'חיפה',
        api: {
            base: null,
            type: 'basic'
        },
        features: ['services', 'events'],
        population: 285000,
        enabled: false // Limited data available
    }
};

/**
 * Data categories across cities
 */
export const CATEGORIES = {
    transport: { nameHe: 'תחבורה', nameEn: 'Transport' },
    environment: { nameHe: 'איכות סביבה', nameEn: 'Environment' },
    culture: { nameHe: 'תרבות', nameEn: 'Culture' },
    services: { nameHe: 'שירותים', nameEn: 'Services' },
    planning: { nameHe: 'תכנון ובניה', nameEn: 'Planning' },
    education: { nameHe: 'חינוך', nameEn: 'Education' },
    health: { nameHe: 'בריאות', nameEn: 'Health' }
};

/**
 * Get city configuration
 */
export function getCityConfig(cityId) {
    return CITIES[cityId];
}

/**
 * Get all enabled cities
 */
export function getEnabledCities() {
    return Object.values(CITIES).filter(city => city.enabled);
}

/**
 * Get cities with specific feature
 */
export function getCitiesWithFeature(feature) {
    return Object.values(CITIES).filter(city =>
        city.enabled && city.features.includes(feature)
    );
}
