# MCP-Municipal Server

Israeli Municipal/City Data Server for Model Context Protocol (MCP).

## Purpose

MCP-Municipal provides access to Israeli city and local government data from:
- **Tel Aviv-Yafo** - Comprehensive CKAN open data portal
- **Jerusalem** - Municipal services and decisions 
- **Haifa** - Basic city information

## Tools (3 total)

### `search_city_data`
Search municipal datasets across Israeli cities.

**Parameters:**
- `city` (enum, required): tel-aviv | jerusalem | haifa | all
- `query` (string, required): Search term (Hebrew or English)
- `category` (enum, optional): transport | environment | culture | services | planning

**Example:**
```
Search Tel Aviv for parking data
```

---

### `get_city_events`
Get municipal events and activities.

**Parameters:**
- `city` (enum, required): tel-aviv | jerusalem | haifa
- `category` (enum, optional): culture | sports | education | community

**Example:**
```
Get cultural events in Tel Aviv
```

---

### `get_city_services`
Municipal services information.

**Parameters:**
- `city` (enum, required): tel-aviv | jerusalem | haifa
- `service_type` (enum, optional): waste | water | education | health | all

**Example:**
```
Get waste management services in Jerusalem
```

---

## Installation

```bash
cd packages/mcp-municipal
npm install
```

## Usage

### Start the server:
```bash
npm start
```

### Development mode:
```bash
npm run dev
```

## Claude Desktop Configuration

Add to `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "mcp-municipal": {
      "command": "c:\\Work\\MCP\\gov-IL\\data-gov-il-mcp\\packages\\mcp-municipal\\start.bat"
    }
  }
}
```

## Data Sources

### Tel Aviv Open Data Portal
- **URL:** https://opendata.tel-aviv.gov.il
- **Type:** CKAN API
- **Coverage:** Comprehensive city datasets
- **Categories:** Transport, environment, culture, planning, services

**Available Data:**
- Parking and traffic
- Municipal decisions
- Cultural events
- Building permits
- Public facilities
- Street maintenance

### Jerusalem
- **Source:** Municipal website
- **Type:** Limited structured data
- **Coverage:** Basic services and decisions

### Haifa
- **Source:** Municipal website
- **Type:** Minimal structured data
- **Coverage:** Basic city information

## City Comparison

| Feature | Tel Aviv | Jerusalem | Haifa |
|---------|----------|-----------|-------|
| CKAN API | ✅ Yes | ❌ No | ❌ No |
| Dataset Count | 100+ | Limited | Limited |
| Real-time Data | ✅ Some | ❌ No | ❌ No |
| English Support | ✅ Yes | ✅ Yes | ✅ Yes |
| Hebrew Support | ✅ Yes | ✅ Yes | ✅ Yes |

## Architecture

```
mcp-municipal/
├── src/
│   ├── tools/
│   │   ├── shared/         # Cross-city tools
│   │   │   ├── municipal-search.js
│   │   │   └── city-services.js
│   │   └── tel-aviv/       # Tel Aviv-specific tools
│   │       └── city-events.js
│   ├── utils/
│   │   └── municipal-api.js    # CKAN API client
│   ├── config/
│   │   └── cities.js           # City metadata
│   └── server.js
└── package.json
```

## Examples

### Search Across All Cities
```
Search all cities for environment data
```

### Find Tel Aviv Datasets
```
Search Tel Aviv for parking fines
```

### Get City Events
```
Get sports events in Tel Aviv
```

### Check City Services
```
Get water services information for Jerusalem
```

## Future Enhancements

- Parking fines lookup (Tel Aviv)
- Municipal decisions browser
- Planning applications tracker
- Real-time event updates
- Additional cities (Netanya, Be'er Sheva, Rishon LeZion)
- GIS/mapping integration
- Waste collection schedules
- Building permit tracking

## Dependencies

- `@modelcontextprotocol/sdk` ^1.13.0 - MCP framework
- `axios` ^1.9.0 - HTTP client
- `zod` ^3.25.64 - Schema validation

## Limitations

### Tel Aviv
- ✅ Best coverage
- ✅ CKAN API available
- ⚠️ Some datasets may be outdated

### Jerusalem & Haifa
- ⚠️ Limited API access
- ⚠️ Manual data aggregation needed
- ⚠️ Basic information only

## License

MIT
