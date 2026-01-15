/**
 * הדרכות ועזרה למשתמשים - מעודכן עם כלי התגיות (ללא tags parameter)
 */

import { EXAMPLE_RESOURCE_IDS, COMMON_KEYWORDS, POPULAR_ORGANIZATIONS } from '../config/constants.js';

/**
 * הצעות לפתרון בעיות נפוצות
 */
export const TROUBLESHOOTING = {
  datasets: [
    'Check if dataset name is correct (use find_datasets to search, or list_all_datasets if you need everything)',
    'Some datasets use Hebrew names',
    'Popular working datasets: branches, mechir-lamishtaken',
    '💡 NEW: Use list_available_tags to discover topic keywords for searching'
  ],
  
  organizations: [
    'Check if organization name is correct (use list_organizations to see all)',
    'Organization names are usually in English and lowercase',
    'Try variations like "ministry-of-health" or "health"'
  ],
  
  search: [
    'Verify resource_id is correct (get from list_resources)',
    'Check if resource has datastore_active=true',
    'Try simpler query first (no filters/fields)',
    'Some resources may be temporarily unavailable'
  ],
  
  api: [
    'Try again in a moment - the government API might be temporarily unavailable',
    'Check internet connection',
    'Verify CKAN endpoint is accessible'
  ],

  tags: [
    'Use list_available_tags() to see all available topic keywords',
    'Use search_tags("keyword") to find relevant topic names',
    'Topic names are case-sensitive - use exact spelling',
    'Try both Hebrew and English versions if available'
  ]
};

/**
 * דוגמאות עבודה למשתמשים
 */
export const WORKING_EXAMPLES = {
  search: [
    `Bank branches: '${EXAMPLE_RESOURCE_IDS.bankBranches}'`,
    `Air quality stations: '${EXAMPLE_RESOURCE_IDS.airStations}'`,
    `Contaminated land: '${EXAMPLE_RESOURCE_IDS.contaminatedLand}'`,
    'Try search with q="תל אביב" and limit=5'
  ],
  
  queries: [
    'Cities: "תל אביב", "ירושלים", "חיפה"',
    'Organizations: "בנק לאומי", "משרד הבריאות"',
    'Dates: "2023", "2024-01"'
  ],
  
  organizations: [
    'ministry-of-health → Health ministry datasets',
    'tel-aviv-yafo → Tel Aviv municipal data', 
    'cbs → Central Bureau of Statistics',
    'jerusalem → Jerusalem municipality'
  ],

  tags: [
    'Popular topics: "תחבורה", "סביבה", "אוצר וכלכלה"',
    'By category: list_available_tags(category="transportation")',
    'Search: search_tags("בנק") → finds banking related topics',
    'Topic search: find_datasets("תחבורה") → transportation datasets'
  ]
};

/**
 * טיפים לביצועים
 */
export const PERFORMANCE_TIPS = [
  "Use 'fields' parameter to get only needed columns",
  "Use 'limit' 5-20 for quick exploration",
  "Use 'filters' for exact matches (faster than 'q')",
  "Include 'include_total' for pagination planning",
  "💡 NEW: Use topic keywords for more precise searches"
];

/**
 * הצעות לניתוח נתונים
 */
export const ANALYSIS_SUGGESTIONS = [
  "For statistics: use 'distinct' to count unique values",
  "For large datasets: start with small limit, then increase",
  "For geographic data: filter by City/Region first",
  "For financial data: sort by Amount/Date fields",
  "💡 NEW: Start with list_available_tags to discover relevant data themes"
];

/**
 * קונטקסטים סמנטיים לשימוש בכלים
 */
export const SEMANTIC_CONTEXTS = [
  'Government transparency and open data analysis',
  'Municipal budget tracking and spending analysis',
  'Business intelligence on Israeli market data',
  'Demographics and population studies',
  'Infrastructure and transportation planning',
  'Financial services mapping and analysis',
  'Topic-based data discovery and exploration'
];

/**
 * זרימת עבודה מומלצת מעודכנת
 */
export const RECOMMENDED_WORKFLOW = [
  '🚀 RECOMMENDED WORKFLOW (UPDATED):',
  '1. 🏷️ START with list_available_tags to discover relevant topics',
  '2. 🔍 Use find_datasets("topic-name") with discovered topic names',
  '3. 🏛️ OPTIONAL: Use list_organizations to explore by government body',
  '4. 📊 Use get_dataset_info for detailed dataset analysis',
  '5. 📋 Use list_resources on interesting datasets', 
  '6. 🎯 Use search_records to get actual data',
  '7. ⚠️ Only use list_all_datasets if you need the complete list (expensive API call!)'
];

/**
 * זרימות עבודה חדשות עם תגיות
 */
