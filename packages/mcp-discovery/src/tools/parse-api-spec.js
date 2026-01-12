/**
 * API Specification Parser
 * Parses Swagger/OpenAPI and WSDL specifications
 */

import SwaggerParser from 'swagger-parser';
import axios from 'axios';
import { z } from 'zod';

/**
 * Parse API specification
 * @param {string} specUrl - URL to API spec
 * @param {string} specType - Type: swagger | openapi | wsdl | auto-detect
 * @returns {Object} Parsed specification
 */
export async function parseApiSpec(specUrl, specType = 'auto-detect') {
    console.error(`📄 Parsing API spec: ${specUrl} (type: ${specType})`);

    try {
        // Auto-detect or parse based on type
        if (specType === 'swagger' || specType === 'openapi' || specType === 'auto-detect') {
            return await parseSwagger(specUrl);
        } else if (specType === 'wsdl') {
            return await parseWSDL(specUrl);
        } else {
            throw new Error(`Unsupported spec type: ${specType}`);
        }

    } catch (error) {
        console.error(`❌ Error parsing spec:`, error.message);
        throw error;
    }
}

/**
 * Parse Swagger/OpenAPI specification
 */
async function parseSwagger(specUrl) {
    try {
        const api = await SwaggerParser.validate(specUrl);

        const result = {
            type: 'openapi',
            version: api.openapi || api.swagger,
            info: api.info,
            servers: api.servers || [],
            baseUrl: api.basePath || (api.servers && api.servers[0]?.url) || '',
            paths: {},
            schemas: {},
            auth: extractAuthInfo(api)
        };

        // Extract endpoints
        for (const [path, methods] of Object.entries(api.paths || {})) {
            result.paths[path] = {};

            for (const [method, details] of Object.entries(methods)) {
                if (['get', 'post', 'put', 'delete', 'patch'].includes(method)) {
                    result.paths[path][method] = {
                        summary: details.summary,
                        description: details.description,
                        parameters: details.parameters || [],
                        requestBody: details.requestBody,
                        responses: details.responses
                    };
                }
            }
        }

        // Extract schemas
        if (api.components?.schemas) {
            result.schemas = api.components.schemas;
        } else if (api.definitions) {
            result.schemas = api.definitions;
        }

        console.error(`✅ Parsed ${Object.keys(result.paths).length} endpoints`);
        return result;

    } catch (error) {
        throw new Error(`Failed to parse Swagger/OpenAPI: ${error.message}`);
    }
}

/**
 * Parse WSDL specification (basic implementation)
 */
async function parseWSDL(wsdlUrl) {
    try {
        const response = await axios.get(wsdlUrl);
        const wsdlContent = response.data;

        // Basic WSDL parsing (simplified)
        const result = {
            type: 'wsdl',
            url: wsdlUrl,
            services: [],
            note: 'WSDL parsing is simplified. For full WSDL support, use specialized SOAP tools.'
        };

        // Extract service names (very basic regex parsing)
        const serviceMatches = wsdlContent.match(/<wsdl:service[^>]*name="([^"]+)"/g) || [];
        result.services = serviceMatches.map(match => {
            const nameMatch = match.match(/name="([^"]+)"/);
            return nameMatch ? nameMatch[1] : 'Unknown';
        });

        console.error(`✅ Found ${result.services.length} WSDL services`);
        return result;

    } catch (error) {
        throw new Error(`Failed to parse WSDL: ${error.message}`);
    }
}

/**
 * Extract authentication information from OpenAPI spec
 */
function extractAuthInfo(api) {
    const auth = {
        types: [],
        details: {}
    };

    // OpenAPI 3.x
    if (api.components?.securitySchemes) {
        for (const [name, scheme] of Object.entries(api.components.securitySchemes)) {
            auth.types.push(scheme.type);
            auth.details[name] = scheme;
        }
    }

    // Swagger 2.x
    if (api.securityDefinitions) {
        for (const [name, scheme] of Object.entries(api.securityDefinitions)) {
            auth.types.push(scheme.type);
            auth.details[name] = scheme;
        }
    }

    return auth;
}

/**
 * Register the parse_api_spec tool with MCP server
 */
export function registerParseApiSpecTool(server) {
    server.tool(
        'parse_api_spec',
        {
            spec_url: z.string().url().describe('URL to API specification'),
            spec_type: z.enum(['swagger', 'openapi', 'wsdl', 'auto-detect']).optional()
                .describe('Specification type (default: auto-detect)')
        },
        async ({ spec_url, spec_type }) => {
            try {
                const result = await parseApiSpec(spec_url, spec_type || 'auto-detect');

                const summary = [
                    `📄 API Specification Analysis`,
                    '',
                    `**Type:** ${result.type}`,
                    `**Version:** ${result.version || 'N/A'}`,
                    result.info ? `**Title:** ${result.info.title}` : '',
                    result.info ? `**Description:** ${result.info.description || 'N/A'}` : '',
                    '',
                    `**Endpoints:** ${Object.keys(result.paths || {}).length}`,
                    `**Schemas:** ${Object.keys(result.schemas || {}).length}`,
                    `**Auth Types:** ${result.auth?.types.join(', ') || 'None detected'}`,
                    '',
                    `📋 **Full Details:**`,
                    '```json',
                    JSON.stringify(result, null, 2),
                    '```'
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
                        text: `❌ Error parsing API spec: ${error.message}\n\nMake sure the URL points to a valid Swagger/OpenAPI or WSDL specification.`
                    }],
                    isError: true
                };
            }
        }
    );
}
