/**
 * Israeli Courts Configuration
 * Court system structure and metadata
 */

export const COURTS = {
    supreme: {
        id: 'supreme',
        name: 'Supreme Court of Israel',
        nameHe: 'בית המשפט העליון',
        location: 'Jerusalem',
        address: 'Sha`arei Mishpat St, Jerusalem',
        website: 'https://elyon.court.gov.il',
        hasPublicData: true,
        type: 'appellate'
    },

    district: [
        {
            id: 'jerusalem-district',
            name: 'Jerusalem District Court',
            nameHe: 'בית משפט מחוזי ירושלים',
            location: '1 Salam Rd, Jerusalem',
            hasPublicData: true
        },
        {
            id: 'tel-aviv-district',
            name: 'Tel Aviv District Court',
            nameHe: 'בית משפט מחוזי תל אביב',
            location: 'Tel Aviv',
            hasPublicData: true
        },
        {
            id: 'haifa-district',
            name: 'Haifa District Court',
            nameHe: 'בית משפט מחוזי חיפה',
            location: 'Haifa',
            hasPublicData: true
        },
        {
            id: 'beer-sheva-district',
            name: 'Be`er Sheva District Court',
            nameHe: 'בית משפט מחוזי באר שבע',
            location: 'Be`er Sheva',
            hasPublicData: true
        },
        {
            id: 'nazareth-district',
            name: 'Nazareth District Court',
            nameHe: 'בית משפט מחוזי נצרת',
            location: 'Nazareth',
            hasPublicData: true
        },
        {
            id: 'central-district',
            name: 'Central District Court',
            nameHe: 'בית משפט מחוזי מרכז',
            location: 'Lod/Petah Tikva',
            hasPublicData: true
        }
    ],

    magistrate: {
        // Over 30 magistrate courts - can be added as needed
        note: 'Magistrate courts handle most first-instance cases',
        hasPublicData: 'limited'
    },

    religious: {
        rabbinical: {
            name: 'Rabbinical Courts',
            nameHe: 'בתי הדין הרבניים',
            jurisdiction: 'Jewish family law',
            hasPublicData: false,
            note: 'Statistics available; case details restricted'
        },
        sharia: {
            name: 'Sharia Courts',
            nameHe: 'בתי המשפט השרעיים',
            jurisdiction: 'Muslim family law',
            hasPublicData: false,
            note: 'Statistics available; case details restricted'
        },
        druze: {
            name: 'Druze Religious Courts',
            nameHe: 'בתי הדין הדרוזיים',
            jurisdiction: 'Druze family law',
            hasPublicData: false
        },
        christian: {
            name: 'Ecclesiastical Courts',
            nameHe: 'בתי המשפט הכנסייתיים',
            jurisdiction: 'Christian family law',
            hasPublicData: false
        }
    },

    specialized: {
        labor: {
            name: 'Labor Courts',
            nameHe: 'בתי הדין לעבודה',
            hasPublicData: true
        },
        administrative: {
            name: 'Administrative Courts',
            nameHe: 'בתי משפט לעניינים מנהליים',
            hasPublicData: true
        },
        military: {
            name: 'Military Courts',
            nameHe: 'בתי הדין הצבאיים',
            hasPublicData: false
        },
        traffic: {
            name: 'Traffic Courts',
            nameHe: 'בתי משפט לתעבורה',
            hasPublicData: 'limited'
        }
    }
};

/**
 * Legal disclaimers
 */
export const DISCLAIMERS = {
    general: `
**Legal Disclaimer:** This information is for general informational purposes only and does not constitute legal advice. For official legal information, case details, or legal representation, please consult with a licensed attorney or contact the appropriate court directly.
  `.trim(),

    privacy: `
**Privacy Note:** Individual case details require attorney authentication via Net HaMishpat (http://www.court.gov.il). This service provides only publicly available information and aggregated statistics.
  `.trim(),

    accuracy: `
**Accuracy Note:** Court information is periodically updated but may not reflect the most current data. Always verify with the official court before taking any action.
  `.trim()
};

/**
 * Get court by ID
 */
export function getCourtById(courtId) {
    if (courtId === 'supreme') return COURTS.supreme;

    const district = COURTS.district.find(c => c.id === courtId);
    if (district) return district;

    return null;
}

/**
 * Get all courts by type
 */
export function getCourtsByType(type) {
    switch (type) {
        case 'supreme':
            return [COURTS.supreme];
        case 'district':
            return COURTS.district;
        case 'magistrate':
            return COURTS.magistrate;
        case 'religious':
            return Object.values(COURTS.religious);
        case 'specialized':
            return Object.values(COURTS.specialized);
        default:
            return [];
    }
}
