/**
 * MCP Schema Generator
 * Generates MCP tool schemas from API analysis results
 */

import { z } from 'zod';

/**
 * Generate MCP tool schema from API analysis
 * @param {Object} apiSpec - Parsed API specification
 * @param {string} toolName - Name for the MCP tool
 * @param {boolean} includeExamples - Include usage examples
 * @returns {Object} MCP tool schema
 */
export function generateMcpSchema(apiSpec, toolName, includeExamples = true) {
    console.error(`🔧 Generating MCP schema for: ${toolName}`);

    const schema = {
        toolName,
        description: apiSpec.info?.description || `Access ${apiSpec.info?.title || 'API'}`,
        version: apiSpec.version,
        baseUrl: apiSpec.baseUrl || apiSpec.servers?.[0]?.url || '',
        authentication: apiSpec.auth,
        endpoints: []
    };

    // Generate endpoint definitions
    for (const [path, methods] of Object.entries(apiSpec.paths || {})) {
        for (const [method, details] of Object.entries(methods)) {
            if (['get', 'post', 'put', 'delete', 'patch'].includes(method)) {
                const endpoint = {
                    path,
                    method: method.toUpperCase(),
                    operationId: details.operationId || `${method}_${path.replace(/\//g, '_')}`,
                    summary: details.summary,
                    parameters: extractParameters(details.parameters || []),
                    requestBody: details.requestBody,
                    responses: details.responses
                };

                schema.endpoints.push(endpoint);
            }
        }
    }

    // Generate Zod schema code
    schema.zodSchema = generateZodSchema(schema.endpoints[0]); // Example for first endpoint

    // Generate MCP tool code template
    schema.mcpToolCode = generateMcpToolCode(toolName, schema);

    if (includeExamples) {
        schema.examples = generateExamples(schema);
    }

    console.error(`✅ Generated schema with ${schema.endpoints.length} endpoints`);
    return schema;
}

/**
 * Extract and format parameters
 */
function extractParameters(parameters) {
    return parameters.map(param => ({
        name: param.name,
        in: param.in, // query, path, header, cookie
        required: param.required || false,
        type: param.schema?.type || param.type || 'string',
        description: param.description
    }));
}

/**
 * Generate Zod schema code
 */
function generateZodSchema(endpoint) {
    if (!endpoint) return '';

    const params = endpoint.parameters || [];
    const zodFields = params.map(param => {
        const zodType = mapTypeToZod(param.type);
        const required = param.required ? '' : '.optional()';
        const description = param.description ? `.describe('${param.description}')` : '';

        return `  ${param.name}: z.${zodType}()${required}${description}`;
    });

    return `{\n${zodFields.join(',\n')}\n}`;
}

/**
 * Map JSON schema types to Zod types
 */
function mapTypeToZod(type) {
    const typeMap = {
        'string': 'string',
        'number': 'number',
        'integer': 'number',
        'boolean': 'boolean',
        'array': 'array',
        'object': 'object'
    };
    return typeMap[type] || 'string';
}

/**
 * Generate MCP tool code template
 */
function generateMcpToolCode(toolName, schema) {
    const firstEndpoint = schema.endpoints[0];
    if (!firstEndpoint) return '';

    return `
/**
 * MCP Tool: ${toolName}
 * ${schema.description}
 */
export function register${capitalize(toolName)}Tool(server) {
  server.tool(
    '${toolName}',
    ${schema.zodSchema},
    async (params) => {
      try {
        // Call API endpoint
        const response = await axios.${firstEndpoint.method.toLowerCase()}(
          '${schema.baseUrl}${firstEndpoint.path}',
          { params }
        );
        
        return {
          content: [{
            type: 'text',
            text: JSON.stringify(response.data, null, 2)
          }]
        };
      } catch (error) {
        return {
          content: [{
            type: 'text',
            text: \`Error: \${error.message}\`
          }],
          isError: true
        };
      }
    }
  );
}
`.trim();
}

/**
 * Generate usage examples
 */
function generateExamples(schema) {
    return schema.endpoints.slice(0, 3).map(endpoint => {
        const params = endpoint.parameters
            .filter(p => p.required)
            .map(p => `${p.name}="${p.name}_value"`)
            .join(', ');

        return `${endpoint.operationId}(${params})`;
    });
}

/**
 * Capitalize first letter
 */
function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Register the generate_mcp_schema tool with MCP server
 */
export function registerGenerateSchemaTool(server) {
    server.tool(
        'generate_mcp_schema',
        {
            api_spec: z.object({}).passthrough().describe('Parsed API specification from parse_api_spec'),
            tool_name: z.string().describe('Name for the MCP tool'),
            include_examples: z.boolean().optional().describe('Include usage examples (default: true)')
        },
        async ({ api_spec, tool_name, include_examples }) => {
            try {
                const schema = generateMcpSchema(api_spec, tool_name, include_examples !== false);

                const summary = [
                    `🔧 MCP Schema Generated: ${tool_name}`,
                    '',
                    `**Endpoints:** ${schema.endpoints.length}`,
                    `**Base URL:** ${schema.baseUrl}`,
                    `**Auth:** ${schema.authentication?.types.join(', ') || 'None'}`,
                    '',
                    `## Generated Zod Schema:`,
                    '```javascript',
                    schema.zodSchema,
                    '```',
                    '',
                    `## MCP Tool Code Template:`,
                    '```javascript',
                    schema.mcpToolCode,
                    '```',
                    '',
                    schema.examples ? `## Usage Examples:\n${schema.examples.map(ex => `- ${ex}`).join('\n')}` : ''
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
                        text: `❌ Error generating schema: ${error.message}`
                    }],
                    isError: true
                };
            }
        }
    );
}
