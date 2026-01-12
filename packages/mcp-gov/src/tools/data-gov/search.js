/**
 * כלי search_records - חיפוש records במשאב ספציפי עם תכונות מתקדמות
 */

import { z } from 'zod';
import { searchRecords } from '../../utils/api.js';
import { formatSearchResults, createErrorResponse } from '../../utils/formatters.js';
import { DEFAULT_LIMITS, EXAMPLE_RESOURCE_IDS } from '../../config/constants.js';
import { TROUBLESHOOTING, WORKING_EXAMPLES } from '../../lib/guidance.js';

/**
 * מפרמט תוצאות החיפוש עם הדרכות מפורטות
 * @param {Object} result - תוצאות החיפוש
 * @param {Object} searchParams - פרמטרי החיפוש שבוצע
 * @returns {Array} בלוקי תוכן מפורמטים
 */
function formatAdvancedSearchResults(result, searchParams) {
  const resultCount = result.records ? result.records.length : 0;
  const totalHint = result.total ? ` (${result.total} total matches)` : '';
  
  // תיאור החיפוש שבוצע
  const searchDescription = [];
  if (searchParams.q) searchDescription.push(`query: "${searchParams.q}"`);
  if (searchParams.filters) searchDescription.push(`filters: ${JSON.stringify(searchParams.filters)}`);
  if (searchParams.fields) searchDescription.push(`fields: [${searchParams.fields.join(', ')}]`);
  if (searchParams.sort) searchDescription.push(`sort: [${searchParams.sort.join(', ')}]`);
  if (searchParams.distinct) searchDescription.push(`distinct: ${searchParams.distinct}`);
  if (searchParams.limit !== 10) searchDescription.push(`limit: ${searchParams.limit}`);
  if (searchParams.offset > 0) searchDescription.push(`offset: ${searchParams.offset}`);

  const searchInfo = searchDescription.length > 0 ? ` with ${searchDescription.join(', ')}` : '';

  const mainContent = [
    `🎯 Found ${resultCount} records${totalHint}${searchInfo}`,
    '',
    '📊 Results:',
    JSON.stringify(result, null, 2)
  ].join('\n');

  const optimizationContent = [
    '💡 ADVANCED SEARCH TECHNIQUES:',
    '',
    '🔍 TEXT SEARCH (q parameter):',
    '• Cities: "תל אביב", "ירושלים", "חיפה"',
    '• Organizations: "בנק לאומי", "משרד הבריאות"',
    '• Partial matches: "בנק" will find all banks',
    '• Multiple words: "תל אביב בנק" searches for both terms',
    '',
    '🎯 EXACT FILTERS (filters parameter):',
    '• Single filter: {"City": "תל אביב"}',
    '• Multiple filters: {"City": "תל אביב", "Type": "סניף"}',
    '• Multiple values: {"City": ["תל אביב", "חיפה"]}',
    '• Numeric filters: {"Amount": {"$gte": 1000}}',
    '',
    '📊 FIELD SELECTION (fields parameter):',
    '• Basic: ["Name", "City", "Address"]',
    '• Performance tip: Request only needed fields to reduce response size',
    '• All fields: Omit the fields parameter',
    '',
    '📈 SORTING (sort parameter):',
    '• Ascending: ["Name asc", "City asc"]',
    '• Descending: ["Date desc", "Amount desc"]',
    '• Multiple sorts: ["City asc", "Name asc"]',
    '',
    '📄 PAGINATION (limit/offset):',
    '• First page: limit=20, offset=0',
    '• Second page: limit=20, offset=20',
    '• Large analysis: limit=1000 (max)',
    '• Use include_total=true for pagination planning',
    '',
    '🔢 UNIQUE VALUES (distinct parameter):',
    '• Get all cities: distinct="City"',
    '• Get all types: distinct="Type"',
    '• Returns only unique values, not full records',
    '',
    '⚡ PERFORMANCE OPTIMIZATION:',
    '• Use filters instead of q for exact matches (faster)',
    '• Request specific fields to reduce bandwidth',
    '• Use smaller limits for exploration (5-20)',
    '• Use larger limits for data analysis (100-1000)',
    '',
    '🎪 PRACTICAL EXAMPLES:',
    '• All banks in Tel Aviv: filters={"City": "תל אביב"}, q="בנק"',
    '• Recent records: sort=["Date desc"], limit=50',
    '• Geographic analysis: fields=["City", "Address"], distinct="City"',
    '• Financial data: fields=["Amount", "Date"], sort=["Amount desc"]'
  ].join('\n');

  return [mainContent, optimizationContent];
}

/**
 * רישום הכלי במערכת MCP
 * @param {McpServer} mcp - שרת MCP
 */
