# MCP-Gov Server

Israeli National Government Data Server for Model Context Protocol (MCP).

## Purpose

MCP-Gov provides access to Israeli national government data, including:
- **data.gov.il** - National open data portal (CKAN)
- **Transport** - Public transport, roads, railways statistics
- **Emergency** - Real-time alerts from Pikud Haoref (Home Front Command)

## Tools (7 total)

### Data.gov.il Tools (5)

#### `find_datasets`
Smart dataset search with sorting and filtering.

**Parameters:**
- `query` (string, required): Search query
- `limit` (number, optional): Max results (default: 10)
- `sort` (enum, optional): Sort by relevance/recent/alphabetical

**Example:**
```
Find datasets about transport in Israel
```

#### `search_records`
Search within dataset records using SQL-like filtering.

**Parameters:**
- `datasetName` (string, required): Dataset identifier
- `query` (string, optional): Search term
- `filters` (object, optional): Field filters
- `limit` (number, optional): Max results

**Example:**
```
Search records in traffic-counts dataset for Tel Aviv
```

#### `discover_tags` / `get_tag_datasets`
Explore topics and find datasets by tag.

**Parameters:**
- `tag` (string, optional): Specific tag to explore

**Example:**
```
Discover available topics in data.gov.il
```

#### `list_organizations`
List government organizations publishing data.

**Example:**
```
Show me which government organizations publish open data
```

#### `get_dataset_info`
Get detailed information about a specific dataset.

**Parameters:**
- `datasetName` (string, required): Dataset identifier

**Example:**
```
Get detailed info about the mechir-lamishtaken dataset
```

---

### Transport Tools (1)

#### `transport_statistics`
Access national transport statistics from data.gov.il.

**Parameters:**
- `category` (enum, optional): all/roads/public-transport/railways/ports/aviation
- `year` (number, optional): Year for statistics

**Example:**
```
Get public transport statistics for 2024
```

---

### Emergency Tools (1)

#### `emergency_alerts`
Get current emergency alerts from Pikud Haoref (Israel Home Front Command).

**Parameters:** None

**Example:**
```
Check current emergency alerts
```

**Note:** Alerts are cached for 5 seconds and updated in real-time from oref.org.il.

---

## Installation

```bash
cd packages/mcp-gov
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

## Claude Desktop Configuration

Add to `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "mcp-gov": {
      "command": "c:\\Work\\MCP\\gov-IL\\data-gov-il-mcp\\packages\\mcp-gov\\start.bat"
    }
  }
}
```

Or create `start.bat`:
```batch
@echo off
cd /d "%~dp0"
node src\server.js
```

## Data Sources

### data.gov.il
- **API:** https://data.gov.il/api/3/action/
- **Type:** CKAN (Comprehensive Knowledge Archive Network)
- **Coverage:** National datasets from all government ministries

### Transport
- **Source:** Ministry of Transport datasets on data.gov.il
- **Coverage:** Roads, public transport, railways, ports, aviation
- **Note:** GTFS and real-time SIRI APIs planned for future versions

### Emergency
- **API:** https://www.oref.org.il/WarningMessages/alert/alerts.json
- **Source:** Pikud Haoref (Home Front Command)
- **Type:** Real-time emergency alerts
- **Coverage:** Rocket alerts, sirens, emergency notifications

## Architecture

```
mcp-gov/
├── src/
│   ├── tools/
│   │   ├── data-gov/       # data.gov.il tools (5)
│   │   ├── transport/      # Transport tools (1)
│   │   └── emergency/      # Emergency tools (1)
│   ├── utils/
│   │   └── api.js          # CKAN API client
│   ├── config/
│   │   └── constants.js    # Configuration
│   └── server.js           # Main server
└── package.json
```

## Examples

### Finding Datasets
```
Find datasets about traffic in Jerusalem
```

### Getting Statistics
```
Get transport statistics for public transportation
```

### Checking Alerts
```
Are there any emergency alerts right now?
```

### Exploring Data
```
What topics are available in Israeli open data?
```

## Future Enhancements

- GTFS real-time parser for public transport schedules
- SIRI API integration for live bus arrivals
- Road traffic data from Netivei Israel
- Railway statistics from Israel Railways
- Additional emergency services integration

## Dependencies

- `@modelcontextprotocol/sdk` ^1.13.0 - MCP framework
- `axios` ^1.9.0 - HTTP client
- `zod` ^3.25.64 - Schema validation

## License

MIT