export const TAG_WORKFLOWS = [
  '🏷️ TOPIC-BASED WORKFLOWS:',
  '',
  '🎯 Topic Discovery:',
  '• list_available_tags() → see all available topics',
  '• list_available_tags(category="transportation") → specific domain',
  '• find_datasets("תחבורה") → datasets in that domain',
  '',
  '🔍 Keyword to Topics:',
  '• search_tags("בנק") → find banking-related topics',
  '• find_datasets("discovered-topic") → get relevant datasets',
  '',
  '⚡ Efficient Search:',
  '• list_available_tags(format="suggestions") → themed recommendations',
  '• find_datasets("topic-keyword") → precise results'
];

/**
 * יוצר הודעת עזרה מותאמת אישית
 * @param {string} context - הקשר (datasets, resources, search, organizations, tags)
 * @param {Object} options - אפשרויות נוספות
 * @returns {string} הודעת עזרה מפורמטת
 */
export function createHelpMessage(context, options = {}) {
  switch (context) {
    case 'datasets':
      return [
        '💡 USAGE GUIDE:',
        '🆕 UPDATED: Start with list_available_tags for topic discovery!',
        '• list_available_tags() → discover relevant topics and keywords',
        '• find_datasets("topic-name") → precise topic-based search',
        '• Look for datasets related to: budgets, demographics, transportation, municipalities',
        `• Common Hebrew keywords: ${COMMON_KEYWORDS.hebrew.join(', ')}`,
        '• Next step: Use list_resources with interesting dataset names',
        "• Pro tip: Many datasets have English equivalents (look for '_en' suffix)",
        '',
        ...RECOMMENDED_WORKFLOW
      ].join('\n');
      
    case 'organizations':
      return [
        '🏛️ ORGANIZATION GUIDE:',
        '• Use list_organizations to see all government bodies',
        '• Use get_organization_info for detailed organization analysis',
        '• Organization names are usually lowercase English',
        `• Popular organizations: ${POPULAR_ORGANIZATIONS.join(', ')}`,
        '',
        '💡 WORKFLOW:',
        '1. list_organizations → see all available organizations',
        '2. get_organization_info("org-name") → detailed info',
        '3. find_datasets → search for organization-specific datasets',
        '4. Continue with regular dataset workflow'
      ].join('\n');
      
    case 'resources':
      return [
        '💡 NEXT STEPS:',
        '• Copy a resource_id from datastore_active=true resources',
        '• Use search_records with that resource_id',
        '• Look for CSV/XLSX formats - they\'re usually most complete',
        '• Hebrew resources often have English equivalents',
        '',
        '🔍 SEARCH TIPS:',
        '• Fields vary by dataset - check the data structure first',
        '• Common fields: Name, City, Address, Date, Amount',
        '• Use include_tracking=true to see update frequency'
      ].join('\n');
      
    case 'search':
      return [
        '💡 SEARCH OPTIMIZATION:',
        '',
        '🔍 QUERY PATTERNS THAT WORK WELL:',
        ...WORKING_EXAMPLES.queries.map(tip => `• ${tip}`),
        '',
        '⚡ PERFORMANCE TIPS:',
        ...PERFORMANCE_TIPS.map(tip => `• ${tip}`),
        '',
        '📈 ANALYSIS SUGGESTIONS:',
        ...ANALYSIS_SUGGESTIONS.map(tip => `• ${tip}`),
        '',
        '🎪 SEMANTIC CONTEXTS FOR THIS TOOL:',
        ...SEMANTIC_CONTEXTS.map(context => `• ${context}`)
      ].join('\n');

    case 'tags':
      return [
        '🏷️ TOPIC DISCOVERY GUIDE:',
        '',
        '🎯 DISCOVERY WORKFLOW:',
        '• list_available_tags() → see all categories and popular topics',
        '• list_available_tags(category="transportation") → specific domain topics',
        '• search_tags("keyword") → find topics by Hebrew/English keyword',
        '',
        '📊 TOPIC CATEGORIES AVAILABLE:',
        '• government (ממשל): תקציב, אוצר וכלכלה, משפט',
        '• transportation (תחבורה): תחבורה ציבורית, רכבת, אוטובוסים',
        '• environment (סביבה): מים, זיהום אוויר, פסולת',
        '• health (בריאות): בריאות ורווחה, משרד הבריאות',
        '• organizations (ארגונים): משרדי ממשלה ורשויות',
        '',
        '💡 USAGE EXAMPLES:',
        ...WORKING_EXAMPLES.tags.map(tip => `• ${tip}`),
        '',
        ...TAG_WORKFLOWS
      ].join('\n');
      
    default:
      return [
        '🆕 UPDATED WORKFLOW - Start with topic discovery!',
        '',
        'Use list_available_tags to discover topics, find_datasets("topic") for search, list_organizations to explore by government body, or search_records to extract data.',
        '',
        ...RECOMMENDED_WORKFLOW
      ].join('\n');
  }
}