export function registerSearchRecordsTool(mcp) {
  mcp.tool(
    "search_records",
    {
      resource_id: z.string().describe("Resource UUID from list_resources. Get this ID from datastore_active=true resources. Example: '2202bada-4baf-45f5-aa61-8c5bad9646d3' for bank branches"),
      q: z.string().optional().describe("Free-text search across all fields. Supports Hebrew/English, partial matches, and multiple words. Examples: 'תל אביב', 'בנק לאומי', 'emergency'"),
      limit: z.number().default(DEFAULT_LIMITS.list).describe(`Number of results to return (1-${DEFAULT_LIMITS.max}). Use 5-10 for quick exploration, 20-50 for analysis, 100-1000 for comprehensive data extraction`),
      offset: z.number().default(0).describe("Skip first N results for pagination. Use with limit for paging: page 1: offset=0, page 2: offset=limit, page 3: offset=limit*2"),
      filters: z.record(z.any()).optional().describe("Exact field matches as JSON object. Supports single values, arrays, and operators. Examples: {\"City\": \"תל אביב\"}, {\"City\": [\"תל אביב\", \"חיפה\"]}, {\"Amount\": {\"\$gte\": 1000}}"),
      fields: z.array(z.string()).optional().describe("Return only specific fields to reduce response size and improve performance. Examples: [\"Name\", \"City\"], [\"Amount\", \"Date\", \"Type\"]"),
      sort: z.array(z.string()).optional().describe("Sort results by one or more fields. Format: [\"field_name asc/desc\"]. Examples: [\"Name asc\"], [\"Date desc\", \"Amount desc\"]"),
      include_total: z.boolean().optional().describe("Include total count of matching records in response. Essential for pagination planning and showing 'X of Y results'"),
      distinct: z.string().optional().describe("Return unique values for a specific field only (no full records). Useful for getting all possible values. Examples: 'City', 'Type', 'Status'")
    },
    async ({ resource_id, q, limit, offset, filters, fields, sort, include_total, distinct }) => {
      try {
        // בניית תיאור החיפוש לוג
        const searchParts = [];
        if (q) searchParts.push(`text: "${q}"`);
        if (filters) searchParts.push(`filters: ${JSON.stringify(filters)}`);
        if (fields) searchParts.push(`fields: ${fields.length} selected`);
        if (sort) searchParts.push(`sorted`);
        if (distinct) searchParts.push(`distinct: ${distinct}`);
        
        const searchDescription = searchParts.length > 0 ? ` (${searchParts.join(', ')})` : '';
        console.error(`🔍 Searching records in resource: ${resource_id}${searchDescription}...`);
        
        // בניית פרמטרי החיפוש
        const searchParams = {
          limit: limit || DEFAULT_LIMITS.list,
          offset: offset || 0
        };
        
        // הוספת פרמטרים אופציונליים
        if (q && q.trim()) {
          searchParams.q = q.trim();
        }
        
        if (filters) {
          searchParams.filters = filters;
        }
        
        if (fields && fields.length > 0) {
          searchParams.fields = fields;
        }
        
        if (sort && sort.length > 0) {
          searchParams.sort = sort;
        }
        
        if (include_total) {
          searchParams.include_total = include_total;
        }
        
        if (distinct && distinct.trim()) {
          searchParams.distinct = distinct.trim();
        }
        
        const response = await searchRecords(resource_id, searchParams);
        const result = response.result;
        
        const resultCount = result.records ? result.records.length : 0;
        const totalHint = result.total ? ` (${result.total} total)` : '';
        console.error(`✅ Found ${resultCount} records${totalHint} in resource '${resource_id}'`);
        
        // שימוש בפורמט המשופר
        const contentBlocks = formatAdvancedSearchResults(result, searchParams);
        
        return {
          content: contentBlocks.map(block => ({
            type: "text",
            text: block
          }))
        };
        
      } catch (error) {
        console.error(`❌ Error in search_records for resource ${resource_id}:`, error.message);
        
        // הוספת דוגמאות עבודה להודעת השגיאה
        const enhancedTroubleshooting = [
          ...TROUBLESHOOTING.search,
          '',
          '💡 WORKING EXAMPLES:',
          ...WORKING_EXAMPLES.search,
          '',
          '🔧 COMMON SOLUTIONS:',
          '• Check resource_id format (should be UUID like "2202bada-4baf-45f5-aa61-8c5bad9646d3")',
          '• Verify the resource has datastore_active=true',
          '• Try simpler search first: just resource_id and limit=5',
          '• Check field names in your filters match actual field names',
          '• For sort, use exact field names from the dataset'
        ];
        
        return createErrorResponse(
          `search_records in resource '${resource_id}'`,
          error,
          enhancedTroubleshooting
        );
      }
    }
  );
}
