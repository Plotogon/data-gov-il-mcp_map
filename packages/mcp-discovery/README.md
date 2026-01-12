# MCP-Discovery Server

API reconnaissance and schema generation tool for Israeli government data sources.

## Purpose

MCP-Discovery is a specialized MCP server that analyzes government websites, API documentation, and specifications to automatically generate MCP tool schemas and adapter descriptions. It's your "intelligence engineer" for discovering and documenting APIs.

## Features

### 🔍 Website Analysis
- Crawl government websites to discover APIs
- Detect forms that might represent API endpoints
- Find data download links
- Identify documentation resources

### 📄 API Specification Parsing
- Parse Swagger/OpenAPI specifications
- Parse WSDL (SOAP) specifications
- Auto-detect specification types
- Extract authentication requirements

### 🔧 Schema Generation
- Generate MCP tool definitions from API specs
- Create Zod validation schemas
- Generate code templates for adapters
- Provide usage examples

## Tools

### `analyze_website`
Analyze a government website to discover APIs and data sources.

**Parameters:**
- `url` (string, required): Website URL to analyze
- `depth` (number, optional): Crawl depth 1-3 (default: 1)
- `focus` (enum, optional): What to focus on - `api`, `forms`, `downloads`, or `all` (default: all)

**Example:**
```javascript
analyze_website({
  url: "https://data.gov.il",
  depth: 2,
  focus: "api"
})
```

### `parse_api_spec`
Parse API specification (Swagger/OpenAPI/WSDL).

**Parameters:**
- `spec_url` (string, required): URL to API specification
- `spec_type` (enum, optional): `swagger`, `openapi`, `wsdl`, or `auto-detect` (default: auto-detect)

**Example:**
```javascript
parse_api_spec({
  spec_url: "https://api.example.gov.il/swagger.json",
  spec_type: "openapi"
})
```

### `generate_mcp_schema`
Generate MCP tool schema from parsed API specification.

**Parameters:**
- `api_spec` (object, required): Parsed API specification from `parse_api_spec`
- `tool_name` (string, required): Name for the MCP tool
- `include_examples` (boolean, optional): Include usage examples (default: true)

**Example:**
```javascript
generate_mcp_schema({
  api_spec: { /* result from parse_api_spec */ },
  tool_name: "gov_data_api",
  include_examples: true
})
```

## Installation

```bash
cd packages/mcp-discovery
npm install
```

## Usage

### Start the server:
```bash
npm start
```

### Development mode (with auto-reload):
```bash
npm run dev
```

## Workflow Example

1. **Discover APIs on a website:**
   ```javascript
   analyze_website({ url: "https://www.oref.org.il" })
   ```

2. **Parse API specification:**
   ```javascript
   parse_api_spec({ 
     spec_url: "https://www.oref.org.il/WarningMessages/alert/alerts.json"
   })
   ```

3. **Generate MCP schema:**
   ```javascript
   generate_mcp_schema({
     api_spec: { /* from step 2 */ },
     tool_name: "pikud_haoref_alerts"
   })
   ```

4. **Use generated code** to create new MCP tools in other servers (MCP-Gov, MCP-Municipal, etc.)

## Dependencies

- `@modelcontextprotocol/sdk` - MCP server framework
- `axios` - HTTP client
- `cheerio` - HTML parsing
- `swagger-parser` - OpenAPI/Swagger parsing
- `pdf-parse` - PDF document extraction
- `zod` - Schema validation

## Notes

- **Read-only operations**: This server only analyzes and generates schemas, it doesn't make actual API calls to discovered endpoints
- **No sensitive data**: No credentials or sensitive information is stored
- **Output sanitization**: All generated code is safe and sanitized

## License

MIT
