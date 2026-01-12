/**
 * Test API Endpoint Tool
 * Directly tests if an API endpoint is accessible
 */

import axios from 'axios';
import { z } from 'zod';

/**
 * Test an API endpoint
 * @param {string} url - API endpoint URL
 * @param {string} method - HTTP method
 * @returns {Object} Test results
 */
export async function testApiEndpoint(url, method = 'GET') {
    console.error(`🧪 Testing API endpoint: ${url} (${method})`);

    try {
        const response = await axios({
            method,
            url,
            timeout: 10000,
            headers: {
                'User-Agent': 'MCP-Discovery/1.0 (API Test)',
                'Accept': 'application/json, text/plain, */*'
            },
            validateStatus: () => true // Accept any status code
        });

        const result = {
            url,
            method,
            status: response.status,
            statusText: response.statusText,
            accessible: response.status < 400,
            contentType: response.headers['content-type'],
            dataPreview: null
        };

        // Try to parse response
        if (response.data) {
            if (typeof response.data === 'object') {
                result.dataPreview = JSON.stringify(response.data, null, 2).substring(0, 500);
            } else {
                result.dataPreview = String(response.data).substring(0, 500);
            }
        }

        console.error(`✅ Endpoint ${result.accessible ? 'accessible' : 'not accessible'}: ${response.status}`);
        return result;

    } catch (error) {
        console.error(`❌ Error testing endpoint:`, error.message);
        return {
            url,
            method,
            accessible: false,
            error: error.message
        };
    }
}

/**
 * Register the test_api_endpoint tool with MCP server
 */
export function registerTestApiEndpointTool(server) {
    server.tool(
        'test_api_endpoint',
        {
            url: z.string().url().describe('API endpoint URL to test'),
            method: z.enum(['GET', 'POST', 'PUT', 'DELETE', 'HEAD']).optional()
                .describe('HTTP method (default: GET)')
        },
        async ({ url, method }) => {
            try {
                const result = await testApiEndpoint(url, method || 'GET');

                const summary = [
                    `🧪 API Endpoint Test: ${url}`,
                    '',
                    `**Status:** ${result.status} ${result.statusText || ''}`,
                    `**Accessible:** ${result.accessible ? '✅ Yes' : '❌ No'}`,
                    result.contentType ? `**Content-Type:** ${result.contentType}` : '',
                    '',
                    result.dataPreview ? '**Data Preview:**' : '',
                    result.dataPreview ? '```' : '',
                    result.dataPreview || '',
                    result.dataPreview ? '```' : '',
                    result.error ? `**Error:** ${result.error}` : ''
                ].filter(line => line !== '').join('\n');

                return {
                    content: [{
                        type: 'text',
                        text: summary
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
