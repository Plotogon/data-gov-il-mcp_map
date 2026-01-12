# MCP-Judicial Server

Israeli Court System Data Server for Model Context Protocol (MCP).

**⚠️ IMPORTANT: PUBLIC DATA ONLY**

This server provides **publicly available** court information only. Individual case details require attorney authentication via [Net HaMishpat](https://www.court.gov.il).

## Purpose

MCP-Judicial provides access to Israeli court system data:
- **Court Information** - Locations, contacts, jurisdictions
- **Legal Statistics** - Aggregated, anonymized judicial data
- **Public Information** - Operating hours, departments, fees

## Tools (2 total)

### `get_court_info`
Get information about Israeli courts.

**Parameters:**
- `court_type` (enum, required): supreme | district | magistrate | religious | specialized
- `court_id` (string, optional): Specific court ID (e.g., "tel-aviv-district")

**Example:**
```
Get information about district courts
```

**Returns:**
- Court names (English/Hebrew)
- Locations and addresses
- Websites
- Jurisdiction information
- Public data availability

---

### `get_court_statistics`
Aggregated judicial statistics.

**Parameters:**
- `category` (enum, required): cases-filed | cases-resolved | duration | appeals
- `year` (number, optional): Statistical year

**Example:**
```
Get statistics about cases filed in 2023
```

**Returns:**
- Statistical data by category
- Data source information
- Links to detailed reports

**Note:** Points to data.gov.il and Ministry of Justice publications for detailed statistics.

---

## Court System Structure

### Supreme Court (בית המשפט העליון)
- Highest appellate court
- Jerusalem
- Website: https://elyon.court.gov.il

### District Courts (6 total)
- Jerusalem, Tel Aviv, Haifa, Be'er Sheva, Nazareth, Central
- Major civil and criminal cases
- Appeals from magistrate courts

### Magistrate Courts (30+)
- Most first-instance cases
- Local jurisdictions

### Religious Courts
- Rabbinical (Jewish family law)
- Sharia (Muslim family law)
- Druze, Christian ecclesiastical courts

### Specialized Courts
- Labor Courts (בתי הדין לעבודה)
- Administrative Courts
- Traffic Courts
- Military Courts (restricted access)

---

## Installation

```bash
cd packages/mcp-judicial
npm install
```

## Usage

### Start the server:
```bash
npm start
```

## Claude Desktop Configuration

Add to `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "mcp-judicial": {
      "command": "c:\\Work\\MCP\\gov-IL\\data-gov-il-mcp\\packages\\mcp-judicial\\start.bat"
    }
  }
}
```

---

## Privacy & Security

### What This Server Provides
✅ Court locations and contact information  
✅ Operating hours and departments  
✅ Aggregated, anonymized statistics  
✅ Public court information  

### What This Server Does NOT Provide
❌ Individual case details  
❌ Case party information  
❌ Sealed/confidential cases  
❌ Private hearings  
❌ Personal information  

### Net HaMishpat (Attorney Access)
For case details, use: https://www.court.gov.il

Requires:
- Attorney license
- Authentication
- Compliance with confidentiality rules

---

## Legal Disclaimers

### General Disclaimer
This information is for general informational purposes only and does not constitute legal advice. For official legal information, case details, or legal representation, please consult with a licensed attorney or contact the appropriate court directly.

### Privacy Notice
Individual case details require attorney authentication via Net HaMishpat. This service provides only publicly available information and aggregated statistics.

### Accuracy Notice
Court information is periodically updated but may not reflect the most current data. Always verify with the official court before taking any action.

---

## Examples

### Get District Court Information
```
Show me information about district courts
```

### Get Specific Court Details
```
Get info about Tel Aviv District Court
```

### Get Legal Statistics
```
Show cases filed statistics for 2023
```

### Check Court Types
```
What types of specialized courts exist in Israel?
```

---

## Data Sources

- **Court Websites:** Official court information
- **data.gov.il:** Judicial datasets and statistics
- **Ministry of Justice:** Annual reports and publications
- **Courts Administration:** Organizational data

---

## Future Enhancements

- Published court decisions search
- Court calendar integration (public hearings)
- Fee calculator
- Court forms and procedures guide
- Integration with legal precedent databases

---

## Dependencies

- `@modelcontextprotocol/sdk` ^1.13.0 - MCP framework
- `axios` ^1.9.0 - HTTP client
- `zod` ^3.25.64 - Schema validation

## License

MIT

---

**For Official Legal Information:**
- Courts: https://www.court.gov.il
- Ministry of Justice: https://www.gov.il/he/departments/ministry_of_justice
- Israel Bar Association: https://www.israelbar.org.il
