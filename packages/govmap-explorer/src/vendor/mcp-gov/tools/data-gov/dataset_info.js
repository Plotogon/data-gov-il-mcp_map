/**
 * כלי get_dataset_info - קבלת מידע מפורט על dataset ספציפי
 */

import { z } from 'zod';
import { ckanRequest } from '../../utils/api.js';
import { createErrorResponse } from '../../utils/formatters.js';
import { POPULAR_DATASETS } from '../../config/constants.js';

/**
 * מפרמט מידע מפורט על dataset
 * @param {Object} dataset - נתוני הdataset מ-CKAN
 * @returns {Array} בלוקי תוכן מפורמטים
 */
function formatDatasetInfo(dataset) {
  const resources = dataset.resources || [];
  const activeResources = resources.filter(r => r.datastore_active);
  
  // מידע בסיסי
  const basicInfo = [
    `📊 Dataset: ${dataset.name || dataset.id}`,
    '',
    `📝 Title: ${dataset.title || 'N/A'}`,
    `🏢 Organization: ${dataset.organization?.title || dataset.organization?.name || 'N/A'}`,
    `📅 Created: ${dataset.metadata_created ? new Date(dataset.metadata_created).toLocaleDateString() : 'N/A'}`,
    `🔄 Last Modified: ${dataset.metadata_modified ? new Date(dataset.metadata_modified).toLocaleDateString() : 'N/A'}`,
    `👀 Views: ${dataset.num_views || 0}`,
    `⭐ Tags: ${dataset.tags?.map(t => t.name).join(', ') || 'No tags'}`,
    '',
    `💾 Total Resources: ${resources.length}`,
    `🎯 Searchable Resources: ${activeResources.length}`,
    '',
    `📄 Description:`,
    dataset.notes || 'No description available'
  ].join('\n');

  // מידע על resources
  const resourcesInfo = [
    '📁 RESOURCES SUMMARY:',
    '',
    activeResources.length > 0 ? '✅ Searchable Resources (datastore_active=true):' : '❌ No searchable resources found',
    ...activeResources.map(r => [
      `• ${r.name || 'Unnamed Resource'}`,
      `  📋 ID: ${r.id}`,
      `  📄 Format: ${r.format || 'Unknown'}`,
      `  📊 Size: ${r.size ? `${Math.round(r.size / 1024)} KB` : 'Unknown'}`,
      `  🔄 Updated: ${r.last_modified ? new Date(r.last_modified).toLocaleDateString() : 'Unknown'}`
    ]).flat(),
    '',
    resources.length > activeResources.length ? `⚠️ ${resources.length - activeResources.length} additional resources (not searchable with datastore)` : ''
  ].filter(line => line !== '').join('\n');

  // הדרכות שימוש
  const usageGuidance = [
    '💡 NEXT STEPS:',
    '',
    activeResources.length > 0 ? '🎯 Ready for data search! Use these resource IDs:' : '❌ No data search available for this dataset',
    ...activeResources.slice(0, 3).map(r => `• search_records with resource_id="${r.id}"`),
    activeResources.length > 3 ? `• ... and ${activeResources.length - 3} more resources` : '',
    '',
    '🔍 ANALYSIS SUGGESTIONS:',
    '• Start with small limit (5-10) to understand data structure',
    '• Use distinct parameter to see all possible field values',
    '• Check field names before applying filters',
    '• Consider using fields parameter for large datasets',
    '',
    '📈 DATASET QUALITY INDICATORS:',
    `• Freshness: ${dataset.metadata_modified ? `Updated ${new Date(dataset.metadata_modified).toLocaleDateString()}` : 'Unknown update date'}`,
    `• Popularity: ${dataset.num_views || 0} views`,
    `• Data Quality: ${activeResources.length > 0 ? 'Good (searchable data available)' : 'Limited (no searchable data)'}`,
    `• Organization: ${dataset.organization?.title || 'Unknown organization'}`
  ].filter(line => line !== '').join('\n');

  return [basicInfo, resourcesInfo, usageGuidance];
}

/**
 * רישום הכלי במערכת MCP
 * @param {McpServer} mcp - שרת MCP
 */
export function registerGetDatasetInfoTool(mcp) {
  mcp.tool(
    "get_dataset_info",
    {
      dataset: z.string().describe("Dataset ID or name to get detailed information about. Examples: 'branches', 'jerusalem-municipality-budget', 'mechir-lamishtaken'")
    },
    async ({ dataset }) => {
      try {
        console.error(`📊 Getting detailed info for dataset: ${dataset}...`);
        
        // קריאה ל-package_show API לקבלת מידע מפורט
        const response = await ckanRequest('package_show', { id: dataset });
        const datasetInfo = response.result;
        
        console.error(`✅ Retrieved detailed info for dataset '${dataset}'`);
        
        const contentBlocks = formatDatasetInfo(datasetInfo);
        
        return {
          content: contentBlocks.map(block => ({
            type: "text",
            text: block
          }))
        };
        
      } catch (error) {
        console.error(`❌ Error in get_dataset_info for dataset ${dataset}:`, error.message);
        
        return createErrorResponse(
          `get_dataset_info for dataset '${dataset}'`,
          error,
          [
            'Check if dataset name is correct',
            'Use find_datasets to search for similar datasets',
            'Some datasets may use Hebrew names',
            `Popular working datasets: ${POPULAR_DATASETS.join(', ')}`,
            'Dataset names are case-sensitive'
          ]
        );
      }
    }
  );
}
